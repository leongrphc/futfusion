const test = require('node:test');
const assert = require('node:assert/strict');
const E = require('../src/core/easysbc-gallery');
const T = require('../src/core/gallery-trades');
const catalog = require('./fixtures/easysbc-catalog.json');
const solution = require('./fixtures/easysbc-solution.json');
const set = E.catalog(catalog)[0];
const clone = (data) => JSON.parse(JSON.stringify(data));
test('reads real public catalog and cumulative token options for console and PC', () => {
  assert.equal(set.id, 1); assert.equal(set.name, 'OGC Nice');
  assert.equal(set.options.find((g) => g.grade === 'S').tokens, 38);
  assert.equal(E.catalog(catalog, 'pc')[0].id, 1);
});
test('reads real S solution with exact EA resource, asset and version IDs', () => {
  const preview = E.preview(solution, set, 'S');
  assert.equal(preview.cards.length, 15);
  assert.equal(preview.cards[0].defId, solution.grades[0].items[0].resourceId);
  assert.equal(preview.cards[0].playerId, solution.grades[0].items[0].player.assetId);
  assert.equal(preview.cards[0].rarityId, solution.grades[0].items[0].player.versionId);
  assert.equal(preview.missing.length, 15);
  assert.equal(preview.cards[0].owners, null);
  assert.ok(preview.url.startsWith('https://www.easysbc.io/tr/fut-gallery/ligue-1/ogc-nice'));
});
test('own memory skips only exact versions and nonloan cards', () => {
  const p = E.preview(solution, set, 'S');
  assert.equal(E.preview(solution, set, 'S', [p.cards[0]]).missing.length, 14);
  assert.equal(E.preview(solution, set, 'S', [{ ...p.cards[0], defId: 999999 }]).missing.length, 15);
  assert.equal(E.preview(solution, set, 'S', [{ ...p.cards[0], loan: true }]).missing.length, 15);
});
test('import merges without overwriting purchased entries or inventing actual buy prices', () => {
  const p = E.preview(solution, set, 'S');
  const first = E.merge(T.empty(), p, [], [p.cards[0]]);
  assert.equal(first.added, 14); assert.equal(first.ledger.entries.length, 14);
  first.ledger.entries[0].bought = true; first.ledger.entries[0].buy = 1234;
  const again = E.merge(first.ledger, p, [], [p.cards[0]]);
  assert.equal(again.added, 0); assert.equal(again.ledger.entries[0].buy, 1234);
  assert.equal(again.ledger.entries[0].bought, true);
  assert.equal(again.ledger.entries[1].buy, null);
  assert.equal(again.ledger.entries[1].sets[0].id, 'easysbc:1');
});
test('rejects wrong set, private solution, malformed IDs and incomplete count', () => {
  assert.throws(() => E.preview({ ...solution, setId: 2 }, set, 'S'), /seçilen/);
  assert.throws(() => E.preview({ ...solution, source: 'club' }, set, 'S'), /piyasa/);
  const malformed = clone(solution); malformed.grades[0].items[0].player.resourceId++;
  assert.throws(() => E.preview(malformed, set, 'S'), /sürümü/);
  const short = clone(solution); short.grades[0].items.pop();
  assert.throws(() => E.preview(short, set, 'S'), /kart sayısı/);
});
test('rejects first-owner assumptions and unavailable or duplicate cards', () => {
  const own = clone(solution); own.grades[0].items[0].firstOwner = true;
  assert.throws(() => E.preview(own, set, 'S'), /ilk sahip/);
  const duplicate = clone(solution); duplicate.grades[0].items[1] = duplicate.grades[0].items[0];
  assert.throws(() => E.preview(duplicate, set, 'S'), /tekrar/);
  const unavailable = clone(solution); unavailable.grades[0].onMarket = false;
  assert.throws(() => E.preview(unavailable, set, 'S'), /erişilebilir/);
});
test('preserves foil distinction and ignores external collected flags', () => {
  const data = clone(solution); data.grades[0].items[0].player.foil = { frames: 27 };
  data.grades[0].items[0].collected = true;
  const preview = E.preview(data, set, 'S');
  assert.equal(preview.cards[0].foil, true); assert.equal(preview.missing.length, 15);
});
