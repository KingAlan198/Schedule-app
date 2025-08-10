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
  const [teamNames, setTeamNames] = useState({});
  const [showQR, setShowQR] = useState(false);

  useEffect(() => {
    if (!id) return;
    
    console.log('Admin page loading data for tournament ID:', id);
    
    // Fetch both finalized schedule and existing scores
    Promise.all([
      axios.get(`https://57nxom0eme.execute-api.us-east-1.amazonaws.com/dev/view-finalized-schedule/${id}`).catch(() => null),
      axios.get(`https://57nxom0eme.execute-api.us-east-1.amazonaws.com/dev/get-scores/${id}`).catch(() => null)
    ]).then(([scheduleRes, scoresRes]) => {
      console.log('Schedule response:', scheduleRes?.data);
      console.log('Scores response:', scoresRes?.data);
      
      if (scheduleRes) {
        const scheduleData = typeof scheduleRes.data === 'string' ? JSON.parse(scheduleRes.data) : scheduleRes.data;
        setSchedule(scheduleData);
        
        // Initialize team names based on round conventions
        const initialTeamNames = {};
        Object.keys(scheduleData).forEach(round => {
          if (/^round/i.test(round)) {
            initialTeamNames[round] = {};
            scheduleData[round].forEach((teamObj, idx) => {
              const teamKey = `team${idx + 1}`;
              // Generate default team names based on round
              const roundNum = parseInt(round.replace(/^round/i, ''));
              let defaultName;
              
              if (roundNum % 2 === 1) { // Odd rounds (1, 3): 1a, 1b, 2a, 2b
                const groupNum = Math.floor(idx / 2) + 1;
                const suffix = idx % 2 === 0 ? 'a' : 'b';
                defaultName = `${groupNum}${suffix}`;
              } else { // Even rounds (2, 4): 10a, 10b, 11a, 11b
                const groupNum = Math.floor(idx / 2) + 10;
                const suffix = idx % 2 === 0 ? 'a' : 'b';
                defaultName = `${groupNum}${suffix}`;
              }
              
              initialTeamNames[round][teamKey] = defaultName;
            });
          }
        });
        setTeamNames(initialTeamNames);
      } else {
        setMessage('Could not load schedule.');
      }
      
      if (scoresRes && scoresRes.data && scoresRes.data.rounds) {
        console.log('Processing existing scores for tournament:', id);
        // Convert existing scores to the format expected by the admin form
        const existingScores = {};
        const existingTeamNames = {};
        
        Object.keys(scoresRes.data.rounds).forEach(round => {
          existingScores[round] = {};
          existingTeamNames[round] = {};
          Object.entries(scoresRes.data.rounds[round]).forEach(([teamKey, teamData]) => {
            existingScores[round][teamKey] = teamData.score || '';
            if (teamData.teamName) {
              existingTeamNames[round][teamKey] = teamData.teamName;
            }
          });
        });
        
        setScores(existingScores);
        // Merge existing team names with generated ones
        setTeamNames(prev => {
          const merged = { ...prev };
          Object.keys(existingTeamNames).forEach(round => {
            merged[round] = { ...merged[round], ...existingTeamNames[round] };
          });
          return merged;
        });
        setMessage(`Loaded existing scores for tournament ${id}.`);
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

  const handleTeamNameChange = (round, team, newName) => {
    setTeamNames(prev => ({
      ...prev,
      [round]: {
        ...prev[round],
        [team]: newName
      }
    }));
  };

  const handleSave = async (round) => {
    setSaving(true);
    setMessage('');
    // Build teamScores object for backend
    const teamScores = {};
    const teams = schedule[round];
    teams.forEach((teamObj, idx) => {
      const teamKey = `team${idx + 1}`;
      const scoreValue = scores[round]?.[teamKey];
      teamScores[teamKey] = {
        score: scoreValue ? Number(scoreValue) : null, // Allow null scores
        players: Object.values(teamObj),
        teamName: teamNames[round]?.[teamKey] || teamKey // Include custom team name
      };
    });
    try {
      await axios.post(`https://57nxom0eme.execute-api.us-east-1.amazonaws.com/dev/save-scores/${id}`, {
        round,
        teamScores
      });
      setMessage(`Data for ${round} saved!`);
    } catch (err) {
      setMessage('Error saving data.');
    }
    setSaving(false);
  };

  if (!schedule) return <div>Loading schedule...</div>;
  const roundKeys = Object.keys(schedule).filter(k => /^round/i.test(k));
  const selectedRound = roundKeys[selectedRoundIdx];

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 32 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ margin: 0 }}>Admin: Enter Team Scores</h1>
        <button 
          onClick={() => setShowQR(!showQR)}
          style={{
            padding: '8px 16px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer',
            fontSize: 14
          }}
        >
          {showQR ? 'Hide QR' : 'Share QR'}
        </button>
      </div>
      
      {showQR && (
        <div style={{ 
          textAlign: 'center', 
          marginBottom: 24, 
          padding: 16, 
          border: '1px solid #ddd', 
          borderRadius: 8,
          backgroundColor: '#f9f9f9'
        }}>
          <p style={{ margin: '0 0 12px 0', fontSize: 14 }}>Scan to share this admin page:</p>
          <img 
            src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(window.location.href)}`}
            alt="QR Code for admin page"
            style={{ border: '1px solid #ccc' }}
          />
        </div>
      )}
      
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
            const displayName = teamNames[selectedRound]?.[teamKey] || teamKey;
            return (
              <div key={teamKey} style={{ flex: '1 1 45%', minWidth: 260, maxWidth: '48%', background: '#fafafa', border: '1px solid #ddd', borderRadius: 6, padding: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontWeight: 'bold', marginRight: 8 }}>Team:</span>
                  <input
                    type="text"
                    value={displayName}
                    onChange={e => handleTeamNameChange(selectedRound, teamKey, e.target.value)}
                    style={{ 
                      fontWeight: 'bold',
                      border: '1px solid #ccc',
                      borderRadius: 3,
                      padding: '2px 6px',
                      fontSize: 14,
                      width: 60
                    }}
                  />
                </div>
                <ul style={{ marginLeft: 16 }}>
                  {Object.values(teamObj).map((name, i) => {
                    const playerName = (() => {
                      const match = name.match(/\(([^)]+)\)$/);
                      return match ? match[1] : name;
                    })();
                    return <li key={i}>{playerName}</li>;
                  })}
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
        <button onClick={() => handleSave(selectedRound)} disabled={saving} style={{ marginTop: 16, padding: '8px 24px', fontWeight: 'bold' }}>Save {selectedRound} Data</button>
      </div>
    </div>
  );
};

export default AdminScoresPage;
