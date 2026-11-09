const test = require('node:test');
const assert = require('node:assert/strict');
const C = require('../src/core/gallery-trades');
const entry = (id, props = {}) => ({ card: { defId: id, name: `Player ${id}` }, sets: [], buy: 1000, sell: 1100, bought: true, ...props });
test('accounting separates actual profit from unsold expectations', () => {
  const ledger = C.read({ ...C.empty(), entries: [entry(1, { sold: true }), entry(2), entry(3, { bought: false })] });
  assert.deepEqual(C.accounting(ledger), { spent: 2000, revenue: 1045, realized: 45, tied: 1000, expected: 1045, unknownSales: 0 });
});
test('backup rejects a different account and clears automatic work scope while preserving uncertain locks', () => {
  const ledger = C.read({ ...C.empty(), activeBatch: { id: 'a', name: 'A', keys: ['1:base'] }, workflowBudget: 10000, entries: [entry(1, { purchaseState: 'unknown' })] });
  const saved = C.backup(ledger, 'a');
  assert.throws(() => C.restore(saved, 'b'));
  const restored = C.restore(saved, 'a');
  assert.equal(restored.activeBatch, null); assert.equal(restored.workflowBudget, null);
  assert.equal(restored.entries[0].purchaseState, 'unknown');
});
test('journal survives normalization and records actual status transitions', () => {
  const ledger = C.read({ ...C.empty(), entries: [entry(1)] });
  const updated = C.record(ledger, '1:base', { listingState: 'listed', listingVerified: true }, '', 123);
  assert.equal(C.read(updated).events[0].text, 'Satışta');
  assert.equal(C.stage({ purchaseState: 'unknown' }), 'Kontrol gerekiyor');
});
test('break-even rounds up to valid price steps and refuses impossible tax', () => {
  assert.equal(C.breakEven(1000, 5), 1100);
  assert.equal(C.breakEven(9500, 5), 10000);
  assert.equal(C.breakEven(1000, 100), null);
});
