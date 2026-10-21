import { sound } from '../audio';
import { ABILITIES, type AbilityId } from './abilities';
import {
  STICK, POND_Y, BODY_Y, LBL_Y, MAXDROP, REACH, MINDIST, SPEED, PARRY,
  ATK, REEL_CD, TAP, FALL_DEPTH, SINK, FALL_SPEED, SURGE_LIFT, FATIGUE_MAX,
  DIFF_SETTINGS, clamp, rand
} from './constants';
import type { InputState, LocalBattleState, LocalPlayerState } from './localGameTypes';

export class LocalCombat {
  public onFx?: (fx: any) => void;
  public onShake?: (shake: { amount: number }) => void;
  public onRoundWon?: (data: { winner: number; round: number; p1Wins: number; p2Wins: number }) => void;

  private tapTimes: [number[], number[]] = [[], []];
  private tapBuf: [boolean, boolean] = [false, false];
  private reelCd: [number, number] = [0, 0];
  private kb: [number, number] = [0, 0];
  private cool: [number, number] = [0, 0];
  private timeElapsed = 0;
  private diff: 'easy' | 'normal' | 'hard' = 'normal';
  private ai = {
    reelT: 0,
    clock: 0,
    blockAt: 1e9,
    blockUntil: 0,
    seen: -1,
    nextAtk: 0.8,
    retreatT: 0
  };

  public state: LocalBattleState;

  constructor(state: LocalBattleState) {
    this.state = state;
  }

  public resetRound() {
    this.tapTimes = [[], []];
    this.tapBuf = [false, false];
    this.reelCd = [0, 0];
    this.kb = [0, 0];
    this.cool = [0, 0];
    this.ai.nextAtk = 0.8;
    this.ai.clock = 0;
    this.ai.seen = -1;
  }

