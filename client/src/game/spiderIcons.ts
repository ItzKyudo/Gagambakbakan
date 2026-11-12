import type { AbilityId } from './abilities';

const glyphs: Record<AbilityId, string> = {
  dash: '<path d="M5 17l10-10m-6 0h6v6M3 11h6"/>',
  web: '<path d="M12 3v18M3 12h18M5 5l14 14M19 5L5 19"/><circle cx="12" cy="12" r="5"/>',
  surge: '<path d="M12 20V4m-6 7l6-7 6 7M7 17l5-5 5 5"/>',
  power: '<path d="M14 2L5 13h6l-1 9 9-12h-6z"/>',
  shield: '<path d="M12 2l8 4v6c0 5-3 8-8 10-5-2-8-5-8-10V6z"/>',
  mend: '<circle cx="12" cy="12" r="8"/><path d="M12 7v10M7 12h10"/>',
  carapace: '<path d="M3 17a9 9 0 0118 0H3zM12 8v9M7 10l2 7M17 10l-2 7"/>',
  pounce: '<path d="M3 19Q8 4 20 7m-5-4l5 4-4 5M5 15h5"/>',
  sweep: '<path d="M3 17Q13 22 21 8m-6 1l6-1-1 6M4 11l5 2"/>',
  spit: '<path d="M12 2C9 8 5 11 5 15a7 7 0 0014 0c0-4-4-7-7-13z"/>',
  anchor: '<circle cx="12" cy="4" r="2"/><path d="M12 6v15M5 15q0 7 7 7t7-7M7 11h10"/>',
  riposte: '<path d="M5 19L19 5m-5 0h5v5M19 19L5 5m0 5V5h5"/>',
  tremor: '<path d="M2 12l4-4 3 8 3-11 3 11 3-8 4 4M3 20h18"/>',
  haste: '<circle cx="12" cy="13" r="8"/><path d="M12 13V8m-3-6h6M18 5l2-2"/>',
  hook: '<path d="M12 3v12a4 4 0 008 0v-3m-3 0l3 3 3-3"/><circle cx="12" cy="3" r="2"/>',
  leech: '<path d="M5 4q7 5 14 0-1 10-7 17Q6 14 5 4zM12 9v7m-3-4h6"/>'
};

const frames: Record<string, string> = {
  weaver: '<path d="M12 15l8 5m32-5l-8 5M12 49l8-5m32 5l-8-5M32 6v8M32 50v8"/><circle cx="32" cy="32" r="18" stroke-dasharray="2 5"/>',
  hunter: '<path d="M16 15q16-12 32 0M16 49q16 12 32 0"/><circle cx="32" cy="12" r="2.5"/><path d="M26 53h12"/>',
  guardian: '<path d="M14 16l8 4M50 16l-8 4M14 48l8-4M50 48l-8-4M24 52l8 5 8-5"/>',
  wolf: '<path d="M12 16l6 5 6-5M40 16l6 5 6-5M12 48l6-5 6 5M40 48l6-5 6 5"/>',
  lynx: '<path d="M12 22l8 2-3-8M52 22l-8 2 3-8M12 42l8-2-3 8M52 42l-8-2 3 8"/>'
};
const marks: Record<string, string> = {
  weaver: '<path d="M6 1v12M0 7h12M2 2l8 10M10 2L2 12"/>',
  hunter: '<path d="M0 7q6-8 12 0Q6 15 0 7z"/><circle cx="6" cy="7" r="2"/>',
  guardian: '<path d="M6 0l5 2v5q0 4-5 6Q1 11 1 7V2z"/>',
  wolf: '<path d="M1 12L4 2l2 7 3-8 3 11"/>',
  lynx: '<path d="M1 12l2-7 2 3 2-7 2 7 2-3 2 7"/>'
};

export function spiderAbilityIcon(species: string, id: AbilityId): string {
  const frame = frames[species] || frames.weaver;
  const mark = marks[species] || marks.weaver;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><defs><linearGradient id="g" x2=".8" y2="1"><stop stop-color="#7551c6"/><stop offset="1" stop-color="#47208f"/></linearGradient></defs><rect width="64" height="64" fill="#111216"/><path d="M32 4L57 18v28L32 60 7 46V18z" fill="url(#g)"/><g fill="none" stroke="#e6dafa" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" opacity=".25">${frame}</g><g transform="translate(13 13) scale(1.58)" fill="none" stroke="#f5f2ff" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">${glyphs[id] || glyphs.dash}</g><path d="M44 40l8 4v9l-8 5-8-5v-9z" fill="#26154b" stroke="#c9b5ef" stroke-width=".8"/><g transform="translate(38 42)" fill="none" stroke="#f5f2ff" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round">${mark}</g></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}
