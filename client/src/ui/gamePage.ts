import { sound } from '../audio';
import { ABILITIES, type AbilityId } from '../game/abilities';
import { getKeys, keyLabel, getColor, getLooks, getSettings, saveSettings } from '../gb';

export interface GamePageCallbacks {
  onBackToMenu: () => void;
  onPauseToggle: (isPaused: boolean) => void;
  onRematch: () => void;
  onAbilityTrigger: (slot: number) => void; // 0 = Slot 1, 1 = Slot 2
  onTouchInput: (key: 'left' | 'right' | 'strike' | 'heavy' | 'block' | 'reel', active: boolean) => void;
}

export class GamePage {
  public rootElement!: HTMLElement;
  public phaserContainer!: HTMLElement;
  private callbacks: GamePageCallbacks;

  // DOM references
  private grip1!: HTMLElement;
  private guard1!: HTMLElement;
  private gb1!: HTMLElement;
  private pips1!: HTMLElement;
  private n1!: HTMLElement;
  private w1!: HTMLElement;

  private grip2!: HTMLElement;
  private guard2!: HTMLElement;
  private gb2!: HTMLElement;
  private pips2!: HTMLElement;
  private n2!: HTMLElement;
  private w2!: HTMLElement;

  private roundLbl!: HTMLElement;
  private hudTimer!: HTMLElement;
  private btnHudMenu!: HTMLButtonElement;
  private overlay!: HTMLElement;
  private ovTitle!: HTMLElement;
  private ovSub!: HTMLElement;
  private ovBtns!: HTMLElement;

  // In-Game Menu / Settings modal
  private inGameMenuModal!: HTMLElement;
  private igmTitle!: HTMLElement;
  private igmSubtitle!: HTMLElement;
  private igmSfxToggle!: HTMLButtonElement;
  private igmMusicToggle!: HTMLButtonElement;
  private igmBtnResume!: HTMLButtonElement;
  private igmBtnQuit!: HTMLButtonElement;

  // Draft modal
  private pickModal!: HTMLElement;
  private pkWho!: HTMLElement;
  private pkTitle!: HTMLElement;
  private pkSub!: HTMLElement;
  private pkCards!: HTMLElement;
  private pkCount!: HTMLElement;
  private pkTimer!: HTMLElement;
  private pkTimeVal!: HTMLElement;
  private pkGo!: HTMLButtonElement;
  private selectedDraftSlots: number[] = [];
  private currentDraftOffer: AbilityId[] = [];
  private draftConfirmCallback: ((skills: string[]) => void) | null = null;
  public isDraftOpen: boolean = false;
  private isDraftLeaving: boolean = false;
  private draftKeyHandler?: (e: KeyboardEvent) => void;
  private draftTimerInterval: number | null = null;
  private draftTimeLeft: number = 15;

  private g1a!: HTMLElement;
  private g1b!: HTMLElement;
  private g2a!: HTMLElement;
  private g2b!: HTMLElement;
  private gi1a!: HTMLElement;
  private gi1b!: HTMLElement;
  private gi2a!: HTMLElement;
  private gi2b!: HTMLElement;
  private gcd1a!: HTMLElement;
  private gcd1b!: HTMLElement;
  private gcd2a!: HTMLElement;
  private gcd2b!: HTMLElement;
  private gkb1a!: HTMLElement;
  private gkb1b!: HTMLElement;
  private gkb2a!: HTMLElement;
  private gkb2b!: HTMLElement;
  private lastControlsKey: string = '';

  private gemSeen: Record<string, string> = {};
  public isPaused: boolean = false;
  private gameMode: string = 'cpu';

  // Zoom prevention cleanup
  private zoomCleanupFns: Array<() => void> = [];

  constructor(container: HTMLElement, callbacks: GamePageCallbacks) {
    this.callbacks = callbacks;
    this.render(container);
    this.setupListeners();
  }

