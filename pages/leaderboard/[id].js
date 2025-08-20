import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';

const LeaderboardPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const [scores, setScores] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('individual');
  const [finalizedSchedule, setFinalizedSchedule] = useState(null);
  const [showQR, setShowQR] = useState(false);
  const [withdrawnPlayers, setWithdrawnPlayers] = useState(new Set());

  // Get the current page URL for QR code
  const getPageUrl = () => {
    if (typeof window !== 'undefined') {
      return window.location.href;
    }
    return '';
  };

  useEffect(() => {
    if (!id) return;
    fetchData();
  }, [id]);

  const fetchData = () => {
    setLoading(true);
    setError(null);
    
    // Load both scores and finalized schedule
    Promise.all([
      axios.get(`https://57nxom0eme.execute-api.us-east-1.amazonaws.com/dev/get-scores/${id}`).catch(() => null),
      axios.get(`https://57nxom0eme.execute-api.us-east-1.amazonaws.com/dev/view-finalized-schedule/${id}`).catch(() => null)
    ]).then(([scoresRes, scheduleRes]) => {
      if (scoresRes) {
        setScores(scoresRes.data);
        // Load withdrawn players if they exist
        if (scoresRes.data.withdrawnPlayers) {
          setWithdrawnPlayers(new Set(scoresRes.data.withdrawnPlayers));
        }
      }
      if (scheduleRes) {
        const scheduleData = typeof scheduleRes.data === 'string' ? JSON.parse(scheduleRes.data) : scheduleRes.data;
        setFinalizedSchedule(scheduleData);
      }
      setLoading(false);
    }).catch(() => {
      setError('Could not load leaderboard.');
      setLoading(false);
    });
  };

  const handleRefresh = () => {
    fetchData();
  };

  if (loading) return <div>Loading leaderboard...</div>;
  if (error) return <div style={{ color: 'red' }}>{error}</div>;
  if (!scores && !finalizedSchedule) return <div>No data found.</div>;

  // Sort players by total score (lower is better)
  const sortedPlayers = scores?.playerTotals ? Object.entries(scores.playerTotals)
    .sort((a, b) => a[1] - b[1]) : [];

  // Get available rounds from both scores and finalized schedule
  const scoresRounds = scores?.rounds ? Object.keys(scores.rounds) : [];
  const scheduleRounds = finalizedSchedule ? Object.keys(finalizedSchedule)
    .filter(key => /^round/i.test(key)) : [];
  const availableRounds = [...new Set([...scoresRounds, ...scheduleRounds])].sort();

  // Calculate team scores for a specific round
  const getTeamScoresForRound = (round) => {
    const teamsWithScores = [];
    
    // First, try to get teams with scores
    if (scores?.rounds?.[round]) {
      Object.entries(scores.rounds[round]).forEach(([team, teamData]) => {
        teamsWithScores.push({
          team,
          teamName: teamData.teamName || team, // Use custom team name if available
          score: teamData.score,
          players: teamData.players || [],
          hasScore: teamData.score !== null && teamData.score !== undefined
        });
      });
    }
    
    // If no scores but we have finalized schedule, get team compositions
    if (teamsWithScores.length === 0 && finalizedSchedule?.[round]) {
      finalizedSchedule[round].forEach((teamObj, idx) => {
        const players = Object.values(teamObj);
        const teamKey = `team${idx + 1}`;
        
        // Generate default team name based on round convention
        const roundNum = parseInt(round.replace(/^round/i, ''));
        let defaultTeamName;
        
        if (roundNum % 2 === 1) { // Odd rounds (1, 3): 1a, 1b, 2a, 2b
          const groupNum = Math.floor(idx / 2) + 1;
          const suffix = idx % 2 === 0 ? 'a' : 'b';
          defaultTeamName = `${groupNum}${suffix}`;
        } else { // Even rounds (2, 4): 10a, 10b, 11a, 11b
          const groupNum = Math.floor(idx / 2) + 10;
          const suffix = idx % 2 === 0 ? 'a' : 'b';
          defaultTeamName = `${groupNum}${suffix}`;
        }
        
        teamsWithScores.push({
          team: teamKey,
          teamName: defaultTeamName,
          score: null,
          players: players,
          hasScore: false
        });
      });
    }
    
    // Sort: teams with scores first (by score), then teams without scores
    return teamsWithScores.sort((a, b) => {
      if (a.hasScore && b.hasScore) return a.score - b.score;
      if (a.hasScore && !b.hasScore) return -1;
      if (!a.hasScore && b.hasScore) return 1;
      return 0;
    });
  };

  const renderPlayerLeaderboard = () => {
    if (sortedPlayers.length === 0) {
      return <div style={{ marginTop: 24, color: '#888' }}>No individual scores available yet.</div>;
    }

    // Separate withdrawn and active players
    const activePlayers = [];
    const withdrawnPlayersList = [];

    // Calculate places with tie handling for active players only
    const playersWithPlaces = [];
    let currentPlace = 1;
    
    sortedPlayers.forEach((player, index) => {
      const [playerName, score] = player;
      // Extract clean name from player identifier for withdrawal check
      const cleanName = (() => {
        const match = playerName.match(/\(([^)]+)\)$/);
        return match ? match[1] : playerName;
      })();
      const isWithdrawn = withdrawnPlayers.has(playerName) || withdrawnPlayers.has(cleanName);
      
      if (isWithdrawn) {
        withdrawnPlayersList.push({ player: playerName, score });
        return;
      }
      
      activePlayers.push([playerName, score]);
    });

    // Calculate places for active players
    activePlayers.forEach((player, index) => {
      const [playerName, score] = player;
      let place = currentPlace;
      let isTied = false;
      
      // Check if tied with previous player
      if (index > 0 && activePlayers[index - 1][1] === score) {
        // Use the same place as previous player
        place = playersWithPlaces[index - 1].place;
        isTied = true;
        // Mark previous player as tied too if not already
        if (!playersWithPlaces[index - 1].isTied) {
          playersWithPlaces[index - 1].isTied = true;
        }
      }
      
      // Check if tied with next player
      if (index < activePlayers.length - 1 && activePlayers[index + 1][1] === score) {
        isTied = true;
      }
      
      playersWithPlaces.push({
        player: playerName,
        score,
        place,
        isTied,
        originalIndex: index
      });
      
      // Update currentPlace for next iteration
      if (index === activePlayers.length - 1 || activePlayers[index + 1][1] !== score) {
        currentPlace = index + 2; // Next available place
      }
    });
    
    return (
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 24 }}>
        <thead>
          <tr style={{ background: '#f0f0f0' }}>
            <th style={{ textAlign: 'center', padding: 8 }}>Place</th>
            <th style={{ textAlign: 'left', padding: 8 }}>Player</th>
            <th style={{ textAlign: 'right', padding: 8 }}>Total</th>
            {availableRounds.map(r => (
              <th key={r} style={{ textAlign: 'right', padding: 8 }}>{r.replace(/^round/i, 'R')}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {playersWithPlaces.map(({ player, score, place, isTied }) => (
            <tr key={player}>
              <td style={{ padding: 8, textAlign: 'center', fontWeight: 'bold' }}>
                {isTied ? `T${place}` : place}
              </td>
              <td style={{ padding: 8 }}>
                {(() => {
                  const match = player.match(/\(([^)]+)\)$/);
                  return match ? match[1] : '';
                })()}
              </td>
              <td style={{ padding: 8, textAlign: 'right' }}>{score}</td>
              {availableRounds.map(r => (
                <td key={r} style={{ padding: 8, textAlign: 'right' }}>{scores?.playerScores?.[player]?.[r] ?? '-'}</td>
              ))}
            </tr>
          ))}
          {/* Withdrawn players at bottom */}
          {withdrawnPlayersList.map(({ player, score }) => (
            <tr key={player} style={{ backgroundColor: '#f5f5f5' }}>
              <td style={{ padding: 8, textAlign: 'center', fontWeight: 'bold' }}>
                WD
              </td>
              <td style={{ padding: 8 }}>
                <span style={{ 
                  textDecoration: 'line-through', 
                  color: '#888',
                  textDecorationSkipInk: 'none',
                  display: 'inline-block'
                }}>
                  {(() => {
                    const match = player.match(/\(([^)]+)\)$/);
                    if (match) {
                      const fullText = match[1];
                      // Remove any existing (WD) from the name
                      return fullText.replace(/\s*\(WD\).*$/i, '');
                    }
                    return '';
                  })()}
                </span>
                <span style={{ color: '#888', display: 'inline-block' }}> (wd)</span>
              </td>
              <td style={{ padding: 8, textAlign: 'right', color: '#888' }}>{score}</td>
              {availableRounds.map(r => (
                <td key={r} style={{ padding: 8, textAlign: 'right', color: '#888' }}>{scores?.playerScores?.[player]?.[r] ?? '-'}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  const renderRoundTeamLeaderboard = (round) => {
    const teamScores = getTeamScoresForRound(round);
    
    if (teamScores.length === 0) {
      return <div style={{ marginTop: 24, color: '#888' }}>No team data for {round}</div>;
    }

    // Check if any teams have scores
    const hasAnyScores = teamScores.some(team => team.hasScore);

    if (!hasAnyScores) {
      // Before scores: Show team name (starting hole) and players
      return (
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 24 }}>
          <thead>
            <tr style={{ background: '#f0f0f0' }}>
              <th style={{ textAlign: 'left', padding: 8 }}>Starting Hole</th>
              <th style={{ textAlign: 'left', padding: 8 }}>Players</th>
            </tr>
          </thead>
          <tbody>
            {teamScores.map(({ team, teamName, players }, index) => (
              <tr key={team}>
                <td style={{ padding: 8, fontWeight: 'bold' }}>
                  {teamName || team}
                </td>
                <td style={{ padding: 8 }}>
                  {Array.isArray(players) 
                    ? players.map((player, idx) => {
                        const match = player.match(/\(([^)]+)\)$/);
                        const fullPlayerName = match ? match[1] : player;
                        const isWithdrawn = withdrawnPlayers.has(player) || withdrawnPlayers.has(fullPlayerName) || fullPlayerName.includes('(WD)');
                        
                        // Clean the player name by removing any (WD) suffix
                        const cleanPlayerName = fullPlayerName.replace(/\s*\(WD\).*$/i, '');
                        
                        return (
                          <span key={idx}>
                            <span 
                              style={{ 
                                textDecoration: isWithdrawn ? 'line-through' : 'none',
                                color: isWithdrawn ? '#888' : 'inherit'
                              }}
                            >
                              {cleanPlayerName}
                            </span>
                            {isWithdrawn && <span style={{ color: '#888' }}> (WD)</span>}
                            {idx < players.length - 1 && <span>, </span>}
                          </span>
                        );
                      })
                    : (players || 'N/A')
                  }
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    }

    // After scores: Show scores and players (no team name)
    return (
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 24 }}>
        <thead>
          <tr style={{ background: '#f0f0f0' }}>
            <th style={{ textAlign: 'right', padding: 8 }}>Score</th>
            <th style={{ textAlign: 'left', padding: 8 }}>Players</th>
          </tr>
        </thead>
        <tbody>
          {teamScores.map(({ team, teamName, score, players, hasScore }, index) => (
            <tr key={team}>
              <td style={{ padding: 8, textAlign: 'right' }}>
                {hasScore ? score : '-'}
              </td>
              <td style={{ padding: 8 }}>
                {Array.isArray(players) 
                  ? players.map((player, idx) => {
                      const match = player.match(/\(([^)]+)\)$/);
                      const fullPlayerName = match ? match[1] : player;
                      const isWithdrawn = withdrawnPlayers.has(player) || withdrawnPlayers.has(fullPlayerName) || fullPlayerName.includes('(WD)');
                      
                      // Clean the player name by removing any (WD) suffix
                      const cleanPlayerName = fullPlayerName.replace(/\s*\(WD\).*$/i, '');
                      
                      return (
                        <span key={idx}>
                          <span 
                            style={{ 
                              textDecoration: isWithdrawn ? 'line-through' : 'none',
                              color: isWithdrawn ? '#888' : 'inherit',
                              textDecorationSkipInk: 'none',
                              display: 'inline-block'
                            }}
                          >
                            {cleanPlayerName}
                          </span>
                          {isWithdrawn && <span style={{ color: '#888', display: 'inline-block' }}> (WD)</span>}
                          {idx < players.length - 1 && <span style={{ display: 'inline-block' }}>, </span>}
                        </span>
                      );
                    })
                  : (players || 'N/A')
                }
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: 32 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ margin: 0 }}>Leaderboard</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={handleRefresh}
            disabled={loading}
            style={{
              padding: '8px 16px',
              background: loading ? '#ccc' : '#28a745',
              color: '#fff',
              border: 'none',
              borderRadius: 4,
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: 14,
            }}
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
          <button
            onClick={() => setShowQR(!showQR)}
            style={{
              padding: '8px 16px',
              background: '#1976d2',
              color: '#fff',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer',
              fontSize: 14,
            }}
          >
            {showQR ? 'Hide QR' : 'Show QR'}
          </button>
        </div>
      </div>

      {/* QR Code Section */}
      {showQR && (
        <div style={{ 
          marginBottom: 24, 
          padding: 16, 
          background: '#f8f8f8', 
          borderRadius: 6, 
          textAlign: 'center' 
        }}>
          <div style={{ marginBottom: 12, fontSize: 14, color: '#666' }}>
            Scan to share this leaderboard:
          </div>
          <img
            src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(getPageUrl())}`}
            alt="QR Code for Leaderboard"
            style={{ border: '1px solid #ddd', borderRadius: 4 }}
          />
          <div style={{ marginTop: 8, fontSize: 12, color: '#888', wordBreak: 'break-all' }}>
            {getPageUrl()}
          </div>
        </div>
      )}
      
      {/* Tab Navigation */}
      <div style={{ marginBottom: 24 }}>
        {availableRounds.map(round => (
          <button
            key={round}
            onClick={() => setActiveTab(round)}
            style={{
              marginRight: 8,
              padding: '6px 16px',
              fontWeight: activeTab === round ? 'bold' : 'normal',
              background: activeTab === round ? '#1976d2' : '#eee',
              color: activeTab === round ? '#fff' : '#222',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer',
            }}
          >
            {round.replace(/^round/i, 'Round ')}
          </button>
        ))}
        <button
          onClick={() => setActiveTab('individual')}
          style={{
            marginRight: 8,
            padding: '6px 16px',
            fontWeight: activeTab === 'individual' ? 'bold' : 'normal',
            background: activeTab === 'individual' ? '#1976d2' : '#eee',
            color: activeTab === 'individual' ? '#fff' : '#222',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer',
          }}
        >
          Individual
        </button>
      </div>

      {/* Content based on active tab */}
      {activeTab === 'individual' 
        ? renderPlayerLeaderboard() 
        : renderRoundTeamLeaderboard(activeTab)
      }
    </div>
  );
};

export default LeaderboardPage;
