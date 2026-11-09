// Real panel + solver, synthetic club only. No EA account/network writes.
const { chromium } = require('playwright');
const path = require('node:path');
const fs = require('node:fs');
const assert = require('node:assert/strict');
async function main() {
  const root = path.resolve(__dirname, '..');
  const browser = await chromium.launch({ headless: true, executablePath: process.env.FUTFUSION_BROWSER || 'C:/Program Files/BraveSoftware/Brave-Browser/Application/brave.exe' });
  try {
    const page = await browser.newPage({ viewport: { width: 900, height: 1100 }, reducedMotion: 'reduce' });
    page.setDefaultTimeout(10000);
    const errors = []; page.on('pageerror', (error) => { errors.push(error.message); console.error('Page error:', error.message); });
    await page.route('https://futfusion.test/**', (route) => route.fulfill({ contentType: 'text/html', body: '<html><head><meta charset="utf-8"></head><body style="background:#152334"></body></html>' }));
    await page.goto('https://futfusion.test/');
    await page.evaluate(() => { window.FutFox = {}; });
    for (const file of ['i18n', 'requirements', 'rating', 'chemistry', 'solver', 'streamlined', 'gallery', 'bonus-tags', 'set-match', 'squad-editor']) await page.addScriptTag({ path: path.join(root, `src/core/${file}.js`) });
    await page.evaluate(() => {
      const H = window.FutFox;
      const slots = [0, 3, 5, 5, 7, 14, 14, 14, 23, 25, 27].map((typeId) => ({ typeId, name: String(typeId) }));
      const pool = Array.from({ length: 12 }, (_, i) => ({ id: i + 1, key: `club:${i + 1}`, defId: 100 + i, playerId: 1000 + i,
        name: i === 11 ? 'Manual Target' : `Player ${i + 1}`, definitionId: 100 + i, databaseId: 1000 + i, loans: -1, pile: 7, rating: 74, quality: 2, teamId: i === 11 ? 2 : 1, clubId: i === 11 ? 2 : 1,
        nationId: 1, leagueId: 1, rarity: 0, positions: slots.map((s) => s.typeId), profile: H.chemistry.DEFAULT_PROFILES.base, cost: 100, untradeable: true, source: 'club' }));
      const rule = { key: H.requirements.KEY.CLUB_ID, scope: 'min', count: 1, ids: [2, 3], value: 2, label: 'Club Brugge VEYA RSC Anderlecht: Min. 1 Oyuncu', supported: true };
      const entry = { id: 42, name: 'Manual editing test', setName: 'Test SBC', challenge: { id: 42, formation: 1 } };
      let appliedPlayers = Array(11).fill(null);
      const squad = { getPlayers: () => appliedPlayers, setPlayers: (players) => appliedPlayers = players.slice(), removeAllItems: () => appliedPlayers = [] };
      entry.challenge.squad = squad;
      const response = () => ({ observe(owner, callback) { queueMicrotask(() => callback(this, { success: true, data: { squad } })); }, unobserve() {} });
      window.savedSquads = [];
      window.services = { SBC: { loadChallenge: response, saveChallenge: () => { window.savedSquads.push(appliedPlayers.slice()); return response(); } } };
      H.fut = { galleryEnabled: false, language: () => 'en', knownClubItems: () => pool, knownStorageItems: () => [],
        getChallenges: () => [entry], shownChallengeId: () => 42, openChallengeId: () => 42,
        slotsFor: () => slots, requiredSlotsFor: () => slots.map((_, i) => i), rulesFor: () => [rule], isStreamlined: () => false,
        clubPool: (options) => options.keepActiveSquad ? pool.slice(0, 11) : pool,
        eaChemistry: () => null, ratingUsesFloat: () => true, chemThresholds: () => H.chemistry.DEFAULT_THRESHOLDS,
        leagueName: () => 'League', nationName: () => 'Nation', positionName: (id) => String(id), cardBadges: () => [],
        galleryCards: () => [], galleryMemory: () => ({ persona: 'mock', memory: { cards: {} } }),
      };
      localStorage.setItem('futfox.settings', JSON.stringify({ lang: 'en', view: 'sbc', keepActiveSquad: true, allowMarket: false }));
    });
    await page.addScriptTag({ path: path.join(root, 'src/page/squad-apply.js') });
    await page.addScriptTag({ path: path.join(root, 'src/page/panel.js') });
    await page.evaluate(() => window.FutFox.panel.create().refresh());
    console.log('Panel created');
    await page.locator('.toggle').click();
    await page.getByRole('tab', { name: 'SBC', exact: true }).click();
    await page.getByRole('button', { name: 'Find cheapest squad', exact: true }).click();
    await page.getByText('Could not meet every rule', { exact: true }).waitFor();
    await page.locator('.manual-slot-actions summary').first().click();
    await page.getByRole('button', { name: /oyuncusunu kaldır$/ }).first().click();
    assert.equal(await page.getByRole('button', { name: 'Oyuncu ekle', exact: true, includeHidden: true }).count(), 1);
    await page.getByRole('button', { name: 'Geri al', exact: true }).click();
    assert.equal(await page.getByRole('button', { name: 'Oyuncu ekle', exact: true, includeHidden: true }).count(), 0);
    await page.getByRole('button', { name: 'İleri al', exact: true }).click();
    assert.equal(await page.getByRole('button', { name: 'Oyuncu ekle', exact: true, includeHidden: true }).count(), 1);
    await page.getByRole('button', { name: 'Solve Squad', exact: true }).click();
    await page.getByText(/10 oyuncu yerleştirildi ve kaydedildi\. 1 yuva boş bırakıldı/).waitFor();
    assert.equal(await page.evaluate(() => window.savedSquads.at(-1).filter(Boolean).length), 10);
    await page.locator('.manual-slot-actions').filter({ has: page.getByRole('button', { name: 'Oyuncu ekle', exact: true, includeHidden: true }) }).locator('summary').click();
    await page.getByRole('button', { name: 'Oyuncu ekle', exact: true }).click();
    await page.getByLabel('Korunan / aktif kadro kartlarını da göster', { exact: true }).check();
    await page.getByRole('searchbox', { name: 'Kulüpte oyuncu ara', exact: true }).pressSequentially('Manual');
    assert.equal(await page.getByRole('searchbox', { name: 'Kulüpte oyuncu ara', exact: true }).inputValue(), 'Manual');
    const output = path.join(root, 'artifacts/squad-editor'); fs.mkdirSync(output, { recursive: true });
    await page.screenshot({ path: path.join(output, 'picker.png') });
    await page.getByRole('button', { name: /74 · Manual Target/ }).click();
    await page.getByText('Meets the rules', { exact: true }).waitFor();
    assert.equal(await page.getByRole('button', { name: 'Sabit ✓', exact: true, includeHidden: true }).count(), 1);
    await page.getByRole('button', { name: 'Elle seçtiklerimi koru · kalanı yeniden çöz', exact: true }).click();
    await page.getByText('Meets the rules', { exact: true }).waitFor();
    assert.equal(await page.getByRole('button', { name: 'Sabit ✓', exact: true, includeHidden: true }).count(), 1);
    assert.ok((await page.locator('.pitch').innerText()).includes('Manual Target'));
    await page.screenshot({ path: path.join(output, 'edited.png') });
    assert.deepEqual(errors, []);
    console.log('Real panel browser check passed: unmet club rule, partial 10-player apply with empty slot, protected manual pick, revalidation, fixed selection retained during re-solve.');
  } finally { await browser.close(); }
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
