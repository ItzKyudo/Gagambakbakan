import { ABILITIES, SKILLS_LIST, type AbilityId, shuffle } from './game/abilities';

export interface SpiderColor {
  id: string;
  label: string;
  main: string;
  dark: string;
  light: string;
}

export interface SpiderLook {
  name: string;
  color: string;
  pattern: string;
  acc: string;
}

export interface GameSettings {
  sfx: boolean;
  sfxVol: number;
  music: boolean;
  musicVol: number;
  diff: 'easy' | 'normal' | 'hard';
}

export interface KeyBindings {
  left: string;
  right: string;
  strike: string;
  block: string;
  climb: string;
  s1: string;
  s2: string;
}

export interface PlayerKeys {
  p1: KeyBindings;
  p2: KeyBindings;
}

export interface ProgressData {
  played: number;
  wins: number;
  unlockAll: boolean;
}

const PFX = 'gb-';

function lsGet<T>(k: string, d: T): T {
  try {
    const v = localStorage.getItem(PFX + k);
    return v === null ? d : JSON.parse(v);
  } catch {
    return d;
  }
}

function lsSet<T>(k: string, v: T): void {
  try {
    localStorage.setItem(PFX + k, JSON.stringify(v));
  } catch {
    // storage is optional
  }
}

/* ---------- settings ---------- */
export const DEF_SET: GameSettings = {
  sfx: true,
  sfxVol: 0.7,
  music: true,
  musicVol: 0.5,
  diff: 'normal'
};

export function getSettings(): GameSettings {
  const s = lsGet<Partial<GameSettings>>('settings', {}) || {};
  const o: GameSettings = {
    sfx: typeof s.sfx === 'boolean' ? s.sfx : DEF_SET.sfx,
    sfxVol: typeof s.sfxVol === 'number' ? s.sfxVol : DEF_SET.sfxVol,
    music: typeof s.music === 'boolean' ? s.music : DEF_SET.music,
    musicVol: typeof s.musicVol === 'number' ? s.musicVol : DEF_SET.musicVol,
    diff: (s.diff === 'easy' || s.diff === 'normal' || s.diff === 'hard') ? s.diff : DEF_SET.diff
  };
  o.sfxVol = Math.max(0, Math.min(1, o.sfxVol));
  o.musicVol = Math.max(0, Math.min(1, o.musicVol));
  return o;
}

export function saveSettings(o: GameSettings): void {
  lsSet('settings', o);
}

export function getMode(): 'cpu' | '2p' {
  const m = lsGet<string>('mode', 'cpu');
  return m === '2p' ? '2p' : 'cpu';
}

export function setMode(m: 'cpu' | '2p'): void {
  lsSet('mode', m === '2p' ? '2p' : 'cpu');
}

/* ---------- spider looks ---------- */
export const COLORS: SpiderColor[] = [
  { id: 'amber', label: 'Amber', main: '#f2a33a', dark: '#8f4f14', light: '#ffd694' },
  { id: 'jade', label: 'Jade', main: '#4cc7b2', dark: '#1d6a64', light: '#b0f2e3' },
  { id: 'ruby', label: 'Ruby', main: '#e4584f', dark: '#7e2220', light: '#ffb3a8' },
  { id: 'violet', label: 'Violet', main: '#a77bf0', dark: '#512f94', light: '#d9c5ff' },
  { id: 'azure', label: 'Azure', main: '#5aa9f0', dark: '#1f4e8c', light: '#bfe0ff' },
  { id: 'lime', label: 'Lime', main: '#9ccc3c', dark: '#4a6a14', light: '#dcf5a0' },
  { id: 'rose', label: 'Rose', main: '#ec7fb2', dark: '#8a2f5c', light: '#ffc7df' },
  { id: 'bone', label: 'Bone', main: '#d9d2bd', dark: '#6c654f', light: '#f5f1e4' },
  { id: 'obsidian', label: 'Obsidian', main: '#34495e', dark: '#1a252f', light: '#5d6d7e' },
  { id: 'gold', label: 'Solar Gold', main: '#f1c40f', dark: '#967204', light: '#fef5b8' },
  { id: 'cyan', label: 'Electric Cyan', main: '#00cec9', dark: '#007a77', light: '#81ecec' },
  { id: 'coral', label: 'Coral', main: '#ff7675', dark: '#a52a2a', light: '#fab1a0' },
  { id: 'toxic', label: 'Toxic Slime', main: '#2ed573', dark: '#126b36', light: '#7bed9f' },
  { id: 'crimson', label: 'Crimson', main: '#b71540', dark: '#5e0b21', light: '#e55039' },
  { id: 'pearl', label: 'Moon Pearl', main: '#dff9fb', dark: '#778ca3', light: '#ffffff' },
  { id: 'midnight', label: 'Midnight', main: '#4834d4', dark: '#1e146e', light: '#8c7ae6' }
];

