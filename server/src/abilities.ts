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
  t: 'start' | 'wins' | 'played';
  n?: number;
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
    unlock: { t: 'start' },
    desc: 'A quick hop with a moment of invulnerability.'
  },
  web: {
    id: 'web',
    name: 'Web',
    cd: 5,
    use: 'stand',
    icon: 'ic-web',
    unlock: { t: 'start' },
    desc: 'Tangles and slows your rival for 1.6 seconds. A perfect block reflects it.'
  },
  surge: {
    id: 'surge',
    name: 'Surge',
    cd: 5,
    use: 'hang',
    icon: 'ic-surge',
    unlock: { t: 'start' },
    desc: 'Only while dangling: one big pull worth about six taps.'
  },
  power: {
    id: 'power',
    name: 'Power Strike',
    cd: 8,
    use: 'stand',
    icon: 'ic-power',
    unlock: { t: 'start' },
    desc: 'Your next strike within 5 seconds hits for 36 grip and shoves much harder.'
  },
  shield: {
    id: 'shield',
    name: 'Iron Silk',
    cd: 11,
    use: 'stand',
    icon: 'ic-shield',
    unlock: { t: 'start' },
    desc: 'A silk bubble that absorbs the next hit or shot within 4 seconds.'
  },
  mend: {
    id: 'mend',
    name: 'Mend',
    cd: 12,
    use: 'stand',
    icon: 'ic-mend',
    unlock: { t: 'wins', n: 1 },
    desc: 'Patch yourself up and restore 35 grip.'
  },
  carapace: {
    id: 'carapace',
    name: 'Carapace',
    cd: 12,
    use: 'stand',
    icon: 'ic-carapace',
    unlock: { t: 'played', n: 2 },
    desc: 'Harden your shell: your guard bar refills instantly and a guard break is cleared.'
  },
  pounce: {
    id: 'pounce',
    name: 'Pounce',
    cd: 6,
    use: 'stand',
    icon: 'ic-pounce',
    unlock: { t: 'wins', n: 2 },
    desc: 'Lunge across the twig and strike in one move.'
  },
  sweep: {
    id: 'sweep',
    name: 'Sweep',
    cd: 8,
    use: 'stand',
    icon: 'ic-sweep',
    unlock: { t: 'played', n: 3 },
    desc: 'A low leg sweep: 10 grip and a big shove. Can knock a rival off the end. You are open if it whiffs.'
  },
  spit: {
    id: 'spit',
    name: 'Venom Spit',
    cd: 7,
    use: 'stand',
    icon: 'ic-spit',
    unlock: { t: 'wins', n: 3 },
    desc: 'A fast shot that stuns your rival for almost a second.'
  },
  anchor: {
    id: 'anchor',
    name: 'Anchor Line',
    cd: 11,
    use: 'hang',
    icon: 'ic-anchor',
    unlock: { t: 'played', n: 4 },
    desc: 'Only while dangling: your thread stops sinking for 2.5 seconds, so you can climb in peace.'
  },
  riposte: {
    id: 'riposte',
    name: 'Riposte',
    cd: 11,
    use: 'stand',
    icon: 'ic-riposte',
    unlock: { t: 'wins', n: 4 },
    desc: 'For 1 second, the next hit on you is cancelled and your attacker is stunned.'
  },
  tremor: {
    id: 'tremor',
    name: 'Tremor',
    cd: 9,
    use: 'stand',
    icon: 'ic-tremor',
    unlock: { t: 'played', n: 5 },
    desc: 'Shake the twig. A nearby rival who is not blocking is stunned.'
  },
  haste: {
    id: 'haste',
    name: 'Haste',
    cd: 10,
    use: 'stand',
    icon: 'ic-haste',
    unlock: { t: 'wins', n: 5 },
    desc: 'Move 50% faster for 3.5 seconds.'
  },
  hook: {
    id: 'hook',
    name: 'Silk Hook',
    cd: 7,
    use: 'stand',
    icon: 'ic-hook',
    unlock: { t: 'wins', n: 6 },
    desc: 'Fire a hook that yanks your rival right up to you and stuns them briefly.'
  },
  leech: {
    id: 'leech',
    name: 'Leech Fang',
    cd: 7,
    use: 'stand',
    icon: 'ic-leech',
    unlock: { t: 'wins', n: 7 },
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

export function getRandomAbilities(count: number = 3, exclude: AbilityId[] = []): AbilityId[] {
  const pool = ALL_ABILITY_IDS.filter(id => !exclude.includes(id));
  return shuffle(pool).slice(0, count);
}
