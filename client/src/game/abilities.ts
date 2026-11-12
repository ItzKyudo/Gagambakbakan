import { spiderVariant, VARIANT_DESCRIPTIONS } from './spiderVariants';

export type AbilityId =
  | 'dash'
  | 'web'
  | 'surge'
  | 'power'
  | 'shield'
  | 'mend'
  | 'carapace'
  | 'pounce'
  | 'sweep'
  | 'spit'
  | 'anchor'
  | 'riposte'
  | 'tremor'
  | 'haste'
  | 'hook'
  | 'leech';

export type SkillUseType = 'stand' | 'hang';
export type AbilitySector = 'center' | 'aerial' | 'control' | 'assault' | 'vitality';

export interface UnlockRule {
  level: number;
}

export interface AbilityDef {
  id: AbilityId;
  name: string;
  cd: number; // in seconds
  use: SkillUseType;
  icon: string; // e.g. 'ic-dash'
  unlock: UnlockRule;
  desc: string;
  sector: AbilitySector;
  sectorName: string;
  sectorColor: string;
  tip: string;
  x: number;
  y: number;
}

export const ABILITIES: Record<AbilityId, AbilityDef> = {
  dash: {
    id: 'dash',
    name: 'Dash',
    cd: 3,
    use: 'stand',
    icon: 'ic-dash',
    unlock: { level: 1 },
    desc: 'A quick hop that phases through opponents with a moment of invulnerability.',
    sector: 'center',
    sectorName: 'CORE ORIGIN',
    sectorColor: '#ffd694',
    tip: 'Essential evasive hop. Phases through opponents and gives brief invulnerability to slip past strikes and webs.',
    x: 500,
    y: 380
  },
  surge: {
    id: 'surge',
    name: 'Surge',
    cd: 5,
    use: 'hang',
    icon: 'ic-surge',
    unlock: { level: 1 },
    desc: 'Only while dangling: one big pull worth about six taps.',
    sector: 'aerial',
    sectorName: 'AERIAL SILK',
    sectorColor: '#5aa9f0',
    tip: 'Rapid emergency lift while dangling. Worth six climb taps in a single instantaneous burst.',
    x: 500,
    y: 245
  },
  anchor: {
    id: 'anchor',
    name: 'Anchor Line',
    cd: 11,
    use: 'hang',
    icon: 'ic-anchor',
    unlock: { level: 2 },
    desc: 'Only while dangling: your thread stops sinking for 2.5 seconds, so you can climb in peace.',
    sector: 'aerial',
    sectorName: 'AERIAL SILK',
    sectorColor: '#5aa9f0',
    tip: 'Stabilizes thread sink rate, giving precious breathing room to recover and reel back to the twig.',
    x: 500,
    y: 135
  },
  haste: {
    id: 'haste',
    name: 'Haste',
    cd: 10,
    use: 'stand',
    icon: 'ic-haste',
    unlock: { level: 3 },
    desc: 'Move 50% faster for 3.5 seconds.',
    sector: 'aerial',
    sectorName: 'AERIAL SILK',
    sectorColor: '#5aa9f0',
    tip: 'Hyper-accelerates twig footwork. Enables sudden flanking and lightning hit-and-run strikes.',
    x: 500,
    y: 45
  },
  web: {
    id: 'web',
    name: 'Web',
    cd: 5,
    use: 'stand',
    icon: 'ic-web',
    unlock: { level: 1 },
    desc: 'Tangles your rival for 1.6s: cannot attack, but can still block. A parry reflects it.',
    sector: 'control',
    sectorName: 'VENOM CONTROL',
    sectorColor: '#4cc7b2',
    tip: 'Disables opponent attacks for 1.6s while allowing blocking. Denies rival aggression.',
    x: 365,
    y: 380
  },
  spit: {
    id: 'spit',
    name: 'Venom Spit',
    cd: 7,
    use: 'stand',
    icon: 'ic-spit',
    unlock: { level: 2 },
    desc: 'A fast shot that poisons your rival, draining their grip over 3 seconds.',
    sector: 'control',
    sectorName: 'VENOM CONTROL',
    sectorColor: '#4cc7b2',
    tip: 'High-velocity venom projectile. Corrodes rival grip footing over time without stunning them.',
    x: 255,
    y: 380
  },
  tremor: {
    id: 'tremor',
    name: 'Tremor',
    cd: 9,
    use: 'stand',
    icon: 'ic-tremor',
    unlock: { level: 3 },
    desc: 'Shake the twig. A nearby rival who is not blocking is stunned.',
    sector: 'control',
    sectorName: 'VENOM CONTROL',
    sectorColor: '#4cc7b2',
    tip: 'Strikes vibrations through the wood. Guaranteed stun against unblocked opponents within range.',
    x: 135,
    y: 305
  },
  hook: {
    id: 'hook',
    name: 'Silk Hook',
    cd: 7,
    use: 'stand',
    icon: 'ic-hook',
    unlock: { level: 4 },
    desc: 'Fire a hook that yanks your rival right up to you and stuns them briefly.',
    sector: 'control',
    sectorName: 'VENOM CONTROL',
    sectorColor: '#4cc7b2',
    tip: 'Harpoons rival and reels them straight into your fangs, immediately breaking defensive spacing.',
    x: 135,
    y: 455
  },
  power: {
    id: 'power',
    name: 'Power Strike',
    cd: 8,
    use: 'stand',
    icon: 'ic-power',
    unlock: { level: 1 },
    desc: 'Your next strike within 5 seconds hits for 36 grip and shoves much harder.',
    sector: 'assault',
    sectorName: 'MANDIBLE ASSAULT',
    sectorColor: '#f2a33a',
    tip: 'Empowers mandibles to shatter guard and send opponents skidding toward the edge.',
    x: 635,
    y: 380
  },
  pounce: {
    id: 'pounce',
    name: 'Pounce',
    cd: 6,
    use: 'stand',
    icon: 'ic-pounce',
    unlock: { level: 2 },
    desc: 'Lunge across the twig and strike in one move.',
    sector: 'assault',
    sectorName: 'MANDIBLE ASSAULT',
    sectorColor: '#f2a33a',
    tip: 'Surprise gap-closer. Leaps over defensive spacing to land an instantaneous impact strike.',
    x: 745,
    y: 380
  },
  sweep: {
    id: 'sweep',
    name: 'Sweep',
    cd: 8,
    use: 'stand',
    icon: 'ic-sweep',
    unlock: { level: 3 },
    desc: 'A low leg sweep: 10 grip and a big shove. Can knock a rival off the end. You are open if it whiffs.',
    sector: 'assault',
    sectorName: 'MANDIBLE ASSAULT',
    sectorColor: '#f2a33a',
    tip: 'Low-angle leg trip. Extremely dangerous near branch edges where shove distance causes drops.',
    x: 865,
    y: 305
  },
  riposte: {
    id: 'riposte',
    name: 'Riposte',
    cd: 11,
    use: 'stand',
    icon: 'ic-riposte',
    unlock: { level: 4 },
    desc: 'For 1 second, the next hit on you is cancelled and your attacker is stunned.',
    sector: 'assault',
    sectorName: 'MANDIBLE ASSAULT',
    sectorColor: '#f2a33a',
    tip: 'Counter-attack parry. Nullifies rival strike and locks them in a vulnerable stun state.',
    x: 865,
    y: 455
  },
  shield: {
    id: 'shield',
    name: 'Iron Silk',
    cd: 11,
    use: 'stand',
    icon: 'ic-shield',
    unlock: { level: 1 },
    desc: 'A silk bubble that absorbs the next hit or shot within 4 seconds.',
    sector: 'vitality',
    sectorName: 'CARAPACE BULWARK',
    sectorColor: '#9ccc3c',
    tip: 'Absorbs 100% of the next attack or projectile damage without affecting your guard gauge.',
    x: 500,
    y: 515
  },
  mend: {
    id: 'mend',
    name: 'Mend',
    cd: 12,
    use: 'stand',
    icon: 'ic-mend',
    unlock: { level: 2 },
    desc: 'Patch yourself up and restore 35 grip.',
    sector: 'vitality',
    sectorName: 'CARAPACE BULWARK',
    sectorColor: '#9ccc3c',
    tip: 'Direct grip recovery. Re-cements footing to survive relentless offensive barrages.',
    x: 500,
    y: 625
  },
  carapace: {
    id: 'carapace',
    name: 'Carapace',
    cd: 12,
    use: 'stand',
    icon: 'ic-carapace',
    unlock: { level: 3 },
    desc: 'Harden your shell: your guard bar refills instantly and a guard break is cleared.',
    sector: 'vitality',
    sectorName: 'CARAPACE BULWARK',
    sectorColor: '#9ccc3c',
    tip: 'Instant guard shield refill. Instantly breaks out of guard-break lockouts.',
    x: 405,
    y: 715
  },
  leech: {
    id: 'leech',
    name: 'Leech Fang',
    cd: 7,
    use: 'stand',
    icon: 'ic-leech',
    unlock: { level: 4 },
    desc: 'Your next hit within 5 seconds also heals you for 20 grip.',
    sector: 'vitality',
    sectorName: 'CARAPACE BULWARK',
    sectorColor: '#9ccc3c',
    tip: 'Siphons opponent energy into your own grip meter while dealing claw damage.',
    x: 595,
    y: 715
  }
};

