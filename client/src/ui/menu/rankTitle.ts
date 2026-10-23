export const RANK_RATING_LABEL = 'Venom';

export type SpiderRankId =
  | 'wolf-spider'
  | 'huntsman-spider'
  | 'philippine-tarantula'
  | 'brown-widow'
  | 'novice'
  | 'brawler'
  | 'striker'
  | 'weaver'
  | 'duelist'
  | 'master'
  | 'grandmaster';

export interface SpiderRank {
  id: SpiderRankId;
  stem: 'wolf-spider' | 'huntsman-spider' | 'philippine-tarantula' | 'brown-widow';
  title: string;
  species: string;
  desc: string;
  minRating: number;
  badgeCol: string;
}

export const SPIDER_RANKS: SpiderRank[] = [
  { id: 'wolf-spider', stem: 'wolf-spider', species: 'Wolf Spider', title: 'Grave Stalker', desc: 'Patient predator stalking the forest floor. Tier 1 combatant honing foundational venom skills.', minRating: 0, badgeCol: '#cba16b' },
  { id: 'huntsman-spider', stem: 'huntsman-spider', species: 'Huntsman Spider', title: 'Nightmare Prowler', desc: 'Lightning-fast ambush hunter. Tier 2 combatant commanding speed and lethal reflexes in ranked duel.', minRating: 300, badgeCol: '#a9d3e2' },
  { id: 'philippine-tarantula', stem: 'philippine-tarantula', species: 'Philippine Tarantula', title: 'Hellspawn', desc: 'Armored subterranean terror with crushing fangs. Tier 3 veteran tested by rigorous matchmaking.', minRating: 800, badgeCol: '#f0a25b' },
  { id: 'brown-widow', stem: 'brown-widow', species: 'Brown Widow', title: "Death's Empress", desc: "Apex architect of neurotoxic lethality. Tier 4 master reigning at the peak of the web arena.", minRating: 1600, badgeCol: '#f26b76' }
];

export function normalizeRankId(rankId?: string): 'wolf-spider' | 'huntsman-spider' | 'philippine-tarantula' | 'brown-widow' {
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

export interface RankProgressInfo {
  currentRank: SpiderRank;
  nextRank: SpiderRank | null;
  currentRating: number;
  tierBaseRating: number;
  tierTargetRating: number;
  ratingInTier: number;
  ratingForTier: number;
  progressPct: number;
}

export function getRankProgress(rating: number = 0): RankProgressInfo {
  const safeRating = Math.max(0, rating | 0);
  const currentRank = getRankFromRating(safeRating);
  const currentIndex = SPIDER_RANKS.findIndex(r => r.id === currentRank.id);
  const nextRank = currentIndex < SPIDER_RANKS.length - 1 ? SPIDER_RANKS[currentIndex + 1] : null;

  const tierBaseRating = currentRank.minRating;
  const tierTargetRating = nextRank ? nextRank.minRating : tierBaseRating;
  const ratingForTier = Math.max(1, tierTargetRating - tierBaseRating);
  const ratingInTier = nextRank ? Math.max(0, Math.min(ratingForTier, safeRating - tierBaseRating)) : ratingForTier;
  const progressPct = nextRank ? Math.min(100, Math.floor((ratingInTier / ratingForTier) * 100)) : 100;

  return {
    currentRank,
    nextRank,
    currentRating: safeRating,
    tierBaseRating,
    tierTargetRating,
    ratingInTier,
    ratingForTier,
    progressPct
  };
}

export function calculateRatingDelta(currentRating: number = 0, won: boolean): { newRating: number; delta: number } {
  const safeRating = Math.max(0, currentRating | 0);
  const rank = getRankFromRating(safeRating);
  let winGain = 25;
  let lossLoss = 10;

  switch (rank.stem) {
    case 'wolf-spider':
      // Tier 1 (0–299 MMR): beginner friendly, fast initial progress
      winGain = 25;
      lossLoss = 10;
      break;
    case 'huntsman-spider':
      // Tier 2 (300–799 MMR): competitive standard, wider gap (500 MMR)
      winGain = 22;
      lossLoss = 15;
      break;
    case 'philippine-tarantula':
      // Tier 3 (800–1599 MMR): hard climb, wide gap (800 MMR), equal risk/reward
      winGain = 18;
      lossLoss = 18;
      break;
    case 'brown-widow':
      // Tier 4 (1600+ MMR): apex tier, losses penalize more than wins
      winGain = 15;
      lossLoss = 20;
      break;
  }

  const delta = won ? winGain : -lossLoss;
  const newRating = Math.max(0, safeRating + delta);
  return { newRating, delta };
}

export function getPlayerRankTitle(rating: number = 0): string {
  return getRankFromRating(rating).title;
}

export function renderRankBadgeSVG(rankId: SpiderRankId | string, size = 96): string {
  const stem = normalizeRankId(rankId);
  const rank = SPIDER_RANKS.find(r => r.stem === stem) || SPIDER_RANKS[0];
  const s = size;
  return `
    <img
      src="/ranks/${stem}.svg"
      width="${s}"
      height="${s}"
      class="rank-badge-svg"
      alt="${rank.species} (${rank.title}) Badge"
      title="${rank.species} &bull; ${rank.title}"
      loading="eager"
      draggable="false"
      onerror="this.onerror=null;this.src='/ranks/${stem}-128.png';"
    />
  `.trim();
}
