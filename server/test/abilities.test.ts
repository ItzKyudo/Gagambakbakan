import assert from 'node:assert/strict';
import test from 'node:test';
import { ALL_ABILITY_IDS, getRandomAbilities, selectDraftAbilities, selectSpiderAbilities, SPIDER_POOLS, SPIDER_STARTERS, validateUnlockedSkills, validateSpiderProgress } from '../src/abilities';
import { ALL_ABILITY_IDS as clientAbilityIds, ABILITIES as clientSkillLayouts, getSpiderAbility } from '../../client/src/game/abilities';
import { BattleCombat } from '../src/rooms/BattleCombat';
import { SPIDER_MOVES, spiderMove } from '../src/spiderMoves';
import { SPIDER_MOVES as clientMoves, spiderMove as clientSpiderMove } from '../../client/src/game/spiderMoves';
import { spiderAbilityIcon } from '../../client/src/game/spiderIcons';
import { ICON_ART } from '../../client/src/game/spiderIconArt';
import { SKILL_CATALOG, SKILL_NODE_IDS, nodeForAbility } from '../src/skillCatalog';
import { SKILL_EFFECTS } from '../src/skillEffects';

test('server rejects invalid and duplicate client ability ids', () => {
  assert.deepEqual(getRandomAbilities(3, [], ['bogus']), ['dash']);
  assert.deepEqual(getRandomAbilities(3, [], ['web', 'web']), ['web']);
  assert.deepEqual(selectDraftAbilities(['dash', 'dash'], ['dash', 'web']), ['dash', 'web']);
  assert.deepEqual(selectDraftAbilities(null, ['web']), ['web', '']);
});

test('spider draft equips two legal offered skills without a forced slot', () => {
  for (const spider of Object.keys(SPIDER_STARTERS)) {
    assert.deepEqual(selectSpiderAbilities(spider, ['web', 'dash'], ['dash', 'web']), ['web', 'dash']);
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
    assert.equal(ICON_ART[species].nodes.length, 16);
    assert.equal(new Set(ICON_ART[species].nodes).size, 16);
    assert.equal(SPIDER_POOLS[species].length, 16);
    assert.equal(Object.keys(SKILL_EFFECTS[species]).length, 16);
    assert.equal(new Set(SPIDER_POOLS[species]).size, 16);
    for (const id of SPIDER_POOLS[species]) {
      names.add(getSpiderAbility(species, id).name);
      icons.add(spiderAbilityIcon(species, id));
      assert.equal(getSpiderAbility(species, id).desc, spiderMove(species, id).desc);
      assert.deepEqual(spiderMove(species, id).effect, clientSpiderMove(species, id).effect);
      assert.ok(spiderAbilityIcon(species, id).startsWith('data:image/svg+xml,'));
      const svg = decodeURIComponent(spiderAbilityIcon(species, id).split(',')[1]);
      assert.match(svg, /clip-path="url\(#hex\)"/);
      assert.doesNotMatch(svg, /<rect\b/);
    }
    const progress = validateSpiderProgress({ [species]: { exp: 12600, skills: SKILL_NODE_IDS } }, [], 0, species);
    assert.equal(progress[species].skills.length, 16);
  }
  assert.equal(names.size, 80);
  assert.equal(icons.size, 80);
  for (const id of ALL_ABILITY_IDS) assert.equal(new Set(Object.keys(SPIDER_STARTERS).map(species => JSON.stringify(spiderMove(species, id).effect))).size, 5);
});

test('ability nodes sit on tiered web rings around the core', () => {
  assert.deepEqual([clientSkillLayouts.dash.x, clientSkillLayouts.dash.y], [500, 380]);
  for (const [id, ability] of Object.entries(clientSkillLayouts)) {
    const nodeId = nodeForAbility(id as any)!;
    const node = SKILL_CATALOG.weaver.nodes[nodeId];
    const radius = nodeId === 'S1' ? 0 : [0, 135, 245, 285, 365][node.tier];
    assert.ok(Math.abs(Math.hypot(ability.x - 500, ability.y - 380) - radius) <= 1, id);
  }
});

