const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const code = fs.readFileSync(path.join(__dirname, '../src/page/gallery-batch.js'), 'utf8');
function fixture(options = {}) {
  const rows = new Map([1, 2].map((id) => [String(id), { key: String(id), card: { name: `Card ${id}`, defId: id }, cap: id * 1000 }]));
  const calls = [], events = [];
  let persona = 'a';
  const FutFox = { fut: { galleryMemory: () => ({ persona }) }, galleryMarket: {
    find: async (card, progress) => { calls.push(['find', card.defId]); progress('Searching'); return { price: card.defId * 1000 }; },
    buyAtMost: async (card, cap) => {
      assert.equal(rows.get(String(card.defId)).purchaseState, 'pending');
      calls.push(['buy', card.defId, cap]);
      if (options.uncertain) { const error = new Error('Belirsiz'); error.uncertain = true; throw error; }
      if (options.missing && card.defId === 1) throw new Error('İlan kalmadı.');
      if (options.cancel) FutFox.galleryBatch.cancel();
      return { price: cap - 50, itemId: String(100 + card.defId) };
    },
    listAtPurchasePrice: async (entry) => { calls.push(['list', entry.key, entry.buy]); return { price: entry.buy }; },
    inspectListing: async () => options.listStatus || 'missing',
    ensureClubEntry: async (entry) => { calls.push(['club', entry.key]); return { confirmed: !options.noClubConfirm }; },
    bindOwnedForWorkflow: async (card) => String(card.defId + 100),
  } };
  vm.runInNewContext(code, { FutFox, setTimeout: (cb) => (queueMicrotask(cb), 0) });
  const run = (mode, extra = {}) => FutFox.galleryBatch.run({ mode, entries: [...rows.values()].map((e) => ({ ...e })),
    getEntry: (key) => rows.get(key),
    write: (key, patch) => { if (options.failWrite) throw new Error('Storage full'); rows.set(key, { ...rows.get(key), ...patch }); },
    progress: (event) => events.push(event), ...extra });
  return { rows, calls, events, run, batch: FutFox.galleryBatch, setPersona: (p) => persona = p };
}
test('bulk find only researches prices in sequence', async () => {
  const f = fixture(); const result = await f.run('find');
  assert.deepEqual(f.calls, [['find', 1], ['find', 2]]); assert.equal(result.done, 2);
});
test('bulk buy uses each displayed cap and persists actual price and item instance', async () => {
  const f = fixture(); const result = await f.run('buy');
  assert.deepEqual(f.calls, [['buy', 1, 1000], ['buy', 2, 2000]]);
  assert.equal(result.done, 2); assert.equal(f.rows.get('1').buy, 950);
  assert.equal(f.rows.get('2').purchasedItemId, '102'); assert.equal(f.rows.get('2').purchaseState, null);
});
test('uncertain purchase stops queue and persists lock without trying next card', async () => {
  const f = fixture({ uncertain: true }); const result = await f.run('buy');
  assert.equal(result.stopped, true); assert.equal(f.calls.length, 1);
  assert.equal(f.rows.get('1').purchaseState, 'unknown');
});
test('storage failure prevents purchase before any request', async () => {
  const f = fixture({ failWrite: true }); const result = await f.run('buy');
  assert.equal(f.calls.length, 0); assert.equal(result.stopped, true);
});
test('cancellation finishes current purchase and prevents next card', async () => {
  const f = fixture({ cancel: true }); const result = await f.run('buy');
  assert.equal(result.done, 1); assert.equal(result.stopped, true); assert.equal(f.calls.length, 1);
});
test('missing listing is skipped while other cards proceed without higher-price substitution', async () => {
  const f = fixture({ missing: true }); const result = await f.run('buy');
  assert.equal(result.failed, 1); assert.equal(result.done, 1); assert.equal(f.rows.get('1').bought, undefined);
});
test('listing stores listed status separately from sold and uses own buy prices', async () => {
  const f = fixture();
  for (const [key, row] of f.rows) f.rows.set(key, { ...row, bought: true, confirmed: true, buy: Number(key) * 1000 });
  const result = await f.run('list'); assert.equal(result.done, 2);
  assert.deepEqual(f.calls, [['list', '1', 1000], ['list', '2', 2000]]);
  assert.equal(f.rows.get('1').listingState, 'listed'); assert.equal(f.rows.get('1').sold, undefined);
});
test('already purchased or uncertain entries are excluded from repeated runs', async () => {
  const f = fixture(); await f.run('buy'); const result = await f.run('buy');
  assert.equal(result.skipped, 2); assert.equal(f.calls.length, 2);
});
test('Gallery-unconfirmed cards never get listed', async () => {
  const f = fixture(); f.rows.set('1', { ...f.rows.get('1'), bought: true, buy: 1000 });
  const result = await f.run('list'); assert.equal(result.skipped, 2); assert.equal(f.calls.length, 0);
});
test('one-click workflow finds, buys, verifies club entry and lists every card', async () => {
  const f = fixture(); const result = await f.run('all', { budget: 3000 });
  assert.equal(result.done, 2); assert.equal(result.spent, 2900);
  assert.deepEqual(f.calls, [['find', 1], ['buy', 1, 1000], ['club', '1'], ['list', '1', 950], ['find', 2], ['buy', 2, 2000], ['club', '2'], ['list', '2', 1950]]);
  assert.equal(f.rows.get('1').confirmed, true); assert.equal(f.rows.get('2').listingVerified, true);
});
test('one-click workflow never exceeds the total purchase budget', async () => {
  const f = fixture(); const result = await f.run('all', { budget: 1500 });
  assert.equal(result.spent, 950); assert.equal(f.calls.filter((c) => c[0] === 'buy').length, 1);
  assert.equal(f.rows.get('2').bought, undefined);
});
test('one-click workflow resumes existing buys without buying again or needing manual per-card approval', async () => {
  const f = fixture();
  for (const [key, row] of f.rows) f.rows.set(key, { ...row, bought: true, buy: Number(key) * 1000, purchasedItemId: String(Number(key) + 100) });
  const result = await f.run('all', { budget: 0 });
  assert.equal(result.done, 2); assert.equal(result.spent, 0);
  assert.ok(f.calls.every((c) => c[0] !== 'buy' && c[0] !== 'find'));
  assert.equal(f.rows.get('1').listingState, 'listed');
});
test('one-click workflow does not sell until club entry is verified', async () => {
  const f = fixture({ noClubConfirm: true }); const result = await f.run('all', { budget: 3000 });
  assert.equal(result.failed, 2); assert.equal(f.calls.filter((c) => c[0] === 'list').length, 0);
  assert.equal(f.rows.get('1').bought, true); assert.notEqual(f.rows.get('1').confirmed, true);
});
test('old unverified listed markers are reconciled and resumed when transfer item is inactive', async () => {
  const f = fixture({ listStatus: 'inactive' });
  for (const [key, row] of f.rows) f.rows.set(key, { ...row, bought: true, buy: 1000, purchasedItemId: '101', listingState: 'listed', listingVerified: false });
  const result = await f.run('all', { budget: 0 });
  assert.equal(result.done, 2); assert.equal(f.calls.filter((c) => c[0] === 'list').length, 2);
  assert.equal(f.rows.get('1').listingVerified, true);
});
test('old markers for already active listings are verified without duplicate listing', async () => {
  const f = fixture({ listStatus: 'listed' });
  for (const [key, row] of f.rows) f.rows.set(key, { ...row, bought: true, buy: 1000, purchasedItemId: '101', listingState: 'unknown' });
  const result = await f.run('all', { budget: 0 });
  assert.equal(result.done, 2); assert.equal(f.calls.length, 0); assert.equal(f.rows.get('1').listingVerified, true);
});
test('one-click workflow stops after uncertain purchase without continuing to sell or buy next', async () => {
  const f = fixture({ uncertain: true }); const result = await f.run('all', { budget: 3000 });
  assert.equal(result.stopped, true); assert.equal(f.calls.filter((c) => c[0] === 'buy').length, 1);
  assert.equal(f.calls.filter((c) => c[0] === 'list').length, 0); assert.equal(f.rows.get('1').purchaseState, 'unknown');
});
