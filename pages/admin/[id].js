import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';

const AdminScoresPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const [schedule, setSchedule] = useState(null);
  const [scores, setScores] = useState({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [selectedRoundIdx, setSelectedRoundIdx] = useState(0);

  useEffect(() => {
    if (!id) return;
    
    // Fetch both finalized schedule and existing scores
    Promise.all([
      axios.get(`https://57nxom0eme.execute-api.us-east-1.amazonaws.com/dev/view-finalized-schedule/${id}`).catch(() => null),
      axios.get(`https://57nxom0eme.execute-api.us-east-1.amazonaws.com/dev/get-scores/${id}`).catch(() => null)
    ]).then(([scheduleRes, scoresRes]) => {
      if (scheduleRes) {
        const scheduleData = typeof scheduleRes.data === 'string' ? JSON.parse(scheduleRes.data) : scheduleRes.data;
        setSchedule(scheduleData);
      } else {
        setMessage('Could not load schedule.');
      }
      
      if (scoresRes && scoresRes.data && scoresRes.data.rounds) {
        // Convert existing scores to the format expected by the admin form
        const existingScores = {};
        Object.keys(scoresRes.data.rounds).forEach(round => {
          existingScores[round] = {};
          Object.entries(scoresRes.data.rounds[round]).forEach(([teamKey, teamData]) => {
            existingScores[round][teamKey] = teamData.score || '';
          });
        });
        setScores(existingScores);
        setMessage('Loaded existing scores.');
      }
    });
  }, [id]);

  const handleScoreChange = (round, team, value) => {
    setScores(prev => ({
      ...prev,
      [round]: {
        ...prev[round],
        [team]: value
      }
    }));
  };

  const handleSave = async (round) => {
    if (!scores[round]) return;
    setSaving(true);
    setMessage('');
    // Build teamScores object for backend
    const teamScores = {};
    const teams = schedule[round];
    teams.forEach((teamObj, idx) => {
      const teamKey = `team${idx + 1}`;
      teamScores[teamKey] = {
        score: Number(scores[round][teamKey]),
        players: Object.values(teamObj)
      };
    });
    try {
      await axios.post(`https://57nxom0eme.execute-api.us-east-1.amazonaws.com/dev/save-scores/${id}`, {
        round,
        teamScores
      });
      setMessage(`Scores for ${round} saved!`);
    } catch (err) {
      setMessage('Error saving scores.');
    }
    setSaving(false);
  };

  if (!schedule) return <div>Loading schedule...</div>;
  const roundKeys = Object.keys(schedule).filter(k => /^round/i.test(k));
  const selectedRound = roundKeys[selectedRoundIdx];

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 32 }}>
      <h1>Admin: Enter Team Scores</h1>
      {message && <div style={{ color: message.includes('Error') ? 'red' : 'green', marginBottom: 16 }}>{message}</div>}
      <div style={{ marginBottom: 24 }}>
        {roundKeys.map((round, idx) => (
          <button
            key={round}
            onClick={() => setSelectedRoundIdx(idx)}
            style={{
              marginRight: 8,
              padding: '6px 16px',
              fontWeight: selectedRoundIdx === idx ? 'bold' : 'normal',
              background: selectedRoundIdx === idx ? '#1976d2' : '#eee',
              color: selectedRoundIdx === idx ? '#fff' : '#222',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer',
            }}
          >
            {round.replace(/^round/i, 'Round ')}
          </button>
        ))}
      </div>
      <div style={{ border: '1px solid #eee', borderRadius: 8, padding: 16 }}>
        <h2 style={{ marginBottom: 12 }}>{selectedRound.replace(/^round/i, 'Round ')}</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
          {schedule[selectedRound].map((teamObj, idx) => {
            const teamKey = `team${idx + 1}`;
            return (
              <div key={teamKey} style={{ flex: '1 1 45%', minWidth: 260, maxWidth: '48%', background: '#fafafa', border: '1px solid #ddd', borderRadius: 6, padding: 12 }}>
                <div style={{ fontWeight: 'bold', marginBottom: 6 }}>{teamKey}</div>
                <ul style={{ marginLeft: 16 }}>
                  {Object.values(teamObj).map((name, i) => <li key={i}>{name}</li>)}
                </ul>
                <input
                  type="number"
                  placeholder="Team Score"
                  value={scores[selectedRound]?.[teamKey] || ''}
                  onChange={e => handleScoreChange(selectedRound, teamKey, e.target.value)}
                  style={{ width: 100, marginTop: 8 }}
                />
              </div>
            );
          })}
        </div>
        <button onClick={() => handleSave(selectedRound)} disabled={saving} style={{ marginTop: 16, padding: '8px 24px', fontWeight: 'bold' }}>Save {selectedRound} Scores</button>
      </div>
    </div>
  );
};

export default AdminScoresPage;
