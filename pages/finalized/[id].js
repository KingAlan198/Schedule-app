import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';


function renderRound(roundObj) {
  if (!roundObj || typeof roundObj !== 'object' || !roundObj.label || !Array.isArray(roundObj.teams)) return null;
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 8 }}>{roundObj.label}</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
        {roundObj.teams.map((team, tIdx) => (
          <div
            key={tIdx}
            style={{
              flex: '1 1 45%',
              minWidth: 260,
              maxWidth: '48%',
              background: '#fff',
              marginBottom: 16,
              marginLeft: 0,
              border: '1px solid #eee',
              borderRadius: 6,
              padding: 12,
              boxSizing: 'border-box',
            }}
          >
            <div style={{ fontWeight: 'bold', fontSize: 15, marginBottom: 6 }}>{team.label}</div>
            <ul style={{ marginLeft: 16, marginBottom: 0 }}>
              {Array.isArray(team.members)
                ? team.members.map((member, mIdx) => (
                    <li key={mIdx}>{member}</li>
                  ))
                : <li>{team.members}</li>}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

const FinalizedSchedulePage = () => {
  const router = useRouter();
  const { id } = router.query;

  const [finalized, setFinalized] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rounds, setRounds] = useState([]);
  const [selectedRound, setSelectedRound] = useState(0);


  useEffect(() => {
    if (!id) return;
    const fetchFinalized = async () => {
      setLoading(true);
      setError(null);
      try {
        const apiUrl = `https://57nxom0eme.execute-api.us-east-1.amazonaws.com/dev/view-finalized-schedule/${id}`;
        const response = await axios.get(apiUrl);
        const data = typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
        setFinalized(data);
        // Extract rounds robustly
        console.log('Loaded finalized schedule:', data);
        let roundsArr = [];
        try {
          roundsArr = Object.entries(data)
            .filter(([k, v]) => /^round/i.test(k))
            .map(([k, v]) => ({
              label: k.replace(/^round/i, 'Round '),
              teams: Array.isArray(v)
                ? v.map((teamObj, idx) => ({
                    label: `Team ${idx + 1}`,
                    members: Object.values(teamObj)
                  }))
                : []
            }));
        } catch (err) {
          console.error('Error processing finalized schedule:', err);
        }
        setRounds(roundsArr);
      } catch (err) {
        setError('Could not load finalized schedule.');
      } finally {
        setLoading(false);
      }
    };
    fetchFinalized();
  }, [id]);

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: 32 }}>
      <h1>Finalized Schedule</h1>
      {loading && <p>Loading...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {rounds.length > 0 ? (
        <div style={{ background: '#f8f8f8', padding: 16, borderRadius: 6, overflowX: 'auto' }}>
          <div style={{ marginBottom: 24 }}>
            {rounds.map((round, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedRound(idx)}
                style={{
                  marginRight: 8,
                  padding: '6px 16px',
                  fontWeight: selectedRound === idx ? 'bold' : 'normal',
                  background: selectedRound === idx ? '#1976d2' : '#eee',
                  color: selectedRound === idx ? '#fff' : '#222',
                  border: 'none',
                  borderRadius: 4,
                  cursor: 'pointer',
                }}
              >
                {round.label || `Round ${idx + 1}`}
              </button>
            ))}
          </div>
          {renderRound(rounds[selectedRound])}
        </div>
      ) : finalized && finalized.label && Array.isArray(finalized.teams) ? (
        <div style={{ background: '#f8f8f8', padding: 16, borderRadius: 6, overflowX: 'auto' }}>
          {renderRound(finalized)}
        </div>
      ) : !loading && !error && (
        <div style={{ marginTop: 32, color: '#888' }}>No schedule data found.</div>
      )}
    </div>
  );
};

export default FinalizedSchedulePage;
