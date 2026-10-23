import { ABILITIES, type AbilityId } from '../abilities';
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
const MAX_GRIP = 120, RECOVER_GRIP = 65, VENOM_DUR = 3, VENOM_DPS = 5, WEB_SNARE = 1.6;
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

  constructor(battleState: BattleStateData, send: (type: string, data: any) => void) {
    this.battleState = battleState;
    this.send = send;
  }

  private broadcast(type: string, data: any) {
    this.send(type, data);
  }

  public resetRound() {
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
  s.hang = true;
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
  s.snare = 0;
  s.venom = 0;
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
  s.grip = RECOVER_GRIP;
  s.guard = 100;
  s.gLock = false;
  s.inv = 1.1;
  s.stun = 0.25;
  this.kb[s.id] = 0;
  s.x = cl(s.x, STICK.l + 10, STICK.r - 10);

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

  if (d < -15 || d > maxHitDistance || b.inv > 0) return;

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
      b.guard -= guardDmg;
      b.grip = Math.max(1, b.grip - gripDmg);
      this.kb[b.id] = a.face * kbForce;
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
    const gripDmg = isHeavy ? (pw ? 48 : 32) : (pw ? 26 : 14);
    const kbForce = isHeavy ? (pw ? 760 : 580) : (pw ? 480 : 300);
    const stunDur = isHeavy ? (pw ? 0.55 : 0.42) : (pw ? 0.32 : 0.20);
    const flash = isHeavy ? 0.24 : 0.16;
    b.grip -= gripDmg;
    this.kb[b.id] = a.face * kbForce;
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
  }
}

