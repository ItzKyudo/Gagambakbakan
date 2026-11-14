import assert from 'node:assert/strict';
import test from 'node:test';
import { BattleCombat } from '../src/rooms/BattleCombat';
import { TERRAIN_IDS } from '../src/terrain';
import { TERRAINS } from '../../client/src/game/terrain';
import type { BattleStateData } from '../src/rooms/schema/BattleState';

function arena(terrain: BattleStateData['terrain']) {
  const state = {
    terrain, terrainTime: 0, terrainBroken: false, terrainSink: 0, terrainClearT: 0, terrainBuds: 0, terrainPuddleT: 0, terrainFireT: 0,
    round: 1, status: 'fight', webs: [],
    p1: { id: 0, x: 600, species: 'weaver', grip: 120, soak: 0, burn: 0, stun: 0, hang: false, ko: false, airT: 0, dashT: 0, falls: 0 },
    p2: { id: 1, x: 800, species: 'guardian', grip: 120, soak: 0, burn: 0, stun: 0, hang: false, ko: false, airT: 0, dashT: 0, falls: 0 }
  } as BattleStateData;
  return { state, combat: new BattleCombat(state, () => {}) };
}

test('local and online matches expose the same nine terrains', () => {
  assert.deepEqual(TERRAINS.map(terrain => terrain.id), [...TERRAIN_IDS]);
  assert.equal(TERRAINS.length, 9);
});


test('dew pool soaks a spider standing in its center', () => {
  const { state, combat } = arena('dew');
  combat['stepTerrain'](.1);
  assert.equal(state.p1.soak, 1.5);
  assert.equal(state.p2.soak, 0);
});

test('briar thorns hit spiders whose body overlaps the downward spike', () => {
  const { state, combat } = arena('briar');
  state.p1.x = 275 + 30;
  combat['stepTerrain'](.25);
  assert.equal(state.p1.grip, 119);
  state.p1.x = 275 + 33;
  combat['stepTerrain'](.25);
  assert.equal(state.p1.grip, 119);
  state.p1.x = 275;
  state.p1.species = 'lynx';
  combat['stepTerrain'](.25);
  assert.equal(state.p1.grip, 119);
});

test('ember cracks burn non-fire spiders only', () => {
  const { state, combat } = arena('ember');
  state.p2.x = 600;
  combat['stepTerrain'](1);
  assert.equal(state.p1.grip, 117.5);
  assert.equal(state.p2.grip, 120);
});

test('lightning warns before it strikes and only hits grounded spiders in range', () => {
  const { state, combat } = arena('lightning');
  state.terrainTime = 13.6;
  combat['stepTerrain'](.1);
  assert.equal(state.terrainStrike?.x, 387);
  state.p1.x = 387;
  state.p2.x = 387;
  state.p2.airT = 1;
  state.terrainTime = 14.95;
  combat['stepTerrain'](.1);
  assert.equal(state.p1.stun, .8);
  assert.equal(state.p1.grip, 111);
  assert.equal(state.p2.grip, 120);
});

test('climb tap jumps from the branch, then respects its cooldown', () => {
  const { state, combat } = arena('lilypad');
  combat['tryTerrainJump'](state.p1, 1);
  assert.equal(state.p1.airT, .7);
  assert.equal(state.p1.terrainJumpT, .7);
  state.p1.airT = 0;
  combat['tryTerrainJump'](state.p1, 1);
  assert.equal(state.p1.airT, 0);
});

test('totem silk stops crossing shots until cleared', () => {
  const { state, combat } = arena('totem');
  const shot = () => ({ id: 'shot', x: 370, y: 290, vx: 300, owner: 0, life: 1, k: 'spit' as const });
  state.webs.push(shot());
  combat['stepWebs'](.05);
  assert.equal(state.webs.length, 0);
  state.terrainClearT = 1;
  state.webs.push(shot());
  combat['stepWebs'](.05);
  assert.equal(state.webs.length, 1);
});

test('broken ember bridge drops a grounded spider and lets a jump cross', () => {
  const { state, combat } = arena('ember');
  state.terrainBroken = true;
  state.p1.airT = .4;
  combat['stepTerrain'](.1);
  assert.equal(state.p1.hang, false);
  state.p1.airT = 0;
  combat['stepTerrain'](.1);
  assert.equal(state.p1.hang, true);
});

test('termite tunnel amplifies Wolf shockwaves within the lower lane', () => {
  const { state, combat } = arena('termite');
  state.p1.species = 'wolf';
  state.p1.under = true;
  state.p2.under = true;
  state.p2.x = 780;
  combat['applySpiderPulse'](state.p1, state.p2, { range: 150, stun: .5 });
  assert.equal(state.p2.stun, .65);
  state.p2.under = false;
  state.p2.stun = 0;
  combat['applySpiderPulse'](state.p1, state.p2, { range: 150, stun: .5 });
  assert.equal(state.p2.stun, 0);
});

test('repeated ember explosions break the middle and fire ignites totem silk', () => {
  const ember = arena('ember');
  ember.combat['applySpiderPulse'](ember.state.p1, ember.state.p2, { range: 100, detonate: true });
  assert.equal(ember.state.terrainBroken, false);
  ember.combat['applySpiderPulse'](ember.state.p1, ember.state.p2, { range: 100, detonate: true });
  assert.equal(ember.state.terrainBroken, true);

  const totem = arena('totem');
  totem.state.p1.species = 'guardian';
  totem.state.p1.x = 380;
  totem.combat['applySpiderPulse'](totem.state.p1, totem.state.p2, { range: 100, burn: 2 });
  assert.equal(totem.state.terrainFireT, 4);
  assert.equal(totem.state.terrainClearT, 4);
});

