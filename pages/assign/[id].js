
import React from 'react';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import axios from 'axios';



function renderFinalizedSchedule(obj, depth = 0) {
  // Handle array of rounds
  if (Array.isArray(obj)) {
    return (
      <div style={{ marginLeft: depth * 16 }}>
        {obj.map((item, idx) => (
          <div key={idx} style={{ marginBottom: 24 }}>
            {renderFinalizedSchedule(item, depth)}
          </div>
        ))}
      </div>
    );
  }
  // Handle round object: { label, teams }
  if (obj && typeof obj === 'object' && obj.label && Array.isArray(obj.teams)) {
    return (
      <div style={{ marginBottom: 24, marginLeft: depth * 8 }}>
        <div style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 8 }}>{obj.label}</div>
        {obj.teams.map((team, tIdx) => (
          <div key={tIdx} style={{ marginBottom: 12, marginLeft: 16 }}>
            <div style={{ fontWeight: 'bold', fontSize: 15 }}>{team.label}</div>
            <ul style={{ marginLeft: 16 }}>
              {Array.isArray(team.members)
                ? team.members.map((member, mIdx) => (
                    <li key={mIdx}>{member}</li>
                  ))
                : <li>{team.members}</li>}
            </ul>
          </div>
        ))}
      </div>
    );
  }
  // Fallback for any other object
  if (obj && typeof obj === 'object') {
    return (
      <ul style={{ marginLeft: depth * 16 }}>
        {Object.entries(obj)
          .filter(([key]) => key !== 'audit' && key !== 'pairings')
          .map(([key, value]) => (
            <li key={key} style={{ marginBottom: 4 }}>
              <span style={{ fontWeight: 'bold' }}>{key}:</span> {renderFinalizedSchedule(value, depth + 1)}
            </li>
          ))}
      </ul>
    );
  }
  // Primitive value
  return <span>{String(obj)}</span>;
}