test('elemental follow-ups consume stacks, reduce healing, and protect against damage', () => {
  const state = { webs: [] } as any;
  const combat = new BattleCombat(state, () => {});
  const input = { left: false, right: false } as any;
  const attacker = { id: 0, x: 200, face: 1, grip: 40, guard: 100, hang: false, cd1: 0, cd2: 0 } as any;
  const target = { id: 1, x: 240, face: -1, grip: 120, guard: 100, hang: false, ko: false, inv: 0, blocking: false, shield: 0, riposte: 0, soak: 0, burn: 0, venom: 0 } as any;
  state.p1 = attacker; state.p2 = target;

  attacker.species = 'guardian'; attacker.skill1 = 'dash';
  for (let i = 0; i < 3; i++) (combat as any).useSkill(attacker, target, 0, input);
  assert.equal(target.igniteStacks, 3);
  attacker.skill1 = 'anchor';
  (combat as any).useSkill(attacker, target, 0, input);
  assert.equal(target.igniteStacks, 0);
  assert.equal(target.burn, 0);

  attacker.species = 'wolf'; attacker.skill1 = 'power';
  (combat as any).useSkill(attacker, target, 0, input);
  assert.equal(attacker.barrierHp, 90);
  (combat as any).hurt(attacker, 50);
  assert.equal(attacker.grip, 40);
  assert.equal(attacker.barrierHp, 40);

  target.hang = false;
  target.grip = 120;
  attacker.species = 'lynx'; attacker.skill1 = 'dash';
  (combat as any).useSkill(attacker, target, 0, input);
  state.webs[0].x = target.x;
  (combat as any).stepWebs(0);
  assert.equal(target.toxin, 4);
  target.grip = 40;
  target.species = 'weaver'; target.skill1 = 'spit';
  (combat as any).useSkill(target, attacker, 0, input);
  assert.equal(target.regenPerSecond, 0);
  target.skill1 = 'power';
  (combat as any).useSkill(target, attacker, 0, input);
  assert.equal(target.reductionFraction, .25);
});

test('Searing Mandible Flurry refunds Flashfire Dash cooldown only against Ignite', () => {
  const state = { webs: [] } as any;
  const combat = new BattleCombat(state, () => {});
  const input = { left: false, right: false } as any;
  const attacker = { id: 0, species: 'guardian', skill1: 'web', skill2: 'shield', x: 200, face: 1, grip: 120, guard: 100, hang: false, cd1: 2, cd2: 0 } as any;
  const target = { id: 1, x: 240, face: -1, grip: 120, guard: 100, hang: false, ko: false, inv: 0, blocking: false, shield: 0, riposte: 0, soak: 0, burn: 0, igniteStacks: 0, venom: 0, snare: 0, stun: 0 } as any;
  (combat as any).useSkill(attacker, target, 1, input);
  assert.equal(attacker.cd1, 2);
  target.igniteStacks = 2;
  (combat as any).useSkill(attacker, target, 1, input);
  (combat as any).stepSpider(attacker, target, { ...input, strike: false, heavy: false, block: false, reel: 0, ab1: 0, ab2: 0 }, .3);
  assert.equal(attacker.cd1, 1.2);
});

test('all five starter attacks apply their specified damage and elemental status', () => {
  const state = { webs: [] } as any;
  const combat = new BattleCombat(state, () => {});
  const input = { left: false, right: false } as any;
  const cases = [
    ['weaver', 40, 'soak', 3],
    ['hunter', 45, 'tailwindStacks', 1],
    ['guardian', 35, 'igniteStacks', 1],
    ['wolf', 50, 'shredStacks', 1],
    ['lynx', 40, 'toxin', 4]
  ] as const;
  for (const [species, damage, status, amount] of cases) {
    state.webs = [];
    const player = { id: 0, species, skill1: 'dash', x: 200, face: 1, grip: 120, guard: 100, hang: false, inv: 0 } as any;
    const opponent = { id: 1, x: 240, face: -1, grip: 120, guard: 100, hang: false, ko: false, inv: 0, blocking: false, shield: 0, riposte: 0, soak: 0, burn: 0, venom: 0 } as any;
    state.p1 = player; state.p2 = opponent;
    (combat as any).useSkill(player, opponent, 0, input);
    if (species === 'lynx') { state.webs[0].x = opponent.x; (combat as any).stepWebs(0); }
    assert.equal(opponent.grip, 120 - damage, species);
    assert.equal((species === 'hunter' ? player : opponent)[status], amount, species);
    assert.deepEqual(spiderMove(species, 'dash').effect, clientSpiderMove(species, 'dash').effect);
  }
});

