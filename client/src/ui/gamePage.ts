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

  private g1a!: HTMLElement;
  private g1b!: HTMLElement;
  private g2a!: HTMLElement;
  private g2b!: HTMLElement;
  private gi1a!: HTMLElement;
  private gi1b!: HTMLElement;
  private gi2a!: HTMLElement;
  private gi2b!: HTMLElement;

  // Key guide references
  private kp1!: HTMLElement;
  private kp2!: HTMLElement;
  private ctlBody!: HTMLElement;
  private bToggleCtl!: HTMLButtonElement;

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

      <div class="wrap">
        <!-- TOP HEADER -->
        <header class="top">
          <h1><span class="a">Gagam</span><span class="j">bakbakan</span></h1>
          <div style="display:flex; align-items:center; gap:8px;">
            <span id="roomBadge" class="status-badge" style="display:none;"><span class="status-dot"></span> <span id="roomCodeText"></span></span>
            <button class="btn ghost" id="btnSoundToggle" type="button">${sound.enabled ? '🔊 Sound On' : '🔇 Sound Off'}</button>
            <button class="btn ghost" id="btnBackMenu" type="button">Menu</button>
          </div>
        </header>

        <!-- HUD STRIP -->
        <section class="hud" id="hud" aria-label="Match status">
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

        <!-- ARENA -->
        <div class="arena" id="arena">
          <div id="phaserContainer" style="width:100%; height:100%;"></div>

          <!-- AMBER ABILITIES RAIL (BOTTOM LEFT) -->
          <div class="rail l p1" aria-label="Amber skills">
            <button class="gem" id="g1a" data-slot="0" tabindex="-1" type="button" aria-label="Skill 1">
              <svg class="shape bg" viewBox="0 0 100 100" aria-hidden="true"><polygon points="50,3 91,26.5 91,73.5 50,97 9,73.5 9,26.5"/></svg>
              <svg class="shape fill" viewBox="0 0 100 100" aria-hidden="true"><polygon points="50,3 91,26.5 91,73.5 50,97 9,73.5 9,26.5"/></svg>
              <svg class="glyph" id="gi1a" aria-hidden="true"><use href="#ic-dash"/></svg>
            </button>
            <button class="gem" id="g1b" data-slot="1" tabindex="-1" type="button" aria-label="Skill 2">
              <svg class="shape bg" viewBox="0 0 100 100" aria-hidden="true"><polygon points="50,3 91,26.5 91,73.5 50,97 9,73.5 9,26.5"/></svg>
              <svg class="shape fill" viewBox="0 0 100 100" aria-hidden="true"><polygon points="50,3 91,26.5 91,73.5 50,97 9,73.5 9,26.5"/></svg>
              <svg class="glyph" id="gi1b" aria-hidden="true"><use href="#ic-web"/></svg>
            </button>
          </div>

          <!-- JADE ABILITIES RAIL (BOTTOM RIGHT) -->
          <div class="rail r p2" aria-hidden="true">
            <div class="gem" id="g2a">
              <svg class="shape bg" viewBox="0 0 100 100" aria-hidden="true"><polygon points="50,3 91,26.5 91,73.5 50,97 9,73.5 9,26.5"/></svg>
              <svg class="shape fill" viewBox="0 0 100 100" aria-hidden="true"><polygon points="50,3 91,26.5 91,73.5 50,97 9,73.5 9,26.5"/></svg>
              <svg class="glyph" id="gi2a" aria-hidden="true"><use href="#ic-dash"/></svg>
            </div>
            <div class="gem" id="g2b">
              <svg class="shape bg" viewBox="0 0 100 100" aria-hidden="true"><polygon points="50,3 91,26.5 91,73.5 50,97 9,73.5 9,26.5"/></svg>
              <svg class="shape fill" viewBox="0 0 100 100" aria-hidden="true"><polygon points="50,3 91,26.5 91,73.5 50,97 9,73.5 9,26.5"/></svg>
              <svg class="glyph" id="gi2b" aria-hidden="true"><use href="#ic-web"/></svg>
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

        <!-- TOUCH PAD -->
        <div class="touch" id="touch" aria-label="Touch controls">
          <button type="button" class="tb" data-t="left">&#9664;</button>
          <button type="button" class="tb" data-t="right">&#9654;</button>
          <button type="button" class="tb" data-t="strike">Strike</button>
          <button type="button" class="tb" data-t="block">Block</button>
          <button type="button" class="tb wide" data-t="reel">Climb</button>
        </div>

        <!-- CONTROLS STRIP -->
        <section class="ctl" id="ctl" aria-label="Controls">
          <div class="ctl-head">
            <h3>Controls</h3>
            <div class="ctl-btns">
              <button type="button" class="btn ghost" id="bPause">Pause</button>
              <button type="button" class="btn ghost" id="bToggleCtl" aria-expanded="true">Hide controls</button>
            </div>
          </div>
          <div class="ctl-body" id="ctlBody">
            <div class="krow kp1" id="kp1"><span class="kn"><i class="swatch"></i><span id="kn1">Amber</span></span></div>
            <div class="krow kp2" id="kp2" hidden><span class="kn"><i class="swatch"></i><span id="kn2">Jade</span></span></div>
          </div>
        </section>
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

    // Controls
    this.kp1 = container.querySelector('#kp1') as HTMLElement;
    this.kp2 = container.querySelector('#kp2') as HTMLElement;
    this.ctlBody = container.querySelector('#ctlBody') as HTMLElement;
    this.bToggleCtl = container.querySelector('#bToggleCtl') as HTMLButtonElement;

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
      sound.enabled = !sound.enabled;
      btnSoundToggle.textContent = sound.enabled ? '🔊 Sound On' : '🔇 Sound Off';
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

    // Hide/show controls toggle
    let ctlShown = true;
    try {
      ctlShown = localStorage.getItem('gb-controls') !== '0';
    } catch {
      // ignore
    }
    this.setControlsVisible(ctlShown);

    this.bToggleCtl.addEventListener('click', () => {
      this.setControlsVisible(!ctlShown);
      ctlShown = !ctlShown;
      try {
        localStorage.setItem('gb-controls', ctlShown ? '1' : '0');
      } catch {
        // ignore
      }
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
    window.addEventListener('keydown', (e) => {
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
    });
  }

  private setControlsVisible(show: boolean) {
    this.ctlBody.hidden = !show;
    this.bToggleCtl.textContent = show ? 'Hide controls' : 'Show controls';
    this.bToggleCtl.setAttribute('aria-expanded', show ? 'true' : 'false');
  }

  public buildControlsGuide(s1Skills?: [string, string], s2Skills?: [string, string]) {
    const kb = getKeys();
    const looks = getLooks();
    const sk1 = s1Skills || ['dash', 'web'];
    const sk2 = s2Skills || ['dash', 'web'];

    const kbd = (t: string) => {
      const el = document.createElement('kbd');
      el.textContent = t;
      return el;
    };

    const addKeyItem = (row: HTMLElement, parts: HTMLElement[], label?: string) => {
      const sp = document.createElement('span');
      sp.className = 'k';
      parts.forEach(p => sp.appendChild(p));
      if (label) sp.appendChild(document.createTextNode(' ' + label));
      row.appendChild(sp);
    };

    // P1
    while (this.kp1.children.length > 1) this.kp1.removeChild(this.kp1.lastChild!);
    addKeyItem(this.kp1, [kbd(keyLabel(kb.p1.left)), kbd(keyLabel(kb.p1.right))], 'Move');
    addKeyItem(this.kp1, [kbd(keyLabel(kb.p1.strike))], 'Strike');
    addKeyItem(this.kp1, [kbd(keyLabel(kb.p1.block))], 'Block');
    addKeyItem(this.kp1, [kbd(keyLabel(kb.p1.climb))], 'Climb');
    for (let j = 0; j < 2; j++) {
      const id = sk1[j] as AbilityId;
      const sd = ABILITIES[id] || ABILITIES.dash;
      const bind = j === 0 ? kb.p1.s1 : kb.p1.s2;
      const ic = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      ic.setAttribute('class', 'ico');
      ic.innerHTML = `<use href="#${sd.icon}"/>`;
      addKeyItem(this.kp1, [kbd(keyLabel(bind)), ic as any], sd.name);
    }

    // P2
    this.kp2.hidden = this.gameMode !== '2p';
    while (this.kp2.children.length > 1) this.kp2.removeChild(this.kp2.lastChild!);
    addKeyItem(this.kp2, [kbd(keyLabel(kb.p2.left)), kbd(keyLabel(kb.p2.right))], 'Move');
    addKeyItem(this.kp2, [kbd(keyLabel(kb.p2.strike))], 'Strike');
    addKeyItem(this.kp2, [kbd(keyLabel(kb.p2.block))], 'Block');
    addKeyItem(this.kp2, [kbd(keyLabel(kb.p2.climb))], 'Climb');
    for (let j = 0; j < 2; j++) {
      const id = sk2[j] as AbilityId;
      const sd = ABILITIES[id] || ABILITIES.dash;
      const bind = j === 0 ? kb.p2.s1 : kb.p2.s2;
      const ic = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      ic.setAttribute('class', 'ico');
      ic.innerHTML = `<use href="#${sd.icon}"/>`;
      addKeyItem(this.kp2, [kbd(keyLabel(bind)), ic as any], sd.name);
    }

    // Apply looks styling
    const c1 = getColor(looks.p1.color);
    const c2 = getColor(looks.p2.color);
    this.rootElement.querySelectorAll<HTMLElement>('.p1,.kp1').forEach(e => e.style.setProperty('--c', c1.main));
    this.rootElement.querySelectorAll<HTMLElement>('.p2,.kp2').forEach(e => e.style.setProperty('--c', c2.main));
  }

  /* ---------- CARD PICK MODAL (Fanned cards, 3 draw keep 2) ---------- */
  public showDraftModal(
    choices: string[],
    round: number,
    playerName: string,
    onConfirm: (skills: string[]) => void
  ) {
    this.isDraftLeaving = false;
    this.isDraftOpen = true;
    this.selectedDraftSlots = [];
    this.currentDraftOffer = choices as AbilityId[];
    this.draftConfirmCallback = onConfirm;

    this.pkWho.textContent = `${playerName} · Round ${round}`;
    this.pkWho.style.setProperty('--c', 'var(--amber)');
    this.pkTitle.textContent = 'Pick 2 skills';
    this.pkSub.textContent = 'Choose 2 of these 3 cards. You keep them for the whole match. Press 1, 2 or 3 to choose.';
    this.pkCards.innerHTML = '';

    choices.forEach((id, k) => {
      const s = ABILITIES[id as AbilityId] || ABILITIES.dash;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'skill card-pick';
      btn.setAttribute('aria-pressed', 'false');
      btn.style.setProperty('--i', String(k));

      btn.innerHTML = `
        <span class="num">${k + 1}</span>
        <span class="pgem">
          <svg class="shape" viewBox="0 0 100 100" aria-hidden="true">
            <polygon points="50,3 91,26.5 91,73.5 50,97 9,73.5 9,26.5"/>
          </svg>
          <svg class="glyph" aria-hidden="true"><use href="#${s.icon}"/></svg>
        </span>
        <div>
          <h3>${s.name}</h3>
          <div class="meta">${s.cd}s cooldown · ${s.use === 'hang' ? 'while dangling' : 'while clinging'}</div>
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

  private toggleCard(k: number) {
    if (this.isDraftLeaving) return;
    const ix = this.selectedDraftSlots.indexOf(k);
    if (ix >= 0) {
      this.selectedDraftSlots.splice(ix, 1);
      sound.play('card_deselect');
    } else {
      if (this.selectedDraftSlots.length >= 2) {
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
    Array.from(this.pkCards.children).forEach((c, k) => {
      c.setAttribute('aria-pressed', this.selectedDraftSlots.includes(k) ? 'true' : 'false');
    });
    this.pkCount.textContent = `${this.selectedDraftSlots.length} of 2 picked`;
    this.pkGo.disabled = this.selectedDraftSlots.length !== 2;
  }

  private confirmPick() {
    if (this.selectedDraftSlots.length !== 2 || this.isDraftLeaving) return;
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
    if (mode === 'online') {
      this.w1.textContent = myId === 0 ? 'You' : 'Opponent';
      this.w2.textContent = myId === 1 ? 'You' : 'Opponent';
      this.kp2.hidden = true;
    } else if (mode === 'cpu') {
      this.w1.textContent = 'You';
      this.w2.textContent = `CPU · ${diff}`;
      this.kp2.hidden = true;
    } else {
      this.w1.textContent = 'Player 1';
      this.w2.textContent = 'Player 2';
      this.kp2.hidden = false;
    }
  }

  public setRoomCode(code: string) {
    const badge = this.rootElement.querySelector('#roomBadge') as HTMLElement;
    const codeText = this.rootElement.querySelector('#roomCodeText') as HTMLElement;
    if (code) {
      badge.style.display = 'inline-flex';
      codeText.textContent = `Room: ${code}`;
    } else {
      badge.style.display = 'none';
    }
  }

  /* ---------- HUD UPDATES & ABILITY GEMS ---------- */
  public updateHud(state: any) {
    if (!state || !state.p1 || !state.p2) return;

    const s1 = state.p1;
    const s2 = state.p2;
    const kb = getKeys();

    if (s1.name && this.n1.textContent !== s1.name) this.n1.textContent = s1.name;
    if (s2.name && this.n2.textContent !== s2.name) this.n2.textContent = s2.name;

    // Grip & Guard meters
    this.grip1.style.width = `${Math.max(0, Math.min(100, s1.grip))}%`;
    this.guard1.style.width = `${Math.max(0, Math.min(100, s1.guard))}%`;
    this.gb1.classList.toggle('low', s1.grip < 30);

    this.grip2.style.width = `${Math.max(0, Math.min(100, s2.grip))}%`;
    this.guard2.style.width = `${Math.max(0, Math.min(100, s2.guard))}%`;
    this.gb2.classList.toggle('low', s2.grip < 30);

    // Player 1 ability gems (Slot 1 & Slot 2)
    const p1Skills = [s1.skill1 || 'dash', s1.skill2 || 'web'];
    const p1Cds = [s1.cd1 || 0, s1.cd2 || 0];
    const p1CdMax = [s1.cd1max || 3, s1.cd2max || 5];

    [0, 1].forEach(j => {
      const id = p1Skills[j] as AbilityId;
      const sd = ABILITIES[id] || ABILITIES.dash;
      const tag = '1' + (j ? 'b' : 'a');
      const g = j === 0 ? this.g1a : this.g1b;
      const gi = j === 0 ? this.gi1a : this.gi1b;

      if (this.gemSeen[tag] !== sd.id) {
        this.gemSeen[tag] = sd.id;
        gi.firstElementChild?.setAttribute('href', `#${sd.icon}`);
        const bindCode = j === 0 ? kb.p1.s1 : kb.p1.s2;
        g.title = `${sd.name} (${keyLabel(bindCode)})${sd.use === 'hang' ? ' - only while dangling' : ''}`;
        g.setAttribute('aria-label', sd.name);
      }

      const usable = (sd.use === 'hang') === !!s1.hang;
      const cd = p1Cds[j];
      const max = p1CdMax[j] || sd.cd || 1;
      g.style.setProperty('--cd', `${Math.max(0, Math.min(100, 100 * cd / max)).toFixed(1)}%`);
      g.classList.toggle('ready', cd <= 0 && usable);
      g.classList.toggle('off', !usable);
    });

    // Player 2 ability gems (Slot 1 & Slot 2)
    const p2Skills = [s2.skill1 || 'dash', s2.skill2 || 'web'];
    const p2Cds = [s2.cd1 || 0, s2.cd2 || 0];
    const p2CdMax = [s2.cd1max || 3, s2.cd2max || 5];

    [0, 1].forEach(j => {
      const id = p2Skills[j] as AbilityId;
      const sd = ABILITIES[id] || ABILITIES.dash;
      const tag = '2' + (j ? 'b' : 'a');
      const g = j === 0 ? this.g2a : this.g2b;
      const gi = j === 0 ? this.gi2a : this.gi2b;

      if (this.gemSeen[tag] !== sd.id) {
        this.gemSeen[tag] = sd.id;
        gi.firstElementChild?.setAttribute('href', `#${sd.icon}`);
        const bindCode = j === 0 ? kb.p2.s1 : kb.p2.s2;
        const human = this.gameMode === '2p';
        g.title = `${sd.name}${human ? ` (${keyLabel(bindCode)})` : ''}${sd.use === 'hang' ? ' - only while dangling' : ''}`;
      }

      const usable = (sd.use === 'hang') === !!s2.hang;
      const cd = p2Cds[j];
      const max = p2CdMax[j] || sd.cd || 1;
      g.style.setProperty('--cd', `${Math.max(0, Math.min(100, 100 * cd / max)).toFixed(1)}%`);
      g.classList.toggle('ready', cd <= 0 && usable);
      g.classList.toggle('off', !usable);
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
  public showModal(title: string, sub: string, buttons: Array<{ label: string; primary?: boolean; onClick: () => void }>) {
    this.ovTitle.textContent = title;
    this.ovSub.textContent = sub;
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