const AssignPlayers = () => {
  const router = useRouter();
  const { id } = router.query;
  const [schedule, setSchedule] = useState(null);
  const [availablePlayers, setAvailablePlayers] = useState([]);
  const [aPlayers, setAPlayers] = useState([]);
  const [bPlayers, setBPlayers] = useState([]);
  const [cPlayers, setCPlayers] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newPlayer, setNewPlayer] = useState('');

  const [finalizedResults, setFinalizedResults] = useState(null);

  useEffect(() => {
    if (!id) return;
    const fetchSchedule = async () => {
      setLoading(true);
      setError(null);
      try {
        const apiUrl = `https://57nxom0eme.execute-api.us-east-1.amazonaws.com/dev/view-schedule/${id}`;
        const response = await axios.get(apiUrl);
        setSchedule(typeof response.data === 'string' ? JSON.parse(response.data) : response.data);
      } catch (err) {
        setError('Schedule not found or error loading schedule.');
      } finally {
        setLoading(false);
      }
    };
    fetchSchedule();
  }, [id]);

  // Move player between columns
  const movePlayer = (playerObj, from, to) => {
    if (from === to) return;
    if (from === 'available') setAvailablePlayers(availablePlayers.filter(p => p.player !== playerObj.player));
    if (from === 'a') setAPlayers(aPlayers.filter(p => p.player !== playerObj.player));
    if (from === 'b') setBPlayers(bPlayers.filter(p => p.player !== playerObj.player));
    if (from === 'c') setCPlayers(cPlayers.filter(p => p.player !== playerObj.player));
    if (to === 'available') setAvailablePlayers([...availablePlayers, playerObj]);
    if (to === 'a') setAPlayers([...aPlayers, playerObj]);
    if (to === 'b') setBPlayers([...bPlayers, playerObj]);
    if (to === 'c') setCPlayers([...cPlayers, playerObj]);
  };

  const renderColumn = (title, players, from) => {
    // Add count to header, and show required if available
    let header = title;
    if (from === 'a') {
      header = `${title} (${players.length}${requiredA !== null ? ` / ${requiredA}` : ''})`;
    } else if (from === 'b') {
      header = `${title} (${players.length}${requiredB !== null ? ` / ${requiredB}` : ''})`;
    } else if (from === 'c') {
      header = `${title} (${players.length}${requiredC !== null ? ` / ${requiredC}` : ''})`;
    } else if (from === 'available') {
      header = `${title} (${players.length})`;
    }
    // Helper to abbreviate first name if needed
    const abbrevName = (fullName) => {
      if (fullName.length <= 12) return fullName;
      const parts = fullName.split(' ');
      if (parts.length < 2) return fullName;
      const [first, ...rest] = parts;
      return `${first.slice(0, 3)}. ${rest.join(' ')}`;
    };
    return (
      <div style={{ flex: 1, margin: 10, minWidth: 180 }}>
        <h3>{header}</h3>
        <ul style={{ minHeight: 120, border: '1px solid #ccc', borderRadius: 4, padding: 8, listStylePosition: 'inside' }}>
          {players.map((playerObj) => (
            <li key={playerObj.player} style={{ marginBottom: 6 }}>
              {abbrevName(playerObj.player)} <span style={{ color: '#888', fontSize: 12 }}>({playerObj.previousRank})</span>
              <div style={{ float: 'right' }}>
                {from !== 'available' && (
                  <button onClick={() => movePlayer(playerObj, from, 'available')}>→ Available</button>
                )}
                {from !== 'a' && (
                  <button onClick={() => movePlayer(playerObj, from, 'a')}>→ A</button>
                )}
                {from !== 'b' && (
                  <button onClick={() => movePlayer(playerObj, from, 'b')}>→ B</button>
                )}
                {from !== 'c' && (
                  <button onClick={() => movePlayer(playerObj, from, 'c')}>→ C</button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  // Helper to count players by rank
  const countByRank = (players, rank) => players.filter(p => p.previousRank === rank).length;

  // Always calculate required numbers from schedule if available
  let requiredA = null, requiredB = null, requiredC = null;
  if (schedule) {
    // If schedule has aPlayers and totalPlayers, use those
    if (schedule.aPlayers && schedule.totalPlayers) {
      requiredA = schedule.aPlayers;
      requiredC = schedule.aPlayers;
      requiredB = schedule.totalPlayers - (schedule.aPlayers * 2);
    } else if (schedule.requiredPlayers) {
      // fallback for legacy
      requiredA = schedule.requiredPlayers.A;
      requiredB = schedule.requiredPlayers.B;
      requiredC = schedule.requiredPlayers.C;
    }
  }

  // Current selected counts
  const selectedA = aPlayers.length;
  const selectedB = bPlayers.length;
  const selectedC = cPlayers.length;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Assign Players to Schedule</h1>
        <button
          style={{ fontWeight: 'bold', fontSize: 16, padding: '10px 24px', marginLeft: 16 }}
          onClick={async () => {
            setError(null);
            try {
              const payload = {
                a: aPlayers,
                b: bPlayers,
                c: cPlayers
              };
              const response = await axios.post(
                `https://57nxom0eme.execute-api.us-east-1.amazonaws.com/dev/finalize-schedule/${id}`,
                payload
              );
              setFinalizedResults(response.data);
              // Redirect to finalized schedule page
              router.push(`/finalized/${id}`);
            } catch (err) {
              let msg = 'Error finalizing schedule.';
              if (err.response && err.response.data) {
                if (typeof err.response.data === 'string') {
                  msg += ' ' + err.response.data;
                } else if (err.response.data.body) {
                  msg += ' ' + err.response.data.body;
                }
              } else if (err.message) {
                msg += ' ' + err.message;
              }
              setError(msg);
            }
          }}
        >
          Finalize Assignments
        </button>
      </div>
      <div style={{ marginBottom: 16 }}>
        <button
          style={{ marginRight: 8 }}
          onClick={async () => {
            try {
              const response = await axios.get('https://57nxom0eme.execute-api.us-east-1.amazonaws.com/dev/roster/goodland');
              const roster = typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
              setAvailablePlayers(roster);
              setAPlayers([]);
              setBPlayers([]);
              setCPlayers([]);
              setError(null);
            } catch (err) {
              setError('Could not load Goodland roster.');
            }
          }}
        >
          Load Goodland Roster
        </button>
        <button
          onClick={() => {
            setError('Floodwood roster coming soon!');
          }}
        >
          Load Floodwood Roster
        </button>
      </div>
      {loading && <p>Loading schedule...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <div style={{ margin: '20px 0' }}>
        <input
          type="text"
          value={newPlayer}
          onChange={e => setNewPlayer(e.target.value)}
          placeholder="Add new player"
          style={{ marginRight: 8 }}
        />
        <select id="newPlayerRank" style={{ marginRight: 8 }} defaultValue="A">
          <option value="A">A</option>
          <option value="B">B</option>
          <option value="C">C</option>
        </select>
        <button
          onClick={() => {
            const name = newPlayer.trim();
            const rank = document.getElementById('newPlayerRank').value;
            if (
              name &&
              !availablePlayers.some(p => p.player === name) &&
              !aPlayers.some(p => p.player === name) &&
              !bPlayers.some(p => p.player === name) &&
              !cPlayers.some(p => p.player === name)
            ) {
              setAvailablePlayers([...availablePlayers, { player: name, previousRank: rank }]);
              setNewPlayer('');
              document.getElementById('newPlayerRank').value = 'A';
            }
          }}
          disabled={
            !newPlayer.trim() ||
            availablePlayers.some(p => p.player === newPlayer.trim()) ||
            aPlayers.some(p => p.player === newPlayer.trim()) ||
            bPlayers.some(p => p.player === newPlayer.trim()) ||
            cPlayers.some(p => p.player === newPlayer.trim())
          }
        >
          Add Player
        </button>
      </div>
      {/* Removed summary counts above columns; counts now only in section headers */}
      <div style={{ display: 'flex', flexDirection: 'row', marginTop: 8 }}>
        {renderColumn('Available Players', availablePlayers, 'available')}
        {renderColumn('A Players', aPlayers, 'a')}
        {renderColumn('B Players', bPlayers, 'b')}
        {renderColumn('C Players', cPlayers, 'c')}
      </div>



      {/* Show link to finalized schedule after finalizing */}
      {finalizedResults && (
        <div style={{ marginTop: 32 }}>
          <h2>Finalized Schedule Saved</h2>
          <p>
            <a href={`/finalized/${id}`} style={{ fontWeight: 'bold', fontSize: 18, color: '#1976d2' }}>
              View Finalized Schedule
            </a>
          </p>
        </div>
      )}
    </div>
  );
};

export default AssignPlayers;
