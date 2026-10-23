import assert from 'node:assert/strict';
import test from 'node:test';

// Ranking tiers based on competitive rating starting at 0 and escalating in difficulty
type SpiderRankId = 'wolf-spider' | 'huntsman-spider' | 'philippine-tarantula' | 'brown-widow';

interface SpiderRank {
  id: SpiderRankId;
  title: string;
  minRating: number;
}

const SPIDER_RANKS: SpiderRank[] = [
  { id: 'wolf-spider', title: 'Grave Stalker', minRating: 0 },
  { id: 'huntsman-spider', title: 'Nightmare Prowler', minRating: 300 },
  { id: 'philippine-tarantula', title: 'Hellspawn', minRating: 800 },
  { id: 'brown-widow', title: "Death's Empress", minRating: 1600 }
];

function getRankFromRating(rating: number = 0): SpiderRank {
  const safeRating = Math.max(0, rating | 0);
  let rank = SPIDER_RANKS[0];
  for (const r of SPIDER_RANKS) {
    if (safeRating >= r.minRating) {
      rank = r;
    }
  }
  return rank;
}

function calculateRatingChange(currentRating: number = 0, won: boolean): { newRating: number; delta: number } {
  const safeRating = Math.max(0, currentRating | 0);
  const rank = getRankFromRating(safeRating);
  let winGain = 25;
  let lossLoss = 10;

  switch (rank.id) {
    case 'wolf-spider':
      winGain = 25;
      lossLoss = 10;
      break;
    case 'huntsman-spider':
      winGain = 22;
      lossLoss = 15;
      break;
    case 'philippine-tarantula':
      winGain = 18;
      lossLoss = 18;
      break;
    case 'brown-widow':
      winGain = 15;
      lossLoss = 20;
      break;
  }

  const delta = won ? winGain : -lossLoss;
  const newRating = Math.max(0, safeRating + delta);
  return { newRating, delta };
}

function calculateWinRate(wins: number, played: number): number {
  if (!played || played <= 0) return 0;
  return Math.round((Math.max(0, wins) / played) * 100);
}

function canPairInMatchmaking(rankA: string, rankB: string): boolean {
  return rankA === rankB;
}

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
});
