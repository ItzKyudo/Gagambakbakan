import assert from 'node:assert/strict';
import test from 'node:test';
import { BattleCombat } from '../src/rooms/BattleCombat';
import type { BattleStateData } from '../src/rooms/schema/BattleState';

test('climbing back up never gives more grip than a standing opponent', () => {
  const state = {
    p1: { id: 0, x: 500, colorLight: '#fff', grip: 0 },
    p2: { id: 1, x: 700, colorLight: '#fff', grip: 50 }
  } as BattleStateData;
  const combat = new BattleCombat(state, () => {});

  combat['recover'](state.p1);
  assert.equal(state.p1.grip, 40);

  state.p2.grip = 100;
  combat['recover'](state.p1);
  assert.equal(state.p1.grip, 65);

  state.p2.grip = 5;
  combat['recover'](state.p1);
  assert.equal(state.p1.grip, 1);
});
