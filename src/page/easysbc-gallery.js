(function (root) {
  'use strict';
  const H = root.FutFox;
  const C = H.easySbcGallery;
  const state = { raw: null, platform: 'ps', setId: null, grade: null, loading: false, error: '', message: '', preview: null, comparisons: [], earned: {}, maxBudget: '', search: '' };
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
    const persona = String(H.fut.galleryMemory().persona);
    const progressKey = `futfusion.galleryProgress.${persona}`;
    if (state.persona !== persona) {
      state.persona = persona; state.comparisons = []; state.preview = null;
      try { const saved = JSON.parse(root.localStorage.getItem(progressKey) || '{}'); state.earned = Object.fromEntries(Object.entries(saved).filter(([, value]) => Number.isSafeInteger(value) && value >= 0)); }
      catch (_) { state.earned = {}; }
    }
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
    const searched = rows.filter((row) => `${row.name} ${row.category}`.toLocaleLowerCase('tr-TR').includes(state.search.toLocaleLowerCase('tr-TR')));
    const selected = searched.find((r) => r.id === state.setId) || searched[0];
    if (selected && selected.id !== state.setId) { state.setId = selected.id; state.grade = selected.best.grade; state.preview = null; }
    if (selected && !selected.options.some((option) => option.grade === state.grade)) { state.grade = selected.best.grade; state.preview = null; }
    const known = H.fut.galleryCards();
    const knownKeys = new Set(known.filter((card) => !card.loan).map(H.galleryTrades.cardKey));
    const preview = state.preview;
    const personal = preview ? C.personal(preview, known, state.earned[`${state.platform}:${preview.set.id}`] || 0) : null;
    const compared = state.comparisons.filter((p) => p.platform === state.platform).map((p) => ({ ...p, assessment: C.personal(p, known, state.earned[`${state.platform}:${p.set.id}`] || 0) })).sort((a, b) => a.assessment.ratio - b.assessment.ratio);
    const combined = C.combine(compared, known);
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
      rows.length ? el('label', {}, [el('span', { text: 'Set ara' }), el('input', { type: 'search', value: state.search, placeholder: 'Takım veya lig adı', 'aria-label': 'EasySBC set ara', onchange: (event) => { if (!invalidateBatch()) return; state.search = event.target.value; state.preview = null; rerender(); } })]) : null,
      rows.length && !searched.length ? el('p', { class: 'note', text: 'Bu aramayla eşleşen set yok. Aramayı temizleyebilirsin.' }) : null,
      selected ? el('div', { class: 'easy-controls' }, [
        el('label', {}, [el('span', { text: 'Fiyat platformu' }), el('select', { value: state.platform, disabled: busy, onchange: (event) => {
          if (!invalidateBatch()) { rerender(); return; }
          state.platform = event.target.value; state.setId = null; state.preview = null; state.error = ''; rerender();
        } }, [el('option', { value: 'ps', selected: state.platform === 'ps', text: 'Konsol (PlayStation / Xbox)' }), el('option', { value: 'pc', selected: state.platform === 'pc', text: 'PC' })])]),
        el('label', {}, [el('span', { text: 'Set · düşük token maliyeti önce' }), el('select', { disabled: busy, onchange: (event) => {
          if (!invalidateBatch()) { rerender(); return; }
          state.setId = Number(event.target.value); const row = rows.find((r) => r.id === state.setId); state.grade = row.best.grade; state.preview = null; state.error = ''; rerender();
        } }, searched.map((row) => el('option', { value: row.id, selected: row.id === selected.id, text: `${row.category} · ${row.name} · ${fmt(Number.isFinite(row.best.ratio) ? Math.round(row.best.ratio) : null)} coin/token` }))) ]),
        el('label', {}, [el('span', { text: 'Hedef derece' }), el('select', { disabled: busy, onchange: (event) => { if (!invalidateBatch()) { rerender(); return; } state.grade = event.target.value; state.preview = null; state.error = ''; rerender(); } },
          selected.options.map((option) => el('option', { value: option.grade, selected: option.grade === state.grade, text: `${option.grade} · ${option.tokens} token · ${fmt(option.budget)} coin bütçe` }))) ]),
        el('button', { type: 'button', disabled: busy, text: 'Seçilen kadroyu getir', onclick: () => load(true) }),
      ]) : null,
      state.raw && !rows.length ? el('p', { class: 'note', text: 'Bu platform için erişilebilir piyasa kadrosu listelenmedi.' }) : null,
      state.raw && !rows.length && state.platform === 'pc' ? el('button', { type: 'button', text: 'Konsol listesine dön', onclick: () => { state.platform = 'ps'; state.setId = null; rerender(); } }) : null,
      preview ? el('div', { class: 'easy-preview' }, [
        el('strong', { text: `${preview.set.name} · ${preview.grade} derecesi · ${preview.cards.length} kart` }),
        el('p', { class: 'note', text: `${missing.length} eksik · ${preview.cards.length - missing.length} kart hafızada. EasySBC referansı: ${fmt(preview.budget)} coin bütçe, ${fmt(preview.taxLoss)} coin vergi kaybı.` }),
        el('div', { class: 'trade-metrics' }, [
          el('div', {}, [el('span', { text: 'EKSİKLERİN BÜTÇESİ' }), el('strong', { text: fmt(personal.budget) }), el('small', { text: 'Kaynak fiyatıyla tahmini' })]),
          el('div', {}, [el('span', { text: 'KALAN TOKEN' }), el('strong', { text: fmt(personal.remainingTokens) }), el('small', { text: 'Girdiğin kazanımdan sonra' })]),
          el('div', {}, [el('span', { text: 'COIN / TOKEN' }), el('strong', { text: fmt(Number.isFinite(personal.ratio) ? Math.round(personal.ratio) : null) }), el('small', { text: 'Eksiklerin %5 vergi tahmini' })]),
        ]),
        el('label', {}, [el('span', { text: 'Bu sette daha önce kazandığım token' }), el('input', { type: 'number', min: '0', max: String(personal.tokens), value: state.earned[`${state.platform}:${preview.set.id}`] || 0, onchange: (event) => { const value = Number(event.target.value); if (Number.isInteger(value) && value >= 0 && value <= personal.tokens) { state.earned[`${state.platform}:${preview.set.id}`] = value; try { root.localStorage.setItem(progressKey, JSON.stringify(state.earned)); } catch (_) { state.error = 'Token ilerlemesi kaydedilemedi.'; } } rerender(); } })]),
        el('button', { type: 'button', text: 'Karşılaştırmaya ekle', disabled: busy, onclick: () => { state.comparisons = [...state.comparisons.filter((p) => !(p.platform === state.platform && p.set.id === preview.set.id)), { ...preview, platform: state.platform }]; rerender(); } }),
        preview.stale ? el('p', { class: 'note', text: 'EasySBC bu çözümün güncel olmadığını bildiriyor. Alıştan önce canlı fiyatları yeniden ara.' }) : null,
        el('details', {}, [el('summary', { text: 'Kadrodaki kartları göster' }), el('ul', {}, preview.cards.map((card) => el('li', { text: `${card.name} · ${card.rating} · sürüm ${card.rarityId}${card.foil ? ' · Holographic' : ''} · ${knownKeys.has(H.galleryTrades.cardKey(card)) ? 'Hafızada' : 'Eksik'} · ${fmt(card.referencePrice)} coin referans` })))]),
        el('button', { class: 'primary', type: 'button', disabled: !missing.length || H.galleryBatch?.isRunning(), text: `${missing.length} eksik kartı alış listesine ekle`, onclick: add }),
        el('a', { href: preview.url, target: '_blank', rel: 'noopener noreferrer', text: 'Kadroyu EasySBC’de aç' }),
      ].filter(Boolean)) : null,
      compared.length ? el('details', { class: 'easy-preview', open: true }, [
        el('summary', { text: `Kişisel set karşılaştırması · ${compared.length} set` }),
        el('p', { class: 'note', text: 'Getirdiğin kadrolar, kulüp hafızan ve elle girdiğin token kazanımına göre sıralanır. Koleksiyon hafızası kartın şu an kulüpte olduğunu göstermez. Başka setler otomatik getirilmez veya işlenmez.' }),
        el('label', {}, [el('span', { text: 'Karşılaştırma bütçe filtresi' }), el('input', { type: 'number', min: '0', value: state.maxBudget, placeholder: 'Sınır yok', onchange: (event) => { state.maxBudget = event.target.value; rerender(); } })]),
        ...compared.filter((p) => state.maxBudget === '' || p.assessment.budget != null && p.assessment.budget <= Number(state.maxBudget)).map((p) => el('div', { class: 'opt-card' }, [
          el('strong', { text: `${p.set.name} · ${p.grade}` }),
          el('span', { class: 'note', text: `${p.assessment.missing.length} eksik · ${fmt(p.assessment.budget)} coin · ${p.assessment.remainingTokens} kalan token · ${fmt(Number.isFinite(p.assessment.ratio) ? Math.round(p.assessment.ratio) : null)} coin/token${p.stale ? ' · Eski kaynak' : ''}` }),
          el('button', { type: 'button', text: 'Karşılaştırmadan çıkar', onclick: () => { state.comparisons = state.comparisons.filter((other) => other !== state.comparisons.find((x) => x.platform === p.platform && x.set.id === p.set.id)); rerender(); } }),
        ])),
        el('strong', { text: `Ortak alış planı: ${combined.items.length} farklı kart · ${fmt(combined.budget)} coin referans` }),
        el('ul', {}, combined.items.filter((e) => e.sets.length > 1).map((e) => el('li', { text: `${e.card.name} · ${e.sets.join(', ')}` }))),
        el('p', { class: 'note', text: 'Ortak kartlar bütçede bir kez sayılır. Plan bilgi amaçlıdır; işlem kuyruğu yalnız seçip listeye eklediğin tek takımı işler.' }),
      ]) : null,
      state.error || state.message ? el('p', { class: state.error ? 'error' : 'note', role: 'status', text: state.error || state.message }) : null,
      el('p', { class: 'note', text: 'Sıralama EasySBC piyasa verisidir; kişisel ilerlemeni içermez. Her aktarım yalnız bu takımın kartlarını aktif yapar. Eski kayıtlar geçmişte kalır ve işlenmez. Kaynak fiyatları canlı alış onayı değildir.' }),
    ].filter(Boolean));
  }
  H.easySbcUI = { render };
})(globalThis);