test('Wolf Spider Quicksand Pit prevents an enemy dash before cooldown starts', () => {
  const state = { webs: [{ owner: 1, x: 200, zoneRadius: 180, life: 3, progressiveSlow: true }] } as any;
  const combat = new BattleCombat(state, () => {});
  const player = { id: 0, species: 'wolf', skill1: 'web', x: 200, face: 1, grip: 120, guard: 100, hang: false, cd1: 0 } as any;
  const opponent = { id: 1, x: 500, grip: 120, guard: 100, hang: false } as any;
  assert.ok(spiderMove('wolf', 'web').effect.dash);
  assert.equal((combat as any).useSkill(player, opponent, 0, { left: false, right: false }), false);
  assert.equal(player.cd1, 0);
  player.species = 'lynx'; player.skill1 = 'riposte';
  assert.ok(spiderMove('lynx', 'riposte').effect.vault);
  assert.equal((combat as any).useSkill(player, opponent, 0, { left: false, right: false }), false);
  assert.equal(player.cd1, 0);
});

test('Jumping Spider Tailwind extends vault leap range by five percent per stack', () => {
  const combat = new BattleCombat({ webs: [] } as any, () => {});
  const jumper = { id: 0, species: 'hunter', skill1: 'surge', x: 200, face: 1, grip: 120, guard: 100, hang: false, tailwindStacks: 4 } as any;
  const target = { id: 1, x: 650, grip: 120, guard: 100, hang: false, ko: false } as any;
  (combat as any).useSkill(jumper, target, 0, { left: false, right: false });
  assert.notEqual(jumper.x, 200);
});

test('Jumping Spider Tailwind extends forward dash range by five percent per stack', () => {
  const combat = new BattleCombat({ webs: [] } as any, () => {});
  const jumper = { id: 0, species: 'hunter', skill1: 'dash', x: 200, face: 1, grip: 120, guard: 100, hang: false, tailwindStacks: 4 } as any;
  const target = { id: 1, x: 500, grip: 120, guard: 100, hang: false, ko: false } as any;
  (combat as any).useSkill(jumper, target, 0, { left: false, right: false });
  assert.equal(jumper.dashT, .3204);
});

test('Wolf Tremor grounds leap skills for its duration', () => {
  const combat = new BattleCombat({ webs: [] } as any, () => {});
  const jumper = { id: 0, species: 'hunter', skill1: 'surge', x: 200, face: 1, grip: 120, guard: 100, hang: false, tremorT: 1, cd1: 0 } as any;
  const target = { id: 1, x: 650, grip: 120, guard: 100, hang: false, ko: false } as any;
  assert.equal((combat as any).useSkill(jumper, target, 0, { left: false, right: false }), false);
  assert.equal(jumper.cd1, 0);
});

test('Wolf armor shred increases damage taken by ten percent per stack', () => {
  const combat = new BattleCombat({ webs: [] } as any, () => {});
  const wolf = { id: 0, species: 'wolf', x: 200, face: 1 } as any;
  const target = { id: 1, x: 220, grip: 100, guard: 100, hang: false, ko: false, inv: 0, blocking: false, shield: 0, riposte: 0, soak: 0, shredStacks: 0, venom: 0 } as any;
  for (let i = 0; i < 3; i++) (combat as any).applySpiderPulse(wolf, target, { range: 100, shred: 1 });
  (combat as any).hurt(target, 10);
  assert.equal(target.grip, 87);
});

test('Wolf Quartz Thorns boosts and reflects melee damage only while barrier remains', () => {
  const wolf = { id: 0, species: 'wolf', skill1: 'sweep', x: 200, face: 1, grip: 120, guard: 100, hang: false, barrierHp: 90, barrierT: 4, reflectT: 0, meleeDamageT: 0, isHeavy: false, power: 0 } as any;
  const enemy = { id: 1, species: 'lynx', x: 240, face: -1, grip: 120, guard: 100, hang: false, inv: 0, blocking: false, shield: 0, riposte: 0, soak: 0, venom: 0, isHeavy: false, power: 0 } as any;
  const state = { p1: wolf, p2: enemy, webs: [] } as any;
  const combat = new BattleCombat(state, () => {});
  (combat as any).useSkill(wolf, enemy, 0, { left: false, right: false });
  (combat as any).doStrike(wolf, enemy);
  assert.equal(enemy.grip, 103.2);
  (combat as any).doStrike(enemy, wolf);
  assert.equal(enemy.grip, 99);
  wolf.barrierHp = 0;
  enemy.grip = 120;
  (combat as any).doStrike(wolf, enemy);
  assert.equal(enemy.grip, 106);
});

