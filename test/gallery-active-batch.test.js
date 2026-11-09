const test = require('node:test');
const assert = require('node:assert/strict');
const T = require('../src/core/gallery-trades');
const card = (id) => ({ defId: id, playerId: id, rating: 80, rarityId: 1, leagueId: 10, name: `Card ${id}` });
const target = (id) => ({ id, name: `Team ${id}`, slots: [{ slot: { kind: 'rule', leagueId: 10 } }] });
test('new team replaces work scope instead of processing old compatible history', () => {
  const a = target('a'), b = target('b');
  const first = T.addPlan(T.empty(), { adds: [{ card: card(1) }] }, a, [a, b], [], 1).ledger;
  first.entries[0].bought = true; first.entries[0].buy = 1000;
  const next = T.addPlan(first, { adds: [{ card: card(2) }] }, b, [a, b], [], 2).ledger;
  assert.equal(next.entries.length, 2);
  assert.ok(next.entries[0].sets.some((s) => s.id === 'b'), 'old card may fit the same set; that must not select it');
  assert.deepEqual(T.activeEntries(next).map((e) => e.card.defId), [2]);
  assert.deepEqual(T.activeEntries(next, 'a'), []);
  assert.equal(next.entries[0].buy, 1000); assert.equal(next.entries[0].bought, true);
});
test('already purchased historical card is not adopted by another fetched team', () => {
  const a = target('a'), b = target('b');
  const first = T.addPlan(T.empty(), { adds: [{ card: card(1) }] }, a, [a, b], [], 1).ledger;
  first.entries[0].bought = true;
  const next = T.addPlan(first, { adds: [{ card: card(1) }, { card: card(2) }] }, b, [a, b], [], 2).ledger;
  assert.deepEqual(T.activeEntries(next).map((e) => e.card.defId), [2]);
});
test('same active team can resume its own bought items until a new import replaces it', () => {
  const a = target('a');
  const first = T.addPlan(T.empty(), { adds: [{ card: card(1) }] }, a, [a], [], 1).ledger;
  first.entries[0].bought = true;
  assert.deepEqual(T.activeEntries(T.read(first)).map((e) => e.card.defId), [1]);
});
test('legacy history without an explicit active group never becomes an implicit queue', () => {
  const a = target('a');
  const first = T.addPlan(T.empty(), { adds: [{ card: card(1) }] }, a, [a], [], 1).ledger;
  delete first.activeBatch;
  assert.equal(T.read(first).entries.length, 1);
  assert.deepEqual(T.activeEntries(T.read(first)), []);
});
test('new group resets old budget and a completed/known new selection has no work', () => {
  const a = target('a');
  const first = T.addPlan(T.empty(), { adds: [{ card: card(1) }] }, a, [a], [], 1).ledger;
  first.workflowBudget = 500000;
  const next = T.addPlan(first, { adds: [{ card: card(2) }] }, a, [a], [card(2)], 2).ledger;
  assert.equal(next.workflowBudget, null); assert.deepEqual(T.activeEntries(next), []);
});