  public update(
    dt: number,
    humanInpP1: InputState,
    humanInpP2: InputState | undefined,
    mode: 'cpu' | '2p',
    diff: 'easy' | 'normal' | 'hard'
  ) {
    this.timeElapsed += dt;
    this.diff = diff;
    if (this.state.status !== 'fight') return;

    const p2Input = mode === 'cpu'
      ? this.getAiInput(this.state.p2, this.state.p1, dt)
      : (humanInpP2 || { left: false, right: false, strike: false, block: false, reel: 0, ab1: 0, ab2: 0 });

    this.stepSpider(this.state.p1, this.state.p2, humanInpP1, dt);
    this.stepSpider(this.state.p2, this.state.p1, p2Input, dt);
    this.separate(dt);
    this.stepWebs(dt);
  }

private emitFx(fx: any) {
  if (this.onFx) this.onFx(fx);
}

private emitShake(amount: number) {
  if (this.onShake) this.onShake({ amount });
}

private fall(s: LocalPlayerState) {
  s.hang = true;
  s.falling = true;
  s.drop = 12;
  s.dropV = 0;
  s.atkT = 0;
  s.blocking = false;
  s.stun = 0;
  this.kb[s.id] = 0;
  s.grip = 0;
  this.reelCd[s.id] = 0;
  this.tapBuf[s.id] = false;
  s.dashT = 0;
  s.snare = 0;
  s.pounce = false;
  s.power = 0;
  s.shield = 0;
  s.hasteT = 0;
  s.riposte = 0;
  s.leech = 0;
  s.anchorT = 0;

  s.x = clamp(s.x, STICK.l, STICK.r);
  s.falls++;

  const f = Math.min(s.falls - 1, FATIGUE_MAX);
  s.tapLift = TAP;
  const sinkV = SINK * (1 + 0.5 * f);
  s.depth = Math.min(FALL_DEPTH + 12 * f, MAXDROP - 30);
  s.hold = sinkV / s.tapLift;
  this.tapTimes[s.id] = [];
  s.rate = 0;

  this.emitFx({ type: 'txt', x: s.x, y: LBL_Y, text: s.falls > 1 ? `FALL Ã—${s.falls}` : 'FALL!', col: '#e8593f' });
  this.emitFx({ type: 'dust', x: s.x, y: STICK.y + STICK.th, count: 6 });
  this.emitShake(6);
  sound.play('fall');
}

private recover(s: LocalPlayerState) {
  s.hang = false;
  s.falling = false;
  s.drop = 0;
  s.dropV = 0;
  s.grip = 55;
  s.guard = 100;
  s.gLock = false;
  s.inv = 1.1;
  s.stun = 0.25;
  this.kb[s.id] = 0;
  s.x = clamp(s.x, STICK.l + 10, STICK.r - 10);

  this.emitFx({ type: 'txt', x: s.x, y: LBL_Y, text: 'BACK UP!', col: s.colorLight });
  this.emitFx({ type: 'dust', x: s.x, y: STICK.y + STICK.th, count: 8 });
  sound.play('recover');
}

private guardBreak(s: LocalPlayerState) {
  s.guard = 0;
  s.gLock = true;
  s.stun = 0.9;
  s.blocking = false;
  s.atkT = 0;

  this.emitFx({ type: 'txt', x: s.x, y: LBL_Y, text: 'GUARD BREAK', col: '#e8593f' });
  this.emitFx({ type: 'spark', x: s.x, y: BODY_Y, col: '#bfe0f4', count: 12, sp: 200 });
  this.emitShake(6);
  sound.play('guardbreak');
}

private knockOut(s: LocalPlayerState) {
  if (this.state.status !== 'fight') return;
  s.ko = true;
  s.hang = true;
  this.state.status = 'roundEnd';
  this.state.stateT = 0;

  const winner = s.id === 0 ? this.state.p2 : this.state.p1;
  winner.wins++;
  winner.cheer = true;
  winner.blocking = false;

  this.emitFx({ type: 'splash', x: s.x, y: POND_Y });
  this.emitShake(14);
  sound.play('ko');

  if (this.onRoundWon) {
    this.onRoundWon({ winner: winner.id, round: this.state.round, p1Wins: this.state.p1.wins, p2Wins: this.state.p2.wins });
  }
}

private absorb(b: LocalPlayerState) {
  b.shield = 0;
  this.emitFx({ type: 'txt', x: b.x, y: LBL_Y, text: 'ABSORBED', col: '#cfe9ff' });
  this.emitFx({ type: 'spark', x: b.x, y: BODY_Y, col: '#cfe9ff', count: 12, sp: 220 });
  this.emitShake(3);
  sound.play('absorb');
}

private counter(b: LocalPlayerState, a: LocalPlayerState) {
  b.riposte = 0;
  a.stun = Math.max(a.stun, 0.7);
  a.atkT = 0;
  this.cool[a.id] = 0.2;

  this.emitFx({ type: 'txt', x: b.x, y: LBL_Y + 4, text: 'RIPOSTE!', col: '#ffffff' });
  this.emitFx({ type: 'spark', x: (a.x + b.x) / 2, y: BODY_Y - 6, col: '#ffffff', count: 16, sp: 280 });
  this.emitShake(8);
  sound.play('parry');
}

private doStrike(a: LocalPlayerState, b: LocalPlayerState) {
  if (b.ko || b.hang) return;
  const d = (b.x - a.x) * a.face;
  if (d < 0 || d > REACH || b.inv > 0) return;

  const pw = a.power > 0;
  if (pw) a.power = 0;

  if (b.riposte > 0) {
    this.counter(b, a);
    return;
  }

  const hx = (a.x + b.x) / 2;
  const hy = BODY_Y - 6;

  if (b.blocking) {
    if (b.blockT <= PARRY) {
      // Perfect parry
      a.stun = 0.7;
      a.atkT = 0;
      this.cool[a.id] = 0.2;
      b.parryT = 0.25;
      b.guard = Math.min(100, b.guard + 18);

      this.emitFx({ type: 'txt', x: b.x, y: LBL_Y + 4, text: 'PARRY!', col: '#ffffff' });
      this.emitFx({ type: 'spark', x: hx, y: hy, col: '#ffffff', count: 16, sp: 280 });
      this.emitShake(8);
      sound.play('parry');
    } else {
      // Normal block
      b.guard -= pw ? 38 : 22;
      b.grip = Math.max(1, b.grip - (pw ? 6 : 3));
      this.kb[b.id] = a.face * (pw ? 260 : 150);
      a.stun = 0.18;

      this.emitFx({ type: 'txt', x: b.x, y: LBL_Y, text: 'BLOCK', col: b.colorLight });
      this.emitFx({ type: 'spark', x: hx, y: hy, col: b.colorLight, count: 8, sp: 180 });
      this.emitShake(3);
      sound.play('block');
      if (b.guard <= 0) this.guardBreak(b);
    }
  } else if (b.shield > 0) {
    this.absorb(b);
    a.stun = 0.25;
    a.atkT = 0;
  } else {
    // Direct hit
    b.grip -= pw ? 36 : 20;
    this.kb[b.id] = a.face * (pw ? 640 : 430);
    b.stun = pw ? 0.42 : 0.28;
    b.atkT = 0;
    b.hitFlash = 0.2;

    this.emitFx({ type: 'spark', x: hx, y: hy, col: '#ffffff', count: 10, sp: 260 });
    this.emitFx({ type: 'spark', x: hx, y: hy, col: a.color, count: 8, sp: 220 });
    this.emitShake(pw ? 12 : 7);
    sound.play(pw ? 'power_strike' : 'strike');

    if (pw) this.emitFx({ type: 'txt', x: b.x, y: LBL_Y, text: 'POWER HIT!', col: a.colorLight });
    if (a.leech > 0) {
      a.leech = 0;
      a.grip = Math.min(100, a.grip + 20);
      this.emitFx({ type: 'txt', x: a.x, y: LBL_Y, text: '+20 GRIP', col: '#9cf0a8' });
      this.emitFx({ type: 'spark', x: a.x, y: BODY_Y, col: '#d24a5a', count: 8, sp: 150 });
    }

    if (b.grip <= 0) this.fall(b);
  }
}

private useSkill(s: LocalPlayerState, o: LocalPlayerState, slotIndex: number, inp: InputState): boolean {
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
      sound.play('dash');
      return true;

    case 'pounce':
      s.dashT = 0.14;
      s.dashDir = s.face;
      s.pounce = true;
      s.inv = Math.max(s.inv, 0.14);
      s.blocking = false;
      s.atkT = 0;
      sound.play('pounce');
      return true;

    case 'web':
      this.state.webs.push({
        id: `web_${Date.now()}_${Math.random()}`,
        x: s.x + s.face * 30,
        y: BODY_Y - 4,
        vx: s.face * 560,
        owner: s.id,
        life: 1.6,
        k: 'web'
      });
      sound.play('web');
      return false;

    case 'spit':
      this.state.webs.push({
        id: `spit_${Date.now()}_${Math.random()}`,
        x: s.x + s.face * 30,
        y: BODY_Y - 4,
        vx: s.face * 780,
        owner: s.id,
        life: 1.2,
        k: 'spit'
      });
      sound.play('spit');
      return false;

    case 'power':
      s.power = 5;
      this.emitFx({ type: 'txt', x: s.x, y: LBL_Y, text: 'POWER UP', col: '#ffb347' });
      this.emitFx({ type: 'spark', x: s.x, y: BODY_Y, col: '#ffb347', count: 10, sp: 180 });
      sound.play('power_up');
      return false;

    case 'shield':
      s.shield = 4;
      this.emitFx({ type: 'txt', x: s.x, y: LBL_Y, text: 'IRON SILK', col: '#cfe9ff' });
      this.emitFx({ type: 'spark', x: s.x, y: BODY_Y, col: '#cfe9ff', count: 10, sp: 160 });
      sound.play('shield');
      return false;

    case 'mend':
      s.grip = Math.min(100, s.grip + 35);
      this.emitFx({ type: 'txt', x: s.x, y: LBL_Y, text: '+35 GRIP', col: '#9cf0a8' });
      this.emitFx({ type: 'spark', x: s.x, y: BODY_Y, col: '#9cf0a8', count: 12, sp: 150 });
      sound.play('mend');
      return false;

    case 'riposte':
      s.riposte = 1;
      s.blocking = false;
      this.emitFx({ type: 'txt', x: s.x, y: LBL_Y, text: 'RIPOSTE', col: '#ffffff' });
      sound.play('riposte');
      return false;

    case 'leech':
      s.leech = 5;
      this.emitFx({ type: 'txt', x: s.x, y: LBL_Y, text: 'LEECH FANG', col: '#d24a5a' });
      sound.play('leech');
      return false;

    case 'carapace':
      s.guard = 100;
      s.gLock = false;
      this.emitFx({ type: 'txt', x: s.x, y: LBL_Y, text: 'CARAPACE', col: '#8fb7d6' });
      this.emitFx({ type: 'spark', x: s.x, y: BODY_Y, col: '#8fb7d6', count: 12, sp: 170 });
      sound.play('carapace');
      return false;

    case 'hook':
      this.state.webs.push({
        id: `hook_${Date.now()}_${Math.random()}`,
        x: s.x + s.face * 30,
        y: BODY_Y - 4,
        vx: s.face * 700,
        owner: s.id,
        life: 1.0,
        k: 'hook'
      });
      sound.play('hook');
      return false;

    case 'sweep': {
      const dd = (o.x - s.x) * s.face;
      s.stun = 0.25;
      s.atkT = 0;
      s.blocking = false;
      sound.play('sweep');
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
      sound.play('haste');
      return false;

    case 'tremor':
      s.quake = 0.5;
      this.emitShake(9);
      sound.play('tremor');
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
      sound.play('surge');
      return false;

    case 'anchor':
      s.anchorT = 2.5;
      this.emitFx({ type: 'txt', x: s.x, y: BODY_Y + s.drop + 20, text: 'ANCHORED', col: s.colorLight });
      this.emitFx({ type: 'spark', x: s.x, y: BODY_Y + s.drop + 14, col: s.colorLight, count: 8, sp: 140 });
      sound.play('anchor');
      return false;
  }
  return false;
}

private stepWebs(dt: number) {
  const webs = this.state.webs;
  for (let i = webs.length - 1; i >= 0; i--) {
    const w = webs[i];
    const me = w.owner === 0 ? this.state.p1 : this.state.p2;
    const t = w.owner === 0 ? this.state.p2 : this.state.p1;
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
        sound.play('parry');
      } else if (t.blocking) {
        t.guard -= w.k === 'spit' ? 10 : 12;
        this.emitFx({ type: 'txt', x: t.x, y: LBL_Y, text: 'BLOCK', col: t.colorLight });
        sound.play('block');
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
        sound.play('hook');
      } else if (w.k === 'spit') {
        t.stun = Math.max(t.stun, 0.9);
        t.atkT = 0;
        t.grip = Math.max(1, t.grip - 6);
        t.hitFlash = 0.15;
        this.emitFx({ type: 'txt', x: t.x, y: LBL_Y, text: 'VENOM!', col: '#9cf06a' });
        this.emitFx({ type: 'spark', x: t.x, y: BODY_Y, col: '#9cf06a', count: 10, sp: 180 });
        sound.play('spit');
      } else {
        t.snare = 1.6;
        t.grip = Math.max(1, t.grip - 4);
        t.hitFlash = 0.15;
        this.emitFx({ type: 'txt', x: t.x, y: LBL_Y, text: 'TANGLED!', col: me.colorLight });
        this.emitFx({ type: 'spark', x: t.x, y: BODY_Y, col: '#f3f7ee', count: 10, sp: 180 });
        sound.play('web');
      }
    }

