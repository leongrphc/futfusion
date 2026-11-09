const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const code = fs.readFileSync(path.join(__dirname, '../src/bridge/easysbc-worker.js'), 'utf8');
function fixture() {
  let handler; const calls = [];
  vm.runInNewContext(code, { chrome: { runtime: { onMessage: { addListener: (fn) => handler = fn } } },
    fetch: async (url, options) => { calls.push({ url, options }); return { ok: true, text: async () => JSON.stringify({ sample: true }) }; },
    AbortController, setTimeout, clearTimeout });
  const send = (message, url = 'https://www.ea.com/tr-tr/ea-sports-fc/ultimate-team/web-app/') => new Promise((resolve) => handler({ type: 'EASYSBC_GALLERY_READ', ...message }, { url }, resolve));
  return { send, calls };
}
test('worker reads only the fixed public solution endpoint without credentials', async () => {
  const f = fixture(); const response = await f.send({ action: 'solution', setId: 1, platform: 'pc' });
  assert.equal(response.data.sample, true);
  assert.equal(f.calls[0].url, 'https://api-fc27.easysbc.io/gallery/solutions/1');
  assert.equal(f.calls[0].options.credentials, 'omit'); assert.equal(f.calls[0].options.method, 'GET');
  assert.equal(f.calls[0].options.headers.Platform, 'PC'); assert.equal(f.calls[0].options.redirect, 'error');
  assert.equal(f.calls[0].options.headers.Authorization, undefined);
});
test('worker rejects offsite senders and arbitrary URLs/actions', async () => {
  const f = fixture();
  assert.ok((await f.send({ action: 'catalog' }, 'https://evil.example/')).error);
  assert.ok((await f.send({ action: 'https://evil.example/' })).error);
  assert.ok((await f.send({ action: 'solution', setId: '../users' })).error);
  assert.ok((await f.send({ action: 'solution', setId: 0 })).error);
  assert.equal(f.calls.length, 0);
});
