import type { AbilityId } from './abilities';

export const SPIDER_VARIANTS = {
  weaver: ['thread', 'thread', 'reel', 'draw', 'thread', 'silkguard', 'silkguard', 'thread', 'thread', 'thread', 'reel', 'clamp', 'thread', 'thread', 'draw', 'recover'],
  hunter: ['evade', 'evade', 'evade', 'evade', 'evade', 'leech', 'focus', 'focus', 'stun', 'focus', 'evade', 'spring', 'evade', 'evade', 'focus', 'evade'],
  guardian: ['brace', 'brace', 'brace', 'shove', 'brace', 'brace', 'counter', 'guardbreak', 'guardbreak', 'guardbreak', 'brace', 'counter', 'guardbreak', 'brace', 'clamp', 'brace'],
  wolf: ['chase', 'shove', 'recover', 'chase', 'chase', 'chase', 'chase', 'shove', 'chase', 'chase', 'recover', 'chase', 'chase', 'focus', 'chase', 'chase'],
  lynx: ['fang', 'fang', 'silkguard', 'fang', 'fang', 'fang', 'fang', 'fang', 'fang', 'fang', 'silkguard', 'fang', 'fang', 'fang', 'fang', 'fang']
} as const;

export type SpiderVariant = typeof SPIDER_VARIANTS[keyof typeof SPIDER_VARIANTS][number];
const IDS: AbilityId[] = ['dash', 'web', 'surge', 'power', 'shield', 'mend', 'carapace', 'pounce', 'sweep', 'spit', 'anchor', 'riposte', 'tremor', 'haste', 'hook', 'leech'];

export function spiderVariant(species: string, id: AbilityId): SpiderVariant {
  const kit = SPIDER_VARIANTS[species as keyof typeof SPIDER_VARIANTS] || SPIDER_VARIANTS.weaver;
  return kit[IDS.indexOf(id)] || 'brace';
}

export const VARIANT_DESCRIPTIONS: Record<SpiderVariant, string> = {
  thread: 'Nearby exposed rivals are briefly caught in silk.',
  silkguard: 'A short silk ward blocks the next hit.',
  focus: 'Primes a powerful follow-up strike.',
  evade: 'Grants a brief dodge window.',
  brace: 'Restores a little guard.',
  clamp: 'Catches a nearby exposed rival for a moment.',
  chase: 'Grants a short pursuit burst.',
  fang: 'Poisons a nearby exposed rival.',
  draw: 'Draws a nearby exposed rival toward you.',
  shove: 'Shoves a nearby exposed rival away.',
  reel: 'Lifts you slightly while dangling.',
  recover: 'Restores a little grip.',
  counter: 'Opens a brief counter window.',
  spring: 'Adds a short forward burst.',
  stun: 'Briefly staggers a nearby exposed rival.',
  guardbreak: 'Chips a nearby rival’s guard.',
  leech: 'Restores grip when a rival is close.'
};
