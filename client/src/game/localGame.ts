import { TAP, FALL_DEPTH, MAX_GRIP } from './constants';
import { sound } from '../audio';
import { LocalCombat } from './localCombat';
import type { InputState, LocalBattleState, LocalPlayerState } from './localGameTypes';
import { drawSkills, getSpiderAbility, type AbilityId } from './abilities';
import { getUnlockedIds, recordMatch, getColor, getLevel, getProgress } from '../gb';
import { TERRAINS, terrainAt } from './terrain';

export type { InputState, LocalBattleState, LocalPlayerState, LocalWebState } from './localGameTypes';

export class LocalGameEngine {
  public state: LocalBattleState;
  public mode: 'cpu' | '2p' | 'demo' = 'cpu';
  public diff: 'easy' | 'normal' | 'hard' = 'normal';
  public onFx?: (fx: any) => void;
  public onShake?: (shake: { amount: number }) => void;
  public onRoundWon?: (data: { winner: number; round: number; p1Wins: number; p2Wins: number }) => void;
  public onMatchEnd?: (data: { winner: number; winnerName: string; p1Wins: number; p2Wins: number; unlocked?: AbilityId[]; isTimeOut?: boolean }) => void;

  private combat!: LocalCombat;
  private terrainStart = Math.floor(Math.random() * TERRAINS.length);

  constructor(
    mode: 'cpu' | '2p' | 'demo' = 'cpu',
    diff: 'easy' | 'normal' | 'hard' = 'normal',
    customP1?: { name?: string; species?: string; color?: string; colorDark?: string; colorLight?: string; pattern?: string; customPattern?: string; acc?: string },
    customP2?: { name?: string; species?: string; color?: string; colorDark?: string; colorLight?: string; pattern?: string; customPattern?: string; acc?: string }
  ) {
    this.mode = mode;
    this.diff = diff;

    const p1Col = getColor(customP1?.color || 'amber');
    const p1Main = customP1?.color && customP1.color.startsWith('#') ? customP1.color : p1Col.main;
    const p1Dark = customP1?.colorDark || p1Col.dark;
    const p1Light = customP1?.colorLight || p1Col.light;

    const p2Col = getColor(customP2?.color || 'jade');
    const p2Main = customP2?.color && customP2.color.startsWith('#') ? customP2.color : p2Col.main;
    const p2Dark = customP2?.colorDark || p2Col.dark;
    const p2Light = customP2?.colorLight || p2Col.light;

    const p1 = this.createSpider(
      0,
      customP1?.name || 'Amber',
      customP1?.species || 'weaver',
      340,
      1,
      p1Main,
      p1Dark,
      p1Light,
      customP1?.pattern || 'stripes',
      customP1?.customPattern || '',
      customP1?.acc || 'none'
    );

    const p2 = this.createSpider(
      1,
      customP2?.name || (mode === 'cpu' ? 'Jade' : 'Jade'),
      customP2?.species || 'hunter',
      620,
      -1,
      p2Main,
      p2Dark,
      p2Light,
      customP2?.pattern || 'stripes',
      customP2?.customPattern || '',
      customP2?.acc || 'none'
    );

    this.state = {
      terrain: terrainAt(this.terrainStart).id,
      terrainTime: 0,
      terrainBroken: false,
      terrainSink: 0,
      terrainClearT: 0,
      terrainBuds: 0,
      terrainPuddleT: 0,
      terrainFireT: 0,
      status: mode === 'demo' ? 'draft' : 'select',
      stateT: 0,
      round: 1,
      roundTimer: 60,
      matchTimer: 60,
      winner: -1,
      draftChoicesP1: [],
      draftChoicesP2: [],
      p1Drafted: false,
      p2Drafted: false,
      p1,
      p2,
      webs: []
    };

    this.combat = new LocalCombat(this.state);
    if (mode === 'demo') {
      this.combat.isMuted = true;
    }
    this.combat.onFx = fx => this.onFx?.(fx);
    this.combat.onShake = shake => this.onShake?.(shake);
    this.combat.onRoundWon = data => this.onRoundWon?.(data);
  }

  private createSpider(
    id: number,
    name: string,
    species: string,
    x: number,
    face: number,
    main: string,
    dark: string,
    light: string,
    pattern: string,
    customPattern: string,
    acc: string
  ): LocalPlayerState {
    return {
      id,
      name,
      species,
      spiderLevel: getLevel(getProgress().spiderProgress?.[species]?.exp || 0),
      color: main,
      colorDark: dark,
      colorLight: light,
      pattern,
      customPattern,
      acc,
      x,
      face,
      move: 0,
      walkPhase: 0,
      grip: MAX_GRIP,
      guard: 100,
      hang: false,
      falling: false,
      drop: 0,
      dropV: 0,
      hb: 0,
      stun: 0,
      blocking: false,
      blockT: 0,
      gLock: false,
      inv: 0,
      hitFlash: 0,
      ko: false,
      cheer: false,
      parryT: 0,
      skill1: 'dash',
      skill2: 'web',
      cd1: 0,
      cd1max: 3,
      cd2: 0,
      cd2max: 5,
      snare: 0,
      venom: 0,
      soak: 0,
      burn: 0,
      dashT: 0,
      dashDir: 0,
      pounce: false,
      atkT: 0,
      atkId: 0,
      atkType: 0,
      isHeavy: false,
      power: 0,
      shield: 0,
      riposte: 0,
      leech: 0,
      hasteT: 0,
      quake: 0,
      anchorT: 0,
      falls: 0,
      wins: 0,
      rate: 0,
      hold: 1,
      hangT: 0,
      tapLift: TAP,
      depth: FALL_DEPTH
    };
  }

