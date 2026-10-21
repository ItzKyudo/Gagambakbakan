import assert from 'node:assert/strict';
import test from 'node:test';
import { getRandomAbilities, selectDraftAbilities, validateUnlockedSkills } from '../src/abilities';

test('server rejects invalid and duplicate client ability ids', () => {
  assert.deepEqual(getRandomAbilities(3, [], ['bogus']), ['dash']);
  assert.deepEqual(getRandomAbilities(3, [], ['web', 'web']), ['web']);
  assert.deepEqual(selectDraftAbilities(['dash', 'dash'], ['dash', 'web']), ['dash', 'web']);
  assert.deepEqual(selectDraftAbilities(null, ['web']), ['web', '']);
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