    if (gone) webs.splice(i, 1);
  }
}

private getAiInput(me: LocalPlayerState, o: LocalPlayerState, dt: number): InputState {
  const D = DIFF_SETTINGS[this.diff];
  const a = this.ai;
  const inp: InputState = { left: false, right: false, strike: false, block: false, reel: 0, ab1: 0, ab2: 0 };

  const slot = (id: string) => {
    if (me.skill1 === id && me.cd1 <= 0) return 0;
    if (me.skill2 === id && me.cd2 <= 0) return 1;
    return -1;
  };
  const press = (j: number) => {
    if (j === 0) inp.ab1 = 1;
    if (j === 1) inp.ab2 = 1;
  };

  a.clock += dt;

  if (me.hang) {
    a.reelT -= dt;
    let n = 0;
    while (a.reelT <= 0 && n < 3) {
      inp.reel++;
      a.reelT += (1 / D.reel) * rand(0.75, 1.25);
      n++;
    }
    const sg = slot('surge');
    const an = slot('anchor');
    if (!me.falling && an >= 0 && me.drop > 50 && Math.random() < dt * 1.5) press(an);
    else if (!me.falling && sg >= 0 && me.drop > 60 && Math.random() < dt * 2) press(sg);
    return inp;
  }

  const free = me.stun <= 0 && me.atkT <= 0;
  const dx = o.x - me.x;
  const dist = Math.abs(dx);
  const dir = dx >= 0 ? 1 : -1;
  const go = (d: number) => {
    if (d > 0) inp.right = true;
    else inp.left = true;
  };

  if (!o.hang && o.atkT > 0 && o.atkId !== a.seen && dist < REACH + 24) {
    a.seen = o.atkId;
    const dsh = slot('dash');
    if (free && dsh >= 0 && me.snare <= 0 && dist < REACH + 10 && Math.random() < D.dash) {
      press(dsh);
      if (dir > 0) inp.left = true; else inp.right = true;
      return inp;
    }
    const sh = slot('shield');
    if (free && sh >= 0 && me.shield <= 0 && Math.random() < 0.5) {
      press(sh);
      return inp;
    }
    const rp = slot('riposte');
    if (free && rp >= 0 && me.riposte <= 0 && Math.random() < 0.3) {
      press(rp);
      return inp;
    }
    if (Math.random() < D.rc) {
      a.blockAt = a.clock + rand(D.react[0], D.react[1]);
      a.blockUntil = a.blockAt + 0.38;
    }
  }

  if (a.clock >= a.blockAt && a.clock < a.blockUntil) {
    inp.block = true;
    return inp;
  }

  if (o.hang) return inp; // wait politely

  a.nextAtk -= dt;
  if (free) {
    const r = dt * D.web;
    let j = -1;
    if ((j = slot('web')) >= 0 && o.snare <= 0 && dist > 170 && dist < 520 && Math.random() < r) press(j);
    else if ((j = slot('spit')) >= 0 && !o.blocking && dist > 120 && dist < 600 && Math.random() < r * 1.2) press(j);
    else if ((j = slot('pounce')) >= 0 && me.snare <= 0 && dist > 110 && dist < 230 && Math.random() < r * 1.5) press(j);
    else if ((j = slot('power')) >= 0 && dist < REACH + 50 && Math.random() < dt * 2) press(j);
    else if ((j = slot('shield')) >= 0 && me.shield <= 0 && dist < 220 && Math.random() < dt * 0.8) press(j);
    else if ((j = slot('mend')) >= 0 && me.grip < 55 && Math.random() < dt * 3) press(j);
    else if ((j = slot('tremor')) >= 0 && dist < 240 && !o.blocking && Math.random() < dt * 0.9) press(j);
    else if ((j = slot('haste')) >= 0 && me.hasteT <= 0 && dist > 200 && Math.random() < dt * 0.6) press(j);
    else if ((j = slot('hook')) >= 0 && !o.blocking && dist > 200 && dist < 560 && Math.random() < r) press(j);
    else if ((j = slot('sweep')) >= 0 && !o.blocking && dist < REACH + 8 && Math.random() < dt * 1.5) press(j);
    else if ((j = slot('leech')) >= 0 && me.leech <= 0 && dist < REACH + 60 && Math.random() < dt * 1.5) press(j);
    else if ((j = slot('carapace')) >= 0 && me.guard < 45 && Math.random() < dt * 3) press(j);
  }

  const want = REACH - 14;
  if (a.retreatT > 0) {
    a.retreatT -= dt;
    go(-dir);
  } else if (dist > want + 4) {
    go(dir);
  } else if (dist < 52) {
    go(-dir);
  }

  if (free && dist <= REACH - 8 && a.nextAtk <= 0 && this.cool[me.id] <= 0) {
    inp.strike = true;
    a.nextAtk = rand(D.gap[0], D.gap[1]);
    if (Math.random() < 0.35) a.retreatT = 0.25;
  }

  return inp;
}