export const PATTERNS: [string, string][] = [
  ['stripes', 'Stripes'],
  ['dots', 'Dots'],
  ['chevron', 'Chevrons'],
  ['rings', 'Rings'],
  ['cross', 'Cross'],
  ['split', 'Split'],
  ['webmark', 'Web Lattice'],
  ['diamonds', 'Diamonds'],
  ['plain', 'Plain']
];

export const ACCS: [string, string][] = [
  ['none', 'None'],
  ['band', 'Headband'],
  ['crown', 'Crown'],
  ['horns', 'Horns'],
  ['goggles', 'Goggles'],
  ['halo', 'Halo'],
  ['mohawk', 'Mohawk'],
  ['mask', 'Ninja Mask'],
  ['tophat', 'Top Hat']
];

export const DEF_LOOK: { p1: SpiderLook; p2: SpiderLook } = {
  p1: { name: 'Amber', color: 'amber', pattern: 'stripes', acc: 'none' },
  p2: { name: 'Jade', color: 'jade', pattern: 'stripes', acc: 'none' }
};

export function getColor(id: string): SpiderColor {
  for (let i = 0; i < COLORS.length; i++) {
    if (COLORS[i].id === id) return COLORS[i];
  }
  return COLORS[0];
}

function hasOption(list: [string, string][], id: string): boolean {
  return list.some(x => x[0] === id);
}