  public startMatch() {
    this.terrainStart = Math.floor(Math.random() * TERRAINS.length);
    this.state.round = 1;
    this.state.winner = -1;
    this.state.p1.wins = 0;
    this.state.p2.wins = 0;
    this.state.p1.falls = 0;
    this.state.p2.falls = 0;
    this.state.roundTimer = 60;
    this.state.matchTimer = 60;

    if (this.mode === 'demo') {
      this.state.p1.skill1 = 'dash';
      this.state.p1.skill2 = 'web';
      this.state.p2.skill1 = 'dash';
      this.state.p2.skill2 = 'web';
      this.state.p1Drafted = true;
      this.state.p2Drafted = true;
      this.startRound();
      return;
    }

    // Offer all unlocked skills for drafting
    const progress = getProgress();
    this.state.p1.spiderLevel = getLevel(progress.spiderProgress?.[this.state.p1.species]?.exp || 0);
    this.state.p2.spiderLevel = getLevel(progress.spiderProgress?.[this.state.p2.species]?.exp || 0);
    this.state.draftChoicesP1 = getUnlockedIds(undefined, this.state.p1.species);
    this.state.draftChoicesP2 = getUnlockedIds(undefined, this.state.p2.species);
    this.state.p1Drafted = false;
    this.state.p2Drafted = false;
    this.state.status = 'draft';
    this.state.stateT = 0;

    // In CPU mode, CPU picks 2 choices (from unlocked pool or fallback pair)
    if (this.mode === 'cpu') {
      const cpuPicked = drawSkills(this.state.draftChoicesP2, 2);
      this.state.p2.skill1 = cpuPicked[0] || 'dash';
      this.state.p2.skill2 = cpuPicked[1] || '';
      this.state.p2.cd1max = getSpiderAbility(this.state.p2.species, this.state.p2.skill1 as AbilityId).cd;
      this.state.p2.cd2max = getSpiderAbility(this.state.p2.species, this.state.p2.skill2 as AbilityId).cd;
      this.state.p2Drafted = true;
    }
  }

  public confirmDraft(playerId: number, skills: string[]) {
    const s = playerId === 0 ? this.state.p1 : this.state.p2;
    const choices = playerId === 0 ? this.state.draftChoicesP1 : this.state.draftChoicesP2;
    s.skill1 = choices.includes(skills[0] as AbilityId) ? skills[0] : (choices[0] || 'dash');
    s.skill2 = skills[1] !== s.skill1 && choices.includes(skills[1] as AbilityId)
      ? skills[1] : (choices.find(skill => skill !== s.skill1) || '');
    s.cd1max = getSpiderAbility(s.species, s.skill1 as AbilityId).cd;
    s.cd2max = s.skill2 ? getSpiderAbility(s.species, s.skill2 as AbilityId).cd : 0;

    if (playerId === 0) this.state.p1Drafted = true;
    if (playerId === 1) this.state.p2Drafted = true;

    if (this.state.p1Drafted && this.state.p2Drafted) {
      this.startRound();
    }
  }

  public startRound() {
    this.state.terrain = terrainAt(this.terrainStart + this.state.round - 1).id;
    this.state.terrainTime = 0;
    this.state.terrainBroken = false;
    this.state.terrainStrike = undefined;
    this.state.terrainSink = 0;
    this.state.terrainClearT = 0;
    this.state.terrainBuds = 0;
    this.state.terrainPuddleT = 0;
    this.state.terrainFireT = 0;
    this.state.p1.falls = 0;
    this.state.p2.falls = 0;
    this.resetSpiderRound(this.state.p1, 440, 1);
    this.resetSpiderRound(this.state.p2, 760, -1);
    this.state.webs = [];
    this.state.status = 'ready';
    this.state.stateT = 0;
    this.state.roundTimer = 60;
    this.state.matchTimer = 60;
    this.combat.resetRound();

    if (this.mode !== 'demo') {
      sound.play('start');
      sound.music.play('duel');
    }
  }

