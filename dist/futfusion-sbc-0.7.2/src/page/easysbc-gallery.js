(function (root) {
  'use strict';
  const H = root.FutFox;
  const C = H.easySbcGallery;
  const state = { raw: null, platform: 'ps', setId: null, grade: null, loading: false, error: '', message: '', preview: null };
  const fmt = (n) => n == null ? '?' : n.toLocaleString('tr-TR');
  function request(action, setId, platform) {
    return new Promise((resolve, reject) => {
      const id = root.crypto.randomUUID();
      const cleanup = () => { clearTimeout(timer); root.removeEventListener('message', onMessage); };
      const onMessage = (event) => {
        const msg = event.data;
        if (event.source !== root || event.origin !== root.location.origin || msg?.source !== 'futfusion-easysbc' || msg.type !== 'response' || msg.id !== id) return;
        cleanup();
        if (msg.error) reject(new Error(msg.error)); else resolve(msg.data);
      };
      const timer = setTimeout(() => { cleanup(); reject(new Error('EasySBC bağlantısı yanıt vermedi. Uzantıyı ve Web App’i yenileyip tekrar dene.')); }, 22000);
      root.addEventListener('message', onMessage);
      root.postMessage({ source: 'futfusion-easysbc', type: 'request', id, action, setId, platform }, root.location.origin);
    });
  }
  function render({ el, results, rerender }) {
    const busy = state.loading || H.galleryBatch?.isRunning();
    const invalidateBatch = () => {
      try {
        const key = `futfusion.galleryTrades.v1.${H.fut.galleryMemory().persona}`;
        const saved = root.localStorage.getItem(key);
        if (saved) {
          const raw = JSON.parse(saved);
          if (raw.schema !== 1 || !Array.isArray(raw.entries)) throw new Error('Alış listesi okunamadı.');
          const ledger = H.galleryTrades.read(raw);
          ledger.activeBatch = null; ledger.workflowBudget = null;
          root.localStorage.setItem(key, JSON.stringify(ledger));
        }
        return true;
      } catch (error) { state.error = error.message; return false; }
    };
    let rows = [];
    try { if (state.raw) rows = C.catalog(state.raw, state.platform); }
    catch (error) { state.error = error.message; }
    const selected = rows.find((r) => r.id === state.setId) || rows[0];
    if (selected && selected.id !== state.setId) { state.setId = selected.id; state.grade = selected.best.grade; state.preview = null; }
    if (selected && !selected.options.some((option) => option.grade === state.grade)) { state.grade = selected.best.grade; state.preview = null; }
    const known = H.fut.galleryCards();
    const knownKeys = new Set(known.filter((card) => !card.loan).map(H.galleryTrades.cardKey));
    const preview = state.preview;
    const missing = preview?.cards.filter((card) => !knownKeys.has(H.galleryTrades.cardKey(card))) || [];
    const load = async (solution) => {
      if (state.loading || H.galleryBatch?.isRunning()) return;
      if (solution && !invalidateBatch()) { rerender(); return; }
      state.loading = true; state.error = ''; state.message = '';
      if (solution) state.preview = null;
      rerender();
      try {
        if (solution) state.preview = C.preview(await request('solution', selected.id, state.platform), selected, state.grade, H.fut.galleryCards());
        else { state.raw = await request('catalog', null, state.platform); C.catalog(state.raw, state.platform); }
      } catch (error) { state.error = error.message; }
      finally { state.loading = false; rerender(); }
    };
    const add = () => {
      if (!preview || H.galleryBatch?.isRunning()) return;
      try {
        const persona = H.fut.galleryMemory().persona;
        const key = `futfusion.galleryTrades.v1.${persona}`;
        const raw = JSON.parse(root.localStorage.getItem(key) || 'null');
        if (raw && (raw.schema !== 1 || !Array.isArray(raw.entries))) throw new Error('Mevcut alış listesi okunamadı; üzerine yazılmadı.');
        const next = C.merge(H.galleryTrades.read(raw), preview, results, H.fut.galleryCards());
        root.localStorage.setItem(key, JSON.stringify(next.ledger));
        state.message = `${next.ledger.activeBatch.keys.length} kart bu takımın aktif grubu oldu (${next.added} yeni kayıt). Eski gruplar işleme alınmaz. Alttan Tümünü yap ile yalnız bu takımı başlatabilirsin.`;
        state.error = '';
      } catch (error) { state.error = error.message; }
      rerender();
    };
    return el('section', { class: 'easy-gallery' }, [
      el('div', { class: 'trade-heading' }, [
        el('div', {}, [el('span', { class: 'trade-eyebrow', text: 'ALTERNATİF KADRO KAYNAĞI' }), el('h3', { text: 'EasySBC’den kadro al' })]),
        el('span', { class: 'trade-count', text: 'İsteğe bağlı' }),
      ]),
      el('p', { class: 'note', text: 'Set ve dereceyi seç. EasySBC’nin piyasa kadrosundan yalnız kulüp hafızanda bulunmayan kartları alış listene ekle.' }),
      el('button', { type: 'button', disabled: busy, text: state.loading ? 'EasySBC yükleniyor…' : state.raw ? 'EasySBC setlerini yenile' : 'EasySBC setlerini getir', onclick: () => load(false) }),
      rows.length ? el('div', { class: 'easy-controls' }, [
        el('label', {}, [el('span', { text: 'Fiyat platformu' }), el('select', { value: state.platform, disabled: busy, onchange: (event) => {
          if (!invalidateBatch()) { rerender(); return; }
          state.platform = event.target.value; state.setId = null; state.preview = null; state.error = ''; rerender();
        } }, [el('option', { value: 'ps', selected: state.platform === 'ps', text: 'Konsol (PlayStation / Xbox)' }), el('option', { value: 'pc', selected: state.platform === 'pc', text: 'PC' })])]),
        el('label', {}, [el('span', { text: 'Set · düşük token maliyeti önce' }), el('select', { disabled: busy, onchange: (event) => {
          if (!invalidateBatch()) { rerender(); return; }
          state.setId = Number(event.target.value); const row = rows.find((r) => r.id === state.setId); state.grade = row.best.grade; state.preview = null; state.error = ''; rerender();
        } }, rows.map((row) => el('option', { value: row.id, selected: row.id === selected.id, text: `${row.category} · ${row.name} · ${fmt(Number.isFinite(row.best.ratio) ? Math.round(row.best.ratio) : null)} coin/token` }))) ]),
        el('label', {}, [el('span', { text: 'Hedef derece' }), el('select', { disabled: busy, onchange: (event) => { if (!invalidateBatch()) { rerender(); return; } state.grade = event.target.value; state.preview = null; state.error = ''; rerender(); } },
          selected.options.map((option) => el('option', { value: option.grade, selected: option.grade === state.grade, text: `${option.grade} · ${option.tokens} token · ${fmt(option.budget)} coin bütçe` }))) ]),
        el('button', { type: 'button', disabled: busy, text: 'Seçilen kadroyu getir', onclick: () => load(true) }),
      ]) : null,
      state.raw && !rows.length ? el('p', { class: 'note', text: 'Bu platform için erişilebilir piyasa kadrosu listelenmedi.' }) : null,
      state.raw && !rows.length && state.platform === 'pc' ? el('button', { type: 'button', text: 'Konsol listesine dön', onclick: () => { state.platform = 'ps'; state.setId = null; rerender(); } }) : null,
      preview ? el('div', { class: 'easy-preview' }, [
        el('strong', { text: `${preview.set.name} · ${preview.grade} derecesi · ${preview.cards.length} kart` }),
        el('p', { class: 'note', text: `${missing.length} eksik · ${preview.cards.length - missing.length} kart hafızada. EasySBC referansı: ${fmt(preview.budget)} coin bütçe, ${fmt(preview.taxLoss)} coin vergi kaybı.` }),
        preview.stale ? el('p', { class: 'note', text: 'EasySBC bu çözümün güncel olmadığını bildiriyor. Alıştan önce canlı fiyatları yeniden ara.' }) : null,
        el('details', {}, [el('summary', { text: 'Kadrodaki kartları göster' }), el('ul', {}, preview.cards.map((card) => el('li', { text: `${card.name} · ${card.rating} · sürüm ${card.rarityId}${card.foil ? ' · Holographic' : ''} · ${knownKeys.has(H.galleryTrades.cardKey(card)) ? 'Hafızada' : 'Eksik'} · ${fmt(card.referencePrice)} coin referans` })))]),
        el('button', { class: 'primary', type: 'button', disabled: !missing.length || H.galleryBatch?.isRunning(), text: `${missing.length} eksik kartı alış listesine ekle`, onclick: add }),
        el('a', { href: preview.url, target: '_blank', rel: 'noopener noreferrer', text: 'Kadroyu EasySBC’de aç' }),
      ].filter(Boolean)) : null,
      state.error || state.message ? el('p', { class: state.error ? 'error' : 'note', role: 'status', text: state.error || state.message }) : null,
      el('p', { class: 'note', text: 'Sıralama EasySBC piyasa verisidir; kişisel ilerlemeni içermez. Her aktarım yalnız bu takımın kartlarını aktif yapar. Eski kayıtlar geçmişte kalır ve işlenmez. Kaynak fiyatları canlı alış onayı değildir.' }),
    ].filter(Boolean));
  }
  H.easySbcUI = { render };
})(globalThis);