function cleanLook(v: any, d: SpiderLook): SpiderLook {
  v = v || {};
  const o: SpiderLook = {
    name: typeof v.name === 'string' ? v.name.replace(/[<>&"]/g, '').trim().slice(0, 10) : d.name,
    color: COLORS.some(c => c.id === v.color) ? v.color : d.color,
    pattern: hasOption(PATTERNS, v.pattern) ? v.pattern : d.pattern,
    acc: hasOption(ACCS, v.acc) ? v.acc : d.acc
  };
  if (!o.name) o.name = getColor(o.color).label;
  return o;
}

export function getLooks(): { p1: SpiderLook; p2: SpiderLook } {
  const l = lsGet<any>('looks', {}) || {};
  return { p1: cleanLook(l.p1, DEF_LOOK.p1), p2: cleanLook(l.p2, DEF_LOOK.p2) };
}

export function saveLooks(l: { p1: SpiderLook; p2: SpiderLook }): void {
  lsSet('looks', l);
}

export function randomLook(): SpiderLook {
  const c = COLORS[Math.floor(Math.random() * COLORS.length)];
  return {
    name: c.label,
    color: c.id,
    pattern: PATTERNS[Math.floor(Math.random() * PATTERNS.length)][0],
    acc: ACCS[Math.floor(Math.random() * ACCS.length)][0]
  };
}

export function spiderSVGraw(look: SpiderLook): string {
  const c = getColor(look.color);
  const OUT = 'rgba(8,16,15,.78)';
  let legs = '';
  let far = '';

  for (let i = 0; i < 4; i++) {
    const hx = 66 + i * 20;
    const fx = 52 + i * 30;
    const kx = (hx + fx) / 2 + (i < 2 ? -16 : 16);
    legs += `<path d="M${hx} 114 Q${kx} 78 ${fx} 146" />`;
    far += `<path d="M${hx + 8} 112 Q${kx + 10} 82 ${fx + 14} 146" />`;
  }

  let pat = '';
  if (look.pattern === 'stripes') {
    [72, 88, 104].forEach(x => {
      pat += `<rect x="${x}" y="60" width="9" height="76" fill="rgba(20,12,6,.36)"/>`;
    });
  } else if (look.pattern === 'dots') {
    [[74, 88], [90, 106], [104, 90], [86, 76], [112, 108], [68, 108]].forEach(p => {
      pat += `<circle cx="${p[0]}" cy="${p[1]}" r="5.5" fill="rgba(20,12,6,.36)"/>`;
    });
  } else if (look.pattern === 'chevron') {
    [70, 86, 102].forEach(x => {
      pat += `<polyline points="${x - 9},72 ${x + 3},98 ${x - 9},124" fill="none" stroke="rgba(20,12,6,.36)" stroke-width="7" stroke-linejoin="round"/>`;
    });
  } else if (look.pattern === 'rings') {
    pat += `<ellipse cx="90" cy="98" rx="12" ry="9" fill="none" stroke="rgba(20,12,6,.36)" stroke-width="5.5"/>` +
      `<ellipse cx="90" cy="98" rx="24" ry="18" fill="none" stroke="rgba(20,12,6,.36)" stroke-width="5.5"/>` +
      `<ellipse cx="90" cy="98" rx="36" ry="27" fill="none" stroke="rgba(20,12,6,.36)" stroke-width="5.5"/>` +
      `<circle cx="90" cy="98" r="4.5" fill="rgba(20,12,6,.36)"/>`;
  } else if (look.pattern === 'cross') {
    pat += `<rect x="85" y="60" width="10" height="76" rx="3" fill="rgba(20,12,6,.36)"/>` +
      `<rect x="60" y="93" width="60" height="10" rx="3" fill="rgba(20,12,6,.36)"/>` +
      `<circle cx="90" cy="98" r="11" fill="rgba(20,12,6,.36)"/>`;
  } else if (look.pattern === 'split') {
    pat += `<rect x="40" y="60" width="100" height="38" fill="rgba(20,12,6,.36)"/>` +
      `<line x1="44" y1="98" x2="136" y2="98" stroke="rgba(20,12,6,.5)" stroke-width="5"/>`;
  } else if (look.pattern === 'webmark') {
    for (let a = 0; a < 8; a++) {
      const rad = a * Math.PI / 4;
      const x2 = 90 + Math.cos(rad) * 46;
      const y2 = 98 + Math.sin(rad) * 36;
      pat += `<line x1="90" y1="98" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="rgba(20,12,6,.36)" stroke-width="3"/>`;
    }
    [14, 26, 38].forEach(r => {
      let pts = '';
      for (let a = 0; a <= 8; a++) {
        const rad = a * Math.PI / 4;
        pts += `${(90 + Math.cos(rad) * r).toFixed(1)},${(98 + Math.sin(rad) * (r * 0.78)).toFixed(1)} `;
      }
      pat += `<polygon points="${pts.trim()}" fill="none" stroke="rgba(20,12,6,.36)" stroke-width="2.8"/>`;
    });
  } else if (look.pattern === 'diamonds') {
    [66, 90, 114].forEach(x => {
      pat += `<polygon points="${x},76 ${x + 11},98 ${x},120 ${x - 11},98" fill="rgba(20,12,6,.36)"/>`;
    });
  }

  let acc = '';
  if (look.acc === 'band') {
    acc = `<path d="M128 80 Q150 70 172 80" fill="none" stroke="#e8593f" stroke-width="7" stroke-linecap="round"/><path d="M128 80 L110 76 M128 80 L112 88" stroke="#e8593f" stroke-width="4" stroke-linecap="round"/>`;
  } else if (look.acc === 'crown') {
    acc = `<path d="M133 72 L133 54 L142 63 L150 49 L158 63 L167 54 L167 72 Z" fill="#ffd34d" stroke="${OUT}" stroke-width="2.4" stroke-linejoin="round"/>`;
  } else if (look.acc === 'horns') {
    acc = `<path d="M130 78 L134 54 L146 72 Z M170 78 L166 54 L154 72 Z" fill="#f4efe0" stroke="${OUT}" stroke-width="2.2" stroke-linejoin="round"/>`;
  } else if (look.acc === 'goggles') {
    acc = `<path d="M126 86 Q150 77 174 86" fill="none" stroke="#5d4037" stroke-width="4.5" stroke-linecap="round"/>` +
      `<ellipse cx="145" cy="80" rx="9" ry="8" fill="#c0a060" stroke="${OUT}" stroke-width="2"/>` +
      `<ellipse cx="145" cy="80" rx="6.5" ry="5.5" fill="#00cec9"/>` +
      `<circle cx="143" cy="78" r="1.8" fill="#ffffff"/>` +
      `<ellipse cx="163" cy="84" rx="9.5" ry="8" fill="#c0a060" stroke="${OUT}" stroke-width="2"/>` +
      `<ellipse cx="163" cy="84" rx="7" ry="5.5" fill="#00cec9"/>` +
      `<circle cx="161" cy="82" r="1.8" fill="#ffffff"/>` +
      `<path d="M153 81 Q155 78 157 82" fill="none" stroke="#c0a060" stroke-width="3" stroke-linecap="round"/>`;
  } else if (look.acc === 'halo') {
    acc = `<ellipse cx="150" cy="56" rx="22" ry="7" fill="none" stroke="#ffeaa7" stroke-width="4.5" stroke-linecap="round"/>` +
      `<ellipse cx="150" cy="56" rx="19" ry="5" fill="none" stroke="#fff9d2" stroke-width="2"/>`;
  } else if (look.acc === 'mohawk') {
    acc = `<polygon points="132,74 135,50 142,70" fill="#ff2d55" stroke="${OUT}" stroke-width="1.8" stroke-linejoin="round"/>` +
      `<polygon points="140,70 146,42 153,68" fill="#ff793f" stroke="${OUT}" stroke-width="1.8" stroke-linejoin="round"/>` +
      `<polygon points="151,68 158,45 164,72" fill="#ff2d55" stroke="${OUT}" stroke-width="1.8" stroke-linejoin="round"/>` +
      `<polygon points="162,72 168,55 172,78" fill="#ff793f" stroke="${OUT}" stroke-width="1.8" stroke-linejoin="round"/>`;
  } else if (look.acc === 'mask') {
    acc = `<path d="M140 88 Q160 84 176 93 L180 108 Q160 112 142 100 Z" fill="#2c3e50" stroke="${OUT}" stroke-width="2" stroke-linejoin="round"/>` +
      `<path d="M147 94 L173 97 M145 100 L170 103" stroke="#e74c3c" stroke-width="2" stroke-linecap="round"/>`;
  } else if (look.acc === 'tophat') {
    acc = `<ellipse cx="148" cy="71" rx="23" ry="5.5" fill="#1e272e" stroke="${OUT}" stroke-width="2"/>` +
      `<path d="M135 69 L138 41 L158 41 L161 69 Z" fill="#2f3542" stroke="${OUT}" stroke-width="2" stroke-linejoin="round"/>` +
      `<path d="M135.5 64 L160.5 64" stroke="#e84118" stroke-width="4.5"/>` +
      `<ellipse cx="148" cy="41" rx="10" ry="3" fill="#1e272e"/>`;
  }

  return `<svg viewBox="0 0 240 180" aria-hidden="true"><defs><radialGradient id="pb" cx=".4" cy=".3" r=".8"><stop offset="0" stop-color="${c.light}"/><stop offset=".5" stop-color="${c.main}"/><stop offset="1" stop-color="${c.dark}"/></radialGradient>` +
    `<radialGradient id="ph" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="${c.main}"/><stop offset="1" stop-color="${c.dark}"/></radialGradient><clipPath id="pc"><ellipse cx="90" cy="98" rx="44" ry="34"/></clipPath></defs>` +
    `<rect x="8" y="146" width="224" height="20" rx="10" fill="#7b5b3e"/><rect x="8" y="146" width="224" height="5" rx="2.5" fill="#a58059"/>` +
    `<g class="bob"><g fill="none" stroke-linecap="round" stroke-linejoin="round"><g stroke="${OUT}" stroke-width="6.4">${far}</g><g stroke="${c.dark}" stroke-width="4">${far}</g></g>` +
    `<ellipse cx="90" cy="98" rx="44" ry="34" fill="url(#pb)"/><g clip-path="url(#pc)">${pat}</g><ellipse cx="90" cy="98" rx="44" ry="34" fill="none" stroke="${OUT}" stroke-width="2.4"/>` +
    `<ellipse cx="150" cy="92" rx="28" ry="23" fill="url(#ph)" stroke="${OUT}" stroke-width="2.4"/>` +
    `<g fill="none" stroke-linecap="round" stroke-linejoin="round"><g stroke="${OUT}" stroke-width="6.4">${legs}</g><g stroke="${c.main}" stroke-width="4">${legs}</g></g>` +
    `<g><circle cx="162" cy="84" r="5.4" fill="#f4f7ee"/><circle cx="163.5" cy="85" r="2.7" fill="#10201f"/><circle cx="151" cy="79" r="4.4" fill="#f4f7ee"/><circle cx="152.5" cy="80" r="2.2" fill="#10201f"/><circle cx="171" cy="94" r="3.8" fill="#f4f7ee"/><circle cx="172" cy="94.6" r="1.9" fill="#10201f"/></g>` +
    `<path d="M174 100 L184 106 L176 108 Z" fill="#10201f"/>${acc}</g></svg>`;
}

export function spiderSVG(look: SpiderLook, u: string = ''): string {
  return spiderSVGraw(look)
    .replace(/id="(pb|ph|pc)"/g, `id="$1${u}"`)
    .replace(/url\(#(pb|ph|pc)\)/g, `url(#$1${u})`);
}

/* ---------- key binds ---------- */
export const ACTIONS: [keyof KeyBindings, string][] = [
  ['left', 'Move left'],
  ['right', 'Move right'],
  ['strike', 'Strike'],
  ['block', 'Block'],
  ['climb', 'Climb (tap)'],
  ['s1', 'Skill 1'],
  ['s2', 'Skill 2']
];

export const DEF_KEYS: PlayerKeys = {
  p1: { left: 'KeyA', right: 'KeyD', strike: 'KeyF', block: 'KeyG', climb: 'Space', s1: 'KeyQ', s2: 'KeyE' },
  p2: { left: 'ArrowLeft', right: 'ArrowRight', strike: 'KeyK', block: 'KeyL', climb: 'Enter', s1: 'Comma', s2: 'Period' }
};

export const RESERVED_KEYS: string[] = ['Escape', 'KeyP', 'KeyH', 'Tab', 'F5', 'F12'];

export function getKeys(): PlayerKeys {
  const saved = lsGet<any>('keys', {}) || {};
  const o: PlayerKeys = {
    p1: { ...DEF_KEYS.p1 },
    p2: { ...DEF_KEYS.p2 }
  };
  (['p1', 'p2'] as const).forEach(p => {
    ACTIONS.forEach(([k]) => {
      const v = saved[p] && saved[p][k];
      if (typeof v === 'string' && v && !RESERVED_KEYS.includes(v)) {
        o[p][k] = v;
      }
    });
  });
  return o;
}

export function saveKeys(k: PlayerKeys): void {
  lsSet('keys', k);
}

export function defaultKeys(): PlayerKeys {
  return JSON.parse(JSON.stringify(DEF_KEYS));
}

const KEY_LABELS: Record<string, string> = {
  Space: 'Space', Enter: 'Enter', ArrowLeft: '←', ArrowRight: '→', ArrowUp: '↑', ArrowDown: '↓',
  Comma: ',', Period: '.', Slash: '/', Semicolon: ';', Quote: "'", BracketLeft: '[', BracketRight: ']', Backslash: '\\',
  Minus: '-', Equal: '=', Backquote: '`', ShiftLeft: 'L-Shift', ShiftRight: 'R-Shift', ControlLeft: 'L-Ctrl', ControlRight: 'R-Ctrl',
  AltLeft: 'L-Alt', AltRight: 'R-Alt', Backspace: 'Backspace', NumpadEnter: 'Num Enter'
};

export function keyLabel(code: string): string {
  if (KEY_LABELS[code]) return KEY_LABELS[code];
  let m = /^Key(.)$/.exec(code);
  if (m) return m[1];
  m = /^Digit(\d)$/.exec(code);
  if (m) return m[1];
  m = /^Numpad(.+)$/.exec(code);
  if (m) return 'Num ' + m[1];
  return code;
}

/* ---------- progress ---------- */
export function getProgress(): ProgressData {
  const p = lsGet<any>('progress', {}) || {};
  return {
    played: p.played | 0,
    wins: p.wins | 0,
    unlockAll: !!p.unlockAll
  };
}

export function saveProgress(p: ProgressData): void {
  lsSet('progress', p);
}

export function isUnlocked(id: AbilityId, p?: ProgressData): boolean {
  const s = ABILITIES[id];
  if (!s) return false;
  p = p || getProgress();
  if (p.unlockAll || s.unlock.t === 'start') return true;
  if (s.unlock.t === 'wins' && s.unlock.n !== undefined) return p.wins >= s.unlock.n;
  if (s.unlock.t === 'played' && s.unlock.n !== undefined) return p.played >= s.unlock.n;
  return false;
}

export function getUnlockNeed(id: AbilityId): { have: number; need: number; text: string } {
  const s = ABILITIES[id];
  const p = getProgress();
  const u = s.unlock;
  if (u.t === 'start') return { have: 1, need: 1, text: 'Unlocked from the start' };
  const n = u.n || 1;
  if (u.t === 'wins') {
    return {
      have: Math.min(p.wins, n),
      need: n,
      text: `Win ${n} ${n === 1 ? 'match' : 'matches'} against the CPU`
    };
  }
  return {
    have: Math.min(p.played, n),
    need: n,
    text: `Play ${n} matches`
  };
}

export function getUnlockedIds(p?: ProgressData): AbilityId[] {
  return SKILLS_LIST.filter(s => isUnlocked(s.id, p)).map(s => s.id);
}

export function recordMatch(won: boolean): { unlocked: AbilityId[] } {
  const before = getUnlockedIds();
  const p = getProgress();
  p.played++;
  if (won) p.wins++;
  saveProgress(p);
  const after = getUnlockedIds(p);
  return { unlocked: after.filter(id => !before.includes(id)) };
}

export function drawSkillsCount(n: number): AbilityId[] {
  return shuffle(getUnlockedIds()).slice(0, n);
}

/* ---------- generative audio engine ---------- */
let AC: AudioContext | null = null;

export function getAudioContext(): AudioContext | null {
  try {
    if (!AC) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) AC = new AudioCtx();
    }
  } catch {
    return null;
  }
  return AC;
}

const mus = {
  gain: null as GainNode | null,
  timer: null as any,
  step: 0,
  next: 0,
  on: false,
  track: 'ambient' as 'ambient' | 'duel',
  noise: null as AudioBuffer | null
};

const LEAD = [220, 261.63, 293.66, 329.63, 392, 440, 523.25, 587.33];
const BASS = [110, 87.31, 98, 82.41];

function note(c: AudioContext, t: number, f: number, dur: number, type: OscillatorType, vol: number, dest?: AudioNode): void {
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.value = f;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.03);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g);
  g.connect(dest || mus.gain!);
  o.start(t);
  o.stop(t + dur + 0.05);
}

