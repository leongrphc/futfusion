(function (root) {
  'use strict';
  let pending = null;
  const solve = (input) => new Promise((resolve, reject) => {
    if (pending) { reject(new Error('Bir kadro hesaplaması zaten sürüyor.')); return; }
    const id = root.crypto.randomUUID();
    const original = new Map(input.pool.map((p) => [p.key, p]));
    Object.values(input.fixed || {}).forEach((p) => original.set(p.key, p));
    const cleanPlayer = (p) => { const { item, ...data } = p; return data; };
    const safe = { ...input, pool: input.pool.map(cleanPlayer), fixed: Object.fromEntries(Object.entries(input.fixed || {}).map(([key, p]) => [key, cleanPlayer(p)])) };
    const finish = (error, result) => {
      clearTimeout(timer); root.removeEventListener('message', receive); pending = null;
      if (error) reject(error);
      else { result.squad = result.squad.map((slot) => ({ ...slot, player: slot.player ? original.get(slot.player.key) || slot.player : null })); resolve(result); }
    };
    const receive = (event) => {
      const msg = event.data;
      if (event.source !== root || event.origin !== root.location.origin || msg?.source !== 'futfusion-solver' || msg.type !== 'response' || msg.id !== id) return;
      finish(msg.error ? new Error(msg.error) : null, msg.data);
    };
    const timer = setTimeout(() => finish(new Error('Hesaplama yanıt vermedi. Uzantıyı ve Web App’i yenileyip tekrar dene.')), 60000);
    pending = () => finish(new Error('Hesaplama iptal edildi.'));
    root.addEventListener('message', receive);
    root.postMessage({ source: 'futfusion-solver', type: 'request', id, input: safe }, root.location.origin);
  });
  root.FutFox.solverAsync = { solve, cancel: () => pending?.() };
})(globalThis);
