
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';

const Schedule = () => {
  const router = useRouter();
  const [totalPlayers, setTotalPlayers] = useState('');
  const [aPlayers, setAPlayers] = useState('');
  const [scheduleData, setScheduleData] = useState(null);
  const [error, setError] = useState(null); // State to manage errors
  const [saveUrl, setSaveUrl] = useState(null);
  const [saveError, setSaveError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [shareId, setShareId] = useState(null);
  const [tournamentId, setTournamentId] = useState(null);
  const [flow, setFlow] = useState('traditional');

  // Handle URL parameters (for players-first flow)
  useEffect(() => {
    if (router.isReady) {
      const { 
        totalPlayers: urlTotalPlayers, 
        aPlayers: urlAPlayers, 
        tournamentId: urlTournamentId, 
        flow: urlFlow 
      } = router.query;
      
      console.log('URL parameters:', { urlTotalPlayers, urlAPlayers, urlTournamentId, urlFlow });
      
      if (urlTotalPlayers) {
        setTotalPlayers(urlTotalPlayers);
      }
      if (urlAPlayers) {
        setAPlayers(urlAPlayers);
      }
      if (urlTournamentId) {
        setTournamentId(urlTournamentId);
      }
      if (urlFlow) {
        setFlow(urlFlow);
      }
    }
  }, [router.isReady, router.query]);

  // Auto-generate schedule for players-first flow (separate useEffect to ensure state is set)
  useEffect(() => {
    if (flow === 'players-first' && totalPlayers && aPlayers && !scheduleData) {
      console.log('Auto-generating schedule with:', { totalPlayers, aPlayers });
      handleSubmit();
    }
  }, [flow, totalPlayers, aPlayers, scheduleData]);
  // Save schedule handler
  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    setSaveUrl(null);
    try {
      // Always include aPlayers and totalPlayers in the saved schedule
      const scheduleToSave = {
        ...scheduleData,
        aPlayers: Number(aPlayers),
        totalPlayers: Number(totalPlayers)
      };
      const apiUrl = 'https://57nxom0eme.execute-api.us-east-1.amazonaws.com/dev/save-schedule';
      const response = await axios.post(apiUrl, { schedule: scheduleToSave });
      setSaveUrl(response.data.url);
      // Extract the schedule ID from the pre-signed URL for sharing
      const match = response.data.url.match(/schedules\/([a-f0-9\-]+)\.json/);
      if (match && match[1]) {
        setShareId(match[1]);
      } else {
        setShareId(null);
      }
    } catch (err) {
      setSaveError('Failed to save schedule.');
    } finally {
      setSaving(false);
    }
  };

  const handleRetry = async () => {
    setError(null); // Clear the error message
    await handleSubmit(); // Retry the API request
  };

  const handleSubmit = async (e) => {
    if (e) {
      e.preventDefault();
    }

    console.log('handleSubmit called with:', { totalPlayers, aPlayers, types: { totalPlayers: typeof totalPlayers, aPlayers: typeof aPlayers } });

    // Convert to numbers for validation
    const totalPlayersNum = Number(totalPlayers);
    const aPlayersNum = Number(aPlayers);

    console.log('Converted to numbers:', { totalPlayersNum, aPlayersNum, isNaN: { total: isNaN(totalPlayersNum), a: isNaN(aPlayersNum) } });

    if (isNaN(totalPlayersNum) || isNaN(aPlayersNum) || totalPlayersNum <= 0 || aPlayersNum < 0) {
      console.log('Validation failed:', { totalPlayersNum, aPlayersNum });
      alert('Please enter valid values for Total Players and A-Players.');
      return;
    }

    if (aPlayersNum > 0 && aPlayersNum < 4) {
      alert('Scheduling app needs 0 or 4 or more A-Players.');
      return;
    }

    const apiUrl = `https://57nxom0eme.execute-api.us-east-1.amazonaws.com/dev/schedule/totalplayers/${totalPlayersNum}/aplayers/${aPlayersNum}`;

    try {
      const response = await axios.get(apiUrl);
      setScheduleData(response.data);
      setError(null); // Clear any previous errors on success
      setShareId(null); // Hide shareable link and show save button
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('An error occurred. Please press the button to retry.'); // Set error message
    }
  };

  // Function to create the audit section content
  const renderAuditSection = () => {
    if (!scheduleData || !scheduleData.audit || scheduleData.audit.length === 0) {
      return (
        <div>
          <h2>Audit</h2>
          <p>No dupicates found.</p>
        </div>
      );
    }

    return (
      <div>
        <h2>Audit</h2>
        <ul>
          {scheduleData.audit.map((auditItem, index) => (
            <li key={index}>
              Player {auditItem.key} plays more than once with: {auditItem.duplicates.join(', ')}
            </li>
          ))}
        </ul>
      </div>
    );
  };

  const renderAuditMessage = () => {
    if (!scheduleData || !scheduleData.audit || scheduleData.audit.length === 0) {
      return null; // No audit data available
    }

    return (
      <div>
        <h2>Warning {scheduleData.audit.length} duplicates found.</h2>
      </div>
    );
  };

  return (
    <div>
      {flow === 'players-first' && tournamentId ? (
        <div style={{ 
          background: '#e3f2fd', 
          padding: 16, 
          borderRadius: 8, 
          marginBottom: 24,
          border: '1px solid #1976d2'
        }}>
          <h2 style={{ color: '#1976d2', margin: '0 0 8px 0' }}>
            Players-First Tournament Schedule
          </h2>
          <p style={{ margin: 0, color: '#333' }}>
            Tournament ID: <strong>{tournamentId}</strong> | 
            Generated from {totalPlayers} selected players ({aPlayers} A-players)
          </p>
          <button
            onClick={() => router.push(`/select-players/${tournamentId}`)}
            style={{
              marginTop: 12,
              padding: '8px 16px',
              background: '#1976d2',
              color: '#fff',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer'
            }}
          >
            ← Back to Player Selection
          </button>
        </div>
      ) : (
        <div>
          <h1>Schedule Generator</h1>
          <ul>
            <li>Enter the total number of players.</li>
            <li>Enter the number of A-Players.  The same number of C-Players will be assumed.</li>
            <li>An A-Player will always play with a C-Player.</li>
            <li>Two A-Players will never play together.</li>
            <li>No players will ever play together more than once.</li>
          </ul>
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <label>
          Total Players:
          <input
            type="number"
            value={totalPlayers}
            onChange={(e) => setTotalPlayers(e.target.value)}
            placeholder="Enter total players"
          />
        </label>
        <br/>
        <label>
          A-Players:
          <input
            type="number"
            value={aPlayers}
            onChange={(e) => setAPlayers(e.target.value)}
            placeholder="Enter A-Players"
          />
        </label>
        <br/>
        <button type="submit">Generate Schedule</button>
      </form>

      {error && (
        <div>
          <p>{error}</p>
          <button onClick={handleRetry}>Retry</button>
        </div>
      )}

      {renderAuditMessage()}


      {scheduleData && (
        <div>
          {Object.keys(scheduleData)
            .filter((round) => round.startsWith('round') && !isNaN(parseInt(round.replace('round', ''))))
            .map((round) => (
              <div key={round}>
                <h2>Round {round.replace('round', '')}</h2>
                <ul>
                  {scheduleData[round].map((match, index) => (
                    <li key={index}>
                      Team {index + 1} - {match.golfer1}, {match.golfer2}, {match.golfer3}, {match.golfer4}
                    </li>
                  ))}
                </ul>
              </div>
            ))}

          {/* Save Button and Result */}
          <div style={{ marginTop: 20 }}>
            {!shareId && (
              <button onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : 'Save Schedule'}
              </button>
            )}
            {shareId && (
              <div style={{ marginTop: 10 }}>
                <strong>Share this link for a nice view:</strong>
                <div>
                  <input
                    type="text"
                    value={window.location.origin + '/view/' + shareId}
                    readOnly
                    style={{ width: '80%' }}
                    onFocus={e => e.target.select()}
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.origin + '/view/' + shareId);
                    }}
                    style={{ marginLeft: 8 }}
                  >
                    Copy View Link
                  </button>
                </div>
                <div style={{ marginTop: 20 }}>
                  <button
                    onClick={() => {
                      window.location.href = `/assign/${shareId}`;
                    }}
                  >
                    Assign Players
                  </button>
                </div>
              </div>
            )}
            {saveError && <div style={{ color: 'red' }}>{saveError}</div>}
          </div>
        </div>
      )}

      {renderAuditSection()}
    </div>
  );
};

export default Schedule;
