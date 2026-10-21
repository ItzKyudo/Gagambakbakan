import { sound } from '../audio';
import { ABILITIES, type AbilityId } from '../game/abilities';
import { getKeys, keyLabel, getColor, getLooks } from '../gb';

export interface GamePageCallbacks {
  onBackToMenu: () => void;
  onPauseToggle: (isPaused: boolean) => void;
  onRematch: () => void;
  onAbilityTrigger: (slot: number) => void; // 0 = Slot 1, 1 = Slot 2
  onTouchInput: (key: 'left' | 'right' | 'strike' | 'block' | 'reel', active: boolean) => void;
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
  private overlay!: HTMLElement;
  private ovTitle!: HTMLElement;
  private ovSub!: HTMLElement;
  private ovBtns!: HTMLElement;

  // Draft modal
  private pickModal!: HTMLElement;
  private pkWho!: HTMLElement;
  private pkTitle!: HTMLElement;
  private pkSub!: HTMLElement;
  private pkCards!: HTMLElement;
  private pkCount!: HTMLElement;
  private pkGo!: HTMLButtonElement;
  private pkMenuBtn!: HTMLButtonElement;
  private selectedDraftSlots: number[] = [];
  private currentDraftOffer: AbilityId[] = [];
  private draftConfirmCallback: ((skills: string[]) => void) | null = null;
  public isDraftOpen: boolean = false;
  private isDraftLeaving: boolean = false;
  private draftKeyHandler?: (e: KeyboardEvent) => void;

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

          <!-- IN-GAME HUD & STATS (INSIDE & ABOVE THE GAME SCREEN) -->
          <div class="in-game-hud-overlay">
            <header class="in-game-top-bar">
              <div class="in-game-top-left">
                <h1 class="in-game-logo"><span class="a">Gagam</span><span class="j">bakbakan</span></h1>
              </div>
              <div class="in-game-top-right">
                <button class="btn ghost sound-toggle-btn ${sound.enabled ? 'sound-on' : 'sound-off'}" id="btnSoundToggle" type="button">${sound.enabled ? '🔊 Sound On' : '🔇 Sound Off'}</button>
                <button class="btn ghost" id="bPause" type="button">Pause</button>
                <button class="btn ghost" id="btnBackMenu" type="button">Menu</button>
              </div>
            </header>

            <!-- FIGHTER STATS (GRIP & GUARD BARS, NAMES, ROUND) -->
            <section class="hud in-game-hud" id="hud" aria-label="Match status">
              <div class="fighter p1">
                <div class="fhead"><i class="swatch"></i><span id="n1">Amber</span><span class="who" id="w1">You</span><span class="pips" id="pips1"><i class="pip"></i><i class="pip"></i></span></div>
                <div class="meter"><span>Grip</span><div class="bar" id="gb1"><i id="grip1"></i></div></div>
                <div class="meter"><span>Guard</span><div class="bar guard"><i id="guard1"></i></div></div>
              </div>

              <div class="center">
                <div id="roundLbl">Round 1</div>
                <div class="best">First to 2 rounds</div>
              </div>

              <div class="fighter p2">
                <div class="fhead"><i class="swatch"></i><span id="n2">Jade</span><span class="who" id="w2">CPU</span><span class="pips" id="pips2"><i class="pip"></i><i class="pip"></i></span></div>
                <div class="meter"><span>Grip</span><div class="bar" id="gb2"><i id="grip2"></i></div></div>
                <div class="meter"><span>Guard</span><div class="bar guard"><i id="guard2"></i></div></div>
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

          <!-- OVERLAY (PAUSED / ROUND END / MATCH END) -->
          <div class="overlay" id="ov" hidden>
            <h2 id="ovTitle">Paused</h2>
            <p id="ovSub"></p>
            <div class="btns" id="ovBtns"></div>
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
          <div class="pk-foot">
            <span id="pkCount" aria-live="polite">0 of 2 picked</span>
            <button type="button" class="btn primary" id="pkGo" disabled>Confirm</button>
            <button type="button" class="btn ghost" id="pkMenu">Menu</button>
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
    this.overlay = container.querySelector('#ov') as HTMLElement;
    this.ovTitle = container.querySelector('#ovTitle') as HTMLElement;
    this.ovSub = container.querySelector('#ovSub') as HTMLElement;
    this.ovBtns = container.querySelector('#ovBtns') as HTMLElement;

    // Pick modal elements
    this.pickModal = container.querySelector('#pick') as HTMLElement;
    this.pkWho = container.querySelector('#pkWho') as HTMLElement;
    this.pkTitle = container.querySelector('#pkTitle') as HTMLElement;
    this.pkSub = container.querySelector('#pkSub') as HTMLElement;
    this.pkCards = container.querySelector('#pkCards') as HTMLElement;
    this.pkCount = container.querySelector('#pkCount') as HTMLElement;
    this.pkGo = container.querySelector('#pkGo') as HTMLButtonElement;
    this.pkMenuBtn = container.querySelector('#pkMenu') as HTMLButtonElement;

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

