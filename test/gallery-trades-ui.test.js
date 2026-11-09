const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const code = fs.readFileSync(path.join(__dirname, '../src/page/gallery-trades.js'), 'utf8');
const core = require('../src/core/gallery-trades');

function fixture() {
  let persona = 'account-a', tree, writes = 0;
  const storage = new Map();
  const card = { defId: 101, playerId: 1, rating: 86, rarityId: 1, name: '<Player>', score: 4100 };
  const res = { id: 'set-a', name: 'Set A', slots: [{ slot: { kind: 'card', playerId: 1, rarityId: 1, rating: 86 } }] };
  const known = [];
  const FutFox = { galleryTrades: core, fut: { galleryMemory: () => ({ persona }), galleryCards: () => known } };
  const localStorage = { getItem: (key) => storage.get(key) ?? null, setItem: (key, value) => { writes++; storage.set(key, value); } };
  vm.runInNewContext(code, { FutFox, localStorage });
  const el = (tag, attrs = {}, children = []) => ({ tag, attrs, children });
  const render = () => tree = FutFox.galleryTradeUI.render({ el, results: [res], res, plan: { adds: [{ card }] }, rerender: render });
  const nodes = (node) => [node, ...(node.children || []).flatMap((child) => child && typeof child === 'object' ? nodes(child) : [])];
  const find = (text) => nodes(tree).find((node) => node.attrs.text === text);
  render();
  return { render, find, nodes: () => nodes(tree), storage, card, known, localStorage,
    writes: () => writes, setPersona: (value) => { persona = value; render(); }, setMarket: (market) => { FutFox.galleryMarket = market; render(); },
    setBatch: (batch) => { FutFox.galleryBatch = batch; render(); },
    read: () => JSON.parse(storage.get(`futfusion.galleryTrades.v1.${persona}`)) };
}

test('render alone never writes storage; add-plan persists under separate account key', () => {
  const f = fixture(); assert.equal(f.writes(), 0);
  f.find('Önerilen eksikleri listeye ekle').attrs.onclick();
  assert.equal(f.read().entries.length, 1);
  assert.ok(f.storage.has('futfusion.galleryTrades.v1.account-a'));
  assert.equal(f.storage.has('futfox.galleryMemory.account-a'), false);
  f.setPersona('account-b');
  assert.equal(f.nodes().filter((n) => n.attrs.class === 'trade-entry').length, 0);
});
test('prices and manual confirmation gate sold status; refresh preserves ledger', () => {
  const f = fixture(); f.find('Önerilen eksikleri listeye ekle').attrs.onclick();
  assert.equal(f.find('Sattım').attrs.disabled, true);
  const price = (label, value) => {
    const field = f.nodes().find((n) => n.tag === 'label' && n.children[0]?.attrs.text === label);
    field.children[1].attrs.onchange({ target: { value } });
  };
  price('Alış fiyatı', '1000'); price('Satış fiyatı / beklenti', '1100');
  assert.equal(f.find('Sattım').attrs.disabled, true);
  f.find('Gallery’de doğruladım').attrs.onclick();
  assert.equal(f.find('Sattım').attrs.disabled, false);
  f.find('Sattım').attrs.onclick(); f.render();
  assert.equal(f.read().entries[0].sold, true);
  assert.equal(f.nodes().find((n) => n.attrs.class === 'trade-entry').attrs.open, false);
});
test('remembered card is shown as observed without silently confirming Gallery', () => {
  const f = fixture(); f.find('Önerilen eksikleri listeye ekle').attrs.onclick();
  f.known.push(f.card); f.render();
  assert.ok(f.find('Hafızada'));
  assert.equal(f.read().entries[0].confirmed, false);
});
test('broken saved JSON is reported and never overwritten', () => {
  const f = fixture(); f.storage.set('futfusion.galleryTrades.v1.account-a', '{broken'); f.render();
  assert.equal(f.find('Önerilen eksikleri listeye ekle').attrs.disabled, true);
  assert.ok(f.nodes().some((n) => n.attrs.text?.includes('üzerine yazılmadı')));
  assert.equal(f.storage.get('futfusion.galleryTrades.v1.account-a'), '{broken');
});
test('storage write failure reports an error without false persistence', () => {
  const f = fixture(); f.localStorage.setItem = () => { throw new Error('quota'); };
  f.find('Önerilen eksikleri listeye ekle').attrs.onclick();
  assert.ok(f.nodes().some((n) => n.attrs.text?.includes('kaydedilemedi')));
  assert.equal(f.storage.size, 0);
});

