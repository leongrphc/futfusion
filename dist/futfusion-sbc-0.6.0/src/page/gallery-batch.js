// One sequential queue. A buy click authorizes only the displayed per-card caps.
(function (root) {
  'use strict';
  const H = root.FutFox;
  let running = false;
  let cancelled = false;
  const pause = () => new Promise((resolve) => setTimeout(resolve, 800));
  async function run({ mode, entries, getEntry, write, progress = () => {} }) {
    if (running) throw new Error('Bir toplu işlem zaten sürüyor.');
    if (!['find', 'buy', 'list'].includes(mode)) throw new Error('Geçersiz toplu işlem.');
    const persona = String(H.fut.galleryMemory().persona);
    running = true; cancelled = false;
    const summary = { done: 0, failed: 0, skipped: 0, stopped: false, total: entries.length };
    try {
      for (let index = 0; index < entries.length; index++) {
        if (cancelled) { summary.stopped = true; break; }
        if (String(H.fut.galleryMemory().persona) !== persona) { summary.stopped = true; break; }
        const task = entries[index];
        const entry = getEntry(task.key);
        if (!entry || (mode !== 'list' && (entry.bought || entry.purchaseState)) ||
            (mode === 'list' && (!entry.bought || !entry.confirmed || entry.sold || entry.listingState))) {
          summary.skipped++; continue;
        }
        progress({ index: index + 1, total: entries.length, entry, text: 'İşleniyor…', summary: { ...summary } });
        let committed = false;
        try {
          if (mode === 'find') {
            const quote = await H.galleryMarket.find(entry.card, (text) => {
              if (cancelled) throw new Error('Durduruldu.');
              progress({ index: index + 1, total: entries.length, entry, text, summary: { ...summary } });
            });
            progress({ entry, text: `${quote.price.toLocaleString('tr-TR')} coin bulundu.`, summary: { ...summary } });
          } else if (mode === 'buy') {
            if (!Number.isSafeInteger(task.cap) || task.cap <= 0) throw new Error('Fiyat önizlemesi yok.');
            write(entry.key, { purchaseState: 'pending' });
            const result = await H.galleryMarket.buyAtMost(entry.card, task.cap);
            committed = true;
            write(entry.key, { bought: true, buy: result.price, purchasedItemId: result.itemId, purchaseState: null });
            progress({ entry, text: result.moveError ? `Alındı; kulübe gönderilemedi. ${result.moveError}` : `${result.price.toLocaleString('tr-TR')} coin — alındı, kulübe gönderildi.`, summary: { ...summary } });
          } else {
            write(entry.key, { listingState: 'pending' });
            const result = await H.galleryMarket.listAtPurchasePrice(entry);
            committed = true;
            write(entry.key, { listingState: 'listed', listedPrice: result.price, sell: result.price });
            progress({ entry, text: `${result.price.toLocaleString('tr-TR')} coin — 1 saatliğine satışa kondu.`, summary: { ...summary } });
          }
          summary.done++;
        } catch (error) {
          summary.failed++;
          const uncertain = error.uncertain || committed;
          if (mode !== 'find') {
            try { write(entry.key, mode === 'buy' ? { purchaseState: uncertain ? 'unknown' : null } : { listingState: uncertain ? 'unknown' : null }); }
            catch (_) { summary.stopped = true; }
          }
          progress({ entry, text: error.message, error: true, summary: { ...summary } });
          if (uncertain || summary.stopped || /EA işlem hatası|yanıt vermedi|hesabı değişti/.test(error.message)) { summary.stopped = true; break; }
        }
        if (index + 1 < entries.length && !cancelled) await pause();
      }
      if (cancelled) summary.stopped = true;
      return summary;
    } finally { running = false; cancelled = false; }
  }
  H.galleryBatch = { run, cancel: () => { cancelled = true; }, isRunning: () => running };
})(globalThis);