test('lilypad sinks and soaks both spiders when crowded', () => {
  const { state, combat } = arena('lilypad');
  state.p2.x = 600;
  state.terrainSink = .95;
  combat['stepTerrain'](.1);
  assert.equal(state.terrainSink, 1);
  assert.equal(state.p1.soak, 1);
  assert.equal(state.p2.soak, 1);
  assert.equal(state.p1.hang, false);
});

test('spiders can walk across both narrow lilypad seams without falling', () => {
  const { state, combat } = arena('lilypad');
  for (const x of [485, 490, 500, 600, 700, 710, 715]) {
    state.p1.x = x;
    combat['stepTerrain'](.05);
    assert.equal(state.p1.hang, false, `fell at x=${x}`);
  }
});

test('lilypad returns to its resting height as soon as a spider falls', () => {
  const { state, combat } = arena('lilypad');
  state.p2.x = 600;
  state.terrainSink = .8;
  state.p1.grip = 0;
  combat['stepTerrain'](.05);
  assert.equal(state.p1.hang, true);
  assert.equal(state.p2.hang, false);
  assert.equal(state.terrainSink, 0);
});

test('fall restores every changed terrain feature and pauses hazards during the climb', () => {
  const { state, combat } = arena('ember');
  state.terrainTime = 14;
  state.terrainBroken = true;
  state.terrainStrike = { x: 600, warning: 1 };
  state.terrainSink = .8;
  state.terrainClearT = 2;
  state.terrainBuds = 3;
  state.terrainPuddleT = 2;
  state.terrainFireT = 2;
  state.p2.x = 350;
  state.p2.species = 'weaver';
  combat['fall'](state.p1);
  combat['stepTerrain'](.5);
  assert.equal(state.terrainTime, 0);
  assert.equal(state.terrainBroken, false);
  assert.equal(state.terrainStrike, undefined);
  assert.equal(state.terrainSink, 0);
  assert.equal(state.terrainClearT, 0);
  assert.equal(state.terrainBuds, 0);
  assert.equal(state.terrainPuddleT, 0);
  assert.equal(state.terrainFireT, 0);
  assert.equal(state.p2.grip, 120);
  combat['recover'](state.p1);
  combat['stepTerrain'](.5);
  assert.equal(state.terrainTime, .5);
  assert.equal(state.p2.grip, 118.75);
});

test('waiting spider ignores lingering damage, webs, and terrain changes', () => {
  const { state, combat } = arena('ember');
  state.p2.x = 600;
  state.p2.burn = 3;
  state.p2.venom = 3;
  state.p2.stun = 1;
  state.webs.push({ id: 'shot', x: 600, y: 290, vx: 0, owner: 0, life: 1, k: 'spit', damage: 20 });
  combat['fall'](state.p1);
  assert.equal(state.p2.burn, 0);
  assert.equal(state.p2.venom, 0);
  assert.equal(state.p2.stun, 0);
  combat['hurt'](state.p2, 20);
  combat['stepWebs'](.05);
  combat['applySpiderPulse'](state.p1, state.p2, { range: 100, detonate: true });
  combat['applySpiderPulse'](state.p1, state.p2, { range: 100, detonate: true });
  assert.equal(state.p2.grip, 120);
  assert.equal(state.terrainBroken, false);
  assert.equal(state.webs.length, 1);
});

test('briar thorns allow spiders to still attack and move without full stun lock', () => {
  const { state, combat } = arena('briar');
  state.p1.x = 275;
  state.p1.species = 'weaver';
  combat['stepTerrain'](.25);
  assert.equal(state.p1.stun, 0, 'Spider should not be stun locked on thorns');
  assert.equal(state.p1.grip, 119, 'Spider still takes thorn prick damage');
});

test('lightning water rise and 10s sudden drop knockout', () => {
  const { state, combat } = arena('lightning');
  state.round = 2;
  state.roundTimer = 8; // last 10 seconds
  combat['fall'](state.p1);
  assert.equal(state.p1.ko, true, 'Falling in final 10 seconds triggers instant water KO');
});

test('lilypad unaligned projectile block and dash bump penalty', () => {
  const { state, combat } = arena('lilypad');
  state.terrainSink = 0.5; // unaligned
  const shot = { id: 'shot1', x: 490, y: 290, vx: 500, owner: 0, life: 1, k: 'spit' as const };
  state.webs.push(shot);
  combat['stepWebs'](.05);
  assert.equal(state.webs.length, 0, 'Unaligned projectile blocked at driftwood/lilypad boundary');

  // Dash bump penalty
  state.p1.x = 490;
  state.p1.dashT = 0.1;
  state.p1.dashDir = 1;
  state.p1.grip = 100;
  combat['stepSpider'](state.p1, state.p2, { left: false, right: false, strike: false, heavy: false, block: false, reel: 0, ab1: 0, ab2: 0 }, .05);
  assert.equal(state.p1.dashT, 0, 'Dash should be interrupted on unaligned boundary');
  assert.equal(state.p1.grip, 95, 'Dash bump deals 5 damage');
});

test('safe positioning selects a non-hazard coordinate for spiders', () => {
  const { state, combat } = arena('ember');
  state.terrainBroken = true;
  // Current x is 600 which is inside broken gap / vent
  const safeX = combat.getSafeTerrainX('ember', state, 600, 800);
  assert.notEqual(safeX, 600);
  assert.ok(Math.abs(safeX - 600) >= 65, 'Safe position must be outside broken gap');
});

