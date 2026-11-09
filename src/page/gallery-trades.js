(function (root) {
  'use strict';
  const H = root.FutFox;
  const C = H.galleryTrades;
  let message = '';
  let marketBusy = false;
  let batchStatus = null;
  const marketStatus = new Map();
  const fmt = (n) => n.toLocaleString('tr-TR');

  function render({ el, results, res, plan, rerender }) {
    const persona = H.fut.galleryMemory().persona;
    const key = `futfusion.galleryTrades.v1.${persona}`;
    let ledger;
    let storageError = '';
    try { ledger = C.read(JSON.parse(root.localStorage.getItem(key) || 'null')); }
    catch (_) { ledger = C.empty(); storageError = 'Alış listesi okunamadı. Tarayıcı depolamasını kontrol et; kayıtların üzerine yazılmadı.'; }
    const persist = (next, text = '') => {
      if (storageError) return;
      if (String(H.fut.galleryMemory().persona) !== String(persona)) { message = 'EA hesabı değişti. Listeyi yenile.'; rerender(); return; }
      try {
        root.localStorage.setItem(key, JSON.stringify(next));
        message = text;
      } catch (_) { message = 'Değişiklik kaydedilemedi. Tarayıcı depolamasını kontrol et.'; }
      rerender();
    };
    const known = H.fut.galleryCards();
    const seen = new Set(known.filter((c) => !c.loan).map(C.cardKey));
    const entries = C.activeEntries(ledger, res?.id)
      .sort((a, b) => Number(a.sold) - Number(b.sold) || b.sets.length - a.sets.length || a.createdAt - b.createdAt);
    const scope = { ...ledger, entries };
    const total = C.summarize(scope);
    const buyable = entries.filter((e) => !e.bought && !e.purchaseState && !e.sold);
    const priced = buyable.map((entry) => ({ entry, quote: H.galleryMarket?.peek(entry.card) })).filter((e) => e.quote);
    const buyCap = priced.reduce((sum, e) => sum + e.quote.price, 0);
    const listable = entries.filter((e) => e.bought && e.confirmed && !e.sold && !e.listingState && e.purchasedItemId && H.galleryMarket?.validPrice?.(e.listPrice ?? e.buy));
    const resaleTotal = listable.reduce((sum, e) => sum + (e.listPrice ?? e.buy), 0);
    const workflowEntries = entries.filter((e) => !e.sold && !(e.listingState === 'listed' && e.listingVerified) && !e.purchaseState);
    const activeSpent = entries.filter((e) => e.bought).reduce((sum, e) => sum + (e.buy || 0), 0);
    const workflowBudget = ledger.workflowBudget ?? (priced.length === buyable.length ? buyCap + activeSpent : null);
    const strictWrite = (entryKey, patch) => {
      if (String(H.fut.galleryMemory().persona) !== String(persona)) throw new Error('EA hesabı değişti.');
      const latest = C.read(JSON.parse(root.localStorage.getItem(key) || 'null'));
      if (!latest.entries.some((e) => e.key === entryKey)) throw new Error('Kart listeden çıkarılmış.');
      root.localStorage.setItem(key, JSON.stringify(C.record(latest, entryKey, patch)));
    };
    const update = (entry, patch) => {
      const latest = C.read(JSON.parse(root.localStorage.getItem(key) || 'null'));
      persist(C.record(latest, entry.key, patch));
    };
    const marketActionInner = async (entry, buying = false, displayedPrice = null) => {
      if (marketBusy) return;
      marketBusy = true;
      const statusKey = `${persona}:${entry.key}`;
      try {
        marketStatus.set(statusKey, buying ? 'İlan kontrol edilip satın alınıyor…' : 'Piyasada aranıyor…');
        if (buying) {
          // Persist a marker before the request so a page reload cannot cause a duplicate buy.
          const latest = C.read(JSON.parse(root.localStorage.getItem(key) || 'null'));
          if (!latest.entries.some((e) => e.key === entry.key && !e.bought && !e.purchaseState)) throw new Error('Alış durumu değişti. Listeyi kontrol et.');
          latest.entries = latest.entries.map((e) => e.key === entry.key ? { ...e, purchaseState: 'pending' } : e);
          root.localStorage.setItem(key, JSON.stringify(latest));
          rerender();
          const result = await H.galleryMarket.buy(entry.card, displayedPrice);
          update(entry, { bought: true, buy: result.price, purchasedItemId: result.itemId, purchaseState: null });
          marketStatus.set(statusKey, result.moveError
            ? `${fmt(result.price)} coin karşılığında alındı. Kulübe gönderilemedi; Transfer Hedefleri’nden gönder. ${result.moveError}`
            : `${fmt(result.price)} coin karşılığında alındı ve kulübe gönderildi. Gallery kaydını kontrol et.`);
        } else {
          rerender();
          const quote = await H.galleryMarket.find(entry.card, (text) => { marketStatus.set(statusKey, text); rerender(); });
          marketStatus.set(statusKey, `Bulunan en düşük Satın Al fiyatı: ${fmt(quote.price)} coin. Satın almak için aşağıdaki düğmeye bas.`);
        }
      } catch (error) {
        marketStatus.set(statusKey, error.message);
        if (buying) {
          try { update(entry, { purchaseState: error.uncertain ? 'unknown' : null }); }
          catch (_) { marketStatus.set(statusKey, `${error.message} Kayıt güncellenemedi; alış durumunu oyunda kontrol et.`); }
        }
      } finally { marketBusy = false; rerender(); }
    };
    const runBatchInner = async (mode) => {
      if (marketBusy) return;
      const activeId = ledger.activeBatch?.id;
      if (!activeId) return;
      const tasks = mode === 'all' ? workflowEntries.map((entry) => ({ ...entry, cap: H.galleryMarket?.peek(entry.card)?.price }))
        : mode === 'find' ? buyable : mode === 'buy' ? priced.map((e) => ({ ...e.entry, cap: e.quote.price })) : listable;
      marketBusy = true;
      batchStatus = { persona, mode, index: 0, total: tasks.length, text: 'Başlıyor…' };
      rerender();
      try {
        const current = C.read(JSON.parse(root.localStorage.getItem(key) || 'null'));
        if (current.activeBatch?.id !== activeId) throw new Error('Aktif takım değişti. Listeyi yenile.');
        if (mode === 'all' && current.workflowBudget == null) { current.workflowBudget = workflowBudget ?? 0; root.localStorage.setItem(key, JSON.stringify(current)); }
        const spentBefore = C.activeEntries(current).filter((e) => e.bought).reduce((sum, e) => sum + (e.buy || 0), 0);
        const summary = await H.galleryBatch.run({ mode, entries: tasks, budget: Math.max(0, (current.workflowBudget ?? workflowBudget ?? 0) - spentBefore),
          getEntry: (entryKey) => {
            if (String(H.fut.galleryMemory().persona) !== String(persona)) throw new Error('EA hesabı değişti.');
            const latest = C.read(JSON.parse(root.localStorage.getItem(key) || 'null'));
            if (latest.activeBatch?.id !== activeId || !latest.activeBatch.keys.includes(entryKey)) throw new Error('Aktif takım değişti; önceki sıra durduruldu.');
            return latest.entries.find((e) => e.key === entryKey);
          },
          write: strictWrite,
          progress: (event) => {
            if (event.entry) marketStatus.set(`${persona}:${event.entry.key}`, event.text);
            const isError = event.error || (event.summary?.failed || 0) > (batchStatus?.summary?.failed || 0);
            if (isError) {
              const saved = C.read(JSON.parse(root.localStorage.getItem(key) || 'null'));
              saved.events = [...saved.events, { at: Date.now(), key: event.entry?.key || '', name: event.entry?.card.name || '', text: event.text }].slice(-200);
              root.localStorage.setItem(key, JSON.stringify(saved));
            }
            const lastError = isError ? `${event.entry?.card.name || 'Oyuncu'}: ${event.text}` : batchStatus?.lastError;
            batchStatus = { ...batchStatus, ...event, name: event.entry?.card.name, persona, mode, lastError };
            rerender();
          },
        });
        batchStatus = { ...batchStatus, text: `${summary.stopped ? 'Durduruldu' : 'Tamamlandı'} · ${summary.done} başarılı · ${summary.failed} hata · ${summary.skipped} atlandı${mode === 'all' ? ` · ${fmt(summary.spent)} coin doğrulanan alış` : ''}`, finished: true };
      } catch (error) { batchStatus = { ...batchStatus, text: error.message, finished: true }; }
      finally { marketBusy = false; rerender(); }
    };
    const locked = async (action) => {
      try { return H.accountLock ? await H.accountLock.run(persona, action) : await action(); }
      catch (error) { message = error.message; rerender(); }
    };
    const marketAction = (...args) => locked(() => marketActionInner(...args));
    const runBatch = (...args) => locked(() => runBatchInner(...args));
    const priceField = (entry, field, label) => el('label', {}, [
      el('span', { text: label }),
      el('input', { type: 'number', min: '0', step: '1', inputmode: 'numeric', disabled: marketBusy, value: entry[field] ?? '', placeholder: 'Bilinmiyor',
        onchange: (event) => {
          const value = C.finitePrice(event.target.value);
          if (event.target.value !== '' && (value == null || field === 'listPrice' && (!H.galleryMarket?.validPrice(value) || value < 200))) { message = field === 'listPrice' ? 'Hemen Al fiyatı en az 200 coin ve geçerli EA fiyat kademesinde olmalı.' : 'Fiyat sıfır veya pozitif tam sayı olmalı.'; rerender(); return; }
          update(entry, { [field]: value });
        } }),
    ]);
    return el('section', { class: 'gallery-trades' }, [
      el('div', { class: 'trade-heading' }, [
        el('div', {}, [el('span', { class: 'trade-eyebrow', text: 'GALLERY · KULÜBE GİRİŞ TAKİBİ' }), el('h3', { text: 'Kart işlem merkezi' })]),
        el('span', { class: 'trade-count', text: `${entries.length} aktif kart` }),
      ]),
      el('p', { class: 'note', text: ledger.activeBatch ? `Aktif takım: ${ledger.activeBatch.name}. Yalnız son eklediğin bu grubun kartları işlenir; bitince durur.` : 'Aktif takım yok. Oyuncuları getirip bu kadronun eksiklerini alış listesine ekle. Geçmiş oyuncular toplu işleme alınmaz.' }),
      el('ol', { class: 'workflow-track', 'aria-label': 'İşlem aşamaları' }, ['Kadroyu seç', 'Bütçeyi belirle', 'Al ve doğrula', 'Satışı takip et'].map((label, index) => el('li', { class: index === (!entries.length ? 0 : !entries.some((e) => e.bought) ? 1 : entries.every((e) => e.listingVerified || e.sold) ? 3 : 2) ? 'current' : '', text: label }))),
      el('div', { class: 'trade-metrics' }, [
        el('div', {}, [el('span', { text: 'ALIM ÖNİZLEMESİ' }), el('strong', { text: `${fmt(buyCap)}` }), el('small', { text: `${priced.length} / ${buyable.length} bekleyen kartın fiyatı var` })]),
        el('div', {}, [el('span', { text: 'SATIŞA HAZIR' }), el('strong', { text: `${listable.length} kart` }), el('small', { text: `${fmt(resaleTotal)} coin · alış fiyatlarından` })]),
        el('div', {}, [el('span', { text: 'TAHMİNİ VERGİ KAYBI' }), el('strong', { text: `${fmt(listable.reduce((sum, e) => sum + Math.ceil(e.buy * ledger.taxPercent / 100), 0))}` }), el('small', { text: `%${ledger.taxPercent} varsayımıyla, hepsi satılırsa` })]),
      ]),
      entries.some((e) => e.bought && !e.sold && !e.listingVerified) ? el('p', { class: 'trade-progress', text: 'Yarım kalan takım: Tümünü yap ile alınmış kartlardan devam edebilirsin. Doğrulanan alışlar tekrarlanmaz; mevcut harcamalar toplam bütçeden düşülür.' }) : null,
      el('div', { class: 'trade-batch' }, [
        el('label', { class: 'workflow-budget' }, [
          el('span', { text: 'Tümünü yap · toplam alış bütçesi (coin)' }),
          el('input', { type: 'number', min: '0', step: '1', disabled: marketBusy, value: workflowBudget ?? '', placeholder: 'Örn. 50000', 'aria-label': 'Tümünü yap toplam alış bütçesi', onchange: (event) => {
            const amount = C.finitePrice(event.target.value);
            if (amount == null) { message = 'Toplam bütçe sıfır veya pozitif tam sayı olmalı.'; rerender(); return; }
            const latest = C.read(JSON.parse(root.localStorage.getItem(key) || 'null'));
            persist({ ...latest, workflowBudget: amount });
          } }),
        ]),
        el('p', { class: 'note', text: `Bu takımda doğrulanan harcama: ${fmt(activeSpent)} coin · Kalan alış bütçesi: ${workflowBudget == null ? 'bütçe gir' : fmt(Math.max(0, workflowBudget - activeSpent)) + ' coin'}` }),
        el('button', { class: 'primary', type: 'button', disabled: marketBusy || !!storageError || !workflowEntries.length || !H.galleryBatch || (buyable.length > 0 && !(workflowBudget > 0)), text: `Tümünü yap · ${workflowEntries.length} kart · ${fmt(workflowBudget || 0)} coin bütçe`, onclick: () => runBatch('all') }),
        el('p', { class: 'note', text: 'Yalnız aktif takım: en ucuzu bul → bütçe içinde al → kulübe girişini kontrol et → aktif satış ilanı aç. Önceki takımların kartlarına geçilmez.' }),
        el('details', { class: 'trade-settings' }, [el('summary', { text: 'Adımları ayrı ayrı yönet' }),
        el('button', { type: 'button', disabled: marketBusy || !!storageError || !buyable.length || !H.galleryBatch, text: `1 · ${buyable.length} kartın fiyatını bul`, onclick: () => runBatch('find') }),
        el('button', { type: 'button', disabled: marketBusy || !!storageError || !priced.length || !H.galleryBatch, text: `2 · ${priced.length} kartı al · en fazla ${fmt(buyCap)} coin`, onclick: () => runBatch('buy') }),
        el('button', { type: 'button', disabled: marketBusy || !!storageError || !listable.length || !H.galleryBatch, text: `3 · ${listable.length} kartı hedef fiyatından satışa koy`, onclick: () => runBatch('list') }),
        ]),
      ]),
      el('p', { class: 'note', text: 'Toplam alış bütçesi ve kart tavanları aşılmaz. Satış hedefi varsayılan olarak alış fiyatıdır; karttan değiştirebilirsin. Başlangıç teklifi bir alt kademedir. Süre 1 saat; satışta vergi uygulanır.' }),
      batchStatus && String(batchStatus.persona) === String(persona) ? el('div', { class: 'trade-progress', role: 'status', 'aria-live': 'polite' }, [
        el('strong', { text: batchStatus.finished ? 'İşlem sonucu' : `${batchStatus.index} / ${batchStatus.total} · ${batchStatus.name || 'Toplu işlem'}` }),
        el('span', { text: batchStatus.text }),
        batchStatus.lastError ? el('p', { class: 'error', text: `Son hata: ${batchStatus.lastError}` }) : null,
        !batchStatus.finished ? el('button', { type: 'button', text: 'Sırayı durdur', onclick: () => { H.galleryBatch.cancel(); batchStatus.text = 'Durduruluyor; başlamış istek tamamlanacak.'; rerender(); } }) : null,
      ].filter(Boolean)) : null,
      entries.some((e) => e.bought && !e.confirmed && !e.sold) ? el('button', { type: 'button', disabled: marketBusy || !!storageError, text: 'Alınanların Gallery kaydını kontrol ettim · hepsini doğrula', onclick: () => {
        const ids = new Set(entries.filter((e) => e.bought && !e.sold).map((e) => e.key));
        const latest = C.read(JSON.parse(root.localStorage.getItem(key) || 'null'));
        persist({ ...latest, entries: latest.entries.map((e) => ids.has(e.key) ? { ...e, confirmed: true } : e) });
      } }) : null,
      res ? el('div', { class: 'row' }, [
        el('button', { type: 'button', disabled: marketBusy || !plan?.adds?.length || !!storageError, text: 'Önerilen eksikleri listeye ekle', onclick: () => {
          const next = C.addPlan(ledger, plan, res, results, known);
          persist(next.ledger, `${next.added} yeni kart eklendi. Hafızadaki kartlar atlandı. En ucuzu bul ile alış fiyatını araştır; satış beklentisini kendin gir.`);
        } }),
        !plan ? el('p', { class: 'note', text: 'Önce aşağıdaki “Suggest cards for” alanından hedef dereceyi seç.' }) : null,
      ].filter(Boolean)) : null,
      el('details', { class: 'trade-settings' }, [
      el('summary', { text: 'Maliyet ve vergi ayrıntıları' }),
      el('label', { class: 'trade-tax' }, [
        el('span', { text: 'Satış vergisi varsayımı (%)' }),
        el('input', { type: 'number', min: '0', max: '100', step: '0.1', disabled: marketBusy, value: ledger.taxPercent,
          onchange: (event) => {
            const taxPercent = Number(event.target.value);
            if (event.target.value === '' || !Number.isFinite(taxPercent) || taxPercent < 0 || taxPercent > 100) {
              message = 'Vergi oranı 0–100 arasında olmalı.'; rerender(); return;
            }
            persist({ ...ledger, taxPercent });
          } }),
      ]),
      el('p', { class: 'note', text: 'En ucuzu bul canlı ilanları araştırır; fiyat 60 saniye geçerlidir. Satış beklentisini kendin gir. Eksi net maliyet kâr anlamına gelir.' }),
      el('div', { class: 'trade-summary' }, [
        el('strong', { text: `${total.count} kart · ${fmt(total.purchaseBudget)} alış toplamı${total.unknownBuy ? ` (${total.unknownBuy} fiyat eksik)` : ''}` }),
        el('span', { text: `Vergi sonrası tahmini net maliyet: ${fmt(total.projectedCost)}${total.unknownCost ? ` (${total.unknownCost} kart hesaba dahil değil)` : ''}` }),
      ]),
      ]),
      storageError || message ? el('p', { role: 'status', class: storageError ? 'error' : 'note', text: storageError || message }) : null,
      ...entries.map((entry) => {
        const value = C.economics(entry, ledger.taxPercent);
        const card = entry.card;
        const observed = seen.has(entry.key);
        const quote = H.galleryMarket?.peek(entry.card);
        const status = marketStatus.get(`${persona}:${entry.key}`);
        return el('details', { class: 'trade-entry', open: !entry.sold && entries.length <= 2 }, [
          el('summary', {}, [
            el('span', { class: 'trade-rating', text: String(card.rating || '?') }),
            el('span', { class: 'trade-card-name', text: card.name || `#${card.defId}` }),
            el('span', { class: `trade-badge${entry.listingState === 'listed' && entry.listingVerified || entry.sold ? ' done' : ''}`, text: observed && !entry.bought && !entry.purchaseState ? 'Hafızada' : C.stage(entry) }),
          ]),
          el('p', { class: 'note', text: `Kart sürümü: ${card.rarityId ?? '?'} · Kart ID: ${card.defId} · ${entry.sets.length} sete katkı adayı` }),
          el('p', { class: 'note', text: entry.sets.map((s) => s.name).join(' · ') }),
          el('p', { class: 'note', text: 'Katkı sayısı ekleme anındaki boş yuvalarla eşleşmedir; derece veya bonus garantisi değildir.' }),
          el('div', { class: 'row' }, [
            el('button', { type: 'button', text: 'En ucuzu bul', disabled: marketBusy || !!storageError || entry.bought || !!entry.purchaseState || !H.galleryMarket, onclick: () => marketAction(entry) }),
            el('button', { type: 'button', text: quote ? `${fmt(quote.price)} coin — Satın al` : 'Önce fiyat bul', disabled: marketBusy || !!storageError || entry.bought || !!entry.purchaseState || !quote || quote.expired, onclick: () => marketAction(entry, true, quote.price) }),
          ]),
          status ? el('p', { class: 'note', role: 'status', text: status }) : null,
          entry.purchaseState ? el('p', { class: 'error', text: 'Alış sonucu henüz doğrulanmadı. Kulübü ve Transfer Hedefleri’ni kontrol et; tekrar satın alma engellendi. Aldıysan “Aldım”, almadığından eminsen “Durumu sıfırla” ile devam et.' }) : null,
          entry.listingState ? el('p', { class: entry.listingVerified ? 'note' : 'error', text: entry.listingVerified ? `${fmt(entry.listedPrice || entry.buy)} coin Hemen Al fiyatıyla aktif ilan doğrulandı. Satıldığı henüz doğrulanmadı.` : 'Aktif satış ilanı doğrulanmadı. Tümünü yap, önce Transfer Listesi’ni kontrol ederek bu karttan devam edebilir.' }) : null,
          entry.listingState && !entry.listingVerified ? el('div', { class: 'row' }, [
            el('button', { type: 'button', disabled: marketBusy, text: 'Transfer Listesi’nde satışta · doğruladım', onclick: () => update(entry, { listingState: 'listed', listingVerified: true, listedPrice: entry.buy, sell: entry.buy }) }),
            el('button', { type: 'button', disabled: marketBusy, text: 'Kontrol ettim, satışta değil · yeniden aç', onclick: () => update(entry, { listingState: null, listingVerified: false }) }),
          ]) : null,
          entry.bought && !entry.purchasedItemId ? el('div', {}, [
            el('p', { class: 'note', text: 'Eski alış: kart ID’si kayıtlı değil. Kulüpte bu sürümün tek takas edilebilir kopyası varsa önce bu alışa bağla.' }),
            el('button', { type: 'button', text: 'Kulüpteki tek kopyayı bu alışa bağla', disabled: marketBusy || !H.galleryMarket?.bindOwned, onclick: () => {
              try { update(entry, { purchasedItemId: H.galleryMarket.bindOwned(entry.card) }); }
              catch (error) { message = error.message; rerender(); }
            } }),
          ]) : null,
          el('div', { class: 'trade-prices' }, [priceField(entry, 'buy', 'Alış fiyatı'), priceField(entry, 'sell', 'Satış fiyatı / beklenti')]),
          entry.bought && !entry.listingState && !entry.sold ? el('details', { class: 'trade-settings' }, [el('summary', { text: 'Satış fiyatını belirle' }),
            el('p', { class: 'note', text: `Hemen Al hedefi: ${fmt(entry.listPrice ?? entry.buy ?? 0)} coin. Hedef fiyattan satış gerçekleşirse vergi sonrası sonuç: ${entry.buy == null ? '?' : fmt((entry.listPrice ?? entry.buy) - Math.ceil((entry.listPrice ?? entry.buy) * ledger.taxPercent / 100) - entry.buy)} coin. Başlangıç teklifi bir alt kademedir; daha düşük fiyata satış olabilir.` }),
            el('div', { class: 'row' }, [
              el('button', { type: 'button', text: 'Alış fiyatını kullan', disabled: marketBusy, onclick: () => update(entry, { listPrice: null }) }),
              el('button', { type: 'button', text: `Vergi sonrası başa baş · ${fmt(C.breakEven(entry.buy, ledger.taxPercent) || 0)}`, disabled: marketBusy || !C.breakEven(entry.buy, ledger.taxPercent), onclick: () => update(entry, { listPrice: C.breakEven(entry.buy, ledger.taxPercent) }) }),
            ]), priceField(entry, 'listPrice', 'Özel Hemen Al fiyatı'),
          ]) : null,
          entry.purchasedItemId && !entry.sold && H.galleryMarket?.inspectSale ? el('button', { type: 'button', disabled: marketBusy, text: 'Satış durumunu kontrol et', onclick: () => locked(async () => {
            if (marketBusy) return; marketBusy = true; rerender();
            try { const sale = await H.galleryMarket.inspectSale(entry);
              if (sale.state === 'sold') update(entry, { bought: true, confirmed: true, sold: true, sell: sale.price, purchaseState: null });
              else if (sale.state === 'listed') update(entry, { listingState: 'listed', listingVerified: true, listedPrice: sale.price, sell: sale.price });
              else { message = sale.state === 'inactive' ? 'Kart Transfer Listesi’nde, aktif ilanı yok. Satış durumu yeniden açıldı.' : 'Satış sonucu kesinleşmedi. Transfer Listesi’ni oyunda kontrol et; kayıt değiştirilmedi.'; if (sale.state === 'inactive') update(entry, { listingState: null, listingVerified: false }); }
            } catch (error) { message = error.message; }
            finally { marketBusy = false; rerender(); }
          }) }) : null,
          el('p', { text: value.cost == null ? 'Net maliyet için iki fiyatı da gir.' : `Tahmini vergi: ${fmt(value.tax)} · Net maliyet: ${fmt(value.cost)}` }),
          observed && !entry.confirmed ? el('p', { class: 'note', text: 'Bu sürüm kulüp hafızasında görülmüş. Gallery’de sayıldığını oyunda ayrıca kontrol et.' }) : null,
          el('div', { class: 'row' }, [
            el('button', { type: 'button', text: entry.bought ? 'Alındı ✓' : 'Aldım', disabled: marketBusy || entry.bought, onclick: () => update(entry, { bought: true, purchaseState: null }) }),
            el('button', { type: 'button', text: entry.confirmed ? 'Gallery doğrulandı ✓' : 'Gallery’de doğruladım', disabled: marketBusy || entry.confirmed, onclick: () => update(entry, { bought: true, confirmed: true, purchaseState: null }) }),
            el('button', { type: 'button', text: entry.sold ? 'Satıldı ✓' : 'Sattım', disabled: marketBusy || entry.sold || !entry.confirmed || value.cost == null, onclick: () => update(entry, { sold: true }) }),
            el('button', { type: 'button', text: 'Durumu sıfırla', disabled: marketBusy, onclick: () => {
              H.galleryMarket?.acknowledge(entry.card);
              marketStatus.delete(`${persona}:${entry.key}`);
              update(entry, { bought: false, confirmed: false, sold: false, purchaseState: null, listingState: null, listingVerified: false, purchasedItemId: null, listedPrice: null });
            } }),
            el('button', { type: 'button', text: 'Listeden çıkar', disabled: marketBusy, onclick: () => persist({ ...ledger, entries: ledger.entries.filter((e) => e.key !== entry.key) }) }),
          ]),
        ].filter(Boolean));
      }),
      !entries.length ? el('p', { class: 'note', text: 'Liste boş. Bir seti aç, hedef derece için önerileri hesaplat ve eksikleri listeye ekle.' }) : null,
      ledger.entries.length > entries.length ? el('details', { class: 'trade-settings' }, [
        el('summary', { text: `Geçmiş · ${ledger.entries.length - entries.length} kart (toplu işlem dışında)` }),
        el('p', { class: 'note', text: 'Önceki takımların kayıtları saklanır; aktif sıra bu kartları almaz, taşımaz veya satışa çıkarmaz.' }),
        el('ul', {}, ledger.entries.filter((old) => !entries.some((entry) => entry.key === old.key)).map((old) => el('li', { text: `${old.card.name || old.key} · ${old.sold ? 'Satıldı' : old.listingVerified ? 'Satışta' : old.bought ? 'Önceden alındı' : 'Eski öneri'}` }))),
      ]) : null,
      el('details', { class: 'trade-settings' }, [
        el('summary', { text: 'Hesap özeti ve işlem günlüğü' }),
        ...Object.entries({ 'Gerçekleşen alış': C.accounting(ledger).spent, 'Satış bekleyen kartlarda bağlı': C.accounting(ledger).tied, 'Beklenen net satış geliri': C.accounting(ledger).expected, 'Gerçekleşen net sonuç': C.accounting(ledger).realized }).map(([label, value]) => el('p', { class: 'note', text: `${label}: ${fmt(value)} coin` })),
        el('p', { class: 'note', text: 'Net sonuç yalnız satıldı olarak doğrulanan, alış ve satış fiyatı girilmiş kartları içerir. Pozitif değer kârdır.' }),
        el('ul', { class: 'event-log' }, [...ledger.events].reverse().map((event) => el('li', { text: `${new Date(event.at).toLocaleString('tr-TR')} · ${event.name} · ${event.text}` }))),
        !ledger.events.length ? el('p', { class: 'note', text: 'Yeni işlemlerin burada kaydedilecek.' }) : null,
      ]),
      el('details', { class: 'trade-settings' }, [el('summary', { text: 'İşlem geçmişini yedekle' }),
        el('p', { class: 'note', text: 'Yedek bu EA hesabının alış listesini ve günlüğünü içerir. Yedeği yüklemek mevcut listeyi değiştirir; eski takım ve bütçe otomatik başlatılmaz.' }),
        el('button', { type: 'button', text: 'Yedeği indir', disabled: marketBusy, onclick: () => {
          const url = URL.createObjectURL(new Blob([JSON.stringify(C.backup(ledger, persona), null, 2)], { type: 'application/json' }));
          const link = document.createElement('a'); link.href = url; link.download = `futfusion-trades-${Date.now()}.json`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
        } }),
        el('label', { class: 'file' }, ['Yedeği yükle', el('input', { type: 'file', accept: '.json', disabled: marketBusy, 'aria-label': 'İşlem yedeğini yükle', onchange: async (event) => {
          try { const file = event.target.files[0]; if (!file) return; if (file.size > 3000000) throw new Error('Yedek en fazla 3 MB olabilir.'); const restored = C.restore(JSON.parse(await file.text()), persona); if (marketBusy) throw new Error('Önce devam eden işlemi bitir.'); await locked(() => {
            const current = C.read(JSON.parse(root.localStorage.getItem(key) || 'null'));
            if (current.entries.some((e) => e.purchaseState || e.listingState && !e.listingVerified)) throw new Error('Önce sonucu belirsiz işlemleri oyunda kontrol ederek çöz. Bu kayıtların üzerine yedek yüklenmedi.');
            persist(restored, 'Yedek yüklendi. Yeni bir kadro seçerek devam edebilirsin.');
          }); }
          catch (error) { message = error.message; rerender(); }
        } })]),
      ]),
    ].filter(Boolean));
  }
  H.galleryTradeUI = { render };
})(globalThis);
