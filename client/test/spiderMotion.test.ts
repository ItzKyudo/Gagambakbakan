import assert from 'node:assert/strict';
import test from 'node:test';
import { attackMotion, gaitMotion } from '../src/game/spiderMotion';

test('gait keeps feet planted before lifting through the swing', () => {
  assert.equal(gaitMotion(.3).lift, 0);
  assert.ok(gaitMotion(.79).lift > .99);
  assert.ok(gaitMotion(.99).reach > .98);
});

test('attack motion eases through anticipation, impact, and recovery', () => {
  assert.equal(attackMotion(0), 0);
  assert.ok(attackMotion(.15) < -.97);
  assert.ok(attackMotion(.27) > .99);
  assert.equal(attackMotion(.46), 0);
});
