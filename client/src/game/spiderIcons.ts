import type { AbilityId } from './abilities';
import { spiderMove } from './spiderMoves';

const PALETTE: Record<string, [string, string]> = {
  weaver: ['#087fa8', '#42d4ed'],
  hunter: ['#2c88c6', '#b5efff'],
  guardian: ['#846c42', '#f0c676'],
  wolf: ['#aa3c24', '#ffb65b'],
  lynx: ['#43784c', '#b9f08b']
};

// Two pictograms per move retain the painted hex badge theme while making each skill identifiable.
const MARK: Record<string, string> = {
  thread: '<path d="M3 19Q8 2 13 11T21 5M5 21Q14 14 21 20"/>',
  dash: '<path d="M2 12h13m-5-6 7 6-7 6M4 5h5M4 19h5"/>',
  orb: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/>',
  snare: '<path d="M3 5q9 12 18 0M3 19q9-12 18 0M5 3q12 9 0 18m14-18Q7 12 19 21"/>',
  reel: '<circle cx="12" cy="12" r="6"/><path d="M12 2v20M2 12h20"/>',
  loom: '<path d="M4 4v16m5-16v16m5-16v16m5-16v16M2 9h20M2 15h20"/>',
  fang: '<path d="M4 4l4 16 4-9 4 9 4-16"/>',
  veil: '<path d="M3 7Q12 1 21 7l-3 11-6 4-6-4zM7 10h10"/>',
  mend: '<path d="M12 3v18M3 12h18"/><circle cx="12" cy="12" r="9"/>',
  cocoon: '<ellipse cx="12" cy="12" rx="7" ry="10"/><path d="m6 7 12 10M5 12l12 8M7 4l12 10"/>',
  shield: '<path d="M12 2 21 6v6q0 7-9 10-9-3-9-10V6z"/>',
  leap: '<path d="M3 19q10-23 18 0M15 15l6 4-7 1"/>',
  sweep: '<path d="M3 16q8 9 18-7m-6-1 6 1-1 6"/>',
  dew: '<path d="M12 2Q3 13 3 16a9 9 0 0 0 18 0Q21 13 12 2z"/>',
  venom: '<path d="M4 5h16l-4 8-4 8-4-8zM8 8h8"/>',
  knot: '<path d="M4 5q16 0 16 14M20 5Q4 5 4 19M5 13h14"/>',
  anchor: '<path d="M12 2v17M6 8h12M3 15q1 7 9 7t9-7M9 3h6"/>',
  counter: '<path d="M3 10a9 9 0 0 1 15-5l3 3m0-4v4h-4M21 14a9 9 0 0 1-15 5l-3-3m0 4v-4h4"/>',
  quake: '<path d="m2 13 5-4 3 6 4-9 3 9 5-5M2 20h20"/>',
  rush: '<path d="m3 18 8-12 1 8 9-9-5 13z"/>',
  line: '<path d="M3 20Q3 4 18 4m-3-2 4 2-3 4M3 20h8"/>',
  hook: '<path d="M5 3h12v10q0 8-7 8t-7-5m0 0 3 2m-3-2-2 3"/>',
  drain: '<path d="M12 3v11m-5-5 5 5 5-5M5 18q7 7 14 0"/>',
  eye: '<path d="M2 12Q12 1 22 12 12 23 2 12z"/><circle cx="12" cy="12" r="3"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/><path d="M12 1v6m0 10v6M1 12h6m10 0h6"/>',
  spring: '<path d="M3 19h18M5 16l4-4-3-3 6-6 6 6-3 3 4 4"/>',
  burst: '<path d="m12 1 2 7 7-3-4 6 6 4-7 1-1 7-5-6-6 4 2-7-5-4 7-1z"/>',
  shell: '<path d="M3 19Q4 4 12 4t9 15zM7 18V8m5 10V5m5 13V8"/>',
  scythe: '<path d="M4 3q18 2 16 15-4-7-12-5L4 21"/>',
  flick: '<path d="M3 16q7-12 14-5l-5-6m5 6 5-2M5 21l5-4"/>',
  stomp: '<path d="M7 3v9l-4 4h18l-4-4V3M2 20h20"/>',
  grapple: '<path d="M4 18 18 4m-6 0h6v6M3 6l5 5M16 16l5 5"/>',
  plate: '<path d="M3 7 12 2l9 5-2 11-7 4-7-4zM3 7l9 5 9-5M12 12v10"/>',
  clamp: '<path d="M3 3v9q0 9 9 9t9-9V3M7 3v7m10-7v7M7 14h10"/>',
  sprawl: '<path d="M12 12 3 3m9 9 9-9m-9 9-9 9m9-9 9 9M3 12h18"/>',
  crush: '<path d="m3 4 7 8-7 8m18-16-7 8 7 8M9 12h6"/>',
  track: '<path d="M3 19q4-2 6-7t5-6m-6 14q4-2 6-7t5-6M3 7h3m13 11h3"/>',
  feint: '<path d="M3 18q10-20 18-8l-7-1m7 1-5 5M4 21h6"/>',
  hide: '<path d="m3 5 5 2 4-5 4 5 5-2-2 14-7 3-7-3z"/>',
  bite: '<path d="M3 5h18l-3 12-4-6-2 8-2-8-4 6z"/>',
  thorn: '<path d="M12 2 8 9l-6 2 7 3 3 8 3-8 7-3-6-2z"/>',
  spine: '<path d="M3 20 7 8l4 5 3-11 3 11 4-5 1 12z"/>',
  needle: '<path d="M4 20 18 3l3-1-1 3L6 22zM8 17l3 2"/>',
  leaf: '<path d="M3 21Q1 4 21 3q1 19-18 18M3 21q9-11 18-18"/>'
};

const cache = new Map<string, string>();
export function spiderAbilityIcon(species: string, id: AbilityId): string {
  const key = species + ':' + id;
  const cached = cache.get(key);
  if (cached) return cached;
  const [first, second] = spiderMove(species, id).art;
  const [base, accent] = PALETTE[species] || PALETTE.weaver;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96">
    <rect width="96" height="96" fill="#0b0e14"/>
    <path d="M48 5 87 26v44L48 91 9 70V26z" fill="${base}" stroke="${accent}" stroke-width="2"/>
    <path d="M48 12 80 30v36L48 84 16 66V30z" fill="#101b29" opacity=".27"/>
    <g fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" transform="translate(13 27) scale(1.35)">${MARK[first] || MARK.orb}</g>
    <path d="M48 22v52" stroke="${accent}" stroke-opacity=".8" stroke-width="2"/>
    <g fill="none" stroke="${accent}" stroke-width="2.7" stroke-linecap="round" stroke-linejoin="round" transform="translate(50 27) scale(1.35)">${MARK[second] || MARK.orb}</g>
  </svg>`;
  const uri = 'data:image/svg+xml,' + encodeURIComponent(svg);
  cache.set(key, uri);
  return uri;
}

export function spiderIconHue(_species: string): string {
  return '0deg';
}