test('Jumping Spider Barometric Eye Focus reveals stealth within eight meters', () => {
  const hunter = { id: 0, species: 'hunter', skill1: 'power', x: 200, face: 1, grip: 120, guard: 100, hang: false, cd1: 0 } as any;
  const lynx = { id: 1, species: 'lynx', x: 400, grip: 120, guard: 100, hang: false, stealthT: 3 } as any;
  const state = { p1: hunter, p2: lynx, webs: [] } as any;
  const combat = new BattleCombat(state, () => {});
  (combat as any).useSkill(hunter, lynx, 0, { left: false, right: false });
  assert.equal(hunter.critChance, .25);
  assert.equal(hunter.revealT, 4);
  assert.equal(hunter.revealRange, 480);
});

test('Jumping Spider Vacuum Fang Strike slices enemy web traps', () => {
  const hunter = { id: 0, species: 'hunter', skill1: 'shield', x: 200, face: 1, grip: 120, guard: 100, hang: false, cd1: 0 } as any;
  const target = { id: 1, x: 900, grip: 120, guard: 100, hang: false, ko: false, inv: 0, blocking: false } as any;
  const state = { p1: hunter, p2: target, webs: [] } as any;
  const combat = new BattleCombat(state, () => {});
  state.webs.push({ id: 'trap', owner: 1, x: 300, y: 100, vx: 0, life: 4, k: 'web', zoneRadius: 25, zonePulse: { range: 25 }, oneShot: true, interval: .5 });
  (combat as any).useSkill(hunter, target, 0, { left: false, right: false });
  assert.equal(state.webs[1].cutsTraps, true);
  (combat as any).stepWebs(.1);
  assert.equal(state.webs.some((w: any) => w.id === 'trap'), false);
  assert.equal(state.webs.filter((w: any) => w.cutsTraps).length, 1);
});

test('Eye of the Tempest moves with the Hunter and scopes cooldown reduction to its ring', () => {
  const hunter = { id: 0, species: 'hunter', skill1: 'leech', x: 200, face: 1, grip: 120, guard: 100, hang: false, cd1: 0, cooldownT: 0 } as any;
  const target = { id: 1, x: 900, grip: 120, guard: 100, hang: false, ko: false } as any;
  const state = { p1: hunter, p2: target, webs: [] } as any;
  const combat = new BattleCombat(state, () => {});
  (combat as any).useSkill(hunter, target, 0, { left: false, right: false });
  assert.equal(hunter.cooldownT || 0, 0);
  assert.equal(state.webs[0].zoneRadius, 420);
  assert.equal(state.webs[0].outerOnly, true);
  assert.equal(state.webs[0].cooldownRateFraction, .6);
  hunter.x = 300;
  (combat as any).stepWebs(0);
  assert.equal(state.webs[0].x, 300);
});

test('Wolf Burrow avoids projectiles and deals its hit on emergence', () => {
  const player = { id: 0, species: 'wolf', skill1: 'web', x: 200, face: 1, grip: 120, guard: 100, hang: false, cd1: 0, dashT: 0, inv: 0 } as any;
  const target = { id: 1, x: 260, face: -1, grip: 120, guard: 100, hang: false, ko: false, inv: 0, blocking: false, shield: 0, riposte: 0, soak: 0, burn: 0, venom: 0, stun: 0 } as any;
  const state = { p1: player, p2: target, webs: [], status: 'fight' } as any;
  const combat = new BattleCombat(state, () => {});
  const input = { left: false, right: false, strike: false, heavy: false, block: false, reel: 0, ab1: 0, ab2: 0 } as any;
  assert.deepEqual(spiderMove('wolf', 'web').effect, clientSpiderMove('wolf', 'web').effect);
  assert.equal((combat as any).useSkill(player, target, 0, input), true);
  assert.equal(player.inv, 0);
  assert.equal(player.projectileInvT, 2.5);
  assert.equal(target.grip, 120);
  state.webs.push({ id: 'shot', owner: 1, x: 250, y: 100, vx: 0, life: 1, k: 'spit', damage: 20 });
  (combat as any).stepWebs(0);
  assert.equal(target.grip, 120);
  assert.equal(state.webs.length, 1);
  player.dashT = .01;
  (combat as any).stepSpider(player, target, input, .02);
  assert.equal(target.grip, 80);
  assert.equal(player.dashPulse, undefined);
});

