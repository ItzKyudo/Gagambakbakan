import { ABILITIES, type AbilityId } from '../abilities';
import { spiderMove, type SpiderPulse } from '../spiderMoves';
import type { BattleStateData, PlayerStateData } from './schema/BattleState';

const STICK = { l: 100, r: 1100, y: 240, th: 22 };
const POND_Y = 478, BODY_H = 30;
const BODY_Y = STICK.y + STICK.th + BODY_H;
const LBL_Y = BODY_Y + 46;
const MAXDROP = POND_Y - BODY_Y - 26 - 4;
const REACH = 84, MINDIST = 48, SPEED = 175, PARRY = 0.08;
const ATK_LIGHT = { wind: 0.10, act: 0.18, end: 0.3 };
const ATK_HEAVY = { wind: 0.22, act: 0.38, end: 0.6 };
const ATK = ATK_LIGHT;
const REEL_CD = 0.14, TAP = 8, FALL_DEPTH = 100, FALL_SPEED = 320, SURGE_LIFT = 50;
const MAX_GRIP = 120, RECOVER_GRIP = 65, VENOM_DPS = 5, WEB_SNARE = 1.6;
const FATIGUE_MAX = 4;
const cl = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

export interface PlayerInput {
  left: boolean;
  right: boolean;
  strike: boolean;
  heavy: boolean;
  block: boolean;
  reel: number;
  ab1: number;
  ab2: number;
}

export class BattleCombat {
  private battleState: BattleStateData;
  private send: (type: string, data: any) => void;
  private tapTimes: [number[], number[]] = [[], []];
  private tapBuf: [boolean, boolean] = [false, false];
  private reelCd: [number, number] = [0, 0];
  private lastReelTimes: [number[], number[]] = [[], []];
  private windJitter: [number, number] = [0.16, 0.16];
  private kb: [number, number] = [0, 0];
  private cool: [number, number] = [0, 0];
  private timeElapsed = 0;
  private terrainHits = 0;
  private jumpCd: [number, number] = [0, 0];
  private thornCd: [number, number] = [0, 0];

  constructor(battleState: BattleStateData, send: (type: string, data: any) => void) {
    this.battleState = battleState;
    this.send = send;
  }

  private broadcast(type: string, data: any) {
    this.send(type, data);
  }

  public resetRound() {
    this.terrainHits = 0;
    this.jumpCd = [0, 0];
    this.thornCd = [0, 0];
    this.tapTimes = [[], []];
    this.tapBuf = [false, false];
    this.reelCd = [0, 0];
    this.lastReelTimes = [[], []];
    this.windJitter = [0.16, 0.16];
    this.kb = [0, 0];
    this.cool = [0, 0];
  }

  public update(dt: number, inp0: PlayerInput, inp1: PlayerInput) {
    this.timeElapsed += dt;
    if (this.battleState.status !== 'fight') return;

    this.stepSpider(this.battleState.p1, this.battleState.p2, inp0, dt);
    this.stepSpider(this.battleState.p2, this.battleState.p1, inp1, dt);
    this.separate(dt);
    this.stepWebs(dt);
    this.stepTerrain(dt);
  }