let leadIndex = 3;
function ambientStep(c: AudioContext, t: number, n: number): void {
  if (n % 8 === 0) {
    note(c, t, BASS[(n / 8) % 4 | 0], 2.2, 'sine', 0.6);
  }
  if (n % 2 === 0 || Math.random() < 0.3) {
    leadIndex = Math.max(0, Math.min(LEAD.length - 1, leadIndex + (Math.random() < 0.5 ? -1 : 1) * (Math.random() < 0.3 ? 2 : 1)));
    if (Math.random() < 0.8) note(c, t, LEAD[leadIndex], 0.9, 'triangle', 0.22);
  }
}

const DUEL_ROOTS = [110, 87.31, 130.81, 98];
const DUEL_CHORD = [
  [220, 261.63, 329.63],
  [174.61, 220, 261.63],
  [261.63, 329.63, 392],
  [196, 246.94, 293.66]
];
const DUEL_MEL = [
  [440, 0, 523.25, 440, 0, 392, 440, 0, 659.25, 0, 587.33, 523.25, 0, 440, 392, 0],
  [349.23, 0, 440, 349.23, 0, 329.63, 349.23, 0, 523.25, 0, 440, 392, 0, 349.23, 329.63, 0],
  [523.25, 0, 659.25, 523.25, 0, 440, 523.25, 0, 783.99, 0, 659.25, 587.33, 0, 523.25, 440, 0],
  [392, 0, 493.88, 392, 0, 349.23, 392, 0, 587.33, 0, 523.25, 493.88, 0, 392, 349.23, 659.25]
];

