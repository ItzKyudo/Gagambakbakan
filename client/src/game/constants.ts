export const STICK = { l: 100, r: 1100, y: 240, th: 22 };
export const POND_Y = 478;
export const BODY_H = 30;
export const BODY_Y = STICK.y + STICK.th + BODY_H; // 292
export const LBL_Y = BODY_Y + 46;                  // 338
export const MAXDROP = POND_Y - BODY_Y - 26 - 4;   // 156
export const REACH = 84;
export const MINDIST = 48;
export const SPEED = 175;
export const PARRY = 0.08;
export const ATK_LIGHT = { wind: 0.10, act: 0.18, end: 0.3 };
export const ATK_HEAVY = { wind: 0.22, act: 0.38, end: 0.6 };
export const ATK = ATK_LIGHT;
export const REEL_CD = 0.14;
export const TAP = 8;
export const FALL_DEPTH = 100;
export const SINK = 17;
export const FALL_SPEED = 320;
export const SURGE_LIFT = 50;
export const FATIGUE_MAX = 4;
export const DASH_CD = 3;
export const WEB_CD = 5;
export const SURGE_CD = 6;
export const MAX_GRIP = 120;        // spider grip (health) pool
export const RECOVER_GRIP = 65;     // grip restored after climbing back up
export const VENOM_DUR = 3;         // venom spit damage-over-time duration (s)
export const VENOM_DPS = 5;         // grip lost per second while venomed
export const WEB_SNARE = 1.6;       // web tangle duration (s) - no attacking, blocking allowed

export const CANVAS_WIDTH = 1200;
export const CANVAS_HEIGHT = 560;

export const COLORS = {
  amber: '#f2a33a',
  amberDark: '#8f4f14',
  amberLight: '#ffd694',
  jade: '#4cc7b2',
  jadeDark: '#1d6a64',
  jadeLight: '#b0f2e3',
  bark: '#7b5b3e',
  barkDark: '#4a3524',
  barkLight: '#a58059',
  guard: '#8fb7d6',
  danger: '#e8593f',
  fg: '#e8eee4',
  bg: '#111c1b',
  outline: 'rgba(8,16,15,.78)'
};

export const DIFF_SETTINGS = {
  easy:   { react: [0.12, 0.30] as [number, number], rc: 0.5, gap: [1.3, 2.2] as [number, number], reel: 5.2, dash: 0.08, web: 0.5 },
  normal: { react: [0.09, 0.24] as [number, number], rc: 0.7, gap: [0.8, 1.5] as [number, number], reel: 6.2, dash: 0.2,  web: 0.7 },
  hard:   { react: [0.05, 0.20] as [number, number], rc: 0.8, gap: [0.5, 1.0] as [number, number], reel: 7.0, dash: 0.35, web: 0.9 }
};

export function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function rand(a: number, b: number): number {
  return a + Math.random() * (b - a);
}
