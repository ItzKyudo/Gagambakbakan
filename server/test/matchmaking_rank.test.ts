import assert from 'node:assert/strict';
import test from 'node:test';
import {
  SpiderRankId,
  SpiderRank,
  SPIDER_RANKS,
  getRankFromRating,
  calculateRatingChange,
  calculateWinRate,
  canPairInMatchmaking,
  normalizeRankId
} from '../src/ranks';

test('getRankFromRating starts at 0 and maps escalating tiers', () => {
  assert.equal(getRankFromRating(0).id, 'wolf-spider');
  assert.equal(getRankFromRating(150).id, 'wolf-spider');
  assert.equal(getRankFromRating(299).id, 'wolf-spider');
  assert.equal(getRankFromRating(300).id, 'huntsman-spider');
  assert.equal(getRankFromRating(799).id, 'huntsman-spider');
  assert.equal(getRankFromRating(800).id, 'philippine-tarantula');
  assert.equal(getRankFromRating(1599).id, 'philippine-tarantula');
  assert.equal(getRankFromRating(1600).id, 'brown-widow');
  assert.equal(getRankFromRating(2500).id, 'brown-widow');
});

test('calculateRatingChange scales difficulty: harder MMR as rank increases, floor 0', () => {
  // Tier 1 (Grave Stalker): +25 / -10
  assert.deepEqual(calculateRatingChange(0, true), { newRating: 25, delta: 25 });
  assert.deepEqual(calculateRatingChange(5, false), { newRating: 0, delta: -10 }); // floor 0

  // Tier 2 (Nightmare Prowler): +22 / -15
  assert.deepEqual(calculateRatingChange(400, true), { newRating: 422, delta: 22 });
  assert.deepEqual(calculateRatingChange(400, false), { newRating: 385, delta: -15 });

  // Tier 3 (Hellspawn): +18 / -18
  assert.deepEqual(calculateRatingChange(1000, true), { newRating: 1018, delta: 18 });
  assert.deepEqual(calculateRatingChange(1000, false), { newRating: 982, delta: -18 });

  // Tier 4 (Death's Empress): +15 / -20 (losses penalize harder than wins)
  assert.deepEqual(calculateRatingChange(1700, true), { newRating: 1715, delta: 15 });
  assert.deepEqual(calculateRatingChange(1700, false), { newRating: 1680, delta: -20 });
});

test('calculateWinRate accurately computes battlefield win percentage', () => {
  assert.equal(calculateWinRate(0, 0), 0);
  assert.equal(calculateWinRate(3, 4), 75);
  assert.equal(calculateWinRate(1, 3), 33);
  assert.equal(calculateWinRate(10, 10), 100);
});

test('matchmaking strictly pairs only players with identical rank', () => {
  assert.equal(canPairInMatchmaking('wolf-spider', 'wolf-spider'), true);
  assert.equal(canPairInMatchmaking('huntsman-spider', 'huntsman-spider'), true);
  assert.equal(canPairInMatchmaking('wolf-spider', 'huntsman-spider'), false);
  assert.equal(canPairInMatchmaking('wolf-spider', 'brown-widow'), false);
  // Legacy ranks normalize to their canonical tier
  assert.equal(canPairInMatchmaking('brawler', 'wolf-spider'), true);
  assert.equal(canPairInMatchmaking('striker', 'huntsman-spider'), true);
  assert.equal(canPairInMatchmaking('duelist', 'philippine-tarantula'), true);
  assert.equal(canPairInMatchmaking('grandmaster', 'brown-widow'), true);
});

test('normalizeRankId normalizes legacy and unknown rank strings', () => {
  assert.equal(normalizeRankId('wolf-spider'), 'wolf-spider');
  assert.equal(normalizeRankId('novice'), 'wolf-spider');
  assert.equal(normalizeRankId('brawler'), 'wolf-spider');
  assert.equal(normalizeRankId('huntsman-spider'), 'huntsman-spider');
  assert.equal(normalizeRankId('striker'), 'huntsman-spider');
  assert.equal(normalizeRankId('weaver'), 'huntsman-spider');
  assert.equal(normalizeRankId('philippine-tarantula'), 'philippine-tarantula');
  assert.equal(normalizeRankId('duelist'), 'philippine-tarantula');
  assert.equal(normalizeRankId('brown-widow'), 'brown-widow');
  assert.equal(normalizeRankId('master'), 'brown-widow');
  assert.equal(normalizeRankId('grandmaster'), 'brown-widow');
  assert.equal(normalizeRankId('unknown'), 'wolf-spider');
  assert.equal(normalizeRankId(undefined), 'wolf-spider');
});

test('surrender and forfeit penalties compute expected rating adjustments for both winner and loser', () => {
  // Tier 1 player forfeiting vs Tier 1 player: loser loses 10 rating, winner gains 25 rating
  const p1Forfeit = calculateRatingChange(100, false);
  const p2Winner = calculateRatingChange(100, true);
  assert.equal(p1Forfeit.delta, -10);
  assert.equal(p1Forfeit.newRating, 90);
  assert.equal(p2Winner.delta, 25);
  assert.equal(p2Winner.newRating, 125);

  // Brown widow tier forfeit: loser loses 20 rating, winner gains 15 rating
  const bwForfeit = calculateRatingChange(1800, false);
  const bwWinner = calculateRatingChange(1800, true);
  assert.equal(bwForfeit.delta, -20);
  assert.equal(bwForfeit.newRating, 1780);
  assert.equal(bwWinner.delta, 15);
  assert.equal(bwWinner.newRating, 1815);
});