function noiseBuf(c: AudioContext): AudioBuffer {
  if (mus.noise) return mus.noise;
  const b = c.createBuffer(1, c.sampleRate * 0.5, c.sampleRate);
  const d = b.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return (mus.noise = b);
}

function kick(c: AudioContext, t: number, vol: number): void {
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = 'sine';
  o.frequency.setValueAtTime(150, t);
  o.frequency.exponentialRampToValueAtTime(42, t + 0.14);
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);
  o.connect(g);
  g.connect(mus.gain!);
  o.start(t);
  o.stop(t + 0.3);
}

function snare(c: AudioContext, t: number, vol: number): void {
  const s = c.createBufferSource();
  const f = c.createBiquadFilter();
  const g = c.createGain();
  s.buffer = noiseBuf(c);
  f.type = 'highpass';
  f.frequency.value = 1400;
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
  s.connect(f);
  f.connect(g);
  g.connect(mus.gain!);
  s.start(t);
  s.stop(t + 0.2);
  note(c, t, 190, 0.1, 'triangle', vol * 0.8);
}

function hat(c: AudioContext, t: number, vol: number): void {
  const s = c.createBufferSource();
  const f = c.createBiquadFilter();
  const g = c.createGain();
  s.buffer = noiseBuf(c);
  f.type = 'highpass';
  f.frequency.value = 7000;
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.04);
  s.connect(f);
  f.connect(g);
  g.connect(mus.gain!);
  s.start(t);
  s.stop(t + 0.05);
}

