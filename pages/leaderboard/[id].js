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

  // Get the current page URL for QR code
  const getPageUrl = () => {
    if (typeof window !== 'undefined') {
      return window.location.href;
    }
    return '';
  };

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    
    // Load both scores and finalized schedule
    Promise.all([
      axios.get(`https://57nxom0eme.execute-api.us-east-1.amazonaws.com/dev/get-scores/${id}`).catch(() => null),
      axios.get(`https://57nxom0eme.execute-api.us-east-1.amazonaws.com/dev/view-finalized-schedule/${id}`).catch(() => null)
    ]).then(([scoresRes, scheduleRes]) => {
      if (scoresRes) setScores(scoresRes.data);
      if (scheduleRes) {
        const scheduleData = typeof scheduleRes.data === 'string' ? JSON.parse(scheduleRes.data) : scheduleRes.data;
        setFinalizedSchedule(scheduleData);
      }
      setLoading(false);
    }).catch(() => {
      setError('Could not load leaderboard.');
      setLoading(false);
    });
  }, [id]);

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
          score: teamData.score || 0,
          players: teamData.players || [],
          hasScore: true
        });
      });
    }
    
    // If no scores but we have finalized schedule, get team compositions
    if (teamsWithScores.length === 0 && finalizedSchedule?.[round]) {
      finalizedSchedule[round].forEach((teamObj, idx) => {
        const players = Object.values(teamObj);
        teamsWithScores.push({
          team: `Team ${idx + 1}`,
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
    
    return (
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 24 }}>
        <thead>
          <tr style={{ background: '#f0f0f0' }}>
            <th style={{ textAlign: 'left', padding: 8 }}>Player</th>
            <th style={{ textAlign: 'right', padding: 8 }}>Total</th>
            {availableRounds.map(r => (
              <th key={r} style={{ textAlign: 'right', padding: 8 }}>{r.replace(/^round/i, 'R')}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedPlayers.map(([player, total]) => (
            <tr key={player}>
              <td style={{ padding: 8 }}>
                {(() => {
                  const match = player.match(/\(([^)]+)\)$/);
                  return match ? match[1] : '';
                })()}
              </td>
              <td style={{ padding: 8, textAlign: 'right' }}>{total}</td>
              {availableRounds.map(r => (
                <td key={r} style={{ padding: 8, textAlign: 'right' }}>{scores?.playerScores?.[player]?.[r] ?? '-'}</td>
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

    return (
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 24 }}>
        <thead>
          <tr style={{ background: '#f0f0f0' }}>
            <th style={{ textAlign: 'right', padding: 8 }}>Score</th>
            <th style={{ textAlign: 'left', padding: 8 }}>Players</th>
          </tr>
        </thead>
        <tbody>
          {teamScores.map(({ team, score, players, hasScore }, index) => (
            <tr key={team}>
              <td style={{ padding: 8, textAlign: 'right' }}>
                {hasScore ? score : '-'}
              </td>
              <td style={{ padding: 8 }}>
                {Array.isArray(players) 
                  ? players.map(player => {
                      const match = player.match(/\(([^)]+)\)$/);
                      return match ? match[1] : player;
                    }).join(', ')
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
