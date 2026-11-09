// Explicit user-driven Gallery purchases, using the EA market service.
(function (root) {
  'use strict';
  const H = root.FutFox;
  const quotes = new Map();
  const pending = new Set();
  const purchased = new Map();
  let active = false;
  const account = () => String(H.fut.galleryMemory().persona);
  const keyFor = (card) => `${account()}:${H.galleryTrades.cardKey(card)}`;
  const auction = (item) => item?.getAuctionData?.() ?? item?._auction ?? item?.auction ?? {};
  const priceOf = (item) => Number(auction(item).buyNowPrice ?? item?.buyNowPrice);
  const tradeOf = (item) => String(auction(item).tradeId ?? item?.tradeId ?? '');
  const pause = () => new Promise((resolve) => setTimeout(resolve, 500));
  function request(observable) {
    return new Promise((resolve, reject) => {
      const owner = {};
      const timer = setTimeout(() => { observable.unobserve?.(owner); reject(new Error('EA yanıt vermedi.')); }, 20000);
      observable.observe(owner, (obs, result) => {
        clearTimeout(timer); obs.unobserve(owner);
        if (result?.success === true && result.error == null) resolve(result);
        else reject(new Error(`EA işlem hatası: ${result?.error ?? result?.status ?? '?'}`));
      });
    });
  }
  function matches(item, card) {
    const a = auction(item);
    const foil = typeof item?.getFoilSubtype === 'function' ? item.getFoilSubtype() !== -1 : item?.foil;
    return String(item?.definitionId) === String(card.defId) &&
      Number(item.rating) === Number(card.rating) && Number(item.rareflag) === Number(card.rarityId) &&
      (card.foil ? foil === true : foil !== true) &&
      Number.isSafeInteger(priceOf(item)) && priceOf(item) > 0 && !!tradeOf(item) &&
      (a.expires == null || Number(a.expires) > 0) && !['closed', 'expired'].includes(a.tradeState);
  }
  async function search(card, maxBuy, exact = false) {
    const criteria = new root.UTSearchCriteriaDTO();
    criteria.type = root.SearchType?.PLAYER ?? 'player';
    criteria.category = root.SearchCategory?.ANY ?? 'any';
    criteria.defId = [Number(card.defId)];
    criteria.maxBuy = maxBuy;
    if (exact) criteria.minBuy = maxBuy;
    root.services.Item.clearTransferMarketCache?.();
    const result = await request(root.services.Item.searchTransferMarket(criteria, 1));
    const items = result.data?.items ?? result.data?.data?.items ?? result.response?.items ?? result.items;
    if (!Array.isArray(items)) throw new Error('EA piyasa sonucu okunamadı.');
    return items.filter((item) => matches(item, card) && priceOf(item) <= maxBuy && (!exact || priceOf(item) === maxBuy))
      .sort((a, b) => priceOf(a) - priceOf(b));
  }
  function ensureAccount(persona) {
    if (account() !== persona) throw new Error('EA hesabı değişti; aramayı yeniden yap.');
  }
  async function find(card, progress = () => {}) {
    if (active) throw new Error('Bir piyasa işlemi sürüyor.');
    const key = keyFor(card);
    if (pending.has(key)) throw new Error('Önceki alışın sonucu belirsiz. Kulübü ve transfer hedeflerini kontrol edip Web App’i yenile.');
    if (!Number.isSafeInteger(Number(card.defId)) || !Number.isFinite(Number(card.rating)) || card.rarityId == null) throw new Error('Kart sürümü eksik; yeniden öneri hesaplat.');
    active = true;
    quotes.delete(key);
    const persona = account();
    try {
      progress('Piyasada aranıyor…');
      let candidates = await search(card, 15000000);
      ensureAccount(persona);
      if (!candidates.length) throw new Error('Bu kart sürümü için uygun Satın Al ilanı bulunamadı.');
      let best = candidates[0];
      // Existence queries bisect the price range; never assume page one is cheapest.
      let low = 0, high = priceOf(best);
      for (let step = 0; high - low > 1 && step < 25; step++) {
        const mid = Math.floor((low + high) / 2);
        progress(`En düşük fiyat aranıyor… ${high.toLocaleString('tr-TR')} coin veya altı`);
        await pause(); ensureAccount(persona);
        candidates = await search(card, mid);
        ensureAccount(persona);
        if (candidates.length) { best = candidates[0]; high = priceOf(best); }
        else low = mid;
      }
      const quote = { price: priceOf(best), tradeId: tradeOf(best), at: Date.now(), persona, card: { ...card }, state: 'ready' };
      quotes.set(key, quote);
      return { price: quote.price, at: quote.at };
    } finally { active = false; }
  }
  function peek(card) {
    const quote = quotes.get(keyFor(card));
    return quote?.state === 'ready' ? { price: quote.price, at: quote.at, expired: Date.now() - quote.at > 60000 } : null;
  }
  async function buy(card, displayedPrice) {
    if (active) throw new Error('Bir piyasa işlemi sürüyor.');
    const key = keyFor(card), quote = quotes.get(key);
    if (!quote || quote.state !== 'ready' || quote.price !== displayedPrice || Date.now() - quote.at > 60000) {
      throw new Error('Fiyat eskidi. Önce yeniden En ucuzu bul düğmesine bas.');
    }
    active = true;
    try {
      ensureAccount(quote.persona);
      const items = await search(quote.card, quote.price, true);
      ensureAccount(quote.persona);
      if (Date.now() - quote.at > 60000) { quote.state = 'expired'; throw new Error('Fiyat doğrulanırken süre doldu. Yeniden ara.'); }
      const item = items.find((candidate) => tradeOf(candidate) === quote.tradeId);
      if (!item) { quote.state = 'expired'; throw new Error('Gösterilen ilan artık yok. Yeniden ara; başka fiyattan satın alınmadı.'); }
      if (typeof root.services.Item.bid !== 'function') throw new Error('EA satın alma arayüzü bulunamadı.');
      quote.state = 'pending'; pending.add(key);
      // No automatic retries: a timeout may still mean EA accepted the purchase.
      let bidResult;
      try { bidResult = await request(root.services.Item.bid(item, quote.price)); }
      catch (error) {
        quote.state = 'unknown';
        const uncertain = new Error(`${error.message} Alış sonucu belirsiz; kulübü ve transfer hedeflerini kontrol et. Tekrar alış engellendi.`);
        uncertain.uncertain = true;
        throw uncertain;
      }
      quote.state = 'bought'; pending.delete(key);
      const owned = bidResult.data?.item ?? bidResult.response?.item ?? item;
      purchased.set(key, owned);
      let moveError = null;
      try {
        const piles = root.ItemPile ?? root.services.Item.UTItemPileEnum ?? root.UTItemPileEnum ?? {};
        await request(root.services.Item.move(owned, piles.CLUB ?? 7));
      } catch (error) { moveError = error.message; }
      return { bought: true, price: quote.price, moveError, itemId: owned.id != null ? String(owned.id) : null };
    } finally { active = false; }
  }
  function acknowledge(card) {
    if (active) throw new Error('Bir piyasa işlemi sürüyor.');
    const key = keyFor(card);
    pending.delete(key);
    quotes.delete(key);
  }

  async function buyAtMost(card, cap) {
    if (active) throw new Error('Bir piyasa işlemi sürüyor.');
    if (!Number.isSafeInteger(cap) || cap <= 0) throw new Error('Onaylanan fiyat geçersiz.');
    const key = keyFor(card), persona = account();
    if (pending.has(key)) throw new Error('Önceki alış sonucu belirsiz.');
    active = true;
    try {
      const items = await search(card, cap);
      ensureAccount(persona);
      if (!items.length) throw new Error('Gösterilen fiyata veya altına ilan kalmadı; alınmadı.');
      const item = items[0];
      quotes.set(key, { card: { ...card }, persona, price: priceOf(item), tradeId: tradeOf(item), at: Date.now(), state: 'ready' });
    } finally { active = false; }
    return buy(card, quotes.get(key).price);
  }

  function ownedMatches(item, card) {
    const foil = typeof item?.getFoilSubtype === 'function' ? item.getFoilSubtype() !== -1 : item?.foil;
    return String(item?.definitionId) === String(card.defId) && Number(item?.rating) === Number(card.rating) &&
      Number(item?.rareflag) === Number(card.rarityId) && (card.foil ? foil === true : foil !== true);
  }
  function validPrice(price) {
    const step = price < 1000 ? 50 : price < 10000 ? 100 : price < 50000 ? 250 : price < 100000 ? 500 : 1000;
    return Number.isSafeInteger(price) && price >= 150 && price <= 15000000 && price % step === 0;
  }
  async function listAtPurchasePrice(entry) {
    if (active) throw new Error('Bir piyasa işlemi sürüyor.');
    if (!entry.bought || !entry.confirmed || entry.sold || entry.listingState || !validPrice(entry.buy)) {
      throw new Error('Satış için alış fiyatı ve Gallery doğrulaması gerekli; kart daha önce listelenmemiş olmalı.');
    }
    if (!entry.purchasedItemId) throw new Error('Alınan kartın örnek ID’si kayıtlı değil. Eski alışlar otomatik satışa konmaz.');
    const persona = account();
    active = true;
    try {
      const service = root.services.Item;
      if (typeof service.list !== 'function') throw new Error('EA satışa koyma arayüzü bulunamadı.');
      const id = String(entry.purchasedItemId);
      const cached = purchased.get(keyFor(entry.card));
      let item = cached && String(cached.id) === id ? cached :
        (H.fut.knownClubItems?.() || []).find((candidate) => String(candidate.id) === id);
      if (!item && typeof service.requestTransferItems === 'function') {
        const result = await request(service.requestTransferItems());
        ensureAccount(persona);
        const data = result.data ?? result.response ?? {};
        const all = [...(data.items || []), ...(data.availableItems || []), ...(data.unSoldItems || [])];
        item = all.find((candidate) => String(candidate.id) === id);
      }
      if (!item || !ownedMatches(item, entry.card)) throw new Error('Satın alınan kart bulunamadı. Club → Load my club ile yenile. Başka kopya satılmadı.');
      if (typeof item.isTradeable !== 'function' || !item.isTradeable() || item.isLimitedUse?.() || item.isActiveInTimedEvolution?.()) {
        throw new Error('Bu kart satışa uygun değil.');
      }
      const a = auction(item);
      if (a.tradeState === 'active' || a.isActive?.() || a.isSold?.()) throw new Error('Kart zaten satışta veya satılmış.');
      const minimum = Number(a.minPrice ?? item.minPrice);
      const maximum = Number(a.maxPrice ?? item.maxPrice);
      if ((minimum > 0 && entry.buy < minimum) || (maximum > 0 && entry.buy > maximum)) throw new Error('Alış fiyatı kartın güncel satış sınırlarının dışında.');
      ensureAccount(persona);
      const piles = root.ItemPile ?? service.UTItemPileEnum ?? root.UTItemPileEnum ?? {};
      const transferPile = piles.TRANSFER ?? piles.TRANSFER_LIST ?? 5;
      if (item.pile !== transferPile) await request(service.move(item, transferPile));
      ensureAccount(persona);
      item.clearAuction?.();
      // Both start and Buy Now equal this card's recorded purchase price; one hour.
      try { await request(service.list(item, entry.buy, entry.buy, 3600)); }
      catch (error) { error.uncertain = true; throw error; }
      purchased.delete(keyFor(entry.card));
      return { listed: true, price: entry.buy, itemId: id };
    } finally { active = false; }
  }
  function bindOwned(card) {
    const candidates = (H.fut.knownClubItems?.() || []).filter((item) => ownedMatches(item, card) && item.isTradeable?.() && item.id != null);
    const unique = [...new Map(candidates.map((item) => [String(item.id), item])).values()];
    if (unique.length !== 1) throw new Error('Kulüpte bu sürümün tek bir takas edilebilir kopyası bulunamadı. Kulübü yenile; birden çok kopya varsa kendin satışa koy.');
    return String(unique[0].id);
  }
  H.galleryMarket = { find, peek, buy, buyAtMost, listAtPurchasePrice, validPrice, bindOwned, acknowledge };
})(globalThis);
