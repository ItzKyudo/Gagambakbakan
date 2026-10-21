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
    desc: 'A quick hop with a moment of invulnerability.',
    sector: 'center',
    sectorName: 'CORE ORIGIN',
    sectorColor: '#ffd694',
    tip: 'Essential evasive hop. Gives brief invulnerability to slip through rival strikes and webs.',
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
    desc: 'Tangles and slows your rival for 1.6 seconds. A perfect block reflects it.',
    sector: 'control',
    sectorName: 'VENOM CONTROL',
    sectorColor: '#4cc7b2',
    tip: 'Tangles opponent movement. Firing it while an opponent attempts to dash ruins their positioning.',
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
    desc: 'A fast shot that stuns your rival for almost a second.',
    sector: 'control',
    sectorName: 'VENOM CONTROL',
    sectorColor: '#4cc7b2',
    tip: 'High-velocity venom projectile. Interrupts incoming attacks from across the entire branch.',
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

export function isAbilityId(id: unknown): id is AbilityId {
  return typeof id === 'string' && id in ABILITIES;
}

export function selectDraftAbilities(skills: unknown, choices: AbilityId[]): [AbilityId, AbilityId | ''] {
  const submitted = Array.isArray(skills) ? skills : [];
  const skill1 = isAbilityId(submitted[0]) && choices.includes(submitted[0]) ? submitted[0] : (choices[0] || 'dash');
  const skill2 = isAbilityId(submitted[1]) && submitted[1] !== skill1 && choices.includes(submitted[1])
    ? submitted[1]
    : (choices.find(skill => skill !== skill1) || '');
  return [skill1, skill2];
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

export function getRandomAbilities(count: number = 3, exclude: AbilityId[] = [], maxLevelOrPool: number | string[] = 12): AbilityId[] {
  let pool: AbilityId[];
  if (Array.isArray(maxLevelOrPool)) {
    pool = [...new Set(maxLevelOrPool.filter(isAbilityId))].filter(id => !exclude.includes(id));
  } else {
    pool = SKILLS_LIST
      .filter(s => s.unlock.level <= maxLevelOrPool && !exclude.includes(s.id))
      .map(s => s.id);
  }
  const finalPool: AbilityId[] = pool.length > 0 ? pool : ['dash'];
  return shuffle(finalPool).slice(0, Math.min(count, finalPool.length));
}
