// Runs CPU-heavy planning in the extension's background worker. No network calls.
importScripts('../core/requirements.js', '../core/rating.js', '../core/chemistry.js', '../core/solver.js');
chrome.runtime.onMessage.addListener((message, sender, respond) => {
  if (message?.type !== 'FUTFUSION_SOLVE') return;
  if (!/^https:\/\/www\.ea\.com\/(?:[^/]+\/)?ea-sports-fc\/ultimate-team\/web-app\//.test(sender.url || '')) { respond({ error: 'Geçersiz kaynak.' }); return; }
  try {
    const input = message.input;
    if (!input || !Array.isArray(input.slots) || input.slots.length > 30 || !input.slots.length || !Array.isArray(input.pool) || input.pool.length > 10000 || !Array.isArray(input.rules) || input.rules.length > 100 || JSON.stringify(input).length > 5000000) throw new Error('Kadro verisi desteklenen sınırları aşıyor.');
    input.iterations = Math.min(30000, Math.max(1, Number(input.iterations) || 25000));
    input.restarts = Math.min(4, Math.max(1, Number(input.restarts) || 4));
    respond({ data: globalThis.FutFox.solver.solve(input) });
  } catch (error) { respond({ error: error.message }); }
});
