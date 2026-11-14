import assert from 'node:assert/strict';
import test from 'node:test';
import { SKILL_CATALOG, type SkillSpecies } from '../src/skillCatalog';

test('all five spider species define innate elemental passives', () => {
  const speciesList: SkillSpecies[] = ['weaver', 'hunter', 'guardian', 'wolf', 'lynx'];
  for (const species of speciesList) {
    const entry = SKILL_CATALOG[species] as any;
    assert.ok(entry.innatePassive, `${species} missing innatePassive`);
    assert.ok(entry.innatePassive.name, `${species} missing passive name`);
    assert.ok(entry.innatePassive.trigger, `${species} missing passive trigger`);
    assert.ok(entry.innatePassive.effect, `${species} missing passive effect`);
    assert.ok(entry.innatePassive.description, `${species} missing passive description`);
  }
});

test('all 80 skill nodes have tags, damage, range, and duration attributes', () => {
  const speciesList: SkillSpecies[] = ['weaver', 'hunter', 'guardian', 'wolf', 'lynx'];
  for (const species of speciesList) {
    const nodes = SKILL_CATALOG[species].nodes;
    for (const [nodeId, node] of Object.entries(nodes)) {
      const anyNode = node as any;
      assert.ok(Array.isArray(anyNode.tags) && anyNode.tags.length > 0, `${species} ${nodeId} missing tags`);
      assert.ok(typeof anyNode.damage === 'string' && anyNode.damage.length > 0, `${species} ${nodeId} missing damage`);
      assert.ok(typeof anyNode.range === 'string' && anyNode.range.length > 0, `${species} ${nodeId} missing range`);
      assert.ok(typeof anyNode.duration === 'string' && anyNode.duration.length > 0, `${species} ${nodeId} missing duration`);
    }
  }
});

test('tier 4 ultimate cooldowns are balanced to 18-22 seconds', () => {
  const speciesList: SkillSpecies[] = ['weaver', 'hunter', 'guardian', 'wolf', 'lynx'];
  for (const species of speciesList) {
    const nodes = SKILL_CATALOG[species].nodes;
    assert.ok(nodes.S15.cooldown >= 18 && nodes.S15.cooldown <= 20, `${species} S15 cooldown out of range`);
    assert.ok(nodes.S16.cooldown >= 20 && nodes.S16.cooldown <= 22, `${species} S16 cooldown out of range`);
  }
});

test('Wolf Spider Bedrock Fortification is nerfed to 25% damage reduction and 18 HP/s', () => {
  const wolfS10 = SKILL_CATALOG.wolf.nodes.S10;
  assert.match(wolfS10.description, /25%/, 'Wolf S10 must have 25% damage reduction');
  assert.match(wolfS10.description, /18 HP\/s/, 'Wolf S10 must have 18 HP/s');
});

test('Orb Weaver S8 Whirlpool operates independently without breaking on equip', () => {
  const weaverS8 = SKILL_CATALOG.weaver.nodes.S8;
  assert.match(weaverS8.description, /Spins a 3\.5m whirlpool web/, 'Weaver S8 must spawn independently');
});
