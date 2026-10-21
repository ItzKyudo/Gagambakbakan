import { getColor, getLooks } from '../../gb';
import { network } from '../../network';
import type { MenuStartOptions } from './menuTypes';

export function renderOnlineModal(isOpen: boolean): string {
  if (!isOpen) return '';
  const serverHost = network.serverUrl.replace(/^https?:\/\//, '').replace(/^wss?:\/\//, '').replace(/\/.*$/, '');
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
        <p class="note" style="margin:0;">Duel players worldwide with automatic matchmaking.</p>

        <div style="display:grid; gap:10px;">
          <button type="button" class="btn primary" id="btnOnlineQuick">Quick Match</button>
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
