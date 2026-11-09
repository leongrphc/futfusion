const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
(async () => {
  const root = path.resolve(__dirname, '..');
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'futfusion-solver-'));
  const context = await chromium.launchPersistentContext(profile, { executablePath: process.env.FUTFUSION_BROWSER || 'C:/Program Files/BraveSoftware/Brave-Browser/Application/brave.exe', headless: true,
    args: [`--disable-extensions-except=${root}`, `--load-extension=${root}`] });
  try {
    await context.route('https://www.ea.com/**', (route) => route.fulfill({ contentType: 'text/html', body: '<html><body>Local solver fixture</body></html>' }));
    const page = await context.newPage();
    await page.goto('https://www.ea.com/ea-sports-fc/ultimate-team/web-app/');
    await page.waitForFunction(() => window.FutFox?.solverAsync);
    const result = await page.evaluate(async () => {
      const H = window.FutFox;
      const pool = Array.from({ length: 15 }, (_, i) => ({ key: `club:${i}`, id: i, playerId: i + 1, defId: i + 1, positions: [1], rating: 75, quality: 3, cost: 100, source: 'club', profile: H.chemistry.DEFAULT_PROFILES.base, nationId: 1, leagueId: 1, clubId: 1, item: { id: i, method() {} } }));
      const input = { slots: Array.from({ length: 11 }, () => ({ typeId: 1 })), rules: [], pool, seed: 7, iterations: 25000, restarts: 4 };
      let ticks = 0; const timer = setInterval(() => ticks++, 1);
      const actual = await H.solverAsync.solve(input); clearInterval(timer);
      const expected = H.solver.solve(input);
      const promise = H.solverAsync.solve(input); H.solverAsync.cancel();
      let cancelled = false; try { await promise; } catch (e) { cancelled = e.message.includes('iptal'); }
      return { ticks, actual: actual.squad.map((s) => s.player.id), expected: expected.squad.map((s) => s.player.id), rebound: actual.squad.every((s) => s.player.item === pool.find((p) => p.id === s.player.id).item), cancelled };
    });
    assert.deepEqual(result.actual, result.expected); assert.ok(result.rebound); assert.ok(result.ticks > 0); assert.ok(result.cancelled);
    await page.evaluate(() => { window.held = window.FutFox.accountLock.run('same-account', () => new Promise((resolve) => { window.unlock = resolve; })); });
    await page.waitForFunction(() => window.unlock);
    const second = await context.newPage(); await second.goto('https://www.ea.com/ea-sports-fc/ultimate-team/web-app/');
    await second.waitForFunction(() => window.FutFox?.accountLock);
    const blocked = await second.evaluate(async () => { try { await window.FutFox.accountLock.run('same-account', () => true); return false; } catch (error) { return error.message.includes('başka bir sekmede'); } });
    assert.ok(blocked);
    await page.evaluate(async () => { window.unlock(); await window.held; });
    assert.equal(await second.evaluate(() => window.FutFox.accountLock.run('same-account', () => true)), true);
    console.log('Extension worker check passed: deterministic results, original EA objects restored, responsive page, cancellation.');
  } finally { await context.close(); }
})().catch((error) => { console.error(error); process.exitCode = 1; });
