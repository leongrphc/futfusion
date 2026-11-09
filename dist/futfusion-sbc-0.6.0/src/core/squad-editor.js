(function (root) {
  'use strict';
  const node = typeof module === 'object' && module.exports;
  const R = node ? require('./requirements') : root.FutFox.requirements;
  const rating = node ? require('./rating') : root.FutFox.rating;
  const chemistry = node ? require('./chemistry') : root.FutFox.chemistry;
  const identity = (p) => p?.playerId > 0 ? `player:${p.playerId}` : p?.defId != null ? `card:${p.defId}` : p?.key;
  function evaluate(result, { ratingFloat = true, thresholds = chemistry.DEFAULT_THRESHOLDS, eaChem = null } = {}) {
    const required = result.required || new Set(result.squad.map((_, i) => i));
    const players = result.squad.map((s) => s.player);
    const filled = players.filter((p, i) => p && required.has(i));
    const calc = chemistry.computeChemistry(result.squad, players, thresholds);
    const squadRating = rating.squadRating(players.map((p) => p?.rating || 0), ratingFloat);
    const chem = eaChem || calc;
    const ctx = { players: filled, rating: squadRating, chem: { total: chem.total, perPlayer: [...required].map((i) => chem.perPlayer[i] || 0) } };
    const ruleResults = (result.rules || []).map((rule) => ({ rule, shortfall: rule.supported ? R.shortfall(rule, ctx) : 0 }));
    const unique = new Set(filled.map(identity)).size === filled.length;
    const unsupported = (result.rules || []).filter((r) => !r.supported);
    return { ...result, required, rating: squadRating, chemistry: chem.total, eaChem, ruleResults, unsupported,
      cost: filled.reduce((sum, p) => sum + (p.cost || 0), 0),
      feasible: filled.length === required.size && unique && !unsupported.length && ruleResults.every((r) => r.shortfall === 0),
      squad: result.squad.map((slot, i) => ({ ...slot, chemistry: chem.perPlayer[i] || 0, inPosition: calc.inPosition[i] })) };
  }
  function setPlayer(result, index, player) {
    if (result.kind === 'score' || !Number.isInteger(index) || !result.squad[index] || result.required && !result.required.has(index)) throw new Error('Bu yuva düzenlenemez.');
    if (player && result.squad.some((slot, i) => i !== index && slot.player && identity(slot.player) === identity(player))) throw new Error('Bu oyuncu veya başka sürümü kadroda zaten var.');
    return { ...result, squad: result.squad.map((slot, i) => i === index ? { ...slot, player } : slot) };
  }
  const api = { identity, evaluate, setPlayer };
  if (node) module.exports = api; else root.FutFox.squadEditor = api;
})(globalThis);
