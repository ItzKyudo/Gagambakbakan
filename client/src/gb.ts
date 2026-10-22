import {
  ABILITIES,
  ALL_ABILITY_IDS,
  isNodeAvailableToUnlock,
  type AbilityId,
  shuffle
} from './game/abilities';
import { decodePatternArt } from './patternArt';
import bgMusicMenuUrl from './assets/musics/bg-music-menu.mp3';
import bgMusicGameplayUrl from './assets/musics/bg-music-gameplay.mp3';

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
  customPattern: string;
}

export interface GameSettings {
  sound: boolean;
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
  onlineExp: number;
  onlinePlayed: number;
  onlineWins: number;
  unlockedSkills?: string[];
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
  sound: true,
  sfx: true,
  sfxVol: 0.7,
  music: true,
  musicVol: 0.5,
  diff: 'normal'
};

export function getSettings(): GameSettings {
  const s = lsGet<Partial<GameSettings>>('settings', {}) || {};
  const o: GameSettings = {
    sound: typeof s.sound === 'boolean' ? s.sound : (typeof s.sfx === 'boolean' ? s.sfx : DEF_SET.sound),
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
  ['plain', 'Plain'],
  ['custom', 'Draw yours']
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
  ['tophat', 'Top Hat'],
  ['samurai', 'Kabuto Helm'],
  ['wizard', 'Wizard Hat'],
  ['pirate', 'Pirate Hat'],
  ['visor', 'Cyber Visor'],
  ['strawhat', 'Ronin Hat'],
  ['headphones', 'Headset']
];

export const DEF_LOOK: { p1: SpiderLook; p2: SpiderLook } = {
  p1: { name: 'Amber', color: 'amber', pattern: 'stripes', acc: 'none', customPattern: '' },
  p2: { name: 'Jade', color: 'jade', pattern: 'stripes', acc: 'none', customPattern: '' }
};

export function getColor(idOrHex: string): SpiderColor {
  if (!idOrHex) return COLORS[0];
  const q = idOrHex.toLowerCase();
  for (let i = 0; i < COLORS.length; i++) {
    if (COLORS[i].id.toLowerCase() === q || COLORS[i].main.toLowerCase() === q) {
      return COLORS[i];
    }
  }
  for (let i = 0; i < COLORS.length; i++) {
    if (COLORS[i].dark.toLowerCase() === q || COLORS[i].light.toLowerCase() === q) {
      return COLORS[i];
    }
  }
  if (idOrHex.startsWith('#')) {
    return {
      id: 'custom',
      label: 'Custom',
      main: idOrHex,
      dark: idOrHex,
      light: idOrHex
    };
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
    acc: hasOption(ACCS, v.acc) ? v.acc : d.acc,
    customPattern: typeof v.customPattern === 'string' && decodePatternArt(v.customPattern).length ? v.customPattern : ''
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
    pattern: PATTERNS[Math.floor(Math.random() * (PATTERNS.length - 1))][0],
    acc: ACCS[Math.floor(Math.random() * ACCS.length)][0],
    customPattern: ''
  };
}

export function customPatternSVG(value: string): string {
  return decodePatternArt(value).map(stroke => {
    const points = stroke.points.map(([x, y]) => `${(41 + x * 95).toFixed(1)},${(54 + y * 75).toFixed(1)}`).join(' ');
    if (stroke.points.length === 1) return `<circle cx="${(41 + stroke.points[0][0] * 95).toFixed(1)}" cy="${(54 + stroke.points[0][1] * 75).toFixed(1)}" r="3.2" fill="${stroke.color}"/>`;
    return `<polyline points="${points}" fill="none" stroke="${stroke.color}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>`;
  }).join('');
}

export function spiderSVGraw(look: SpiderLook): string {
  const c = getColor(look.color);
  const OUT = 'rgba(8,16,15,.78)';
  const body = 'M41 94 C40 70 59 55 87 54 C116 53 136 69 136 92 C136 115 115 129 87 129 C59 129 42 116 41 94 Z';
  const head = 'M121 91 C121 73 135 62 153 63 C171 64 181 77 180 95 C179 112 165 121 147 118 C131 116 121 107 121 91 Z';
  const far = '<path d="M65 97 L44 88 Q37 86 32 94 L15 134"/><path d="M76 108 L57 109 Q49 111 45 121 L36 144"/><path d="M112 109 L132 115 Q140 119 143 130 L146 145"/><path d="M131 98 L154 96 Q165 97 174 107 L204 136"/>';
  const legs = '<path d="M62 102 L38 101 Q29 104 25 116 L14 143"/><path d="M75 114 L56 120 Q49 125 49 135 L47 146"/><path d="M114 113 L129 123 Q135 130 131 145"/>';
  const foreleg = '<path d="M132 102 L158 105 Q169 108 177 119 L198 142"/>';

  let pat = '';
  if (look.pattern === 'custom') {
    pat = customPatternSVG(look.customPattern);
  } else if (look.pattern === 'stripes') {
    // Tapered tiger-stripe bands with dorsal spine & light contour rim
    pat += `<path d="M46 93 Q88 91 131 93" fill="none" stroke="${c.dark}" stroke-width="3.5" opacity=".45"/>`;
    [66, 84, 102, 118].forEach((x, idx) => {
      const w = idx === 1 || idx === 2 ? 7.5 : 5.5;
      pat += `<path d="M${x + 3} 56 Q${x - 7} 93 ${x + 3} 130" fill="none" stroke="${c.light}" stroke-width="${w + 2.6}" stroke-linecap="round" opacity=".32"/>`;
      pat += `<path d="M${x + 3} 56 Q${x - 7} 93 ${x + 3} 130" fill="none" stroke="${c.dark}" stroke-width="${w}" stroke-linecap="round"/>`;
    });
  } else if (look.pattern === 'dots') {
    // Leopard / Ladybug rosettes with light halo rings and varied sizes
    [
      [88, 92, 8.5],
      [66, 80, 6.2], [66, 106, 6.2],
      [108, 78, 6.5], [108, 107, 6.5],
      [87, 68, 5.2], [87, 117, 5.2],
      [51, 93, 4.8]
    ].forEach(([cx, cy, r]) => {
      pat += `<circle cx="${cx}" cy="${cy}" r="${r + 2.2}" fill="${c.light}" opacity=".45"/>` +
        `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${c.dark}"/>` +
        `<circle cx="${cx - r * 0.28}" cy="${cy - r * 0.28}" r="${Math.max(1.3, r * 0.26).toFixed(1)}" fill="${c.light}" opacity=".65"/>`;
    });
  } else if (look.pattern === 'chevron') {
    // Interlocking armored viper chevrons with light edge piping
    [62, 80, 98, 114].forEach((x, idx) => {
      const span = idx === 3 ? 19 : 25;
      pat += `<polyline points="${x - 11},${93 - span} ${x + 5},93 ${x - 11},${93 + span}" fill="none" stroke="${c.light}" stroke-width="8.5" stroke-linecap="round" stroke-linejoin="round" opacity=".32"/>` +
        `<polyline points="${x - 11},${93 - span} ${x + 5},93 ${x - 11},${93 + span}" fill="none" stroke="${c.dark}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>`;
    });
  } else if (look.pattern === 'rings') {
    // Ocellus target bullseye with alternating dark & light rings
    pat += `<ellipse cx="89" cy="93" rx="38" ry="28" fill="none" stroke="${c.dark}" stroke-width="5.5"/>` +
      `<ellipse cx="89" cy="93" rx="28" ry="20.5" fill="none" stroke="${c.light}" stroke-width="3" opacity=".55"/>` +
      `<ellipse cx="89" cy="93" rx="22" ry="16" fill="none" stroke="${c.dark}" stroke-width="5.5"/>` +
      `<ellipse cx="89" cy="93" rx="11.5" ry="8.5" fill="${c.dark}" stroke="${c.light}" stroke-width="2.4"/>` +
      `<circle cx="87" cy="91" r="3.2" fill="${c.light}"/>`;
  } else if (look.pattern === 'cross') {
    // Ornate Argiope St. Andrew's cross with flared arms and central diamond medallion
    pat += `<path d="M82 54 L96 54 L93 86 L128 84 L128 100 L93 98 L96 130 L82 130 L85 98 L50 100 L50 84 L85 86 Z" fill="${c.dark}" stroke="${c.light}" stroke-width="2.2" stroke-linejoin="round"/>` +
      `<polygon points="89,78 103,92 89,106 75,92" fill="${c.light}" opacity=".55"/>` +
      `<polygon points="89,83 98,92 89,101 80,92" fill="${c.dark}"/>`;
  } else if (look.pattern === 'split') {
    // Harlequin dual-tone split with central crest & counter-dots
    pat += `<rect x="40" y="52" width="100" height="41" fill="${c.dark}"/>` +
      `<line x1="42" y1="93" x2="136" y2="93" stroke="${c.light}" stroke-width="3.5" opacity=".7"/>` +
      `<line x1="42" y1="96" x2="136" y2="96" stroke="${c.dark}" stroke-width="3"/>` +
      `<circle cx="70" cy="76" r="4.5" fill="${c.light}" opacity=".65"/>` +
      `<circle cx="106" cy="76" r="4.5" fill="${c.light}" opacity=".65"/>` +
      `<circle cx="70" cy="110" r="4.8" fill="${c.dark}"/>` +
      `<circle cx="106" cy="110" r="4.8" fill="${c.dark}"/>`;
  } else if (look.pattern === 'webmark') {
    // Scalloped radial orb-web lattice with dew-drop center
    for (let a = 0; a < 8; a++) {
      const rad = a * Math.PI / 4;
      const x2 = 89 + Math.cos(rad) * 46;
      const y2 = 93 + Math.sin(rad) * 36;
      pat += `<line x1="89" y1="93" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${c.dark}" stroke-width="3"/>`;
    }
    [13, 25, 37].forEach((r, idx) => {
      let d = '';
      for (let a = 0; a <= 8; a++) {
        const rad = a * Math.PI / 4;
        const px = (89 + Math.cos(rad) * r).toFixed(1);
        const py = (93 + Math.sin(rad) * (r * 0.78)).toFixed(1);
        if (a === 0) {
          d += `M${px} ${py}`;
        } else {
          const midRad = (a - 0.5) * Math.PI / 4;
          const cx = (89 + Math.cos(midRad) * (r * 0.86)).toFixed(1);
          const cy = (93 + Math.sin(midRad) * (r * 0.78 * 0.86)).toFixed(1);
          d += ` Q${cx} ${cy} ${px} ${py}`;
        }
      }
      pat += `<path d="${d}" fill="none" stroke="${c.dark}" stroke-width="${idx === 2 ? 3 : 2.5}"/>`;
    });
    pat += `<circle cx="89" cy="93" r="4.5" fill="${c.light}" stroke="${c.dark}" stroke-width="2"/>`;
  } else if (look.pattern === 'diamonds') {
    // Royal Argyle diamond chain with inner light cores and flanking gems
    [64, 89, 114].forEach((x, idx) => {
      const h = idx === 1 ? 23 : 19;
      const w = idx === 1 ? 13 : 10.5;
      pat += `<polygon points="${x},${93 - h} ${x + w},93 ${x},${93 + h} ${x - w},93" fill="${c.dark}" stroke="${c.light}" stroke-width="2" stroke-linejoin="round"/>` +
        `<polygon points="${x},${93 - h * 0.42} ${x + w * 0.42},93 ${x},${93 + h * 0.42} ${x - w * 0.42},93" fill="${c.light}" opacity=".6"/>`;
    });
  }

  let acc = '';
  if (look.acc === 'band') {
    // Martial Headband with fluttering dual tails & metallic brow plate
    acc = `<path d="M126 74 L104 67 Q98 69 102 74 L126 79 Z" fill="#c23616" stroke="${OUT}" stroke-width="1.8" stroke-linejoin="round"/>` +
      `<path d="M126 78 L106 83 Q101 87 107 90 L127 82 Z" fill="#e84118" stroke="${OUT}" stroke-width="1.8" stroke-linejoin="round"/>` +
      `<path d="M124 80 Q150 67 176 79" fill="none" stroke="${OUT}" stroke-width="10.5" stroke-linecap="round"/>` +
      `<path d="M124 80 Q150 67 176 79" fill="none" stroke="#e84118" stroke-width="7" stroke-linecap="round"/>` +
      `<path d="M128 77 Q150 66 172 76" fill="none" stroke="#ff7979" stroke-width="2" stroke-linecap="round" opacity=".75"/>` +
      `<rect x="143" y="69" width="18" height="8" rx="2.5" transform="rotate(-2 152 73)" fill="#dfe6e9" stroke="${OUT}" stroke-width="1.8"/>` +
      `<circle cx="146.5" cy="73" r="1.1" fill="#636e72"/><circle cx="157.5" cy="72.6" r="1.1" fill="#636e72"/>`;
  } else if (look.acc === 'crown') {
    // Royal Jewelled Crown with velvet cushion, 5 spires, pearls & gems
    acc = `<path d="M131 71 L128 50 L140 61 L150 43 L160 61 L172 50 L169 71 Z" fill="#ffd34d" stroke="${OUT}" stroke-width="2.4" stroke-linejoin="round"/>` +
      `<path d="M133 67 L167 67" stroke="#b5830a" stroke-width="2"/>` +
      `<rect x="130" y="68" width="40" height="5.5" rx="2.5" fill="#c23616" stroke="${OUT}" stroke-width="1.8"/>` +
      `<circle cx="128" cy="48.5" r="2.6" fill="#fff9d2" stroke="${OUT}" stroke-width="1.4"/>` +
      `<circle cx="150" cy="41.5" r="3.2" fill="#fff9d2" stroke="${OUT}" stroke-width="1.5"/>` +
      `<circle cx="172" cy="48.5" r="2.6" fill="#fff9d2" stroke="${OUT}" stroke-width="1.4"/>` +
      `<polygon points="150,55 153.5,60 150,65 146.5,60" fill="#e84118" stroke="${OUT}" stroke-width="1.2"/>` +
      `<circle cx="139" cy="63" r="2.2" fill="#00cec9" stroke="${OUT}" stroke-width="1"/>` +
      `<circle cx="161" cy="63" r="2.2" fill="#00cec9" stroke="${OUT}" stroke-width="1"/>`;
  } else if (look.acc === 'horns') {
    // Curved segmented demon/oni horns with dark tips and brow sockets
    acc = `<ellipse cx="135" cy="73" rx="6.5" ry="3.5" transform="rotate(-18 135 73)" fill="#5c4b3b" stroke="${OUT}" stroke-width="1.6"/>` +
      `<ellipse cx="165" cy="73" rx="6.5" ry="3.5" transform="rotate(18 165 73)" fill="#5c4b3b" stroke="${OUT}" stroke-width="1.6"/>` +
      `<path d="M129 74 C121 60 124 46 135 41 C134 52 138 61 142 70 Z" fill="#f4efe0" stroke="${OUT}" stroke-width="2.2" stroke-linejoin="round"/>` +
      `<path d="M171 74 C179 60 176 46 165 41 C166 52 162 61 158 70 Z" fill="#f4efe0" stroke="${OUT}" stroke-width="2.2" stroke-linejoin="round"/>` +
      `<path d="M127 54 Q132 52 136 55 M128 62 Q134 60 139 63 M173 54 Q168 52 164 55 M172 62 Q166 60 161 63" fill="none" stroke="#b8ad94" stroke-width="1.8" stroke-linecap="round"/>`;
  } else if (look.acc === 'goggles') {
    // Steampunk Aviator Goggles with leather strap, brass bevels & reflective lenses
    acc = `<path d="M123 84 Q150 74 177 84" fill="none" stroke="${OUT}" stroke-width="7" stroke-linecap="round"/>` +
      `<path d="M123 84 Q150 74 177 84" fill="none" stroke="#6d4c41" stroke-width="4.2" stroke-linecap="round"/>` +
      `<ellipse cx="143" cy="79" rx="10" ry="8.8" fill="#d4af37" stroke="${OUT}" stroke-width="2.2"/>` +
      `<ellipse cx="143" cy="79" rx="7.2" ry="6.2" fill="#00cec9" stroke="#0984e3" stroke-width="1.2"/>` +
      `<path d="M139 76 L144 74 M140 81 L147 77" stroke="#ffffff" stroke-width="2" stroke-linecap="round"/>` +
      `<ellipse cx="163" cy="82" rx="10.2" ry="8.8" fill="#d4af37" stroke="${OUT}" stroke-width="2.2"/>` +
      `<ellipse cx="163" cy="82" rx="7.4" ry="6.2" fill="#00cec9" stroke="#0984e3" stroke-width="1.2"/>` +
      `<path d="M159 79 L164 77 M160 84 L167 80" stroke="#ffffff" stroke-width="2" stroke-linecap="round"/>` +
      `<path d="M151 79 Q153 75 155 80" fill="none" stroke="#d4af37" stroke-width="3.5" stroke-linecap="round"/>`;
  } else if (look.acc === 'halo') {
    // Radiant Celestial Halo with outer glow & 4 star-sparks
    acc = `<ellipse cx="150" cy="54" rx="24" ry="7.5" fill="none" stroke="#f39c12" stroke-width="7" opacity=".35"/>` +
      `<ellipse cx="150" cy="54" rx="22" ry="6.8" fill="none" stroke="#ffeaa7" stroke-width="4.5" stroke-linecap="round"/>` +
      `<ellipse cx="150" cy="54" rx="19.5" ry="5" fill="none" stroke="#ffffff" stroke-width="1.8"/>` +
      `<path d="M122 54 L126 54 M124 52 L124 56 M174 54 L178 54 M176 52 L176 56 M150 42 L150 46 M148 44 L152 44" stroke="#ffffff" stroke-width="1.8" stroke-linecap="round"/>`;
  } else if (look.acc === 'mohawk') {
    // Vibrant Punk-Rock Mohawk with studded scalp band & dual-tone spikes
    acc = `<path d="M130 75 Q150 67 171 76" fill="none" stroke="#2d3436" stroke-width="5" stroke-linecap="round"/>` +
      `<polygon points="129,74 128,48 140,69" fill="#ff2d55" stroke="${OUT}" stroke-width="2" stroke-linejoin="round"/>` +
      `<polygon points="137,69 142,38 151,66" fill="#ff793f" stroke="${OUT}" stroke-width="2" stroke-linejoin="round"/>` +
      `<polygon points="148,66 156,39 162,69" fill="#ffd34d" stroke="${OUT}" stroke-width="2" stroke-linejoin="round"/>` +
      `<polygon points="159,69 168,46 171,73" fill="#ff2d55" stroke="${OUT}" stroke-width="2" stroke-linejoin="round"/>` +
      `<polygon points="167,73 176,56 175,78" fill="#ff793f" stroke="${OUT}" stroke-width="1.8" stroke-linejoin="round"/>`;
  } else if (look.acc === 'mask') {
    // Shinobi Ninja Faceplate with armored nose bridge & clan markings
    acc = `<path d="M136 88 Q158 82 178 92 L181 109 Q159 115 138 102 Z" fill="#1e272e" stroke="${OUT}" stroke-width="2.2" stroke-linejoin="round"/>` +
      `<path d="M138 90 Q158 85 176 93" fill="none" stroke="#57606f" stroke-width="2" stroke-linecap="round"/>` +
      `<path d="M145 94 L174 97 M143 100 L171 103" stroke="#ff4757" stroke-width="2.2" stroke-linecap="round"/>` +
      `<circle cx="141" cy="95" r="1.3" fill="#dfe4ea"/><circle cx="141" cy="100" r="1.3" fill="#dfe4ea"/>`;
  } else if (look.acc === 'tophat') {
    // Gentleman's Stovepipe Top Hat with curved brim, crimson band & gold buckle
    acc = `<path d="M123 71 Q148 65 173 71 Q148 77 123 71 Z" fill="#1e272e" stroke="${OUT}" stroke-width="2.2"/>` +
      `<path d="M134 69 L136 39 Q148 36 160 39 L162 69 Z" fill="#2f3542" stroke="${OUT}" stroke-width="2.2" stroke-linejoin="round"/>` +
      `<path d="M140 42 L139 62" stroke="#57606f" stroke-width="2.5" stroke-linecap="round"/>` +
      `<rect x="134.5" y="61" width="27" height="6" rx="1.5" fill="#e84118" stroke="${OUT}" stroke-width="1.5"/>` +
      `<rect x="145" y="60.5" width="7" height="7" rx="1" fill="none" stroke="#ffd34d" stroke-width="2"/>`;
  } else if (look.acc === 'samurai') {
    // Japanese Samurai Kabuto Helm with golden crescent Maedate crest
    acc = `<path d="M122 76 L116 86 L128 83 Z M178 76 L184 86 L172 83 Z" fill="#c23616" stroke="${OUT}" stroke-width="2" stroke-linejoin="round"/>` +
      `<path d="M124 76 C125 53 175 53 176 76 Z" fill="#2f3542" stroke="${OUT}" stroke-width="2.3" stroke-linejoin="round"/>` +
      `<path d="M120 76 Q150 70 180 76" fill="none" stroke="#ffd34d" stroke-width="3.5" stroke-linecap="round"/>` +
      `<path d="M150 56 L150 73 M138 59 L135 74 M162 59 L165 74" stroke="#57606f" stroke-width="1.8"/>` +
      `<path d="M150 64 C138 64 132 52 137 43 C139 51 144 56 150 56 C156 56 161 51 163 43 C168 52 162 64 150 64 Z" fill="#ffd34d" stroke="${OUT}" stroke-width="1.8" stroke-linejoin="round"/>`;
  } else if (look.acc === 'wizard') {
    // Arcane Wizard Hat with bent tip, wide brim & golden stars
    acc = `<ellipse cx="150" cy="72" rx="28" ry="6.5" fill="#341f97" stroke="${OUT}" stroke-width="2.2"/>` +
      `<path d="M131 70 C134 54 142 42 164 36 C158 46 159 56 169 70 Z" fill="#5f27cd" stroke="${OUT}" stroke-width="2.2" stroke-linejoin="round"/>` +
      `<path d="M131 66 Q150 62 169 66" fill="none" stroke="#ffd34d" stroke-width="4" stroke-linecap="round"/>` +
      `<circle cx="147" cy="54" r="2.2" fill="#ffeaa7"/><circle cx="155" cy="46" r="1.6" fill="#ffeaa7"/>`;
  } else if (look.acc === 'pirate') {
    // Swashbuckling Pirate Tricorne Hat with crimson bandana & skull emblem
    acc = `<path d="M127 75 Q150 68 173 75" fill="none" stroke="#e84118" stroke-width="6" stroke-linecap="round"/>` +
      `<path d="M119 72 Q134 50 150 48 Q166 50 181 72 Q150 64 119 72 Z" fill="#1e272e" stroke="${OUT}" stroke-width="2.2" stroke-linejoin="round"/>` +
      `<path d="M119 72 Q134 50 150 48 Q166 50 181 72" fill="none" stroke="#ffd34d" stroke-width="2.2" stroke-linecap="round"/>` +
      `<circle cx="150" cy="60" r="4.2" fill="#f5f6fa" stroke="${OUT}" stroke-width="1.2"/>` +
      `<path d="M143 64 L157 57 M143 57 L157 64" stroke="#f5f6fa" stroke-width="1.8" stroke-linecap="round"/>`;
  } else if (look.acc === 'visor') {
    // Cyberpunk Neon Wraparound Visor with HUD glint
    acc = `<path d="M128 82 Q154 74 179 84 L176 94 Q153 86 130 91 Z" fill="#0984e3" stroke="${OUT}" stroke-width="2.2" stroke-linejoin="round"/>` +
      `<path d="M131 84 Q154 77 176 85 L174 92 Q153 85 132 89 Z" fill="#00cec9"/>` +
      `<path d="M126 81 Q154 72 180 82" fill="none" stroke="#dfe6e9" stroke-width="3" stroke-linecap="round"/>` +
      `<path d="M136 85 L154 81 M160 83 L171 86" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round"/>`;
  } else if (look.acc === 'strawhat') {
    // Traditional Ronin Bamboo/Straw Conical Hat (Salakot) with woven ribs & red cord
    acc = `<path d="M115 73 L150 46 L185 73 Q150 67 115 73 Z" fill="#e1b12c" stroke="${OUT}" stroke-width="2.2" stroke-linejoin="round"/>` +
      `<path d="M150 46 L132 71 M150 46 L150 70 M150 46 L168 71" stroke="#b5830a" stroke-width="1.6"/>` +
      `<path d="M126 65 Q150 60 174 65 M136 57 Q150 53 164 57" fill="none" stroke="#f5cd79" stroke-width="1.6" stroke-linecap="round"/>` +
      `<ellipse cx="150" cy="46" rx="4.5" ry="2" fill="#c23616" stroke="${OUT}" stroke-width="1.4"/>`;
  } else if (look.acc === 'headphones') {
    // Pro Gaming Headset with cushioned arch & glowing neon earcups
    acc = `<path d="M128 88 C126 54 174 54 172 88" fill="none" stroke="${OUT}" stroke-width="7.5" stroke-linecap="round"/>` +
      `<path d="M128 88 C126 54 174 54 172 88" fill="none" stroke="#2f3542" stroke-width="4.5" stroke-linecap="round"/>` +
      `<path d="M140 61 Q150 58 160 61" fill="none" stroke="#00cec9" stroke-width="3" stroke-linecap="round"/>` +
      `<ellipse cx="127" cy="89" rx="6" ry="9.5" transform="rotate(-10 127 89)" fill="#1e272e" stroke="${OUT}" stroke-width="2"/>` +
      `<ellipse cx="127" cy="89" rx="3.2" ry="6" transform="rotate(-10 127 89)" fill="#00cec9"/>` +
      `<ellipse cx="173" cy="90" rx="6" ry="9.5" transform="rotate(10 173 90)" fill="#1e272e" stroke="${OUT}" stroke-width="2"/>` +
      `<ellipse cx="173" cy="90" rx="3.2" ry="6" transform="rotate(10 173 90)" fill="#00cec9"/>`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" class="spider-art" width="240" height="180" viewBox="0 0 240 180" data-codeart="inline-vector" data-anchor="120 145" data-facing="right" aria-hidden="true"><defs><radialGradient id="pb" cx=".35" cy=".25" r=".8"><stop offset="0" stop-color="${c.light}"/><stop offset=".48" stop-color="${c.main}"/><stop offset="1" stop-color="${c.dark}"/></radialGradient>` +
    `<radialGradient id="ph" cx=".32" cy=".24" r=".82"><stop offset="0" stop-color="${c.light}"/><stop offset=".42" stop-color="${c.main}"/><stop offset="1" stop-color="${c.dark}"/></radialGradient><clipPath id="pc"><path d="${body}"/></clipPath></defs>` +
    `<g id="perch-twig"><rect x="8" y="145" width="224" height="22" rx="11" fill="#6d4c2f" stroke="${OUT}" stroke-width="1.8"/>` +
    `<rect x="12" y="146" width="216" height="5.5" rx="2.7" fill="#9e744d"/>` +
    `<path d="M26 156 Q62 153 98 156 M136 156 Q176 158 212 155 M76 161 Q116 163 156 161" stroke="#4a331e" stroke-width="1.4" fill="none" stroke-linecap="round"/>` +
    `<path d="M216 144 C220 137 228 139 227 146 C223 147 218 145 216 144 Z" fill="#2ed573" stroke="${OUT}" stroke-width="1.2"/></g>` +
    `<g class="spider-rig"><g class="spider-legs spider-legs-far" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity=".72"><g stroke="${OUT}" stroke-width="6.4">${far}</g><g stroke="${c.dark}" stroke-width="3.5">${far}</g></g>` +
    `<g class="spider-abdomen"><path d="${body}" fill="url(#pb)"/><g class="custom-pattern" clip-path="url(#pc)" opacity="${look.pattern === 'custom' ? 1 : .68}">${pat}</g><path d="${body}" fill="none" stroke="${OUT}" stroke-width="2.3"/>` +
    `<path d="M54 77 C68 59 96 57 117 68" fill="none" stroke="${c.light}" stroke-width="2.6" stroke-linecap="round" opacity=".26"/>` +
    `<g fill="none" stroke="${c.dark}" stroke-width="1.1" stroke-linecap="round" opacity=".7"><path d="M50 70 l-5 -5 M60 62 l-3 -6 M73 57 l-1 -7 M101 57 l2 -7 M115 63 l4 -6 M128 74 l6 -4 M45 105 l-6 3 M56 120 l-4 6 M72 127 l-1 7 M105 126 l3 7 M122 117 l6 5"/></g></g>` +
    `<g class="spider-legs spider-legs-near" fill="none" stroke-linecap="round" stroke-linejoin="round"><g stroke="${OUT}" stroke-width="6.6">${legs}</g><g stroke="${c.main}" stroke-width="3.7">${legs}</g></g>` +
    `<g class="spider-foreleg" fill="none" stroke-linecap="round" stroke-linejoin="round"><g stroke="${OUT}" stroke-width="6.6">${foreleg}</g><g stroke="${c.main}" stroke-width="3.7">${foreleg}</g></g>` +
    `<g class="spider-head"><g class="spider-head-motion"><path d="${head}" fill="url(#ph)" stroke="${OUT}" stroke-width="2.5"/>` +
    `<path d="M132 78 C142 66 160 66 170 77" fill="none" stroke="${c.light}" stroke-width="2.3" stroke-linecap="round" opacity=".24"/>` +
    `<g fill="none" stroke="${c.dark}" stroke-width="1" stroke-linecap="round" opacity=".75"><path d="M128 75 l-4 -5 M139 67 l-2 -6 M153 64 l0 -6 M167 69 l4 -5 M177 82 l6 -2 M176 104 l6 3 M164 115 l3 6 M138 114 l-2 6"/></g>` +
    `<g class="spider-eyes" fill="#07100f" stroke="${c.light}" stroke-width="1.2"><circle cx="151" cy="88" r="5.1"/><circle cx="164" cy="89" r="4.7"/><circle cx="142" cy="89" r="2.8"/><circle cx="173" cy="93" r="2.7"/><circle cx="143" cy="78" r="2.2"/><circle cx="151" cy="75" r="2.3"/><circle cx="161" cy="76" r="2.2"/><circle cx="170" cy="81" r="2"/></g>` +
    `<g class="spider-eye-glints" fill="#f4f7ee"><circle cx="149.3" cy="86.3" r="1.35"/><circle cx="162.5" cy="87.4" r="1.2"/><circle cx="141.2" cy="88" r=".7"/><circle cx="172.2" cy="92.2" r=".65"/><circle cx="150.3" cy="74.3" r=".55"/><circle cx="160.4" cy="75.4" r=".5"/></g>` +
    `<g class="spider-palps" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M166 103 Q180 103 182 112 Q182 119 176 119 M163 106 Q175 109 175 117" stroke="${OUT}" stroke-width="5.4"/><path d="M166 103 Q180 103 182 112 Q182 119 176 119 M163 106 Q175 109 175 117" stroke="${c.dark}" stroke-width="2.8"/><path d="M173 105 L181 109 L176 113" stroke="#d9d2bd" stroke-width="1.8"/></g>${acc}</g></g></g></svg>`;
}

export function spiderSVG(look: SpiderLook, u: string = ''): string {
  return spiderSVGraw(look)
    .replace(/id="(pb|ph|pc)"/g, `id="$1${u}"`)
    .replace(/url\(#(pb|ph|pc)\)/g, `url(#$1${u})`);
}

export function accessorySVG(acc: string): string {
  if (acc === 'none') {
    return `<svg xmlns="http://www.w3.org/2000/svg" class="accessory-art" viewBox="105 34 90 88" aria-hidden="true">` +
      `<circle cx="150" cy="76" r="18" fill="none" stroke="rgba(176,242,227,.35)" stroke-width="2.4" stroke-dasharray="5 4"/>` +
      `<line x1="138" y1="88" x2="162" y2="64" stroke="rgba(176,242,227,.45)" stroke-width="2.4" stroke-linecap="round"/>` +
      `</svg>`;
  }
  const look = { ...DEF_LOOK.p1, pattern: 'plain', acc };
  const full = spiderSVGraw(look);
  const match = full.match(/<g class="spider-palps"[\s\S]*?<\/g>([\s\S]*?)<\/g><\/g><\/g><\/svg>$/);
  return `<svg xmlns="http://www.w3.org/2000/svg" class="accessory-art" viewBox="105 34 90 88" aria-hidden="true">${match?.[1] || ''}</svg>`;
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

/* ---------- levels and exp progression ---------- */
export const LEVEL_EXP_TABLE = [
  0,    // Level 1: 0 EXP
  100,  // Level 2: 100 EXP
  250,  // Level 3: 250 EXP (+150)
  450,  // Level 4: 450 EXP (+200)
  700,  // Level 5: 700 EXP (+250)
  1000, // Level 6: 1000 EXP (+300)
  1350, // Level 7: 1350 EXP (+350)
  1750, // Level 8: 1750 EXP (+400)
  2200, // Level 9: 2200 EXP (+450)
  2700, // Level 10: 2700 EXP (+500)
  3250, // Level 11: 3250 EXP (+550)
  3850  // Level 12: 3850 EXP (+600, all 16 skills unlocked)
];

export function getExpRequiredForLevel(level: number): number {
  if (level <= 1) return 0;
  if (level <= LEVEL_EXP_TABLE.length) {
    return LEVEL_EXP_TABLE[level - 1];
  }
  let exp = LEVEL_EXP_TABLE[LEVEL_EXP_TABLE.length - 1];
  for (let l = LEVEL_EXP_TABLE.length + 1; l <= level; l++) {
    exp += 600 + (l - 12) * 50;
  }
  return exp;
}

export function getLevel(totalExp: number): number {
  if (!totalExp || totalExp <= 0) return 1;
  let lvl = 1;
  while (true) {
    const nextReq = getExpRequiredForLevel(lvl + 1);
    if (totalExp < nextReq) break;
    lvl++;
  }
  return lvl;
}

export interface ExpProgressInfo {
  level: number;
  totalExp: number;
  currentLevelExp: number;
  nextLevelExp: number;
  expIntoLevel: number;
  expForLevel: number;
  progressPct: number;
}

export function getExpProgress(totalExp: number): ExpProgressInfo {
  const level = getLevel(totalExp);
  const currentLevelExp = getExpRequiredForLevel(level);
  const nextLevelExp = getExpRequiredForLevel(level + 1);
  const expIntoLevel = Math.max(0, totalExp - currentLevelExp);
  const expForLevel = Math.max(1, nextLevelExp - currentLevelExp);
  const progressPct = Math.min(100, Math.floor((expIntoLevel / expForLevel) * 100));

  return {
    level,
    totalExp,
    currentLevelExp,
    nextLevelExp,
    expIntoLevel,
    expForLevel,
    progressPct
  };
}

/* ---------- progress ---------- */
export function getProgress(): ProgressData {
  const p = lsGet<any>('progress', {}) || {};
  const onlineExp = Math.max(0, p.onlineExp | 0);
  const lvl = getLevel(onlineExp);
  const maxSkills = lvl + 2;

  const unlockedSkills: string[] = ['dash'];
  if (Array.isArray(p.unlockedSkills)) {
    for (const id of p.unlockedSkills) {
      if (unlockedSkills.length >= maxSkills) break;
      if (id !== 'dash' && ALL_ABILITY_IDS.includes(id) && !unlockedSkills.includes(id) && isNodeAvailableToUnlock(id as AbilityId, unlockedSkills as AbilityId[])) {
        unlockedSkills.push(id);
      }
    }
  }
  if (unlockedSkills.length === 1) {
    (['web', 'surge'] as AbilityId[]).forEach(d => {
      if (unlockedSkills.length < maxSkills && isNodeAvailableToUnlock(d, unlockedSkills as AbilityId[])) {
        unlockedSkills.push(d);
      }
    });
  }

  return {
    played: Math.max(0, p.played | 0),
    wins: Math.max(0, p.wins | 0),
    unlockAll: !!p.unlockAll,
    onlineExp,
    onlinePlayed: Math.max(0, p.onlinePlayed | 0),
    onlineWins: Math.min(Math.max(0, p.onlinePlayed | 0), Math.max(0, p.onlineWins | 0)),
    unlockedSkills
  };
}

export function saveProgress(p: ProgressData): void {
  lsSet('progress', p);
}

export function getAbilityPoints(p?: ProgressData): { total: number; spent: number; available: number } {
  p = p || getProgress();
  const currentLvl = getLevel(p.onlineExp);
  const total = currentLvl + 1;
  const unlocked = p.unlockedSkills && p.unlockedSkills.length > 0 ? p.unlockedSkills : ['dash'];
  const spent = Math.max(0, unlocked.filter(id => id !== 'dash').length);
  const available = Math.max(0, total - spent);
  return { total, spent, available };
}

export function isUnlocked(id: AbilityId, p?: ProgressData): boolean {
  p = p || getProgress();
  if (p.unlockAll) return true;
  const list = p.unlockedSkills || ['dash', 'web', 'surge'];
  return list.includes(id);
}

export function getUnlockNeed(id: AbilityId): { have: number; need: number; text: string } {
  const s = ABILITIES[id];
  const p = getProgress();
  const currentLvl = getLevel(p.onlineExp);
  const reqLvl = s.unlock.level ?? 1;
  if (reqLvl <= 1) {
    return { have: 1, need: 1, text: 'Unlocked from Level 1' };
  }
  return {
    have: Math.min(currentLvl, reqLvl),
    need: reqLvl,
    text: `Requires Level ${reqLvl} (Online matches)`
  };
}

export function getUnlockedIds(p?: ProgressData): AbilityId[] {
  p = p || getProgress();
  if (p.unlockAll) return ALL_ABILITY_IDS;
  return (p.unlockedSkills || ['dash', 'web', 'surge']) as AbilityId[];
}

export function acquireSkill(id: AbilityId): { success: boolean; reason?: string } {
  const p = getProgress();
  const unlocked = p.unlockedSkills || ['dash'];
  if (unlocked.includes(id)) {
    return { success: false, reason: 'Already unlocked' };
  }
  if (!isNodeAvailableToUnlock(id, unlocked as AbilityId[])) {
    return { success: false, reason: 'Path not connected' };
  }
  const pts = getAbilityPoints(p);
  if (pts.available <= 0) {
    return { success: false, reason: 'No ability points available' };
  }
  unlocked.push(id);
  p.unlockedSkills = unlocked;
  saveProgress(p);
  return { success: true };
}

export function respecWeb(): void {
  const p = getProgress();
  p.unlockedSkills = ['dash'];
  p.unlockAll = false;
  saveProgress(p);
}

export function recordMatch(won: boolean): void {
  const p = getProgress();
  p.played++;
  if (won) p.wins++;
  saveProgress(p);
}

export interface OnlineMatchReward {
  expGained: number;
  matchExp: number;
  winExp: number;
  roundExp: number;
  oldLevel: number;
  newLevel: number;
  leveledUp: boolean;
  pointsGained: number;
  progress: ExpProgressInfo;
}

export function recordOnlineMatch(won: boolean, myRoundsWon: number): OnlineMatchReward {
  const p = getProgress();
  const oldExp = p.onlineExp;
  const oldLevel = getLevel(oldExp);

  const matchExp = 60;
  const winExp = won ? 100 : 0;
  const roundExp = Math.min(2, Math.max(0, myRoundsWon)) * 20;
  const expGained = matchExp + winExp + roundExp;

  p.onlineExp += expGained;
  p.onlinePlayed++;
  if (won) p.onlineWins++;
  saveProgress(p);

  const newLevel = getLevel(p.onlineExp);
  const leveledUp = newLevel > oldLevel;
  const pointsGained = leveledUp ? (newLevel - oldLevel) : 0;

  return {
    expGained,
    matchExp,
    winExp,
    roundExp,
    oldLevel,
    newLevel,
    leveledUp,
    pointsGained,
    progress: getExpProgress(p.onlineExp)
  };
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

/* ---------- Background Music Engine ---------- */
let menuAudio: HTMLAudioElement | null = null;
let duelAudio: HTMLAudioElement | null = null;
let currentTrack: 'ambient' | 'duel' = 'ambient';
let armed = false;

function getMenuAudio(): HTMLAudioElement | null {
  if (typeof window === 'undefined' || typeof Audio === 'undefined') return null;
  if (!menuAudio) {
    menuAudio = new Audio(bgMusicMenuUrl);
    menuAudio.loop = true;
    menuAudio.preload = 'auto';
  }
  return menuAudio;
}

function getDuelAudio(): HTMLAudioElement | null {
  if (typeof window === 'undefined' || typeof Audio === 'undefined') return null;
  if (!duelAudio) {
    duelAudio = new Audio(bgMusicGameplayUrl);
    duelAudio.loop = true;
    duelAudio.preload = 'auto';
  }
  return duelAudio;
}

export function startTrack(track: 'ambient' | 'duel'): void {
  const s = getSettings();
  const prevTrack = currentTrack;
  currentTrack = track;

  if (!s.sound || !s.music || s.musicVol <= 0) {
    stopTrack();
    return;
  }

  const menu = getMenuAudio();
  const duel = getDuelAudio();
  if (!menu || !duel) return;

  const vol = Math.max(0, Math.min(1, s.musicVol));
  menu.volume = vol;
  duel.volume = vol;

  if (track === 'ambient') {
    if (!duel.paused) {
      duel.pause();
      duel.currentTime = 0;
    }
    if (menu.paused) {
      menu.play().catch(() => {});
    }
  } else {
    if (!menu.paused) {
      menu.pause();
    }
    if (duel.paused || prevTrack !== 'duel') {
      if (prevTrack !== 'duel') {
        duel.currentTime = 0;
      }
      duel.play().catch(() => {});
    }
  }
}

export function stopTrack(): void {
  const menu = getMenuAudio();
  const duel = getDuelAudio();
  if (menu && !menu.paused) {
    try { menu.pause(); } catch {}
  }
  if (duel && !duel.paused) {
    try { duel.pause(); } catch {}
  }
}

export const music = {
  get track(): 'ambient' | 'duel' {
    return currentTrack;
  },
  start: (t?: 'ambient' | 'duel') => startTrack(t || currentTrack || 'ambient'),
  play: (t?: 'ambient' | 'duel') => startTrack(t || currentTrack || 'ambient'),
  stop: stopTrack,
  setVolume: (v: number) => {
    const vol = Math.max(0, Math.min(1, v));
    const menu = getMenuAudio();
    const duel = getDuelAudio();
    if (menu) menu.volume = vol;
    if (duel) duel.volume = vol;
  },
  arm: (track: 'ambient' | 'duel' = 'ambient') => {
    currentTrack = track;
    const s = getSettings();
    if (s.sound && s.music && s.musicVol > 0) {
      startTrack(track);
    }

    if (armed) return;
    armed = true;

    const evs = ['pointerdown', 'mousedown', 'touchstart', 'click', 'keydown'];
    const unlock = () => {
      evs.forEach(e => window.removeEventListener(e, unlock, true));
      armed = false;
      const c = getAudioContext();
      if (c && c.state === 'suspended') {
        c.resume().catch(() => {});
      }
      const curSet = getSettings();
      if (curSet.sound && curSet.music && curSet.musicVol > 0) {
        startTrack(currentTrack);
      }
    };

    evs.forEach(e => window.addEventListener(e, unlock, true));
  }
};

export function beep(f?: number): void {
  const s = getSettings();
  if (!s.sound || !s.sfx || s.sfxVol <= 0) return;
  const c = getAudioContext();
  if (!c) return;
  try {
    if (c.state === 'suspended') c.resume().catch(() => {});
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
  if (!s.sound || !s.sfx || s.sfxVol <= 0) return;
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
