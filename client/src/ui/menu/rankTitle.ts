export function getPlayerRankTitle(level: number): string {
  if (level <= 1) return 'Stick Novice';
  if (level <= 2) return 'Twig Brawler';
  if (level <= 4) return 'Silk Striker';
  if (level <= 6) return 'Venom Weaver';
  if (level <= 8) return 'Pond Duelist';
  if (level <= 10) return 'Canopy Master';
  return 'Twig Grandmaster';
}
