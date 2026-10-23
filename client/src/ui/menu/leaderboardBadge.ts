export function renderPodiumBadge(board: 'level' | 'rank', place: number, size = 44): string {
  if (!Number.isInteger(place) || place < 1 || place > 3) return '';
  return `<img class="leaderboard-podium-badge" src="/leaderboard-badges/${board}-${place}.svg" width="${size}" height="${size}" alt="Place ${place}" title="Place ${place}" />`;
}

export function renderLeaderboardBadge(board: 'level' | 'rank', place: number): string {
  if (!Number.isInteger(place) || place < 1 || place > 3) return '';
  const label = board === 'level' ? 'Highest level' : 'Highest rank';
  return `<span class="profile-leaderboard-badge">
    <img src="/leaderboard-badges/${board}-${place}.svg" width="80" height="80" alt="" />
    <span><strong>#${place} · ${label}</strong><small>Current leaderboard podium</small></span>
  </span>`;
}
