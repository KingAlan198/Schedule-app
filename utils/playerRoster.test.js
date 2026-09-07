const test = require('node:test');
const assert = require('node:assert/strict');
const { addPlayerToRoster, playerExists } = require('./playerRoster');

test('addPlayerToRoster adds a new player with a valid rank', () => {
  const players = [
    { player: 'Alan King', previousRank: 'A' },
    { player: 'Mike Christian', previousRank: 'B' }
  ];

  const result = addPlayerToRoster(players, '  Casey Venema  ', 'C');

  assert.deepEqual(result, [
    { player: 'Alan King', previousRank: 'A' },
    { player: 'Mike Christian', previousRank: 'B' },
    { player: 'Casey Venema', previousRank: 'C' }
  ]);
});

test('addPlayerToRoster rejects duplicate names case-insensitively', () => {
  const players = [{ player: 'Alan King', previousRank: 'A' }];

  assert.throws(() => addPlayerToRoster(players, 'alan king', 'B'), /already exists/i);
});

test('playerExists matches case-insensitive names', () => {
  const players = [{ player: 'Mike Christian', previousRank: 'B' }];

  assert.equal(playerExists(players, 'mike christian'), true);
  assert.equal(playerExists(players, 'New Player'), false);
});