function duelStep(c: AudioContext, t: number, n: number): void {
  const st = n % 16;
  const bar = Math.floor(n / 16) % 4;
  const root = DUEL_ROOTS[bar];
  if (st % 4 === 0) kick(c, t, 0.9);
  if (st === 10 && bar % 2 === 1) kick(c, t, 0.7);
  if (st === 4 || st === 12) snare(c, t, 0.45);
  if (st % 2 === 0) hat(c, t, st % 4 === 2 ? 0.14 : 0.08);

  // Galloping bass
  if (st % 4 === 0 || st % 4 === 1 || st % 4 === 3) {
    note(c, t, st % 4 === 3 ? root * 2 : root, 0.17, 'sawtooth', 0.24);
  }
  // Brass chords
  if (st === 0 || st === 8) {
    DUEL_CHORD[bar].forEach(f => {
      note(c, t, f, st === 0 ? 0.9 : 0.35, 'sawtooth', 0.075);
      note(c, t, f * 1.004, st === 0 ? 0.9 : 0.35, 'square', 0.03);
    });
  }
  const m = DUEL_MEL[bar][st];
  if (n >= 32 && m) {
    note(c, t, m, 0.2, 'sawtooth', 0.11);
    note(c, t, m * 2, 0.16, 'triangle', 0.05);
  }
  if (st === 8 && bar === 3) {
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(220, t);
    o.frequency.exponentialRampToValueAtTime(880, t + 0.8);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.06, t + 0.7);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.85);
    o.connect(g);
    g.connect(mus.gain!);
    o.start(t);
    o.stop(t + 0.9);
  }
}

