import { SKILL_CATALOG, abilityForNode, nodeForAbility, type SkillSpecies } from '../../../server/src/skillCatalog';

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
    use: 'stand',
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
    use: 'stand',
    icon: 'ic-anchor',
    unlock: { level: 1 },
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
    unlock: { level: 1 },
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
    unlock: { level: 1 },
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
    unlock: { level: 1 },
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
    unlock: { level: 1 },
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
    unlock: { level: 1 },
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
    unlock: { level: 1 },
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
    unlock: { level: 1 },
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
    unlock: { level: 1 },
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
    unlock: { level: 1 },
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
    unlock: { level: 1 },
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

const tierNodes = new Map<number, string[]>();
for (const [nodeId, node] of Object.entries(SKILL_CATALOG.weaver.nodes)) {
  const group = tierNodes.get(node.tier) || [];
  group.push(nodeId);
  tierNodes.set(node.tier, group);
}
for (const skill of SKILLS_LIST) {
  const nodeId = nodeForAbility(skill.id)!;
  if (nodeId === 'S1') { skill.x = 500; skill.y = 380; continue; }
  const tier = SKILL_CATALOG.weaver.nodes[nodeId].tier;
  const ring = tierNodes.get(tier)!.filter(id => id !== 'S1');
  const angle = -Math.PI / 2 + ring.indexOf(nodeId) * Math.PI * 2 / ring.length + (tier % 2) * Math.PI / ring.length;
  const radius = [0, 135, 245, 285, 365][tier];
  skill.x = Math.round(500 + Math.cos(angle) * radius);
  skill.y = Math.round(380 + Math.sin(angle) * radius);
}

const spiderAbilityCache = new Map<string, AbilityDef>();

export function getSpiderAbility(species: string, id: AbilityId): AbilityDef {
  const base = ABILITIES[id] || ABILITIES.dash;
  const key = `${species}:${base.id}`;
  const cached = spiderAbilityCache.get(key);
  if (cached) return cached;
  const node = SKILL_CATALOG[species as SkillSpecies]?.nodes[nodeForAbility(base.id)!] || SKILL_CATALOG.weaver.nodes.S1;
  const tierNames = ['STARTER CORE', 'INNER HEX', 'OUTER HEX', 'APEX'];
  const tierColors = ['#ffd694', '#4cc7b2', '#b8a5ff', '#ffae79'];
  const ability = { ...base, name: node.name, cd: node.cooldown, desc: node.description.replaceAll('**', ''),
    tip: node.animation, sectorName: tierNames[node.tier - 1], sectorColor: tierColors[node.tier - 1] };
  spiderAbilityCache.set(key, ability);
  return ability;
}

export const WEB_EDGES: [AbilityId, AbilityId][] = Object.entries(SKILL_CATALOG.weaver.nodes).flatMap(([id, node]) =>
  node.requires.map(required => [abilityForNode(required)!, abilityForNode(id)!]));

export function isNodeAvailableToUnlock(id: AbilityId, unlocked: AbilityId[]): boolean {
  if (unlocked.includes(id)) return false;
  const nodeId = nodeForAbility(id);
  return !!nodeId && SKILL_CATALOG.weaver.nodes[nodeId].requires.length > 0 &&
    SKILL_CATALOG.weaver.nodes[nodeId].requires.every(required => unlocked.includes(abilityForNode(required)!));
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