test('Orb Weaver Undertow Tether yanks a target back after three hundred units', () => {
  const weaver = { id: 0, species: 'weaver', skill1: 'tremor', x: 200, face: 1, grip: 120, guard: 100, hang: false, cd1: 0 } as any;
  const target = { id: 1, x: 400, face: -1, grip: 120, guard: 100, hang: false, ko: false, inv: 0, blocking: false, shield: 0, riposte: 0, soak: 0, burn: 0, venom: 0, stun: 0 } as any;
  const state = { p1: weaver, p2: target, webs: [], status: 'fight' } as any;
  const combat = new BattleCombat(state, () => {});
  const input = { left: false, right: false, strike: false, heavy: false, block: false, reel: 0, ab1: 0, ab2: 0 } as any;
  (combat as any).useSkill(weaver, target, 0, input);
  assert.equal(target.tetherT, 3);
  target.x = 701;
  (combat as any).stepSpider(target, weaver, input, .02);
  assert.equal(target.x, 400);
  assert.equal(target.stun, 1);
  assert.equal(target.tetherT, 0);
});

test('Orb Weaver Fogbank Slipstream creates mist and 20 percent evasion', () => {
  const player = { id: 0, species: 'weaver', skill1: 'carapace', x: 200, face: 1, grip: 120, guard: 100, hang: false, cd1: 0 } as any;
  const target = { id: 1, x: 600, grip: 120, guard: 100, hang: false, ko: false } as any;
  const state = { p1: player, p2: target, webs: [] } as any;
  const combat = new BattleCombat(state, () => {});
  (combat as any).useSkill(player, target, 0, { left: false, right: false });
  assert.equal(player.evasionChance, .2);
  assert.equal(player.evasionT, 3);
  assert.equal(state.webs[0].mist, true);
});

test('Mirror Lake cooldown reduction and root immunity only apply inside its zone', () => {
  const player = { id: 0, species: 'weaver', skill1: 'leech', x: 200, face: 1, grip: 120, guard: 100, hang: false, cd1: 0, cd2: 0, stun: 0, atkT: 0, blocking: false, soak: 0, snare: 0 } as any;
  const target = { id: 1, x: 600, grip: 120, guard: 100, hang: false, ko: false } as any;
  const state = { p1: player, p2: target, webs: [], status: 'fight' } as any;
  const combat = new BattleCombat(state, () => {});
  const input = { left: false, right: false, strike: false, heavy: false, block: false, reel: 0, ab1: 0, ab2: 0 } as any;
  (combat as any).useSkill(player, target, 0, input);
  assert.equal(player.cooldownT || 0, 0);
  assert.equal(player.rootImmuneT || 0, 0);
  assert.equal((combat as any).rootImmune(player), true);
  player.cd1 = 10;
  (combat as any).stepSpider(player, target, input, .65);
  assert.equal(player.cd1, 9);
  player.x = 500;
  player.cd1 = 10;
  assert.equal((combat as any).rootImmune(player), false);
  (combat as any).stepSpider(player, target, input, .65);
  assert.equal(player.cd1, 9.35);
});

test('Wolf Sandstorm Prowl follows the spider and slows by 25 percent', () => {
  const player = { id: 0, species: 'wolf', skill1: 'carapace', x: 200, face: 1, grip: 120, guard: 100, hang: false, cd1: 0 } as any;
  const target = { id: 1, x: 600, grip: 120, guard: 100, hang: false, ko: false } as any;
  const state = { p1: player, p2: target, webs: [] } as any;
  const combat = new BattleCombat(state, () => {});
  (combat as any).useSkill(player, target, 0, { left: false, right: false });
  assert.equal(state.webs[0].followsOwner, true);
  assert.equal(state.webs[0].slowMultiplier, .75);
  assert.equal(state.webs[0].dustCloud, true);
  assert.equal(state.webs[0].zonePulse.snare, undefined);
});

