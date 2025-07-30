import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import axios from 'axios';

const ViewSchedule = () => {
  const router = useRouter();
  const { id } = router.query;
  const [scheduleData, setScheduleData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const fetchSchedule = async () => {
      setLoading(true);
      setError(null);
      try {
        // Use your deployed API endpoint here:
        const apiUrl = `https://57nxom0eme.execute-api.us-east-1.amazonaws.com/dev/view-schedule/${id}`;
        const response = await axios.get(apiUrl);
        setScheduleData(typeof response.data === 'string' ? JSON.parse(response.data) : response.data);
      } catch (err) {
        setError('Schedule not found or error loading schedule.');
      } finally {
        setLoading(false);
      }
    };
    fetchSchedule();
  }, [id]);

  const renderAuditSection = () => {
    if (!scheduleData || !scheduleData.audit || scheduleData.audit.length === 0) {
      return (
        <div>
          <h2>Audit</h2>
          <p>No duplicates found.</p>
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
      return null;
    }
    return (
      <div>
        <h2>Warning {scheduleData.audit.length} duplicates found.</h2>
      </div>
    );
  };

  return (
    <div>
      <h1>View Saved Schedule</h1>
      {loading && <p>Loading...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
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
          {renderAuditSection()}
        </div>
      )}
    </div>
  );
};

export default ViewSchedule;