function musicSchedule(): void {
  const c = getAudioContext();
  if (!c || !mus.on) return;
  const step = mus.track === 'duel' ? 0.1 : 0.32;
  while (mus.next < c.currentTime + 0.5) {
    (mus.track === 'duel' ? duelStep : ambientStep)(c, mus.next, mus.step++);
    mus.next += step;
  }
}

export function startTrack(track: 'ambient' | 'duel'): void {
  const s = getSettings();
  if (!s.music) {
    mus.track = track;
    return;
  }
  const c = getAudioContext();
  if (!c) return;
  if (mus.on && mus.track === track) return;
  if (mus.on) stopTrack();

  try {
    if (c.state === 'suspended') c.resume().catch(() => {});
  } catch {
    // ignore
  }

  mus.track = track;
  mus.gain = c.createGain();
  mus.gain.gain.value = s.musicVol * (track === 'duel' ? 0.4 : 0.3);
  mus.gain.connect(c.destination);
  mus.on = true;
  mus.step = 0;
  mus.next = c.currentTime + 0.1;
  mus.timer = setInterval(musicSchedule, 100);
}

export function stopTrack(): void {
  if (!mus.on) return;
  mus.on = false;
  if (mus.timer) clearInterval(mus.timer);
  const g = mus.gain;
  if (g && getAudioContext()) {
    try {
      g.gain.setTargetAtTime(0, getAudioContext()!.currentTime, 0.15);
      setTimeout(() => {
        try { g.disconnect(); } catch {}
      }, 1500);
    } catch {}
  }
}

