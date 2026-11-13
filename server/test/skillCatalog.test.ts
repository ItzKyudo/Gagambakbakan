import assert from 'node:assert/strict';
import test from 'node:test';
import { ABILITY_SLOTS, SKILL_CATALOG, skillPointsForLevel, validateSkillTree } from '../src/skillCatalog';
import { ALL_ABILITY_IDS, levelFromSpiderExp } from '../src/abilities';

test('spec catalog has five complete and equally priced skill trees', () => {
  assert.deepEqual([...ABILITY_SLOTS], ALL_ABILITY_IDS);
  const trees = Object.values(SKILL_CATALOG);
  assert.deepEqual(trees.map(tree => tree.element), ['Water', 'Air', 'Fire', 'Land', 'Nature']);
  assert.equal(new Set(trees.flatMap(tree => Object.values(tree.nodes).map(node => node.name))).size, 80);
  const expectedPrerequisites: Record<string, string[]> = {
    S5: ['S1'], S6: ['S1', 'S2'], S7: ['S2', 'S3'], S8: ['S3'], S9: ['S3', 'S4'],
    S10: ['S4', 'S9'], S11: ['S5', 'S6'], S12: ['S6', 'S7'], S13: ['S7', 'S8'], S14: ['S8', 'S9'],
    S15: ['S11', 'S12', 'S13'], S16: ['S10', 'S13', 'S14']
  };
  for (const tree of trees) {
    assert.equal(Object.keys(tree.nodes).length, 16);
    assert.deepEqual(Object.keys(tree.nodes), Array.from({ length: 16 }, (_, i) => `S${i + 1}`));
    assert.equal(Object.values(tree.nodes).reduce((sum, node) => sum + node.cost, 0), 21);
    for (const [id, node] of Object.entries(tree.nodes)) {
      assert.deepEqual([...node.requires], expectedPrerequisites[id] || []);
      assert.ok(node.name && node.description && node.animation && node.icon);
      assert.ok(node.cooldown > 0);
    }
  }
});

test('tier costs and every prerequisite survive saved progress validation', () => {
  assert.deepEqual(validateSkillTree('weaver', ['S15', 'S5', 'S11'], 22), ['S1', 'S2', 'S3', 'S4', 'S5']);
  assert.deepEqual(validateSkillTree('weaver', ['S5', 'S6', 'S11', 'S12', 'S13', 'S15'], 22),
    ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S11']);
  assert.deepEqual(validateSkillTree('weaver', ['S5', 'S6', 'S11'], 2), ['S1', 'S2', 'S3', 'S4', 'S5']);
  assert.equal(skillPointsForLevel(1), 0);
  assert.equal(skillPointsForLevel(22), 21);
  assert.equal(skillPointsForLevel(100), 21);
  assert.equal(validateSkillTree('lynx', Object.keys(SKILL_CATALOG.lynx.nodes), 22).length, 16);
});

test('server and client agree on levels through the full 21-point tree', () => {
  const thresholds = [0, 100, 250, 450, 700, 1000, 1350, 1750, 2200, 2700, 3250, 3850, 4500, 5200, 5950,
    6750, 7600, 8500, 9450, 10450, 11500, 12600];
  for (let i = 0; i < thresholds.length; i++) {
    assert.equal(levelFromSpiderExp(thresholds[i]), i + 1);
    if (i > 0) assert.equal(levelFromSpiderExp(thresholds[i] - 1), i);
  }
});
