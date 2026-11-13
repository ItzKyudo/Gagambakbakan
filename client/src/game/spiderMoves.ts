import type { AbilityId } from './abilities';
import { SKILL_CATALOG, nodeForAbility, skillArtForBrief, type SkillSpecies } from '../../../server/src/skillCatalog';
import { SKILL_EFFECTS } from '../../../server/src/skillEffects';

export type SpiderSpecies = 'weaver' | 'hunter' | 'guardian' | 'wolf' | 'lynx';
export const SPIDER_ELEMENTS: Record<SpiderSpecies, string> = {
  weaver: 'Water',
  hunter: 'Air',
  guardian: 'Fire',
  wolf: 'Land',
  lynx: 'Nature'
};
export interface SpiderPulse {
  range: number;
  front?: boolean;
  damage?: number;
  guard?: number;
  snare?: number;
  venom?: number;
  soak?: number;
  burn?: number;
  stun?: number;
  push?: number;
  pull?: number;
  undertow?: boolean;
  faultline?: boolean;
  detonate?: boolean;
  harvest?: boolean;
  ignite?: number;
  shred?: number;
  tailwind?: number;
  tremor?: number;
  toxin?: number;
  healSelf?: number;
  soakedBonus?: number;
  shredBonus?: number;
  requiresToxin?: boolean;
  executeBelow?: number;
  cooldownRefundOnIgnite?: number;
  knockup?: number;
  knockupIfSoaked?: boolean;
  stunIfIgniteStacks?: number;
  conditionalStunDuration?: number;
  detonateIgnite?: number;
  bleed?: number;
  silence?: number;
  disorient?: number;
}
export interface SpiderMoveEffect {
  airborne?: number;
  requiresAirborne?: boolean;
  bounceBack?: number;
  speedOnHazard?: { multiplier: number; duration: number; range: number };
  consumeFire?: boolean;
  combo?: { hits: number; duration: number; damage: number; range: number; cooldownRefundOnIgnite?: number };
  dash?: 'input' | 'forward' | 'back';
  dashTime?: number;
  pulseOnDashEnd?: boolean;
  dashStunOnWall?: number;
  projectileInv?: number;
  tether?: { range: number; duration: number; maxDistance: number; stun: number };
  evasion?: { chance: number; duration: number };
  inv?: number;
  meleeInv?: number;
  pounce?: boolean;
  lift?: number;
  anchor?: number;
  guard?: number;
  heal?: number;
  shield?: number;
  power?: number;
  haste?: number;
  counter?: number;
  leech?: number;
  cleanse?: boolean;
  pulse?: SpiderPulse;
  shot?: 'web' | 'spit' | 'hook';
  shotSpeed?: number;
  shotLife?: number;
  shotDamage?: number;
  shotToxin?: number;
  shotPushOnSoaked?: number;
  shotCutsTraps?: boolean;
  shotCount?: number;
  shotAttackSlow?: { multiplier: number; duration: number; hits: number };
  shotBloomDamage?: number;
  shotHallucination?: number;
  zone?: { radius: number; life: number; pulse: SpiderPulse; oneShot?: boolean; interval?: number; offset?: number; followsOwner?: boolean; blocksShots?: boolean; blocksMovement?: boolean; slowMultiplier?: number; damagePerMeter?: number; healOwnerPerSecond?: number; healRequiresEnemy?: boolean; onTarget?: boolean; progressiveSlow?: boolean; cage?: boolean; outerOnly?: boolean; grantStealthInterval?: number; mist?: boolean; dustCloud?: boolean; cooldownRateFraction?: number; rootImmune?: boolean; shotSpeedMultiplier?: number };
  vault?: number;
  speed?: { multiplier: number; duration: number };
  reduction?: { fraction: number; duration: number };
  regen?: { perSecond: number; duration: number; perSource?: boolean; bonusInZone?: number };
  reflect?: { damage: number; duration: number; soak?: number; ignite?: number; toxin?: number; fraction?: number; requiresBarrier?: boolean };
  meleeDamage?: { fraction: number; duration: number; requiresBarrier?: boolean };
  reveal?: { range: number; duration: number };
  barrier?: { hp: number; duration: number };
  cleanseBurn?: boolean;
  cleanseSlow?: boolean;
  stealth?: number;
  expandZone?: { radius: number; life: number; pull: number };
  cooldownRate?: { fraction: number; duration: number };
  rootImmune?: number;
  crit?: { chance: number; duration: number };
  attackSpeed?: { multiplier: number; duration: number };
  grantTailwind?: number;
  reflectShots?: number;
  knockbackImmune?: number;
  nextAttackBonus?: number;
  refreshToxinOnHit?: boolean;
  igniteZones?: boolean;
  aftershock?: number;
  tailwindBarrier?: boolean;
  healPerIgnite?: number;
  resetSkill?: AbilityId;
}
export interface SpiderMove {
  name: string;
  desc: string;
  cooldown?: number;
  art: readonly [string, string];
  effect: SpiderMoveEffect;
}