export const SKILLS_LIST: AbilityDef[] = [
  ABILITIES.dash,
  ABILITIES.web,
  ABILITIES.surge,
  ABILITIES.power,
  ABILITIES.shield,
  ABILITIES.mend,
  ABILITIES.carapace,
  ABILITIES.pounce,
  ABILITIES.sweep,
  ABILITIES.spit,
  ABILITIES.anchor,
  ABILITIES.riposte,
  ABILITIES.tremor,
  ABILITIES.haste,
  ABILITIES.hook,
  ABILITIES.leech
];

export const ALL_ABILITY_IDS: AbilityId[] = SKILLS_LIST.map(s => s.id);

export const SPIDER_SKILL_STYLES = {
  weaver: { aerial: 1.1, control: 1.25, assault: 0.9, vitality: 0.9, center: 1.05 },
  hunter: { aerial: 1.1, control: 0.85, assault: 1.25, vitality: 0.85, center: 1.15 },
  guardian: { aerial: 0.85, control: 0.9, assault: 1, vitality: 1.3, center: 0.9 },
  wolf: { aerial: 1.2, control: 0.9, assault: 1.15, vitality: 0.9, center: 1.1 },
  lynx: { aerial: 1.25, control: 1.1, assault: 1.05, vitality: 0.85, center: 1 }
} as const;
export type SpiderSkillSpecies = keyof typeof SPIDER_SKILL_STYLES;
export function spiderSkillStrength(species: string, id: AbilityId): number {
  const style = SPIDER_SKILL_STYLES[species as SpiderSkillSpecies] || SPIDER_SKILL_STYLES.weaver;
  return style[ABILITIES[id].sector];
}