  private render(container: HTMLElement) {
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
          <symbol id="ic-lock" viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 018 0v3"/></symbol>
        </defs>
      </svg>

      <!-- FULLSCREEN GAME ARENA WRAPPER -->
      <div class="game-screen-fullscreen">
        <div class="arena" id="arena">
          <div id="phaserContainer" style="width:100%; height:100%;"></div>

          <!-- IN-GAME TOP FIGHTER STATUS & HUD -->
          <div class="in-game-hud-overlay">
            <section class="hud in-game-hud" id="hud" aria-label="Match status">
              <!-- PLAYER 1 (AMBER) -->
              <div class="fighter p1">
                <div class="fhead">
                  <i class="swatch"></i>
                  <span class="fname" id="n1">Amber</span>
                  <span class="who" id="w1">You</span>
                  <span class="pips" id="pips1"><i class="pip"></i><i class="pip"></i></span>
                </div>
                <div class="meter grip-meter">
                  <span>Grip</span>
                  <div class="bar" id="gb1"><i id="grip1"></i></div>
                </div>
                <div class="meter guard-meter">
                  <span>Guard</span>
                  <div class="bar guard"><i id="guard1"></i></div>
                </div>
              </div>

              <!-- CENTER: MENU ICON BUTTON & ROUND BANNER -->
              <div class="center">
                <button class="btn-hud-menu" id="btnHudMenu" type="button" aria-label="Game Menu" title="Menu (Esc)">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round">
                    <line x1="3" y1="6" x2="21" y2="6"></line>
                    <line x1="3" y1="12" x2="21" y2="12"></line>
                    <line x1="3" y1="18" x2="21" y2="18"></line>
                  </svg>
                </button>
                <div class="hud-match-timer" id="hudTimer" aria-label="Round Timer">60</div>
                <div id="roundLbl">Round 1</div>
                <div class="best">First to 2</div>
              </div>

              <!-- PLAYER 2 (JADE) -->
              <div class="fighter p2">
                <div class="fhead">
                  <span class="pips" id="pips2"><i class="pip"></i><i class="pip"></i></span>
                  <span class="who" id="w2">CPU</span>
                  <span class="fname" id="n2">Jade</span>
                  <i class="swatch"></i>
                </div>
                <div class="meter grip-meter">
                  <span>Grip</span>
                  <div class="bar" id="gb2"><i id="grip2"></i></div>
                </div>
                <div class="meter guard-meter">
                  <span>Guard</span>
                  <div class="bar guard"><i id="guard2"></i></div>
                </div>
              </div>
            </section>
          </div>

          <!-- AMBER ABILITIES RAIL (BOTTOM LEFT) -->
          <div class="rail l p1" aria-label="Amber skills">
            <button class="gem" id="g1a" data-slot="0" tabindex="-1" type="button" aria-label="Skill 1">
              <svg class="shape bg" viewBox="0 0 100 100" aria-hidden="true"><polygon points="50,3 91,26.5 91,73.5 50,97 9,73.5 9,26.5"/></svg>
              <div class="gem-icon-frame">
                <img class="gem-ability-icon" id="gi1a" src="/abilities/dash.png" alt="Dash" />
                <div class="gem-cd-wipe" id="gw1a"></div>
              </div>
              <span class="gem-cd-num" id="gcd1a"></span>
              <span class="gem-key-badge" id="gkb1a">Q</span>
            </button>
            <button class="gem" id="g1b" data-slot="1" tabindex="-1" type="button" aria-label="Skill 2">
              <svg class="shape bg" viewBox="0 0 100 100" aria-hidden="true"><polygon points="50,3 91,26.5 91,73.5 50,97 9,73.5 9,26.5"/></svg>
              <div class="gem-icon-frame">
                <img class="gem-ability-icon" id="gi1b" src="/abilities/web.png" alt="Web" />
                <div class="gem-cd-wipe" id="gw1b"></div>
              </div>
              <span class="gem-cd-num" id="gcd1b"></span>
              <span class="gem-key-badge" id="gkb1b">E</span>
            </button>
          </div>

          <!-- JADE ABILITIES RAIL (BOTTOM RIGHT) -->
          <div class="rail r p2" aria-hidden="true">
            <div class="gem" id="g2a">
              <svg class="shape bg" viewBox="0 0 100 100" aria-hidden="true"><polygon points="50,3 91,26.5 91,73.5 50,97 9,73.5 9,26.5"/></svg>
              <div class="gem-icon-frame">
                <img class="gem-ability-icon" id="gi2a" src="/abilities/dash.png" alt="Dash" />
                <div class="gem-cd-wipe" id="gw2a"></div>
              </div>
              <span class="gem-cd-num" id="gcd2a"></span>
              <span class="gem-key-badge" id="gkb2a"></span>
            </div>
            <div class="gem" id="g2b">
              <svg class="shape bg" viewBox="0 0 100 100" aria-hidden="true"><polygon points="50,3 91,26.5 91,73.5 50,97 9,73.5 9,26.5"/></svg>
              <div class="gem-icon-frame">
                <img class="gem-ability-icon" id="gi2b" src="/abilities/web.png" alt="Web" />
                <div class="gem-cd-wipe" id="gw2b"></div>
              </div>
              <span class="gem-cd-num" id="gcd2b"></span>
              <span class="gem-key-badge" id="gkb2b"></span>
            </div>
          </div>

          <!-- OVERLAY (ROUND END / MATCH END / SYSTEM) -->
          <div class="overlay" id="ov" hidden>
            <h2 id="ovTitle">Paused</h2>
            <p id="ovSub"></p>
            <div class="btns" id="ovBtns"></div>
          </div>

          <!-- IN-GAME MENU / SETTINGS MODAL -->
          <div class="in-game-menu-modal" id="inGameMenuModal" hidden role="dialog" aria-modal="true" aria-labelledby="igmTitle">
            <div class="igm-card">
              <div class="igm-header">
                <h2 id="igmTitle">Game Paused</h2>
                <p id="igmSubtitle">Take a breath.</p>
              </div>

              <!-- SIMPLE SETTINGS -->
              <div class="igm-settings">
                <div class="igm-setting-row">
                  <div class="igm-setting-info">
                    <span class="igm-setting-label">Sound Effects</span>
                    <span class="igm-setting-desc">Strikes, clashes, and skills</span>
                  </div>
                  <button type="button" class="btn igm-toggle-btn" id="igmSfxToggle">ON</button>
                </div>

                <div class="igm-setting-row">
                  <div class="igm-setting-info">
                    <span class="igm-setting-label">Music</span>
                    <span class="igm-setting-desc">Background battle tracks</span>
                  </div>
                  <button type="button" class="btn igm-toggle-btn" id="igmMusicToggle">ON</button>
                </div>
              </div>

              <!-- QUICK CONTROLS GUIDE -->
              <div class="igm-controls-guide">
                <div class="igm-ctrl-row"><span>Move</span><b>A / D &nbsp;or&nbsp; ← / →</b></div>
                <div class="igm-ctrl-row"><span>Light Attack</span><b>J &nbsp;or&nbsp; Z</b></div>
                <div class="igm-ctrl-row"><span>Heavy Attack</span><b>K &nbsp;or&nbsp; X</b></div>
                <div class="igm-ctrl-row"><span>Guard / Block</span><b>L &nbsp;or&nbsp; C</b></div>
                <div class="igm-ctrl-row"><span>Climb / Reel</span><b>W &nbsp;or&nbsp; Space</b></div>
                <div class="igm-ctrl-row"><span>Skills</span><b>Q &nbsp;/&nbsp; E</b></div>
              </div>

              <!-- ACTIONS -->
              <div class="igm-actions">
                <button type="button" class="btn primary igm-btn-resume" id="igmBtnResume">Resume Match</button>
                <button type="button" class="btn danger ghost igm-btn-quit" id="igmBtnQuit">Quit to Menu</button>
              </div>
            </div>
          </div>
        </div>

        <div class="sr" id="live" aria-live="polite"></div>
      </div>

      <!-- CARD PICK MODAL -->
      <div class="pick" id="pick" hidden role="dialog" aria-modal="true" aria-labelledby="pkTitle">
        <div class="pick-in">
          <div class="pk-head">
            <p class="pk-who" id="pkWho"></p>
            <h2 id="pkTitle">Pick 2 skills</h2>
            <p class="pk-sub" id="pkSub">Choose 2 of these 3 cards. You keep them for the whole match. Press 1, 2 or 3 to choose.</p>
          </div>
          <div class="pk-center">
            <div class="pk-timer" id="pkTimer" aria-label="Time remaining"><span class="pk-timer-num" id="pkTimeVal">15</span>s</div>
            <div class="pk-foot">
              <span id="pkCount" aria-live="polite">0 of 2 picked</span>
              <button type="button" class="btn primary" id="pkGo" disabled>Done</button>
            </div>
          </div>
          <div class="cards" id="pkCards"></div>
        </div>
      </div>
    `;

    this.rootElement = container;
    this.phaserContainer = container.querySelector('#phaserContainer') as HTMLElement;

    // Grab HUD elements
    this.grip1 = container.querySelector('#grip1') as HTMLElement;
    this.guard1 = container.querySelector('#guard1') as HTMLElement;
    this.gb1 = container.querySelector('#gb1') as HTMLElement;
    this.pips1 = container.querySelector('#pips1') as HTMLElement;
    this.n1 = container.querySelector('#n1') as HTMLElement;
    this.w1 = container.querySelector('#w1') as HTMLElement;

    this.grip2 = container.querySelector('#grip2') as HTMLElement;
    this.guard2 = container.querySelector('#guard2') as HTMLElement;
    this.gb2 = container.querySelector('#gb2') as HTMLElement;
    this.pips2 = container.querySelector('#pips2') as HTMLElement;
    this.n2 = container.querySelector('#n2') as HTMLElement;
    this.w2 = container.querySelector('#w2') as HTMLElement;

    this.roundLbl = container.querySelector('#roundLbl') as HTMLElement;
    this.hudTimer = container.querySelector('#hudTimer') as HTMLElement;
    this.btnHudMenu = container.querySelector('#btnHudMenu') as HTMLButtonElement;
    this.overlay = container.querySelector('#ov') as HTMLElement;
    this.ovTitle = container.querySelector('#ovTitle') as HTMLElement;
    this.ovSub = container.querySelector('#ovSub') as HTMLElement;
    this.ovBtns = container.querySelector('#ovBtns') as HTMLElement;

    // In-game menu modal elements
    this.inGameMenuModal = container.querySelector('#inGameMenuModal') as HTMLElement;
    this.igmTitle = container.querySelector('#igmTitle') as HTMLElement;
    this.igmSubtitle = container.querySelector('#igmSubtitle') as HTMLElement;
    this.igmSfxToggle = container.querySelector('#igmSfxToggle') as HTMLButtonElement;
    this.igmMusicToggle = container.querySelector('#igmMusicToggle') as HTMLButtonElement;
    this.igmBtnResume = container.querySelector('#igmBtnResume') as HTMLButtonElement;
    this.igmBtnQuit = container.querySelector('#igmBtnQuit') as HTMLButtonElement;

    // Pick modal elements
    this.pickModal = container.querySelector('#pick') as HTMLElement;
    this.pkWho = container.querySelector('#pkWho') as HTMLElement;
    this.pkTitle = container.querySelector('#pkTitle') as HTMLElement;
    this.pkSub = container.querySelector('#pkSub') as HTMLElement;
    this.pkCards = container.querySelector('#pkCards') as HTMLElement;
    this.pkCount = container.querySelector('#pkCount') as HTMLElement;
    this.pkTimer = container.querySelector('#pkTimer') as HTMLElement;
    this.pkTimeVal = container.querySelector('#pkTimeVal') as HTMLElement;
    this.pkGo = container.querySelector('#pkGo') as HTMLButtonElement;

    // Rails gems
    this.g1a = container.querySelector('#g1a') as HTMLElement;
    this.g1b = container.querySelector('#g1b') as HTMLElement;
    this.g2a = container.querySelector('#g2a') as HTMLElement;
    this.g2b = container.querySelector('#g2b') as HTMLElement;
    this.gi1a = container.querySelector('#gi1a') as HTMLElement;
    this.gi1b = container.querySelector('#gi1b') as HTMLElement;
    this.gi2a = container.querySelector('#gi2a') as HTMLElement;
    this.gi2b = container.querySelector('#gi2b') as HTMLElement;
    this.gcd1a = container.querySelector('#gcd1a') as HTMLElement;
    this.gcd1b = container.querySelector('#gcd1b') as HTMLElement;
    this.gcd2a = container.querySelector('#gcd2a') as HTMLElement;
    this.gcd2b = container.querySelector('#gcd2b') as HTMLElement;
    this.gkb1a = container.querySelector('#gkb1a') as HTMLElement;
    this.gkb1b = container.querySelector('#gkb1b') as HTMLElement;
    this.gkb2a = container.querySelector('#gkb2a') as HTMLElement;
    this.gkb2b = container.querySelector('#gkb2b') as HTMLElement;

    this.buildControlsGuide();
  }

  private setupListeners() {
    // Ability buttons on rail
    this.g1a.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      this.callbacks.onAbilityTrigger(0);
    });
    this.g1b.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      this.callbacks.onAbilityTrigger(1);
    });

    // Center HUD Menu icon button
    this.btnHudMenu.addEventListener('click', () => {
      this.openInGameMenu();
    });

    // In-game Menu: Resume button
    this.igmBtnResume.addEventListener('click', () => {
      this.closeInGameMenu();
    });

    // In-game Menu: Quit button
    this.igmBtnQuit.addEventListener('click', () => {
      this.closeInGameMenu();
      this.callbacks.onBackToMenu();
    });

    // In-game Menu: SFX toggle
    this.igmSfxToggle.addEventListener('click', () => {
      const st = getSettings();
      st.sfx = !st.sfx;
      st.sound = st.sfx || st.music;
      saveSettings(st);
      this.updateIgmSettingsUi(st);
      if (st.sfx) sound.play('click');
    });

    // In-game Menu: Music toggle
    this.igmMusicToggle.addEventListener('click', () => {
      const st = getSettings();
      st.music = !st.music;
      st.sound = st.sfx || st.music;
      saveSettings(st);
      this.updateIgmSettingsUi(st);
      if (!st.music) {
        sound.music.stop();
      } else if (!this.isPaused) {
        sound.music.play('duel');
      }
    });

    // Escape key toggles in-game menu
    window.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.code === 'Escape') {
        if (this.isDraftOpen) return;
        this.togglePause();
      }
    });

    // Touch controls
    this.rootElement.querySelectorAll('.tb[data-t]').forEach((b) => {
      const k = (b as HTMLElement).dataset.t as 'left' | 'right' | 'strike' | 'heavy' | 'block' | 'reel';
      const onDown = (e: Event) => {
        e.preventDefault();
        b.classList.add('down');
        this.callbacks.onTouchInput(k, true);
      };
      const onUp = () => {
        b.classList.remove('down');
        this.callbacks.onTouchInput(k, false);
      };
      b.addEventListener('pointerdown', onDown);
      b.addEventListener('pointerup', onUp);
      b.addEventListener('pointercancel', onUp);
    });

    // Confirm pick button
    this.pkGo.addEventListener('click', () => {
      this.confirmPick();
    });

    // Mouse wheel horizontal scrolling for cards & lock vertical scrollTop to 0
    this.pkCards.addEventListener('scroll', () => {
      if (this.pkCards.scrollTop !== 0) {
        this.pkCards.scrollTop = 0;
      }
    });
    this.pkCards.addEventListener('wheel', (e: WheelEvent) => {
      if (this.pkCards.classList.contains('has-scroll') && Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        e.preventDefault();
        this.pkCards.scrollLeft += e.deltaY;
      }
    }, { passive: false });

    // Keyboard numbers 1-9 in draft
    this.draftKeyHandler = (e) => {
      if (!this.isDraftOpen || this.isDraftLeaving) return;
      const m = /^(?:Digit|Numpad)([1-9])$/.exec(e.code);
      if (m) {
        const idx = parseInt(m[1], 10) - 1;
        if (idx < this.currentDraftOffer.length) {
          e.preventDefault();
          this.toggleCard(idx);
        }
      } else if (e.code === 'Enter') {
        const target = e.target as HTMLElement;
        if (!target || !target.closest('button,a')) {
          e.preventDefault();
          this.confirmPick();
        }
      }
    };
    window.addEventListener('keydown', this.draftKeyHandler);

    // Prevent browser zoom in/out while in the game screen
    // Intercepts wheel (pinch-zoom / Ctrl+wheel), zoom hotkeys, and multi-touch gestures
    // across window, document, documentElement, and body in the capture phase so edge/sidebar
    // interactions cannot trigger browser-level zoom.
    document.documentElement.classList.add('game-active');
    document.body.classList.add('game-active');

    const zoomWheelHandler = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
      }
    };

    const zoomKeyHandler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (
        e.key === '+' ||
        e.key === '-' ||
        e.key === '=' ||
        e.key === '_' ||
        e.key === '0' ||
        e.code === 'Equal' ||
        e.code === 'Minus' ||
        e.code === 'Digit0' ||
        e.code === 'NumpadAdd' ||
        e.code === 'NumpadSubtract' ||
        e.code === 'Numpad0' ||
        e.keyCode === 187 ||
        e.keyCode === 189 ||
        e.keyCode === 107 ||
        e.keyCode === 109 ||
        e.keyCode === 48 ||
        e.keyCode === 96
      )) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
      }
    };

    const zoomTouchHandler = (e: TouchEvent) => {
      if (e.touches && e.touches.length > 1) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    const zoomGestureHandler = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const targets: (EventTarget | null)[] = [
      window,
      document,
      document.documentElement,
      document.body,
    ];

    targets.forEach((target) => {
      if (!target) return;
      target.addEventListener('wheel', zoomWheelHandler as EventListener, { capture: true, passive: false });
      target.addEventListener('keydown', zoomKeyHandler as EventListener, { capture: true });
      target.addEventListener('touchstart', zoomTouchHandler as EventListener, { capture: true, passive: false });
      target.addEventListener('touchmove', zoomTouchHandler as EventListener, { capture: true, passive: false });
      target.addEventListener('gesturestart', zoomGestureHandler, { capture: true, passive: false });
      target.addEventListener('gesturechange', zoomGestureHandler, { capture: true, passive: false });
      target.addEventListener('gestureend', zoomGestureHandler, { capture: true, passive: false });
    });

    this.zoomCleanupFns.push(() => {
      document.documentElement.classList.remove('game-active');
      document.body.classList.remove('game-active');
      targets.forEach((target) => {
        if (!target) return;
        target.removeEventListener('wheel', zoomWheelHandler as EventListener, { capture: true });
        target.removeEventListener('keydown', zoomKeyHandler as EventListener, { capture: true });
        target.removeEventListener('touchstart', zoomTouchHandler as EventListener, { capture: true });
        target.removeEventListener('touchmove', zoomTouchHandler as EventListener, { capture: true });
        target.removeEventListener('gesturestart', zoomGestureHandler, { capture: true });
        target.removeEventListener('gesturechange', zoomGestureHandler, { capture: true });
        target.removeEventListener('gestureend', zoomGestureHandler, { capture: true });
      });
    });
  }

  public destroy() {
    this.clearDraftTimer();
    if (this.draftKeyHandler) window.removeEventListener('keydown', this.draftKeyHandler);
    this.zoomCleanupFns.forEach((fn) => fn());
    this.zoomCleanupFns = [];
  }

  public buildControlsGuide(_s1Skills?: [string, string], _s2Skills?: [string, string]) {
    const looks = getLooks();
    const c1 = getColor(looks.p1.color);
    const c2 = getColor(looks.p2.color);
    this.rootElement.querySelectorAll<HTMLElement>('.p1').forEach(e => e.style.setProperty('--c', c1.main));
    this.rootElement.querySelectorAll<HTMLElement>('.p2').forEach(e => e.style.setProperty('--c', c2.main));
  }

  /* ---------- CARD PICK MODAL (Fanned cards, 3 draw keep 2, or 1 keep 1) ---------- */
  public showDraftModal(
    choices: string[],
    round: number,
    playerName: string,
    onConfirm: (skills: string[]) => void
  ) {
    this.clearDraftTimer();
    this.isDraftLeaving = false;
    this.isDraftOpen = true;
    this.currentDraftOffer = (choices && choices.length > 0 ? choices : ['dash']) as AbilityId[];
    this.draftConfirmCallback = onConfirm;

    const targetCount = this.targetDraftCount;

    this.pkWho.textContent = `${playerName} · Round ${round}`;
    this.pkWho.style.setProperty('--c', 'var(--amber)');

    if (targetCount === 1) {
      this.pkTitle.textContent = 'Pick your skill';
      this.pkSub.textContent = 'You have 1 ability unlocked. Equip your card for the match. Press 1 or click to choose.';
      this.selectedDraftSlots = [0]; // Auto-selected so player can confirm immediately
    } else {
      this.pkTitle.textContent = 'Pick 2 skills';
      const keyHint = choices.length <= 3 ? 'Press 1, 2 or 3 to choose.' : `Press 1-${Math.min(9, choices.length)} or click to choose.`;
      this.pkSub.textContent = `Choose 2 of these ${choices.length} cards. You keep them for the whole match. ${keyHint}`;
      this.selectedDraftSlots = [];
    }

    if (this.currentDraftOffer.length > 3) {
      this.pkCards.classList.add('has-scroll');
    } else {
      this.pkCards.classList.remove('has-scroll');
    }

    if (this.pkTimer) this.pkTimer.style.display = '';

    this.pkCards.innerHTML = '';

    this.currentDraftOffer.forEach((id, k) => {
      const s = ABILITIES[id as AbilityId] || ABILITIES.dash;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'skill card-pick';
      btn.setAttribute('aria-pressed', this.selectedDraftSlots.includes(k) ? 'true' : 'false');
      btn.style.setProperty('--i', String(k));

      btn.innerHTML = `
        <svg class="card-bg-pattern" viewBox="0 0 260 420" preserveAspectRatio="xMidYMin slice" aria-hidden="true">
          <g fill="none" stroke="currentColor" stroke-width="1">
            <circle cx="54" cy="56" r="36" stroke-dasharray="3 4" opacity="0.35"/>
            <circle cx="54" cy="56" r="58" opacity="0.18"/>
            <circle cx="54" cy="56" r="88" stroke-dasharray="6 6" opacity="0.14"/>
            <circle cx="54" cy="56" r="128" opacity="0.1"/>
            <path d="M54 0v420M0 56h260M0 0l260 260M110 0L0 110" opacity="0.12"/>
            <path d="M12 18V8h10M248 18V8h-10" stroke-width="1.5" opacity="0.45"/>
          </g>
        </svg>
        <span class="num">${k + 1}</span>
        <span class="pgem">
          <img src="/abilities/${s.id}.png" alt="${s.name}" class="card-icon-img" />
        </span>
        <div>
          <h3>${s.name}</h3>
          <div class="meta">${s.cd}s cooldown · ${s.use === 'hang' ? 'while dangling' : 'while clinging'}</div>
        </div>
        <p class="desc">${s.desc}</p>
      `;

      btn.addEventListener('mousedown', (e) => {
        e.preventDefault();
        btn.focus({ preventScroll: true });
      });
      btn.addEventListener('pointerdown', () => {
        btn.focus({ preventScroll: true });
      });
      btn.addEventListener('click', () => {
        this.toggleCard(k);
      });
      btn.addEventListener('pointerenter', (e) => {
        if ((e as PointerEvent).pointerType === 'mouse') {
          btn.focus({ preventScroll: true });
          sound.playTone(900, 0.04, 'triangle', 0.02);
        }
      });

      this.pkCards.appendChild(btn);
    });

    this.syncPickUI();
    this.startDraftTimer(15);
    this.pickModal.classList.remove('leave');
    this.pickModal.hidden = false;

    // Trigger deal animation
    requestAnimationFrame(() => {
      void this.pkCards.offsetWidth;
      Array.from(this.pkCards.children).forEach(c => c.classList.add('deal'));
      for (let k = 0; k < Math.min(5, this.currentDraftOffer.length); k++) {
        setTimeout(() => {
          sound.playTone(220 + k * 70, 0.3, 'sawtooth', 0.025, 520);
        }, 80 + k * 100);
      }
    });

    const firstCard = this.pkCards.firstElementChild as HTMLElement;
    if (firstCard) firstCard.focus({ preventScroll: true });
  }

  private get targetDraftCount(): number {
    return Math.min(2, Math.max(1, this.currentDraftOffer.length));
  }

  private toggleCard(k: number) {
    if (this.isDraftLeaving) return;
    const target = this.targetDraftCount;
    const ix = this.selectedDraftSlots.indexOf(k);
    if (ix >= 0) {
      this.selectedDraftSlots.splice(ix, 1);
      sound.play('card_deselect');
    } else {
      if (this.selectedDraftSlots.length >= target) {
        this.selectedDraftSlots.shift();
      }
      this.selectedDraftSlots.push(k);
      sound.play('card_select');
    }

    const card = this.pkCards.children[k] as HTMLElement;
    if (card) {
      card.classList.remove('pop');
      void card.offsetWidth;
      card.classList.add('pop');
      card.focus({ preventScroll: true });
      if (this.pkCards.classList.contains('has-scroll')) {
        const containerRect = this.pkCards.getBoundingClientRect();
        const cardRect = card.getBoundingClientRect();
        if (cardRect.left < containerRect.left) {
          this.pkCards.scrollBy({ left: cardRect.left - containerRect.left - 16, behavior: 'smooth' });
        } else if (cardRect.right > containerRect.right) {
          this.pkCards.scrollBy({ left: cardRect.right - containerRect.right + 16, behavior: 'smooth' });
        }
      }
    }

    this.syncPickUI();
  }

  private startDraftTimer(durationSeconds: number = 15) {
    this.clearDraftTimer();
    this.draftTimeLeft = durationSeconds;
    this.updateDraftTimerUI();

    this.draftTimerInterval = window.setInterval(() => {
      this.draftTimeLeft--;
      this.updateDraftTimerUI();
      if (this.draftTimeLeft <= 0) {
        this.clearDraftTimer();
        this.autoPickAndConfirm();
      }
    }, 1000);
  }

  private clearDraftTimer() {
    if (this.draftTimerInterval !== null) {
      clearInterval(this.draftTimerInterval);
      this.draftTimerInterval = null;
    }
    if (this.pkTimer) {
      this.pkTimer.classList.remove('urgent');
    }
  }

  private updateDraftTimerUI() {
    if (!this.pkTimeVal) return;
    this.pkTimeVal.textContent = String(Math.max(0, this.draftTimeLeft));
    if (this.draftTimeLeft <= 5) {
      this.pkTimer?.classList.add('urgent');
    } else {
      this.pkTimer?.classList.remove('urgent');
    }
  }

  private autoPickAndConfirm() {
    if (!this.isDraftOpen || this.isDraftLeaving) return;
    const target = this.targetDraftCount;

    // Retain any valid pre-selected cards
    const current = this.selectedDraftSlots.filter(
      idx => typeof idx === 'number' && idx >= 0 && idx < this.currentDraftOffer.length
    );

    // Auto-fill any remaining slots from available choices
    for (let i = 0; i < this.currentDraftOffer.length; i++) {
      if (current.length >= target) break;
      if (!current.includes(i)) {
        current.push(i);
      }
    }

    this.selectedDraftSlots = current.slice(0, target);
    this.syncPickUI();
    this.confirmPick();
  }

  private syncPickUI() {
    const target = this.targetDraftCount;
    Array.from(this.pkCards.children).forEach((c, k) => {
      c.setAttribute('aria-pressed', this.selectedDraftSlots.includes(k) ? 'true' : 'false');
    });
    this.pkCount.textContent = `${this.selectedDraftSlots.length} of ${target} picked`;
    this.pkGo.disabled = this.selectedDraftSlots.length !== target;
  }

  private confirmPick() {
    const target = this.targetDraftCount;
    if (this.selectedDraftSlots.length !== target || this.isDraftLeaving) return;
    this.clearDraftTimer();
    this.isDraftLeaving = true;
    sound.play('card_confirm');

    this.pickModal.classList.add('leave');
    const chosen = this.selectedDraftSlots.map(k => this.currentDraftOffer[k]);
    const cb = this.draftConfirmCallback;

    setTimeout(() => {
      this.isDraftLeaving = false;
      this.pickModal.classList.remove('leave');
      if (this.gameMode === 'online') {
        this.showDraftWaiting(chosen);
      } else {
        this.hideDraftModal();
      }
      if (cb) cb(chosen);
    }, 400);
  }

  public showDraftWaiting(chosen: string[]) {
    this.clearDraftTimer();
    this.isDraftOpen = true;
    this.isDraftLeaving = false;
    this.pickModal.hidden = false;
    this.pkTitle.textContent = 'Waiting for Opponent...';
    const names = chosen.map(id => ABILITIES[id as AbilityId]?.name || id).join(' & ');
    this.pkSub.textContent = `You picked ${names}. Waiting for your opponent to choose their abilities...`;
    this.pkCount.textContent = 'Ready ✓';
    this.pkGo.disabled = true;
    this.pkGo.textContent = 'Locked In';
    if (this.pkTimer) this.pkTimer.style.display = 'none';
    Array.from(this.pkCards.children).forEach(c => {
      (c as HTMLElement).style.pointerEvents = 'none';
      (c as HTMLElement).style.opacity = '0.5';
    });
  }

  public hideDraftModal() {
    this.clearDraftTimer();
    this.isDraftOpen = false;
    this.isDraftLeaving = false;
    this.pickModal.hidden = true;
    this.selectedDraftSlots = [];
    this.draftConfirmCallback = null;
    this.pkGo.disabled = false;
    this.pkGo.textContent = 'Done';
    if (this.pkTimer) this.pkTimer.style.display = '';
    this.pkCards.classList.remove('has-scroll');
    Array.from(this.pkCards.children).forEach(c => {
      (c as HTMLElement).style.pointerEvents = '';
      (c as HTMLElement).style.opacity = '';
    });
  }

  /* ---------- LABELS AND ROOM BADGE ---------- */
  public setLabels(mode: string, diff: string, myId: number = 0) {
    this.gameMode = mode;
    this.gemSeen = {};
    this.lastControlsKey = '';
    const looks = getLooks();
    const c1 = getColor(looks.p1.color);
    const c2 = getColor(looks.p2.color);
    const cpuColor = (c1.id === 'jade' || c1.id === 'toxic') ? getColor('amber') : getColor('jade');
    const cpuName = (c1.id === 'jade' || c1.id === 'toxic') ? 'Amber' : 'Jade';

    this.rootElement.querySelectorAll<HTMLElement>('.p1').forEach(e => e.style.setProperty('--c', c1.main));
    this.rootElement.querySelectorAll<HTMLElement>('.p2').forEach(e => e.style.setProperty('--c', mode === 'cpu' ? cpuColor.main : c2.main));

    if (mode === 'online') {
      this.w1.textContent = myId === 0 ? 'You' : 'Opponent';
      this.w2.textContent = myId === 1 ? 'You' : 'Opponent';
    } else if (mode === 'cpu') {
      this.n1.textContent = looks.p1.name || 'You';
      this.w1.textContent = 'You';
      this.n2.textContent = cpuName;
      this.w2.textContent = `CPU · ${diff}`;
    } else {
      this.n1.textContent = looks.p1.name || 'Player 1';
      this.w1.textContent = 'Player 1';
      this.n2.textContent = looks.p2.name || 'Player 2';
      this.w2.textContent = 'Player 2';
    }
  }

  /* ---------- HUD UPDATES & ABILITY GEMS ---------- */
  public updateHud(state: any) {
    if (!state || !state.p1 || !state.p2) return;

    const s1 = state.p1;
    const s2 = state.p2;
    const kb = getKeys();

    if (s1.color) {
      this.rootElement.querySelectorAll<HTMLElement>('.p1').forEach(e => e.style.setProperty('--c', s1.color));
    }
    if (s2.color) {
      this.rootElement.querySelectorAll<HTMLElement>('.p2').forEach(e => e.style.setProperty('--c', s2.color));
    }

    const name1 = s1.level ? `${s1.name || 'Amber'} (Lv.${s1.level})` : (s1.name || 'Amber');
    const name2 = s2.level ? `${s2.name || 'Jade'} (Lv.${s2.level})` : (s2.name || 'Jade');
    if (this.n1.textContent !== name1) this.n1.textContent = name1;
    if (this.n2.textContent !== name2) this.n2.textContent = name2;

    // Grip & Guard meters
    this.grip1.style.width = `${Math.max(0, Math.min(100, s1.grip))}%`;
    this.guard1.style.width = `${Math.max(0, Math.min(100, s1.guard))}%`;
    this.gb1.classList.toggle('low', s1.grip < 30);

    this.grip2.style.width = `${Math.max(0, Math.min(100, s2.grip))}%`;
    this.guard2.style.width = `${Math.max(0, Math.min(100, s2.guard))}%`;
    this.gb2.classList.toggle('low', s2.grip < 30);

    // Player 1 ability gems (Slot 1 & Slot 2)
    const p1Skills = [s1.skill1 || 'dash', s1.skill2 || ''];
    const p1Cds = [s1.cd1 || 0, s1.cd2 || 0];
    const p1CdMax = [s1.cd1max || 3, s1.cd2max || 5];

    // Player 2 ability gems (Slot 1 & Slot 2)
    const p2Skills = [s2.skill1 || 'dash', s2.skill2 || ''];
    const p2Cds = [s2.cd1 || 0, s2.cd2 || 0];
    const p2CdMax = [s2.cd1max || 3, s2.cd2max || 5];

    // Keep bottom controls guide synced with current equipped skills
    const currentSkillsKey = `${p1Skills.join(',')}_${p2Skills.join(',')}`;
    if (this.lastControlsKey !== currentSkillsKey) {
      this.lastControlsKey = currentSkillsKey;
      this.buildControlsGuide(p1Skills as [string, string], p2Skills as [string, string]);
    }

    [0, 1].forEach(j => {
      const g = j === 0 ? this.g1a : this.g1b;
      const id = p1Skills[j] as AbilityId;
      if (!id || !ABILITIES[id]) {
        g.style.display = 'none';
        return;
      }
      g.style.display = '';

      const sd = ABILITIES[id];
      const tag = '1' + (j ? 'b' : 'a');
      const gi = j === 0 ? this.gi1a : this.gi1b;
      const cdEl = j === 0 ? this.gcd1a : this.gcd1b;
      const kbEl = j === 0 ? this.gkb1a : this.gkb1b;
      const bindCode = j === 0 ? kb.p1.s1 : kb.p1.s2;

      if (this.gemSeen[tag] !== sd.id) {
        this.gemSeen[tag] = sd.id;
        (gi as HTMLImageElement).src = `/abilities/${sd.id}.png`;
        (gi as HTMLImageElement).alt = sd.name;
        g.title = `${sd.name} (${keyLabel(bindCode)})${sd.use === 'hang' ? ' - only while dangling' : ''}`;
        g.setAttribute('aria-label', sd.name);
      }

      if (kbEl) {
        kbEl.textContent = keyLabel(bindCode);
      }

      const usable = (sd.use === 'hang') === !!s1.hang;
      const cd = p1Cds[j];
      const max = p1CdMax[j] || sd.cd || 1;
      const pct = Math.max(0, Math.min(100, 100 * cd / max));
      g.style.setProperty('--cd', `${pct.toFixed(1)}%`);
      g.classList.toggle('ready', cd <= 0 && usable);
      g.classList.toggle('off', !usable);

      if (cdEl) {
        cdEl.textContent = cd > 0.1 ? (cd >= 10 ? Math.ceil(cd).toString() : cd.toFixed(1)) : '';
      }
    });

    [0, 1].forEach(j => {
      const g = j === 0 ? this.g2a : this.g2b;
      const id = p2Skills[j] as AbilityId;
      if (!id || !ABILITIES[id]) {
        g.style.display = 'none';
        return;
      }
      g.style.display = '';

      const sd = ABILITIES[id];
      const tag = '2' + (j ? 'b' : 'a');
      const gi = j === 0 ? this.gi2a : this.gi2b;
      const cdEl = j === 0 ? this.gcd2a : this.gcd2b;
      const kbEl = j === 0 ? this.gkb2a : this.gkb2b;
      const bindCode = j === 0 ? kb.p2.s1 : kb.p2.s2;
      const human = this.gameMode === '2p';

      if (this.gemSeen[tag] !== sd.id) {
        this.gemSeen[tag] = sd.id;
        (gi as HTMLImageElement).src = `/abilities/${sd.id}.png`;
        (gi as HTMLImageElement).alt = sd.name;
        g.title = `${sd.name}${human ? ` (${keyLabel(bindCode)})` : ''}${sd.use === 'hang' ? ' - only while dangling' : ''}`;
      }

      if (kbEl) {
        kbEl.textContent = human ? keyLabel(bindCode) : '';
        kbEl.style.display = human ? 'block' : 'none';
      }

      const usable = (sd.use === 'hang') === !!s2.hang;
      const cd = p2Cds[j];
      const max = p2CdMax[j] || sd.cd || 1;
      const pct = Math.max(0, Math.min(100, 100 * cd / max));
      g.style.setProperty('--cd', `${pct.toFixed(1)}%`);
      g.classList.toggle('ready', cd <= 0 && usable);
      g.classList.toggle('off', !usable);

      if (cdEl) {
        cdEl.textContent = cd > 0.1 ? (cd >= 10 ? Math.ceil(cd).toString() : cd.toFixed(1)) : '';
      }
    });

    // Round wins pips
    const pipsEl1 = this.pips1.children;
    for (let j = 0; j < pipsEl1.length; j++) {
      pipsEl1[j].classList.toggle('on', j < (s1.wins || 0));
    }
    const pipsEl2 = this.pips2.children;
    for (let k = 0; k < pipsEl2.length; k++) {
      pipsEl2[k].classList.toggle('on', k < (s2.wins || 0));
    }

    const roundText = `Round ${state.round || 1}`;
    if (this.roundLbl.textContent !== roundText) {
      this.roundLbl.textContent = roundText;
    }

    // Round timer countdown (60s per round)
    const timerVal = typeof state.roundTimer === 'number' ? state.roundTimer : state.matchTimer;
    if (this.hudTimer && typeof timerVal === 'number') {
      const t = Math.max(0, Math.ceil(timerVal));
      const str = String(t);
      if (this.hudTimer.textContent !== str) {
        this.hudTimer.textContent = str;
      }
      this.hudTimer.classList.toggle('urgent', t <= 15);
      this.hudTimer.classList.toggle('critical', t <= 5);
    }
  }

  /* ---------- MODALS & OVERLAYS ---------- */
  public showModal(title: string, sub: string, buttons: Array<{ label: string; primary?: boolean; onClick: () => void }>, extraHtml?: string) {
    if (this.inGameMenuModal) this.inGameMenuModal.hidden = true;
    this.ovTitle.textContent = title;
    this.ovSub.textContent = sub;
    if (extraHtml) {
      const extraDiv = document.createElement('div');
      extraDiv.className = 'ov-extra';
      extraDiv.innerHTML = extraHtml;
      this.ovSub.appendChild(extraDiv);
    }
    this.ovBtns.innerHTML = '';

    buttons.forEach((b) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `btn ${b.primary ? 'primary' : 'ghost'}`;
      btn.textContent = b.label;
      btn.addEventListener('click', b.onClick);
      this.ovBtns.appendChild(btn);
    });

    this.overlay.hidden = false;
  }

  public hideModal() {
    this.overlay.hidden = true;
  }

  public openInGameMenu() {
    if (this.isDraftOpen) return;
    const isOnline = this.gameMode === 'online';
    if (!isOnline) {
      this.isPaused = true;
      this.callbacks.onPauseToggle(true);
      sound.music.stop();
      this.igmTitle.textContent = 'Game Paused';
      this.igmSubtitle.textContent = 'Match paused. Adjust settings or quit.';
    } else {
      this.igmTitle.textContent = 'Game Menu';
      this.igmSubtitle.textContent = 'Match in progress (online matches cannot be paused).';
    }

    const st = getSettings();
    this.updateIgmSettingsUi(st);
    this.inGameMenuModal.hidden = false;
  }

  public closeInGameMenu() {
    this.inGameMenuModal.hidden = true;
    const isOnline = this.gameMode === 'online';
    if (!isOnline && this.isPaused) {
      this.isPaused = false;
      this.callbacks.onPauseToggle(false);
      const st = getSettings();
      if (st.music) sound.music.play('duel');
    }
  }

  private updateIgmSettingsUi(st: ReturnType<typeof getSettings>) {
    this.igmSfxToggle.textContent = st.sfx ? 'ON' : 'OFF';
    this.igmSfxToggle.classList.toggle('active', !!st.sfx);

    this.igmMusicToggle.textContent = st.music ? 'ON' : 'OFF';
    this.igmMusicToggle.classList.toggle('active', !!st.music);
  }

  public togglePause() {
    if (!this.inGameMenuModal.hidden) {
      this.closeInGameMenu();
    } else {
      this.openInGameMenu();
    }
  }
}
