// Public API integration check in a fresh browser profile. The EA page is replaced
// with a local fixture; no EA login, club reads, purchases or account writes occur.
const { chromium } = require('playwright');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
async function main() {
  const root = path.resolve(__dirname, '..');
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'futfusion-public-api-'));
  const context = await chromium.launchPersistentContext(profile, {
    executablePath: process.env.FUTFUSION_BROWSER || 'C:/Program Files/BraveSoftware/Brave-Browser/Application/brave.exe',
    headless: true, viewport: { width: 520, height: 1100 },
    args: [`--disable-extensions-except=${root}`, `--load-extension=${root}`],
  });
  try {
    await context.route('https://www.ea.com/**', (route) => route.fulfill({ contentType: 'text/html', body: '<html lang="tr"><head><meta charset="utf-8"></head><body style="margin:0;background:#100D21"><div id="preview"></div></body></html>' }));
    const worker = context.serviceWorkers()[0] || await context.waitForEvent('serviceworker', { timeout: 15000 });
    assert.ok(worker.url().endsWith('easysbc-worker.js'));
    const page = await context.newPage();
    await page.goto('https://www.ea.com/ea-sports-fc/ultimate-team/web-app/');
    await page.waitForFunction(() => window.FutFox?.easySbcUI);
    const source = fs.readFileSync(path.join(root, 'src/page/panel.js'), 'utf8');
    const css = vm.runInNewContext('`' + source.match(/const CSS = `([\s\S]*?)`;/)[1] + '`');
    await page.evaluate((css) => {
      const H = window.FutFox;
      H.fut.galleryMemory = () => ({ persona: 'public-api-test' });
      H.fut.galleryCards = () => [];
      const host = document.getElementById('preview').attachShadow({ mode: 'open' });
      const style = document.createElement('style'); style.textContent = css; host.append(style);
      const panel = document.createElement('div'); panel.className = 'panel';
      panel.innerHTML = '<header><div class="brand"><h1>FutFusion</h1></div></header><div class="body"></div>'; host.append(panel);
      const el = (tag, attrs = {}, children = []) => {
        const node = document.createElement(tag);
        for (const [key, value] of Object.entries(attrs)) {
          if (key === 'text') node.textContent = value;
          else if (key.startsWith('on')) node.addEventListener(key.slice(2), value);
          else if (value === true) node.setAttribute(key, '');
          else if (value !== false && value != null) node.setAttribute(key, value);
        }
        for (const child of [].concat(children)) if (child) node.append(child);
        return node;
      };
      const render = () => panel.querySelector('.body').replaceChildren(H.easySbcUI.render({ el, results: [], rerender: render }));
      render();
    }, css);
    await page.getByRole('button', { name: 'EasySBC setlerini getir', exact: true }).click();
    const setPicker = page.getByRole('combobox').nth(1);
    await setPicker.waitFor({ timeout: 25000 });
    await setPicker.selectOption('1');
    await page.getByRole('combobox').nth(2).selectOption('S');
    await page.getByRole('button', { name: 'Seçilen kadroyu getir', exact: true }).click();
    const add = page.getByRole('button', { name: /^15 eksik kartı alış listesine ekle$/ });
    await add.waitFor({ timeout: 25000 });
    const output = path.join(root, 'artifacts/easysbc'); fs.mkdirSync(output, { recursive: true });
    await page.getByRole('button', { name: 'Karşılaştırmaya ekle', exact: true }).click();
    await page.getByText('Kişisel set karşılaştırması · 1 set', { exact: true }).waitFor();
    await page.screenshot({ path: path.join(output, 'live-public-preview.png') });
    await add.click();
    const entries = await page.evaluate(() => JSON.parse(localStorage.getItem('futfusion.galleryTrades.v1.public-api-test')).entries);
    assert.equal(entries.length, 15);
    assert.ok(entries.every((entry) => !entry.bought && entry.buy === null && entry.card.source === 'easysbc'));
    await add.click();
    const count = await page.evaluate(() => JSON.parse(localStorage.getItem('futfusion.galleryTrades.v1.public-api-test')).entries.length);
    assert.equal(count, 15);
    console.log('Live public API check passed through installed extension: catalog, OGC Nice S preview, 15-card ledger import, no duplicate on repeat. No EA account used.');
  } finally { await context.close(); }
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
