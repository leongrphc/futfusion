// FutFusion permits squad saves and storage moves only in its apply module.
// Gallery market purchases are isolated; submissions, selling and discards stay forbidden.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const FORBIDDEN = [
  'bid', 'searchTransferMarket', 'list', 'relistExpiredAuctions', 'redeem', 'discard', 'move',
  'saveChallenge', 'submitChallenge', 'initiateOneClickChallenge', 'submitOneClickChallenge', 'save',
  'claimCompensationRewards', 'eSearchSelected',
];

function sources(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const full = path.join(dir, e.name);
    return e.isDirectory() ? sources(full) : full.endsWith('.js') ? [full] : [];
  });
}

test('account writes are isolated to squad apply and explicit Gallery purchases', () => {
  for (const file of sources(path.join(__dirname, '..', 'src'))) {
    const code = fs.readFileSync(file, 'utf8');
    for (const name of FORBIDDEN) {
      if (path.basename(file) === 'squad-apply.js' && ['move', 'saveChallenge'].includes(name)) continue;
      if (path.basename(file) === 'gallery-market.js' && ['searchTransferMarket', 'bid', 'move', 'list'].includes(name)) continue;
      const call = new RegExp(`\\.${name}\\s*\\(`);
      assert.ok(!call.test(code), `${path.basename(file)} calls .${name}(`);
    }
  }
});