const SPIDER_SKILL_NAMES: Record<SpiderSkillSpecies, string[]> = {
  weaver: ['Silk Slip', 'Orb Snare', 'Thread Reel', 'Loom Strike', 'Silk Veil', 'Web Mend', 'Cocoon Shell', 'Snare Lunge', 'Thread Sweep', 'Venom Dew', 'Anchor Knot', 'Silk Counter', 'Web Quake', 'Orb Rush', 'Capture Line', 'Drain Thread'],
  hunter: ['Flash Step', 'Focus Lock', 'Spring Reel', 'Fang Burst', 'Reflex Guard', 'Quick Mend', 'Spring Shell', 'Ambush Pounce', 'Leg Scythe', 'Fang Flick', 'Rescue Leap', 'Blink Counter', 'Stomp Shock', 'Sprint Bound', 'Grapple Jump', 'Fang Feast'],
  guardian: ['Side Guard', 'Side Clamp', 'Body Lift', 'Huntsman Blow', 'Iron Guard', 'Shell Repair', 'Stone Carapace', 'Broad Pounce', 'Sprawl Sweep', 'Guard Crush', 'Safe Anchor', 'Counter Clamp', 'Bark Tremor', 'Brace Run', 'Catching Arm', 'Recovery Fang'],
  wolf: ['Pack Skitter', 'Pursuit Feint', 'Scramble Lift', 'Pursuit Fang', 'Trail Shield', 'Field Mend', 'Hide Armor', 'Pursuit Pounce', 'Running Sweep', 'Running Bite', 'Grip Anchor', 'Chase Counter', 'Ground Pound', 'Long Sprint', 'Drag Bite', 'Predatory Bite'],
  lynx: ['Thorn Step', 'Spine Catch', 'Thorn Climb', 'Needle Strike', 'Thorn Guard', 'Leaf Mend', 'Spiny Shell', 'Needle Pounce', 'Hooked Sweep', 'Venom Thorn', 'Climbing Anchor', 'Thorn Counter', 'Twig Tremor', 'Leaf Dash', 'Thorn Hook', 'Barb Fang']
};

const spiderAbilityCache = new Map<string, AbilityDef>();