export const music = {
  start: (t?: 'ambient' | 'duel') => startTrack(t || mus.track),
  play: (t: 'ambient' | 'duel') => { mus.track = t; startTrack(t); },
  stop: stopTrack,
  setVolume: (v: number) => {
    if (mus.gain) {
      try { mus.gain.gain.value = v * (mus.track === 'duel' ? 0.4 : 0.3); } catch {}
    }
  },
  arm: (track: 'ambient' | 'duel' = 'ambient') => {
    const evs = ['pointerdown', 'mousedown', 'touchstart', 'click', 'keydown'];
    const done = () => {
      const c = getAudioContext();
      if (c && c.state === 'running') {
        evs.forEach(e => window.removeEventListener(e, kickMusic, true));
        return true;
      }
      return false;
    };
    const kickMusic = () => {
      const c = getAudioContext();
      music.play(track);
      if (c && c.state !== 'running') {
        c.resume().then(done).catch(() => {});
      }
      done();
    };
    music.play(track);
    const c0 = getAudioContext();
    if (c0) c0.onstatechange = () => { done(); };
    if (!done()) {
      evs.forEach(e => window.addEventListener(e, kickMusic, true));
    }
  }
};

export function beep(f?: number): void {
  const s = getSettings();
  if (!s.sfx) return;
  const c = getAudioContext();
  if (!c) return;
  try {
    const o = c.createOscillator();
    const g = c.createGain();
    const n = c.currentTime;
    o.type = 'triangle';
    o.frequency.value = f || 520;
    g.gain.setValueAtTime(Math.max(0.0002, 0.08 * s.sfxVol), n);
    g.gain.exponentialRampToValueAtTime(0.0001, n + 0.15);
    o.connect(g);
    g.connect(c.destination);
    o.start();
    o.stop(n + 0.16);
  } catch {}
}

export function playSound(f: number, d: number, type: OscillatorType = 'square', v: number = 0.05, slide?: number): void {
  const s = getSettings();
  if (!s.sfx) return;
  const c = getAudioContext();
  if (!c) return;
  try {
    if (c.state === 'suspended') c.resume().catch(() => {});
    const o = c.createOscillator();
    const g = c.createGain();
    const n = c.currentTime;
    o.type = type;
    o.frequency.setValueAtTime(f, n);
    if (slide) {
      o.frequency.exponentialRampToValueAtTime(Math.max(30, f + slide), n + d);
    }
    g.gain.setValueAtTime(Math.max(0.0002, (v || 0.05) * s.sfxVol / 0.7), n);
    g.gain.exponentialRampToValueAtTime(0.0001, n + d);
    o.connect(g);
    g.connect(c.destination);
    o.start();
    o.stop(n + d);
  } catch {}
}

/* ---------- DOM helper ---------- */
const NS = 'http://www.w3.org/2000/svg';

export function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls?: string | null, text?: string): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
}

export function iconEl(id: string, cls?: string): SVGElement {
  const s = document.createElementNS(NS, 'svg') as SVGElement;
  const u = document.createElementNS(NS, 'use') as SVGUseElement;
  s.setAttribute('class', cls || 'ico');
  s.setAttribute('aria-hidden', 'true');
  u.setAttribute('href', '#' + id);
  s.appendChild(u);
  return s;
}

export function gemEl(iconId: string, locked: boolean = false): HTMLElement {
  const w = el('span', 'pgem' + (locked ? ' locked' : ''));
  const s = document.createElementNS(NS, 'svg');
  const p = document.createElementNS(NS, 'polygon');
  s.setAttribute('class', 'shape');
  s.setAttribute('viewBox', '0 0 100 100');
  s.setAttribute('aria-hidden', 'true');
  p.setAttribute('points', '50,3 91,26.5 91,73.5 50,97 9,73.5 9,26.5');
  s.appendChild(p);
  w.appendChild(s);
  w.appendChild(iconEl(locked ? 'ic-lock' : iconId, 'glyph'));
  return w;
}
