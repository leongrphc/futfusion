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

  async function apply(result) {
    if (busy) throw new Error('Bir kadro zaten yerleştiriliyor.');
    busy = true;
    let mutated = false;
    let saved = false;
    let squad;
    let backup;
    try {
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