export function getSpiderAbility(species: string, id: AbilityId): AbilityDef {
  const base = ABILITIES[id] || ABILITIES.dash;
  const key = `${species}:${base.id}`;
  const cached = spiderAbilityCache.get(key);
  if (cached) return cached;
  const names = SPIDER_SKILL_NAMES[species as SpiderSkillSpecies] || SPIDER_SKILL_NAMES.weaver;
  const strength = spiderSkillStrength(species, base.id);
  const scaled = (value: number) => Math.round(value * strength * 10) / 10;
  const descriptions: Record<AbilityId, string> = {
    dash: `Slip through an attack with ${scaled(0.2)}s of invulnerability.`,
    web: `Fire sticky silk at ${scaled(560)} speed. A hit snares for 1.6s.`,
    surge: `Pull yourself ${scaled(50)} units toward the twig while dangling.`,
    power: `Charge your next heavy strike for ${scaled(5)}s.`,
    shield: `Absorb the next hit within ${scaled(4)}s.`,
    mend: `Restore ${scaled(35)} grip instantly.`,
    carapace: `Restore up to ${Math.min(100, scaled(100))} guard and clear guard break.`,
    pounce: `Leap into a strike with ${scaled(0.14)}s of invulnerability.`,
    sweep: `Sweep for ${scaled(10)} grip damage and shove the rival toward an edge.`,
    spit: `Fire venom at ${scaled(780)} speed; a hit drains grip over 3s.`,
    anchor: `Hold your climbing thread steady for ${scaled(2.5)}s.`,
    riposte: `Cancel the next incoming hit within ${scaled(1)}s and stun the attacker.`,
    tremor: `Stun an unguarded rival within ${scaled(260)} range.`,
    haste: `Move faster for ${scaled(3.5)}s.`,
    hook: `Fire a silk hook at ${scaled(700)} speed and pull the rival toward you.`,
    leech: `Your next hit within ${scaled(5)}s restores 20 grip.`
  };
  const controlDescriptions: Partial<Record<SpiderSkillSpecies, Partial<Record<AbilityId, string>>>> = {
    hunter: { web: 'Focus on the rival. Prime a heavy follow-up and chip a distant block.', spit: 'Burst forward and deliver a close venom flick.', hook: 'Spring forward into a striking leap.' },
    guardian: { web: 'Clamp a nearby rival with wide forelegs and restore guard.', spit: 'Crush a nearby rival’s guard with a broad strike.', hook: 'Catch and pull a nearby rival with a foreleg.' },
    wolf: { web: 'Shoulder past a nearby rival and accelerate into pursuit.', spit: 'Rush forward and bite at close range.', hook: 'Drag a nearby rival toward you and poison them.' },
    lynx: { web: 'Catch a nearby rival with hooked leg spines.', hook: 'Pull and snag a nearby rival with spined forelegs.' }
  };
  const desc = `${controlDescriptions[species as SpiderSkillSpecies]?.[base.id] || descriptions[base.id]} ${VARIANT_DESCRIPTIONS[spiderVariant(species, base.id)]}`;
  const ability = {
    ...base,
    name: names[ALL_ABILITY_IDS.indexOf(base.id)],
    desc,
    tip: desc
  };
  spiderAbilityCache.set(key, ability);
  return ability;
}

export const WEB_EDGES: [AbilityId, AbilityId][] = [
  // Radial Spoke 1: North (Aerial Silk)
  ['dash', 'surge'],
  ['surge', 'anchor'],
  ['anchor', 'haste'],

  // Radial Spoke 2: West (Venom Control)
  ['dash', 'web'],
  ['web', 'spit'],
  ['spit', 'tremor'],
  ['spit', 'hook'],

  // Radial Spoke 3: East (Mandible Assault)
  ['dash', 'power'],
  ['power', 'pounce'],
  ['pounce', 'sweep'],
  ['pounce', 'riposte'],

  // Radial Spoke 4: South (Carapace Bulwark)
  ['dash', 'shield'],
  ['shield', 'mend'],
  ['mend', 'carapace'],
  ['mend', 'leech'],

  // Concentric Spiral Web Strands (The connecting rings of the spider web!)
  // Inner Ring 1 Spiral
  ['surge', 'web'],
  ['surge', 'power'],
  ['web', 'shield'],
  ['power', 'shield'],

  // Mid Ring 2 Spiral
  ['anchor', 'spit'],
  ['anchor', 'pounce'],
  ['spit', 'mend'],
  ['pounce', 'mend'],

  // Outer Perimeter Ring Spiral
  ['haste', 'tremor'],
  ['haste', 'sweep'],
  ['tremor', 'hook'],
  ['sweep', 'riposte'],
  ['hook', 'carapace'],
  ['riposte', 'leech'],
  ['carapace', 'leech']
];

export function isNodeAvailableToUnlock(id: AbilityId, unlocked: AbilityId[]): boolean {
  if (unlocked.includes(id)) return false;
  return WEB_EDGES.some(([a, b]) => {
    if (a === id) return unlocked.includes(b);
    if (b === id) return unlocked.includes(a);
    return false;
  });
}

export function getAbility(id: string): AbilityDef {
  return ABILITIES[id as AbilityId] || ABILITIES.dash;
}

export function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const t = a[i];
    a[i] = a[j];
    a[j] = t;
  }
  return a;
}

export function drawSkills(allowedPool: AbilityId[], count: number = 3): AbilityId[] {
  return shuffle(allowedPool).slice(0, count);
}
