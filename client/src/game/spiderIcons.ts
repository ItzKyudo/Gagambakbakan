import type { AbilityId } from './abilities';
import { SKILL_CATALOG, nodeForAbility, type SkillSpecies } from '../../../server/src/skillCatalog';
import { ICON_ART } from './spiderIconArt';

const cache = new Map<string, string>();

export function spiderAbilityIcon(species: string, id: AbilityId): string {
  const selected = species in ICON_ART ? species as SkillSpecies : 'weaver';
  const node = nodeForAbility(id) || 'S1';
  const key = `${selected}:${node}`;
  const cached = cache.get(key);
  if (cached) return cached;
  const art = ICON_ART[selected];
  const [dark, main, light, flash] = art.palette;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96" role="img" aria-label="${SKILL_CATALOG[selected].nodes[node].name}">
    <defs>
      <radialGradient id="ground" cx="48%" cy="40%" r="75%"><stop stop-color="${dark}"/><stop offset="1" stop-color="#080d12"/></radialGradient>
      <linearGradient id="material" x1=".15" y1=".05" x2=".85" y2=".95"><stop stop-color="${flash}"/><stop offset=".3" stop-color="${light}"/><stop offset=".65" stop-color="${main}"/><stop offset="1" stop-color="${dark}"/></linearGradient>
      <radialGradient id="glow"><stop stop-color="${main}" stop-opacity=".38"/><stop offset="1" stop-color="${main}" stop-opacity="0"/></radialGradient>
      <clipPath id="hex"><path d="M48 2 91 25V71L48 94 5 71V25Z"/></clipPath>
    </defs>
    <g clip-path="url(#hex)">
      <path d="M48 2 91 25V71L48 94 5 71V25Z" fill="url(#ground)"/>
      <circle cx="48" cy="48" r="44" fill="url(#glow)"/>
      <path d="M48 10 83 29V67L48 86 13 67V29Z" fill="none" stroke="${main}" stroke-opacity=".48" stroke-width="1.5"/>
      <g fill="none" stroke="${light}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">${art.nodes[Number(node.slice(1)) - 1]}</g>
      <path d="M20 78H39M57 78H76" stroke="${main}" stroke-opacity=".65" stroke-width="1"/>
    </g>
    <path d="M48 2 91 25V71L48 94 5 71V25Z" fill="none" stroke="${main}" stroke-width="2"/>
  </svg>`;
  const uri = 'data:image/svg+xml,' + encodeURIComponent(svg);
  cache.set(key, uri);
  return uri;
}

export function spiderIconHue(_species: string): string {
  return '0deg';
}
