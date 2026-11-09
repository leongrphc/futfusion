(function (root) {
  'use strict';
  const H = root.FutFox;
  const C = H.galleryTrades;
  let message = '';
  let marketBusy = false;
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
      try {
        root.localStorage.setItem(key, JSON.stringify(next));
        message = text;
      } catch (_) { message = 'Değişiklik kaydedilemedi. Tarayıcı depolamasını kontrol et.'; }
      rerender();
    };
    const known = H.fut.galleryCards();
    const seen = new Set(known.filter((c) => !c.loan).map(C.cardKey));
    const entries = ledger.entries.filter((e) => !res || e.sets.some((s) => String(s.id) === String(res.id)))
      .sort((a, b) => Number(a.sold) - Number(b.sold) || b.sets.length - a.sets.length || a.createdAt - b.createdAt);
    const scope = { ...ledger, entries };
    const total = C.summarize(scope);
    const update = (entry, patch) => {
      const latest = C.read(JSON.parse(root.localStorage.getItem(key) || 'null'));
      persist({ ...latest, entries: latest.entries.map((e) => e.key === entry.key ? { ...e, ...patch } : e) });
    };
    const marketAction = async (entry, buying = false, displayedPrice = null) => {
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
          update(entry, { bought: true, buy: result.price, purchaseState: null });
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
    const priceField = (entry, field, label) => el('label', {}, [
      el('span', { text: label }),
      el('input', { type: 'number', min: '0', step: '1', inputmode: 'numeric', value: entry[field] ?? '', placeholder: 'Bilinmiyor',
        onchange: (event) => {
          const value = C.finitePrice(event.target.value);
          if (event.target.value !== '' && value == null) { message = 'Fiyat sıfır veya pozitif tam sayı olmalı.'; rerender(); return; }
          update(entry, { [field]: value });
        } }),
    ]);
    return el('section', { class: 'gallery-trades' }, [
      el('h3', { text: 'Gallery alış–satış listesi' }),
      el('p', { class: 'note', text: 'En ucuzu bul → fiyatı gör → Satın al’a bas. Kart kulübe gönderilir; Gallery kaydını doğruladıktan sonra kendin sat.' }),
      res ? el('div', { class: 'row' }, [
        el('button', { type: 'button', disabled: !plan?.adds?.length || !!storageError, text: 'Önerilen eksikleri listeye ekle', onclick: () => {
          const next = C.addPlan(ledger, plan, res, results, known);
          persist(next.ledger, `${next.added} yeni kart eklendi. Hafızadaki kartlar atlandı. En ucuzu bul ile alış fiyatını araştır; satış beklentisini kendin gir.`);
        } }),
        !plan ? el('p', { class: 'note', text: 'Önce aşağıdaki “Suggest cards for” alanından hedef dereceyi seç.' }) : null,
      ].filter(Boolean)) : null,
      el('label', { class: 'trade-tax' }, [
        el('span', { text: 'Satış vergisi varsayımı (%)' }),
        el('input', { type: 'number', min: '0', max: '100', step: '0.1', value: ledger.taxPercent,
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
      storageError || message ? el('p', { role: 'status', class: storageError ? 'error' : 'note', text: storageError || message }) : null,
      ...entries.map((entry) => {
        const value = C.economics(entry, ledger.taxPercent);
        const card = entry.card;
        const observed = seen.has(entry.key);
        const quote = H.galleryMarket?.peek(entry.card);
        const status = marketStatus.get(`${persona}:${entry.key}`);
        return el('details', { class: 'trade-entry', open: !entry.sold }, [
          el('summary', { text: `${card.name || `#${card.defId}`} · ${card.rating || '?'} · ${card.foil ? 'Holographic · ' : ''}${entry.sold ? 'Satıldı' : entry.confirmed ? 'Gallery doğrulandı' : observed ? 'Kart hafızada' : entry.bought ? 'Alındı' : 'Alınacak'}` }),
          el('p', { class: 'note', text: `Kart sürümü: ${card.rarityId ?? '?'} · Kart ID: ${card.defId} · ${entry.sets.length} sete katkı adayı` }),
          el('p', { class: 'note', text: entry.sets.map((s) => s.name).join(' · ') }),
          el('p', { class: 'note', text: 'Katkı sayısı ekleme anındaki boş yuvalarla eşleşmedir; derece veya bonus garantisi değildir.' }),
          el('div', { class: 'row' }, [
            el('button', { type: 'button', text: 'En ucuzu bul', disabled: marketBusy || !!storageError || entry.bought || !!entry.purchaseState || !H.galleryMarket, onclick: () => marketAction(entry) }),
            el('button', { type: 'button', text: quote ? `${fmt(quote.price)} coin — Satın al` : 'Önce fiyat bul', disabled: marketBusy || !!storageError || entry.bought || !!entry.purchaseState || !quote || quote.expired, onclick: () => marketAction(entry, true, quote.price) }),
          ]),
          status ? el('p', { class: 'note', role: 'status', text: status }) : null,
          entry.purchaseState ? el('p', { class: 'error', text: 'Alış sonucu henüz doğrulanmadı. Kulübü ve Transfer Hedefleri’ni kontrol et; tekrar satın alma engellendi. Aldıysan “Aldım”, almadığından eminsen “Durumu sıfırla” ile devam et.' }) : null,
          el('div', { class: 'trade-prices' }, [priceField(entry, 'buy', 'Alış fiyatı'), priceField(entry, 'sell', 'Satış fiyatı / beklenti')]),
          el('p', { text: value.cost == null ? 'Net maliyet için iki fiyatı da gir.' : `Tahmini vergi: ${fmt(value.tax)} · Net maliyet: ${fmt(value.cost)}` }),
          observed && !entry.confirmed ? el('p', { class: 'note', text: 'Bu sürüm kulüp hafızasında görülmüş. Gallery’de sayıldığını oyunda ayrıca kontrol et.' }) : null,
          el('div', { class: 'row' }, [
            el('button', { type: 'button', text: entry.bought ? 'Alındı ✓' : 'Aldım', disabled: marketBusy || entry.bought, onclick: () => update(entry, { bought: true, purchaseState: null }) }),
            el('button', { type: 'button', text: entry.confirmed ? 'Gallery doğrulandı ✓' : 'Gallery’de doğruladım', disabled: marketBusy || entry.confirmed, onclick: () => update(entry, { bought: true, confirmed: true, purchaseState: null }) }),
            el('button', { type: 'button', text: entry.sold ? 'Satıldı ✓' : 'Sattım', disabled: marketBusy || entry.sold || !entry.confirmed || value.cost == null, onclick: () => update(entry, { sold: true }) }),
            el('button', { type: 'button', text: 'Durumu sıfırla', disabled: marketBusy, onclick: () => {
              H.galleryMarket?.acknowledge(entry.card);
              marketStatus.delete(`${persona}:${entry.key}`);
              update(entry, { bought: false, confirmed: false, sold: false, purchaseState: null });
            } }),
            el('button', { type: 'button', text: 'Listeden çıkar', disabled: marketBusy, onclick: () => persist({ ...ledger, entries: ledger.entries.filter((e) => e.key !== entry.key) }) }),
          ]),
        ].filter(Boolean));
      }),
      !entries.length ? el('p', { class: 'note', text: 'Liste boş. Bir seti aç, hedef derece için önerileri hesaplat ve eksikleri listeye ekle.' }) : null,
      el('p', { class: 'note', text: 'Bu liste bu tarayıcıda, EA hesabına göre ayrı saklanır. Gallery Export dosyasına dahil değildir. Yeni aldığın kartları görmek için Club → Load my club ile yenile.' }),
    ].filter(Boolean));
  }
  H.galleryTradeUI = { render };
})(globalThis);
