import React, { useState } from 'react';
import { useRouter } from 'next/router';

const TournamentSetup = () => {
  const router = useRouter();
  const [tournamentName, setTournamentName] = useState('');
  const [selectedFlow, setSelectedFlow] = useState('');

  const handleCreateTournament = () => {
    if (!tournamentName.trim()) {
      alert('Please enter a tournament name.');
      return;
    }

    if (!selectedFlow) {
      alert('Please select a tournament setup method.');
      return;
    }

    // Generate a simple unique tournament ID
    const tournamentId = Date.now().toString(36) + Math.random().toString(36).substr(2);

    // Navigate to the appropriate flow based on selection
    if (selectedFlow === 'schedule-first') {
      // Current flow: Generate Schedule → Populate Players → Combine
      router.push('/schedule');
    } else if (selectedFlow === 'players-first') {
      // New flow: Select Players → Calculate Totals → Generate Schedule
      router.push(`/select-players/${tournamentId}`);
    }
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: 32 }}>
      <div style={{ textAlign: 'center', marginBottom: 48 }}>
        <h1 style={{ color: '#1976d2', marginBottom: 16 }}>Golf Tournament Scheduler</h1>
        <p style={{ fontSize: 18, color: '#666', maxWidth: 600, margin: '0 auto' }}>
          Create perfectly balanced golf tournament schedules with automated player pairing and round optimization.
        </p>
      </div>

      <div style={{ 
        background: '#f8f9fa', 
        padding: 32, 
        borderRadius: 12, 
        marginBottom: 32,
        border: '1px solid #e9ecef'
      }}>
        <h2 style={{ marginBottom: 24, textAlign: 'center' }}>Setup Your Tournament</h2>
        
        <div style={{ marginBottom: 32 }}>
          <label style={{ 
            display: 'block', 
            fontWeight: 'bold', 
            marginBottom: 8,
            fontSize: 16
          }}>
            Tournament Name:
          </label>
          <input
            type="text"
            value={tournamentName}
            onChange={(e) => setTournamentName(e.target.value)}
            placeholder="Enter tournament name (e.g., 'Spring Classic 2025')"
            style={{
              width: '100%',
              padding: 12,
              fontSize: 16,
              border: '2px solid #dee2e6',
              borderRadius: 8,
              outline: 'none',
              transition: 'border-color 0.2s',
            }}
            onFocus={(e) => e.target.style.borderColor = '#1976d2'}
            onBlur={(e) => e.target.style.borderColor = '#dee2e6'}
          />
        </div>

        <h3 style={{ marginBottom: 20, color: '#333' }}>Choose Your Setup Method:</h3>
        
        <div style={{ display: 'grid', gap: 20, gridTemplateColumns: '1fr 1fr' }}>
          {/* Generate Schedule Option */}
          <div
            onClick={() => setSelectedFlow('schedule-first')}
            style={{
              padding: 24,
              border: selectedFlow === 'schedule-first' ? '3px solid #1976d2' : '2px solid #dee2e6',
              borderRadius: 12,
              cursor: 'pointer',
              background: selectedFlow === 'schedule-first' ? '#f3f8ff' : '#fff',
              transition: 'all 0.2s',
              position: 'relative'
            }}
          >
            <div style={{ 
              position: 'absolute',
              top: 12,
              right: 12,
              width: 20,
              height: 20,
              border: '2px solid #1976d2',
              borderRadius: '50%',
              background: selectedFlow === 'schedule-first' ? '#1976d2' : 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {selectedFlow === 'schedule-first' && (
                <div style={{ width: 8, height: 8, background: '#fff', borderRadius: '50%' }} />
              )}
            </div>
            
            <h4 style={{ color: '#1976d2', marginBottom: 12 }}>📊 Generate a Schedule</h4>
            <p style={{ color: '#666', marginBottom: 16, lineHeight: 1.5 }}>
              <strong>Quick Setup:</strong> Set total players and skill levels to generate a complete tournament schedule structure.
            </p>
            
            <div style={{ fontSize: 14, color: '#555' }}>
              <div style={{ marginBottom: 8 }}>
                <span style={{ fontWeight: 'bold' }}>Process:</span>
              </div>
              <div style={{ paddingLeft: 16 }}>
                1. Enter player counts<br/>
                2. Generate schedule structure<br/>
                3. View and finalize rounds<br/>
                4. Ready for tournament day
              </div>
            </div>
            
            <div style={{ marginTop: 16, padding: 8, background: '#e8f5e8', borderRadius: 6 }}>
              <strong style={{ color: '#2e7d32' }}>✓ Best for:</strong> Quick schedule generation, fixed player counts
            </div>
          </div>

          {/* Manage Tournament Option */}
          <div
            onClick={() => setSelectedFlow('players-first')}
            style={{
              padding: 24,
              border: selectedFlow === 'players-first' ? '3px solid #1976d2' : '2px solid #dee2e6',
              borderRadius: 12,
              cursor: 'pointer',
              background: selectedFlow === 'players-first' ? '#f3f8ff' : '#fff',
              transition: 'all 0.2s',
              position: 'relative'
            }}
          >
            <div style={{ 
              position: 'absolute',
              top: 12,
              right: 12,
              width: 20,
              height: 20,
              border: '2px solid #1976d2',
              borderRadius: '50%',
              background: selectedFlow === 'players-first' ? '#1976d2' : 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {selectedFlow === 'players-first' && (
                <div style={{ width: 8, height: 8, background: '#fff', borderRadius: '50%' }} />
              )}
            </div>
            
            <h4 style={{ color: '#1976d2', marginBottom: 12 }}>🏆 Manage a Tournament</h4>
            <p style={{ color: '#666', marginBottom: 16, lineHeight: 1.5 }}>
              <strong>Full Management:</strong> Complete tournament workflow with player selection, schedule generation, and ongoing management.
            </p>
            
            <div style={{ fontSize: 14, color: '#555' }}>
              <div style={{ marginBottom: 8 }}>
                <span style={{ fontWeight: 'bold' }}>Process:</span>
              </div>
              <div style={{ paddingLeft: 16 }}>
                1. Select your players<br/>
                2. Auto-calculate optimal schedule<br/>
                3. Manage players and rounds<br/>
                4. Track scores and results
              </div>
            </div>
            
            <div style={{ marginTop: 16, padding: 8, background: '#fff3e0', borderRadius: 6 }}>
              <strong style={{ color: '#f57c00' }}>★ Best for:</strong> Complete tournament management, player tracking
            </div>
          </div>
        </div>

        <div style={{ marginTop: 32, textAlign: 'center' }}>
          <button
            onClick={handleCreateTournament}
            disabled={!tournamentName.trim() || !selectedFlow}
            style={{
              padding: '16px 32px',
              fontSize: 18,
              fontWeight: 'bold',
              color: '#fff',
              background: (!tournamentName.trim() || !selectedFlow) ? '#ccc' : '#1976d2',
              border: 'none',
              borderRadius: 8,
              cursor: (!tournamentName.trim() || !selectedFlow) ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.2s',
              minWidth: 200
            }}
            onMouseOver={(e) => {
              if (tournamentName.trim() && selectedFlow) {
                e.target.style.backgroundColor = '#1565c0';
              }
            }}
            onMouseOut={(e) => {
              if (tournamentName.trim() && selectedFlow) {
                e.target.style.backgroundColor = '#1976d2';
              }
            }}
          >
            Create Tournament
          </button>
        </div>
      </div>

      {/* Feature Highlights */}
      <div style={{ marginTop: 40, padding: 24, background: '#f8f9fa', borderRadius: 12 }}>
        <h3 style={{ textAlign: 'center', marginBottom: 20, color: '#333' }}>
          Tournament Features
        </h3>
        <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>⚖️</div>
            <strong>Balanced Teams</strong>
            <p style={{ fontSize: 14, color: '#666', margin: '4px 0 0 0' }}>
              Automatic A-player distribution across all teams
            </p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>🔄</div>
            <strong>No Repeats</strong>
            <p style={{ fontSize: 14, color: '#666', margin: '4px 0 0 0' }}>
              Players never play together more than once
            </p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>📱</div>
            <strong>Live Scoring</strong>
            <p style={{ fontSize: 14, color: '#666', margin: '4px 0 0 0' }}>
              Real-time leaderboards and score entry
            </p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>🎯</div>
            <strong>Smart Pairing</strong>
            <p style={{ fontSize: 14, color: '#666', margin: '4px 0 0 0' }}>
              Optimized player combinations for fair play
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TournamentSetup;