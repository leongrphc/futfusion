const test = require('node:test');
const assert = require('node:assert/strict');
const E = require('../src/core/squad-editor');
const R = require('../src/core/requirements');
const { DEFAULT_PROFILES } = require('../src/core/chemistry');
const { solve } = require('../src/core/solver');
const player = (id, teamId = 1) => ({ id, playerId: id, defId: id + 100, teamId, clubId: 999, name: `Player ${id}`, rating: 74, quality: 2, nationId: 1, leagueId: 1, rarity: 0, positions: [0, 5], profile: DEFAULT_PROFILES.base, cost: 100, source: 'club' });
const clubRule = { key: R.KEY.CLUB_ID, scope: 'min', ids: [2, 3], count: 1, value: 2, label: 'Club 2 OR Club 3: Min 1', supported: true };
const result = () => ({ required: new Set([0, 1]), rules: [clubRule], squad: [{ typeId: 0, player: player(1) }, { typeId: 5, player: player(2) }] });

test('remove leaves only that slot empty and recalculates feasibility, cost and rules', () => {
  const original = result();
  const edited = E.evaluate(E.setPlayer(original, 0, null));
  assert.equal(edited.squad[0].player, null); assert.equal(edited.squad[1].player.id, 2);
  assert.equal(edited.feasible, false); assert.equal(edited.cost, 100);
  assert.equal(original.squad[0].player.id, 1);
});
test('manual addition updates club requirement immediately without changing other players', () => {
  const edited = E.evaluate(E.setPlayer(result(), 0, player(3, 2)));
  assert.equal(edited.feasible, true); assert.equal(edited.ruleResults[0].shortfall, 0);
  assert.equal(edited.squad[1].player.id, 2);
});
test('specific club OR requirement checks actual team, not linked chemistry club', () => {
  assert.equal(R.cardMeets(clubRule, player(1, 3)), true);
  assert.equal(R.cardMeets(clubRule, { ...player(1, 9), clubId: 2 }), false);
  assert.equal(R.shortfall(clubRule, { players: [player(1, 2)] }), 0);
});
test('rejects locked slots and another version of the same player', () => {
  const r = result(); r.required = new Set([0]);
  assert.throws(() => E.setPlayer(r, 1, null), /düzenlenemez/);
  assert.throws(() => E.setPlayer(result(), 0, { ...player(2), id: 99, defId: 999 }), /başka sürümü/);
});
test('EA chemistry overrides estimate for rule revalidation after manual edits', () => {
  const r = result(); r.rules = [{ key: R.KEY.CHEMISTRY_POINTS, scope: 'min', value: 3, supported: true }];
  const edited = E.evaluate(r, { eaChem: { total: 0, perPlayer: [0, 0] } });
  assert.equal(edited.feasible, false); assert.equal(edited.ruleResults[0].shortfall, 3);
});
test('solver keeps manual fixed card and repairs missing team requirement', () => {
  const fixed = player(50, 2);
  const r = solve({ slots: [{ typeId: 0 }, { typeId: 5 }], rules: [clubRule], pool: [fixed, player(2), player(3)], fixed: { 1: fixed }, iterations: 200, restarts: 1 });
  assert.equal(r.squad[1].player, fixed); assert.equal(r.feasible, true);
});
test('solver directly finds rare club candidates and avoids duplicate player versions', () => {
  const pool = Array.from({ length: 100 }, (_, i) => player(i + 1));
  const rare = player(500, 2); rare.cost = 1000; pool.push(rare, { ...player(1), defId: 9000 });
  const r = solve({ slots: [{ typeId: 0 }, { typeId: 5 }], rules: [clubRule], pool, iterations: 1000, restarts: 1, seed: 3 });
  assert.equal(r.feasible, true); assert.ok(r.squad.some((s) => s.player.teamId === 2));
  assert.equal(new Set(r.squad.map((s) => s.player.playerId)).size, 2);
});
