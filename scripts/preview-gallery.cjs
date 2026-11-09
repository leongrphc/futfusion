// Browser smoke test and screenshots with synthetic inventory. No EA requests.
const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
async function main() {
  const executablePath = process.env.FUTFUSION_BROWSER || 'C:/Program Files/BraveSoftware/Brave-Browser/Application/brave.exe';
  const browser = await chromium.launch({ executablePath, headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 520, height: 1100 } });
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.route('https://futfusion.test/**', (route) => route.fulfill({ contentType: 'text/html', body: '<html lang="tr"><head><meta charset="utf-8"></head><body style="margin:0;background:#100D21"><div id="preview"></div></body></html>' }));
    await page.goto('https://futfusion.test/');
    await page.evaluate(() => { window.FutFox = {}; });
    for (const file of ['src/core/bonus-tags.js', 'src/core/set-match.js', 'src/core/gallery-trades.js']) await page.addScriptTag({ path: path.join(root, file) });
    const panel = fs.readFileSync(path.join(root, 'src/page/panel.js'), 'utf8');
    const css = vm.runInNewContext('`' + panel.match(/const CSS = `([\s\S]*?)`;/)[1] + '`');
    await page.evaluate((css) => {
      const H = window.FutFox;
      const quotes = new Map();
      H.fut = { galleryMemory: () => ({ persona: 'preview-only' }), galleryCards: () => [] };
      H.galleryMarket = {
        validPrice: (n) => Number.isInteger(n) && n > 0,
        peek: (card) => quotes.get(card.defId) || null,
        find: async (card) => { if (window.previewSearchError) throw new Error(window.previewSearchError); const quote = { price: card.defId === 101 ? 1500 : 2200, at: Date.now() }; quotes.set(card.defId, quote); return quote; },
        buyAtMost: async (card, cap) => ({ price: cap, itemId: String(card.defId + 1000) }),
        ensureClubEntry: async () => ({ confirmed: true }),
        inspectListing: async () => 'missing',
        listAtPurchasePrice: async (entry) => ({ price: entry.buy, itemId: entry.purchasedItemId }), acknowledge() {},
      };
      const cards = [['Dimarco', 86, 101], ['Szoboszlai', 86, 102], ['Dybala', 85, 103], ['Palmer', 85, 104]];
      localStorage.setItem('futfusion.galleryTrades.v1.preview-only', JSON.stringify({ schema: 1, taxPercent: 5,
        activeBatch: { id: 'preview-current-team', targetId: 'current-team', name: 'Yeni getirilen takım', keys: ['101:base', '102:base'] },
        entries: cards.map(([name, rating, defId], index) => ({
        card: { name, rating, defId, playerId: defId, rarityId: 1 }, sets: [{ id: 'laliga', name: 'Avrupa Yıldızları' }, { id: 'club', name: 'Kulüp Koleksiyonu' }],
        bought: index >= 2, confirmed: index === 2, buy: index >= 2 ? 2100 : null, sell: null, purchasedItemId: index >= 2 ? String(defId + 1000) : null,
      })) }));
      const shadow = document.getElementById('preview').attachShadow({ mode: 'open' });
      const style = document.createElement('style'); style.textContent = css; shadow.append(style);
      const panel = document.createElement('div'); panel.className = 'panel';
      panel.innerHTML = '<header><div class="brand"><span style="color:#A78BFA">◆</span><h1>FutFusion</h1></div></header><div class="tabs"><button>Club</button><button style="color:#C6FF3D;border-bottom:2px solid">Gallery</button></div><div class="body"></div>';
      shadow.append(panel);
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
      window.renderGalleryPreview = () => panel.querySelector('.body').replaceChildren(H.galleryTradeUI.render({ el, results: [], rerender: window.renderGalleryPreview }));
    }, css);
    for (const file of ['src/page/gallery-batch.js', 'src/page/gallery-trades.js']) await page.addScriptTag({ path: path.join(root, file) });
    await page.evaluate(() => window.renderGalleryPreview());
    await page.getByText('Adımları ayrı ayrı yönet', { exact: true }).click();
    await page.getByRole('button', { name: '1 · 2 kartın fiyatını bul', exact: true }).click();
    await page.getByText('Tamamlandı · 2 başarılı · 0 hata · 0 atlandı', { exact: true }).waitFor();
    const output = path.join(root, 'artifacts/gallery'); fs.mkdirSync(output, { recursive: true });
    await page.screenshot({ path: path.join(output, 'desktop.png') });
    await page.setViewportSize({ width: 360, height: 1000 });
    const fits = await page.locator('.gallery-trades').evaluate((node) => node.scrollWidth <= node.clientWidth + 1);
    assert.ok(fits, 'Gallery section must fit at 360px');
    await page.screenshot({ path: path.join(output, 'mobile.png') });
    await page.setViewportSize({ width: 520, height: 1100 });
    await page.getByRole('button', { name: 'Tümünü yap · 2 kart · 3.700 coin bütçe', exact: true }).click();
    await page.getByText('Tamamlandı · 2 başarılı · 0 hata · 0 atlandı · 3.700 coin doğrulanan alış', { exact: true }).waitFor();
    const entries = await page.evaluate(() => JSON.parse(localStorage.getItem('futfusion.galleryTrades.v1.preview-only')).entries);
    assert.ok(entries.slice(0, 2).every((e) => e.listingState === 'listed' && e.listingVerified && !e.sold));
    assert.deepEqual(entries.map((e) => e.listedPrice), [1500, 2200, null, null]);
    assert.ok(entries.slice(2).every((e) => e.bought && !e.listingState), 'old purchased players must remain untouched');
    assert.deepEqual(errors, []);
    await page.screenshot({ path: path.join(output, 'listed.png') });
    await page.evaluate(() => {
      const ledger = JSON.parse(localStorage.getItem('futfusion.galleryTrades.v1.preview-only'));
      ledger.activeBatch = { id: 'failure-check', targetId: 'current-team', name: 'Hata kontrolü', keys: ['101:base'] };
      Object.assign(ledger.entries[0], { bought: false, listingState: null, listingVerified: false, purchaseState: null });
      localStorage.setItem('futfusion.galleryTrades.v1.preview-only', JSON.stringify(ledger));
      window.previewSearchError = 'EA işlem hatası: 429. Arama hız sınırına ulaşıldı.';
      window.renderGalleryPreview();
    });
    await page.getByText('Adımları ayrı ayrı yönet', { exact: true }).click();
    await page.getByRole('button', { name: '1 · 1 kartın fiyatını bul', exact: true }).click();
    await page.getByText('Son hata: Dimarco: EA işlem hatası: 429. Arama hız sınırına ulaşıldı.', { exact: true }).waitFor();
    await page.screenshot({ path: path.join(output, 'search-error.png') });
    console.log('Browser smoke passed: only current team processed, old purchased players untouched, budget and workflow verified, 360px layout. Screenshots: ' + output);
  } finally { await browser.close(); }
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