test('market search shows price without buying; explicit buy records actual cost', async () => {
  const f = fixture(); let quote = null, buys = 0;
  f.setMarket({ peek: () => quote, find: async () => quote = { price: 1250, expired: false },
    buy: async (card, amount) => { assert.equal(amount, 1250); buys++; return { bought: true, price: 1250, moveError: null }; } });
  f.find('Önerilen eksikleri listeye ekle').attrs.onclick();
  await f.find('En ucuzu bul').attrs.onclick();
  assert.equal(buys, 0);
  assert.equal(f.find('1.250 coin — Satın al').attrs.disabled, false);
  await f.find('1.250 coin — Satın al').attrs.onclick();
  assert.equal(buys, 1); assert.equal(f.read().entries[0].buy, 1250);
  assert.equal(f.read().entries[0].bought, true);
  assert.equal(f.read().entries[0].purchaseState, null);
});
test('uncertain buy persists a lock across UI reloads', async () => {
  const f = fixture();
  f.setMarket({ peek: () => ({ price: 1250, expired: false }), buy: async () => {
    const error = new Error('Belirsiz alış'); error.uncertain = true; throw error;
  } });
  f.find('Önerilen eksikleri listeye ekle').attrs.onclick();
  await f.find('1.250 coin — Satın al').attrs.onclick();
  f.render();
  assert.equal(f.read().entries[0].purchaseState, 'unknown');
  assert.equal(f.find('En ucuzu bul').attrs.disabled, true);
  assert.equal(f.find('1.250 coin — Satın al').attrs.disabled, true);
});
test('batch failure keeps player name and real EA error visible after summary replaces progress', async () => {
  const f = fixture();
  f.find('Önerilen eksikleri listeye ekle').attrs.onclick();
  f.setBatch({ run: async ({ entries, progress }) => {
    progress({ entry: entries[0], index: 1, total: 1, text: 'EA işlem hatası: 429. Arama hız sınırı.', error: true, summary: { failed: 1 } });
    return { done: 0, failed: 1, skipped: 0, stopped: true };
  } });
  await f.find('1 · 1 kartın fiyatını bul').attrs.onclick();
  assert.ok(f.find('Durduruldu · 0 başarılı · 1 hata · 0 atlandı'));
  assert.ok(f.find('Son hata: <Player>: EA işlem hatası: 429. Arama hız sınırı.'));
});
test('resuming a team passes only the unspent portion of its persistent total budget', async () => {
  const f = fixture(); let suppliedBudget;
  f.localStorage.setItem('futfusion.galleryTrades.v1.account-a', JSON.stringify({ ...core.empty(), workflowBudget: 5000,
    activeBatch: { id: 'resume', targetId: 'set-a', name: 'Resume team', keys: ['101:base', '102:base'] },
    entries: [{ card: f.card, sets: [], bought: true, buy: 1000, purchasedItemId: 'owned-1' }, { card: { ...f.card, defId: 102 }, sets: [] }] }));
  f.setMarket({ peek: () => ({ price: 2000 }), validPrice: () => true });
  f.setBatch({ run: async (options) => { suppliedBudget = options.budget; return { done: 0, failed: 0, skipped: 0, spent: 0 }; } });
  await f.find('Tümünü yap · 2 kart · 5.000 coin bütçe').attrs.onclick();
  assert.equal(suppliedBudget, 4000);
  assert.equal(f.read().workflowBudget, 5000);
});
