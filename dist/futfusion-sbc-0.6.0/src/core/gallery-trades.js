// Separate, local Gallery purchase ledger. Never writes EA inventory or Gallery state.
(function (root) {
  'use strict';
  const node = typeof module === 'object' && module.exports;
  const matcher = node ? require('./set-match') : root.FutFox.setMatch;
  const finitePrice = (value) => value === '' || value == null ? null :
    Number.isSafeInteger(Number(value)) && Number(value) >= 0 ? Number(value) : null;
  const cardKey = (card) => card?.defId != null ? `${card.defId}:${card.foil ? 'foil' : 'base'}` : null;
  const empty = () => ({ schema: 1, taxPercent: 5, entries: [] });

  function read(data) {
    const out = empty();
    if (!data || data.schema !== 1 || !Array.isArray(data.entries)) return out;
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
        listedPrice: finitePrice(entry.listedPrice),
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
      } else {
        out.entries.push({ key, card: { ...card }, sets, buy: null, sell: null, bought: false, confirmed: false, sold: false, createdAt: now });
        added++;
      }
    }
    return { ledger: out, added };
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
  const api = { empty, read, cardKey, contributions, addPlan, economics, summarize, finitePrice };
  if (node) module.exports = api; else root.FutFox.galleryTrades = api;
})(globalThis);