test('Wolf Landslide Charge only stuns after slamming into a wall', () => {
  const player = { id: 0, species: 'wolf', skill1: 'riposte', x: 1080, face: 1, grip: 120, guard: 100, hang: false, cd1: 0, dashT: 0, inv: 0 } as any;
  const target = { id: 1, x: 1090, face: -1, grip: 120, guard: 100, hang: false, ko: false, inv: 0, blocking: false, shield: 0, riposte: 0, soak: 0, burn: 0, venom: 0, stun: 0 } as any;
  const state = { p1: player, p2: target, webs: [], status: 'fight' } as any;
  const combat = new BattleCombat(state, () => {});
  const input = { left: false, right: false, strike: false, heavy: false, block: false, reel: 0, ab1: 0, ab2: 0 } as any;
  (combat as any).useSkill(player, target, 0, input);
  assert.equal(target.grip, 120);
  player.dashT = .01;
  (combat as any).stepSpider(player, target, input, .02);
  assert.equal(target.grip, 50);
  assert.equal(target.stun, 1.2);
});

test('ground traps persist until entered and apply their area effects', () => {
  const state = { webs: [] } as any;
  const combat = new BattleCombat(state, () => {});
  const input = { left: false, right: false } as any;
  const player = { id: 0, species: 'weaver', skill1: 'surge', x: 200, face: 1, grip: 70, guard: 100, hang: false } as any;
  const opponent = { id: 1, x: 500, grip: 120, guard: 100, face: -1, hang: false, ko: false, inv: 0, blocking: false, shield: 0, riposte: 0, snare: 0, soak: 0, burn: 0, venom: 0 } as any;
  state.p1 = player; state.p2 = opponent;
  (combat as any).useSkill(player, opponent, 0, input);
  (combat as any).stepWebs(.1);
  assert.equal(opponent.grip, 120);
  assert.equal(state.webs.length, 1);
  opponent.x = state.webs[0].x;
  (combat as any).stepWebs(.1);
  assert.equal(opponent.grip, 90);
  assert.equal(opponent.soak, 3);
  assert.equal(opponent.snare, 1.2);
  assert.equal(state.webs.length, 0);
});

test('barrier zones stop enemy projectiles and block crossing where specified', () => {
  const state = { webs: [] } as any;
  const combat = new BattleCombat(state, () => {});
  const input = { left: false, right: false } as any;
  const owner = { id: 0, species: 'weaver', skill1: 'haste', x: 200, face: 1, grip: 120, guard: 100, hang: false } as any;
  const enemy = { id: 1, species: 'lynx', skill1: 'dash', x: 600, face: -1, grip: 120, guard: 100, hang: false, ko: false, inv: 0, blocking: false } as any;
  state.p1 = owner; state.p2 = enemy;
  (combat as any).useSkill(owner, enemy, 0, input);
  (combat as any).useSkill(enemy, owner, 0, input);
  assert.equal(state.webs.length, 2);
  (combat as any).stepWebs(.1);
  assert.equal(state.webs.length, 1);
  assert.equal(owner.grip, 120);

  state.webs = [];
  owner.species = 'wolf'; owner.skill1 = 'haste';
  (combat as any).useSkill(owner, enemy, 0, input);
  enemy.x = 450;
  assert.equal((combat as any).wallX(enemy, 330), state.webs[0].x + state.webs[0].zoneRadius);
});