private useSkill(s: PlayerStateData, o: PlayerStateData, slotIndex: number, inp: PlayerInput): boolean {
  const id = slotIndex === 0 ? s.skill1 : s.skill2;
  const def = ABILITIES[id as AbilityId];
  if (!def) return false;

  if (slotIndex === 0) {
    s.cd1 = def.cd;
    s.cd1max = def.cd;
  } else {
    s.cd2 = def.cd;
    s.cd2max = def.cd;
  }

  switch (id) {
    case 'dash':
      s.dashT = 0.16;
      s.dashDir = inp.right ? 1 : (inp.left ? -1 : -s.face);
      s.pounce = false;
      s.inv = Math.max(s.inv, 0.2);
      s.blocking = false;
      s.atkT = 0;
      this.emitSound('dash');
      return true;

    case 'pounce':
      s.dashT = 0.14;
      s.dashDir = s.face;
      s.pounce = true;
      s.inv = Math.max(s.inv, 0.14);
      s.blocking = false;
      s.atkT = 0;
      this.emitSound('pounce');
      return true;

    case 'web':
      this.battleState.webs.push({
        id: `web_${Date.now()}_${Math.random()}`,
        x: s.x + s.face * 30,
        y: BODY_Y - 4,
        vx: s.face * 560,
        owner: s.id,
        life: 1.6,
        k: 'web'
      });
      this.emitSound('web');
      return false;

    case 'spit':
      this.battleState.webs.push({
        id: `spit_${Date.now()}_${Math.random()}`,
        x: s.x + s.face * 30,
        y: BODY_Y - 4,
        vx: s.face * 780,
        owner: s.id,
        life: 1.2,
        k: 'spit'
      });
      this.emitSound('spit');
      return false;

    case 'power':
      s.power = 5;
      this.emitFx({ type: 'txt', x: s.x, y: LBL_Y, text: 'POWER UP', col: '#ffb347' });
      this.emitFx({ type: 'spark', x: s.x, y: BODY_Y, col: '#ffb347', count: 10, sp: 180 });
      this.emitSound('power_up');
      return false;

    case 'shield':
      s.shield = 4;
      this.emitFx({ type: 'txt', x: s.x, y: LBL_Y, text: 'IRON SILK', col: '#cfe9ff' });
      this.emitFx({ type: 'spark', x: s.x, y: BODY_Y, col: '#cfe9ff', count: 10, sp: 160 });
      this.emitSound('shield');
      return false;

    case 'mend':
      s.grip = Math.min(MAX_GRIP, s.grip + 35);
      this.emitFx({ type: 'txt', x: s.x, y: LBL_Y, text: '+35 GRIP', col: '#9cf0a8' });
      this.emitFx({ type: 'spark', x: s.x, y: BODY_Y, col: '#9cf0a8', count: 12, sp: 150 });
      this.emitSound('mend');
      return false;

    case 'riposte':
      s.riposte = 1;
      s.blocking = false;
      this.emitFx({ type: 'txt', x: s.x, y: LBL_Y, text: 'RIPOSTE', col: '#ffffff' });
      this.emitSound('riposte');
      return false;

    case 'leech':
      s.leech = 5;
      this.emitFx({ type: 'txt', x: s.x, y: LBL_Y, text: 'LEECH FANG', col: '#d24a5a' });
      this.emitSound('leech');
      return false;

    case 'carapace':
      s.guard = 100;
      s.gLock = false;
      this.emitFx({ type: 'txt', x: s.x, y: LBL_Y, text: 'CARAPACE', col: '#8fb7d6' });
      this.emitFx({ type: 'spark', x: s.x, y: BODY_Y, col: '#8fb7d6', count: 12, sp: 170 });
      this.emitSound('carapace');
      return false;

    case 'hook':
      this.battleState.webs.push({
        id: `hook_${Date.now()}_${Math.random()}`,
        x: s.x + s.face * 30,
        y: BODY_Y - 4,
        vx: s.face * 700,
        owner: s.id,
        life: 1.0,
        k: 'hook'
      });
      this.emitSound('hook');
      return false;

    case 'sweep': {
      const dd = (o.x - s.x) * s.face;
      s.stun = 0.25;
      s.atkT = 0;
      s.blocking = false;
      this.emitSound('sweep');
      if (!o.hang && !o.ko && dd >= 0 && dd < REACH + 20 && o.inv <= 0) {
        if (o.riposte > 0) {
          this.counter(o, s);
        } else if (o.shield > 0) {
          this.absorb(o);
        } else if (o.blocking) {
          o.guard -= 15;
          this.kb[o.id] = s.face * 300;
          this.emitFx({ type: 'txt', x: o.x, y: LBL_Y, text: 'BLOCK', col: o.colorLight });
          if (o.guard <= 0) this.guardBreak(o);
        } else {
          o.grip -= 10;
          this.kb[o.id] = s.face * 650;
          o.stun = 0.3;
          o.atkT = 0;
          o.hitFlash = 0.2;
          this.emitFx({ type: 'txt', x: o.x, y: LBL_Y, text: 'SWEPT!', col: s.colorLight });
          this.emitFx({ type: 'spark', x: o.x, y: BODY_Y, col: '#ffffff', count: 10, sp: 240 });
          this.emitShake(8);
          if (o.grip <= 0) this.fall(o);
        }
      }
      return false;
    }

    case 'haste':
      s.hasteT = 3.5;
      this.emitFx({ type: 'txt', x: s.x, y: LBL_Y, text: 'HASTE', col: s.colorLight });
      this.emitSound('haste');
      return false;

    case 'tremor':
      s.quake = 0.5;
      this.emitShake(9);
      this.emitSound('tremor');
      if (!o.hang && !o.ko && Math.abs(o.x - s.x) < 260 && o.inv <= 0) {
        if (o.shield > 0) {
          this.absorb(o);
        } else if (o.blocking) {
          this.emitFx({ type: 'txt', x: o.x, y: LBL_Y, text: 'HELD', col: o.colorLight });
        } else {
          o.stun = Math.max(o.stun, 0.9);
          o.atkT = 0;
          o.hitFlash = 0.15;
          this.emitFx({ type: 'txt', x: o.x, y: LBL_Y, text: 'SHAKEN!', col: s.colorLight });
        }
      }
      return false;

    case 'surge':
      s.drop = Math.max(0, s.drop - SURGE_LIFT);
      this.emitFx({ type: 'txt', x: s.x, y: BODY_Y + s.drop + 20, text: 'SURGE!', col: s.colorLight });
      this.emitFx({ type: 'spark', x: s.x, y: BODY_Y + s.drop + 20, col: s.colorLight, count: 8, sp: 180 });
      this.emitSound('surge');
      return false;

    case 'anchor':
      s.anchorT = 2.5;
      this.emitFx({ type: 'txt', x: s.x, y: BODY_Y + s.drop + 20, text: 'ANCHORED', col: s.colorLight });
      this.emitFx({ type: 'spark', x: s.x, y: BODY_Y + s.drop + 14, col: s.colorLight, count: 8, sp: 140 });
      this.emitSound('anchor');
      return false;
  }
  return false;
}

