// Ranking tiers based on competitive rating starting at 0 and escalating in difficulty
export type SpiderRankId =
  | 'wolf-spider'
  | 'huntsman-spider'
  | 'philippine-tarantula'
  | 'brown-widow';

export interface SpiderRank {
  id: SpiderRankId;
  stem: 'wolf-spider' | 'huntsman-spider' | 'philippine-tarantula' | 'brown-widow';
  title: string;
  species: string;
  desc: string;
  minRating: number;
  winGain: number;
  lossLoss: number;
}

export const SPIDER_RANKS: SpiderRank[] = [
  {
    id: 'wolf-spider',
    stem: 'wolf-spider',
    species: 'Wolf Spider',
    title: 'Grave Stalker',
    desc: 'Patient predator stalking the forest floor. Tier 1 combatant honing foundational venom skills.',
    minRating: 0,
    winGain: 25,
    lossLoss: 10
  },
  {
    id: 'huntsman-spider',
    stem: 'huntsman-spider',
    species: 'Huntsman Spider',
    title: 'Nightmare Prowler',
    desc: 'Lightning-fast ambush hunter. Tier 2 combatant commanding speed and lethal reflexes in ranked duel.',
    minRating: 300,
    winGain: 22,
    lossLoss: 15
  },
  {
    id: 'philippine-tarantula',
    stem: 'philippine-tarantula',
    species: 'Philippine Tarantula',
    title: 'Hellspawn',
    desc: 'Armored subterranean terror with crushing fangs. Tier 3 veteran tested by rigorous matchmaking.',
    minRating: 800,
    winGain: 18,
    lossLoss: 18
  },
  {
    id: 'brown-widow',
    stem: 'brown-widow',
    species: 'Brown Widow',
    title: "Death's Empress",
    desc: "Apex architect of neurotoxic lethality. Tier 4 master reigning at the peak of the web arena.",
    minRating: 1600,
    winGain: 15,
    lossLoss: 20
  }
];

export function normalizeRankId(rankId?: string): SpiderRankId {
  switch (rankId) {
    case 'brown-widow':
    case 'master':
    case 'grandmaster':
      return 'brown-widow';
    case 'philippine-tarantula':
    case 'duelist':
      return 'philippine-tarantula';
    case 'huntsman-spider':
    case 'striker':
    case 'weaver':
      return 'huntsman-spider';
    case 'wolf-spider':
    case 'novice':
    case 'brawler':
    default:
      return 'wolf-spider';
  }
}

export function getRankFromRating(rating: number = 0): SpiderRank {
  const safeRating = Math.max(0, rating | 0);
  let rank = SPIDER_RANKS[0];
  for (const r of SPIDER_RANKS) {
    if (safeRating >= r.minRating) {
      rank = r;
    }
  }
  return rank;
}

export function calculateRatingChange(currentRating: number = 0, won: boolean): { newRating: number; delta: number } {
  const safeRating = Math.max(0, currentRating | 0);
  const rank = getRankFromRating(safeRating);
  const delta = won ? rank.winGain : -rank.lossLoss;
  const newRating = Math.max(0, safeRating + delta);
  return { newRating, delta };
}

export function calculateWinRate(wins: number, played: number): number {
  if (!played || played <= 0) return 0;
  return Math.round((Math.max(0, wins) / played) * 100);
}

export function canPairInMatchmaking(rankA: string, rankB: string): boolean {
  return normalizeRankId(rankA) === normalizeRankId(rankB);
}