test('air deflection reflects a projectile and land armor resists pulls', () => {
  const random = Math.random;
  Math.random = () => .99;
  try {
  const state = { webs: [] } as any;
  const combat = new BattleCombat(state, () => {});
  const input = { left: false, right: false } as any;
  const hunter = { id: 0, species: 'hunter', skill1: 'sweep', x: 200, face: 1, grip: 120, guard: 100, hang: false, inv: 0, blocking: false, shield: 0 } as any;
  const lynx = { id: 1, species: 'lynx', skill1: 'dash', x: 240, face: -1, grip: 120, guard: 100, hang: false, ko: false, inv: 0, blocking: false } as any;
  state.p1 = hunter; state.p2 = lynx;
  (combat as any).useSkill(hunter, lynx, 0, input);
  assert.equal(hunter.tailwindStacks, 1);
  (combat as any).useSkill(lynx, hunter, 0, input);
  state.webs[0].x = hunter.x;
  (combat as any).stepWebs(0);
  assert.equal(hunter.grip, 120);
  assert.equal(state.webs.length, 1);
  assert.equal(state.webs[0].owner, hunter.id);

  state.webs = [];
  lynx.species = 'wolf'; lynx.skill1 = 'power'; lynx.x = 260;
  (combat as any).useSkill(lynx, hunter, 0, input);
  hunter.species = 'weaver'; hunter.skill1 = 'mend';
  (combat as any).useSkill(hunter, lynx, 0, input);
  assert.equal((combat as any).kb[lynx.id], 0);
  } finally {
    Math.random = random;
  }
});

test('water sanctum heals in range and briars drain only on enemy movement', () => {
  const state = { webs: [] } as any;
  const combat = new BattleCombat(state, () => {});
  const input = { left: false, right: false } as any;
  const owner = { id: 0, species: 'weaver', skill1: 'leech', x: 200, face: 1, grip: 40, guard: 100, hang: false, atkT: 0 } as any;
  const enemy = { id: 1, x: 500, grip: 120, guard: 100, hang: false, ko: false, inv: 0, blocking: false, shield: 0, riposte: 0 } as any;
  state.p1 = owner; state.p2 = enemy;
  (combat as any).useSkill(owner, enemy, 0, input);
  (combat as any).stepWebs(1);
  assert.equal(owner.grip, 65);
  owner.x = 500;
  (combat as any).stepWebs(1);
  assert.equal(owner.grip, 65);

  state.webs = [];
  owner.species = 'lynx'; owner.skill1 = 'surge'; owner.x = 200; owner.grip = 40;
  enemy.x = 500; enemy.grip = 120;
  (combat as any).useSkill(owner, enemy, 0, input);
  enemy.x = state.webs[0].x;
  (combat as any).stepWebs(.5);
  assert.equal(enemy.grip, 120);
  assert.equal(owner.grip, 45);
  enemy.x += 60;
  (combat as any).stepWebs(.5);
  assert.equal(enemy.grip, 105);
  assert.equal(owner.grip, 50);
});

test('nature needles need two hits to slow attacks, and seeds arm a delayed bloom', () => {
  const state = { webs: [] } as any;
  const combat = new BattleCombat(state, () => {});
  const input = { left: false, right: false } as any;
  const lynx = { id: 0, species: 'lynx', skill1: 'shield', x: 200, face: 1, grip: 120, guard: 100, hang: false } as any;
  const target = { id: 1, x: 240, grip: 120, guard: 100, hang: false, ko: false, inv: 0, blocking: false, shield: 0, riposte: 0, soak: 0, burn: 0, venom: 0 } as any;
  state.p1 = lynx; state.p2 = target;
  (combat as any).useSkill(lynx, target, 0, input);
  assert.equal(state.webs.length, 3);
  for (const w of state.webs) w.x = target.x;
  (combat as any).stepWebs(0);
  assert.equal(target.grip, 30);
  assert.equal(target.attackSpeedMultiplier, .75);
  assert.equal(target.attackSpeedT, 2);

  target.grip = 120;
  lynx.skill1 = 'anchor';
  (combat as any).useSkill(lynx, target, 0, input);
  state.webs[0].x = target.x;
  (combat as any).stepWebs(0);
  assert.equal(target.bloomT, 2);
  assert.equal(target.bloomDamage, 55);
});