// The shared IDs are positions in the unlock web. Each species supplies its own move for that position.
export const SPIDER_MOVES: Record<SpiderSpecies, Record<AbilityId, SpiderMove>> = {
  weaver: {
    dash: { name: 'Silk Slip', desc: 'Retreat through a strike and splash a nearby rival with slowing water.', art: ['thread', 'dash'], effect: { dash: 'back', dashTime: .16, inv: .18, pulse: { range: 105, soak: .8 } } },
    web: { name: 'Orb Snare', desc: 'Launch a dew-soaked silk orb that snares and slows an unguarded rival.', art: ['orb', 'snare'], effect: { shot: 'web', shotSpeed: 590, shotLife: 1.6 } },
    surge: { name: 'Thread Reel', desc: 'While dangling, haul up 65 units and steady your line briefly.', art: ['reel', 'thread'], effect: { lift: 65, anchor: .5 } },
    power: { name: 'Loom Strike', desc: 'Prime a heavy strike and draw an exposed rival closer.', art: ['loom', 'fang'], effect: { power: 4, pulse: { range: 120, pull: 180 } } },
    shield: { name: 'Silk Veil', desc: 'Raise a silk ward and tangle a rival close to you.', art: ['veil', 'thread'], effect: { shield: 3, pulse: { range: 100, snare: .3 } } },
    mend: { name: 'Web Mend', desc: 'Wash away burn and venom, then restore 28 grip and 12 guard.', art: ['mend', 'thread'], effect: { heal: 28, guard: 12, cleanse: true } },
    carapace: { name: 'Cocoon Shell', desc: 'Wrap yourself in silk: restore 60 guard and block the next hit.', art: ['cocoon', 'shield'], effect: { guard: 60, shield: 1.5 } },
    pounce: { name: 'Snare Lunge', desc: 'Lunge into an attack while catching and soaking a nearby rival.', art: ['snare', 'leap'], effect: { dash: 'forward', dashTime: .13, pounce: true, pulse: { range: 90, snare: .4, soak: .8 } } },
    sweep: { name: 'Thread Sweep', desc: 'Sweep a nearby rival toward the edge; a soaked rival is pulled in and snared instead.', art: ['sweep', 'thread'], effect: { pulse: { range: 125, front: true, damage: 8, push: 470, undertow: true } } },
    spit: { name: 'Dew Jet', desc: 'Fire a water droplet that slows an unguarded rival and extinguishes burn.', art: ['dew', 'venom'], effect: { shot: 'spit', shotSpeed: 710, shotLife: 1.2 } },
    anchor: { name: 'Anchor Knot', desc: 'While dangling, tie off your line for 3 seconds and rise 12 units.', art: ['knot', 'anchor'], effect: { anchor: 3, lift: 12 } },
    riposte: { name: 'Silk Counter', desc: 'Prepare a counter and catch a nearby attacker in silk.', art: ['counter', 'thread'], effect: { counter: 1, pulse: { range: 95, snare: .25 } } },
    tremor: { name: 'Web Quake', desc: 'Ripple wet silk: stagger and soak an exposed rival within 250 units.', art: ['quake', 'orb'], effect: { pulse: { range: 250, stun: .55, soak: 1.2 } } },
    haste: { name: 'Orb Rush', desc: 'Scuttle forward and gain 3 seconds of faster movement.', art: ['orb', 'rush'], effect: { dash: 'forward', dashTime: .1, haste: 3 } },
    hook: { name: 'Undertow Line', desc: 'Soak a nearby rival, or pull and snare one already soaked by another water move.', art: ['line', 'hook'], effect: { pulse: { range: 220, front: true, undertow: true } } },
    leech: { name: 'Drain Thread', desc: 'Recover 7 grip and prime your next strike to steal more grip.', art: ['drain', 'thread'], effect: { heal: 7, leech: 5 } }
  },
  hunter: {
    dash: { name: 'Flash Step', desc: 'Jump in your chosen direction with a short dodge window.', art: ['eye', 'dash'], effect: { dash: 'input', dashTime: .19, inv: .22 } },
    web: { name: 'Thermal Updraft', desc: 'Hop airborne for 1.5 seconds, avoiding ground attacks while aerial strikes can still hit you.', art: ['eye', 'target'], effect: { airborne: 1.5 } },
    surge: { name: 'Spring Reel', desc: 'While dangling, spring 55 units upward and evade an incoming hit.', art: ['spring', 'reel'], effect: { lift: 55, inv: .18 } },
    power: { name: 'Fang Burst', desc: 'Prime a powerful strike and speed up for one second.', art: ['fang', 'burst'], effect: { power: 3, haste: 1 } },
    shield: { name: 'Reflex Guard', desc: 'Block one hit and open a brief counter window.', art: ['eye', 'shield'], effect: { shield: 2, counter: .4 } },
    mend: { name: 'Gale-Force Dropkick', desc: 'While airborne, dive at a rival for 70 damage and bounce backward 3 meters.', art: ['mend', 'eye'], effect: { dash: 'forward', dashTime: .14, requiresAirborne: true, pulse: { range: 160, front: true, damage: 70 }, inv: .15, bounceBack: 300 } },
    carapace: { name: 'Spring Shell', desc: 'Restore 45 guard and hop back out of range.', art: ['spring', 'shell'], effect: { guard: 45, dash: 'back', dashTime: .1 } },
    pounce: { name: 'Ambush Pounce', desc: 'Launch a long forward leap that strikes on contact.', art: ['eye', 'leap'], effect: { dash: 'forward', dashTime: .2, pounce: true, inv: .15 } },
    sweep: { name: 'Leg Scythe', desc: 'Cut an exposed rival with a wide leg sweep and shove them away.', art: ['scythe', 'sweep'], effect: { pulse: { range: 115, front: true, damage: 12, stun: .2, push: 480 } } },
    spit: { name: 'Fang Flick', desc: 'Burst forward and deliver a close venom flick.', art: ['fang', 'flick'], effect: { dash: 'forward', dashTime: .08, pulse: { range: 100, front: true, damage: 6, venom: 1.5 } } },
    anchor: { name: 'Rescue Leap', desc: 'While dangling, jump up 40 units, steady your line, and dodge.', art: ['spring', 'anchor'], effect: { lift: 40, anchor: 1, inv: .2 } },
    riposte: { name: 'Blink Counter', desc: 'Open a counter window while hopping backward.', art: ['eye', 'counter'], effect: { counter: .75, dash: 'back', dashTime: .06 } },
    tremor: { name: 'Stomp Shock', desc: 'Stomp the branch to stagger a nearby exposed rival.', art: ['stomp', 'quake'], effect: { pulse: { range: 150, damage: 5, stun: .5 } } },
    haste: { name: 'Sprint Bound', desc: 'Spring forward and move faster for 2.5 seconds.', art: ['spring', 'rush'], effect: { haste: 2.5, dash: 'forward', dashTime: .09 } },
    hook: { name: 'Crosswind Vault', desc: 'Vault behind a rival within 220 units, briefly evading attacks.', art: ['grapple', 'leap'], effect: { vault: 220, inv: .2 } },
    leech: { name: 'Fang Feast', desc: 'Bite a nearby rival and prime a grip-stealing follow-up.', art: ['fang', 'drain'], effect: { pulse: { range: 90, front: true, damage: 7 }, leech: 5 } }
  },
  guardian: {
    dash: { name: 'Side Guard', desc: 'Scuttle backward and brace for the next exchange.', art: ['plate', 'dash'], effect: { dash: 'back', dashTime: .12, guard: 14 } },
    web: { name: 'Side Clamp', desc: 'Catch a nearby exposed rival with broad forelegs and restore guard.', art: ['clamp', 'plate'], effect: { guard: 12, pulse: { range: 105, front: true, snare: .9 } } },
    surge: { name: 'Body Lift', desc: 'While dangling, haul up 40 units and restore 20 guard.', art: ['plate', 'reel'], effect: { lift: 40, guard: 20 } },
    power: { name: 'Huntsman Blow', desc: 'Prime a heavy blow that also pressures nearby guard.', art: ['plate', 'fang'], effect: { power: 5, pulse: { range: 100, front: true, guard: 15 } } },
    shield: { name: 'Iron Guard', desc: 'Block the next hit and restore 15 guard immediately.', art: ['plate', 'shield'], effect: { shield: 4, guard: 15 } },
    mend: { name: 'Shell Repair', desc: 'Recover 25 grip and rebuild 20 guard.', art: ['shell', 'mend'], effect: { heal: 25, guard: 20 } },
    carapace: { name: 'Stone Carapace', desc: 'Fully restore guard and briefly block the next hit.', art: ['shell', 'plate'], effect: { guard: 100, shield: .6 } },
    pounce: { name: 'Broad Pounce', desc: 'Scuttle forward and strike a nearby exposed rival with a wide shove.', art: ['plate', 'leap'], effect: { dash: 'forward', dashTime: .1, pulse: { range: 110, front: true, damage: 12, push: 450 } } },
    sweep: { name: 'Sprawl Sweep', desc: 'Sweep a wide arc, damaging and shoving an exposed rival.', art: ['sprawl', 'sweep'], effect: { pulse: { range: 150, front: true, damage: 8, stun: .2, push: 600 } } },
    spit: { name: 'Guard Crush', desc: 'Strike close guard; your own guard adds to the rival’s guard damage.', art: ['clamp', 'crush'], effect: { pulse: { range: 135, front: true, guard: 30, push: 120, faultline: true } } },
    anchor: { name: 'Safe Anchor', desc: 'While dangling, steady your line for 3 seconds and restore guard.', art: ['plate', 'anchor'], effect: { anchor: 3, guard: 15 } },
    riposte: { name: 'Counter Clamp', desc: 'Brace your guard and wait for a strike to counter.', art: ['clamp', 'counter'], effect: { counter: 1.2, guard: 10 } },
    tremor: { name: 'Faultline', desc: 'Shake the branch; your current guard adds to the rival’s guard damage.', art: ['plate', 'quake'], effect: { pulse: { range: 190, stun: .7, guard: 10, faultline: true } } },
    haste: { name: 'Brace Run', desc: 'Move faster for 2 seconds while restoring guard.', art: ['plate', 'rush'], effect: { haste: 2, guard: 10 } },
    hook: { name: 'Catching Arm', desc: 'Catch and pull an exposed rival with a wide foreleg.', art: ['clamp', 'hook'], effect: { pulse: { range: 150, front: true, pull: 450, snare: .2 } } },
    leech: { name: 'Recovery Fang', desc: 'Recover guard and grip, then prime a grip-stealing bite.', art: ['shell', 'drain'], effect: { guard: 8, heal: 8, leech: 5 } }
  },
  wolf: {
    dash: { name: 'Pack Skitter', desc: 'Rush forward and gain a brief pursuit burst.', art: ['track', 'dash'], effect: { dash: 'forward', dashTime: .15, haste: .8 } },
    web: { name: 'Pursuit Feint', desc: 'Shoulder an exposed rival aside and accelerate into pursuit.', art: ['track', 'feint'], effect: { dash: 'forward', dashTime: .08, haste: 1, pulse: { range: 100, front: true, push: 200 } } },
    surge: { name: 'Scramble Lift', desc: 'While dangling, climb 45 units and recover 8 grip.', art: ['track', 'reel'], effect: { lift: 45, heal: 8 } },
    power: { name: 'Pursuit Fang', desc: 'Prime a hard bite and lunge a short distance forward.', art: ['track', 'fang'], effect: { power: 4, dash: 'forward', dashTime: .06 } },
    shield: { name: 'Trail Shield', desc: 'Block one hit and gain a short burst of speed.', art: ['track', 'shield'], effect: { shield: 2, haste: 1.2 } },
    mend: { name: 'Field Mend', desc: 'Recover 22 grip without breaking your pursuit.', art: ['track', 'mend'], effect: { heal: 22, haste: 1 } },
    carapace: { name: 'Hide Armor', desc: 'Restore 65 guard and accelerate briefly.', art: ['hide', 'shell'], effect: { guard: 65, haste: .8 } },
    pounce: { name: 'Pursuit Pounce', desc: 'Chase forward into a striking leap.', art: ['track', 'leap'], effect: { dash: 'forward', dashTime: .17, pounce: true, haste: .5 } },
    sweep: { name: 'Running Sweep', desc: 'Shove an exposed rival toward the edge with a burning sweep.', art: ['track', 'sweep'], effect: { haste: .6, pulse: { range: 120, front: true, damage: 9, push: 580, burn: 1.2 } } },
    spit: { name: 'Flashpoint Bite', desc: 'Bite a nearby rival and rush forward; biting a burning rival consumes the flames for a burst.', art: ['track', 'bite'], effect: { dash: 'forward', dashTime: .12, pulse: { range: 105, front: true, damage: 8, burn: 2, detonate: true } } },
    anchor: { name: 'Grip Anchor', desc: 'While dangling, climb 22 units and hold your line for 2 seconds.', art: ['track', 'anchor'], effect: { lift: 22, anchor: 2 } },
    riposte: { name: 'Chase Counter', desc: 'Counter an incoming hit, then gain pursuit speed.', art: ['track', 'counter'], effect: { counter: .7, haste: 1 } },
    tremor: { name: 'Ground Pound', desc: 'Stagger and burn a nearby rival; existing flames burst for extra damage.', art: ['track', 'quake'], effect: { pulse: { range: 180, damage: 6, stun: .45, burn: 1.3, detonate: true } } },
    haste: { name: 'Long Sprint', desc: 'Run faster for 4 seconds and bound forward.', art: ['track', 'rush'], effect: { haste: 4, dash: 'forward', dashTime: .06 } },
    hook: { name: 'Drag Bite', desc: 'Bite and drag an exposed rival toward you, leaving a short burn.', art: ['track', 'hook'], effect: { pulse: { range: 140, front: true, damage: 5, pull: 400, burn: 1 } } },
    leech: { name: 'Predatory Bite', desc: 'Lunge forward and prime a bite that steals grip.', art: ['track', 'drain'], effect: { dash: 'forward', dashTime: .05, leech: 4 } }
  },
  lynx: {
    dash: { name: 'Thorn Step', desc: 'Step back through a strike while poisoning a nearby exposed rival.', art: ['thorn', 'dash'], effect: { dash: 'back', dashTime: .13, inv: .12, pulse: { range: 80, venom: .5 } } },
    web: { name: 'Spine Catch', desc: 'Snag a nearby rival with spined legs and deliver a venom nick.', art: ['spine', 'snare'], effect: { pulse: { range: 135, front: true, snare: 1, venom: .3 } } },
    surge: { name: 'Thorn Climb', desc: 'While dangling, climb 58 units under a brief thorn guard.', art: ['thorn', 'reel'], effect: { lift: 58, shield: .5 } },
    power: { name: 'Needle Strike', desc: 'Prime a stronger fang strike while nicking a nearby rival with venom.', art: ['needle', 'fang'], effect: { power: 4, pulse: { range: 90, front: true, damage: 4, venom: .6 } } },
    shield: { name: 'Thorn Guard', desc: 'Block one hit and poison an exposed rival who is too close.', art: ['thorn', 'shield'], effect: { shield: 2.5, pulse: { range: 90, venom: .4 } } },
    mend: { name: 'Leaf Mend', desc: 'Recover 22 grip while briefly dodging.', art: ['leaf', 'mend'], effect: { heal: 22, inv: .12 } },
    carapace: { name: 'Spiny Shell', desc: 'Rebuild 65 guard and poison a nearby exposed rival.', art: ['spine', 'shell'], effect: { guard: 65, pulse: { range: 100, venom: .6 } } },
    pounce: { name: 'Needle Pounce', desc: 'Leap into a strike while grazing a nearby rival with venom.', art: ['needle', 'leap'], effect: { dash: 'forward', dashTime: .15, pounce: true, pulse: { range: 90, front: true, venom: .7 } } },
    sweep: { name: 'Hooked Sweep', desc: 'Trip and snag an exposed rival with hooked leg spines.', art: ['spine', 'sweep'], effect: { pulse: { range: 130, front: true, damage: 8, push: 250, snare: .4 } } },
    spit: { name: 'Venom Thorn', desc: 'Fire a venom thorn and slip past a quick counterattack.', art: ['thorn', 'venom'], effect: { shot: 'spit', shotSpeed: 810, shotLife: 1.1, inv: .08 } },
    anchor: { name: 'Climbing Anchor', desc: 'While dangling, climb 20 units, steady your line, and raise a thorn guard.', art: ['thorn', 'anchor'], effect: { anchor: 2, lift: 20, shield: .4 } },
    riposte: { name: 'Thorn Counter', desc: 'Counter a strike while poisoning a nearby exposed rival.', art: ['thorn', 'counter'], effect: { counter: .9, pulse: { range: 90, venom: .5 } } },
    tremor: { name: 'Twig Tremor', desc: 'Stagger and poison a rival with a sharp vibration.', art: ['spine', 'quake'], effect: { pulse: { range: 200, stun: .35, venom: .5 } } },
    haste: { name: 'Leaf Dash', desc: 'Move faster for 2.5 seconds while stepping backward.', art: ['leaf', 'rush'], effect: { haste: 2.5, dash: 'back', dashTime: .06 } },
    hook: { name: 'Thorn Hook', desc: 'Pull and snag a nearby rival; consume existing venom to heal 20 grip.', art: ['thorn', 'hook'], effect: { pulse: { range: 150, front: true, pull: 330, snare: .4, venom: .4, harvest: true } } },
    leech: { name: 'Venom Harvest', desc: 'Poison a nearby rival, or consume venom from another nature move to heal 20 grip.', art: ['spine', 'drain'], effect: { pulse: { range: 90, venom: 1.5, harvest: true } } }
  }
};

export function spiderMove(species: string, id: AbilityId): SpiderMove {
  const move = (SPIDER_MOVES[species as SpiderSpecies] || SPIDER_MOVES.weaver)[id] || SPIDER_MOVES.weaver.dash;
  const node = SKILL_CATALOG[species as SkillSpecies]?.nodes[nodeForAbility(id)!] || SKILL_CATALOG.weaver.nodes.S1;
  return { ...move, art: skillArtForBrief(node.icon, move.art), effect: SKILL_EFFECTS[species as SkillSpecies]?.[id] || move.effect, name: node.name, desc: node.description.replaceAll('**', ''), cooldown: node.cooldown };
}
