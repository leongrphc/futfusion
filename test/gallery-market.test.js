const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const code = fs.readFileSync(path.join(__dirname, '../src/page/gallery-market.js'), 'utf8');
function fixture(options = {}) {
  let now = 1000, persona = 'a';
  const calls = [];
  const card = { defId: 101, rating: 86, rarityId: 1 };
  const items = [5000, 1000, 2000].map((price, i) => ({ id: 200 + i, pile: 7, definitionId: 101, rating: 86, rareflag: 1, isTradeable: () => true, getFoilSubtype: () => -1,
    _auction: { buyNowPrice: price, tradeId: String(i + 1), expires: 1000 } }));
  const observable = (success, data) => ({ observe(owner, cb) { queueMicrotask(() => cb(this, { success, status: success ? 200 : 500, data, ...(success ? { error: options.successErrorValue } : {}) })); }, unobserve() {} });
  const Item = {
    searchTransferMarket(criteria) {
      calls.push({ type: 'search', max: criteria.maxBuy, min: criteria.minBuy });
      if (options.strictPriceSteps) {
        const p = criteria.maxBuy;
        const step = p < 1000 ? 50 : p < 10000 ? 100 : p < 50000 ? 250 : p < 100000 ? 500 : 1000;
        if (p < 200 || p % step !== 0) return observable(false);
      }
      // Deliberately expose the expensive result first, not sorted by price.
      const matching = items.filter((item) => item._auction.buyNowPrice <= criteria.maxBuy && (!criteria.minBuy || item._auction.buyNowPrice >= criteria.minBuy));
      return observable(true, { items: matching.slice(0, 1) });
    },
    bid(item, price) { calls.push({ type: 'bid', price, item }); return observable(!options.failBid); },
    move(item, pile) { calls.push({ type: 'move', pile }); if (!options.failMove) item.pile = pile; return observable(!options.failMove); },
    requestTransferItems() { calls.push({ type: 'transfer-read' }); return observable(true, { items: items.filter((item) => item.pile === 5) }); },
    list(item, start, bin, duration) {
      calls.push({ type: 'list', id: item.id, start, bin, duration });
      if (!options.failList && !options.noActivation) item._auction = { tradeId: 'listed-' + item.id, buyNowPrice: bin, startingBid: start, tradeState: 'active', tradeOwner: true, expires: 3600 };
      return observable(!options.failList);
    },
  };
  const FutFox = { fut: { galleryMemory: () => ({ persona }), knownClubItems: () => options.club || [] }, galleryTrades: { cardKey: (c) => String(c.defId) } };
  vm.runInNewContext(code, { FutFox, services: { Item, Club: { search: () => observable(true, { items: options.clubMissing ? [] : items.filter((item) => item.pile === 7) }) } }, UTSearchCriteriaDTO: class {},
    Date: { now: () => now }, setTimeout: (cb, ms) => [500, 1000].includes(ms) ? (queueMicrotask(cb), 0) : setTimeout(cb, ms), clearTimeout });
  return { market: FutFox.galleryMarket, card, calls, items, advance: () => now += 61000, setPersona: (p) => persona = p };
}
test('find discovers cheaper listings beyond first page without buying', async () => {
  const f = fixture(); const quote = await f.market.find(f.card);
  assert.equal(quote.price, 1000);
  assert.ok(f.calls.length > 1);
  assert.ok(f.calls.every((c) => c.type === 'search'));
});
test('price discovery only sends valid native market price steps', async () => {
  const f = fixture({ strictPriceSteps: true });
  const quote = await f.market.find(f.card);
  assert.equal(quote.price, 1000);
  for (const call of f.calls.filter((c) => c.type === 'search')) {
    const p = call.max, step = p < 1000 ? 50 : p < 10000 ? 100 : p < 50000 ? 250 : p < 100000 ? 500 : 1000;
    assert.ok(p >= 200); assert.equal(p % step, 0);
  }
});
test('minimum-price 200 coin card never searches below the Buy Now minimum', async () => {
  const f = fixture({ strictPriceSteps: true }); f.items[0]._auction.buyNowPrice = 200;
  const quote = await f.market.find(f.card);
  assert.equal(quote.price, 200); assert.equal(f.calls.length, 1);
});
test('successful EA replies with error=false or error=0 are not mistaken for failures', async () => {
  for (const successErrorValue of [false, 0, { code: 0 }]) {
    const f = fixture({ successErrorValue });
    assert.equal((await f.market.find(f.card)).price, 1000);
  }
});
test('buy revalidates exact displayed price then buys once and moves to club', async () => {
  const f = fixture(); const quote = await f.market.find(f.card);
  const result = await f.market.buy(f.card, quote.price);
  assert.equal(result.price, 1000); assert.equal(result.bought, true);
  const bid = f.calls.find((c) => c.type === 'bid'); assert.equal(bid.price, 1000);
  assert.equal(f.calls.at(-1).type, 'move'); assert.equal(f.calls.at(-1).pile, 7);
  await assert.rejects(f.market.buy(f.card, quote.price), /eskidi/);
});
test('expired quote or changed displayed amount never purchases', async () => {
  const f = fixture(); await f.market.find(f.card);
  await assert.rejects(f.market.buy(f.card, 2000), /eskidi/);
  f.advance(); await assert.rejects(f.market.buy(f.card, 1000), /eskidi/);
  assert.ok(!f.calls.some((c) => c.type === 'bid'));
});
test('vanished listing never falls back to a more expensive card', async () => {
  const f = fixture(); await f.market.find(f.card); f.items.splice(1, 1);
  await assert.rejects(f.market.buy(f.card, 1000), /artık yok/);
  assert.ok(!f.calls.some((c) => c.type === 'bid'));
});
test('wrong card version and unavailable foil are rejected', async () => {
  const f = fixture(); f.items.forEach((item) => item.rareflag = 3);
  await assert.rejects(f.market.find(f.card), /bulunamadı/);
  f.items.forEach((item) => item.rareflag = 1);
  await assert.rejects(f.market.find({ ...f.card, foil: true }), /bulunamadı/);
});
test('purchase error is uncertain and blocks automatic retries and fresh searches', async () => {
  const f = fixture({ failBid: true }); await f.market.find(f.card);
  await assert.rejects(f.market.buy(f.card, 1000), (e) => e.uncertain === true);
  await assert.rejects(f.market.find(f.card), /belirsiz/);
  assert.equal(f.calls.filter((c) => c.type === 'bid').length, 1);
});
test('move failure reports a successful purchase with separate move error', async () => {
  const f = fixture({ failMove: true }); await f.market.find(f.card);
  const result = await f.market.buy(f.card, 1000);
  assert.equal(result.bought, true); assert.equal(result.price, 1000); assert.ok(result.moveError);
});
test('account switch invalidates quote without purchase', async () => {
  const f = fixture(); await f.market.find(f.card); f.setPersona('b');
  assert.equal(f.market.peek(f.card), null);
  await assert.rejects(f.market.buy(f.card, 1000), /eskidi/);
  assert.ok(!f.calls.some((c) => c.type === 'bid'));
});
test('overlapping market calls are blocked', async () => {
  const f = fixture(); const running = f.market.find(f.card);
  await assert.rejects(f.market.find(f.card), /sürüyor/);
  await running;
});

