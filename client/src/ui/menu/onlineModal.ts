import { getColor, getLooks, getBattlefieldsData } from '../../gb';
import { getRankFromRating, renderRankBadgeSVG, RANK_RATING_LABEL } from './rankTitle';
import { network } from '../../network';
import type { MenuStartOptions } from './menuTypes';

export function renderOnlineModal(isOpen: boolean): string {
  if (!isOpen) return '';
  const serverHost = network.serverUrl.replace(/^https?:\/\//, '').replace(/^wss?:\/\//, '').replace(/\/.*$/, '');
  const stats = getBattlefieldsData();
  const rank = getRankFromRating(stats.rating);

  return `
    <div class="pick" style="z-index:90; padding:20px;" role="dialog" aria-modal="true">
      <div class="pick-in" style="max-width:440px; margin:auto; background:var(--surface); border:2px solid var(--line); border-radius:12px; padding:24px; gap:16px;">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <h2 style="font-family:var(--display); font-size:28px; margin:0;">Multiplayer Online</h2>
          <div style="display:flex; align-items:center; gap:6px; font-size:11px; padding:4px 8px; background:rgba(76,199,178,0.12); border:1px solid rgba(76,199,178,0.3); border-radius:12px; color:#4cc7b2;">
            <span style="display:inline-block; width:6px; height:6px; border-radius:50%; background:#4cc7b2; box-shadow:0 0 6px #4cc7b2;"></span>
            <span>Online</span>
          </div>
        </div>

        <!-- RANK & BATTLEFIELDS TIER INFO -->
        <div style="display:flex; justify-content:space-between; align-items:center; padding:10px 14px; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:8px;">
          <div style="display:flex; align-items:center; gap:10px;">
            ${renderRankBadgeSVG(rank.id, 42)}
            <div>
              <div style="font-size:11px; color:var(--muted); text-transform:uppercase; letter-spacing:0.05em;">Your Rank Tier</div>
              <div style="font-size:15px; font-weight:700; color:${rank.badgeCol};">${rank.title}</div>
            </div>
          </div>
          <div style="text-align:right;">
            <div style="font-size:11px; color:var(--muted); text-transform:uppercase; letter-spacing:0.05em;">Rating &amp; Win Rate</div>
            <div style="font-size:13px; font-weight:700; color:var(--fg);">${stats.rating} ${RANK_RATING_LABEL} &bull; ${stats.winRate}%</div>
          </div>
        </div>

        <p class="note" style="margin:0; font-size:12px;">
          Matchmaking pairs you <strong>strictly with players of the same rank</strong> (${rank.title}). EXP earned unlocks skills on the Abilities Web.
        </p>

        <div style="display:grid; gap:10px;">
          <button type="button" class="btn primary" id="btnOnlineQuick">Enter Matchmaking (${rank.title})</button>
        </div>

        <div style="font-size:11px; color:var(--muted); text-align:center; opacity:0.85;">
          Server: <span style="color:var(--accent); font-weight:600;">${serverHost}</span>
        </div>

        <button type="button" class="btn ghost" id="btnOnlineClose" style="margin-top:4px;">Close</button>
      </div>
    </div>
  `;
}

export function bindOnlineModalEvents(
  container: HTMLElement,
  close: () => void,
  start: (options: MenuStartOptions) => void
) {
  container.querySelector('#btnOnlineClose')?.addEventListener('click', close);
  container.querySelector('#btnOnlineQuick')?.addEventListener('click', () => {
    const looks = getLooks();
    const color = getColor(looks.p1.color);
    start({
      mode: 'online',
      diff: 'normal',
      playerName: looks.p1.name,
      playerColor: { main: color.main, light: color.light, dark: color.dark },
      playerPattern: looks.p1.pattern,
      playerCustomPattern: looks.p1.customPattern,
      playerAcc: looks.p1.acc
    });
  });
}
