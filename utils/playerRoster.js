function normalizePlayerName(playerName) {
  return String(playerName || '').trim();
}

function playerExists(players, playerName) {
  const normalizedName = normalizePlayerName(playerName).toLowerCase();
  return players.some((player) => normalizePlayerName(player.player).toLowerCase() === normalizedName);
}

function addPlayerToRoster(players, playerName, rank = 'A') {
  const normalizedName = normalizePlayerName(playerName);
  if (!normalizedName) {
    throw new Error('Player name is required.');
  }

  if (playerExists(players, normalizedName)) {
    throw new Error(`Player "${normalizedName}" already exists.`);
  }

  const validRank = ['A', 'B', 'C'].includes(rank) ? rank : 'A';

  return [
    ...players,
    {
      player: normalizedName,
      previousRank: validRank,
    },
  ];
}

module.exports = {
  normalizePlayerName,
  playerExists,
  addPlayerToRoster,
};
