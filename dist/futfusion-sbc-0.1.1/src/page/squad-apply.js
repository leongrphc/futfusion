// FutFusion integration. EA setPlayers/save/load flow follows AutoPilot-SBC's
// page/ea-data-bridge.js (GPL-3.0); planning remains the FutFox engine (MIT).
(function (root) {
  'use strict';
  const H = root.FutFox;
  let busy = false;

  function request(observable, label) {
    return new Promise((resolve, reject) => {
      const owner = {};
      const timer = setTimeout(() => {
        observable.unobserve?.(owner);
        reject(new Error(`${label}: EA yanıt vermedi. SBC’yi yeniden açıp kontrol et.`));
      }, 20000);
      observable.observe(owner, (obs, result) => {
        clearTimeout(timer);
        obs.unobserve(owner);
        if (result?.success === true && result.error == null) resolve(result);
        else reject(new Error(`${label}: EA hata ${result?.status ?? '?'}.`));
      });
    });
  }

  const itemOf = (slot) => slot?.getItem?.() ?? slot?.item ?? slot;
  function ensureOpen(id) {
    if (String(H.fut.openChallengeId()) !== String(id)) {
      throw new Error('Önce hesaplanan kadronun SBC’sini Web App’te aç.');
    }
  }

  function applyPoints(result) {
    ensureOpen(result.challengeId);
    const model = H.fut.currentController()?.getViewModel?.();
    const challenge = model?.getChallenge?.();
    if (String(challenge?.id) !== String(result.challengeId) ||
        typeof model?.selectItem !== 'function' || typeof model?.deselectItem !== 'function' ||
        typeof model?.getSelectedItemIds !== 'function' || typeof model?.getSelectedScore !== 'function' ||
        typeof model?.getSelectionLimit !== 'function' ||
        !['_itemEntityMap', '_itemScoreMap', '_itemTabMap'].every((key) => model[key]?.set && model[key]?.get)) {
      throw new Error('Bu puan SBC’sinin kart seçicisini açıp tekrar dene.');
    }
    const picks = result.picks;
    if (!Array.isArray(picks) || !picks.length || picks.length > model.getSelectionLimit() ||
        new Set(picks.map((p) => String(p.id))).size !== picks.length) {
      throw new Error('Kart seçimi boş veya seçim sınırını aşıyor. Yeniden hesapla.');
    }
    const remaining = Math.max(0, Number(challenge.scoreRequirement || 0) - Number(challenge.submittedScore || 0));
    if (remaining !== result.remaining) throw new Error('SBC puanı değişti. Kartları yeniden hesapla.');
    const tabs = root.OneClickSBCWorkAreaTab;
    const entries = picks.map((player) => {
      const item = player.item;
      const tab = player.storage ? tabs?.STORAGE : tabs?.CLUB;
      if (!item || String(item.id) !== String(player.id) || item.concept || item.isConcept?.() ||
          !Number.isFinite(Number(item.sbsScore)) || Number(item.sbsScore) <= 0 ||
          Number(item.sbsScore) !== Number(player.score) || tab == null) {
        throw new Error('Kart veya puanı değişti. Kartları yeniden hesapla.');
      }
      return { item, tab };
    });
    const score = entries.reduce((sum, { item }) => sum + Number(item.sbsScore), 0);
    if (score !== Number(result.score)) throw new Error('Önerilen kartların puanı uyuşmuyor. Yeniden hesapla.');
    const previous = model.getSelectedItemIds().map((id) => model._itemEntityMap.get(id));
    if (previous.some((item) => !item)) throw new Error('Mevcut seçimi EA ekranından temizleyip tekrar dene.');
    const added = [];
    try {
      previous.forEach((item) => model.deselectItem(item));
      for (const { item, tab } of entries) {
        model._itemEntityMap.set(item.id, item);
        model._itemScoreMap.set(item.id, item.sbsScore);
        model._itemTabMap.set(item.id, tab);
        if (!model.selectItem(item)) throw new Error('EA kart seçimini reddetti.');
        added.push(item);
      }
      const actual = model.getSelectedItemIds().map(String);
      if (actual.length !== entries.length || entries.some(({ item }) => !actual.includes(String(item.id))) ||
          Number(model.getSelectedScore()) !== score) throw new Error('EA kart seçimi öneriyle eşleşmiyor.');
    } catch (error) {
      try {
        added.forEach((item) => model.deselectItem(item));
        previous.forEach((item) => { if (!model.selectItem(item)) throw new Error('restore'); });
      } catch (_) {
        error.message += ' Önceki seçim geri yüklenemedi; kart seçicisini yeniden aç.';
      }
      throw error;
    }
    return { challengeId: challenge.id, count: entries.length, score };
  }

  async function apply(result) {
    if (busy) throw new Error('Bir kadro zaten yerleştiriliyor.');
    busy = true;
    let mutated = false;
    let saved = false;
    let squad;
    let backup;
    try {
      if (result?.kind === 'score') return applyPoints(result);
      if (!result || result.kind === 'score' || !result.feasible) {
        throw new Error('Önce tüm şartları sağlayan bir normal SBC kadrosu oluştur.');
      }
      if (result.rules?.some((rule) => !rule.supported)) {
        throw new Error('Bu SBC’nin bazı şartları çözücü tarafından desteklenmiyor.');
      }
      ensureOpen(result.challengeId);
      const challenge = H.fut.getChallenges().find((entry) => String(entry.id) === String(result.challengeId))?.challenge;
      if (!challenge) throw new Error('SBC bulunamadı. Refresh ile yenile.');
      const required = H.fut.requiredSlotsFor(challenge);
      if (!required.length || required.some((i) => !result.required?.has(i)) || result.required.size !== required.length) {
        throw new Error('SBC yuvaları değişmiş. Kadroyu yeniden hesapla.');
      }
      const lookup = new Map([...H.fut.knownClubItems(), ...H.fut.knownStorageItems()].map((item) => [String(item.id), item]));
      const selected = required.map((index) => {
        const player = result.squad[index]?.player;
        const item = player && lookup.get(String(player.id));
        if (!player || player.source !== 'club' || !item || item.isConcept?.() || item.concept) {
          throw new Error('Kadrodaki tüm kartlar kulübünde veya SBC deposunda olmalı. Market önerileri otomatik yerleştirilemez.');
        }
        if (item.isLimitedUse?.() || item.isTimeLimited?.() || item.isActiveInTimedEvolution?.() || item.loans >= 0) {
          throw new Error('Kadrodaki bir oyuncu SBC için kullanılamıyor. Kadroyu yeniden hesapla.');
        }
        return { index, item };
      });
      if (new Set(selected.map(({ item }) => String(item.id))).size !== selected.length ||
          new Set(selected.map(({ item }) => String(item.definitionId))).size !== selected.length) {
        throw new Error('Aynı oyuncu veya kart birden fazla yuvaya yerleştirilemez.');
      }
      const service = root.services.SBC;
      if (typeof service.saveChallenge !== 'function' || typeof service.loadChallenge !== 'function') {
        throw new Error('EA kadro kaydetme arayüzü bulunamadı.');
      }
      const initial = await request(service.loadChallenge(challenge), 'SBC yükleme');
      ensureOpen(result.challengeId);
      squad = initial.data?.squad ?? initial.response?.squad ?? challenge.squad;
      challenge.squad = squad;
      if (typeof squad?.setPlayers !== 'function' || typeof squad?.getPlayers !== 'function') {
        throw new Error('SBC kadrosu yüklenmedi. SBC’yi yeniden aç.');
      }
      backup = squad.getPlayers().map((slot) => itemOf(slot) ?? null);
      const players = Array.from({ length: Math.max(11, backup.length) }, (_, i) => required.includes(i) ? null : backup[i] ?? null);
      const piles = root.ItemPile ?? root.services.Item?.UTItemPileEnum ?? root.UTItemPileEnum ?? {};
      const storage = selected.filter(({ item }) => item.pile === (piles.STORAGE ?? 10)).map(({ item }) => item);
      if (storage.length) {
        if (typeof root.services.Item?.move !== 'function') throw new Error('Depodan oyuncu taşıma arayüzü bulunamadı.');
        await request(root.services.Item.move(storage, piles.CLUB ?? 7), 'Depodan kulübe taşıma');
      }
      ensureOpen(result.challengeId);
      for (const { index, item } of selected) players[index] = item;
      mutated = true;
      squad.removeAllItems?.();
      squad.setPlayers(players, true);
      await request(service.saveChallenge(challenge), 'Kadroyu kaydetme');
      saved = true;
      // Read server state rather than treating a local setPlayers call as success.
      const reload = service.sbcDAO?.loadChallenge
        ? service.sbcDAO.loadChallenge(challenge.id, challenge.isInProgress?.() ?? false)
        : service.loadChallenge(challenge);
      const loaded = await request(reload, 'Kaydedilen kadroyu doğrulama');
      const canonical = loaded.data?.squad ?? loaded.response?.squad ?? challenge.squad;
      const actual = canonical?.getPlayers?.();
      if (!Array.isArray(actual) || selected.some(({ index, item }) => String(itemOf(actual[index])?.id) !== String(item.id))) {
        throw new Error('EA kaydındaki oyuncular beklenen kadroyla eşleşmiyor. SBC’yi yeniden açıp kontrol et.');
      }
      squad.setPlayers(actual.map((slot) => itemOf(slot) ?? null), true);
      challenge.squad = squad;
      challenge.onDataChange?.notify?.({ squad });
      return { challengeId: challenge.id, count: selected.length };
    } catch (error) {
      // Local rollback only: a failed/timeout request may still have reached EA.
      // Never make a second server write pretending it can undo such a request.
      if (mutated && !saved && backup) {
        try { squad.setPlayers(backup, true); } catch (_) { /* retain original error */ }
        error.message += ' Yerel görünüm geri alındı; sunucu durumunu SBC’yi yeniden açarak kontrol et.';
      }
      throw error;
    } finally {
      busy = false;
    }
  }

  H.squadApply = { apply };
})(globalThis);
