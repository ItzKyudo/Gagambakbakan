import { TAP, FALL_DEPTH, SINK } from './constants';
import { sound } from '../audio';
import { LocalCombat } from './localCombat';
import type { InputState, LocalBattleState, LocalPlayerState } from './localGameTypes';
import { ABILITIES, drawSkills, type AbilityId } from './abilities';
import { getUnlockedIds, recordMatch, getColor } from '../gb';

export type { InputState, LocalBattleState, LocalPlayerState, LocalWebState } from './localGameTypes';

export class LocalGameEngine {
  public state: LocalBattleState;
  public mode: 'cpu' | '2p' = 'cpu';
  public diff: 'easy' | 'normal' | 'hard' = 'normal';
  public onFx?: (fx: any) => void;
  public onShake?: (shake: { amount: number }) => void;
  public onRoundWon?: (data: { winner: number; round: number; p1Wins: number; p2Wins: number }) => void;
  public onMatchEnd?: (data: { winner: number; winnerName: string; p1Wins: number; p2Wins: number; unlocked?: AbilityId[] }) => void;

  private combat!: LocalCombat;

  constructor(
    mode: 'cpu' | '2p' = 'cpu',
    diff: 'easy' | 'normal' | 'hard' = 'normal',
    customP1?: { name?: string; color?: string; colorDark?: string; colorLight?: string; pattern?: string; customPattern?: string; acc?: string },
    customP2?: { name?: string; color?: string; colorDark?: string; colorLight?: string; pattern?: string; customPattern?: string; acc?: string }
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
      status: 'draft',
      stateT: 0,
      round: 1,
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
    this.combat.onFx = fx => this.onFx?.(fx);
    this.combat.onShake = shake => this.onShake?.(shake);
    this.combat.onRoundWon = data => this.onRoundWon?.(data);
  }

  private createSpider(
    id: number,
    name: string,
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
      grip: 100,
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
      dashT: 0,
      dashDir: 0,
      pounce: false,
      atkT: 0,
      atkId: 0,
      atkType: 0,
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
      hold: SINK / TAP,
      tapLift: TAP,
      depth: FALL_DEPTH
    };
  }

  public startMatch() {
    this.state.round = 1;
    this.state.winner = -1;
    this.state.p1.wins = 0;
    this.state.p2.wins = 0;
    this.state.p1.falls = 0;
    this.state.p2.falls = 0;

    // Draw from unlocked skills
    const unlocked = getUnlockedIds();
    this.state.draftChoicesP1 = drawSkills(unlocked, 3);
    this.state.draftChoicesP2 = drawSkills(unlocked, 3);
    this.state.p1Drafted = false;
    this.state.p2Drafted = false;
    this.state.status = 'draft';
    this.state.stateT = 0;

    // In CPU mode, CPU picks 2 choices (from unlocked pool or fallback pair)
    if (this.mode === 'cpu') {
      const cpuPool = unlocked.length >= 2 ? unlocked : ['dash', 'web'];
      const cpuPicked = drawSkills(cpuPool as AbilityId[], 2);
      this.state.p2.skill1 = cpuPicked[0] || 'dash';
      this.state.p2.skill2 = cpuPicked[1] || 'web';
      this.state.p2.cd1max = ABILITIES[this.state.p2.skill1 as AbilityId]?.cd || 3;
      this.state.p2.cd2max = ABILITIES[this.state.p2.skill2 as AbilityId]?.cd || 5;
      this.state.p2Drafted = true;
    }
  }

  public confirmDraft(playerId: number, skills: string[]) {
    const s = playerId === 0 ? this.state.p1 : this.state.p2;
    s.skill1 = skills[0] || 'dash';
    s.skill2 = skills[1] || '';
    s.cd1max = ABILITIES[s.skill1 as AbilityId]?.cd || 3;
    s.cd2max = s.skill2 ? (ABILITIES[s.skill2 as AbilityId]?.cd || 5) : 0;

    if (playerId === 0) this.state.p1Drafted = true;
    if (playerId === 1) this.state.p2Drafted = true;

    if (this.state.p1Drafted && this.state.p2Drafted) {
      this.startRound();
    }
  }

  public startRound() {
    this.state.p1.falls = 0;
    this.state.p2.falls = 0;
    this.resetSpiderRound(this.state.p1, 440, 1);
    this.resetSpiderRound(this.state.p2, 760, -1);
    this.state.webs = [];
    this.state.status = 'ready';
    this.state.stateT = 0;
    this.combat.resetRound();

    sound.play('start');
  }

  private resetSpiderRound(s: LocalPlayerState, x: number, face: number) {
    s.x = x;
    s.face = face;
    s.move = 0;
    s.walkPhase = 0;
    s.grip = 100;
    s.guard = 100;
    s.hang = false;
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
    s.cd1max = ABILITIES[s.skill1 as AbilityId]?.cd || 3;
    s.cd2 = 0;
    s.cd2max = ABILITIES[s.skill2 as AbilityId]?.cd || 5;
    s.snare = 0;
    s.dashT = 0;
    s.dashDir = 0;
    s.pounce = false;
    s.atkT = 0;
    s.atkId = 0;
    s.atkType = 0;
    s.power = 0;
    s.shield = 0;
    s.riposte = 0;
    s.leech = 0;
    s.hasteT = 0;
    s.quake = 0;
    s.anchorT = 0;
    s.rate = 0;
    s.hold = SINK / TAP;
    s.tapLift = TAP;
    s.depth = FALL_DEPTH;
  }

  public update(dt: number, humanInpP1: InputState, humanInpP2?: InputState) {
    this.state.stateT += dt;

    if (this.state.status === 'ready' && this.state.stateT >= 1.5) {
      this.state.status = 'fight';
      this.state.stateT = 0;
    }

    this.combat.update(dt, humanInpP1, humanInpP2, this.mode, this.diff);

    if (this.state.status === 'roundEnd' && this.state.stateT > 2.4) {
      this.endRound();
    }
  }

  private endRound() {
    const p1Wins = this.state.p1.wins;
    const p2Wins = this.state.p2.wins;

    if (p1Wins >= 2 || p2Wins >= 2) {
      this.state.status = 'matchEnd';
      this.state.stateT = 0;
      this.state.winner = p1Wins >= 2 ? 0 : 1;
      const winnerName = this.state.winner === 0 ? this.state.p1.name : this.state.p2.name;

      // Record match for offline stats
      recordMatch(this.mode === 'cpu' && this.state.winner === 0);

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
