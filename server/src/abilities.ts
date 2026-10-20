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

export interface UnlockRule {
  level: number;
}

export interface AbilityDef {
  id: AbilityId;
  name: string;
  cd: number; // in seconds
  use: SkillUseType;
  icon: string;
  unlock: UnlockRule;
  desc: string;
}

export const ABILITIES: Record<AbilityId, AbilityDef> = {
  dash: {
    id: 'dash',
    name: 'Dash',
    cd: 3,
    use: 'stand',
    icon: 'ic-dash',
    unlock: { level: 1 },
    desc: 'A quick hop with a moment of invulnerability.'
  },
  web: {
    id: 'web',
    name: 'Web',
    cd: 5,
    use: 'stand',
    icon: 'ic-web',
    unlock: { level: 1 },
    desc: 'Tangles and slows your rival for 1.6 seconds. A perfect block reflects it.'
  },
  surge: {
    id: 'surge',
    name: 'Surge',
    cd: 5,
    use: 'hang',
    icon: 'ic-surge',
    unlock: { level: 1 },
    desc: 'Only while dangling: one big pull worth about six taps.'
  },
  power: {
    id: 'power',
    name: 'Power Strike',
    cd: 8,
    use: 'stand',
    icon: 'ic-power',
    unlock: { level: 1 },
    desc: 'Your next strike within 5 seconds hits for 36 grip and shoves much harder.'
  },
  shield: {
    id: 'shield',
    name: 'Iron Silk',
    cd: 11,
    use: 'stand',
    icon: 'ic-shield',
    unlock: { level: 1 },
    desc: 'A silk bubble that absorbs the next hit or shot within 4 seconds.'
  },
  mend: {
    id: 'mend',
    name: 'Mend',
    cd: 12,
    use: 'stand',
    icon: 'ic-mend',
    unlock: { level: 2 },
    desc: 'Patch yourself up and restore 35 grip.'
  },
  carapace: {
    id: 'carapace',
    name: 'Carapace',
    cd: 12,
    use: 'stand',
    icon: 'ic-carapace',
    unlock: { level: 3 },
    desc: 'Harden your shell: your guard bar refills instantly and a guard break is cleared.'
  },
  pounce: {
    id: 'pounce',
    name: 'Pounce',
    cd: 6,
    use: 'stand',
    icon: 'ic-pounce',
    unlock: { level: 4 },
    desc: 'Lunge across the twig and strike in one move.'
  },
  sweep: {
    id: 'sweep',
    name: 'Sweep',
    cd: 8,
    use: 'stand',
    icon: 'ic-sweep',
    unlock: { level: 5 },
    desc: 'A low leg sweep: 10 grip and a big shove. Can knock a rival off the end. You are open if it whiffs.'
  },
  spit: {
    id: 'spit',
    name: 'Venom Spit',
    cd: 7,
    use: 'stand',
    icon: 'ic-spit',
    unlock: { level: 6 },
    desc: 'A fast shot that stuns your rival for almost a second.'
  },
  anchor: {
    id: 'anchor',
    name: 'Anchor Line',
    cd: 11,
    use: 'hang',
    icon: 'ic-anchor',
    unlock: { level: 7 },
    desc: 'Only while dangling: your thread stops sinking for 2.5 seconds, so you can climb in peace.'
  },
  riposte: {
    id: 'riposte',
    name: 'Riposte',
    cd: 11,
    use: 'stand',
    icon: 'ic-riposte',
    unlock: { level: 8 },
    desc: 'For 1 second, the next hit on you is cancelled and your attacker is stunned.'
  },
  tremor: {
    id: 'tremor',
    name: 'Tremor',
    cd: 9,
    use: 'stand',
    icon: 'ic-tremor',
    unlock: { level: 9 },
    desc: 'Shake the twig. A nearby rival who is not blocking is stunned.'
  },
  haste: {
    id: 'haste',
    name: 'Haste',
    cd: 10,
    use: 'stand',
    icon: 'ic-haste',
    unlock: { level: 10 },
    desc: 'Move 50% faster for 3.5 seconds.'
  },
  hook: {
    id: 'hook',
    name: 'Silk Hook',
    cd: 7,
    use: 'stand',
    icon: 'ic-hook',
    unlock: { level: 11 },
    desc: 'Fire a hook that yanks your rival right up to you and stuns them briefly.'
  },
  leech: {
    id: 'leech',
    name: 'Leech Fang',
    cd: 7,
    use: 'stand',
    icon: 'ic-leech',
    unlock: { level: 12 },
    desc: 'Your next hit within 5 seconds also heals you for 20 grip.'
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

export function getRandomAbilities(count: number = 3, exclude: AbilityId[] = [], maxLevel: number = 12): AbilityId[] {
  const pool = SKILLS_LIST
    .filter(s => s.unlock.level <= maxLevel && !exclude.includes(s.id))
    .map(s => s.id);
  const finalPool = pool.length >= count ? pool : ALL_ABILITY_IDS;
  return shuffle(finalPool).slice(0, count);
}