    // Sound toggle
    const btnSoundToggle = this.rootElement.querySelector('#btnSoundToggle') as HTMLButtonElement;
    btnSoundToggle.addEventListener('click', () => {
      const isNowOn = sound.toggle();
      btnSoundToggle.textContent = isNowOn ? '🔊 Sound On' : '🔇 Sound Off';
      btnSoundToggle.classList.toggle('sound-on', isNowOn);
      btnSoundToggle.classList.toggle('sound-off', !isNowOn);
      if (isNowOn) {
        sound.playTone(580, 0.08, 'triangle', 0.04, 150);
      }
    });

    // Back to Menu
    const btnBackMenu = this.rootElement.querySelector('#btnBackMenu') as HTMLButtonElement;
    btnBackMenu.addEventListener('click', () => {
      this.callbacks.onBackToMenu();
    });

    this.pkMenuBtn.addEventListener('click', () => {
      this.hideDraftModal();
      this.callbacks.onBackToMenu();
    });

    // Pause button
    const bPause = this.rootElement.querySelector('#bPause') as HTMLButtonElement;
    bPause.addEventListener('click', () => {
      this.togglePause();
    });



    // Touch controls
    this.rootElement.querySelectorAll('.tb[data-t]').forEach((b) => {
      const k = (b as HTMLElement).dataset.t as 'left' | 'right' | 'strike' | 'block' | 'reel';
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

    // Keyboard numbers 1, 2, 3 in draft
    this.draftKeyHandler = (e) => {
      if (!this.isDraftOpen || this.isDraftLeaving) return;
      const m = /^(?:Digit|Numpad)([1-3])$/.exec(e.code);
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
  }

  public destroy() {
    if (this.draftKeyHandler) window.removeEventListener('keydown', this.draftKeyHandler);
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
      this.pkSub.textContent = `Choose 2 of these ${choices.length} cards. You keep them for the whole match. Press 1, 2 or 3 to choose.`;
      this.selectedDraftSlots = [];
    }

    this.pkCards.innerHTML = '';

    this.currentDraftOffer.forEach((id, k) => {
      const s = ABILITIES[id as AbilityId] || ABILITIES.dash;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'skill card-pick';
      btn.setAttribute('aria-pressed', this.selectedDraftSlots.includes(k) ? 'true' : 'false');
      btn.style.setProperty('--i', String(k));

      btn.innerHTML = `
        <span class="num">${k + 1}</span>
        <span class="pgem">
          <img src="/abilities/${s.id}.png" alt="${s.name}" class="card-icon-img" style="width:100%;height:100%;object-fit:contain;filter:drop-shadow(0 6px 14px rgba(0,0,0,0.65));" />
        </span>
        <div>
          <h3>${s.name}</h3>
          <div class="meta">${s.cd}s cooldown · ${s.use === 'hang' ? 'while dangling' : 'while clinging'} · <span style="color:var(--amber-light); font-weight:700;">Lvl ${s.unlock.level}</span></div>
        </div>
        <p class="desc">${s.desc}</p>
      `;

      btn.addEventListener('click', () => {
        this.toggleCard(k);
      });
      btn.addEventListener('pointerenter', (e) => {
        if ((e as PointerEvent).pointerType === 'mouse') {
          sound.playTone(900, 0.04, 'triangle', 0.02);
        }
      });

      this.pkCards.appendChild(btn);
    });

    this.syncPickUI();
    this.pickModal.classList.remove('leave');
    this.pickModal.hidden = false;

    // Trigger deal animation
    requestAnimationFrame(() => {
      void this.pkCards.offsetWidth;
      Array.from(this.pkCards.children).forEach(c => c.classList.add('deal'));
      [0, 1, 2].forEach(k => {
        setTimeout(() => {
          sound.playTone(220 + k * 70, 0.3, 'sawtooth', 0.025, 520);
        }, 80 + k * 120);
      });
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
    }

    this.syncPickUI();
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
    this.isDraftLeaving = true;
    sound.play('card_confirm');

    this.pickModal.classList.add('leave');
    const chosen = this.selectedDraftSlots.map(k => this.currentDraftOffer[k]);
    const cb = this.draftConfirmCallback;

    setTimeout(() => {
      this.isDraftLeaving = false;
      this.pickModal.classList.remove('leave');
      this.hideDraftModal();
      if (cb) cb(chosen);
    }, 400);
  }

  public hideDraftModal() {
    this.isDraftOpen = false;
    this.isDraftLeaving = false;
    this.pickModal.hidden = true;
    this.selectedDraftSlots = [];
    this.draftConfirmCallback = null;
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
  }

  /* ---------- MODALS & OVERLAYS ---------- */
  public showModal(title: string, sub: string, buttons: Array<{ label: string; primary?: boolean; onClick: () => void }>, extraHtml?: string) {
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

  public togglePause() {
    this.isPaused = !this.isPaused;
    this.callbacks.onPauseToggle(this.isPaused);
    if (this.isPaused) {
      sound.music.stop();
      this.showModal('Paused', 'Take a breath.', [
        { label: 'Resume', primary: true, onClick: () => this.togglePause() },
        { label: 'Menu', onClick: () => this.callbacks.onBackToMenu() }
      ]);
    } else {
      sound.music.play('duel');
      this.hideModal();
    }
  }
}
