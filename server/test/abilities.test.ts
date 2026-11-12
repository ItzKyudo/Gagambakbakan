import assert from 'node:assert/strict';
import test from 'node:test';
import { ALL_ABILITY_IDS, getRandomAbilities, selectDraftAbilities, selectSpiderAbilities, SPIDER_POOLS, SPIDER_STARTERS, validateUnlockedSkills, validateSpiderProgress } from '../src/abilities';
import { ALL_ABILITY_IDS as clientAbilityIds, getSpiderAbility } from '../../client/src/game/abilities';
import { BattleCombat } from '../src/rooms/BattleCombat';
import { SPIDER_MOVES, spiderMove } from '../src/spiderMoves';
import { SPIDER_MOVES as clientMoves } from '../../client/src/game/spiderMoves';
import { spiderAbilityIcon } from '../../client/src/game/spiderIcons';

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
  assert.deepEqual(selectSpiderAbilities('invalid', ['pounce'], ['dash', 'surge']), ['dash', 'surge']);
});

test('each spider has 16 unique moves and icons and can unlock its full kit', () => {
  assert.deepEqual(clientAbilityIds, ALL_ABILITY_IDS);
  assert.deepEqual(clientMoves, SPIDER_MOVES);
  const names = new Set<string>();
  const icons = new Set<string>();
  for (const species of Object.keys(SPIDER_STARTERS) as (keyof typeof SPIDER_STARTERS)[]) {
    assert.equal(SPIDER_POOLS[species].length, 16);
    assert.equal(new Set(SPIDER_POOLS[species]).size, 16);
    for (const id of SPIDER_POOLS[species]) {
      names.add(getSpiderAbility(species, id).name);
      icons.add(spiderAbilityIcon(species, id));
      assert.equal(getSpiderAbility(species, id).desc, spiderMove(species, id).desc);
      assert.ok(spiderAbilityIcon(species, id).startsWith('data:image/svg+xml,'));
    }
    const progress = validateSpiderProgress({ [species]: { exp: 5950, skills: ALL_ABILITY_IDS } }, [], 0, species);
    assert.equal(progress[species].skills.length, 16);
  }
  assert.equal(names.size, 80);
  assert.equal(icons.size, 80);
  for (const id of ALL_ABILITY_IDS) assert.equal(new Set(Object.keys(SPIDER_STARTERS).map(species => JSON.stringify(spiderMove(species, id).effect))).size, 5);
});

test('spider control skills have distinct combat effects', () => {
  const state = { webs: [] } as any;
  const combat = new BattleCombat(state, () => {});
  const input = { left: false, right: false } as any;
  const castWeb = (species: string, shield = 0) => {
    state.webs = [];
    const player = { id: 0, species, skill1: 'web', grip: 60, guard: 30, power: 0, hasteT: 0, x: 200, face: 1, hang: false, shield: 0, soak: 0, burn: 0 } as any;
    const opponent = { id: 1, x: 240, face: -1, hang: false, ko: false, inv: 0, blocking: false, shield, snare: 0, guard: 100, soak: 0, burn: 0, venom: 0 } as any;
    (combat as any).useSkill(player, opponent, 0, input);
    return { player, opponent, projectiles: state.webs.length };
  };
  assert.equal(castWeb('weaver').projectiles, 1);
  assert.equal(castWeb('hunter').player.power, 3);
  assert.equal(castWeb('guardian').opponent.snare, .9);
  assert.equal(castWeb('wolf').player.hasteT, 1);
  assert.equal(castWeb('lynx').opponent.snare, 1);
  assert.equal(castWeb('guardian', 1).opponent.snare, 0);
});

test('water extinguishes fire, fire burns, and nature poisons', () => {
  const state = { webs: [] } as any;
  const combat = new BattleCombat(state, () => {});
  const input = { left: false, right: false } as any;
  const player = { id: 0, species: 'weaver', skill1: 'spit', grip: 80, guard: 80, x: 200, face: 1, hang: false } as any;
  const opponent = { id: 1, x: 240, face: -1, hang: false, ko: false, inv: 0, blocking: false, shield: 0, guard: 100, grip: 80, soak: 0, burn: 2, venom: 0 } as any;
  state.p1 = player; state.p2 = opponent;
  (combat as any).useSkill(player, opponent, 0, input);
  state.webs[0].x = opponent.x;
  (combat as any).stepWebs(0);
  assert.equal(opponent.burn, 0);
  assert.ok(opponent.soak > 0);
  player.species = 'wolf'; player.skill1 = 'spit'; player.x = 200;
  opponent.soak = 0;
  (combat as any).useSkill(player, opponent, 0, input);
  assert.ok(opponent.burn > 0);
  player.species = 'lynx'; player.skill1 = 'web';
  (combat as any).useSkill(player, opponent, 0, input);
  assert.ok(opponent.venom > 0);
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
