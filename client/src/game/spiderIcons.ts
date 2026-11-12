import type { AbilityId } from './abilities';

const HUE: Record<string, string> = {
  weaver: '-100deg',
  hunter: '-55deg',
  guardian: '135deg',
  wolf: '115deg',
  lynx: '180deg'
};

export function spiderAbilityIcon(_species: string, id: AbilityId): string {
  return `/abilities/${id}.png`;
}

export function spiderIconHue(species: string): string {
  return HUE[species] || HUE.weaver;
}
