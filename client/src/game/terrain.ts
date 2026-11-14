export const TERRAINS = [
  { id: 'ember', name: 'Sun-Scorched Ember Branch', accent: '#ff8a42' },
  { id: 'dew', name: 'Moss-Slicked Dew Vine', accent: '#87e1b5' },
  { id: 'termite', name: 'Hollow Termite-Rotted Log', accent: '#c68a4c' },
  { id: 'bamboo', name: 'High-Canopy Bamboo Stalk', accent: '#d4e887' },
  { id: 'briar', name: 'Thorny Rose-Briar Stem', accent: '#f18b9d' },
  { id: 'lightning', name: 'Rain-Lashed Lightning Bough', accent: '#c6adff' },
  { id: 'frost', name: 'Frosted Pine Needle Twig', accent: '#b9e9ff' },
  { id: 'lilypad', name: 'Broken Driftwood & Lilypad Chain', accent: '#a4e3a0' },
  { id: 'totem', name: 'Silk-Wrapped Totem Branch', accent: '#e5d8f1' }
] as const;

export type TerrainId = typeof TERRAINS[number]['id'];

export function terrainAt(index: number) {
  return TERRAINS[((index % TERRAINS.length) + TERRAINS.length) % TERRAINS.length];
}
