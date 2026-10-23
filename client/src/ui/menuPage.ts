import { sound } from '../audio';
import {
  getKeys, saveKeys, ACTIONS, RESERVED_KEYS,
  type PlayerKeys
} from '../gb';
import { renderMainMenuView } from './menu/mainMenuView';
import { bindMainMenuEvents } from './menu/mainMenuController';
import type { MenuStartOptions, MenuTab } from './menu/menuTypes';
import { renderCustomizeView } from './menu/customizeView';
import { bindCustomizeEvents, type CustomizeState } from './menu/customizeController';
import { renderAbilitiesView } from './menu/abilitiesView';
import { bindAbilitiesEvents, clearAbilitiesKeyHandler, createAbilitiesViewState } from './menu/abilitiesController';
import { renderSettingsView } from './menu/settingsView';
import { bindSettingsEvents, type SettingsState } from './menu/settingsController';
import { renderAboutView } from './menu/aboutView';
import { bindLearnDemo, renderLearnView } from './menu/learnView';
import { renderAccountView } from './menu/accountView';
import { bindAccountEvents, createAccountState } from './menu/accountController';
import { getAuthUser, initAuth, subscribeAuth } from '../auth';
import { renderLeaderboardView, bindLeaderboardEvents } from './menu/leaderboardView';
import { renderProfileView, bindProfileEvents } from './menu/profileView';

export type { MenuStartOptions } from './menu/menuTypes';