private stepSpider(s: LocalPlayerState, o: LocalPlayerState, inp: InputState, dt: number) {
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

  s.hb += ((s.hang ? 1 : 0) - s.hb) * Math.min(1, dt * 9);
  if (s.ko) return;

  if (s.hang) {
    if (this.state.status !== 'fight') {
      if (this.state.status === 'roundEnd') {
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
      }
    } else {
      const times = this.tapTimes[id];
      while (times.length && this.timeElapsed - times[0] > 1) times.shift();
      s.rate = times.length;

      const f = Math.min(s.falls - 1, FATIGUE_MAX);
      const sinkV = SINK * (1 + 0.5 * f);
      s.drop += s.anchorT > 0 ? 0 : sinkV * dt;

      if (inp.reel > 0) this.tapBuf[id] = true;
      if (this.tapBuf[id] && this.reelCd[id] <= 0) {
        this.tapBuf[id] = false;
        s.drop -= s.tapLift;
        this.reelCd[id] = REEL_CD;
        times.push(this.timeElapsed);
        sound.play('reel');
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
    else if (s.drop >= MAXDROP) {
      s.drop = MAXDROP;
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
    let dxn = clamp(s.x + s.dashDir * 900 * dt, STICK.l + 6, STICK.r - 6);
    if (!o.hang && !o.ko && Math.abs(dxn - o.x) < MINDIST && Math.abs(dxn - o.x) < Math.abs(s.x - o.x)) {
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
      sound.play('swing');
    }
    return;
  }

  const wait = this.state.status === 'fight' && o.hang && !o.ko;
  if (wait) {
    inp = { left: false, right: false, strike: false, block: false, reel: 0, ab1: 0, ab2: 0 };
    s.blocking = false;
  }

  if (s.stun <= 0) s.grip = Math.min(100, s.grip + 2 * dt);
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
    let nx = clamp(s.x + v * dt, STICK.l + 6, STICK.r - 6);
    if (!o.hang && !o.ko && Math.abs(nx - o.x) < MINDIST && Math.abs(nx - o.x) < Math.abs(s.x - o.x)) {
      nx = s.x;
    }
    s.x = nx;
  }
  s.move += ((v ? 1 : 0) - s.move) * Math.min(1, dt * 10);
  s.walkPhase += Math.abs(v) * dt * 0.055;

  // Strike attack
  if (s.atkT > 0) {
    const prevAtk = s.atkT;
    s.atkT += dt;
    if (prevAtk < ATK.wind && s.atkT >= ATK.wind) {
      this.doStrike(s, o);
    }
    if (s.atkT > 0.1 && s.atkT < ATK.act) {
      const lx = s.x + s.face * 110 * dt;
      if (o.hang || o.ko || Math.abs(lx - o.x) >= MINDIST - 8) {
        s.x = clamp(lx, STICK.l + 6, STICK.r - 6);
      }
    }
    if (s.atkT >= ATK.end) {
      s.atkT = 0;
      this.cool[id] = 0.1;
    }
  } else if (free && inp.strike && this.cool[id] <= 0 && !s.blocking) {
    s.atkT = 0.0001;
    s.atkId++;
    const prev = s.atkType ?? 0;
    let next = Math.floor(Math.random() * 3);
    if (next === prev) {
      next = (prev + 1 + Math.floor(Math.random() * 2)) % 3;
    }
    s.atkType = next;
    sound.play('swing');
  }
}

private separate(dt: number) {
  const a = this.state.p1;
  const b = this.state.p2;
  if (a.hang || b.hang || a.ko || b.ko) return;
  const dx = b.x - a.x;
  const ad = Math.abs(dx);
  if (ad < MINDIST - 4) {
    const push = (MINDIST - ad) * Math.min(1, dt * 10);
    const sg = dx >= 0 ? 1 : -1;
    a.x = clamp(a.x - sg * push / 2, STICK.l + 6, STICK.r - 6);
    b.x = clamp(b.x + sg * push / 2, STICK.l + 6, STICK.r - 6);
  }
}
}

