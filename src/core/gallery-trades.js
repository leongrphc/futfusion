// Separate, local Gallery purchase ledger. Never writes EA inventory or Gallery state.
(function (root) {
  'use strict';
  const node = typeof module === 'object' && module.exports;
  const matcher = node ? require('./set-match') : root.FutFox.setMatch;
  const finitePrice = (value) => value === '' || value == null ? null :
    Number.isSafeInteger(Number(value)) && Number(value) >= 0 ? Number(value) : null;
  const cardKey = (card) => card?.defId != null ? `${card.defId}:${card.foil ? 'foil' : 'base'}` : null;
  const empty = () => ({ schema: 1, taxPercent: 5, workflowBudget: null, activeBatch: null, entries: [], events: [] });

  function read(data) {
    const out = empty();
    if (!data || data.schema !== 1 || !Array.isArray(data.entries)) return out;
    out.workflowBudget = finitePrice(data.workflowBudget);
    out.events = (Array.isArray(data.events) ? data.events : []).filter((e) => e && Number.isFinite(e.at) && typeof e.text === 'string')
      .slice(-200).map((e) => ({ at: e.at, text: e.text.slice(0, 500), key: String(e.key || ''), name: String(e.name || '') }));
    if (data.activeBatch && typeof data.activeBatch.id === 'string' && typeof data.activeBatch.name === 'string' && Array.isArray(data.activeBatch.keys)) {
      out.activeBatch = { id: data.activeBatch.id, targetId: String(data.activeBatch.targetId), name: data.activeBatch.name,
        keys: [...new Set(data.activeBatch.keys.filter((key) => typeof key === 'string'))] };
    }
    if (Number.isFinite(data.taxPercent) && data.taxPercent >= 0 && data.taxPercent <= 100) out.taxPercent = data.taxPercent;
    const seen = new Set();
    for (const entry of data.entries) {
      const key = cardKey(entry?.card);
      if (!key || seen.has(key) || entry.card.loan || !Array.isArray(entry.sets)) continue;
      seen.add(key);
      out.entries.push({ key, card: { ...entry.card }, sets: entry.sets.filter((s) => s && s.id != null && typeof s.name === 'string'),
        buy: finitePrice(entry.buy), sell: finitePrice(entry.sell),
        bought: entry.bought === true, confirmed: entry.confirmed === true, sold: entry.sold === true,
        purchaseState: ['pending', 'unknown'].includes(entry.purchaseState) ? entry.purchaseState : null,
        purchasedItemId: entry.purchasedItemId != null ? String(entry.purchasedItemId) : null,
        listingState: ['pending', 'unknown', 'listed'].includes(entry.listingState) ? entry.listingState : null,
        listingVerified: entry.listingVerified === true,
        listedPrice: finitePrice(entry.listedPrice),
        listPrice: finitePrice(entry.listPrice),
        createdAt: Number(entry.createdAt) || 0 });
    }
    return out;
  }

  // Count distinct sets with an empty compatible slot, not the number of slots.
  function contributions(card, results) {
    return results.filter((res) => res.slots.some((e) => e.slot && !e.card && !e.done && matcher.fitsSlot(e.slot, card)))
      .map((res) => ({ id: res.id, name: res.name }));
  }

  function addPlan(ledger, plan, target, results, knownCards, now = Date.now()) {
    const out = read(ledger);
    const known = new Set(knownCards.filter((c) => !c.loan).map(cardKey).filter(Boolean));
    const batchKeys = new Set();
    let added = 0;
    for (const pick of plan?.adds || []) {
      const card = pick.card;
      const key = cardKey(card);
      if (!key || card.loan || known.has(key)) continue;
      const sets = contributions(card, results);
      if (!sets.some((s) => String(s.id) === String(target.id))) continue;
      const existing = out.entries.find((e) => e.key === key);
      if (existing) {
        const links = new Map(existing.sets.map((s) => [String(s.id), s]));
        sets.forEach((s) => links.set(String(s.id), s));
        existing.sets = [...links.values()];
        if (!existing.bought && !existing.sold && !existing.listingState && !existing.purchaseState) batchKeys.add(key);
      } else {
        out.entries.push({ key, card: { ...card }, sets, buy: null, sell: null, bought: false, confirmed: false, sold: false, createdAt: now });
        added++;
        batchKeys.add(key);
      }
    }
    // Replace the work scope, never append old batches. History is retained only
    // for bookkeeping; prior purchased copies are not re-adopted by a new team.
    out.activeBatch = { id: `${target.id}:${now}`, targetId: String(target.id), name: target.name, keys: [...batchKeys] };
    out.workflowBudget = null;
    return { ledger: out, added };
  }

  function activeEntries(ledger, targetId = null) {
    const batch = ledger.activeBatch;
    if (!batch || targetId != null && String(targetId) !== batch.targetId) return [];
    const keys = new Set(batch.keys);
    return ledger.entries.filter((entry) => keys.has(entry.key));
  }

  function economics(entry, taxPercent) {
    const buy = finitePrice(entry.buy), sell = finitePrice(entry.sell);
    // Estimate only: round tax upward so projected proceeds aren't overstated.
    const tax = sell == null ? null : Math.ceil(sell * taxPercent / 100);
    const proceeds = sell == null ? null : sell - tax;
    return { buy, sell, tax, proceeds, cost: buy == null || proceeds == null ? null : buy - proceeds };
  }

  function summarize(ledger) {
    const priced = ledger.entries.map((e) => economics(e, ledger.taxPercent));
    return { count: ledger.entries.length,
      purchaseBudget: priced.reduce((n, e) => n + (e.buy ?? 0), 0),
      unknownBuy: priced.filter((e) => e.buy == null).length,
      projectedCost: priced.reduce((n, e) => n + (e.cost ?? 0), 0),
      unknownCost: priced.filter((e) => e.cost == null).length,
      soldCost: ledger.entries.filter((e) => e.sold).reduce((n, e) => n + (economics(e, ledger.taxPercent).cost ?? 0), 0) };
  }
  function breakEven(buy, taxPercent = 5) {
    if (!Number.isSafeInteger(buy) || buy <= 0 || !Number.isFinite(taxPercent) || taxPercent < 0 || taxPercent >= 100) return null;
    let price = Math.max(200, Math.ceil(buy / (1 - taxPercent / 100)));
    const step = price < 1000 ? 50 : price < 10000 ? 100 : price < 50000 ? 250 : price < 100000 ? 500 : 1000;
    price = Math.ceil(price / step) * step;
    return price <= 15000000 ? price : null;
  }
  function stage(entry) {
    if (entry.sold) return 'Satıldı';
    if (entry.purchaseState || entry.listingState && !entry.listingVerified) return 'Kontrol gerekiyor';
    if (entry.listingState === 'listed' && entry.listingVerified) return 'Satışta';
    if (entry.confirmed) return 'Kulüpte doğrulandı';
    if (entry.bought) return 'Alındı';
    return 'Fiyat ve alış bekliyor';
  }
  function accounting(ledger) {
    const entries = ledger.entries;
    const spent = entries.filter((e) => e.bought).reduce((n, e) => n + (e.buy || 0), 0);
    const sold = entries.filter((e) => e.sold && e.buy != null && e.sell != null);
    const revenue = sold.reduce((n, e) => n + economics(e, ledger.taxPercent).proceeds, 0);
    const realized = sold.reduce((n, e) => n - economics(e, ledger.taxPercent).cost, 0);
    const tied = entries.filter((e) => e.bought && !e.sold).reduce((n, e) => n + (e.buy || 0), 0);
    const expected = entries.filter((e) => e.bought && !e.sold && e.sell != null).reduce((n, e) => n + economics(e, ledger.taxPercent).proceeds, 0);
    return { spent, revenue, realized, tied, expected, unknownSales: entries.filter((e) => e.sold && (e.buy == null || e.sell == null)).length };
  }
  function record(ledger, key, patch, text = '', now = Date.now()) {
    const next = read(ledger);
    next.entries = next.entries.map((entry) => entry.key === key ? { ...entry, ...patch } : entry);
    const entry = next.entries.find((e) => e.key === key);
    if (entry) next.events = [...next.events, { at: now, key, name: entry.card.name || key, text: text || stage(entry) }].slice(-200);
    return next;
  }
  function backup(ledger, persona) {
    return { format: 'futfusion-trades', version: 1, persona: String(persona), exportedAt: Date.now(), ledger: read(ledger) };
  }
  function restore(data, persona) {
    if (data?.format !== 'futfusion-trades' || data.version !== 1 || String(data.persona) !== String(persona) || data.ledger?.schema !== 1 || !Array.isArray(data.ledger.entries)) throw new Error('Yedek bu EA hesabına ait değil veya desteklenmiyor.');
    const ledger = read(data.ledger);
    // Imported data never grants permission to repeat an uncertain request or resume an old budget.
    ledger.activeBatch = null; ledger.workflowBudget = null;
    return ledger;
  }
  const api = { breakEven, stage, accounting, record, backup, restore, empty, read, cardKey, contributions, addPlan, activeEntries, economics, summarize, finitePrice };
  if (node) module.exports = api; else root.FutFox.galleryTrades = api;
})(globalThis);
