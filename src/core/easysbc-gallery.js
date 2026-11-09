// Decode the public EasySBC Gallery responses. Never treat imported cards as owned.
(function (root) {
  'use strict';
  const node = typeof module === 'object' && module.exports;
  const trades = node ? require('./gallery-trades') : root.FutFox.galleryTrades;
  const grades = ['D', 'C', 'B', 'A', 'S'];
  const id = (value) => (typeof value === 'number' || typeof value === 'string' && /^\d+$/.test(value)) &&
    Number.isSafeInteger(Number(value)) && Number(value) > 0 ? Number(value) : null;
  const amount = (value) => Number.isFinite(value) && value >= 0 ? value : null;
  function catalog(data, platform = 'ps') {
    if (!Array.isArray(data)) throw new Error('EasySBC set listesi tanınmıyor.');
    const rows = [];
    for (const category of data) {
      for (const set of category?.sets || []) {
        if (!id(set.id) || typeof set.name !== 'string' || !Array.isArray(set.grades)) continue;
        let tokens = 0;
        const options = set.grades.flatMap((grade) => {
          tokens += amount(grade.tokenRewards?.['1']) ?? 0;
          const market = set.market?.[platform]?.find((m) => m.grade === grade.name);
          if (!grades.includes(grade.name) || !market || market.reachable !== true || market.onMarket !== true) return [];
          return [{ grade: grade.name, tokens, taxLoss: amount(market.taxLoss), budget: amount(market.budgetNeeded),
            ratio: tokens > 0 && amount(market.taxLoss) != null ? market.taxLoss / tokens : Infinity }];
        });
        if (!options.length) continue;
        const best = options.reduce((a, b) => b.ratio < a.ratio || b.ratio === a.ratio && b.tokens > a.tokens ? b : a);
        rows.push({ id: id(set.id), name: set.name, category: String(category.name || ''), slug: String(set.slug || ''),
          categorySlug: String(category.slug || ''), requiredCards: id(set.requiredCards), options, best });
      }
    }
    return rows.sort((a, b) => a.best.ratio - b.best.ratio || a.name.localeCompare(b.name));
  }
  function preview(data, set, gradeName, knownCards = []) {
    if (!data || Number(data.setId) !== set.id || data.source !== 'market') throw new Error('EasySBC çözümü seçilen setin piyasa çözümü değil.');
    const grade = data.grades?.find((g) => g.grade === gradeName);
    if (!grade || grade.reachable !== true || grade.onMarket !== true || !Array.isArray(grade.items) || !grade.items.length) throw new Error('Bu derece için erişilebilir piyasa kadrosu bulunamadı.');
    if (set.requiredCards && grade.items.length !== set.requiredCards) throw new Error('EasySBC kadrosundaki kart sayısı setle eşleşmiyor.');
    const cards = grade.items.map((item) => {
      const p = item.player;
      const resource = id(item.resourceId);
      if (!p || !resource || id(p.resourceId) !== resource || !id(p.assetId) || !Number.isInteger(p.rating) || p.rating < 1 || p.rating > 99 || !Number.isInteger(p.versionId) || p.versionId < 0) {
        throw new Error('EasySBC oyuncu veya kart sürümü eksik. İçe aktarılmadı.');
      }
      if (item.firstOwner === true) throw new Error('Bu kadro ilk sahip kartı varsayıyor; satın alarak aynı sonucu garanti edemeyiz. Başka derece seç.');
      return { id: resource, defId: resource, playerId: id(p.assetId), name: String(p.cardName || p.name || `#${resource}`),
        rating: p.rating, rarityId: p.versionId, clubId: p.clubId, leagueId: p.leagueId, nationId: p.countryId,
        score: amount(item.score) ?? amount(p.itemScore) ?? 0, foil: Boolean(p.foil), loan: false, owners: null,
        source: 'easysbc', referencePrice: amount(item.price) };
    });
    const keys = cards.map(trades.cardKey);
    if (new Set(keys).size !== keys.length) throw new Error('EasySBC kadrosunda aynı kart tekrar ediyor. İçe aktarılmadı.');
    const known = new Set(knownCards.filter((c) => !c.loan).map(trades.cardKey));
    return { set, grade: gradeName, cards, missing: cards.filter((c) => !known.has(trades.cardKey(c))),
      budget: amount(grade.budgetNeeded), taxLoss: amount(grade.taxLoss), totalScore: amount(grade.totalScore),
      computedAt: typeof data.computedAt === 'string' ? data.computedAt : null, stale: data.stale === true || data.upToDate === false,
      url: `https://www.easysbc.io/tr/fut-gallery/${encodeURIComponent(set.categorySlug)}/${encodeURIComponent(set.slug)}?grade=${gradeName}` };
  }
  function merge(ledger, selection, results, knownCards) {
    const target = { id: `easysbc:${selection.set.id}`, name: `EasySBC · ${selection.set.name} · ${selection.grade}`,
      slots: selection.cards.map((card) => ({ slot: { kind: 'card', playerId: card.playerId, rating: card.rating, rarityId: card.rarityId } })) };
    return trades.addPlan(ledger, { adds: selection.cards.map((card, index) => ({ card, index })) }, target, [...results, target], knownCards);
  }
  function personal(selection, knownCards = [], earned = 0, taxPercent = 5) {
    const known = new Set(knownCards.filter((c) => !c.loan).map(trades.cardKey));
    const missing = selection.cards.filter((card) => !known.has(trades.cardKey(card)));
    const tokens = selection.set.options.find((o) => o.grade === selection.grade)?.tokens || 0;
    const remainingTokens = Math.max(0, tokens - Math.max(0, Number(earned) || 0));
    const unknown = missing.filter((card) => card.referencePrice == null).length;
    const budget = unknown ? null : missing.reduce((n, card) => n + card.referencePrice, 0);
    const taxLoss = budget == null ? null : missing.reduce((n, card) => n + Math.ceil(card.referencePrice * taxPercent / 100), 0);
    return { missing, remainingTokens, tokens, budget, taxLoss, unknown, ratio: remainingTokens > 0 && taxLoss != null ? taxLoss / remainingTokens : Infinity };
  }
  function combine(selections, knownCards = []) {
    const known = new Set(knownCards.filter((c) => !c.loan).map(trades.cardKey));
    const cards = new Map();
    for (const selection of selections) for (const card of selection.cards) {
      const key = trades.cardKey(card); if (known.has(key)) continue;
      if (!cards.has(key)) cards.set(key, { card, sets: [] });
      const row = cards.get(key);
      if (!row.sets.includes(selection.set.name)) row.sets.push(selection.set.name);
      // A higher reference is conservative when two source snapshots disagree.
      if (card.referencePrice != null && (row.card.referencePrice == null || card.referencePrice > row.card.referencePrice)) row.card = card;
    }
    const items = [...cards.values()].sort((a, b) => b.sets.length - a.sets.length);
    return { items, unknown: items.filter((e) => e.card.referencePrice == null).length,
      budget: items.some((e) => e.card.referencePrice == null) ? null : items.reduce((n, e) => n + e.card.referencePrice, 0) };
  }
  const api = { personal, combine, catalog, preview, merge };
  if (node) module.exports = api; else root.FutFox.easySbcGallery = api;
})(globalThis);