  private resetSpiderRound(s: LocalPlayerState, x: number, face: number) {
    s.x = x;
    s.face = face;
    s.move = 0;
    s.walkPhase = 0;
    s.grip = MAX_GRIP;
    s.guard = 100;
    s.hang = false;
    s.under = false;
    s.falling = false;
    s.drop = 0;
    s.dropV = 0;
    s.hb = 0;
    s.stun = 0;
    s.blocking = false;
    s.blockT = 0;
    s.gLock = false;
    s.inv = 0;
    s.hitFlash = 0;
    s.ko = false;
    s.cheer = false;
    s.parryT = 0;
    s.cd1 = 0;
    s.cd1max = getSpiderAbility(s.species, s.skill1 as AbilityId).cd;
    s.cd2 = 0;
    s.cd2max = getSpiderAbility(s.species, s.skill2 as AbilityId).cd;
    s.snare = 0;
    s.venom = 0;
    s.soak = 0;
    s.burn = 0;
    Object.assign(s, { airT: 0, terrainJumpT: 0, dashBounceBack: undefined, igniteStacks: 0, shredStacks: 0, shredT: 0, tailwindStacks: 0, tailwindT: 0, tremorT: 0,
      toxin: 0, bleedT: 0, silenceT: 0, speedT: 0, reductionT: 0, regenT: 0, reflectT: 0, reflectFraction: undefined, reflectRequiresBarrier: false, meleeDamageFraction: 0, meleeDamageT: 0, meleeDamageRequiresBarrier: false,
      barrierHp: 0, barrierT: 0, stealthT: 0, cooldownT: 0, rootImmuneT: 0, critT: 0, revealT: 0, revealRange: 0, attackSpeedT: 0,
      reflectShotsT: 0, knockbackImmuneT: 0, nextAttackBonus: 0, refreshToxinOnHit: false, aftershockT: 0, projectileInvT: 0, dashPulse: undefined, dashStunOnWall: undefined, dashHitWall: false,
      tetherT: 0, tetherAnchorX: undefined, tetherMaxDistance: undefined, tetherStun: undefined, evasionChance: 0, evasionT: 0,
      lastVolleyId: '', volleyHits: 0, bloomT: 0, bloomDamage: 0, hallucinationT: 0 });
    s.dashT = 0;
    s.dashDir = 0;
    s.pounce = false;
    s.atkT = 0;
    s.atkId = 0;
    s.atkType = 0;
    s.isHeavy = false;
    s.power = 0;
    s.shield = 0;
    s.riposte = 0;
    s.leech = 0;
    s.hasteT = 0;
    s.quake = 0;
    s.anchorT = 0;
    s.rate = 0;
    s.hold = 1;
    s.hangT = 0;
    s.tapLift = TAP;
    s.depth = FALL_DEPTH;
  }

  public update(dt: number, humanInpP1: InputState, humanInpP2?: InputState) {
    this.state.stateT += dt;

    if (this.state.status === 'ready' && this.state.stateT >= 1.5) {
      this.state.status = 'fight';
      this.state.stateT = 0;
    }

    if (this.state.status === 'fight') {
      const prevSec = Math.ceil(this.state.roundTimer);
      this.state.roundTimer = Math.max(0, this.state.roundTimer - dt);
      this.state.matchTimer = this.state.roundTimer;
      const curSec = Math.ceil(this.state.roundTimer);
      if (curSec < prevSec && curSec <= 5 && curSec > 0) {
        sound.playTone(850 + (5 - curSec) * 100, 0.04, 'sine', 0.02);
      }
      if (this.state.roundTimer <= 0) {
        this.timeOutRound();
        return;
      }
    }

    this.combat.update(dt, humanInpP1, humanInpP2, this.mode, this.diff);

    if (this.state.status === 'roundEnd' && this.state.stateT > 2.4) {
      if (this.mode === 'demo') {
        this.startRound();
      } else {
        this.endRound();
      }
    }
  }

  private timeOutRound() {
    this.state.status = 'roundEnd';
    this.state.stateT = 0;

    // The final round may use remaining grip and guard to settle the match.
    this.onFx?.({
      type: 'txt',
      x: 600,
      y: 200,
      text: 'TIME UP!',
      col: '#ffd694'
    });
    sound.play('ko');
  }

  private endRound() {
    const p1Wins = this.state.p1.wins;
    const p2Wins = this.state.p2.wins;

    if (p1Wins >= 2 || p2Wins >= 2 || this.state.round >= 5) {
      this.state.status = 'matchEnd';
      this.state.stateT = 0;
      const score1 = p1Wins * 1000 + this.state.p1.grip + this.state.p1.guard;
      const score2 = p2Wins * 1000 + this.state.p2.grip + this.state.p2.guard;
      this.state.winner = score1 === score2 ? -1 : score1 > score2 ? 0 : 1;
      const winnerName = this.state.winner < 0 ? 'Draw' : this.state.winner === 0 ? this.state.p1.name : this.state.p2.name;

      // Record match for offline stats
      if (this.state.winner >= 0) recordMatch(this.mode === 'cpu' && this.state.winner === 0);

      if (this.onMatchEnd) {
        this.onMatchEnd({
          winner: this.state.winner,
          winnerName,
          p1Wins,
          p2Wins,
          unlocked: []
        });
      }
    } else {
      this.state.round++;
      this.startRound();
    }
  }
}