  private stepTerrain(dt: number) {
    const state = this.battleState;
    if (state.p1.hang || state.p2.hang) return;
    const previous = state.terrainTime;
    state.terrainTime += dt;
    state.terrainClearT = Math.max(0, state.terrainClearT - dt);
    state.terrainPuddleT = Math.max(0, state.terrainPuddleT - dt);
    state.terrainFireT = Math.max(0, state.terrainFireT - dt);
    const players = [state.p1, state.p2];
    if (state.terrain === 'ember') {
      for (const s of players) if (!s.hang && !s.ko && s.species !== 'guardian' && [350, 600, 850].some(x => Math.abs(s.x - x) < 55)) {
        this.hurt(s, 2.5 * dt);
        if (s.burn > 0) s.igniteStacks = Math.min(5, (s.igniteStacks || 0) + dt * .35);
      }
      for (const web of state.webs) if (web.species === 'weaver') web.life -= dt * .3;
      if (Math.floor(previous / 8) < Math.floor(state.terrainTime / 8)) {
        const x = [350, 600, 850][Math.floor(previous / 8) % 3];
        for (const s of players) if (!s.hang && Math.abs(s.x - x) < 58) { s.airT = Math.max(s.airT || 0, .7); s.terrainJumpT = .7; }
        this.emitFx({ type: 'dust', x, y: STICK.y, count: 12 });
      }
    }
    if (state.terrain === 'dew') for (const s of players) if (!s.hang && !s.ko && Math.abs(s.x - 600) < 105) {
      s.soak = Math.max(s.soak, 1.5);
      s.burn = 0;
    }
    if (state.terrain === 'bamboo') {
      const wind = Math.floor(state.terrainTime / 8) % 2 ? 1 : -1;
      for (const s of players) if (!s.hang && !s.ko && s.species !== 'hunter' && !(s.species === 'wolf' && [235, 415, 595, 775, 955].some(x => Math.abs(s.x - x) < 22))) s.x += wind * 14 * dt;
      for (const s of players) if (s.species === 'hunter' && (s.terrainJumpT || 0) > 0 && [230, 970].some(x => Math.abs(s.x - x) < 60)) s.airT = Math.max(s.airT || 0, .85);
    }
    if (state.terrain === 'briar') for (const s of players) if (!s.hang && !s.ko && s.species !== 'lynx' && state.terrainClearT <= 0 && [275, 430, 790, 950].some(x => Math.abs(s.x - x) < 32)) {
      this.hurt(s, 4 * dt);
      s.stun = Math.max(s.stun, .06);
      if (Math.abs(this.kb[s.id]) > 100 && this.thornCd[s.id] <= 0) {
        this.hurt(s, 4);
        s.stun = Math.max(s.stun, .22);
        this.thornCd[s.id] = .6;
      }
    }
    if (state.terrain === 'lightning') {
      const strikeIndex = Math.floor(state.terrainTime / 15);
      const strikeX = 250 + ((state.round * 137 + strikeIndex * 293) % 700);
      const phase = state.terrainTime % 15;
      state.terrainStrike = phase >= 13.5 ? { x: strikeX, warning: 15 - phase } : undefined;
      if (Math.floor(previous / 15) < strikeIndex) {
        const x = 250 + ((state.round * 137 + (strikeIndex - 1) * 293) % 700);
        for (const s of players) if (!s.hang && !s.ko && Math.abs(s.x - x) < 72 && (s.airT || 0) <= 0) {
          this.hurt(s, 9);
          s.stun = Math.max(s.stun, .8);
          if (s.soak > 0) this.hurt(s, 5);
        }
        state.terrainPuddleT = 2;
        this.emitFx({ type: 'spark', x, y: STICK.y, col: '#d8c7ff', count: 28, sp: 300 });
      }
      if (state.terrainPuddleT > 0) {
        const x = 250 + ((state.round * 137 + (Math.floor(state.terrainTime / 15) - 1) * 293) % 700);
        for (const s of players) if (!s.hang && s.soak > 0 && Math.abs(s.x - x) < 110) this.hurt(s, 4 * dt);
      }
    }
    if (state.terrain === 'frost') for (const s of players) if (!s.hang && !s.ko && (s.x < 155 || s.x > 1045) && (s.airT || 0) <= 0) {
      s.airT = .7;
      s.terrainJumpT = .7;
      this.kb[s.id] = s.x < 600 ? 300 : -300;
    }
    if (state.terrain === 'lilypad') {
      const both = players.every(s => !s.hang && !s.ko && Math.abs(s.x - 600) < 95);
      state.terrainSink = Math.max(0, Math.min(1, state.terrainSink + (both ? dt * .75 : -dt)));
      if (state.terrainSink >= 1) for (const s of players) if (!s.hang && Math.abs(s.x - 600) < 95) s.soak = Math.max(s.soak, 1);
    }
    if (state.terrain === 'totem' && state.terrainFireT > 0) for (const s of players) if (!s.hang && s.species !== 'guardian' && [380, 820].some(x => Math.abs(s.x - x) < 40)) this.hurt(s, 3 * dt);
    for (const s of players) if (!s.hang && !s.ko) {
      if (s.grip <= 0) { this.fall(s); continue; }
      const gap = ((state.terrain === 'ember' || state.terrain === 'termite') && state.terrainBroken && Math.abs(s.x - 600) < 34 && !s.under)
        || (state.terrain === 'lightning' && s.x > 914 && s.x < 936);
      if (gap && (s.airT || 0) <= 0 && s.dashT <= 0) this.fall(s);
    }
  }

private emitFx(fx: any) {
  this.broadcast('fx', fx);
}

private emitSound(name: string) {
  this.broadcast('snd', { name });
}

private emitShake(amount: number) {
  this.broadcast('shake', { amount });
}

private fall(s: PlayerStateData) {
  this.battleState.terrainTime = 0;
  this.battleState.terrainBroken = false;
  this.battleState.terrainStrike = undefined;
  this.battleState.terrainSink = 0;
  this.battleState.terrainClearT = 0;
  this.battleState.terrainBuds = 0;
  this.battleState.terrainPuddleT = 0;
  this.battleState.terrainFireT = 0;
  this.terrainHits = 0;
  const waiting = s.id === 0 ? this.battleState.p2 : this.battleState.p1;
  if (!waiting.hang && !waiting.ko) {
    this.kb[waiting.id] = 0;
    waiting.dashT = 0;
    waiting.pounce = false;
    waiting.atkT = 0;
    waiting.stun = 0;
    waiting.snare = 0;
    waiting.tetherT = 0;
    waiting.terrainJumpT = 0;
    waiting.burn = 0;
    waiting.igniteStacks = 0;
    waiting.venom = 0;
    waiting.toxin = 0;
    waiting.bleedT = 0;
    waiting.bloomT = 0;
  }
  s.hang = true;
  s.under = false;
  s.falling = true;
  s.drop = 12;
  s.dropV = 0;
  s.atkT = 0;
  s.isHeavy = false;
  s.blocking = false;
  s.stun = 0;
  this.kb[s.id] = 0;
  s.grip = 0;
  this.reelCd[s.id] = 0;
  this.tapBuf[s.id] = false;
  s.dashT = 0;
  s.airT = 0;
  s.terrainJumpT = 0;
  s.dashBounceBack = undefined;
  s.dashSpeedOnHazard = undefined;
  s.disorientT = 0;
  s.dashPulse = undefined;
  s.dashStunOnWall = undefined;
  s.dashHitWall = false;
  s.tetherT = 0;
  s.tetherAnchorX = undefined;
  s.tetherMaxDistance = undefined;
  s.tetherStun = undefined;
  s.projectileInvT = 0;
  s.evasionT = 0;
  s.snare = 0;
  s.venom = 0;
  s.soak = 0;
  s.burn = 0;
  s.igniteStacks = 0;
  s.shredStacks = 0;
  s.shredT = 0;
  s.tailwindStacks = 0;
  s.tailwindT = 0;
  s.tremorT = 0;
  s.bleedT = 0;
  s.silenceT = 0;
  s.speedT = 0;
  s.reductionT = 0;
  s.regenT = 0;
  s.reflectT = 0;
  s.reflectFraction = undefined;
  s.reflectRequiresBarrier = false;
  s.meleeDamageT = 0;
  s.barrierT = 0;
  s.barrierHp = 0;
  s.stealthT = 0;
  s.cooldownT = 0;
  s.rootImmuneT = 0;
  s.critT = 0;
  s.revealT = 0;
  s.attackSpeedT = 0;
  s.reflectShotsT = 0;
  s.knockbackImmuneT = 0;
  s.nextAttackBonus = 0;
  s.refreshToxinOnHit = false;
  s.aftershockT = 0;
  s.bloomT = 0;
  s.hallucinationT = 0;
  s.comboHits = 0;
  s.toxin = 0;
  s.pounce = false;
  s.power = 0;
  s.shield = 0;
  s.hasteT = 0;
  s.riposte = 0;
  s.leech = 0;
  s.anchorT = 0;

  s.x = cl(s.x, STICK.l, STICK.r);
  s.falls++;

  const f = Math.min(s.falls - 1, FATIGUE_MAX);
  s.tapLift = TAP;
  s.depth = Math.min(FALL_DEPTH + 12 * f, MAXDROP - 30);
  s.hangT = 0;
  s.hold = Math.min(10, Math.max(1, s.falls));
  this.tapTimes[s.id] = [];
  s.rate = 0;

  this.emitFx({ type: 'txt', x: s.x, y: LBL_Y, text: s.falls > 1 ? `FALL ×${s.falls}` : 'FALL!', col: '#e8593f' });
  this.emitFx({ type: 'dust', x: s.x, y: STICK.y + STICK.th, count: 6 });
  this.emitShake(6);
  this.emitSound('fall');
}

private recover(s: PlayerStateData) {
  s.hang = false;
  s.falling = false;
  s.hangT = 0;
  s.drop = 0;
  s.dropV = 0;
  const opponent = s.id === 0 ? this.battleState.p2 : this.battleState.p1;
  s.grip = Math.max(1, Math.min(RECOVER_GRIP, opponent.grip - 10));
  s.guard = 100;
  s.gLock = false;
  s.inv = 1.1;
  s.stun = 0.25;
  this.kb[s.id] = 0;
  s.x = cl(s.x, STICK.l + 10, STICK.r - 10);
  if (this.battleState.terrainBroken && Math.abs(s.x - 600) < 40) s.x = s.id === 0 ? 550 : 650;
  if (this.battleState.terrain === 'lightning' && s.x > 914 && s.x < 936) s.x = 900;

  this.emitFx({ type: 'txt', x: s.x, y: LBL_Y, text: 'BACK UP!', col: s.colorLight });
  this.emitFx({ type: 'dust', x: s.x, y: STICK.y + STICK.th, count: 8 });
  this.emitSound('recover');
}

private guardBreak(s: PlayerStateData) {
  s.guard = 0;
  s.gLock = true;
  s.stun = 0.9;
  s.blocking = false;
  s.atkT = 0;
  s.isHeavy = false;

  this.emitFx({ type: 'txt', x: s.x, y: LBL_Y, text: 'GUARD BREAK', col: '#e8593f' });
  this.emitFx({ type: 'spark', x: s.x, y: BODY_Y, col: '#bfe0f4', count: 12, sp: 200 });
  this.emitShake(6);
  this.emitSound('guardbreak');
}

private knockOut(s: PlayerStateData) {
  if (this.battleState.status !== 'fight') return;
  s.ko = true;
  s.hang = true;
  this.battleState.status = 'roundEnd';
  this.battleState.stateT = 0;

  const winner = s.id === 0 ? this.battleState.p2 : this.battleState.p1;
  winner.wins++;
  winner.cheer = true;
  winner.blocking = false;

  this.emitFx({ type: 'splash', x: s.x, y: POND_Y });
  this.emitShake(14);
  this.emitSound('ko');
  this.broadcast('roundWon', { winner: winner.id, round: this.battleState.round, p1Wins: this.battleState.p1.wins, p2Wins: this.battleState.p2.wins });
}

private absorb(b: PlayerStateData) {
  b.shield = 0;
  this.emitFx({ type: 'txt', x: b.x, y: LBL_Y, text: 'ABSORBED', col: '#cfe9ff' });
  this.emitFx({ type: 'spark', x: b.x, y: BODY_Y, col: '#cfe9ff', count: 12, sp: 220 });
  this.emitShake(3);
  this.emitSound('absorb');
}

private counter(b: PlayerStateData, a: PlayerStateData) {
  b.riposte = 0;
  a.stun = Math.max(a.stun, 0.7);
  a.atkT = 0;
  a.isHeavy = false;
  this.cool[a.id] = 0.2;

  this.emitFx({ type: 'txt', x: b.x, y: LBL_Y + 4, text: 'RIPOSTE!', col: '#ffffff' });
  this.emitFx({ type: 'spark', x: (a.x + b.x) / 2, y: BODY_Y - 6, col: '#ffffff', count: 16, sp: 280 });
  this.emitShake(8);
  this.emitSound('parry');
}

private clash(a: PlayerStateData, b: PlayerStateData) {
  const hx = (a.x + b.x) / 2;
  const hy = BODY_Y - 6;

  const isHeavy = !!a.isHeavy;
  const pw = a.power > 0 || b.power > 0;
  if (a.power > 0) a.power = 0;
  if (b.power > 0) b.power = 0;

  // Deflect both attacks
  a.atkT = 0;
  a.isHeavy = false;
  b.atkT = 0;
  b.isHeavy = false;

  // Recovery cooldown & parry stance for both
  this.cool[a.id] = isHeavy ? 0.16 : 0.10;
  this.cool[b.id] = isHeavy ? 0.16 : 0.10;
  a.parryT = 0.22;
  b.parryT = 0.22;

  // Mutual micro-recoil
  a.stun = isHeavy ? 0.18 : 0.14;
  b.stun = isHeavy ? 0.18 : 0.14;

  // Pushback recoil separating both fighters back
  const kbForce = isHeavy ? 260 : 200;
  this.kb[a.id] = -a.face * (pw ? kbForce * 1.3 : kbForce);
  this.kb[b.id] = -b.face * (pw ? kbForce * 1.3 : kbForce);

  // Spark burst & shake
  const sparkCount = isHeavy ? 26 : 16;
  const sparkSpeed = isHeavy ? 340 : 260;
  this.emitFx({ type: 'spark', x: hx, y: hy, col: '#ffffff', count: sparkCount, sp: sparkSpeed });
  this.emitFx({ type: 'spark', x: hx, y: hy, col: a.color, count: 8, sp: 220 });
  this.emitFx({ type: 'spark', x: hx, y: hy, col: b.color, count: 8, sp: 220 });
  this.emitShake(isHeavy ? 9 : 6);
  this.emitSound('parry');

  const clashText = isHeavy ? 'HEAVY CLASH!' : 'CLASH!';
  this.emitFx({ type: 'txt', x: hx, y: LBL_Y + 4, text: clashText, col: '#ffd694' });
}

private doStrike(a: PlayerStateData, b: PlayerStateData) {
  if (b.ko || b.hang) return;

  const isHeavy = !!a.isHeavy;
  const d = (b.x - a.x) * a.face;

  // Spider hitboxes:
  // Arm physically reaches ~96px forward for light attack, and ~108px for heavy attack.
  // The target spider body extends ~28px towards a (head, pedipalps & fangs).
  // If the arm of the spider reaches the spider body (d <= armReach + bodyRadius), it hits!
  const armReach = isHeavy ? 108 : 96;
  const bodyRadius = 28;
  const maxHitDistance = armReach + bodyRadius; // 124px for light, 136px for heavy

  if (d < -15 || d > maxHitDistance || b.inv > 0 || (b.meleeInvT || 0) > 0 || (b.airT || 0) > 0 || a.under !== b.under) return;
  if (this.evades(b)) return;

  const pw = a.power > 0;

  if (b.riposte > 0) {
    if (pw) a.power = 0;
    this.counter(b, a);
    return;
  }

  // Attack clash rules:
  // 1. Only works if the SAME attack is done (Light vs Light, or Heavy vs Heavy).
  // 2. Will NOT clash if one player is slightly faster than the other (must reach strike frame near-simultaneously within ~25ms).
  const aHeavy = isHeavy;
  const bHeavy = !!b.isHeavy;
  const sameAttack = aHeavy === bHeavy;
  const facingEachOther = a.face !== b.face && (b.x - a.x) * a.face > 0;
  const bWind = bHeavy ? ATK_HEAVY.wind : ATK_LIGHT.wind;
  const isNearSimultaneous = b.atkT >= (bWind - 0.025) && b.atkT <= (bWind + 0.035);

  if (sameAttack && facingEachOther && isNearSimultaneous && !b.blocking && b.stun <= 0) {
    this.clash(a, b);
    return;
  }

  if (pw) a.power = 0;

  const hx = a.x + a.face * Math.min(armReach, Math.max(20, d - 8));
  const hy = BODY_Y - 6;

  if (b.blocking) {
    if (b.blockT <= PARRY) {
      // Perfect parry
      a.stun = isHeavy ? 0.85 : 0.65;
      a.atkT = 0;
      a.isHeavy = false;
      this.cool[a.id] = 0.2;
      b.parryT = 0.25;
      b.guard = Math.min(100, b.guard + (isHeavy ? 24 : 16));

      this.emitFx({ type: 'txt', x: b.x, y: LBL_Y + 4, text: 'PARRY!', col: '#ffffff' });
      this.emitFx({ type: 'spark', x: hx, y: hy, col: '#ffffff', count: 16, sp: 280 });
      this.emitShake(8);
      this.emitSound('parry');
    } else {
      // Normal block
      const guardDmg = isHeavy ? (pw ? 48 : 36) : (pw ? 28 : 15);
      const gripDmg = isHeavy ? (pw ? 8 : 4) : (pw ? 4 : 2);
      const kbForce = isHeavy ? (pw ? 360 : 250) : (pw ? 200 : 120);
      b.guard -= guardDmg * (1 + .1 * (b.shredStacks || 0));
      b.grip = Math.max(1, b.grip - gripDmg);
      if (!(b.knockbackImmuneT && b.knockbackImmuneT > 0)) this.kb[b.id] = a.face * kbForce;
      a.stun = isHeavy ? 0.24 : 0.16;

      this.emitFx({ type: 'txt', x: b.x, y: LBL_Y, text: isHeavy ? 'CRUSH BLOCK' : 'BLOCK', col: b.colorLight });
      this.emitFx({ type: 'spark', x: hx, y: hy, col: b.colorLight, count: isHeavy ? 12 : 8, sp: isHeavy ? 220 : 180 });
      this.emitShake(isHeavy ? 5 : 3);
      this.emitSound('block');
      if (b.guard <= 0) this.guardBreak(b);
    }
  } else if (b.shield > 0) {
    this.absorb(b);
    a.stun = isHeavy ? 0.35 : 0.22;
    a.atkT = 0;
    a.isHeavy = false;
  } else {
    // Direct hit
    const baseGripDmg = isHeavy ? (pw ? 48 : 32) : (pw ? 26 : 14);
    const meleeBoost = (a.meleeDamageT || 0) > 0 && (!a.meleeDamageRequiresBarrier || (a.barrierHp || 0) > 0) ? a.meleeDamageFraction || 0 : 0;
    const bambooDive = this.battleState.terrain === 'bamboo' && a.species === 'hunter' && (a.airT || 0) > 0 ? 1.25 : 1;
    const gripDmg = baseGripDmg * (1 + meleeBoost) * bambooDive;
    const kbForce = (isHeavy ? (pw ? 760 : 580) : (pw ? 480 : 300)) * bambooDive;
    const stunDur = isHeavy ? (pw ? 0.55 : 0.42) : (pw ? 0.32 : 0.20);
    const flash = isHeavy ? 0.24 : 0.16;
    const received = this.hurt(b, (gripDmg + ((a.stealthT || 0) > 0 ? a.nextAttackBonus || 0 : 0)) * ((a.critT || 0) > 0 && Math.random() < (a.critChance || 0) ? 1.5 : 1));
    if ((a.aftershockT || 0) > 0) this.applySpiderPulse(a, b, { range: 140, damage: 20, tremor: .5 });
    if ((a.stealthT || 0) > 0 && a.refreshToxinOnHit) { b.toxin = Math.max(b.toxin || 0, 4); b.venom = Math.max(b.venom, 4); }
    a.nextAttackBonus = 0;
    a.refreshToxinOnHit = false;
    a.stealthT = 0;
    this.reflectHit(b, a, received);
    if (!(b.knockbackImmuneT && b.knockbackImmuneT > 0)) this.kb[b.id] = a.face * kbForce;
    b.stun = stunDur;
    b.atkT = 0;
    b.isHeavy = false;
    b.hitFlash = flash;

    this.emitFx({ type: 'spark', x: hx, y: hy, col: '#ffffff', count: isHeavy ? 14 : 10, sp: isHeavy ? 300 : 260 });
    this.emitFx({ type: 'spark', x: hx, y: hy, col: a.color, count: isHeavy ? 12 : 8, sp: isHeavy ? 260 : 220 });
    this.emitShake(isHeavy ? (pw ? 15 : 10) : (pw ? 10 : 5));
    this.emitSound(isHeavy ? 'power_strike' : (pw ? 'power_strike' : 'strike'));

    if (pw) {
      this.emitFx({ type: 'txt', x: b.x, y: LBL_Y, text: isHeavy ? 'COLOSSAL SMASH!' : 'POWER HIT!', col: a.colorLight });
    } else if (isHeavy) {
      this.emitFx({ type: 'txt', x: b.x, y: LBL_Y, text: 'HEAVY HIT!', col: a.colorLight });
    }

    if (a.leech > 0) {
      a.leech = 0;
      const leechGrip = isHeavy ? 30 : 18;
      a.grip = Math.min(MAX_GRIP, a.grip + leechGrip);
      this.emitFx({ type: 'txt', x: a.x, y: LBL_Y, text: `+${leechGrip} GRIP`, col: '#9cf0a8' });
      this.emitFx({ type: 'spark', x: a.x, y: BODY_Y, col: '#d24a5a', count: 8, sp: 150 });
    }

    if (b.grip <= 0) this.fall(b);
    if (a.grip <= 0) this.fall(a);
  }
}

private hurt(s: PlayerStateData, damage: number) {
  if (this.battleState.status === 'fight' && !s.hang && (s.id === 0 ? this.battleState.p2 : this.battleState.p1).hang) return 0;
  let remaining = damage * (1 + .1 * (s.shredStacks || 0)) * (1 - ((s.reductionT || 0) > 0 ? s.reductionFraction || 0 : 0));
  const received = remaining;
  if ((s.barrierHp || 0) > 0) {
    const absorbed = Math.min(s.barrierHp || 0, remaining);
    s.barrierHp = (s.barrierHp || 0) - absorbed;
    remaining -= absorbed;
  }
  s.grip -= remaining;
  return received;
}

private reflectHit(s: PlayerStateData, o: PlayerStateData, received: number) {
  if (!((s.reflectT || 0) > 0) || (s.reflectRequiresBarrier && !((s.barrierHp || 0) > 0))) return;
  this.hurt(o, s.reflectFraction ? received * s.reflectFraction : s.reflectDamage || 0);
  if (s.reflectSoak) { o.soak = Math.max(o.soak, s.reflectSoak); o.burn = 0; o.igniteStacks = 0; }
  if (s.reflectIgnite && o.soak <= 0) { o.igniteStacks = Math.min(5, (o.igniteStacks || 0) + s.reflectIgnite); o.burn = Math.max(o.burn, 4); }
  if (s.reflectToxin) { o.toxin = Math.max(o.toxin || 0, s.reflectToxin); o.venom = Math.max(o.venom, s.reflectToxin); }
}

private evades(s: PlayerStateData) {
  return Math.random() < Math.min(.95, (s.tailwindStacks || 0) * .05 + ((s.evasionT || 0) > 0 ? s.evasionChance || 0 : 0));
}

private rootImmune(s: PlayerStateData) {
  return (s.rootImmuneT || 0) > 0 || this.battleState.webs.some(w => w.owner === s.id && w.rootImmune && w.zoneRadius && Math.abs(s.x - w.x) <= w.zoneRadius);
}

private wallX(s: PlayerStateData, nextX: number, dashing = false) {
  for (const w of this.battleState.webs) {
    if (w.owner === s.id || !w.zoneRadius) continue;
    const left = w.x - w.zoneRadius, right = w.x + w.zoneRadius;
    if (w.cage && !dashing && s.x >= left && s.x <= right) nextX = cl(nextX, left, right);
    if (!w.blocksMovement) continue;
    if (s.x < left && nextX > left) nextX = left;
    if (s.x > right && nextX < right) nextX = right;
  }
  return nextX;
}

private applySpiderPulse(s: PlayerStateData, o: PlayerStateData, pulse: SpiderPulse, originX = s.x) {
  if (s.hang || o.hang) return;
  if (this.battleState.terrain === 'ember' && !this.battleState.terrainBroken && Math.abs(originX - 600) < 140 && (pulse.detonate || pulse.detonateIgnite)) {
    this.terrainHits++;
    if (this.terrainHits >= 2) this.battleState.terrainBroken = true;
  }
  if (this.battleState.terrain === 'totem' && s.species === 'guardian' && [380, 820].some(x => Math.abs(originX - x) < 90) && (pulse.burn || pulse.ignite)) {
    this.battleState.terrainClearT = 4;
    this.battleState.terrainFireT = 4;
  }
  if (this.battleState.terrain === 'termite' && s.under !== o.under) return;
  if (this.battleState.terrain === 'termite' && s.species === 'wolf' && s.under) pulse = { ...pulse, range: pulse.range * 1.3, stun: (pulse.stun || 0) * 1.3 };
  if (this.battleState.terrain === 'totem' && pulse.tremor && (o.airT || 0) > 0 && [380, 820].some(x => Math.abs(o.x - x) < 45)) return;
  if (this.battleState.terrain === 'ember' && s.species === 'guardian' && [350, 600, 850].some(x => Math.abs(s.x - x) < 55) && pulse.ignite && o.soak <= 0) pulse = { ...pulse, ignite: pulse.ignite + 1 };
  if (this.battleState.terrain === 'briar' && s.species === 'guardian' && (pulse.burn || pulse.ignite)) this.battleState.terrainClearT = 4;
  const distance = (o.x - originX) * s.face;
  if (o.ko || o.inv > 0 || ((o.airT || 0) > 0 && !pulse.tremor) || Math.abs(o.x - originX) > pulse.range || (pulse.front && distance < 0) || (pulse.requiresToxin && !(o.toxin && o.toxin > 0)) || this.evades(o)) return;
  if (o.blocking && o.blockT <= PARRY) {
    s.stun = Math.max(s.stun, .45);
    this.emitFx({ type: 'txt', x: o.x, y: LBL_Y, text: 'PARRY!', col: '#ffffff' });
    return;
  }
  if (o.shield > 0) { this.absorb(o); return; }
  if (o.riposte > 0) { this.counter(o, s); return; }
  if (o.blocking) {
    o.guard -= ((pulse.guard || (pulse.damage ? 12 : 0)) + (pulse.faultline ? s.guard * .35 : 0)) * (1 + .1 * (o.shredStacks || 0));
    if (o.guard <= 0) this.guardBreak(o);
    else this.emitFx({ type: 'txt', x: o.x, y: LBL_Y, text: 'BLOCK', col: o.colorLight });
    return;
  }
  const received = pulse.damage ? this.hurt(o, pulse.damage + (o.soak > 0 ? pulse.soakedBonus || 0 : 0) + ((o.shredStacks || 0) > 0 ? pulse.shredBonus || 0 : 0)) : 0;
  this.reflectHit(o, s, received);
  if (pulse.executeBelow && o.grip <= MAX_GRIP * pulse.executeBelow) o.grip = 0;
  if (pulse.detonateIgnite && (o.igniteStacks || 0) > 0) { this.hurt(o, (o.igniteStacks || 0) * pulse.detonateIgnite); o.igniteStacks = 0; o.burn = 0; }
  if (pulse.ignite && o.soak <= 0) { o.igniteStacks = Math.min(5, (o.igniteStacks || 0) + pulse.ignite); o.burn = Math.max(o.burn, 4); }
  if (pulse.shred) { o.shredStacks = Math.min(3, (o.shredStacks || 0) + pulse.shred); o.shredT = 4; }
  if (pulse.tailwind) { s.tailwindStacks = Math.min(4, (s.tailwindStacks || 0) + pulse.tailwind); s.tailwindT = 4; }
  if (pulse.tremor) { o.airT = 0; o.tremorT = Math.max(o.tremorT || 0, pulse.tremor); o.dashT = 0; }
  if (pulse.disorient) o.disorientT = Math.max(o.disorientT || 0, pulse.disorient);
  if (pulse.toxin) { o.toxin = Math.max(o.toxin || 0, pulse.toxin); o.venom = Math.max(o.venom, pulse.toxin); }
  if (pulse.bleed) o.bleedT = Math.max(o.bleedT || 0, pulse.bleed);
  if (pulse.silence) o.silenceT = Math.max(o.silenceT || 0, pulse.silence);
  if (pulse.knockup && (!pulse.knockupIfSoaked || o.soak > 0)) { o.stun = Math.max(o.stun, pulse.knockup); o.dashT = 0; }
  if (pulse.stunIfIgniteStacks && (o.igniteStacks || 0) >= pulse.stunIfIgniteStacks) o.stun = Math.max(o.stun, pulse.conditionalStunDuration || 0);
  if (pulse.cooldownRefundOnIgnite && o.igniteStacks) {
    if (s.skill1 === 'web') s.cd1 = Math.max(0, s.cd1 - pulse.cooldownRefundOnIgnite);
    if (s.skill2 === 'web') s.cd2 = Math.max(0, s.cd2 - pulse.cooldownRefundOnIgnite);
  }
  if (pulse.healSelf) s.grip = Math.min(MAX_GRIP, s.grip + pulse.healSelf * (s.toxin ? .7 : 1));
  if (pulse.guard || pulse.faultline) { o.guard -= (pulse.guard || 0) + (pulse.faultline ? s.guard * .35 : 0); if (o.guard <= 0) this.guardBreak(o); }
  if (pulse.snare) { o.snare = Math.max(o.snare, pulse.snare); o.atkT = 0; }
  if (pulse.harvest && o.venom > 0) { o.venom = 0; s.grip = Math.min(MAX_GRIP, s.grip + 20); }
  else if (pulse.venom) o.venom = Math.max(o.venom, pulse.venom);
  if (pulse.push && !(o.knockbackImmuneT && o.knockbackImmuneT > 0)) this.kb[o.id] = (o.x >= s.x ? 1 : -1) * pulse.push;
  if (pulse.undertow) {
    if (o.soak > 0) { o.soak = 0; o.snare = Math.max(o.snare, .7); o.atkT = 0; this.kb[o.id] = (s.x >= o.x ? 1 : -1) * 600; }
    else { o.soak = 1.5; o.burn = 0; }
  }
  if (pulse.soak) { o.soak = Math.max(o.soak, pulse.soak); o.burn = 0; o.igniteStacks = 0; }
  if (pulse.detonate && o.burn > 0 && o.soak <= 0) { o.burn = 0; o.grip -= 12; o.stun = Math.max(o.stun, .35); }
  else if (pulse.burn && o.soak <= 0) o.burn = Math.max(o.burn, pulse.burn);
  if (pulse.stun) { o.stun = Math.max(o.stun, pulse.stun); o.atkT = 0; }
  if (pulse.pull && !(o.knockbackImmuneT && o.knockbackImmuneT > 0)) this.kb[o.id] = (originX >= o.x ? 1 : -1) * pulse.pull;
  o.hitFlash = Math.max(o.hitFlash, .14);
  this.emitFx({ type: 'spark', x: o.x, y: BODY_Y, col: s.colorLight, count: 12, sp: 190 });
  if (o.grip <= 0) this.fall(o);
}

private useSkill(s: PlayerStateData, o: PlayerStateData, slotIndex: number, inp: PlayerInput): boolean {
  const id = slotIndex === 0 ? s.skill1 : s.skill2;
  if (!ABILITIES[id as AbilityId]) return false;
  const move = spiderMove(s.species, id as AbilityId);
  const effect = move.effect;
  if (effect.requiresAirborne && !(s.airT && s.airT > 0)) return false;
  if (((s.snare > 0 && !this.rootImmune(s)) || (s.tremorT || 0) > 0) && (effect.dash || effect.vault)) return false;
  if ((effect.dash || effect.vault) && this.battleState.webs.some(w => w.owner !== s.id && w.progressiveSlow && w.zoneRadius && w.life > 0 && Math.abs(s.x - w.x) <= w.zoneRadius)) return false;
  if (effect.expandZone && !this.battleState.webs.some(w => w.owner === s.id && w.zoneRadius && w.life > 0)) return false;
  const cd = move.cooldown ?? ABILITIES[id as AbilityId].cd;
  if (slotIndex === 0) { s.cd1 = cd; s.cd1max = cd; }
  else { s.cd2 = cd; s.cd2max = cd; }
  this.emitFx({ type: 'ability', x: s.x, y: BODY_Y + (s.hang ? s.drop : 0), species: s.species, id });

  if (effect.heal) s.grip = Math.min(MAX_GRIP, s.grip + (effect.heal + (Math.abs(o.x - s.x) <= 360 ? (o.igniteStacks || 0) * (effect.healPerIgnite || 0) : 0)) * (s.toxin ? .7 : 1));
  if (effect.consumeFire) for (let i = this.battleState.webs.length - 1; i >= 0; i--) if (this.battleState.webs[i].species === 'guardian' && Math.abs(this.battleState.webs[i].x - s.x) <= 360) this.battleState.webs.splice(i, 1);
  if (effect.airborne) s.airT = effect.airborne;
  if (effect.combo) { s.comboT = 0; s.comboNext = effect.combo.duration / effect.combo.hits; s.comboHits = effect.combo.hits; s.comboDamage = effect.combo.damage / effect.combo.hits; s.comboRange = effect.combo.range; s.comboRefund = effect.combo.cooldownRefundOnIgnite || 0; }
  if (effect.cleanseBurn) { s.burn = 0; s.igniteStacks = 0; }
  if (effect.cleanseSlow) { s.snare = 0; s.soak = 0; s.tremorT = 0; }
  if (effect.speed) { s.speedMultiplier = effect.speed.multiplier; s.speedT = effect.speed.duration; }
  if (effect.reduction) { s.reductionFraction = effect.reduction.fraction; s.reductionT = effect.reduction.duration; }
  if (effect.regen) {
    const sources = (Math.abs(o.x - s.x) <= 360 && o.soak > 0 ? 1 : 0) + this.battleState.webs.filter(w => w.owner === s.id && w.zoneRadius && Math.abs(w.x - s.x) <= 360).length;
    const inZone = this.battleState.webs.some(w => w.owner === s.id && w.zoneRadius && Math.abs(w.x - s.x) <= w.zoneRadius);
    s.regenPerSecond = effect.regen.perSecond * (effect.regen.perSource ? sources : 1) * (effect.regen.bonusInZone && (inZone || (s.stealthT || 0) > 0) ? 1 + effect.regen.bonusInZone : 1);
    s.regenT = effect.regen.duration;
  }
  if (effect.reflect) { s.reflectDamage = effect.reflect.damage; s.reflectFraction = effect.reflect.fraction; s.reflectRequiresBarrier = effect.reflect.requiresBarrier; s.reflectT = effect.reflect.duration; s.reflectSoak = effect.reflect.soak; s.reflectIgnite = effect.reflect.ignite; s.reflectToxin = effect.reflect.toxin; }
  if (effect.meleeDamage) { s.meleeDamageFraction = effect.meleeDamage.fraction; s.meleeDamageT = effect.meleeDamage.duration; s.meleeDamageRequiresBarrier = effect.meleeDamage.requiresBarrier; }
  if (effect.barrier) { s.barrierHp = Math.max(s.barrierHp || 0, effect.barrier.hp); s.barrierT = effect.barrier.duration; }
  if (effect.tailwindBarrier) { s.barrierHp = Math.max(s.barrierHp || 0, 40 * (s.tailwindStacks || 0)); s.barrierT = 4; s.tailwindStacks = 0; s.tailwindT = 0; }
  if (effect.stealth) s.stealthT = Math.max(s.stealthT || 0, effect.stealth);
  if (effect.cooldownRate) { s.cooldownFraction = effect.cooldownRate.fraction; s.cooldownT = effect.cooldownRate.duration; }
  if (effect.rootImmune) s.rootImmuneT = Math.max(s.rootImmuneT || 0, effect.rootImmune);
  if (effect.crit) { s.critChance = effect.crit.chance; s.critT = effect.crit.duration; }
  if (effect.reveal) { s.revealT = effect.reveal.duration; s.revealRange = effect.reveal.range; }
  if (effect.attackSpeed) { s.attackSpeedMultiplier = effect.attackSpeed.multiplier; s.attackSpeedT = effect.attackSpeed.duration; }
  if (effect.grantTailwind) { s.tailwindStacks = Math.min(4, (s.tailwindStacks || 0) + effect.grantTailwind); s.tailwindT = 4; }
  if (effect.reflectShots) s.reflectShotsT = Math.max(s.reflectShotsT || 0, effect.reflectShots);
  if (effect.knockbackImmune) s.knockbackImmuneT = Math.max(s.knockbackImmuneT || 0, effect.knockbackImmune);
  if (effect.nextAttackBonus) s.nextAttackBonus = effect.nextAttackBonus;
  if (effect.refreshToxinOnHit) s.refreshToxinOnHit = true;
  if (effect.aftershock) s.aftershockT = Math.max(s.aftershockT || 0, effect.aftershock);
  if (effect.resetSkill) { if (s.skill1 === effect.resetSkill) s.cd1 = 0; if (s.skill2 === effect.resetSkill) s.cd2 = 0; }
  if (effect.cleanse) { s.burn = 0; s.venom = 0; }
  if (effect.guard) { s.guard = Math.min(100, s.guard + effect.guard); if (s.guard >= 100) s.gLock = false; }
  if (effect.shield) s.shield = Math.max(s.shield, effect.shield);
  if (effect.power) s.power = Math.max(s.power, effect.power);
  if (effect.haste) s.hasteT = Math.max(s.hasteT, effect.haste);
  if (effect.counter) { s.riposte = Math.max(s.riposte, effect.counter); s.blocking = false; }
  if (effect.leech) s.leech = Math.max(s.leech, effect.leech);
  if (effect.inv) s.inv = Math.max(s.inv, effect.inv);
  if (effect.meleeInv) s.meleeInvT = Math.max(s.meleeInvT || 0, effect.meleeInv);
  if (effect.evasion) { s.evasionChance = effect.evasion.chance; s.evasionT = effect.evasion.duration; }
  if (effect.projectileInv) s.projectileInvT = Math.max(s.projectileInvT || 0, effect.projectileInv);
  if (effect.tether && !o.hang && !o.ko && Math.abs(o.x - s.x) <= effect.tether.range) {
    o.tetherT = effect.tether.duration;
    o.tetherAnchorX = o.x;
    o.tetherStun = effect.tether.stun;
    o.tetherMaxDistance = effect.tether.maxDistance;
  }
  if (effect.lift) s.drop = Math.max(0, s.drop - effect.lift);
  if (effect.anchor) s.anchorT = Math.max(s.anchorT, effect.anchor);
  const leapRange = (effect.vault || 0) * (s.species === 'hunter' ? 1 + .05 * Math.min(4, s.tailwindStacks || 0) : 1);
  if (effect.vault && !o.hang && !o.ko && Math.abs(o.x - s.x) <= leapRange) {
    s.x = cl(o.x + (s.x < o.x ? 1 : -1) * 60, STICK.l, STICK.r);
    s.face = o.x > s.x ? 1 : -1;
  }
  if (s.species === 'wolf' && effect.pulse?.tremor) s.quake = .5;
  s.dashPulse = effect.pulseOnDashEnd ? effect.pulse : undefined;
  s.dashStunOnWall = effect.dashStunOnWall;
  s.dashHitWall = false;
  if (effect.pulse && !effect.pulseOnDashEnd) this.applySpiderPulse(s, o, effect.dash === 'forward' ? { ...effect.pulse, range: effect.pulse.range + (effect.dashTime || .12) * 900 } : effect.pulse);
  if (effect.expandZone) for (const w of this.battleState.webs) if (w.owner === s.id && w.zoneRadius) { w.zoneRadius = effect.expandZone.radius; w.life = Math.max(w.life, effect.expandZone.life); w.oneShot = false; w.interval = .25; w.tickT = 0; if (w.zonePulse) { w.zonePulse.range = w.zoneRadius; w.zonePulse.pull = effect.expandZone.pull; } }
  if (effect.zone && (!effect.zone.onTarget || Math.abs(o.x - s.x) <= (effect.pulse?.range || 240))) this.battleState.webs.push({
    id: `zone_${Date.now()}_${Math.random()}`, x: cl(effect.zone.onTarget ? o.x : s.x + s.face * (effect.zone.offset || 0), STICK.l, STICK.r), y: BODY_Y,
    vx: 0, owner: s.id, life: effect.zone.life, k: 'web', species: s.species,
    zoneRadius: effect.zone.radius, zonePulse: { ...effect.zone.pulse }, oneShot: effect.zone.oneShot,
    interval: effect.zone.interval, tickT: effect.zone.oneShot ? effect.zone.interval || 0 : 0, followsOwner: effect.zone.followsOwner,
    blocksShots: effect.zone.blocksShots, blocksMovement: effect.zone.blocksMovement, slowMultiplier: effect.zone.slowMultiplier,
    damagePerMeter: effect.zone.damagePerMeter, healOwnerPerSecond: effect.zone.healOwnerPerSecond, healRequiresEnemy: effect.zone.healRequiresEnemy,
    progressiveSlow: effect.zone.progressiveSlow, cage: effect.zone.cage, outerOnly: effect.zone.outerOnly, grantStealthInterval: effect.zone.grantStealthInterval, mist: effect.zone.mist,
    cooldownRateFraction: effect.zone.cooldownRateFraction, rootImmune: effect.zone.rootImmune, dustCloud: effect.zone.dustCloud, shotSpeedMultiplier: effect.zone.shotSpeedMultiplier
  });
  if (effect.igniteZones) for (let i = this.battleState.webs.length - 1; i >= 0; i--) {
    const w = this.battleState.webs[i];
    if (!w.zoneRadius) continue;
    if (w.owner !== s.id && w.oneShot) { this.battleState.webs.splice(i, 1); continue; }
    w.owner = s.id; w.species = 'guardian'; w.oneShot = false; w.zonePulse = { range: w.zoneRadius, damage: 50, ignite: 1 }; w.interval = 1; w.tickT = 0; w.life = Math.max(w.life, 3);
  }
  if (effect.shot) {
    const volleyId = `${effect.shot}_${Date.now()}_${Math.random()}`;
    const count = effect.shotCount || 1;
    for (let i = 0; i < count; i++) this.battleState.webs.push({
      id: `${volleyId}_${i}`, volleyId,
      x: s.x + s.face * (30 + i * 9), y: BODY_Y - 4 + (i - (count - 1) / 2) * 7,
      vx: s.face * (effect.shotSpeed || 650) * Math.max(1, ...this.battleState.webs.filter(w => w.owner === s.id && w.zoneRadius && w.shotSpeedMultiplier && Math.abs(s.x - w.x) <= w.zoneRadius).map(w => w.shotSpeedMultiplier || 1)), owner: s.id,
      life: effect.shotLife || 1.2, k: effect.shot, species: s.species,
      damage: effect.shotDamage, toxin: effect.shotToxin, pushOnSoaked: effect.shotPushOnSoaked,
      cutsTraps: effect.shotCutsTraps,
      attackSlowMultiplier: effect.shotAttackSlow?.multiplier, attackSlowDuration: effect.shotAttackSlow?.duration,
      attackSlowHits: effect.shotAttackSlow?.hits, bloomDamage: effect.shotBloomDamage, hallucination: effect.shotHallucination
    });
  }
  if (effect.dash) {
    s.dashDir = effect.dash === 'back' ? -s.face : effect.dash === 'forward' ? s.face : inp.right ? 1 : inp.left ? -1 : -s.face;
    const extendsLeap = effect.dash === 'forward' || (effect.dash === 'input' && s.dashDir === s.face);
    s.dashT = (effect.dashTime || .12) * (s.species === 'hunter' && extendsLeap ? 1 + .05 * Math.min(4, s.tailwindStacks || 0) : 1);
    s.dashBounceBack = effect.bounceBack;
    s.dashSpeedOnHazard = effect.speedOnHazard;
    s.pounce = !!effect.pounce;
    s.blocking = false;
    s.atkT = 0;
  }
  this.emitSound(effect.shot || (effect.dash ? 'dash' : effect.pulse ? 'sweep' : effect.shield ? 'shield' : effect.heal ? 'mend' : 'power_up'));
  return true;
}

private stepWebs(dt: number) {
  const webs = this.battleState.webs;
  for (let i = webs.length - 1; i >= 0; i--) {
    const w = webs[i];
    const me = w.owner === 0 ? this.battleState.p1 : this.battleState.p2;
    const t = w.owner === 0 ? this.battleState.p2 : this.battleState.p1;
    const previousX = w.x;
    w.x += w.vx * dt;
    w.life -= dt;

    if (w.zoneRadius && w.zonePulse) {
      if (w.followsOwner) w.x = me.x;
      if (w.life <= 0) { webs.splice(i, 1); continue; }
      const enemyInside = !me.hang && !t.hang && !t.ko && Math.abs(t.x - w.x) <= w.zoneRadius;
      if (w.healOwnerPerSecond && Math.abs(me.x - w.x) <= w.zoneRadius && (!w.healRequiresEnemy || enemyInside)) me.grip = Math.min(MAX_GRIP, me.grip + w.healOwnerPerSecond * dt * (me.toxin ? .7 : 1));
      if (w.grantStealthInterval && Math.abs(me.x - w.x) <= w.zoneRadius && me.atkT <= 0) {
        w.stealthTick = (w.stealthTick || 0) + dt;
        if (w.stealthTick >= w.grantStealthInterval) { me.stealthT = Math.max(me.stealthT || 0, w.grantStealthInterval); w.stealthTick = 0; }
      }
      if (enemyInside && (!w.outerOnly || Math.abs(t.x - w.x) >= w.zoneRadius * .7)) {
        if (w.damagePerMeter) { if (w.targetX !== undefined) this.hurt(t, Math.abs(t.x - w.targetX) / 60 * w.damagePerMeter); w.targetX = t.x; }
        w.tickT = (w.tickT || 0) + dt;
        if (w.tickT >= (w.interval || 0)) {
          this.applySpiderPulse(me, t, w.zonePulse, w.x);
          w.tickT = 0;
          if (w.oneShot) { webs.splice(i, 1); continue; }
        }
        if (t.grip <= 0 && !t.hang) this.fall(t);
      } else w.targetX = undefined;
      continue;
    }
    if (webs.some(z => z !== w && z.owner !== w.owner && z.blocksShots && z.zoneRadius && Math.min(previousX, w.x) <= z.x + z.zoneRadius && Math.max(previousX, w.x) >= z.x - z.zoneRadius)) {
      webs.splice(i, 1);
      continue;
    }
    if (w.cutsTraps) for (let j = webs.length - 1; j >= 0; j--) {
      const trap = webs[j];
      if (trap === w || trap.owner === w.owner || !trap.oneShot || trap.blocksShots || !trap.zoneRadius || Math.min(previousX, w.x) > trap.x + trap.zoneRadius || Math.max(previousX, w.x) < trap.x - trap.zoneRadius) continue;
      webs.splice(j, 1);
      if (j < i) i--;
    }

    if (this.battleState.terrain === 'totem' && this.battleState.terrainClearT <= 0 && !w.zoneRadius && [380, 820].some(x => Math.min(previousX, w.x) <= x && Math.max(previousX, w.x) >= x)) {
      webs.splice(i, 1);
      continue;
    }
    let gone = w.life <= 0 || w.x < STICK.l - 20 || w.x > STICK.r + 20;
    if (!gone && !me.hang && !t.hang && !t.ko && !t.under && t.inv <= 0 && (t.projectileInvT || 0) <= 0 && Math.abs(w.x - t.x) < 24 && !this.evades(t)) {
      gone = true;
      if ((t.reflectShotsT || 0) > 0) {
        webs.push({ ...w, id: `refl_${Date.now()}_${Math.random()}`, x: t.x, vx: -w.vx, owner: t.id, life: 1.2 });
        this.emitFx({ type: 'txt', x: t.x, y: LBL_Y, text: 'REFLECT!', col: t.colorLight });
      } else if (t.blocking && t.blockT <= PARRY) {
        // Parry reflect projectile!
        webs.push({
          id: `refl_${Date.now()}`,
          x: t.x,
          y: w.y,
          vx: -w.vx,
          owner: t.id,
          life: 1.6,
          k: w.k,
          species: w.species
        });
        t.parryT = 0.25;
        this.emitFx({ type: 'txt', x: t.x, y: LBL_Y + 4, text: 'REFLECT!', col: '#ffffff' });
        this.emitSound('parry');
      } else if (t.blocking) {
        t.guard -= w.k === 'spit' ? 10 : 12;
        this.emitFx({ type: 'txt', x: t.x, y: LBL_Y, text: 'BLOCK', col: t.colorLight });
        this.emitSound('block');
        if (t.guard <= 0) this.guardBreak(t);
      } else if (t.shield > 0) {
        this.absorb(t);
      } else if (w.k === 'hook') {
        const pull = Math.max(0, Math.abs(me.x - t.x) - 50) * 7 * 0.9;
        this.kb[t.id] = (me.x > t.x ? 1 : -1) * Math.min(1000, pull);
        t.stun = Math.max(t.stun, 0.35);
        t.atkT = 0;
        t.grip = Math.max(1, t.grip - 4);
        t.hitFlash = 0.15;
        this.emitFx({ type: 'txt', x: t.x, y: LBL_Y, text: 'HOOKED!', col: me.colorLight });
        this.emitFx({ type: 'spark', x: t.x, y: BODY_Y, col: '#f3f7ee', count: 8, sp: 180 });
        this.emitSound('hook');
      } else if (w.k === 'spit') {
        if (w.damage) this.hurt(t, w.damage);
        if (w.pushOnSoaked && t.soak > 0 && !(t.knockbackImmuneT && t.knockbackImmuneT > 0)) this.kb[t.id] = (t.x >= me.x ? 1 : -1) * w.pushOnSoaked;
        if (w.toxin) { t.toxin = Math.max(t.toxin || 0, w.toxin); t.venom = Math.max(t.venom, w.toxin); }
        if (w.attackSlowHits) {
          t.volleyHits = t.lastVolleyId === w.volleyId ? (t.volleyHits || 0) + 1 : 1;
          t.lastVolleyId = w.volleyId;
          if (t.volleyHits >= w.attackSlowHits) { t.attackSpeedMultiplier = w.attackSlowMultiplier; t.attackSpeedT = w.attackSlowDuration; }
        }
        if (w.bloomDamage) { t.bloomT = 2; t.bloomDamage = w.bloomDamage; }
        if (w.hallucination) t.hallucinationT = Math.max(t.hallucinationT || 0, w.hallucination);
        t.hitFlash = 0.15;
        this.emitFx({ type: 'spark', x: t.x, y: BODY_Y, col: w.species === 'weaver' ? '#7bdcff' : w.species === 'hunter' ? '#b7e8ff' : '#9cf06a', count: 10, sp: 180 });
        this.emitSound('spit');
      } else {
        // Tangled: slowed and cannot attack (blocking still allowed)
        t.snare = WEB_SNARE;
        if (w.species === 'weaver') { t.soak = Math.max(t.soak, 1); t.burn = 0; }
        t.atkT = 0;
        t.isHeavy = false;
        t.grip = Math.max(1, t.grip - 4);
        t.hitFlash = 0.15;
        this.emitFx({ type: 'txt', x: t.x, y: LBL_Y, text: 'TANGLED!', col: me.colorLight });
        this.emitFx({ type: 'spark', x: t.x, y: BODY_Y, col: '#f3f7ee', count: 10, sp: 180 });
        this.emitSound('web');
      }
    }

    if (t.grip <= 0 && !t.hang) this.fall(t);
    if (gone) webs.splice(i, 1);
  }
}

private tryTerrainJump(s: PlayerStateData, reel: number) {
  if (reel <= 0 || s.hang || s.ko || s.stun > 0 || (s.airT || 0) > 0 || this.jumpCd[s.id] > 0) return;
  s.airT = .7;
  s.terrainJumpT = .7;
  this.jumpCd[s.id] = 1.3;
  this.emitFx({ type: 'dust', x: s.x, y: STICK.y, count: 5 });
}

private stepSpider(s: PlayerStateData, o: PlayerStateData, inp: PlayerInput, dt: number) {
  const id = s.id;
  this.jumpCd[id] = Math.max(0, this.jumpCd[id] - dt);
  this.thornCd[id] = Math.max(0, this.thornCd[id] - dt);
  this.tryTerrainJump(s, inp.reel);
  if (this.battleState.terrain === 'termite') {
    if (!s.under && inp.block && (Math.abs(s.x - 430) < 22 || Math.abs(s.x - 770) < 22)) s.under = true;
    if (s.under && (s.x < 410 || s.x > 790)) s.under = false;
  }
  s.hitFlash = Math.max(0, s.hitFlash - dt);
  s.inv = Math.max(0, s.inv - dt);
  s.airT = Math.max(0, (s.airT || 0) - dt);
  if ((s.terrainJumpT || 0) > 0 && (s.terrainJumpT || 0) <= dt && (this.battleState.terrain === 'dew' || this.battleState.terrain === 'frost') && s.species !== 'weaver') this.kb[id] = s.face * 130;
  s.terrainJumpT = Math.max(0, (s.terrainJumpT || 0) - dt);
  s.disorientT = Math.max(0, (s.disorientT || 0) - dt);
  s.meleeInvT = Math.max(0, (s.meleeInvT || 0) - dt);
  s.stun = Math.max(0, s.stun - dt);
  this.cool[id] = Math.max(0, this.cool[id] - dt);
  s.parryT = Math.max(0, s.parryT - dt);
  const zoneCooldownRate = Math.max(0, ...this.battleState.webs.filter(w => w.owner === s.id && w.zoneRadius && w.cooldownRateFraction && Math.abs(s.x - w.x) <= w.zoneRadius).map(w => w.cooldownRateFraction || 0));
  const cooldownRate = Math.max(zoneCooldownRate, (s.cooldownT || 0) > 0 ? s.cooldownFraction || 0 : 0);
  s.cd1 = Math.max(0, s.cd1 - dt / (1 - cooldownRate));
  s.cd2 = Math.max(0, s.cd2 - dt / (1 - cooldownRate));
  s.power = Math.max(0, s.power - dt);
  s.shield = Math.max(0, s.shield - dt);
  s.hasteT = Math.max(0, s.hasteT - dt);
  s.quake = Math.max(0, s.quake - dt);
  s.riposte = Math.max(0, s.riposte - dt);
  s.leech = Math.max(0, s.leech - dt);
  s.anchorT = Math.max(0, s.anchorT - dt);
  this.reelCd[id] = Math.max(0, this.reelCd[id] - dt);
  s.snare = Math.max(0, s.snare - dt);
  s.soak = Math.max(0, s.soak - dt);
  s.toxin = Math.max(0, (s.toxin || 0) - dt);
  s.shredT = Math.max(0, (s.shredT || 0) - dt);
  if (s.shredT === 0) s.shredStacks = 0;
  s.tailwindT = Math.max(0, (s.tailwindT || 0) - dt);
  if (s.tailwindT === 0) s.tailwindStacks = 0;
  s.tremorT = Math.max(0, (s.tremorT || 0) - dt);
  if ((s.bleedT || 0) > 0 && !s.hang) this.hurt(s, 15 * Math.min(dt, s.bleedT || 0));
  s.bleedT = Math.max(0, (s.bleedT || 0) - dt);
  s.silenceT = Math.max(0, (s.silenceT || 0) - dt);
  s.speedT = Math.max(0, (s.speedT || 0) - dt);
  s.reductionT = Math.max(0, (s.reductionT || 0) - dt);
  s.reflectT = Math.max(0, (s.reflectT || 0) - dt);
  s.meleeDamageT = Math.max(0, (s.meleeDamageT || 0) - dt);
  s.barrierT = Math.max(0, (s.barrierT || 0) - dt);
  if (s.barrierT === 0) s.barrierHp = 0;
  s.stealthT = Math.max(0, (s.stealthT || 0) - dt);
  s.cooldownT = Math.max(0, (s.cooldownT || 0) - dt);
  s.rootImmuneT = Math.max(0, (s.rootImmuneT || 0) - dt);
  s.critT = Math.max(0, (s.critT || 0) - dt);
  s.revealT = Math.max(0, (s.revealT || 0) - dt);
  s.attackSpeedT = Math.max(0, (s.attackSpeedT || 0) - dt);
  s.aftershockT = Math.max(0, (s.aftershockT || 0) - dt);
  const bloomBefore = s.bloomT || 0;
  s.bloomT = Math.max(0, bloomBefore - dt);
  if (bloomBefore > 0 && s.bloomT === 0 && !s.hang) this.hurt(s, s.bloomDamage || 0);
  s.hallucinationT = Math.max(0, (s.hallucinationT || 0) - dt);
  if ((s.comboHits || 0) > 0) {
    s.comboT = (s.comboT || 0) + dt;
    while ((s.comboHits || 0) > 0 && (s.comboT || 0) >= (s.comboNext || Infinity)) {
      this.applySpiderPulse(s, o, { range: s.comboRange || 140, front: true, damage: s.comboDamage || 0 });
      if ((o.igniteStacks || 0) > 0 && s.comboRefund) {
        if (s.skill1 === 'web') s.cd1 = Math.max(0, s.cd1 - s.comboRefund);
        if (s.skill2 === 'web') s.cd2 = Math.max(0, s.cd2 - s.comboRefund);
      }
      s.comboNext = (s.comboNext || 0) + .3;
      s.comboHits!--;
    }
  }
  s.reflectShotsT = Math.max(0, (s.reflectShotsT || 0) - dt);
  s.knockbackImmuneT = Math.max(0, (s.knockbackImmuneT || 0) - dt);
  s.projectileInvT = Math.max(0, (s.projectileInvT || 0) - dt);
  s.evasionT = Math.max(0, (s.evasionT || 0) - dt);
  if ((s.tetherT || 0) > 0) {
    s.tetherT = Math.max(0, (s.tetherT || 0) - dt);
    if (s.tetherT > 0 && !s.hang && !s.ko && Math.abs(s.x - (s.tetherAnchorX || 0)) > (s.tetherMaxDistance || 0)) {
      s.x = s.tetherAnchorX || 0;
      s.dashT = 0;
      s.pounce = false;
      s.stun = Math.max(s.stun, s.tetherStun || 1);
      s.atkT = 0;
      s.tetherT = 0;
    }
  }
  if ((s.regenT || 0) > 0) { s.grip = Math.min(MAX_GRIP, s.grip + (s.regenPerSecond || 0) * dt * (s.toxin ? .7 : 1)); s.regenT = Math.max(0, (s.regenT || 0) - dt); }
  if (s.burn > 0 && !s.hang && !s.ko) {
    s.burn = Math.max(0, s.burn - dt);
    this.hurt(s, (s.igniteStacks ? 6 * s.igniteStacks : 4) * dt);
    if (s.burn === 0) s.igniteStacks = 0;
  } else if (s.hang) { s.burn = 0; s.igniteStacks = 0; }
  s.pump = Math.max(0, (s.pump || 0) - dt * 6);
  if (s.venom > 0 && !s.hang && !s.ko) {
    s.venom = Math.max(0, s.venom - dt);
    this.hurt(s, VENOM_DPS * dt);
  } else if (s.hang) {
    s.venom = 0;
  }
  if (s.grip <= 0 && !s.hang) this.fall(s);

  s.hb += ((s.hang ? 1 : 0) - s.hb) * Math.min(1, dt * 9);
  if (s.ko) return;

  if (s.hang) {
    if (this.battleState.status !== 'fight') {
      if (this.battleState.status === 'roundEnd') {
        s.drop -= 140 * dt;
        if (s.drop <= 0) {
          s.hang = false;
          s.drop = 0;
        }
      }
      return;
    }

    if (s.falling) {
      s.drop += FALL_SPEED * dt;
      if (s.drop >= s.depth) {
        s.drop = s.depth;
        s.falling = false;
        s.hangT = 0;
        s.hold = Math.min(10, Math.max(1, s.falls));
      }
    } else {
      s.hangT += dt;
      s.hold = Math.min(10, Math.max(1, s.falls));

      const times = this.tapTimes[id];
      while (times.length && this.timeElapsed - times[0] > 1) times.shift();
      s.rate = times.length;

      const sinkV = s.hold * s.tapLift;
      s.drop += s.anchorT > 0 ? 0 : sinkV * dt;

      if (inp.reel > 0) this.tapBuf[id] = true;
      if (this.tapBuf[id] && this.reelCd[id] <= 0) {
        this.tapBuf[id] = false;
        s.drop -= s.tapLift;
        this.reelCd[id] = REEL_CD;

        const lr = this.lastReelTimes[id];
        lr.push(this.timeElapsed);
        if (lr.length > 4) lr.shift();
        if (lr.length === 4) {
          const d0 = lr[1] - lr[0];
          const d1 = lr[2] - lr[1];
          const d2 = lr[3] - lr[2];
          if (Math.max(Math.abs(d1 - d0), Math.abs(d2 - d1)) < 0.003) {
            this.reelCd[id] = REEL_CD * 1.75;
          }
        }

        s.pump = 1.0;
        times.push(this.timeElapsed);
        this.emitSound('reel');
      }

      // Hang abilities (surge, anchor)
      if (inp.ab1 > 0 && s.cd1 <= 0 && ABILITIES[s.skill1 as AbilityId]?.use === 'hang') {
        this.useSkill(s, o, 0, inp);
      } else if (inp.ab2 > 0 && s.cd2 <= 0 && ABILITIES[s.skill2 as AbilityId]?.use === 'hang') {
        this.useSkill(s, o, 1, inp);
      }
    }

    s.face = o.x >= s.x ? 1 : -1;
    if (s.drop <= 0) this.recover(s);
    else if (s.hangT >= 10.0 || s.drop >= MAXDROP) {
      s.drop = MAXDROP;
      if (s.hangT >= 10.0) {
        this.emitFx({ type: 'txt', x: s.x, y: LBL_Y, text: 'TIME UP!', col: '#e8593f' });
      }
      this.knockOut(s);
    }
    return;
  }

  // Knockback
  if (Math.abs(this.kb[id]) > 2) {
    s.x += this.kb[id] * dt;
    this.kb[id] *= Math.exp(-(this.battleState.terrain === 'dew' && s.species !== 'weaver' ? 5 : this.battleState.terrain === 'frost' ? 4 : 7) * dt);
    if (s.x < STICK.l || s.x > STICK.r) {
      this.fall(s);
      return;
    }
  } else {
    this.kb[id] = 0;
  }

  // Dash / Pounce movement
  if (s.dashT > 0) {
    s.dashT -= dt;
    const desiredX = s.x + s.dashDir * 900 * dt;
    const tunnel = this.battleState.terrain === 'termite' && s.under;
    const boundedX = cl(desiredX, tunnel ? 420 : STICK.l + 6, tunnel ? 780 : STICK.r - 6);
    let dxn = this.wallX(s, boundedX, true);
    if (dxn !== boundedX || boundedX !== desiredX) s.dashHitWall = true;
    // Dash phases through opponents; only pounce is body-blocked
    if (s.pounce && !o.hang && !o.ko && Math.abs(dxn - o.x) < MINDIST && Math.abs(dxn - o.x) < Math.abs(s.x - o.x)) {
      dxn = s.x;
    }
    s.x = dxn;
    s.move = 1;
    s.walkPhase += dt * 6;
    if (s.dashT <= 0 && (this.battleState.terrain === 'dew' || this.battleState.terrain === 'frost') && s.species !== 'weaver') this.kb[id] = s.dashDir * 130;

    if (s.dashT <= 0 && s.dashPulse) {
      this.applySpiderPulse(s, o, s.dashHitWall && s.dashStunOnWall ? { ...s.dashPulse, stun: s.dashStunOnWall * (tunnel && s.species === 'wolf' ? 1.3 : 1) } : s.dashPulse);
      s.dashPulse = undefined;
      s.dashStunOnWall = undefined;
      s.dashHitWall = false;
    }

    if (s.dashT <= 0 && s.dashBounceBack) {
      s.dashDir = -s.dashDir;
      s.dashT = s.dashBounceBack / 900;
      s.dashBounceBack = undefined;
      return;
    }

    if (s.dashT <= 0 && s.dashSpeedOnHazard) {
      if (this.battleState.webs.some(w => w.species === 'lynx' && w.zoneRadius && Math.abs(s.x - w.x) <= w.zoneRadius + s.dashSpeedOnHazard!.range)) {
        s.speedMultiplier = s.dashSpeedOnHazard.multiplier;
        s.speedT = s.dashSpeedOnHazard.duration;
      }
      s.dashSpeedOnHazard = undefined;
    }

    if (s.dashT <= 0 && s.pounce) {
      s.pounce = false;
      s.atkT = ATK.wind * 0.55;
      s.atkId++;
      const prev = s.atkType ?? 0;
      let next = Math.floor(Math.random() * 3);
      if (next === prev) {
        next = (prev + 1 + Math.floor(Math.random() * 2)) % 3;
      }
      s.atkType = next;
      this.emitSound('swing');
    }
    return;
  }

  const wait = this.battleState.status === 'fight' && o.hang && !o.ko;
  if (wait) {
    inp = { left: false, right: false, strike: false, heavy: false, block: false, reel: 0, ab1: 0, ab2: 0 };
    s.blocking = false;
  }

  if (s.stun <= 0 && s.venom <= 0) s.grip = Math.min(MAX_GRIP, s.grip + 2 * dt);
  if (s.atkT <= 0 && s.stun <= 0) s.face = o.x >= s.x ? 1 : -1;

  const free = s.stun <= 0 && s.atkT <= 0;

  // Stand abilities
  if (free && !(s.silenceT && s.silenceT > 0)) {
    if (inp.ab1 > 0 && s.cd1 <= 0 && ABILITIES[s.skill1 as AbilityId]?.use === 'stand') {
      if (this.useSkill(s, o, 0, inp)) return;
    }
    if (inp.ab2 > 0 && s.cd2 <= 0 && ABILITIES[s.skill2 as AbilityId]?.use === 'stand') {
      if (this.useSkill(s, o, 1, inp)) return;
    }
  }

  // Block
  if (free && inp.block && !s.gLock) {
    if (!s.blocking) {
      s.blocking = true;
      s.blockT = 0;
    }
    s.blockT += dt;
    s.guard -= 9 * dt;
    if (s.guard <= 0) this.guardBreak(s);
  } else {
    s.blocking = false;
    s.guard = Math.min(100, s.guard + (s.stun > 0 ? 5 : 22) * dt);
    if (s.gLock && s.guard >= 35) s.gLock = false;
  }

  // Movement
  let v = 0;
  if (free && s.stun <= 0) {
    v = ((inp.right ? 1 : 0) - (inp.left ? 1 : 0)) * (s.disorientT > 0 ? -1 : 1) * SPEED * (s.blocking ? 0.35 : 1) * (s.snare > 0 && !this.rootImmune(s) ? 0.4 : 1) * (s.soak > 0 ? 0.85 : 1) * (s.hasteT > 0 ? 1.5 : 1) * (1 + .05 * (s.tailwindStacks || 0)) * (s.speedT ? s.speedMultiplier || 1 : 1);
    for (const w of this.battleState.webs) if (w.owner !== s.id && w.zoneRadius && Math.abs(s.x - w.x) <= w.zoneRadius) {
      if (w.slowMultiplier) v *= w.slowMultiplier;
      if (w.progressiveSlow) v *= .3 + .4 * (w.life / 4);
    }
  }
  if (wait && free && s.stun <= 0) {
    let wtx = s.id === 0 ? 440 : 760;
    if (Math.abs(wtx - o.x) < 300) wtx = o.x < 600 ? 950 : 250;
    const wdx = wtx - s.x;
    v = Math.abs(wdx) > 3 ? Math.sign(wdx) * SPEED * 1.3 : 0;
  }

  if (v) {
    if (!wait && this.battleState.terrain === 'bamboo' && !(s.species === 'wolf' && [235, 415, 595, 775, 955].some(x => Math.abs(s.x - x) < 22))) v *= Math.sign(v) === (Math.floor(this.battleState.terrainTime / 8) % 2 ? 1 : -1) ? 1.25 : .75;
    if (this.battleState.terrain === 'lilypad' && Math.abs(s.x - 600) < 95) v *= 1 - this.battleState.terrainSink * .55;
    const desiredX = cl(s.x + v * dt, STICK.l + 6, STICK.r - 6);
    let nx = wait ? desiredX : this.wallX(s, desiredX);
    if (!o.hang && !o.ko && Math.abs(nx - o.x) < MINDIST && Math.abs(nx - o.x) < Math.abs(s.x - o.x)) {
      nx = s.x;
    }
    s.x = nx;
  }
  s.move += ((v ? 1 : 0) - s.move) * Math.min(1, dt * 10);
  s.walkPhase += Math.abs(v) * dt * 0.055;

  // Strike attack
  if (s.atkT > 0) {
    const atkConfig = s.isHeavy ? ATK_HEAVY : ATK_LIGHT;
    const prevAtk = s.atkT;
    s.atkT += dt * (s.attackSpeedT ? s.attackSpeedMultiplier || 1 : 1);
    const windup = this.windJitter[id];
    if (prevAtk < windup && s.atkT >= windup) {
      this.doStrike(s, o);
    }
    if (s.atkT > 0.1 && s.atkT < atkConfig.act) {
      const stepSpeed = s.isHeavy ? 140 : 110;
      const lx = s.x + s.face * stepSpeed * dt;
      if (o.hang || o.ko || Math.abs(lx - o.x) >= MINDIST - 8) {
        s.x = cl(lx, STICK.l + 6, STICK.r - 6);
      }
    }
    if (s.atkT >= atkConfig.end) {
      s.atkT = 0;
      this.cool[id] = s.isHeavy ? 0.08 : 0.04;
      s.isHeavy = false;
    }
  } else if (free && (inp.heavy || inp.strike) && this.cool[id] <= 0 && !s.blocking && s.snare <= 0) {
    if (this.battleState.terrain === 'briar') for (const [index, x] of [530, 670].entries()) if (Math.abs(s.x - x) < 35 && !(this.battleState.terrainBuds & (1 << index))) {
      this.battleState.terrainBuds |= 1 << index;
      for (const nearby of [this.battleState.p1, this.battleState.p2]) if (!nearby.hang && Math.abs(nearby.x - x) < 75) nearby.grip = Math.min(MAX_GRIP, nearby.grip + 10);
      this.emitFx({ type: 'spark', x, y: STICK.y - 15, col: '#d5f5a0', count: 9, sp: 90 });
    }
    if (inp.heavy) {
      inp.heavy = false;
      inp.strike = false;
      s.atkT = 0.0001;
      s.isHeavy = true;
      this.windJitter[id] = 0.20 + Math.random() * 0.04;
      s.atkId++;
      if (Math.abs(s.x - 600) < 140 && (this.battleState.terrain === 'ember' || this.battleState.terrain === 'termite')) {
        this.terrainHits++;
        if (this.terrainHits >= (this.battleState.terrain === 'termite' ? 1 : 2)) {
          this.battleState.terrainBroken = true;
          if (this.battleState.terrain === 'termite' && o.under && Math.abs(o.x - 600) < 170) { this.hurt(o, 12); o.stun = Math.max(o.stun, .5); }
        }
      }
      if (s.species === 'guardian' && this.battleState.terrain === 'briar') this.battleState.terrainClearT = 4;
      if (this.battleState.terrain === 'totem' && [380, 820].some(x => Math.abs(s.x - x) < 90)) this.battleState.terrainClearT = 4;
      if (s.species === 'guardian' && this.battleState.terrain === 'totem' && [380, 820].some(x => Math.abs(s.x - x) < 90)) this.battleState.terrainFireT = 4;
      s.atkType = 0;
      this.emitSound('power_strike');
    } else {
      inp.strike = false;
      s.atkT = 0.0001;
      s.isHeavy = false;
      this.windJitter[id] = 0.09 + Math.random() * 0.02;
      s.atkId++;
      const prev = s.atkType ?? 0;
      let next = Math.floor(Math.random() * 3);
      if (next === prev) {
        next = (prev + 1 + Math.floor(Math.random() * 2)) % 3;
      }
      s.atkType = next;
      this.emitSound('swing');
    }
  }
}

private separate(dt: number) {
  const a = this.battleState.p1;
  const b = this.battleState.p2;
  if (a.hang || b.hang || a.ko || b.ko || a.under !== b.under) return;
  // Let a dashing spider phase through without pushback
  if ((a.dashT > 0 && !a.pounce) || (b.dashT > 0 && !b.pounce)) return;
  const dx = b.x - a.x;
  const ad = Math.abs(dx);
  if (ad < MINDIST - 4) {
    const push = (MINDIST - ad) * Math.min(1, dt * 10);
    const sg = dx >= 0 ? 1 : -1;
    a.x = cl(a.x - sg * push / 2, STICK.l + 6, STICK.r - 6);
    b.x = cl(b.x + sg * push / 2, STICK.l + 6, STICK.r - 6);
  }
}
}

