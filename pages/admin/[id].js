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
  const [withdrawnPlayers, setWithdrawnPlayers] = useState(new Set());
  const [activeTab, setActiveTab] = useState('scores'); // 'scores', 'withdrawals', or 'movements'
  const [selectedPlayer, setSelectedPlayer] = useState('');
  const [selectedFromTeam, setSelectedFromTeam] = useState('');
  const [selectedToTeam, setSelectedToTeam] = useState('');
  const [selectedMoveRound, setSelectedMoveRound] = useState('');

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
        
        // Load withdrawn players if they exist
        if (scoresRes.data.withdrawnPlayers) {
          setWithdrawnPlayers(new Set(scoresRes.data.withdrawnPlayers));
        }
        
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

  const handlePlayerWithdraw = (playerName) => {
    setWithdrawnPlayers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(playerName)) {
        newSet.delete(playerName); // Restore player
      } else {
        newSet.add(playerName); // Withdraw player
      }
      return newSet;
    });
  };

  const saveWithdrawals = async () => {
    setSaving(true);
    setMessage('');
    try {
      await axios.post(`https://57nxom0eme.execute-api.us-east-1.amazonaws.com/dev/save-withdrawals/${id}`, {
        withdrawnPlayers: Array.from(withdrawnPlayers)
      });
      setMessage('Withdrawals saved!');
    } catch (err) {
      setMessage('Error saving withdrawals.');
    }
    setSaving(false);
  };

  const handleMovePlayer = async () => {
    if (!selectedPlayer || !selectedFromTeam || !selectedToTeam || !selectedMoveRound) {
      setMessage('Please select all fields for player movement.');
      return;
    }

    if (selectedFromTeam === selectedToTeam) {
      setMessage('Cannot move player to the same team.');
      return;
    }

    setSaving(true);
    setMessage('');
    
    try {
      console.log('Moving player:', {
        player: selectedPlayer,
        from: selectedFromTeam,
        to: selectedToTeam,
        round: selectedMoveRound
      });
      
      const moveRequest = {
        round: selectedMoveRound,
        playerName: selectedPlayer,
        fromTeam: selectedFromTeam,
        toTeam: selectedToTeam
      };
      
      console.log('Sending move request:', moveRequest);
      console.log('API URL:', `https://57nxom0eme.execute-api.us-east-1.amazonaws.com/dev/move-player/${id}`);
      
      // Send move request to backend
      const response = await axios.post(`https://57nxom0eme.execute-api.us-east-1.amazonaws.com/dev/move-player/${id}`, moveRequest, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 30000 // 30 second timeout
      });
      
      console.log('Move response:', response);
      
      // If successful, reload the schedule data
      const scheduleRes = await axios.get(`https://57nxom0eme.execute-api.us-east-1.amazonaws.com/dev/view-finalized-schedule/${id}`);
      if (scheduleRes) {
        const scheduleData = typeof scheduleRes.data === 'string' ? JSON.parse(scheduleRes.data) : scheduleRes.data;
        setSchedule(scheduleData);
      }
      
      setMessage(`Successfully moved ${selectedPlayer} from ${teamNames[selectedMoveRound]?.[selectedFromTeam] || selectedFromTeam} to ${teamNames[selectedMoveRound]?.[selectedToTeam] || selectedToTeam}!`);
      
      // Reset selections
      setSelectedPlayer('');
      setSelectedFromTeam('');
      setSelectedToTeam('');
      
    } catch (err) {
      console.error('Error moving player:', err);
      console.error('Error response:', err.response);
      console.error('Error request:', err.request);
      console.error('Error config:', err.config);
      
      let errorMessage = 'Error moving player';
      
      if (err.response) {
        // Server responded with error status
        console.error('Response data:', err.response.data);
        console.error('Response status:', err.response.status);
        errorMessage = `Error ${err.response.status}: ${err.response.data?.message || err.response.statusText}`;
      } else if (err.request) {
        // Request was made but no response received
        console.error('No response received:', err.request);
        errorMessage = 'Network Error: No response from server. Check if the API endpoint exists.';
      } else {
        // Something else happened
        console.error('Request setup error:', err.message);
        errorMessage = `Request Error: ${err.message}`;
      }
      
      setMessage(errorMessage);
    }
    
    setSaving(false);
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
      
      {/* Main Tab Navigation */}
      <div style={{ marginBottom: 24, borderBottom: '2px solid #eee' }}>
        <button
          onClick={() => setActiveTab('scores')}
          style={{
            marginRight: 8,
            padding: '8px 20px',
            fontWeight: activeTab === 'scores' ? 'bold' : 'normal',
            background: activeTab === 'scores' ? '#1976d2' : 'transparent',
            color: activeTab === 'scores' ? '#fff' : '#1976d2',
            border: activeTab === 'scores' ? 'none' : '2px solid #1976d2',
            borderBottom: activeTab === 'scores' ? 'none' : '2px solid #1976d2',
            borderRadius: '8px 8px 0 0',
            cursor: 'pointer',
            fontSize: 16
          }}
        >
          Score Management
        </button>
        <button
          onClick={() => setActiveTab('withdrawals')}
          style={{
            marginRight: 8,
            padding: '8px 20px',
            fontWeight: activeTab === 'withdrawals' ? 'bold' : 'normal',
            background: activeTab === 'withdrawals' ? '#d32f2f' : 'transparent',
            color: activeTab === 'withdrawals' ? '#fff' : '#d32f2f',
            border: activeTab === 'withdrawals' ? 'none' : '2px solid #d32f2f',
            borderBottom: activeTab === 'withdrawals' ? 'none' : '2px solid #d32f2f',
            borderRadius: '8px 8px 0 0',
            cursor: 'pointer',
            fontSize: 16
          }}
        >
          Player Withdrawals
        </button>
        <button
          onClick={() => setActiveTab('movements')}
          style={{
            padding: '8px 20px',
            fontWeight: activeTab === 'movements' ? 'bold' : 'normal',
            background: activeTab === 'movements' ? '#ff9800' : 'transparent',
            color: activeTab === 'movements' ? '#fff' : '#ff9800',
            border: activeTab === 'movements' ? 'none' : '2px solid #ff9800',
            borderBottom: activeTab === 'movements' ? 'none' : '2px solid #ff9800',
            borderRadius: '8px 8px 0 0',
            cursor: 'pointer',
            fontSize: 16
          }}
        >
          Player Movements
        </button>
      </div>

      {activeTab === 'scores' && (
        <div>
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
      )}

      {activeTab === 'withdrawals' && (
        <div style={{ border: '1px solid #eee', borderRadius: 8, padding: 16, background: '#f9f9f9' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h2 style={{ margin: 0, color: '#d32f2f' }}>Player Withdrawals</h2>
            <button 
              onClick={saveWithdrawals} 
              disabled={saving}
              style={{
                padding: '8px 16px',
                background: '#d32f2f',
                color: '#fff',
                border: 'none',
                borderRadius: 4,
                cursor: saving ? 'not-allowed' : 'pointer',
                fontSize: 14
              }}
            >
              {saving ? 'Saving...' : 'Save Withdrawals'}
            </button>
          </div>
          <p style={{ marginBottom: 16, color: '#666' }}>
            Click on players to withdraw them from the tournament. Withdrawn players will appear with strikethrough on the leaderboard.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {/* Get all unique players from all rounds */}
            {[...new Set(
              Object.values(schedule).flat().flatMap(teamObj => 
                Object.values(teamObj).map(player => {
                  // Handle different player data types
                  let playerString;
                  if (typeof player === 'string') {
                    playerString = player;
                  } else if (player && typeof player === 'object' && player.player) {
                    // Handle player objects with .player property
                    playerString = player.player;
                  } else if (player && typeof player === 'object' && player.name) {
                    // Handle player objects with .name property
                    playerString = player.name;
                  } else {
                    // Skip invalid player data
                    return null;
                  }
                  
                  // Extract clean name from player string
                  const match = playerString.match(/\(([^)]+)\)$/);
                  return match ? match[1] : playerString;
                })
              ).filter(Boolean) // Remove null values
            )].sort().map(playerName => {
              const isWithdrawn = withdrawnPlayers.has(playerName);
              return (
                <button
                  key={playerName}
                  onClick={() => handlePlayerWithdraw(playerName)}
                  style={{
                    padding: '8px 12px',
                    background: isWithdrawn ? '#d32f2f' : '#e0e0e0',
                    color: isWithdrawn ? '#fff' : '#222',
                    border: 'none',
                    borderRadius: 4,
                    cursor: 'pointer',
                    fontSize: 14,
                    textDecoration: isWithdrawn ? 'line-through' : 'none',
                    fontWeight: isWithdrawn ? 'bold' : 'normal'
                  }}
                >
                  {playerName} {isWithdrawn ? '(WD)' : ''}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'movements' && (
        <div style={{ border: '1px solid #eee', borderRadius: 8, padding: 16, background: '#fff8e1' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h2 style={{ margin: 0, color: '#ff9800' }}>Player Movements</h2>
            <button 
              onClick={handleMovePlayer} 
              disabled={saving || !selectedPlayer || !selectedFromTeam || !selectedToTeam || !selectedMoveRound}
              style={{
                padding: '8px 16px',
                background: (!selectedPlayer || !selectedFromTeam || !selectedToTeam || !selectedMoveRound || saving) ? '#ccc' : '#ff9800',
                color: '#fff',
                border: 'none',
                borderRadius: 4,
                cursor: (!selectedPlayer || !selectedFromTeam || !selectedToTeam || !selectedMoveRound || saving) ? 'not-allowed' : 'pointer',
                fontSize: 14
              }}
            >
              {saving ? 'Moving...' : 'Move Player'}
            </button>
          </div>
          <p style={{ marginBottom: 16, color: '#666' }}>
            Move a player from one team to another within a round. Select the round, player, source team, and destination team.
          </p>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>Round:</label>
              <select 
                value={selectedMoveRound} 
                onChange={(e) => {
                  setSelectedMoveRound(e.target.value);
                  setSelectedPlayer('');
                  setSelectedFromTeam('');
                  setSelectedToTeam('');
                }}
                style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ccc' }}
              >
                <option value="">Select Round</option>
                {Object.keys(schedule || {}).filter(key => /^round/i.test(key)).map(round => (
                  <option key={round} value={round}>
                    {round.replace(/^round/i, 'Round ')}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>Player:</label>
              <select 
                value={selectedPlayer} 
                onChange={(e) => setSelectedPlayer(e.target.value)}
                disabled={!selectedMoveRound}
                style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ccc' }}
              >
                <option value="">Select Player</option>
                {selectedMoveRound && [...new Set(
                  schedule[selectedMoveRound]?.flatMap(teamObj => 
                    Object.values(teamObj).map(player => {
                      const playerString = typeof player === 'string' ? player : 
                                          (player?.player || player?.name || '');
                      const match = playerString.match(/\(([^)]+)\)$/);
                      return match ? match[1] : playerString;
                    })
                  ).filter(Boolean) || []
                )].sort().map(playerName => (
                  <option key={playerName} value={playerName}>
                    {playerName}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>From Team:</label>
              <select 
                value={selectedFromTeam} 
                onChange={(e) => setSelectedFromTeam(e.target.value)}
                disabled={!selectedPlayer || !selectedMoveRound}
                style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ccc' }}
              >
                <option value="">Select Source Team</option>
                {selectedMoveRound && schedule[selectedMoveRound]?.map((teamObj, idx) => {
                  const teamKey = `team${idx + 1}`;
                  const teamDisplayName = teamNames[selectedMoveRound]?.[teamKey] || teamKey;
                  
                  // Check if selected player is in this team
                  const hasPlayer = Object.values(teamObj).some(player => {
                    const playerString = typeof player === 'string' ? player : 
                                        (player?.player || player?.name || '');
                    const match = playerString.match(/\(([^)]+)\)$/);
                    const cleanName = match ? match[1] : playerString;
                    return cleanName === selectedPlayer;
                  });
                  
                  if (!hasPlayer) return null;
                  
                  return (
                    <option key={teamKey} value={teamKey}>
                      {teamDisplayName}
                    </option>
                  );
                })}
              </select>
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>To Team:</label>
              <select 
                value={selectedToTeam} 
                onChange={(e) => setSelectedToTeam(e.target.value)}
                disabled={!selectedFromTeam || !selectedMoveRound}
                style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ccc' }}
              >
                <option value="">Select Destination Team</option>
                {selectedMoveRound && schedule[selectedMoveRound]?.map((teamObj, idx) => {
                  const teamKey = `team${idx + 1}`;
                  const teamDisplayName = teamNames[selectedMoveRound]?.[teamKey] || teamKey;
                  
                  // Don't show the source team as an option
                  if (teamKey === selectedFromTeam) return null;
                  
                  return (
                    <option key={teamKey} value={teamKey}>
                      {teamDisplayName}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminScoresPage;