private stepWebs(dt: number) {
  const webs = this.battleState.webs;
  for (let i = webs.length - 1; i >= 0; i--) {
    const w = webs[i];
    const me = w.owner === 0 ? this.battleState.p1 : this.battleState.p2;
    const t = w.owner === 0 ? this.battleState.p2 : this.battleState.p1;
    w.x += w.vx * dt;
    w.life -= dt;

    let gone = w.life <= 0 || w.x < STICK.l - 20 || w.x > STICK.r + 20;
    if (!gone && !t.hang && !t.ko && t.inv <= 0 && Math.abs(w.x - t.x) < 24) {
      gone = true;
      if (t.blocking && t.blockT <= PARRY) {
        // Parry reflect projectile!
        webs.push({
          id: `refl_${Date.now()}`,
          x: t.x,
          y: w.y,
          vx: -w.vx,
          owner: t.id,
          life: 1.6,
          k: w.k
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
        // Venom: no stun, poisons grip over time instead
        t.venom = VENOM_DUR;
        t.hitFlash = 0.15;
        this.emitFx({ type: 'txt', x: t.x, y: LBL_Y, text: 'VENOM!', col: '#9cf06a' });
        this.emitFx({ type: 'spark', x: t.x, y: BODY_Y, col: '#9cf06a', count: 10, sp: 180 });
        this.emitSound('spit');
      } else {
        // Tangled: slowed and cannot attack (blocking still allowed)
        t.snare = WEB_SNARE;
        t.atkT = 0;
        t.isHeavy = false;
        t.grip = Math.max(1, t.grip - 4);
        t.hitFlash = 0.15;
        this.emitFx({ type: 'txt', x: t.x, y: LBL_Y, text: 'TANGLED!', col: me.colorLight });
        this.emitFx({ type: 'spark', x: t.x, y: BODY_Y, col: '#f3f7ee', count: 10, sp: 180 });
        this.emitSound('web');
      }
    }

    if (gone) webs.splice(i, 1);
  }
}

private stepSpider(s: PlayerStateData, o: PlayerStateData, inp: PlayerInput, dt: number) {
  const id = s.id;
  s.hitFlash = Math.max(0, s.hitFlash - dt);
  s.inv = Math.max(0, s.inv - dt);
  s.stun = Math.max(0, s.stun - dt);
  this.cool[id] = Math.max(0, this.cool[id] - dt);
  s.parryT = Math.max(0, s.parryT - dt);
  s.cd1 = Math.max(0, s.cd1 - dt);
  s.cd2 = Math.max(0, s.cd2 - dt);
  s.power = Math.max(0, s.power - dt);
  s.shield = Math.max(0, s.shield - dt);
  s.hasteT = Math.max(0, s.hasteT - dt);
  s.quake = Math.max(0, s.quake - dt);
  s.riposte = Math.max(0, s.riposte - dt);
  s.leech = Math.max(0, s.leech - dt);
  s.anchorT = Math.max(0, s.anchorT - dt);
  this.reelCd[id] = Math.max(0, this.reelCd[id] - dt);
  s.snare = Math.max(0, s.snare - dt);
  s.pump = Math.max(0, (s.pump || 0) - dt * 6);
  if (s.venom > 0 && !s.hang && !s.ko) {
    s.venom = Math.max(0, s.venom - dt);
    s.grip = Math.max(1, s.grip - VENOM_DPS * dt);
  } else if (s.hang) {
    s.venom = 0;
  }

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
    this.kb[id] *= Math.exp(-7 * dt);
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
    let dxn = cl(s.x + s.dashDir * 900 * dt, STICK.l + 6, STICK.r - 6);
    // Dash phases through opponents; only pounce is body-blocked
    if (s.pounce && !o.hang && !o.ko && Math.abs(dxn - o.x) < MINDIST && Math.abs(dxn - o.x) < Math.abs(s.x - o.x)) {
      dxn = s.x;
    }
    s.x = dxn;
    s.move = 1;
    s.walkPhase += dt * 6;

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
  if (free) {
    if (inp.ab1 > 0 && s.cd1 <= 0 && ABILITIES[s.skill1 as AbilityId]?.use === 'stand') {
      if (!(s.snare > 0 && (s.skill1 === 'dash' || s.skill1 === 'pounce'))) {
        if (this.useSkill(s, o, 0, inp)) return;
      }
    }
    if (inp.ab2 > 0 && s.cd2 <= 0 && ABILITIES[s.skill2 as AbilityId]?.use === 'stand') {
      if (!(s.snare > 0 && (s.skill2 === 'dash' || s.skill2 === 'pounce'))) {
        if (this.useSkill(s, o, 1, inp)) return;
      }
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
    v = ((inp.right ? 1 : 0) - (inp.left ? 1 : 0)) * SPEED * (s.blocking ? 0.35 : 1) * (s.snare > 0 ? 0.4 : 1) * (s.hasteT > 0 ? 1.5 : 1);
  }
  if (wait && free && s.stun <= 0) {
    let wtx = s.id === 0 ? 440 : 760;
    if (Math.abs(wtx - o.x) < 300) wtx = o.x < 600 ? 950 : 250;
    const wdx = wtx - s.x;
    v = Math.abs(wdx) > 3 ? Math.sign(wdx) * SPEED * 1.3 : 0;
  }

  if (v) {
    let nx = cl(s.x + v * dt, STICK.l + 6, STICK.r - 6);
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
    s.atkT += dt;
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
    if (inp.heavy) {
      inp.heavy = false;
      inp.strike = false;
      s.atkT = 0.0001;
      s.isHeavy = true;
      this.windJitter[id] = 0.20 + Math.random() * 0.04;
      s.atkId++;
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
  if (a.hang || b.hang || a.ko || b.ko) return;
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