test('bulk capped buy revalidates stale preview without exceeding its cap', async () => {
  const f = fixture(); await f.market.find(f.card); f.advance();
  const result = await f.market.buyAtMost(f.card, 1200);
  assert.equal(result.price, 1000); assert.equal(result.itemId, '201');
  assert.equal(f.calls.filter((c) => c.type === 'bid').length, 1);
});
test('bulk capped buy with no remaining acceptable listing does not spend', async () => {
  const f = fixture();
  await assert.rejects(f.market.buyAtMost(f.card, 950), /kalma/);
  assert.ok(!f.calls.some((c) => c.type === 'bid'));
});
test('lists only the purchased instance at its own purchase price for one hour', async () => {
  const f = fixture(); const purchase = await f.market.buyAtMost(f.card, 1000);
  const entry = { card: f.card, bought: true, confirmed: true, buy: 1000, purchasedItemId: purchase.itemId };
  const result = await f.market.listAtPurchasePrice(entry);
  assert.equal(result.listed, true); assert.equal(result.itemId, '201');
  const listing = f.calls.find((c) => c.type === 'list');
  assert.deepEqual(listing, { type: 'list', id: 201, start: 950, bin: 1000, duration: 3600 });
  assert.ok(f.calls.some((c) => c.type === 'move' && c.pile === 5));
  assert.equal(f.calls.at(-1).type, 'transfer-read');
});
test('listing requires Gallery confirmation and exact acquired item ID', async () => {
  const f = fixture();
  await assert.rejects(f.market.listAtPurchasePrice({ card: f.card, bought: true, buy: 1000 }), /doğrulaması/);
  await assert.rejects(f.market.listAtPurchasePrice({ card: f.card, bought: true, confirmed: true, buy: 1000 }), /ID/);
  await assert.rejects(f.market.listAtPurchasePrice({ card: f.card, bought: true, confirmed: true, buy: 1000, purchasedItemId: '999' }), /bulunamadı/);
  assert.ok(!f.calls.some((c) => c.type === 'list'));
});
test('listing failure is marked uncertain; invalid price steps are rejected', async () => {
  const f = fixture({ failList: true }); const p = await f.market.buyAtMost(f.card, 1000);
  const entry = { card: f.card, bought: true, confirmed: true, buy: 1000, purchasedItemId: p.itemId };
  await assert.rejects(f.market.listAtPurchasePrice({ ...entry, buy: 1001 }), /fiyatı/);
  await assert.rejects(f.market.listAtPurchasePrice(entry), (error) => error.uncertain === true);
  assert.equal(f.calls.filter((c) => c.type === 'list').length, 1);
});
test('legacy matching refuses multiple tradable copies and never sells during binding', () => {
  const club = [{ id: 1, definitionId: 101, rating: 86, rareflag: 1, isTradeable: () => true }];
  const f = fixture({ club });
  assert.equal(f.market.bindOwned(f.card), '1');
  club.push({ ...club[0], id: 2 });
  assert.throws(() => f.market.bindOwned(f.card), /tek bir/);
  assert.equal(f.calls.length, 0);
});
test('successful list response without an active auction never reports listed', async () => {
  const f = fixture({ noActivation: true }); const p = await f.market.buyAtMost(f.card, 1000);
  const entry = { card: f.card, bought: true, confirmed: true, buy: 1000, purchasedItemId: p.itemId };
  await assert.rejects(f.market.listAtPurchasePrice(entry), (error) => error.uncertain && /aktif satış ilanı/.test(error.message));
  assert.equal(f.calls.filter((c) => c.type === 'list').length, 1);
});
test('club entry is checked by exact instance before automated resale', async () => {
  const f = fixture(); const p = await f.market.buyAtMost(f.card, 1000);
  const verified = await f.market.ensureClubEntry({ card: f.card, purchasedItemId: p.itemId });
  assert.equal(verified.confirmed, true); assert.equal(verified.itemId, '201');
});
test('missing club read does not falsely confirm entry', async () => {
  const f = fixture({ clubMissing: true }); const p = await f.market.buyAtMost(f.card, 1000);
  await assert.rejects(f.market.ensureClubEntry({ card: f.card, purchasedItemId: p.itemId }), /doğrulanamadı/);
  assert.equal(f.calls.filter((c) => c.type === 'list').length, 0);
});
test('starting bid uses the correct tier immediately below Buy Now', () => {
  const f = fixture();
  for (const [buy, start] of [[200, 150], [1000, 950], [10000, 9900], [50000, 49750], [100000, 99500]]) assert.equal(f.market.previousPrice(buy), start);
});
test('explicit listing target is respected and sold status requires exact sold instance', async () => {
  const f = fixture(); await f.market.find(f.card);
  const purchase = await f.market.buy(f.card, 1000);
  const entry = { card: f.card, bought: true, confirmed: true, buy: 1000, listPrice: 1100, purchasedItemId: purchase.itemId };
  const listed = await f.market.listAtPurchasePrice(entry);
  assert.equal(listed.price, 1100); assert.equal(listed.startingBid, 1000);
  const item = f.items.find((item) => String(item.id) === purchase.itemId);
  assert.equal((await f.market.inspectSale(entry)).state, 'listed');
  item._auction = { tradeId: 'sold-1', isSold: () => true, currentBid: 1050 };
  const sale = await f.market.inspectSale(entry);
  assert.equal(sale.state, 'sold'); assert.equal(sale.price, 1050);
  assert.equal((await f.market.inspectSale({ ...entry, purchasedItemId: 'unknown' })).state, 'unknown');
});
