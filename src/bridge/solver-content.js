// Only local, serializable planning data is passed to the extension worker.
window.addEventListener('message', (event) => {
  const msg = event.data;
  if (event.source !== window || event.origin !== location.origin || msg?.source !== 'futfusion-solver' || msg.type !== 'request' || typeof msg.id !== 'string') return;
  chrome.runtime.sendMessage({ type: 'FUTFUSION_SOLVE', input: msg.input }, (reply) => {
    const error = chrome.runtime.lastError?.message;
    window.postMessage({ source: 'futfusion-solver', type: 'response', id: msg.id, ...(error ? { error } : reply) }, location.origin);
  });
});
