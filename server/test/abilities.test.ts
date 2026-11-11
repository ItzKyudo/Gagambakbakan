import assert from 'node:assert/strict';
import test from 'node:test';
import { getRandomAbilities, selectDraftAbilities, selectSpiderAbilities, SPIDER_STARTERS, validateUnlockedSkills, validateSpiderProgress } from '../src/abilities';

test('server rejects invalid and duplicate client ability ids', () => {
  assert.deepEqual(getRandomAbilities(3, [], ['bogus']), ['dash']);
  assert.deepEqual(getRandomAbilities(3, [], ['web', 'web']), ['web']);
  assert.deepEqual(selectDraftAbilities(['dash', 'dash'], ['dash', 'web']), ['dash', 'web']);
  assert.deepEqual(selectDraftAbilities(null, ['web']), ['web', '']);
});

test('spider draft equips two legal offered skills without a forced slot', () => {
  for (const [spider, starter] of Object.entries(SPIDER_STARTERS)) {
    assert.deepEqual(selectSpiderAbilities(spider, [starter, 'dash'], ['dash', starter]), [starter, 'dash']);
  }
  assert.deepEqual(selectSpiderAbilities('hunter', ['pounce', 'power'], ['dash', 'power', 'pounce']), ['pounce', 'power']);
  assert.deepEqual(selectSpiderAbilities('hunter', ['shield', 'web'], ['dash', 'power']), ['dash', 'power']);
  assert.deepEqual(selectSpiderAbilities('invalid', ['pounce'], ['dash', 'surge']), ['dash', '']);
});

test('only played spider experience unlocks its own skill pool', () => {
  const progress = validateSpiderProgress({ wolf: { exp: 100, skills: ['dash', 'surge', 'anchor'] }, hunter: { exp: 0, skills: ['dash', 'pounce', 'power'] } }, [], 0, 'weaver');
  assert.deepEqual(progress.wolf.skills, ['dash', 'surge', 'anchor']);
  assert.deepEqual(progress.hunter.skills, ['dash', 'pounce']);
  assert.equal(progress.weaver.exp, 0);
  const early = validateSpiderProgress({ weaver: { exp: 250, skills: ['dash', 'web', 'spit', 'hook'] } }, [], 0, 'weaver');
  assert.deepEqual(early.weaver.skills, ['dash', 'web', 'spit']);
});

test('server sanitizes and validates unlocked skills against level and web tree', () => {
  // Disconnected skill 'leech' at level 1 cannot be unlocked without path
  const res = validateUnlockedSkills(['dash', 'leech'], 1);
  assert.equal(res.includes('leech'), false);
  assert.equal(res.includes('dash'), true);

  // Level 1 capped at max 3 skills
  const overfilled = validateUnlockedSkills(['dash', 'web', 'surge', 'anchor', 'haste'], 1);
  assert.equal(overfilled.length <= 3, true);

  // Connected skills along edge (dash -> web -> spit) accepted when level permits
  const valid = validateUnlockedSkills(['dash', 'web', 'spit'], 3);
  assert.deepEqual(valid, ['dash', 'web', 'spit']);
});
