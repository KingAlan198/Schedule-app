import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';

const SelectPlayersPage = () => {
  const router = useRouter();
  const { id } = router.query;
  
  // State management
  const [availablePlayers, setAvailablePlayers] = useState([]);
  const [selectedPlayers, setSelectedPlayers] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRank, setFilterRank] = useState('all');
  const [saving, setSaving] = useState(false);

  // Load player roster on component mount
  useEffect(() => {
    loadPlayerRoster();
  }, []);

  const loadPlayerRoster = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Load the goodland roster from S3 using the same endpoint as the assign page
      console.log('Attempting to load roster from API...');
      const response = await axios.get('https://57nxom0eme.execute-api.us-east-1.amazonaws.com/dev/roster/goodland');
      
      console.log('API Response:', response);
      console.log('Response data:', response.data);
      console.log('Response data type:', typeof response.data);
      
      // Handle the response the same way as the assign page
      const roster = typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
      
      console.log('Parsed roster:', roster);
      console.log('Is array?', Array.isArray(roster));
      
      if (roster && Array.isArray(roster)) {
        console.log('Setting available players:', roster.length, 'players');
        setAvailablePlayers(roster);
      } else {
        // Fallback: create sample players if no roster found
        const samplePlayers = [
          { player: "Alan King", previousRank: "A" },
          { player: "Mike Holinka", previousRank: "A" },
          { player: "Eric Jass", previousRank: "A" },
          { player: "Tyler Felix", previousRank: "A" },
          { player: "Ty Donahue", previousRank: "A" },
          { player: "Chris Witzell", previousRank: "A" },
          { player: "Justin Jass", previousRank: "A" },
          { player: "Justin Bonestell", previousRank: "A" },
          { player: "Matt Witzell", previousRank: "A" },
          { player: "Mike Christian", previousRank: "A" },
          { player: "Neal Clarke", previousRank: "A" },
          { player: "Kelly McCaulley", previousRank: "C" },
          { player: "Terry Haigh", previousRank: "C" },
          { player: "Joel Beleher", previousRank: "C" },
          { player: "Dave Mell", previousRank: "C" },
          { player: "Steve Venema", previousRank: "C" },
          { player: "Jeff Kalar", previousRank: "C" },
          { player: "Scott Schmidtbauer", previousRank: "C" },
          { player: "Lucas Michaels", previousRank: "C" },
          { player: "Mike Westerberg", previousRank: "C" },
          { player: "Ben Picek", previousRank: "C" },
          // Add some B players
          { player: "Al Hilton", previousRank: "B" },
          { player: "Alan Howg", previousRank: "B" },
          { player: "Alex Laskey", previousRank: "B" },
          { player: "Austin Anderson", previousRank: "B" },
          { player: "Bob Lignell", previousRank: "B" },
          { player: "Brent Pickens", previousRank: "B" },
          { player: "Brian Holm", previousRank: "B" },
          { player: "Brian Wagner", previousRank: "B" },
          { player: "Casey Venema", previousRank: "B" },
          { player: "Chad Korpi", previousRank: "B" },
          { player: "Colin Korpi", previousRank: "B" },
          { player: "Cole Donahue", previousRank: "B" },
          { player: "Cory Thiner", previousRank: "B" },
          { player: "Dave Bemrose", previousRank: "B" },
          { player: "David Olson", previousRank: "B" },
          { player: "Derek Simth", previousRank: "B" },
          { player: "Hunter Revina", previousRank: "B" },
          { player: "Jacob Korpi", previousRank: "B" },
          { player: "Jake Thiner", previousRank: "B" },
          { player: "Jason Monick", previousRank: "B" },
          { player: "Jeff Ingle", previousRank: "B" },
          { player: "Jim Haugen", previousRank: "B" },
          { player: "Jim Lamke", previousRank: "B" },
          { player: "John Holman", previousRank: "B" },
          { player: "John Labine", previousRank: "B" },
          { player: "Jon Femansland", previousRank: "B" },
          { player: "Josh Gross", previousRank: "B" },
          { player: "Ken Haigh", previousRank: "B" },
          { player: "Kendall Korpi", previousRank: "B" },
          { player: "Kyle Haigh", previousRank: "B" },
          { player: "Larry Felix", previousRank: "B" },
          { player: "Levi Ingle", previousRank: "B" },
          { player: "Lonnie Riendeau", previousRank: "B" },
          { player: "Matt Beighley", previousRank: "B" },
          { player: "Merril Lowney", previousRank: "B" },
          { player: "Mike Cuddihy", previousRank: "B" },
          { player: "Mike Landgren", previousRank: "B" },
          { player: "Nate Kenjalo", previousRank: "B" },
          { player: "Nate Tibbetts", previousRank: "B" },
          { player: "Nick Sivonen", previousRank: "B" },
          { player: "Norm Koran", previousRank: "B" },
          { player: "Randy Hedican", previousRank: "B" },
          { player: "Rick King", previousRank: "B" },
          { player: "Scott Hooper", previousRank: "B" },
          { player: "T.J. Lamping", previousRank: "B" },
          { player: "Todd Kurhas", previousRank: "B" },
          { player: "Todd Venema", previousRank: "B" },
          { player: "Tom Olson", previousRank: "B" },
          { player: "Tony Arlich", previousRank: "B" },
          { player: "Tony Donahue", previousRank: "B" },
          { player: "Tony Peterson", previousRank: "B" },
          { player: "Zach Childs", previousRank: "B" },
          { player: "Cody Riendeau", previousRank: "B" }
        ];
        setAvailablePlayers(samplePlayers);
      }
    } catch (err) {
      console.error('Error loading roster:', err);
      console.error('Error details:', err.response?.data);
      console.error('Error status:', err.response?.status);
      setError(`Could not load player roster: ${err.message}. Using sample data.`);
      
      // Use sample data as fallback
      const fallbackPlayers = [
        { player: "Alan King", previousRank: "A" },
        { player: "Mike Christian", previousRank: "A" },
        { player: "Eric Jass", previousRank: "A" },
        { player: "Kelly McCaulley", previousRank: "C" },
        { player: "Dave Mell", previousRank: "C" },
        { player: "Steve Venema", previousRank: "C" },
        { player: "Al Hilton", previousRank: "B" },
        { player: "Casey Venema", previousRank: "B" },
        { player: "Jason Monick", previousRank: "B" },
        { player: "Rick King", previousRank: "B" },
      ];
      setAvailablePlayers(fallbackPlayers);
    } finally {
      setLoading(false);
    }
  };

  // Filter players based on search and rank filter
  const getFilteredPlayers = () => {
    return availablePlayers.filter(player => {
      const matchesSearch = player.player.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRank = filterRank === 'all' || player.previousRank === filterRank;
      return matchesSearch && matchesRank;
    });
  };

  // Calculate player counts
  const getPlayerCounts = () => {
    const selectedPlayersList = Array.from(selectedPlayers);
    const selectedPlayersData = availablePlayers.filter(p => selectedPlayersList.includes(p.player));
    
    const counts = {
      total: selectedPlayersData.length,
      A: selectedPlayersData.filter(p => p.previousRank === 'A').length,
      B: selectedPlayersData.filter(p => p.previousRank === 'B').length,
      C: selectedPlayersData.filter(p => p.previousRank === 'C').length
    };
    
    return counts;
  };

  // Handle player rank change
  const handleRankChange = (playerName, newRank) => {
    setAvailablePlayers(prevPlayers => 
      prevPlayers.map(player => 
        player.player === playerName 
          ? { ...player, previousRank: newRank }
          : player
      )
    );
  };

  // Handle player selection toggle
  const togglePlayerSelection = (playerName) => {
    const newSelectedPlayers = new Set(selectedPlayers);
    if (newSelectedPlayers.has(playerName)) {
      newSelectedPlayers.delete(playerName);
    } else {
      newSelectedPlayers.add(playerName);
    }
    setSelectedPlayers(newSelectedPlayers);
  };

  // Handle "Select All" functionality
  const handleSelectAll = (rank = null) => {
    const filteredPlayers = getFilteredPlayers();
    const playersToSelect = rank 
      ? filteredPlayers.filter(p => p.previousRank === rank)
      : filteredPlayers;
    
    const newSelectedPlayers = new Set(selectedPlayers);
    playersToSelect.forEach(player => {
      newSelectedPlayers.add(player.player);
    });
    setSelectedPlayers(newSelectedPlayers);
  };

  // Handle "Clear All" functionality
  const handleClearAll = (rank = null) => {
    if (rank) {
      const newSelectedPlayers = new Set(selectedPlayers);
      availablePlayers
        .filter(p => p.previousRank === rank)
        .forEach(player => {
          newSelectedPlayers.delete(player.player);
        });
      setSelectedPlayers(newSelectedPlayers);
    } else {
      setSelectedPlayers(new Set());
    }
  };

  // Generate schedule with selected players
  const handleGenerateSchedule = async () => {
    const counts = getPlayerCounts();
    
    if (counts.total < 8) {
      alert('Please select at least 8 players to generate a schedule.');
      return;
    }

    if (counts.A > 0 && counts.A < 4) {
      alert('You need either 0 A-players or at least 4 A-players for proper tournament balance.');
      return;
    }

    setSaving(true);
    
    try {
      // Get the selected players data
      const selectedPlayersData = availablePlayers.filter(p => selectedPlayers.has(p.player));
      
      // Generate complete tournament schedule with assigned players
      const response = await axios.post(
        'https://57nxom0eme.execute-api.us-east-1.amazonaws.com/dev/generate-players-first-schedule',
        {
          tournamentId: id,
          selectedPlayers: selectedPlayersData
        }
      );

      if (response.data.success) {
        const { scheduleId } = response.data;
        // Redirect directly to the finalized schedule view page
        router.push(`/finalized/${scheduleId}`);
      } else {
        throw new Error(response.data.error || 'Failed to generate tournament schedule');
      }
      
    } catch (err) {
      console.error('Error generating schedule:', err);
      
      // Show specific error message from API if available
      const errorMessage = err.response?.data?.error || err.message || 'Unknown error occurred';
      alert(`Error generating schedule: ${errorMessage}`);
    } finally {
      setSaving(false);
    }
  };

  // Get rank color for badges
  const getRankColor = (rank) => {
    switch (rank) {
      case 'A': return { bg: '#e3f2fd', border: '#1976d2', text: '#1976d2' };
      case 'B': return { bg: '#e8f5e8', border: '#2e7d32', text: '#2e7d32' };
      case 'C': return { bg: '#fff3e0', border: '#f57c00', text: '#f57c00' };
      default: return { bg: '#f5f5f5', border: '#666', text: '#666' };
    }
  };

  const counts = getPlayerCounts();
  const filteredPlayers = getFilteredPlayers();

  if (loading) {
    return (
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: 32, textAlign: 'center' }}>
        <h1>Loading Player Roster...</h1>
        <div style={{ marginTop: 20 }}>Please wait while we load the available players.</div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: 32 }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <button 
          onClick={() => router.back()}
          style={{
            padding: '8px 16px',
            background: '#f5f5f5',
            border: '1px solid #ddd',
            borderRadius: 4,
            cursor: 'pointer',
            marginBottom: 16
          }}
        >
          ← Back to Tournament Setup
        </button>

        <h1 style={{ color: '#1976d2', marginBottom: 8 }}>Select Tournament Players</h1>
        <p style={{ color: '#666', marginBottom: 16 }}>
          Choose the players for your tournament. The schedule will be optimized for your selected participants.
        </p>
        
        {error && (
          <div style={{ 
            background: '#fff3cd', 
            border: '1px solid #ffeaa7', 
            borderRadius: 6, 
            padding: 12, 
            marginBottom: 16,
            color: '#856404'
          }}>
            ⚠️ {error}
          </div>
        )}
      </div>

      {/* Player Count Summary */}
      <div style={{ 
        background: '#f8f9fa', 
        padding: 20, 
        borderRadius: 8, 
        marginBottom: 24,
        border: '1px solid #e9ecef'
      }}>
        <h3 style={{ margin: '0 0 12px 0', color: '#333' }}>Selected Players Summary</h3>
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ fontSize: 18, fontWeight: 'bold' }}>
            Total: <span style={{ color: '#1976d2' }}>{counts.total}</span>
          </div>
          <div style={{ fontSize: 16 }}>
            A-Players: <span style={{ color: '#1976d2', fontWeight: 'bold' }}>{counts.A}</span>
          </div>
          <div style={{ fontSize: 16 }}>
            B-Players: <span style={{ color: '#2e7d32', fontWeight: 'bold' }}>{counts.B}</span>
          </div>
          <div style={{ fontSize: 16 }}>
            C-Players: <span style={{ color: '#f57c00', fontWeight: 'bold' }}>{counts.C}</span>
          </div>
          
          {counts.total >= 8 && (
            <button
              onClick={handleGenerateSchedule}
              disabled={saving}
              style={{
                padding: '12px 24px',
                background: saving ? '#ccc' : '#1976d2',
                color: '#fff',
                border: 'none',
                borderRadius: 6,
                cursor: saving ? 'not-allowed' : 'pointer',
                fontWeight: 'bold',
                fontSize: 16,
                marginLeft: 'auto'
              }}
            >
              {saving ? 'Generating...' : `Generate Schedule for ${counts.total} Players →`}
            </button>
          )}
        </div>
        
        {counts.total > 0 && counts.total < 8 && (
          <div style={{ marginTop: 12, color: '#856404', fontSize: 14 }}>
            ⚠️ Need at least 8 players to generate a schedule (currently have {counts.total})
          </div>
        )}
        
        {counts.A > 0 && counts.A < 4 && (
          <div style={{ marginTop: 12, color: '#856404', fontSize: 14 }}>
            ⚠️ Need either 0 A-players or at least 4 A-players for proper balance (currently have {counts.A})
          </div>
        )}
      </div>

      {/* Search and Filter Controls */}
      <div style={{ 
        background: '#fff', 
        padding: 20, 
        borderRadius: 8, 
        marginBottom: 24,
        border: '1px solid #e9ecef'
      }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <input
              type="text"
              placeholder="Search players..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: 10,
                border: '2px solid #dee2e6',
                borderRadius: 6,
                fontSize: 16
              }}
            />
          </div>
          
          <div>
            <select
              value={filterRank}
              onChange={(e) => setFilterRank(e.target.value)}
              style={{
                padding: 10,
                border: '2px solid #dee2e6',
                borderRadius: 6,
                fontSize: 16,
                minWidth: 120
              }}
            >
              <option value="all">All Ranks</option>
              <option value="A">A-Players</option>
              <option value="B">B-Players</option>
              <option value="C">C-Players</option>
            </select>
          </div>
          
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => handleSelectAll()}
              style={{
                padding: '8px 16px',
                background: '#28a745',
                color: '#fff',
                border: 'none',
                borderRadius: 4,
                cursor: 'pointer',
                fontSize: 14
              }}
            >
              Select All Visible
            </button>
            <button
              onClick={() => handleClearAll()}
              style={{
                padding: '8px 16px',
                background: '#dc3545',
                color: '#fff',
                border: 'none',
                borderRadius: 4,
                cursor: 'pointer',
                fontSize: 14
              }}
            >
              Clear All
            </button>
          </div>
        </div>
      </div>

      {/* Quick Select by Rank */}
      <div style={{ 
        background: '#fff', 
        padding: 20, 
        borderRadius: 8, 
        marginBottom: 24,
        border: '1px solid #e9ecef'
      }}>
        <h4 style={{ margin: '0 0 12px 0' }}>Quick Select by Skill Level:</h4>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {['A', 'B', 'C'].map(rank => {
            const rankColor = getRankColor(rank);
            const rankPlayers = availablePlayers.filter(p => p.previousRank === rank);
            const selectedInRank = rankPlayers.filter(p => selectedPlayers.has(p.player)).length;
            
            return (
              <div key={rank} style={{ 
                padding: 12, 
                border: `2px solid ${rankColor.border}`, 
                borderRadius: 6,
                background: rankColor.bg
              }}>
                <div style={{ fontWeight: 'bold', color: rankColor.text, marginBottom: 8 }}>
                  {rank}-Players ({selectedInRank}/{rankPlayers.length})
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    onClick={() => handleSelectAll(rank)}
                    style={{
                      padding: '4px 12px',
                      background: rankColor.text,
                      color: '#fff',
                      border: 'none',
                      borderRadius: 4,
                      cursor: 'pointer',
                      fontSize: 12
                    }}
                  >
                    Select All
                  </button>
                  <button
                    onClick={() => handleClearAll(rank)}
                    style={{
                      padding: '4px 12px',
                      background: '#fff',
                      color: rankColor.text,
                      border: `1px solid ${rankColor.text}`,
                      borderRadius: 4,
                      cursor: 'pointer',
                      fontSize: 12
                    }}
                  >
                    Clear
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Player List */}
      <div style={{ 
        background: '#fff', 
        borderRadius: 8, 
        border: '1px solid #e9ecef'
      }}>
        <div style={{ 
          padding: '16px 20px', 
          borderBottom: '1px solid #e9ecef',
          background: '#f8f9fa',
          borderRadius: '8px 8px 0 0'
        }}>
          <h3 style={{ margin: 0 }}>
            Available Players ({filteredPlayers.length})
          </h3>
        </div>
        
        <div style={{ 
          maxHeight: 400, 
          overflowY: 'auto',
          padding: 20
        }}>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
            gap: 12
          }}>
            {filteredPlayers.map((player) => {
              const isSelected = selectedPlayers.has(player.player);
              const rankColor = getRankColor(player.previousRank);
              
              return (
                <div
                  key={player.player}
                  style={{
                    padding: 12,
                    border: `2px solid ${isSelected ? '#1976d2' : '#dee2e6'}`,
                    borderRadius: 6,
                    cursor: 'pointer',
                    background: isSelected ? '#f3f8ff' : '#fff',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div 
                    style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}
                    onClick={() => togglePlayerSelection(player.player)}
                  >
                    <div style={{
                      width: 20,
                      height: 20,
                      border: `2px solid ${isSelected ? '#1976d2' : '#ccc'}`,
                      borderRadius: 4,
                      background: isSelected ? '#1976d2' : '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {isSelected && (
                        <div style={{ 
                          width: 8, 
                          height: 8, 
                          background: '#fff', 
                          borderRadius: 2 
                        }} />
                      )}
                    </div>
                    
                    <span style={{ 
                      fontWeight: isSelected ? 'bold' : 'normal',
                      color: isSelected ? '#1976d2' : '#333'
                    }}>
                      {player.player}
                    </span>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <select
                      value={player.previousRank}
                      onChange={(e) => {
                        e.stopPropagation();
                        handleRankChange(player.player, e.target.value);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        padding: '4px 8px',
                        border: `1px solid ${rankColor.border}`,
                        borderRadius: 4,
                        fontSize: 12,
                        fontWeight: 'bold',
                        background: rankColor.bg,
                        color: rankColor.text,
                        cursor: 'pointer',
                        minWidth: 50
                      }}
                    >
                      <option value="A">A</option>
                      <option value="B">B</option>
                      <option value="C">C</option>
                    </select>
                  </div>
                </div>
              );
            })}
          </div>
          
          {filteredPlayers.length === 0 && (
            <div style={{ textAlign: 'center', color: '#666', padding: 40 }}>
              No players found matching your search criteria.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SelectPlayersPage;