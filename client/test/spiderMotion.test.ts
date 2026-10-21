import assert from 'node:assert/strict';
import test from 'node:test';
import { attackMotion, gaitMotion, learnDemoFrame } from '../src/game/spiderMotion';

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

test('learn demo follows the real move, strike, block, and climb sequence', () => {
  assert.deepEqual(learnDemoFrame(0), { phase: 'move', index: 0, time: 0, cycle: 0 });
  assert.equal(learnDemoFrame(2.5).phase, 'strike');
  assert.equal(learnDemoFrame(4).phase, 'block');
  assert.equal(learnDemoFrame(5.5).phase, 'climb');
  assert.equal(learnDemoFrame(9.4).phase, 'move');
  assert.equal(learnDemoFrame(9.4).cycle, 1);
});
