import { createElement, Volume2, VolumeX, BookOpen, type IconNode } from 'lucide';
import { sound } from '../../audio';
import { getColor, getExpProgress, getLooks, getProgress, getSettings, getUnlockedIds, spiderSVG } from '../../gb';
import { SKILLS_LIST } from '../../game/abilities';
import { getPlayerRankTitle } from './rankTitle';

function icon(node: IconNode, attrs: Record<string, string | number> = {}): string {
  return createElement(node, attrs).outerHTML;
}

/* ====================================================
   1. MAIN MENU VIEW (Matching menu.html)
   ==================================================== */
export function renderMainMenuView(): string {
  const looks = getLooks();
  const st = getSettings();
  const prog = getProgress();
  const expInfo = getExpProgress(prog.onlineExp);
  const unlockedCount = getUnlockedIds(prog).length;
  const soundIconSvg = icon(sound.enabled ? Volume2 : VolumeX, {
    class: 'ico snd-ico',
    width: 15,
    height: 15,
    'stroke-width': 2.2
  });

  return `
    <!-- TOP CENTER TITLE WITH NO CONTAINER -->
    <header class="menu-title-header">
      <button type="button" class="menu-corner-sound-btn sound-toggle-btn ${sound.enabled ? 'sound-on' : 'sound-off'}" id="btnCornerSoundToggle" title="Toggle Sound (Mute/Unmute)">
        ${soundIconSvg}
        <span>Sound: ${sound.enabled ? 'ON' : 'OFF'}</span>
      </button>
      <svg class="title-twig" viewBox="0 0 300 78" aria-hidden="true">
        <rect x="6" y="8" width="288" height="14" rx="7" fill="#7b5b3e"/>
        <rect x="6" y="8" width="288" height="4" rx="2" fill="#a58059"/>
        <g stroke-linecap="round" stroke-width="2.4" fill="none">
          <g stroke="#f2a33a"><path d="M96 22v14"/><path d="M82 52l-14-12M84 58l-18 2M110 52l14-12M108 58l18 2"/></g>
          <g stroke="#4cc7b2"><path d="M204 22v14"/><path d="M190 52l-14-12M192 58l-18 2M218 52l14-12M216 58l18 2"/></g>
        </g>
        <ellipse cx="96" cy="48" rx="15" ry="12" fill="#f2a33a"/><circle cx="96" cy="38" r="8" fill="#ffd694"/>
        <ellipse cx="204" cy="48" rx="15" ry="12" fill="#4cc7b2"/><circle cx="204" cy="38" r="8" fill="#b0f2e3"/>
      </svg>
      <h1 class="menu-main-title"><span class="a">Gagam</span><span class="j">bakbakan</span></h1>
      <p class="menu-sub-title">Two spiders. One twig.</p>
    </header>

    <!-- SPLIT BODY: BUTTONS FAR LEFT, CHARACTER DISPLAY FAR RIGHT -->
    <main class="menu-split-body">
      <div class="menu-left-col">
        <nav class="panel" id="pMain" aria-label="Main menu">
          <button type="button" class="mb primary" id="btnGoPlay">
            <span class="mi"><svg class="ico"><use href="#ic-play"/></svg></span>
            <span class="ml">Play</span>
          </button>
          <button type="button" class="mb" id="btnGoAbilities">
            <span class="mi"><svg class="ico"><use href="#ic-gem"/></svg></span>
            <span class="ml">Abilities</span>
            <small id="abCount">Level ${expInfo.level} &middot; ${unlockedCount} of ${SKILLS_LIST.length} unlocked</small>
          </button>
          <button type="button" class="mb" id="btnGoSettings">
            <span class="mi"><svg class="ico"><use href="#ic-gear"/></svg></span>
            <span class="ml">Settings</span>
            <small>Keys, sound, music</small>
          </button>
          <button type="button" class="mb" id="btnGoAbout">
            <span class="mi">${icon(BookOpen, { class: 'ico', width: 20, height: 20, 'stroke-width': 2.1 })}</span>
            <span class="ml">About</span>
            <small>Lore, rules &amp; credits</small>
          </button>
        </nav>

        <nav class="panel" id="pPlay" aria-label="Choose a mode" hidden>
          <h2>Play</h2>
          <button type="button" class="mb primary" id="btnModeCpu">
            <span class="mi"><svg class="ico"><use href="#ic-cpu"/></svg></span>
            <span class="ml">vs AI</span>
            <small id="diffNote">${st.diff.charAt(0).toUpperCase() + st.diff.slice(1)} diff</small>
          </button>
          <button type="button" class="mb mb-online" id="btnModeOnline">
            <span class="mi"><svg class="ico"><use href="#ic-globe"/></svg></span>
            <span class="ml" id="onlineBtnLabel">Multiplayer Online</span>
            <small id="onlineBtnTag">Quick match</small>
            <div class="online-queue-side" id="onlineQueueSide" style="display:none;">
              <span class="queue-timer-val" id="onlineQueueTimer">00:00</span>
              <span class="queue-cancel-x" id="btnCancelQueue" title="Cancel Queue" aria-label="Cancel queue">✕</span>
            </div>
          </button>
          <button type="button" class="mb" id="btnMode2p">
            <span class="mi"><svg class="ico"><use href="#ic-versus"/></svg></span>
            <span class="ml">PvP</span>
            <small>2 players, 1 keyboard</small>
          </button>
          <button type="button" class="mb quiet" id="btnPlayBack">
            <span class="mi"><svg class="ico"><use href="#ic-back"/></svg></span>
            <span class="ml">Back</span>
          </button>
        </nav>

        <div class="panel thanks" id="pQuit" hidden>
          <h2>Thanks for playing!</h2>
          <p>Until the next duel above the pond.</p>
          <button type="button" class="mb quiet" id="btnQuitBack">
            <span class="mi"><svg class="ico"><use href="#ic-back"/></svg></span>
            <span class="ml">Back</span>
          </button>
        </div>
      </div>

      <!-- FAR RIGHT: CHARACTER DISPLAY -->
      <aside class="showcase menu-right-col" aria-label="Your spider">
        <div class="showcase-card">
          <!-- PODIUM & SPIDER -->
          <div class="showcase-podium">
            <div class="showcase-glow" style="--spider-glow:${getColor(looks.p1.color).main};"></div>
            <div class="stage" id="showcaseStage" role="button" tabindex="0" title="Click to customize your spider">
              ${spiderSVG(looks.p1, '-showcase')}
            </div>
            <div class="showcase-reflection"></div>
            <button type="button" class="showcase-customize-hint" id="btnQuickCustomize" title="Customize Spider">
              <svg class="ico" width="13" height="13" viewBox="0 0 24 24"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
              <span>Customize</span>
            </button>
          </div>

          <!-- CHARACTER IDENTITY BADGE -->
          <div class="showcase-id-badge" id="badgeQuickCustomize" role="button" tabindex="0" title="Click to customize your spider" style="--badge-c:${getColor(looks.p1.color).main};">
            <div class="sib-header">
              <i class="sib-dot" style="background:${getColor(looks.p1.color).main}; box-shadow: 0 0 10px ${getColor(looks.p1.color).main};"></i>
              <span class="sib-name" id="showcaseName">${looks.p1.name}</span>
              <span class="sib-lvl-badge">LVL ${expInfo.level}</span>
            </div>
            <div class="sib-sub">
              <span class="sib-rank">${getPlayerRankTitle(expInfo.level)}</span>
              <span class="sib-color-label" style="color:${getColor(looks.p1.color).light};">${getColor(looks.p1.color).label}</span>
            </div>
          </div>

          <!-- LEVEL & ONLINE EXP PROGRESS CARD -->
          <div class="menu-level-card" role="button" tabindex="0" title="View Abilities Tree">
            <div class="mlc-top">
              <span class="mlc-badge">LEVEL ${expInfo.level}</span>
              <span class="mlc-exp">${expInfo.expIntoLevel} / ${expInfo.expForLevel} EXP</span>
            </div>
            <div class="mlc-track">
              <div class="mlc-fill" style="width:${Math.max(5, expInfo.progressPct)}%;"></div>
            </div>
            <div class="mlc-sub">
              <span class="mlc-prog-label">Skill Mastery</span>
              <span class="mlc-skills-count">${unlockedCount} / ${SKILLS_LIST.length} Unlocked &rsaquo;</span>
            </div>
          </div>
        </div>
      </aside>
    </main>
  `;
}

