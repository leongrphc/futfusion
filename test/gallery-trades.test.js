const test = require('node:test');
const assert = require('node:assert/strict');
const T = require('../src/core/gallery-trades');
const card = { defId: 101, playerId: 1, rating: 86, rarityId: 1, name: 'Player', leagueId: 10, score: 4100 };
const results = [
  { id: 'a', name: 'Exact', slots: [{ slot: { kind: 'card', playerId: 1, rating: 86, rarityId: 1 } }] },
  { id: 'b', name: 'League', slots: [{ slot: { kind: 'rule', leagueId: 10 } }, { slot: { kind: 'rule', leagueId: 10 } }] },
  { id: 'c', name: 'Complete', slots: [{ slot: { kind: 'rule', leagueId: 10 }, done: true }] },
];

test('one card counts distinct missing sets, never compatible slot count', () => {
  assert.deepEqual(T.contributions(card, results).map((s) => s.id), ['a', 'b']);
});
test('adding the same plan twice merges set links without duplicate purchase', () => {
  const plan = { adds: [{ index: 0, card }, { index: 1, card }] };
  const first = T.addPlan(T.empty(), plan, results[0], results, [], 10);
  const second = T.addPlan(first.ledger, plan, results[1], results, [], 20);
  assert.equal(first.added, 1); assert.equal(second.added, 0);
  assert.equal(second.ledger.entries.length, 1);
  assert.equal(second.ledger.entries[0].sets.length, 2);
  assert.equal(second.ledger.entries[0].createdAt, 10);
  assert.equal(second.ledger.entries[0].buy, null);
});
test('remembered versions and loans are never new purchases', () => {
  const plan = { adds: [{ card }, { card: { ...card, defId: 102, loan: true } }] };
  assert.equal(T.addPlan(T.empty(), plan, results[0], results, [card]).added, 0);
  assert.equal(T.addPlan(T.empty(), { adds: [{ card }] }, results[0], results, [{ ...card, rarityId: 3, defId: 103 }]).added, 1);
});
test('foil and plain cards with the same definition remain distinct', () => {
  const plan = { adds: [{ card }, { card: { ...card, foil: true } }] };
  assert.equal(T.addPlan(T.empty(), plan, results[0], results, []).added, 2);
});
test('stale plan with no missing target slot cannot add purchase', () => {
  const complete = { ...results[0], slots: [{ ...results[0].slots[0], card }] };
  assert.equal(T.addPlan(T.empty(), { adds: [{ card }] }, complete, [complete], []).added, 0);
});
test('net cost includes configurable tax and may show profit', () => {
  assert.deepEqual(T.economics({ buy: 1000, sell: 1000 }, 5), { buy: 1000, sell: 1000, tax: 50, proceeds: 950, cost: 50 });
  assert.equal(T.economics({ buy: 1000, sell: 1200 }, 5).cost, -140);
  assert.equal(T.economics({ buy: 1000, sell: 1001 }, 5).tax, 51);
  assert.equal(T.economics({ buy: 1000, sell: 1000 }, 0).cost, 0);
});
test('unknown prices are excluded from net totals and explicitly counted', () => {
  const ledger = { ...T.empty(), entries: [{ buy: 1000, sell: 1000 }, { buy: 500, sell: null }, { buy: null, sell: 200 }] };
  const summary = T.summarize(ledger);
  assert.equal(summary.purchaseBudget, 1500);
  assert.equal(summary.projectedCost, 50);
  assert.equal(summary.unknownBuy, 1);
  assert.equal(summary.unknownCost, 2);
});
test('invalid or missing prices never silently become zero', () => {
  for (const value of [null, undefined, '', -1, 1.5, Infinity, 'abc']) assert.equal(T.finitePrice(value), null);
  assert.equal(T.finitePrice('0'), 0);
});
test('reading is schema-aware, deduplicates and does not mutate input', () => {
  assert.deepEqual(T.read({ schema: 2, entries: [] }), T.empty());
  const raw = { schema: 1, taxPercent: 200, entries: [{ card, sets: [], buy: -20 }, { card, sets: [] }, null] };
  const out = T.read(raw);
  assert.equal(out.entries.length, 1); assert.equal(out.entries[0].buy, null);
  assert.equal(out.taxPercent, 5); assert.equal(raw.entries[0].buy, -20);
});
