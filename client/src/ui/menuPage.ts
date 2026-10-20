import { sound } from '../audio';
import {
  COLORS, PATTERNS, ACCS, DEF_LOOK, getColor, getLooks, saveLooks, randomLook, spiderSVG,
  getSettings, saveSettings, setMode, getKeys, saveKeys, defaultKeys, keyLabel, ACTIONS, RESERVED_KEYS,
  getProgress, saveProgress, getUnlockedIds, getExpProgress,
  getAbilityPoints, acquireSkill, respecWeb,
  type PlayerKeys
} from '../gb';
import {
  SKILLS_LIST,
  ABILITIES,
  WEB_EDGES,
  isNodeAvailableToUnlock,
  type AbilityId
} from '../game/abilities';

export interface MenuStartOptions {
  mode: 'online' | 'cpu' | '2p';
  diff: 'easy' | 'normal' | 'hard';
  onlineAction?: 'quick' | 'create' | 'join';
  roomCode?: string;
  playerName?: string;
  playerColor?: {
    main: string;
    light: string;
    dark: string;
  };
  playerPattern?: string;
  playerAcc?: string;
}

export function renderMenuPage(container: HTMLElement, rawOnStart: (opts: MenuStartOptions) => void) {
  let activeTab: 'main' | 'customize' | 'abilities' | 'settings' = 'main';
  let customizePlayer: 'p1' | 'p2' = 'p1';
  let listeningKey: { player: 'p1' | 'p2'; action: string } | null = null;
  let onlineModalOpen = false;
  let selectedNodeId: AbilityId = 'dash';
  let panX = -40;
  let panY = 0;
  let zoomScale = 1.0;
  let isPanelCollapsed = false;
  let abilitiesKeyHandler: ((e: KeyboardEvent) => void) | null = null;

  const onStart = (opts: MenuStartOptions) => {
    if (abilitiesKeyHandler) {
      window.removeEventListener('keydown', abilitiesKeyHandler);
      abilitiesKeyHandler = null;
    }
    rawOnStart(opts);
  };

  function getPlayerRankTitle(level: number): string {
    if (level <= 1) return 'Stick Novice';
    if (level <= 2) return 'Twig Brawler';
    if (level <= 4) return 'Silk Striker';
    if (level <= 6) return 'Venom Weaver';
    if (level <= 8) return 'Pond Duelist';
    if (level <= 10) return 'Canopy Master';
    return 'Twig Grandmaster';
  }

  // Arm ambient music on user interaction
  sound.music.arm('ambient');

  function render() {
    container.innerHTML = `
      <svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false">
        <defs>
          <symbol id="ic-dash" viewBox="0 0 24 24"><path d="M2 8.5h5M2 12h7.5M2 15.5h5"/><path d="M11.5 6l6 6-6 6M16.5 6l5.5 6-5.5 6"/></symbol>
          <symbol id="ic-surge" viewBox="0 0 24 24"><path d="M7 8.5l5-5 5 5M7 14l5-5 5 5"/><path d="M12 14.5V19"/><circle cx="12" cy="21" r="1.9" fill="currentColor"/></symbol>
          <symbol id="ic-web" viewBox="0 0 24 24"><path d="M12 3v18M19.8 7.5l-15.6 9M19.8 16.5l-15.6-9"/><path d="M12 7l4.3 2.5v5L12 17l-4.3-2.5v-5zM12 3l7.8 4.5v9L12 21l-7.8-4.5v-9z"/></symbol>
          <symbol id="ic-power" viewBox="0 0 24 24"><path d="M13.5 2L5 13.5h6L10 22l9-12h-6.2z"/></symbol>
          <symbol id="ic-shield" viewBox="0 0 24 24"><path d="M12 3l7 3v5.5c0 4.5-3 7.5-7 9.5-4-2-7-5-7-9.5V6z"/><path d="M9 12l2.2 2.2L15.5 9.5"/></symbol>
          <symbol id="ic-mend" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7.5v9M7.5 12h9"/></symbol>
          <symbol id="ic-pounce" viewBox="0 0 24 24"><path d="M3 19C5.5 9 11.5 5 20 7"/><path d="M15.5 3.5L20 7l-3.5 4.5"/><path d="M4 14h4"/></symbol>
          <symbol id="ic-spit" viewBox="0 0 24 24"><path d="M12 3C8.5 8.5 6 11.5 6 15a6 6 0 0012 0c0-3.5-2.5-6.5-6-12z"/><path d="M9.5 15a2.5 2.5 0 002.5 2.5"/></symbol>
          <symbol id="ic-tremor" viewBox="0 0 24 24"><path d="M2 12l3.5-3 3 6 3-9 3 9 3-6 3.5 3"/><path d="M3 20h18"/></symbol>
          <symbol id="ic-haste" viewBox="0 0 24 24"><circle cx="12" cy="13.5" r="7.5"/><path d="M12 13.5V9M9.5 2.5h5M18.5 6l1.5-1.5"/></symbol>
          <symbol id="ic-riposte" viewBox="0 0 24 24"><path d="M5 19L19 5M14 5h5v5"/><path d="M19 19L5 5M5 10V5h5"/></symbol>
          <symbol id="ic-leech" viewBox="0 0 24 24"><path d="M5 4c0 7 2.5 12 7 17 4.5-5 7-10 7-17-3.5 2.2-10.5 2.2-14 0z"/><path d="M12 9v5M9.5 11.5h5"/></symbol>
          <symbol id="ic-anchor" viewBox="0 0 24 24"><circle cx="12" cy="5" r="2"/><path d="M12 7v14M7.5 11h9M5 15c0 3 3 6 7 6s7-3 7-6"/></symbol>
          <symbol id="ic-carapace" viewBox="0 0 24 24"><path d="M3 17a9 9 0 0118 0z"/><path d="M12 8v9M7.5 10l1.5 7M16.5 10L15 17"/><path d="M3 20.5h18"/></symbol>
          <symbol id="ic-sweep" viewBox="0 0 24 24"><path d="M3 17c6 3.5 14 1.5 17-7"/><path d="M15.5 9.5l4.5.5-.5 4.5"/><path d="M4 12c4 1.5 8 .8 10-2"/></symbol>
          <symbol id="ic-hook" viewBox="0 0 24 24"><circle cx="12" cy="4.5" r="1.8"/><path d="M12 6.3V16a3.5 3.5 0 007 0v-1.5M16 12.5l3 2 3-2"/></symbol>
          <symbol id="ic-play" viewBox="0 0 24 24"><path d="M7 4.5v15l12-7.5z"/></symbol>
          <symbol id="ic-gem" viewBox="0 0 24 24"><path d="M12 2.5l8.5 5v9l-8.5 5-8.5-5v-9z"/><path d="M12 8l3.5 2v4L12 16l-3.5-2v-4z"/></symbol>
          <symbol id="ic-gear" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3.2"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M18.7 5.3l-2.1 2.1M7.4 16.6l-2.1 2.1"/></symbol>
          <symbol id="ic-quit" viewBox="0 0 24 24"><path d="M12 3v8"/><path d="M6.3 6.8a8 8 0 1011.4 0"/></symbol>
          <symbol id="ic-cpu" viewBox="0 0 24 24"><rect x="6" y="6" width="12" height="12" rx="2"/><rect x="9.5" y="9.5" width="5" height="5"/><path d="M9 2.5v3.5M15 2.5v3.5M9 18v3.5M15 18v3.5M2.5 9h3.5M2.5 15h3.5M18 9h3.5M18 15h3.5"/></symbol>
          <symbol id="ic-globe" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/></symbol>
          <symbol id="ic-versus" viewBox="0 0 24 24"><circle cx="8" cy="8" r="3"/><circle cx="16.5" cy="8" r="3"/><path d="M2.5 20c0-3.5 2.5-6 5.5-6s5.5 2.5 5.5 6M12.5 20c0-3.5 2-6 4.5-6s4.5 2.5 4.5 6"/></symbol>
          <symbol id="ic-back" viewBox="0 0 24 24"><path d="M10 5l-7 7 7 7M3 12h18"/></symbol>
          <symbol id="ic-palette" viewBox="0 0 24 24"><path d="M12 3a9 9 0 100 18c1.5 0 2-1 1.5-2-.6-1.2.2-2.5 1.6-2.5H17a4 4 0 004-4c0-5-4-9.5-9-9.5z"/><circle cx="7.5" cy="11.5" r="1.2"/><circle cx="10" cy="7.5" r="1.2"/><circle cx="15" cy="7.5" r="1.2"/></symbol>
          <symbol id="ic-lock" viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 018 0v3"/></symbol>
        </defs>
      </svg>

      <!-- SCENE BACKDROP: Twinkling Stars, Moon, Clouds, Twig, Ripples, Reeds, Fireflies -->
      <div class="scene" aria-hidden="true">
        <svg viewBox="0 0 1000 640" preserveAspectRatio="xMidYMax slice">
          <defs>
            <linearGradient id="sk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0d1a22"/><stop offset=".55" stop-color="#1e3a40"/><stop offset="1" stop-color="#3b6358"/></linearGradient>
            <radialGradient id="mg"><stop offset="0" stop-color="#e9efd8" stop-opacity=".55"/><stop offset="1" stop-color="#e9efd8" stop-opacity="0"/></radialGradient>
            <linearGradient id="pd" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2e8190" stop-opacity=".85"/><stop offset="1" stop-color="#0e3844"/></linearGradient>
          </defs>
          <rect width="1000" height="640" fill="url(#sk)"/>
          <g>
            <circle class="st" style="--d:2.3s;--o:0.69" cx="946" cy="238" r="1.8"/>
            <circle class="st" style="--d:2.5s;--o:0.70" cx="189" cy="262" r="1.8"/>
            <circle class="st" style="--d:3.1s;--o:0.83" cx="96" cy="228" r="1.3"/>
            <circle class="st" style="--d:0.7s;--o:0.67" cx="911" cy="324" r="0.8"/>
            <circle class="st" style="--d:3.0s;--o:0.59" cx="463" cy="315" r="1.0"/>
            <circle class="st" style="--d:3.1s;--o:0.85" cx="64" cy="30" r="0.8"/>
            <circle class="st" style="--d:1.0s;--o:0.50" cx="30" cy="237" r="1.3"/>
            <circle class="st" style="--d:2.2s;--o:0.86" cx="531" cy="119" r="1.3"/>
            <circle class="st" style="--d:2.5s;--o:0.75" cx="468" cy="142" r="1.8"/>
            <circle class="st" style="--d:5.0s;--o:0.95" cx="860" cy="42" r="1.3"/>
            <circle class="st" style="--d:1.6s;--o:0.49" cx="295" cy="15" r="0.8"/>
            <circle class="st" style="--d:2.8s;--o:0.41" cx="110" cy="148" r="1.8"/>
            <circle class="st" style="--d:0.3s;--o:0.36" cx="701" cy="0" r="1.0"/>
            <circle class="st" style="--d:1.0s;--o:0.90" cx="481" cy="192" r="1.8"/>
            <circle class="st" style="--d:2.1s;--o:0.69" cx="203" cy="138" r="1.3"/>
            <circle class="st" style="--d:0.4s;--o:0.55" cx="987" cy="209" r="0.8"/>
            <circle class="st" style="--d:0.7s;--o:0.77" cx="11" cy="30" r="1.8"/>
            <circle class="st" style="--d:4.0s;--o:0.46" cx="572" cy="96" r="1.8"/>
            <circle class="st" style="--d:2.5s;--o:0.94" cx="787" cy="67" r="1.8"/>
            <circle class="st" style="--d:3.2s;--o:0.42" cx="430" cy="108" r="0.8"/>
            <circle class="st" style="--d:1.3s;--o:0.93" cx="822" cy="303" r="1.3"/>
            <circle class="st" style="--d:5.0s;--o:0.36" cx="191" cy="201" r="0.8"/>
            <circle class="st" style="--d:0.2s;--o:0.44" cx="452" cy="132" r="0.8"/>
            <circle class="st" style="--d:3.9s;--o:0.55" cx="303" cy="197" r="0.8"/>
            <circle class="st" style="--d:0.4s;--o:0.48" cx="651" cy="124" r="0.8"/>
            <circle class="st" style="--d:3.0s;--o:0.57" cx="464" cy="65" r="1.8"/>
          </g>
          <circle cx="790" cy="120" r="190" fill="url(#mg)"/>
          <circle cx="790" cy="120" r="46" fill="#e9efd8"/>
          <g fill="rgba(120,130,110,.2)"><circle cx="776" cy="112" r="10"/><circle cx="804" cy="134" r="7"/><circle cx="790" cy="100" r="5"/></g>
          <g class="cloud" fill="rgba(160,190,190,.10)"><ellipse cx="250" cy="150" rx="150" ry="14"/><ellipse cx="330" cy="168" rx="110" ry="10"/></g>
          <g class="cloud c2" fill="rgba(160,190,190,.08)"><ellipse cx="620" cy="90" rx="130" ry="11"/><ellipse cx="560" cy="106" rx="90" ry="8"/></g>
          <!-- Distant bank -->
          <path fill="#17302f" d="M0 640 L0 461 L100 442 L200 436 L300 423 L400 379 L500 386 L600 416 L700 419 L800 449 L900 464 L1000 422 L1000 640 Z"/>
          <path fill="#10252a" d="M0 640 L0 480 L100 474 L200 446 L300 457 L400 487 L500 489 L600 503 L700 509 L800 473 L900 459 L1000 463 L1000 640 Z"/>
          <path d="M-10 36 Q200 52 420 30 T760 40 T1010 28" fill="none" stroke="#6b4e34" stroke-width="12" stroke-linecap="round"/>
          <path d="M-10 33 Q200 49 420 27 T760 37 T1010 25" fill="none" stroke="#a58059" stroke-width="2.5" stroke-linecap="round" opacity=".6"/>
          <rect x="0" y="540" width="1000" height="100" fill="url(#pd)"/>
          <g fill="none" stroke="rgba(190,235,240,.35)" stroke-width="1.2">
            <ellipse class="rp" style="--d:0s" cx="260" cy="585" rx="30" ry="5"/>
            <ellipse class="rp" style="--d:1.6s" cx="560" cy="605" rx="30" ry="5"/>
            <ellipse class="rp" style="--d:3.1s" cx="860" cy="592" rx="30" ry="5"/>
          </g>
          <g fill="rgba(52,104,64,.95)"><ellipse cx="180" cy="570" rx="30" ry="6"/><ellipse cx="480" cy="590" rx="26" ry="5"/><ellipse cx="740" cy="574" rx="30" ry="6"/></g>
          <path d="M0 540 Q125 535 250 540 T500 540 T750 540 T1000 540" fill="none" stroke="rgba(190,235,240,.45)" stroke-width="1.6"/>
        </svg>
        <div class="flies">
          <i class="fl" style="--x:83%;--y:73%;--d:4.8s;--t:6.6s"></i>
          <i class="fl" style="--x:75%;--y:73%;--d:2.1s;--t:10.9s"></i>
          <i class="fl" style="--x:49%;--y:37%;--d:4.2s;--t:9.8s"></i>
          <i class="fl" style="--x:46%;--y:62%;--d:6.0s;--t:11.0s"></i>
          <i class="fl" style="--x:12%;--y:60%;--d:0.6s;--t:6.2s"></i>
          <i class="fl" style="--x:27%;--y:68%;--d:1.0s;--t:9.1s"></i>
        </div>
      </div>

      <div class="menu-view-container">
        ${renderActiveTab()}
      </div>

      ${renderOnlineModal()}
    `;

    bindEvents();
  }

  function renderActiveTab(): string {
    switch (activeTab) {
      case 'customize':
        return renderCustomizeView();
      case 'abilities':
        return renderAbilitiesView();
      case 'settings':
        return renderSettingsView();
      default:
        return renderMainMenuView();
    }
  }

  /* ====================================================
     1. MAIN MENU VIEW (Matching menu.html)
     ==================================================== */
  function renderMainMenuView(): string {
    const looks = getLooks();
    const st = getSettings();
    const prog = getProgress();
    const expInfo = getExpProgress(prog.onlineExp);
    const unlockedCount = getUnlockedIds(prog).length;

    return `
      <!-- TOP CENTER TITLE WITH NO CONTAINER -->
      <header class="menu-title-header">
        <button type="button" class="menu-corner-sound-btn sound-toggle-btn ${sound.enabled ? 'sound-on' : 'sound-off'}" id="btnCornerSoundToggle" title="Toggle Sound (Mute/Unmute)">
          ${sound.enabled ? '🔊 Sound: ON' : '🔇 Sound: OFF'}
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
            <button type="button" class="mb" id="btnGoCustomize">
              <span class="mi"><svg class="ico"><use href="#ic-palette"/></svg></span>
              <span class="ml">Customize</span>
              <small>Your spider</small>
            </button>
            <button type="button" class="mb" id="btnGoAbilities">
              <span class="mi"><svg class="ico"><use href="#ic-gem"/></svg></span>
              <span class="ml">Abilities</span>
              <small id="abCount">Level ${expInfo.level} · ${unlockedCount} of ${SKILLS_LIST.length} unlocked</small>
            </button>
            <button type="button" class="mb" id="btnGoSettings">
              <span class="mi"><svg class="ico"><use href="#ic-gear"/></svg></span>
              <span class="ml">Settings</span>
              <small>Keys, sound, music</small>
            </button>
          </nav>

          <nav class="panel" id="pPlay" aria-label="Choose a mode" hidden>
            <h2>Play</h2>
            <button type="button" class="mb primary" id="btnModeCpu">
              <span class="mi"><svg class="ico"><use href="#ic-cpu"/></svg></span>
              <span class="ml">vs AI</span>
              <small id="diffNote">${st.diff.charAt(0).toUpperCase() + st.diff.slice(1)} diff</small>
            </button>
            <button type="button" class="mb" id="btnModeOnline">
              <span class="mi"><svg class="ico"><use href="#ic-globe"/></svg></span>
              <span class="ml">Multiplayer Online</span>
              <small>Quick match or Room</small>
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

          <div class="menu-sound-pod">
            <span class="engine-badge">PHASER 4 · COLYSEUS 0.18</span>
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
                <span class="mlc-skills-count">${unlockedCount} / ${SKILLS_LIST.length} Unlocked ›</span>
              </div>
            </div>
          </div>
        </aside>
      </main>
    `;
  }

  /* ====================================================
     2. CUSTOMIZE VIEW (Matching customize.html)
     ==================================================== */
  function renderCustomizeView(): string {
    const looks = getLooks();
    const lk = looks[customizePlayer];

    return `
      <div class="page" style="max-width:560px; margin-inline:auto;">
        <header class="page-top">
          <h1>Customize</h1>
          <div style="display:flex; gap:8px; align-items:center;">
            <button type="button" class="btn ghost sound-toggle-btn ${sound.enabled ? 'sound-on' : 'sound-off'}" id="btnCustomSoundToggle" title="Toggle Sound (Music & SFX)">${sound.enabled ? '🔊 Sound On' : '🔇 Sound Off'}</button>
            <button type="button" class="btn ghost" id="btnBackToMain">Menu</button>
          </div>
        </header>
        <p class="note">Design your spider, then go back to the menu to see it. Changes save automatically.</p>

        <section class="custom" aria-label="Customize your spider">
          <div class="tabs" role="group" aria-label="Which player">
            <button type="button" id="tabP1" aria-selected="${customizePlayer === 'p1'}">Player 1</button>
            <button type="button" id="tabP2" aria-selected="${customizePlayer === 'p2'}">Player 2 <small>PvP</small></button>
          </div>

          <div class="preview" id="preview" role="img" aria-label="Preview of your spider">
            ${spiderSVG(lk, '-cust')}
          </div>

          <div class="field">
            <label class="lbl" for="nm">Name</label>
            <input type="text" id="nm" value="${lk.name}" maxlength="10" autocomplete="off" spellcheck="false">
          </div>

          <div class="field">
            <span class="lbl">Color</span>
            <div class="swatches" id="sw">
              ${COLORS.map(col => `
                <button type="button" class="sw" data-col="${col.id}" style="--c:${col.main}" aria-label="${col.label}" aria-pressed="${lk.color === col.id}"></button>
              `).join('')}
            </div>
          </div>

          <div class="field">
            <span class="lbl">Pattern</span>
            <div class="opts" id="pat">
              ${PATTERNS.map(([id, label]) => `
                <button type="button" class="opt" data-pat="${id}" aria-pressed="${lk.pattern === id}">${label}</button>
              `).join('')}
            </div>
          </div>

          <div class="field">
            <span class="lbl">Accessory</span>
            <div class="opts" id="acc">
              ${ACCS.map(([id, label]) => `
                <button type="button" class="opt" data-acc="${id}" aria-pressed="${lk.acc === id}">${label}</button>
              `).join('')}
            </div>
          </div>

          <div class="crow">
            <button type="button" class="btn ghost" id="btnRandLook">Randomize</button>
            <button type="button" class="btn ghost" id="btnResetLook">Reset</button>
          </div>
        </section>
      </div>
    `;
  }

  /* ====================================================
     3. ABILITIES VIEW (Redesigned & Properly Aligned)
     ==================================================== */
  /* ====================================================
     3. ABILITIES SPIDER WEB VIEW
     ==================================================== */
  function renderDetailCardHtml(nodeId: AbilityId): string {
    const prog = getProgress();
    const pts = getAbilityPoints(prog);
    const unlockedIds = getUnlockedIds(prog);
    const sel = ABILITIES[nodeId] || ABILITIES.dash;
    const selUnlocked = unlockedIds.includes(sel.id);
    const selAvailable = isNodeAvailableToUnlock(sel.id, unlockedIds);

    let actionHtml = '';
    if (selUnlocked) {
      actionHtml = `
        <div class="ac-acquired-banner">
          <svg class="ico mini" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5" stroke="currentColor" stroke-width="2.5" fill="none"/></svg>
          <span>SKILL ACQUIRED &amp; EQUIPPED</span>
        </div>
      `;
    } else if (selAvailable) {
      if (pts.available > 0) {
        actionHtml = `
          <button type="button" class="btn-acquire-action" id="btnAcquireSkill" data-id="${sel.id}">
            <span>⚡ ACQUIRE FOR 1 POINT</span>
          </button>
        `;
      } else {
        actionHtml = `
          <div class="ac-locked-banner warning">
            <span>PATH REACHED • 0 POINTS AVAILABLE</span>
            <small>Level up in Online Matches to earn +1 Ability Point.</small>
          </div>
        `;
      }
    } else {
      actionHtml = `
        <div class="ac-locked-banner">
          <svg class="ico mini" viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="10" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M8 11V8a4 4 0 018 0v3" fill="none" stroke="currentColor" stroke-width="2"/></svg>
          <span>LOCKED — PATH NOT REACHED</span>
          <small>Unlock adjacent connecting skills in the spider web first.</small>
        </div>
      `;
    }

    return `
      <div class="ac-card-top-row">
        <span class="ac-sector-tag" style="color:${sel.sectorColor}; border-color:${sel.sectorColor}66; background:${sel.sectorColor}1a;">${sel.sectorName}</span>
        <button type="button" class="ac-close-btn" id="btnCloseDetailCard" title="Minimize details panel">✕</button>
      </div>

      <div class="ac-card-head">
        <div class="ac-gem-preview">
          <img src="/abilities/${sel.id}.png" alt="${sel.name}" class="ac-gem-img" />
        </div>
        <div>
          <h2 class="ac-name">${sel.name}</h2>
          <div class="ac-chips">
            <span class="ac-chip cd">⏱ ${sel.cd}s Cooldown</span>
            <span class="ac-chip stance ${sel.use}">${sel.use === 'hang' ? '⚓ Dangling only' : '🌿 Clinging'}</span>
          </div>
        </div>
      </div>

      <p class="ac-desc">${sel.desc}</p>

      <div class="ac-tip-box">
        <span class="ac-tip-label">💡 COMBAT TACTIC</span>
        ${sel.tip}
      </div>

      <div class="ac-action-area">
        ${actionHtml}
      </div>
    `;
  }

  function renderAbilitiesView(): string {
    const prog = getProgress();
    const expInfo = getExpProgress(prog.onlineExp);
    const pts = getAbilityPoints(prog);
    const unlockedIds = getUnlockedIds(prog);
    const rankTitle = getPlayerRankTitle(expInfo.level);

    // Edges SVG
    const edgesSVG = WEB_EDGES.map(([aId, bId]) => {
      const a = ABILITIES[aId];
      const b = ABILITIES[bId];
      if (!a || !b) return '';
      const aUnlocked = unlockedIds.includes(aId);
      const bUnlocked = unlockedIds.includes(bId);

      let edgeClass = 'silk-edge edge-locked';
      if (aUnlocked && bUnlocked) {
        edgeClass = 'silk-edge edge-active';
      } else if (
        (aUnlocked && isNodeAvailableToUnlock(bId, unlockedIds)) ||
        (bUnlocked && isNodeAvailableToUnlock(aId, unlockedIds))
      ) {
        edgeClass = 'silk-edge edge-available';
      }

      return `<line class="${edgeClass}" x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" />`;
    }).join('');

    // Nodes SVG
    const nodesSVG = SKILLS_LIST.map(s => {
      const isUnlockedNode = unlockedIds.includes(s.id);
      const isAvail = isNodeAvailableToUnlock(s.id, unlockedIds);
      const isSelected = selectedNodeId === s.id;
      const isCenter = s.id === 'dash';

      let fillCol = '#0d1817';
      let strokeCol = 'rgba(52, 80, 75, 0.6)';

      if (isUnlockedNode) {
        fillCol = '#112322';
        strokeCol = s.sectorColor;
      } else if (isAvail) {
        fillCol = '#231d14';
        strokeCol = '#f2a33a';
      }

      return `
        <g class="web-node ${isSelected ? 'selected' : ''}" data-id="${s.id}" transform="translate(${s.x}, ${s.y})" cursor="pointer" tabindex="0" role="button" aria-label="${s.name}">
          <!-- Completely stable, non-moving hit area -->
          <circle class="node-hit-area" cx="0" cy="0" r="34" fill="transparent" />

          <!-- Inner visual group with pointer-events: none that scales smoothly in place -->
          <g class="node-visual">
            <!-- Selection Halo -->
            <circle class="node-select-halo" cx="0" cy="0" r="32" fill="none" stroke="#f2a33a" stroke-width="2.2" stroke-dasharray="6 4" />

            <!-- Available Beacon Pulse -->
            ${!isUnlockedNode && isAvail ? `
              <circle class="node-avail-pulse" cx="0" cy="0" r="26" fill="none" stroke="#f2a33a" stroke-width="2" />
            ` : ''}

            <!-- Base Shape -->
            ${isCenter ? `
              <polygon class="node-gem-shape" points="0,-27 23.4,-13.5 23.4,13.5 0,27 -23.4,13.5 -23.4,-13.5" fill="#142624" stroke="#ffd694" stroke-width="3" />
            ` : `
              <polygon class="node-gem-shape" points="0,-26 22.5,-13 22.5,13 0,26 -22.5,13 -22.5,-13" fill="${fillCol}" stroke="${strokeCol}" stroke-width="${isUnlockedNode ? '2.8' : (isAvail ? '2.4' : '1.5')}" />
            `}

            <!-- Extracted Ability Card Art -->
            <image href="/abilities/${s.id}.png" x="-22" y="-24" width="44" height="48" preserveAspectRatio="xMidYMid meet" style="opacity:${isUnlockedNode ? 1 : (isAvail ? 0.95 : 0.4)}; filter:${isUnlockedNode ? `drop-shadow(0 0 6px ${strokeCol})` : (isAvail ? 'contrast(1.08) brightness(0.95)' : 'grayscale(1) brightness(0.4)')};" />

            <!-- Corner Badges -->
            ${!isUnlockedNode && !isAvail ? `
              <g transform="translate(10, 10)">
                <circle cx="0" cy="0" r="7.5" fill="#160e0d" stroke="#e8593f" stroke-width="1.2" />
                <use href="#ic-lock" x="-4.5" y="-4.5" width="9" height="9" fill="#ff9d8a" />
              </g>
            ` : ''}
            ${!isUnlockedNode && isAvail ? `
              <g transform="translate(11, -11)">
                <circle cx="0" cy="0" r="7.5" fill="#2a1e0b" stroke="#f2a33a" stroke-width="1.2" />
                <text x="0" y="3.5" text-anchor="middle" font-size="9.5" font-weight="900" fill="#ffd694">1</text>
              </g>
            ` : ''}
            ${isUnlockedNode && !isCenter ? `
              <g transform="translate(11, -11)">
                <circle cx="0" cy="0" r="7" fill="#0d2420" stroke="#4cc7b2" stroke-width="1.2" />
                <text x="0" y="3" text-anchor="middle" font-size="8.5" font-weight="900" fill="#4cc7b2">✓</text>
              </g>
            ` : ''}
          </g>

          <!-- Name Tag -->
          <text class="node-label ${isUnlockedNode ? 'unlocked' : (isAvail ? 'available' : 'locked')}" x="0" y="38" text-anchor="middle" font-family="'Cinzel', serif" font-weight="700" font-size="11" letter-spacing="0.8">${s.name.toUpperCase()}</text>
        </g>
      `;
    }).join('');

    return `
      <div class="spider-web-view">
        <!-- TOP HEADER: NAV & POINTS HUD -->
        <header class="swv-header">
          <button type="button" class="swv-back-btn" id="btnBackToMain">
            <svg class="ico" viewBox="0 0 24 24"><path d="M10 5l-7 7 7 7M3 12h18"/></svg>
            <span>Menu</span>
          </button>

          <div class="swv-title-block">
            <h1 class="swv-title"><span class="a">SPIDER WEB</span> <span class="j">OF ABILITIES</span></h1>
            <div class="swv-sectors-pill">
              <span class="sec-pill aerial">▲ Aerial Silk</span>
              <span class="sec-pill control">◀ Venom Control</span>
              <span class="sec-pill assault">▶ Mandible Assault</span>
              <span class="sec-pill vitality">▼ Carapace Bulwark</span>
            </div>
          </div>

          <div class="swv-right-hud">
            <div class="swv-points-badge ${pts.available > 0 ? 'has-points' : ''}" title="${pts.available} Ability Points ready to allocate">
              <span class="sp-icon">⚡</span>
              <div class="sp-info">
                <span class="sp-val">${pts.available}</span>
                <span class="sp-lbl">ABILITY ${pts.available === 1 ? 'POINT' : 'POINTS'}</span>
              </div>
            </div>
            <button type="button" class="btn-respec" id="btnRespecWeb" title="Refund all spent ability points and rebuild your web">
              ↻ Respec Web
            </button>
            <button type="button" class="btn ghost sound-toggle-btn ${sound.enabled ? 'sound-on' : 'sound-off'}" id="btnWebSoundToggle" title="Toggle Sound (Music & SFX)">
              ${sound.enabled ? '🔊 Sound On' : '🔇 Sound Off'}
            </button>
          </div>
        </header>

        <!-- STAGE: SVG CANVAS & FLOATING DETAIL CARD -->
        <div class="swv-stage" id="swvStage">
          <!-- Canvas Navigation Controls (Bottom Left) -->
          <div class="swv-nav-hud">
            <div class="swv-zoom-group">
              <button type="button" class="swv-hud-btn" id="btnZoomIn" title="Zoom In (+)">+</button>
              <button type="button" class="swv-hud-btn" id="btnZoomOut" title="Zoom Out (−)">−</button>
              <button type="button" class="swv-hud-btn" id="btnZoomFit" title="Fit Entire Web (0 / F)">⛶ Fit</button>
              <button type="button" class="swv-hud-btn" id="btnZoomCenter" title="Center Selected Node (C)">◎ Focus</button>
            </div>
            <div class="swv-hud-help">
              <span class="hud-help-icon">🕸</span>
              <span><strong>Drag</strong> to Pan · <strong>Scroll</strong> to Zoom · <strong>Arrows/WASD</strong> to Move · <strong>Space</strong> to Unlock</span>
            </div>
          </div>

          <!-- Unhide Tab when Panel is Collapsed -->
          <button type="button" class="swv-open-card-tab ${isPanelCollapsed ? 'visible' : ''}" id="btnOpenCardTab" title="Show Ability Details">
            <span>◀ Skill Details</span>
          </button>

          <svg class="swv-svg-canvas" id="swvSvgCanvas" viewBox="0 0 1100 800" preserveAspectRatio="xMidYMid meet">
            <defs>
              <filter id="glow-teal" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
              <radialGradient id="hub-glow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stop-color="#ffd694" stop-opacity="0.25"/>
                <stop offset="100%" stop-color="#ffd694" stop-opacity="0"/>
              </radialGradient>
            </defs>

            <!-- Interactive Viewport Transform Group -->
            <g id="webViewport" class="web-viewport" transform="translate(${panX}, ${panY}) scale(${zoomScale})">
              <!-- Atmospheric Spider Web Background Threads -->
              <g class="web-backdrop-threads" stroke="rgba(76, 199, 178, 0.08)" stroke-width="1" fill="none">
                <circle cx="500" cy="380" r="135" stroke-dasharray="3 4"/>
                <circle cx="500" cy="380" r="245" stroke-dasharray="4 5"/>
                <circle cx="500" cy="380" r="340" stroke-dasharray="4 6"/>
                <circle cx="500" cy="380" r="430" stroke-dasharray="5 7"/>

                <line x1="500" y1="380" x2="160" y2="40" stroke="rgba(76, 199, 178, 0.05)"/>
                <line x1="500" y1="380" x2="840" y2="40" stroke="rgba(76, 199, 178, 0.05)"/>
                <line x1="500" y1="380" x2="160" y2="720" stroke="rgba(76, 199, 178, 0.05)"/>
                <line x1="500" y1="380" x2="840" y2="720" stroke="rgba(76, 199, 178, 0.05)"/>
              </g>

              <!-- Center Glow behind Dash -->
              <circle cx="500" cy="380" r="105" fill="url(#hub-glow)" pointer-events="none"/>

              <!-- Silk Edges Layer -->
              <g class="web-edges-layer">
                ${edgesSVG}
              </g>

              <!-- Web Nodes Layer -->
              <g class="web-nodes-layer">
                ${nodesSVG}
              </g>
            </g>
          </svg>

          <!-- Floating Detail Card (Assassin's Creed Origins Style) -->
          <aside class="swv-detail-panel ${isPanelCollapsed ? 'collapsed' : ''}" id="swvDetailPanel" aria-label="Selected Ability Details">
            ${renderDetailCardHtml(selectedNodeId)}
          </aside>
        </div>

        <!-- BOTTOM BAR: LEVEL & EXP PROGRESS HUD -->
        <footer class="swv-bottom-bar">
          <div class="sbb-exp-group">
            <span class="sbb-lvl">LVL ${expInfo.level} • ${rankTitle}</span>
            <div class="sbb-track" title="${expInfo.expIntoLevel} / ${expInfo.expForLevel} EXP towards Level ${expInfo.level + 1}">
              <div class="sbb-fill" style="width:${expInfo.progressPct}%;"></div>
            </div>
            <span class="sbb-exp-val">${expInfo.expIntoLevel} / ${expInfo.expForLevel} EXP</span>
          </div>
          <span class="sbb-hint">
            🕸️ Level up in <strong>Online Matches</strong> (+60 Play · +100 Win · +20/Round) to earn Ability Points
          </span>
        </footer>
      </div>
    `;
  }

  /* ====================================================
     4. SETTINGS VIEW (Matching settings.html)
     ==================================================== */
  function renderSettingsView(): string {
    const st = getSettings();
    const kb = getKeys();
    const prog = getProgress();
    const expInfo = getExpProgress(prog.onlineExp);
    const unlockedCount = getUnlockedIds(prog).length;

    return `
      <div class="page" style="max-width:760px; margin-inline:auto;">
        <header class="page-top">
          <h1>Settings</h1>
          <div style="display:flex; gap:8px; align-items:center;">
            <button type="button" class="btn ghost sound-toggle-btn ${sound.enabled ? 'sound-on' : 'sound-off'}" id="btnSettingsSoundToggle" title="Toggle Sound (Music & SFX)">${sound.enabled ? '🔊 Sound On' : '🔇 Sound Off'}</button>
            <button type="button" class="btn ghost" id="btnBackToMain">Menu</button>
          </div>
        </header>
        <p class="note">Changes save automatically.</p>

        <!-- SOUND & MUSIC -->
        <section class="sec" aria-label="Sound and music">
          <h2>Sound &amp; music</h2>
          <div class="row master-sound-row" style="background:var(--surface-2); padding:10px 14px; border-radius:6px; border:1px solid var(--line); margin-bottom:12px; display:flex; align-items:center; justify-content:space-between;">
            <label class="t" style="font-weight:700; font-size:15px; cursor:pointer; display:flex; align-items:center; gap:10px;">
              <input type="checkbox" id="chkMasterSound" ${sound.enabled ? 'checked' : ''} style="width:18px;height:18px;accent-color:var(--jade);">
              <span>Master Sound (${sound.enabled ? 'ON' : 'OFF'})</span>
            </label>
            <div style="display:flex; align-items:center; gap:12px;">
              <span class="pct" style="color:${sound.enabled ? 'var(--jade-light)' : 'var(--muted)'}; font-weight:700;">${sound.enabled ? '🔊 Active' : '🔇 Muted'}</span>
              <button type="button" class="btn ghost sound-toggle-btn ${sound.enabled ? 'sound-on' : 'sound-off'}" id="btnQuickSoundToggle">
                ${sound.enabled ? 'Mute All' : 'Unmute All'}
              </button>
            </div>
          </div>
          <div class="row">
            <label class="t"><input type="checkbox" id="chkSfx" ${st.sfx ? 'checked' : ''}> Sound effects</label>
            <span class="pct" id="sfxP">${Math.round(st.sfxVol * 100)}%</span>
            <div class="slider"><input type="range" id="rngSfx" min="0" max="100" step="5" value="${Math.round(st.sfxVol * 100)}" aria-label="Sound effects volume"></div>
          </div>
          <div class="row">
            <label class="t"><input type="checkbox" id="chkMus" ${st.music ? 'checked' : ''}> Music</label>
            <span class="pct" id="musP">${Math.round(st.musicVol * 100)}%</span>
            <div class="slider"><input type="range" id="rngMus" min="0" max="100" step="5" value="${Math.round(st.musicVol * 100)}" aria-label="Music volume"></div>
          </div>
        </section>

        <!-- CPU SKILL -->
        <section class="sec" aria-label="CPU skill">
          <h2>CPU skill</h2>
          <div class="seg" role="radiogroup" aria-label="CPU skill">
            <label><input type="radio" name="diff" value="easy" ${st.diff === 'easy' ? 'checked' : ''}><span>Easy</span></label>
            <label><input type="radio" name="diff" value="normal" ${st.diff === 'normal' ? 'checked' : ''}><span>Normal</span></label>
            <label><input type="radio" name="diff" value="hard" ${st.diff === 'hard' ? 'checked' : ''}><span>Hard</span></label>
          </div>
        </section>

        <!-- KEY BINDS -->
        <section class="sec" aria-label="Key binds">
          <h2>Key binds</h2>
          <p class="note">Click a key, then press the new one. Esc cancels. If the key is already used, the two actions swap keys. Esc, P, H and Tab are reserved for the game.</p>
          <div class="keys" id="keysBox">
            <div class="kcol p1">
              <h3><i class="swatch" style="background:var(--amber);"></i> Player 1</h3>
              ${ACTIONS.map(([k, label]) => `
                <div class="kr">
                  <span>${label}</span>
                  <button type="button" class="kb ${listeningKey?.player === 'p1' && listeningKey?.action === k ? 'on' : ''}" data-p="p1" data-a="${k}">${listeningKey?.player === 'p1' && listeningKey?.action === k ? '...' : keyLabel(kb.p1[k])}</button>
                </div>
              `).join('')}
            </div>

            <div class="kcol p2">
              <h3><i class="swatch" style="background:var(--jade);"></i> Player 2</h3>
              ${ACTIONS.map(([k, label]) => `
                <div class="kr">
                  <span>${label}</span>
                  <button type="button" class="kb ${listeningKey?.player === 'p2' && listeningKey?.action === k ? 'on' : ''}" data-p="p2" data-a="${k}">${listeningKey?.player === 'p2' && listeningKey?.action === k ? '...' : keyLabel(kb.p2[k])}</button>
                </div>
              `).join('')}
            </div>
          </div>
          <div class="msg" id="kmsg" aria-live="polite">${listeningKey ? 'Press any key for ' + listeningKey.action + ' (Esc cancels)' : ''}</div>
          <div class="btns"><button type="button" class="btn ghost" id="btnResetKeys">Reset keys</button></div>
        </section>

        <!-- PROGRESS -->
        <section class="sec" aria-label="Progress">
          <h2>Progress & Levels</h2>
          <div class="settings-prog-grid" style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-block:12px; background:var(--surface-2); padding:14px; border-radius:8px; border:1px solid var(--line);">
            <div>
              <div style="font-family:var(--label); font-size:12px; color:var(--muted); text-transform:uppercase;">Player Level</div>
              <div style="font-family:var(--display); font-size:22px; color:var(--amber-light);">Level ${expInfo.level}</div>
              <div style="font-size:12px; color:var(--fg);">${expInfo.totalExp} Total EXP</div>
            </div>
            <div>
              <div style="font-family:var(--label); font-size:12px; color:var(--muted); text-transform:uppercase;">Online Matches</div>
              <div style="font-family:var(--display); font-size:22px; color:var(--jade-light);">${prog.onlineWins}W / ${prog.onlinePlayed}P</div>
              <div style="font-size:12px; color:var(--muted);">${unlockedCount} of ${SKILLS_LIST.length} Skills · Offline: ${prog.wins}W / ${prog.played}P</div>
            </div>
          </div>
          <p class="note" style="margin-bottom:12px;">EXP is earned only from Online matches. Each level unlocks new battle abilities.</p>
          <label class="row" style="grid-template-columns:auto 1fr; gap:8px;">
            <input type="checkbox" id="chkUnlockAll" ${prog.unlockAll ? 'checked' : ''} style="width:20px;height:20px;accent-color:var(--amber)">
            <span>Unlock every ability (testing mode)</span>
          </label>
          <div class="btns"><button type="button" class="btn ghost" id="btnResetProg">Reset progress</button></div>
        </section>
      </div>
    `;
  }

  /* ====================================================
     5. ONLINE MULTIPLAYER MODAL
     ==================================================== */
  function renderOnlineModal(): string {
    if (!onlineModalOpen) return '';
    return `
      <div class="pick" style="z-index:90; padding:20px;" role="dialog" aria-modal="true">
        <div class="pick-in" style="max-width:440px; margin:auto; background:var(--surface); border:2px solid var(--line); border-radius:12px; padding:24px; gap:16px;">
          <h2 style="font-family:var(--display); font-size:28px;">Multiplayer Online</h2>
          <p class="note">Enter a room code to join friends, or click Quick Match to auto-match on Colyseus server.</p>

          <div style="display:grid; gap:10px;">
            <button type="button" class="btn primary" id="btnOnlineQuick">Quick Match</button>
            <button type="button" class="btn" id="btnOnlineCreate">Create Custom Room</button>
          </div>

          <div style="display:flex; gap:8px; align-items:center;">
            <input type="text" id="txtJoinCode" placeholder="Room Code (4 chars)" maxlength="8" style="flex:1; padding:10px; font-family:var(--label); font-size:18px; text-transform:uppercase; background:var(--surface-2); border:1px solid var(--line); border-radius:4px; color:var(--fg);">
            <button type="button" class="btn" id="btnOnlineJoin">Join</button>
          </div>

          <button type="button" class="btn ghost" id="btnOnlineClose" style="margin-top:8px;">Close</button>
        </div>
      </div>
    `;
  }

  /* ====================================================
     EVENT BINDINGS
     ==================================================== */
  function bindEvents() {
    if (abilitiesKeyHandler) {
      window.removeEventListener('keydown', abilitiesKeyHandler);
      abilitiesKeyHandler = null;
    }

    // Top menu back buttons
    container.querySelectorAll('#btnBackToMain').forEach(btn => {
      btn.addEventListener('click', () => {
        sound.playTone(440, 0.08, 'triangle', 0.04, -100);
        activeTab = 'main';
        render();
      });
    });

    // Universal sound toggle buttons
    const handleSoundToggle = () => {
      const isNowOn = sound.toggle();
      if (isNowOn) {
        sound.playTone(580, 0.08, 'triangle', 0.04, 150);
      }
      render();
    };

    container.querySelectorAll('#btnMenuSoundToggle, #btnCornerSoundToggle, #btnCustomSoundToggle, #btnSettingsSoundToggle, #btnWebSoundToggle, #btnQuickSoundToggle').forEach(btn => {
      btn.addEventListener('click', handleSoundToggle);
    });

    const chkMasterSound = container.querySelector('#chkMasterSound') as HTMLInputElement | null;
    chkMasterSound?.addEventListener('change', () => {
      sound.enabled = chkMasterSound.checked;
      if (sound.enabled) {
        sound.playTone(580, 0.08, 'triangle', 0.04, 150);
      }
      render();
    });

    if (activeTab === 'main') {
      const pMain = container.querySelector('#pMain') as HTMLElement;
      const pPlay = container.querySelector('#pPlay') as HTMLElement;
      const pQuit = container.querySelector('#pQuit') as HTMLElement;

      container.querySelector('#btnGoPlay')?.addEventListener('click', () => {
        sound.playTone(520, 0.08, 'triangle', 0.05, 200);
        pMain.hidden = true;
        pPlay.hidden = false;
        pQuit.hidden = true;
      });

      container.querySelector('#btnGoCustomize')?.addEventListener('click', () => {
        sound.playTone(520, 0.08, 'triangle', 0.05, 200);
        activeTab = 'customize';
        render();
      });

      container.querySelector('#btnGoAbilities')?.addEventListener('click', () => {
        sound.playTone(520, 0.08, 'triangle', 0.05, 200);
        activeTab = 'abilities';
        render();
      });

      container.querySelector('#btnGoSettings')?.addEventListener('click', () => {
        sound.playTone(520, 0.08, 'triangle', 0.05, 200);
        activeTab = 'settings';
        render();
      });

      container.querySelector('#btnGoQuit')?.addEventListener('click', () => {
        sound.playTone(380, 0.08, 'triangle', 0.04, -120);
        pMain.hidden = true;
        pPlay.hidden = true;
        pQuit.hidden = false;
      });

      container.querySelector('#btnPlayBack')?.addEventListener('click', () => {
        sound.playTone(440, 0.08, 'triangle', 0.04, -100);
        pMain.hidden = false;
        pPlay.hidden = true;
      });

      container.querySelector('#btnQuitBack')?.addEventListener('click', () => {
        sound.playTone(440, 0.08, 'triangle', 0.04, -100);
        pMain.hidden = false;
        pQuit.hidden = true;
      });

      // Quick customize from character display
      const openCustomize = () => {
        sound.playTone(520, 0.08, 'triangle', 0.05, 200);
        activeTab = 'customize';
        render();
      };
      container.querySelector('#showcaseStage')?.addEventListener('click', openCustomize);
      container.querySelector('#btnQuickCustomize')?.addEventListener('click', openCustomize);
      container.querySelector('#badgeQuickCustomize')?.addEventListener('click', openCustomize);

      // Level card opens abilities
      container.querySelector('.menu-level-card')?.addEventListener('click', () => {
        sound.playTone(520, 0.08, 'triangle', 0.05, 200);
        activeTab = 'abilities';
        render();
      });

      // Play Modes
      container.querySelector('#btnModeCpu')?.addEventListener('click', () => {
        const st = getSettings();
        const lks = getLooks();
        const col = getColor(lks.p1.color);
        setMode('cpu');
        sound.playTone(580, 0.12, 'square', 0.05, 260);
        onStart({
          mode: 'cpu',
          diff: st.diff,
          playerName: lks.p1.name,
          playerColor: { main: col.main, light: col.light, dark: col.dark },
          playerPattern: lks.p1.pattern,
          playerAcc: lks.p1.acc
        });
      });

      container.querySelector('#btnMode2p')?.addEventListener('click', () => {
        const st = getSettings();
        const lks = getLooks();
        const col = getColor(lks.p1.color);
        setMode('2p');
        sound.playTone(580, 0.12, 'square', 0.05, 260);
        onStart({
          mode: '2p',
          diff: st.diff,
          playerName: lks.p1.name,
          playerColor: { main: col.main, light: col.light, dark: col.dark },
          playerPattern: lks.p1.pattern,
          playerAcc: lks.p1.acc
        });
      });

      container.querySelector('#btnModeOnline')?.addEventListener('click', () => {
        sound.playTone(600, 0.1, 'triangle', 0.05, 200);
        onlineModalOpen = true;
        render();
      });
    }

    if (activeTab === 'customize') {
      const looks = getLooks();
      const lk = looks[customizePlayer];

      // Tab toggle P1 / P2
      container.querySelector('#tabP1')?.addEventListener('click', () => {
        customizePlayer = 'p1';
        render();
      });
      container.querySelector('#tabP2')?.addEventListener('click', () => {
        customizePlayer = 'p2';
        render();
      });

      // Name input
      const nmInput = container.querySelector('#nm') as HTMLInputElement;
      if (nmInput) {
        nmInput.addEventListener('input', () => {
          lk.name = nmInput.value.replace(/[<>&"]/g, '').trim().slice(0, 10) || getColor(lk.color).label;
          looks[customizePlayer] = lk;
          saveLooks(looks);
        });
      }

      // Swatches
      container.querySelectorAll('.sw[data-col]').forEach(btn => {
        btn.addEventListener('click', () => {
          const colId = (btn as HTMLElement).dataset.col!;
          lk.color = colId;
          looks[customizePlayer] = lk;
          saveLooks(looks);
          sound.playTone(620, 0.06, 'triangle', 0.04, 180);
          render();
        });
      });

      // Patterns
      container.querySelectorAll('.opt[data-pat]').forEach(btn => {
        btn.addEventListener('click', () => {
          const patId = (btn as HTMLElement).dataset.pat!;
          lk.pattern = patId;
          looks[customizePlayer] = lk;
          saveLooks(looks);
          sound.playTone(620, 0.06, 'triangle', 0.04, 180);
          render();
        });
      });

      // Accessories
      container.querySelectorAll('.opt[data-acc]').forEach(btn => {
        btn.addEventListener('click', () => {
          const accId = (btn as HTMLElement).dataset.acc!;
          lk.acc = accId;
          looks[customizePlayer] = lk;
          saveLooks(looks);
          sound.playTone(620, 0.06, 'triangle', 0.04, 180);
          render();
        });
      });

      // Randomize
      container.querySelector('#btnRandLook')?.addEventListener('click', () => {
        const rand = randomLook();
        looks[customizePlayer] = rand;
        saveLooks(looks);
        sound.playTone(680, 0.12, 'square', 0.04, 280);
        render();
      });

      // Reset
      container.querySelector('#btnResetLook')?.addEventListener('click', () => {
        looks[customizePlayer] = { ...DEF_LOOK[customizePlayer] };
        saveLooks(looks);
        sound.playTone(400, 0.1, 'triangle', 0.04, -100);
        render();
      });
    }

    if (activeTab === 'settings') {
      const st = getSettings();

      // SFX checkbox & volume
      const chkSfx = container.querySelector('#chkSfx') as HTMLInputElement;
      const rngSfx = container.querySelector('#rngSfx') as HTMLInputElement;
      const sfxP = container.querySelector('#sfxP') as HTMLElement;

      chkSfx?.addEventListener('change', () => {
        st.sfx = chkSfx.checked;
        if (st.sfx) st.sound = true;
        else if (!st.music) st.sound = false;
        saveSettings(st);
        if (st.sfx && st.sound) {
          sound.playTone(600, 0.08, 'triangle', 0.04, 150);
        }
        render();
      });

      rngSfx?.addEventListener('input', () => {
        st.sfxVol = parseInt(rngSfx.value, 10) / 100;
        if (sfxP) sfxP.textContent = `${rngSfx.value}%`;
        if (st.sfxVol > 0 && (!st.sound || !st.sfx)) {
          st.sound = true;
          st.sfx = true;
        }
        saveSettings(st);
      });

      // Music checkbox & volume
      const chkMus = container.querySelector('#chkMus') as HTMLInputElement;
      const rngMus = container.querySelector('#rngMus') as HTMLInputElement;
      const musP = container.querySelector('#musP') as HTMLElement;

      chkMus?.addEventListener('change', () => {
        st.music = chkMus.checked;
        if (st.music) st.sound = true;
        else if (!st.sfx) st.sound = false;
        saveSettings(st);
        if (st.music && st.sound) {
          sound.music.play('ambient');
        } else {
          sound.music.stop();
        }
        render();
      });

      rngMus?.addEventListener('input', () => {
        st.musicVol = parseInt(rngMus.value, 10) / 100;
        if (musP) musP.textContent = `${rngMus.value}%`;
        if (st.musicVol > 0 && (!st.sound || !st.music)) {
          st.sound = true;
          st.music = true;
        }
        saveSettings(st);
        sound.music.setVolume(st.musicVol);
        if (st.music && st.sound && st.musicVol > 0) {
          sound.music.play('ambient');
        }
      });

      // CPU difficulty radio
      container.querySelectorAll('input[name="diff"]').forEach(radio => {
        radio.addEventListener('change', () => {
          const val = (radio as HTMLInputElement).value as 'easy' | 'normal' | 'hard';
          st.diff = val;
          saveSettings(st);
          sound.playTone(520, 0.08, 'triangle', 0.04, 160);
        });
      });

      // Key bind buttons
      container.querySelectorAll('.kb[data-p][data-a]').forEach(btn => {
        btn.addEventListener('click', () => {
          const p = (btn as HTMLElement).dataset.p as 'p1' | 'p2';
          const a = (btn as HTMLElement).dataset.a as string;
          listeningKey = { player: p, action: a };
          sound.playTone(700, 0.06, 'sine', 0.03);
          render();
        });
      });

      // Reset keys
      container.querySelector('#btnResetKeys')?.addEventListener('click', () => {
        saveKeys(defaultKeys());
        sound.playTone(400, 0.1, 'triangle', 0.04, -100);
        render();
      });

      // Progress unlock all & reset
      const chkUnlockAll = container.querySelector('#chkUnlockAll') as HTMLInputElement;
      chkUnlockAll?.addEventListener('change', () => {
        const p = getProgress();
        p.unlockAll = chkUnlockAll.checked;
        saveProgress(p);
        sound.playTone(640, 0.1, 'square', 0.04, 200);
      });

      container.querySelector('#btnResetProg')?.addEventListener('click', () => {
        if (confirm('Reset your match stats, online EXP, and unlock progress?')) {
          saveProgress({ played: 0, wins: 0, unlockAll: false, onlineExp: 0, onlinePlayed: 0, onlineWins: 0, unlockedSkills: ['dash', 'web', 'surge'] });
          sound.playTone(320, 0.15, 'sawtooth', 0.05, -120);
          render();
        }
      });
    }

    if (activeTab === 'abilities') {
      const stage = container.querySelector<HTMLElement>('#swvStage');
      const detailPanel = container.querySelector<HTMLElement>('#swvDetailPanel');
      const openCardTab = container.querySelector<HTMLElement>('#btnOpenCardTab');

      const setPanelCollapsed = (collapsed: boolean) => {
        isPanelCollapsed = collapsed;
        if (detailPanel) {
          detailPanel.classList.toggle('collapsed', isPanelCollapsed);
        }
        if (openCardTab) {
          openCardTab.classList.toggle('visible', isPanelCollapsed);
        }
      };

      const applyViewport = (anim = false) => {
        const vp = container.querySelector<SVGGElement>('#webViewport');
        if (!vp) return;
        if (anim) {
          vp.classList.add('animating');
          setTimeout(() => vp.classList.remove('animating'), 360);
        } else {
          vp.classList.remove('animating');
        }
        vp.setAttribute('transform', `translate(${panX.toFixed(1)}, ${panY.toFixed(1)}) scale(${zoomScale.toFixed(3)})`);
      };

      const centerOnNode = (id: AbilityId) => {
        const sel = ABILITIES[id] || ABILITIES.dash;
        const targetCenterX = isPanelCollapsed ? 550 : 440;
        const targetCenterY = 400;
        panX = targetCenterX - sel.x * zoomScale;
        panY = targetCenterY - sel.y * zoomScale;
        panX = Math.max(-650, Math.min(550, panX));
        panY = Math.max(-550, Math.min(550, panY));
        applyViewport(true);
      };

      const fitWeb = () => {
        panX = isPanelCollapsed ? 0 : -40;
        panY = 0;
        zoomScale = 1.0;
        applyViewport(true);
      };

      const bindDetailCardActions = () => {
        const btnAcquire = container.querySelector('#btnAcquireSkill') as HTMLButtonElement | null;
        if (btnAcquire) {
          btnAcquire.onclick = () => {
            const targetId = (btnAcquire.dataset.id as AbilityId) || selectedNodeId;
            const res = acquireSkill(targetId);
            if (res.success) {
              selectedNodeId = targetId;
              sound.playTone(520, 0.1, 'triangle', 0.05, 200);
              setTimeout(() => sound.playTone(780, 0.18, 'triangle', 0.05, 100), 100);
              render();
            } else {
              sound.playTone(280, 0.15, 'sawtooth', 0.05, -80);
            }
          };
        }

        const btnClose = container.querySelector<HTMLButtonElement>('#btnCloseDetailCard');
        if (btnClose) {
          btnClose.onclick = () => {
            sound.playTone(400, 0.06, 'triangle', 0.03, -100);
            setPanelCollapsed(true);
          };
        }
      };

      bindDetailCardActions();

      openCardTab?.addEventListener('click', () => {
        sound.playTone(540, 0.06, 'triangle', 0.03, 100);
        setPanelCollapsed(false);
      });

      const selectNode = (id: AbilityId, panTo = false) => {
        if (!id || !ABILITIES[id]) return;
        selectedNodeId = id;

        container.querySelectorAll<SVGElement>('.web-node').forEach(node => {
          node.classList.toggle('selected', node.dataset.id === id);
        });

        if (detailPanel) {
          detailPanel.innerHTML = renderDetailCardHtml(id);
          bindDetailCardActions();
        }

        sound.playTone(580, 0.05, 'triangle', 0.04, 120);

        if (panTo) {
          centerOnNode(id);
        }
      };

      // Drag to pan variables
      let isDragging = false;
      let startX = 0;
      let startY = 0;
      let initialPanX = 0;
      let initialPanY = 0;
      let dragDist = 0;

      if (stage) {
        stage.addEventListener('pointerdown', (e: PointerEvent) => {
          if (e.button !== 0) return;
          const target = e.target as HTMLElement | SVGElement;
          if (target.closest('.swv-nav-hud, .swv-detail-panel, .swv-header, .swv-bottom-bar, .swv-open-card-tab')) {
            return;
          }

          isDragging = true;
          dragDist = 0;
          startX = e.clientX;
          startY = e.clientY;
          initialPanX = panX;
          initialPanY = panY;
          stage.classList.add('dragging');
          stage.setPointerCapture(e.pointerId);
        });

        stage.addEventListener('pointermove', (e: PointerEvent) => {
          if (!isDragging) return;
          const dx = e.clientX - startX;
          const dy = e.clientY - startY;
          dragDist = Math.hypot(dx, dy);

          const rect = stage.getBoundingClientRect();
          const ratio = 1100 / (rect.width || 1100);

          panX = initialPanX + dx * ratio;
          panY = initialPanY + dy * ratio;
          panX = Math.max(-650, Math.min(550, panX));
          panY = Math.max(-550, Math.min(550, panY));
          applyViewport(false);
        });

        const onPointerUp = (e: PointerEvent) => {
          if (!isDragging) return;
          isDragging = false;
          stage.classList.remove('dragging');
          try {
            stage.releasePointerCapture(e.pointerId);
          } catch {}
        };

        stage.addEventListener('pointerup', onPointerUp);
        stage.addEventListener('pointercancel', onPointerUp);

        // Wheel Zoom (anchored to cursor)
        stage.addEventListener('wheel', (e: WheelEvent) => {
          e.preventDefault();
          const rect = stage.getBoundingClientRect();
          const mouseX = e.clientX - rect.left;
          const mouseY = e.clientY - rect.top;

          const svgX = (mouseX / (rect.width || 1100)) * 1100;
          const svgY = (mouseY / (rect.height || 800)) * 800;

          const zoomFactor = e.deltaY < 0 ? 1.15 : 0.87;
          const oldZoom = zoomScale;
          const newZoom = Math.max(0.55, Math.min(2.5, oldZoom * zoomFactor));

          panX = svgX - (svgX - panX) * (newZoom / oldZoom);
          panY = svgY - (svgY - panY) * (newZoom / oldZoom);
          zoomScale = newZoom;

          panX = Math.max(-650, Math.min(550, panX));
          panY = Math.max(-550, Math.min(550, panY));
          applyViewport(false);
        }, { passive: false });
      }

      // HUD Zoom Buttons
      container.querySelector('#btnZoomIn')?.addEventListener('click', () => {
        zoomScale = Math.min(2.5, zoomScale * 1.25);
        applyViewport(true);
        sound.playTone(600, 0.05, 'triangle', 0.03, 100);
      });

      container.querySelector('#btnZoomOut')?.addEventListener('click', () => {
        zoomScale = Math.max(0.55, zoomScale * 0.8);
        applyViewport(true);
        sound.playTone(450, 0.05, 'triangle', 0.03, -100);
      });

      container.querySelector('#btnZoomFit')?.addEventListener('click', () => {
        fitWeb();
        sound.playTone(550, 0.06, 'triangle', 0.03);
      });

      container.querySelector('#btnZoomCenter')?.addEventListener('click', () => {
        centerOnNode(selectedNodeId);
        sound.playTone(620, 0.06, 'triangle', 0.04, 150);
      });

      // Node interaction
      container.querySelectorAll<SVGElement>('.web-node[data-id]').forEach(node => {
        const id = node.dataset.id as AbilityId;
        if (!id || !ABILITIES[id]) return;

        // Hover: preview skill in details panel without losing selection halo
        node.addEventListener('mouseenter', () => {
          if (detailPanel) {
            detailPanel.innerHTML = renderDetailCardHtml(id);
            bindDetailCardActions();
          }
        });

        // Click: select node if not dragged
        node.addEventListener('click', () => {
          if (dragDist > 6) return;
          selectNode(id, false);
        });
      });

      // Directional traversal
      const getNextNodeInDirection = (currentId: AbilityId, dir: 'up' | 'down' | 'left' | 'right'): AbilityId | null => {
        const current = ABILITIES[currentId];
        if (!current) return null;

        let bestId: AbilityId | null = null;
        let bestScore = Infinity;

        for (const candidate of SKILLS_LIST) {
          if (candidate.id === currentId) continue;
          const dx = candidate.x - current.x;
          const dy = candidate.y - current.y;
          const dist = Math.hypot(dx, dy);

          const isDirectEdge = WEB_EDGES.some(
            ([a, b]) => (a === currentId && b === candidate.id) || (b === currentId && a === candidate.id)
          );
          const edgeMultiplier = isDirectEdge ? 0.6 : 1.0;

          let isValidDirection = false;
          let score = dist * edgeMultiplier;

          if (dir === 'up') {
            if (dy < -15 && Math.abs(dx) <= Math.abs(dy) * 1.8) {
              isValidDirection = true;
              score += Math.abs(dx) * 0.5;
            }
          } else if (dir === 'down') {
            if (dy > 15 && Math.abs(dx) <= Math.abs(dy) * 1.8) {
              isValidDirection = true;
              score += Math.abs(dx) * 0.5;
            }
          } else if (dir === 'left') {
            if (dx < -15 && Math.abs(dy) <= Math.abs(dx) * 1.8) {
              isValidDirection = true;
              score += Math.abs(dy) * 0.5;
            }
          } else if (dir === 'right') {
            if (dx > 15 && Math.abs(dy) <= Math.abs(dx) * 1.8) {
              isValidDirection = true;
              score += Math.abs(dy) * 0.5;
            }
          }

          if (isValidDirection && score < bestScore) {
            bestScore = score;
            bestId = candidate.id;
          }
        }

        // Secondary fallback if cone was too strict
        if (!bestId) {
          for (const candidate of SKILLS_LIST) {
            if (candidate.id === currentId) continue;
            const dx = candidate.x - current.x;
            const dy = candidate.y - current.y;
            const dist = Math.hypot(dx, dy);

            let isValid = false;
            if (dir === 'up' && dy < -10) isValid = true;
            if (dir === 'down' && dy > 10) isValid = true;
            if (dir === 'left' && dx < -10) isValid = true;
            if (dir === 'right' && dx > 10) isValid = true;

            if (isValid && dist < bestScore) {
              bestScore = dist;
              bestId = candidate.id;
            }
          }
        }

        return bestId;
      };

      // Keyboard navigation
      abilitiesKeyHandler = (e: KeyboardEvent) => {
        const targetTag = (e.target as HTMLElement)?.tagName?.toLowerCase();
        if (targetTag === 'input' || targetTag === 'textarea') return;

        const k = e.key;
        if (k === 'ArrowUp' || k === 'w' || k === 'W') {
          e.preventDefault();
          const next = getNextNodeInDirection(selectedNodeId, 'up');
          if (next) selectNode(next, false);
        } else if (k === 'ArrowDown' || k === 's' || k === 'S') {
          e.preventDefault();
          const next = getNextNodeInDirection(selectedNodeId, 'down');
          if (next) selectNode(next, false);
        } else if (k === 'ArrowLeft' || k === 'a' || k === 'A') {
          e.preventDefault();
          const next = getNextNodeInDirection(selectedNodeId, 'left');
          if (next) selectNode(next, false);
        } else if (k === 'ArrowRight' || k === 'd' || k === 'D') {
          e.preventDefault();
          const next = getNextNodeInDirection(selectedNodeId, 'right');
          if (next) selectNode(next, false);
        } else if (k === ' ' || k === 'Enter') {
          e.preventDefault();
          const res = acquireSkill(selectedNodeId);
          if (res.success) {
            sound.playTone(520, 0.1, 'triangle', 0.05, 200);
            setTimeout(() => sound.playTone(780, 0.18, 'triangle', 0.05, 100), 100);
            render();
          } else {
            sound.playTone(280, 0.15, 'sawtooth', 0.05, -80);
          }
        } else if (k === 'f' || k === 'F' || k === '0') {
          e.preventDefault();
          fitWeb();
        } else if (k === 'c' || k === 'C') {
          e.preventDefault();
          centerOnNode(selectedNodeId);
        } else if (k === '+' || k === '=') {
          e.preventDefault();
          zoomScale = Math.min(2.5, zoomScale * 1.25);
          applyViewport(true);
        } else if (k === '-' || k === '_') {
          e.preventDefault();
          zoomScale = Math.max(0.55, zoomScale * 0.8);
          applyViewport(true);
        } else if (k === 'Escape') {
          e.preventDefault();
          setPanelCollapsed(!isPanelCollapsed);
        }
      };

      window.addEventListener('keydown', abilitiesKeyHandler);

      // Respec Web Button
      container.querySelector('#btnRespecWeb')?.addEventListener('click', () => {
        if (confirm('Refund all spent ability points and reset web back to starter Dash?')) {
          respecWeb();
          selectedNodeId = 'dash';
          sound.playTone(400, 0.14, 'triangle', 0.04, -120);
          render();
        }
      });
    }

    // Online Modal Bindings
    if (onlineModalOpen) {
      container.querySelector('#btnOnlineClose')?.addEventListener('click', () => {
        onlineModalOpen = false;
        render();
      });

      container.querySelector('#btnOnlineQuick')?.addEventListener('click', () => {
        onlineModalOpen = false;
        const lks = getLooks();
        const col = getColor(lks.p1.color);
        onStart({
          mode: 'online',
          diff: 'normal',
          onlineAction: 'quick',
          playerName: lks.p1.name,
          playerColor: { main: col.main, light: col.light, dark: col.dark },
          playerPattern: lks.p1.pattern,
          playerAcc: lks.p1.acc
        });
      });

      container.querySelector('#btnOnlineCreate')?.addEventListener('click', () => {
        onlineModalOpen = false;
        const lks = getLooks();
        const col = getColor(lks.p1.color);
        onStart({
          mode: 'online',
          diff: 'normal',
          onlineAction: 'create',
          playerName: lks.p1.name,
          playerColor: { main: col.main, light: col.light, dark: col.dark },
          playerPattern: lks.p1.pattern,
          playerAcc: lks.p1.acc
        });
      });

      container.querySelector('#btnOnlineJoin')?.addEventListener('click', () => {
        const codeInput = container.querySelector('#txtJoinCode') as HTMLInputElement;
        const code = codeInput ? codeInput.value.trim().toUpperCase() : '';
        if (code) {
          onlineModalOpen = false;
          const lks = getLooks();
          const col = getColor(lks.p1.color);
          onStart({
            mode: 'online',
            diff: 'normal',
            onlineAction: 'join',
            roomCode: code,
            playerName: lks.p1.name,
            playerColor: { main: col.main, light: col.light, dark: col.dark },
            playerPattern: lks.p1.pattern,
            playerAcc: lks.p1.acc
          });
        }
      });
    }
  }

  // Window key listener for interactive key remap
  function onWindowKeyDown(e: KeyboardEvent) {
    if (!listeningKey) return;
    e.preventDefault();
    e.stopPropagation();

    if (e.code === 'Escape') {
      listeningKey = null;
      render();
      return;
    }

    if (RESERVED_KEYS.includes(e.code)) {
      alert(`Key ${e.code} is reserved for game operations.`);
      listeningKey = null;
      render();
      return;
    }

    const kb = getKeys();
    const p = listeningKey.player;
    const a = listeningKey.action as keyof PlayerKeys['p1'];

    // Check if key is used by another action in the same player
    let swappedAction: string | null = null;
    ACTIONS.forEach(([otherAction]) => {
      if (otherAction !== a && kb[p][otherAction] === e.code) {
        swappedAction = otherAction;
      }
    });

    if (swappedAction) {
      // Swap keys
      const oldKey = kb[p][a];
      kb[p][swappedAction as keyof PlayerKeys['p1']] = oldKey;
    }
    kb[p][a] = e.code;
    saveKeys(kb);
    sound.playTone(660, 0.08, 'triangle', 0.05, 120);

    listeningKey = null;
    render();
  }

  window.addEventListener('keydown', onWindowKeyDown);

  render();
}
