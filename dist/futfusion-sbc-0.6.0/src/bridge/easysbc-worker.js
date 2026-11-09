// Fixed public endpoints only. No tokens, EA identifiers, cookies or club upload.
chrome.runtime.onMessage.addListener((message, sender, respond) => {
  if (message?.type !== 'EASYSBC_GALLERY_READ') return;
  const url = sender.url || '';
  if (!/^https:\/\/www\.ea\.com\/(?:[^/]+\/)?ea-sports-fc\/ultimate-team\/web-app\//.test(url)) { respond({ error: 'Geçersiz kaynak.' }); return; }
  const action = message.action;
  const validId = Number.isSafeInteger(message.setId) && message.setId > 0 && message.setId < 1000000;
  if (action !== 'catalog' && !(action === 'solution' && validId)) { respond({ error: 'Geçersiz Gallery isteği.' }); return; }
  const path = action === 'catalog' ? '/gallery/sets' : `/gallery/solutions/${message.setId}`;
  (async () => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 18000);
    try {
      const response = await fetch(`https://api-fc27.easysbc.io${path}`, { method: 'GET', credentials: 'omit', cache: 'no-store',
        redirect: 'error', headers: { Platform: message.platform === 'pc' ? 'PC' : 'Playstation' }, signal: controller.signal });
      if (!response.ok) throw new Error(`EasySBC yanıtı: ${response.status}.`);
      const text = await response.text();
      if (text.length > 3000000) throw new Error('EasySBC yanıtı çok büyük.');
      respond({ data: JSON.parse(text) });
    } catch (error) { respond({ error: error.name === 'AbortError' ? 'EasySBC isteği zaman aşımına uğradı.' : error.message }); }
    finally { clearTimeout(timer); }
  })();
  return true;
});
