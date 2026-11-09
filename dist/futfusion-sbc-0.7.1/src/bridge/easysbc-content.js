// Isolated-world bridge: only public Gallery reads reach the service worker.
window.addEventListener('message', (event) => {
  const msg = event.data;
  if (event.source !== window || event.origin !== location.origin || msg?.source !== 'futfusion-easysbc' || msg.type !== 'request' || typeof msg.id !== 'string') return;
  chrome.runtime.sendMessage({ type: 'EASYSBC_GALLERY_READ', action: msg.action, setId: msg.setId, platform: msg.platform }, (reply) => {
    const error = chrome.runtime.lastError?.message;
    window.postMessage({ source: 'futfusion-easysbc', type: 'response', id: msg.id, ...(error ? { error } : reply) }, location.origin);
  });
});
