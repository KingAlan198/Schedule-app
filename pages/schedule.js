// components/Schedule.js
import { useState } from 'react';
import axios from 'axios';

const Schedule = () => {
  const [totalPlayers, setTotalPlayers] = useState('');
  const [aPlayers, setAPlayers] = useState('');
  const [scheduleData, setScheduleData] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent the default form submission behavior

    if (totalPlayers === '' || aPlayers === '') {
      alert('Please enter values for Total Players and A-Players.');
      return;
    }

    // Define the API endpoint URL
    const apiUrl = `https://57nxom0eme.execute-api.us-east-1.amazonaws.com/dev/schedule/totalplayers/${totalPlayers}/aplayers/${aPlayers}`;

    try {
      // Fetch data from the API
      const response = await axios.get(apiUrl);
      setScheduleData(response.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  return (
    <div>
      <h1>Schedule Data</h1>
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
        <label>
          A-Players:
          <input
            type="number"
            value={aPlayers}
            onChange={(e) => setAPlayers(e.target.value)}
            placeholder="Enter A-Players"
          />
        </label>
        <button type="submit">Generate Schedule</button>
      </form>

      {scheduleData && (
        <div>
          {Object.keys(scheduleData).map((round) => (
            <div key={round}>
              <h2>Round {round.slice(-1)}</h2>
              <ul>
                {scheduleData[round].map((match, index) => (
                  <li key={index}>
                       Team {index +1 } - {match.golfer1}, {match.golfer2}, {match.golfer3}, {match.golfer4}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Schedule;
