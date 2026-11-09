// One sequential queue. A buy click authorizes only the displayed per-card caps.
(function (root) {
  'use strict';
  const H = root.FutFox;
  let running = false;
  let cancelled = false;
  const pause = () => new Promise((resolve) => setTimeout(resolve, 800));
  async function runAll({ entries, getEntry, write, progress = () => {}, budget = 0 }) {
    if (running) throw new Error('Bir toplu işlem zaten sürüyor.');
    if (!Number.isSafeInteger(budget) || budget < 0) throw new Error('Toplam alış bütçesini gir.');
    running = true; cancelled = false;
    const persona = String(H.fut.galleryMemory().persona);
    const summary = { done: 0, failed: 0, skipped: 0, stopped: false, spent: 0, total: entries.length };
    const emit = (entry, index, text) => progress({ entry, index: index + 1, total: entries.length, text, summary: { ...summary } });
    const check = () => {
      if (String(H.fut.galleryMemory().persona) !== persona) throw new Error('EA hesabı değişti.');
      if (cancelled) throw new Error('Durduruldu.');
    };
    try {
      for (let index = 0; index < entries.length; index++) {
        if (cancelled || String(H.fut.galleryMemory().persona) !== persona) { summary.stopped = true; break; }
        let entry = getEntry(entries[index].key);
        if (!entry || entry.sold || entry.purchaseState || entry.listingState === 'listed' && entry.listingVerified) { summary.skipped++; continue; }
        let phase = 'read', accepted = false;
        try {
          if (entry.listingState || entry.bought && entry.purchasedItemId) {
            emit(entry, index, 'Önceki satış isteği Transfer Listesi’nden kontrol ediliyor…');
            const status = await H.galleryMarket.inspectListing(entry);
            if (status === 'listed') { write(entry.key, { listingState: 'listed', listingVerified: true, listedPrice: entry.listedPrice ?? entry.listPrice ?? entry.buy, sell: entry.listedPrice ?? entry.listPrice ?? entry.buy }); summary.done++; continue; }
            if (entry.listingState && status !== 'inactive') throw new Error('Önceki satışın sonucu belirsiz; Transfer Listesi’ni kontrol et.');
            if (entry.listingState) { write(entry.key, { listingState: null, listingVerified: false }); entry = getEntry(entry.key); }
          }
          if (!entry.bought) {
            const remaining = budget - summary.spent;
            if (remaining <= 0) { summary.stopped = true; emit(entry, index, 'Alış bütçesi doldu; yeni satın alma yapılmadı.'); break; }
            emit(entry, index, 'En düşük fiyat aranıyor…');
            const quote = await H.galleryMarket.find(entry.card, (text) => { check(); emit(entry, index, text); });
            check();
            const cap = Math.min(quote.price, entries[index].cap || quote.price, remaining);
            if (quote.price > cap) throw new Error('Bulunan fiyat kart tavanını veya kalan bütçeyi aşıyor; alınmadı.');
            emit(entry, index, `${quote.price.toLocaleString('tr-TR')} coin — satın alınıyor…`);
            phase = 'buy'; write(entry.key, { purchaseState: 'pending' });
            const purchase = await H.galleryMarket.buyAtMost(entry.card, cap);
            accepted = true; summary.spent += purchase.price;
            write(entry.key, { bought: true, buy: purchase.price, purchasedItemId: purchase.itemId, purchaseState: null });
            phase = 'read'; accepted = false; entry = getEntry(entry.key);
            // Even on a club-move error, resume from the now-owned exact instance.
          }
          check();
          if (!entry.purchasedItemId) {
            write(entry.key, { purchasedItemId: await H.galleryMarket.bindOwnedForWorkflow(entry.card) }); entry = getEntry(entry.key);
          }
          emit(entry, index, 'Kulübe giriş doğrulanıyor…');
          const confirmed = await H.galleryMarket.ensureClubEntry(entry);
          check();
          if (!confirmed.confirmed) throw new Error('Kulübe giriş doğrulanmadı; satış yapılmadı.');
          write(entry.key, { confirmed: true }); entry = getEntry(entry.key);
          emit(entry, index, `${(entry.listPrice ?? entry.buy).toLocaleString('tr-TR')} coin Hemen Al — aktif satış ilanı açılıyor…`);
          phase = 'list'; write(entry.key, { listingState: 'pending' });
          const listing = await H.galleryMarket.listAtPurchasePrice(entry);
          accepted = true;
          write(entry.key, { listingState: 'listed', listingVerified: true, listedPrice: listing.price, sell: listing.price });
          phase = 'read'; accepted = false; summary.done++;
          emit(entry, index, `${listing.price.toLocaleString('tr-TR')} coin Hemen Al — aktif ilan doğrulandı.`);
        } catch (error) {
          summary.failed++;
          if (phase === 'buy' || phase === 'list') {
            try { write(entry.key, phase === 'buy' ? { purchaseState: error.uncertain || accepted ? 'unknown' : null } : { listingState: error.uncertain || accepted ? 'unknown' : null }); }
            catch (_) { summary.stopped = true; }
          }
          emit(entry, index, error.message);
          if (cancelled || error.uncertain || accepted || summary.stopped || /EA işlem hatası|yanıt vermedi|hesabı değişti|takım değişti/.test(error.message)) { summary.stopped = true; break; }
        }
        if (!cancelled && index + 1 < entries.length) await pause();
      }
      return summary;
    } finally { running = false; cancelled = false; }
  }
  async function run({ mode, entries, getEntry, write, progress = () => {}, budget }) {
    if (mode === 'all') return runAll({ entries, getEntry, write, progress, budget });
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
            write(entry.key, { listingState: 'listed', listingVerified: true, listedPrice: result.price, sell: result.price });
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
