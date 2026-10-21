import assert from 'node:assert/strict';
import test from 'node:test';
import { getRandomAbilities, selectDraftAbilities } from '../src/abilities';

test('server rejects invalid and duplicate client ability ids', () => {
  assert.deepEqual(getRandomAbilities(3, [], ['bogus']), ['dash']);
  assert.deepEqual(getRandomAbilities(3, [], ['web', 'web']), ['web']);
  assert.deepEqual(selectDraftAbilities(['dash', 'dash'], ['dash', 'web']), ['dash', 'web']);
  assert.deepEqual(selectDraftAbilities(null, ['web']), ['web', '']);
});
