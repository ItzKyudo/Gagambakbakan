import assert from 'node:assert/strict';
import test from 'node:test';
import { selectDraftAbilities } from '../../server/src/abilities';

test('auto-pick preserves pre-selected cards and fills remaining slots', () => {
  const choices = ['dash', 'web', 'surge', 'power', 'pounce'];

  // Test helper simulating autoPick selection
  function resolveDraft(selected: number[], pool: string[], target: number = 2): string[] {
    const current = selected.filter(idx => idx >= 0 && idx < pool.length);
    for (let i = 0; i < pool.length; i++) {
      if (current.length >= target) break;
      if (!current.includes(i)) {
        current.push(i);
      }
    }
    return current.slice(0, target).map(k => pool[k]);
  }

  // Case 1: 0 pre-selected cards -> auto-picks first 2
  assert.deepEqual(resolveDraft([], choices), ['dash', 'web']);

  // Case 2: 1 pre-selected card (slot 3: 'power') -> keeps 'power' and fills slot 0 ('dash')
  assert.deepEqual(resolveDraft([3], choices), ['power', 'dash']);

  // Case 3: 2 pre-selected cards (slots 1: 'web', 4: 'pounce') -> keeps both
  assert.deepEqual(resolveDraft([1, 4], choices), ['web', 'pounce']);
});

test('server selectDraftAbilities falls back to choices on empty/partial submission', () => {
  const choices = ['surge', 'power', 'shield', 'mend'] as any;

  // Empty submission selects first 2 distinct choices
  assert.deepEqual(selectDraftAbilities([], choices), ['surge', 'power']);

  // Partial submission with 1 choice preserves it and fills second
  assert.deepEqual(selectDraftAbilities(['shield'], choices), ['shield', 'surge']);
});

