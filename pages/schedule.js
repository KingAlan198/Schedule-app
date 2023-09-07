import { useState } from 'react';
import axios from 'axios';

const Schedule = () => {
  const [totalPlayers, setTotalPlayers] = useState('');
  const [aPlayers, setAPlayers] = useState('');
  const [scheduleData, setScheduleData] = useState(null);
  const [error, setError] = useState(null); // State to manage errors

  const handleRetry = async () => {
    setError(null); // Clear the error message
    await handleSubmit(); // Retry the API request
  };

  const handleSubmit = async (e) => {
    if (e) {
      e.preventDefault();
    }

    if (totalPlayers === '' || aPlayers === '') {
      alert('Please enter values for Total Players and A-Players.');
      return;
    }

    if (aPlayers > 0 && aPlayers < 4) {
      alert('Scheduling app needs 0 or 4 or more A-Players.');
      return;
    }

    const apiUrl = `https://57nxom0eme.execute-api.us-east-1.amazonaws.com/dev/schedule/totalplayers/${totalPlayers}/aplayers/${aPlayers}`;

    try {
      const response = await axios.get(apiUrl);
      setScheduleData(response.data);
      setError(null); // Clear any previous errors on success
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('An error occurred. Please press the button to retry.'); // Set error message
    }
  };

  // Function to create the audit section content
  const renderAuditSection = () => {
    if (!scheduleData || !scheduleData.audit) {
      return null; // No audit data available
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
      <h1>Schedule Data</h1>
      <ul>
        <li>Select the number of A-Players.  The same number of C-Players will be assumed.</li>
        <li>An A-Player will always play with a C-Player.</li>
        <li>No two players will ever play on the same team.</li>
      </ul>
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
        </div>
      )}

      {renderAuditSection()}
    </div>
  );
};

export default Schedule;
