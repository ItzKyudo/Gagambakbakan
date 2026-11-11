import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import { runInNewContext } from 'node:vm';
import { test } from 'node:test';

const source = readFileSync(new URL('../src/gb.ts', import.meta.url), 'utf8');
const rewardFunction = source.slice(
  source.indexOf('export function recordOnlineMatch('),
  source.indexOf('export function drawSkillsCount(')
);

test('casual earns EXP but leaves ranked rating untouched', () => {
  let progress = {
    onlineExp: 0, onlinePlayed: 0, played: 0, onlineWins: 0,
    wins: 0, onlineLosses: 0, losses: 0, rating: 300, rank: 'huntsman-spider',
    spiderProgress: { weaver: { exp: 0, skills: ['dash', 'web'] }, wolf: { exp: 0, skills: ['dash', 'surge'] } }
  };
  const context = {
    getProgress: () => progress,
    saveProgress: value => { progress = value; },
    getLevel: exp => exp >= 100 ? 2 : 1,
    getExpProgress: exp => ({ totalExp: exp }),
    calculateRatingDelta: (rating, won) => ({ newRating: rating + (won ? 22 : -15), delta: won ? 22 : -15 }),
    getRankFromRating: rating => ({ id: rating >= 300 ? 'huntsman-spider' : 'wolf-spider', title: 'Test rank' })
  };
  runInNewContext(stripTypeScriptTypes(rewardFunction).replace('export ', ''), context);
  const casual = context.recordOnlineMatch(true, 2, false, 'wolf');
  assert.equal(casual.newRating, 300);
  assert.equal(casual.ratingChange, 0);
  assert.equal(casual.expGained, 200);
  assert.equal(progress.spiderProgress.wolf.exp, 200);
  assert.equal(progress.spiderProgress.weaver.exp, 0);
  const ranked = context.recordOnlineMatch(true, 2, true, 'weaver');
  assert.equal(ranked.newRating, 322);
  assert.equal(ranked.ratingChange, 22);
  assert.equal(progress.spiderProgress.weaver.exp, 200);
});
