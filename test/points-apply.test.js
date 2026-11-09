const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const code = fs.readFileSync(path.join(__dirname, '../src/page/squad-apply.js'), 'utf8');

function fixture(wrapped = false) {
  const old = { id: 9, sbsScore: 50 };
  const items = [{ id: 1, sbsScore: 4100 }, { id: 2, sbsScore: 2100 }];
  const selected = new Map([[9, old]]);
  const challenge = { id: 42, scoreRequirement: 6000, submittedScore: 0 };
  const model = {
    _itemEntityMap: new Map([[9, old]]), _itemScoreMap: new Map(), _itemTabMap: new Map(),
    getChallenge: () => challenge,
    getSelectedItemIds: () => [...selected.keys()],
    getSelectedScore: () => [...selected.values()].reduce((sum, item) => sum + item.sbsScore, 0),
    getSelectionLimit: () => 30,
    selectItem(item) { if (item.id === this.rejectId) return false; selected.set(item.id, item); return true; },
    deselectItem: (item) => selected.delete(item.id),
  };
  const refreshes = [];
  const controller = { getViewModel: () => model, _refreshCurrentPage: () => refreshes.push('page'), _refreshSelectionControls: () => refreshes.push('controls') };
  const screen = wrapped ? { getViewModel: () => ({}), workAreaController: controller } : controller;
  const FutFox = { fut: { openChallengeId: () => 42, currentController: () => screen } };
  vm.runInNewContext(code, { FutFox, OneClickSBCWorkAreaTab: { CLUB: 0, STORAGE: 1 }, setTimeout, clearTimeout });
  const picks = items.map((item, index) => ({ id: item.id, item, score: item.sbsScore, storage: index === 1 }));
  const result = { kind: 'score', challengeId: 42, remaining: 6000, score: 6200, picks };
  return { apply: FutFox.squadApply.apply, result, model, selected, challenge, refreshes };
}

test('points resolves nested Work Area controller and refreshes native UI', async () => {
  const f = fixture(true);
  await f.apply(f.result);
  assert.deepEqual([...f.selected.keys()], [1, 2]);
  assert.deepEqual(f.refreshes, ['page', 'controls']);
});

test('points replaces selection with exact suggested items using club/storage tabs', async () => {
  const f = fixture(); const outcome = await f.apply(f.result);
  assert.deepEqual([...f.selected.keys()], [1, 2]);
  assert.equal(outcome.score, 6200);
  assert.equal(f.model._itemTabMap.get(1), 0);
  assert.equal(f.model._itemTabMap.get(2), 1);
});
test('points repeated apply does not duplicate selection', async () => {
  const f = fixture(); await f.apply(f.result); await f.apply(f.result);
  assert.deepEqual([...f.selected.keys()], [1, 2]);
});
test('points rejected item restores previous selection', async () => {
  const f = fixture(); f.model.rejectId = 2;
  await assert.rejects(f.apply(f.result), /reddetti/);
  assert.deepEqual([...f.selected.keys()], [9]);
});
test('points changed item score rejects before selection mutation', async () => {
  const f = fixture(); f.result.picks[0].item.sbsScore++;
  await assert.rejects(f.apply(f.result), /değişti/);
  assert.deepEqual([...f.selected.keys()], [9]);
});
test('points changed challenge progress rejects stale plan', async () => {
  const f = fixture(); f.challenge.submittedScore = 10;
  await assert.rejects(f.apply(f.result), /puanı değişti/);
  assert.deepEqual([...f.selected.keys()], [9]);
});
test('points enforces current selection limit and unique IDs', async () => {
  const f = fixture(); f.model.getSelectionLimit = () => 1;
  await assert.rejects(f.apply(f.result), /sınırını/);
  f.model.getSelectionLimit = () => 30; f.result.picks[1].id = 1;
  await assert.rejects(f.apply(f.result), /sınırını/);
  assert.deepEqual([...f.selected.keys()], [9]);
});