test('all 80 skills cast without invalid state and use catalog cooldowns', () => {
  const input = { left: false, right: false } as any;
  for (const species of Object.keys(SPIDER_STARTERS)) for (const id of ALL_ABILITY_IDS) {
    const player = { id: 0, species, skill1: id, x: 200, face: 1, grip: 120, guard: 100, hang: false, ko: false, inv: 0, blocking: false, shield: 0, riposte: 0, soak: 0, burn: 0, venom: 0, snare: 0, stun: 0, hitFlash: 0, cd1: 0, cd2: 0, atkT: 0 } as any;
    const target = { ...player, id: 1, x: 260, face: -1, skill1: '' } as any;
    if (spiderMove(species, id).effect.requiresAirborne) player.airT = 1;
    const state = { p1: player, p2: target, webs: [] } as any;
    const combat = new BattleCombat(state, () => {});
    (combat as any).useSkill(player, target, 0, input);
    assert.ok(Number.isFinite(player.grip) && Number.isFinite(target.grip), `${species} ${id} grip`);
    assert.ok(Number.isFinite(player.guard) && Number.isFinite(target.guard), `${species} ${id} guard`);
    assert.ok(Number.isFinite(player.cd1), `${species} ${id} cooldown`);
    if (!spiderMove(species, id).effect.expandZone) assert.equal(player.cd1, spiderMove(species, id).cooldown, `${species} ${id} cooldown`);
  }
});

test('only played spider experience unlocks its own skill pool', () => {
  const progress = validateSpiderProgress({ wolf: { exp: 100, skills: ['S1', 'S2', 'S3', 'S4', 'S5'] }, hunter: { exp: 0, skills: ['S1', 'S2', 'S3', 'S4', 'S5'] } }, [], 0, 'weaver');
  assert.deepEqual(progress.wolf.skills, ['dash', 'web', 'surge', 'power', 'shield']);
  assert.deepEqual(progress.hunter.skills, ['dash', 'web', 'surge', 'power']);
  assert.equal(progress.weaver.exp, 0);
  const early = validateSpiderProgress({ weaver: { exp: 250, skills: ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S15'] } }, [], 0, 'weaver');
  assert.deepEqual(early.weaver.skills, ['dash', 'web', 'surge', 'power', 'shield', 'mend']);
  const legacy = validateSpiderProgress({ weaver: { exp: 250, skills: ['dash', 'web', 'spit'] } }, [], 0, 'weaver');
  assert.equal(legacy.weaver.exp, 250);
  assert.deepEqual(legacy.weaver.skills, ['dash', 'web', 'surge', 'power']);
});

test('legacy generic skill claims cannot grant purchased species skills', () => {
  assert.deepEqual(validateUnlockedSkills(['dash', 'leech'], 100), ['dash', 'web', 'surge', 'power']);
});

test('Hunter Updraft avoids ground hits, remains projectile vulnerable, and enables Dropkick', () => {
  const hunter = { id: 0, species: 'hunter', skill1: 'web', skill2: 'mend', x: 200, face: 1, grip: 120, guard: 100, hang: false, ko: false, inv: 0, blocking: false, shield: 0, riposte: 0, soak: 0, burn: 0, venom: 0, snare: 0, stun: 0, hitFlash: 0, cd1: 0, cd2: 0, atkT: 0, airT: 0 } as any;
  const rival = { ...hunter, id: 1, species: 'wolf', skill1: 'dash', skill2: 'web', x: 260, face: -1, airT: 0 } as any;
  const combat = new BattleCombat({ p1: hunter, p2: rival, webs: [] } as any, () => {});
  const input = { left: false, right: false } as any;
  assert.equal((combat as any).useSkill(hunter, rival, 0, input), true);
  assert.equal(hunter.airT, 1.5);
  (combat as any).doStrike(rival, hunter);
  assert.equal(hunter.grip, 120);
  (combat as any).applySpiderPulse(rival, hunter, { range: 100, damage: 10 });
  assert.equal(hunter.grip, 120);
  (combat as any).battleState.webs.push({ id: 'air-test', x: hunter.x, y: 0, vx: 0, owner: 1, life: 1, k: 'spit', species: 'wolf', damage: 10 });
  (combat as any).stepWebs(0);
  assert.equal(hunter.grip, 110);
  (combat as any).applySpiderPulse(rival, hunter, { range: 100, damage: 10, tremor: .5 });
  assert.equal(hunter.airT, 0);
  hunter.airT = 1;
  hunter.tremorT = 0;
  assert.equal((combat as any).useSkill(hunter, rival, 1, input), true);
  assert.equal(rival.grip, 50);
  assert.equal(hunter.dashBounceBack, 300);
  (combat as any).stepSpider(hunter, rival, input, .2);
  assert.equal(hunter.dashDir, -1);
  assert.equal(hunter.dashT, 300 / 900);
});
