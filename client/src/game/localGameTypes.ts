import type { AbilityId } from './abilities';

export interface LocalPlayerState {
  id: number;
  name: string;
  color: string;
  colorDark: string;
  colorLight: string;
  pattern: string;
  customPattern: string;
  acc: string;
  x: number;
  face: number;
  move: number;
  walkPhase: number;
  grip: number;
  guard: number;
  hang: boolean;
  falling: boolean;
  drop: number;
  dropV: number;
  hb: number;
  stun: number;
  blocking: boolean;
  blockT: number;
  gLock: boolean;
  inv: number;
  hitFlash: number;
  ko: boolean;
  cheer: boolean;
  parryT: number;
  skill1: string;
  skill2: string;
  cd1: number;
  cd1max: number;
  cd2: number;
  cd2max: number;
  snare: number;
  dashT: number;
  dashDir: number;
  pounce: boolean;
  atkT: number;
  atkId: number;
  atkType: number;
  power: number;
  shield: number;
  riposte: number;
  leech: number;
  hasteT: number;
  quake: number;
  anchorT: number;
  falls: number;
  wins: number;
  rate: number;
  hold: number;
  tapLift: number;
  depth: number;
}

export interface LocalWebState {
  id: string;
  x: number;
  y: number;
  vx: number;
  owner: number;
  life: number;
  k: 'web' | 'spit' | 'hook';
}

export interface LocalBattleState {
  status: 'waiting' | 'draft' | 'ready' | 'fight' | 'roundEnd' | 'matchEnd';
  stateT: number;
  round: number;
  winner: number;
  draftChoicesP1: AbilityId[];
  draftChoicesP2: AbilityId[];
  p1Drafted: boolean;
  p2Drafted: boolean;
  p1: LocalPlayerState;
  p2: LocalPlayerState;
  webs: LocalWebState[];
}

export interface InputState {
  left: boolean;
  right: boolean;
  strike: boolean;
  block: boolean;
  reel: number;
  ab1: number;
  ab2: number;
}