export function renderMenuPage(container: HTMLElement, rawOnStart: (opts: MenuStartOptions) => void) {
  let activeTab: MenuTab = 'main';
  const customizeState: CustomizeState = { player: 'p1', drawColor: '#e8593f' };
  const settingsState: SettingsState = { listeningKey: null };
  let spiderLookFrame = 0;
  let cleanupMainDemo: (() => void) | null = null;
  let cleanupLearnDemo: (() => void) | null = null;
  let cleanupAccountDemo: (() => void) | null = null;
  const abilitiesState = createAbilitiesViewState();
  const accountState = createAccountState();

  initAuth();
  subscribeAuth(() => {
    if (activeTab === 'account' && getAuthUser()) {
      activeTab = 'main';
    }
    if (activeTab === 'main' || activeTab === 'account') {
      render();
    }
  });

  const onStart = (opts: MenuStartOptions) => {
    if (!getAuthUser()) {
      activeTab = 'account';
      render();
      return;
    }
    cleanupMainDemo?.();
    cleanupMainDemo = null;
    document.body.classList.remove('main-menu-active', 'abilities-active', 'account-active');
    document.documentElement.classList.remove('main-menu-active', 'abilities-active', 'account-active');
    clearAbilitiesKeyHandler(abilitiesState);
    rawOnStart(opts);
  };

  // Arm ambient music on user interaction
  sound.music.arm('ambient');

  function render() {
    const optionsCol = container.querySelector<HTMLElement>('.custom-options-column');
    const savedOptionsScroll = optionsCol ? optionsCol.scrollTop : 0;
    const savedWinScroll = typeof window !== 'undefined' ? window.scrollY : 0;

    cleanupMainDemo?.();
    cleanupMainDemo = null;
    cleanupLearnDemo?.();
    cleanupLearnDemo = null;
    cleanupAccountDemo?.();
    cleanupAccountDemo = null;
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
          <symbol id="ic-rank" viewBox="0 0 24 24"><path d="M6 9H4.5a2.5 2.5 0 010-5H6M18 9h1.5a2.5 2.5 0 000-5H18M4 22h16M10 14.66V17c0 .55-.45 1-1 1H8c-.55 0-1 .45-1 1v1c0 .55.45 1 1 1h8c.55 0 1-.45 1-1v-1c0-.55-.45-1-1-1h-1c-.55 0-1-.45-1-1v-2.34M18 4H6v7a6 6 0 0012 0V4z"/></symbol>
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
    `;

    bindEvents();

    if (savedOptionsScroll > 0) {
      const restoredCol = container.querySelector<HTMLElement>('.custom-options-column');
      if (restoredCol) {
        restoredCol.scrollTop = savedOptionsScroll;
      }
    }
    if (savedWinScroll > 0 && typeof window !== 'undefined') {
      window.scrollTo(0, savedWinScroll);
    }
  }

  function renderActiveTab(): string {
    if (activeTab === 'main') {
      document.body.classList.add('main-menu-active');
      document.documentElement.classList.add('main-menu-active');
    } else {
      document.body.classList.remove('main-menu-active');
      document.documentElement.classList.remove('main-menu-active');
    }

    if (activeTab !== 'abilities') {
      document.body.classList.remove('abilities-active');
      document.documentElement.classList.remove('abilities-active');
    }

    if (activeTab === 'account') {
      document.body.classList.add('account-active');
      document.documentElement.classList.add('account-active');
    } else {
      document.body.classList.remove('account-active');
      document.documentElement.classList.remove('account-active');
    }

    switch (activeTab) {
      case 'profile':
        return renderProfileView(customizeState.player);
      case 'customize':
        return renderCustomizeView(customizeState.player, customizeState.drawColor);
      case 'abilities':
        return renderAbilitiesView(
          abilitiesState.selectedNodeId,
          abilitiesState.isPanelCollapsed,
          abilitiesState.panX,
          abilitiesState.panY,
          abilitiesState.zoomScale,
          abilitiesState.isRespecConfirmOpen
        );
      case 'settings':
        return renderSettingsView(settingsState.listeningKey);
      case 'learn':
        return renderLearnView();
      case 'leaderboard':
        return renderLeaderboardView();
      case 'about':
        return renderAboutView();
      case 'account':
        return renderAccountView(accountState);
      default:
        return renderMainMenuView();
    }
  }

  /* ====================================================
     EVENT BINDINGS
     ==================================================== */
  function bindEvents() {
    clearAbilitiesKeyHandler(abilitiesState);

    cancelAnimationFrame(spiderLookFrame);
    const spiderHost = container.querySelector<HTMLElement>('#showcaseStage, #preview');
    const spider = spiderHost?.querySelector<SVGSVGElement>('.spider-art');

    if (spiderHost && spider) {
      let cachedRect: DOMRect | null = null;
      let lastRectTime = 0;
      let lookPending = false;
      let targetX = 0;
      let targetY = 0;

      container.onpointermove = event => {
        if (event.pointerType === 'touch') return;
        targetX = event.clientX;
        targetY = event.clientY;
        if (!lookPending) {
          lookPending = true;
          spiderLookFrame = requestAnimationFrame(() => {
            lookPending = false;
            const now = performance.now();
            if (!cachedRect || now - lastRectTime > 800) {
              cachedRect = spider.getBoundingClientRect();
              lastRectTime = now;
            }
            const rect = cachedRect;
            const x = Math.max(-1, Math.min(1, (targetX - rect.left - rect.width / 2) / (rect.width * .65)));
            const y = Math.max(-1, Math.min(1, (targetY - rect.top - rect.height / 2) / (rect.height * .65)));
            spider.style.setProperty('--look-x', `${(x * 2.6).toFixed(2)}px`);
            spider.style.setProperty('--look-y', `${(y * 1.8).toFixed(2)}px`);
            spider.style.setProperty('--look-r', `${(y * 2.4).toFixed(2)}deg`);
            spider.style.setProperty('--eye-x', `${(x * 2.2).toFixed(2)}px`);
            spider.style.setProperty('--eye-y', `${(y * 1.4).toFixed(2)}px`);
          });
        }
      };
      container.onpointerleave = () => {
        cancelAnimationFrame(spiderLookFrame);
        lookPending = false;
        cachedRect = null;
        spider.style.removeProperty('--look-x');
        spider.style.removeProperty('--look-y');
        spider.style.removeProperty('--look-r');
        spider.style.removeProperty('--eye-x');
        spider.style.removeProperty('--eye-y');
      };
    } else {
      container.onpointermove = null;
      container.onpointerleave = null;
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

    container.querySelectorAll('#btnMenuSoundToggle, #btnCornerSoundToggle, #btnCustomSoundToggle, #btnSettingsSoundToggle, #btnWebSoundToggle, #btnQuickSoundToggle, #btnAboutSoundToggle, #btnLearnSoundToggle').forEach(btn => {
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
      cleanupMainDemo = bindMainMenuEvents(container, {
        navigate: tab => {
          activeTab = tab;
          render();
        },
        start: onStart
      });
    }

    if (activeTab === 'leaderboard') bindLeaderboardEvents(container);
    if (activeTab === 'profile') bindProfileEvents(container, customizeState.player);
    container.querySelector('#btnViewProfile')?.addEventListener('click', () => {
      activeTab = 'profile';
      render();
    });
    container.querySelector('#btnProfileBack')?.addEventListener('click', () => {
      activeTab = 'main';
      render();
      container.querySelector<HTMLElement>('#btnViewProfile')?.focus();
    });

    if (activeTab === 'customize') bindCustomizeEvents(container, customizeState, render);

    if (activeTab === 'settings') bindSettingsEvents(container, settingsState, render);

    if (activeTab === 'abilities') bindAbilitiesEvents(container, abilitiesState, render);

    if (activeTab === 'learn') cleanupLearnDemo = bindLearnDemo(container);

    if (activeTab === 'account') cleanupAccountDemo = bindAccountEvents(container, accountState, render);
  }

  // Window key listener for interactive key remap
  function onWindowKeyDown(e: KeyboardEvent) {
    if (!settingsState.listeningKey) return;
    e.preventDefault();
    e.stopPropagation();

    if (e.code === 'Escape') {
      settingsState.listeningKey = null;
      render();
      return;
    }

    if (RESERVED_KEYS.includes(e.code)) {
      alert(`Key ${e.code} is reserved for game operations.`);
      settingsState.listeningKey = null;
      render();
      return;
    }

    const kb = getKeys();
    const p = settingsState.listeningKey.player;
    const a = settingsState.listeningKey.action as keyof PlayerKeys['p1'];

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

    settingsState.listeningKey = null;
    render();
  }

  window.addEventListener('keydown', onWindowKeyDown);

  render();
}
