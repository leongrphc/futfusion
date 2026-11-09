const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const code = fs.readFileSync(path.join(__dirname, '../src/page/squad-apply.js'), 'utf8');

function fixture(options = {}) {
  const calls = [];
  const old = { id: 99, definitionId: 999 };
  const items = [1, 2].map((id) => ({ id, definitionId: id + 100, pile: options.storage && id === 2 ? 10 : 7, loans: -1 }));
  let slots = [old, null, { brick: true }];
  let open = 42;
  const squad = {
    getPlayers: () => slots,
    removeAllItems: () => { slots = []; },
    setPlayers: (players) => { calls.push('set'); slots = players.slice(); },
  };
  const challenge = { id: 42, squad, onDataChange: { notify: () => calls.push('notify') } };
  const observable = (success = true, data) => ({ observe(owner, callback) { queueMicrotask(() => callback(this, { success, status: success ? 200 : 500, data })); }, unobserve() {} });
  let loads = 0;
  const SBC = {
    loadChallenge: () => {
      calls.push('load');
      loads++;
      if (options.navigate) open = 43;
      return observable(true, { squad: loads > 1 && options.mismatch ? { getPlayers: () => [] } : squad });
    },
    saveChallenge: () => { calls.push('save'); return observable(!options.failSave); },
  };
  const FutFox = { fut: {
    openChallengeId: () => open,
    getChallenges: () => [{ id: 42, challenge }],
    requiredSlotsFor: () => [0, 1],
    knownClubItems: () => items.filter((i) => i.pile === 7),
    knownStorageItems: () => items.filter((i) => i.pile === 10),
  } };
  vm.runInNewContext(code, { FutFox, services: { SBC, Item: { move: (players, pile) => { calls.push('move'); players.forEach((p) => p.pile = pile); return observable(!options.failMove); } } }, setTimeout, clearTimeout });
  const result = { feasible: true, challengeId: 42, required: new Set([0, 1]), rules: [], squad: items.map((item) => ({ player: { id: item.id, source: 'club' } })) };
  return { apply: FutFox.squadApply.apply, result, calls, getSlots: () => slots, setOpen: (id) => open = id };
}

test('places exact solver slots, preserves brick, saves, reloads and notifies', async () => {
  const f = fixture();
  const result = await f.apply(f.result);
  assert.equal(result.count, 2);
  assert.deepEqual(Array.from(f.getSlots().slice(0, 2), (i) => i.id), [1, 2]);
  assert.equal(f.getSlots()[2].brick, true);
  assert.deepEqual(f.calls, ['load', 'set', 'save', 'load', 'set', 'notify']);
});
test('moves storage before saving', async () => {
  const f = fixture({ storage: true }); await f.apply(f.result);
  assert.ok(f.calls.indexOf('move') < f.calls.indexOf('save'));
});
test('wrong challenge causes zero mutations', async () => {
  const f = fixture(); f.setOpen(43);
  await assert.rejects(f.apply(f.result), /Önce/);
  assert.deepEqual(f.calls, []);
});
test('infeasible results and unsupported rules still place the draft', async () => {
  const f = fixture(); f.result.feasible = false;
  f.result.rules = [{ supported: false }];
  const applied = await f.apply(f.result);
  assert.equal(applied.count, 2); assert.equal(applied.partial, true);
  assert.ok(f.calls.includes('save'));
});
test('duplicate players remain rejected', async () => {
  const f = fixture(); f.result.squad[1].player.id = 1;
  await assert.rejects(f.apply(f.result), /birden fazla/);
  assert.deepEqual(f.calls, []);
});
test('missing slot is left empty without compacting other player positions', async () => {
  const f = fixture(); f.result.feasible = false; f.result.squad[0].player = null;
  const applied = await f.apply(f.result);
  assert.equal(f.getSlots()[0], null); assert.equal(f.getSlots()[1].id, 2);
  assert.equal(applied.count, 1); assert.equal(applied.empty, 1);
  assert.deepEqual(Array.from(applied.appliedSlots), [1]);
  assert.equal(f.getSlots()[2].brick, true);
});
test('market templates remain empty while existing club cards are saved', async () => {
  const f = fixture(); f.result.squad[0].player.source = 'market';
  const applied = await f.apply(f.result);
  assert.equal(applied.count, 1); assert.equal(applied.empty, 1);
  assert.equal(f.getSlots()[0], null); assert.equal(f.getSlots()[1].id, 2);
});
test('empty proposal does not clear the existing EA squad', async () => {
  const f = fixture(); f.result.squad.forEach((s) => s.player = null);
  await assert.rejects(f.apply(f.result), /oyuncusu yok/);
  assert.deepEqual(f.calls, []); assert.equal(f.getSlots()[0].id, 99);
});
test('navigation during loading prevents mutation', async () => {
  const f = fixture({ navigate: true });
  await assert.rejects(f.apply(f.result), /Önce/);
  assert.deepEqual(f.calls, ['load']);
});
test('failed storage move never saves', async () => {
  const f = fixture({ storage: true, failMove: true });
  await assert.rejects(f.apply(f.result), /taşıma/);
  assert.ok(!f.calls.includes('save'));
});
test('save failure restores local squad and releases the lock', async () => {
  const f = fixture({ failSave: true });
  await assert.rejects(f.apply(f.result), /Yerel görünüm/);
  assert.equal(f.getSlots()[0].id, 99);
  await assert.rejects(f.apply(f.result), /Yerel görünüm/);
  assert.equal(f.calls.filter((c) => c === 'save').length, 2);
});
test('reload mismatch is reported without a second server write', async () => {
  const f = fixture({ mismatch: true });
  await assert.rejects(f.apply(f.result), /eşleşmiyor/);
  assert.equal(f.calls.filter((c) => c === 'save').length, 1);
  assert.ok(!f.calls.includes('notify'));
});
test('concurrent apply is blocked', async () => {
  const f = fixture(); const first = f.apply(f.result);
  await assert.rejects(f.apply(f.result), /zaten/);
  await first;
});
