export interface PlayerStateData {
  sessionId: string;
  id: number;           // 0 = Amber, 1 = Jade
  name: string;
  connected: boolean;
  color: string;
  colorDark: string;
  colorLight: string;
  pattern: string;      // 'stripes' | 'dots' | 'chevron' | 'plain'
  customPattern: string;
  acc: string;          // 'none' | 'band' | 'horns' | 'apex_crown' | 'mythic_laurel'
  level: number;        // Player online level
  rank?: string;        // Competitive rank tier
  rating?: number;      // Competitive rating/MMR
  isRanked?: boolean;
  unlockedSkills?: string[]; // Player unlocked ability web skills
  
  // Position & movement
  x: number;
  face: number;         // 1 = facing right, -1 = facing left
  move: number;
  walkPhase: number;
  
  // Combat stats
  grip: number;         // 0 - 100
  guard: number;        // 0 - 100
  falls: number;
  wins: number;
  
  // State flags
  hang: boolean;
  falling: boolean;
  drop: number;
  dropV: number;
  hb: number;           // hang blend (0 = on twig, 1 = hanging)
  
  stun: number;
  blocking: boolean;
  blockT: number;
  gLock: boolean;       // guard broken
  inv: number;          // invulnerable timer
  hitFlash: number;
  ko: boolean;
  cheer: boolean;
  parryT: number;
  
  // Ability timers & skills
  skill1: string;       // equipped ability in slot 1 (e.g. 'dash')
  skill2: string;       // equipped ability in slot 2 (e.g. 'web')
  cd1: number;          // Slot 1 cooldown
  cd1max: number;
  cd2: number;          // Slot 2 cooldown
  cd2max: number;
  
  snare: number;        // tangled by web
  venom: number;        // poison damage over time from venom spit
  dashT: number;
  dashDir: number;
  pounce: boolean;
  atkT: number;
  atkId: number;
  atkType: number;
  isHeavy: boolean;

  // Active ability buffs & states
  power: number;        // Power strike buff duration
  shield: number;       // Iron silk bubble duration
  riposte: number;      // Riposte counter stance duration
  leech: number;        // Leech fang duration
  hasteT: number;       // Haste speed buff duration
  quake: number;        // Tremor twig shockwave duration
  anchorT: number;      // Anchor line freeze sinking duration
  
  // Dangling stats
  rate: number;         // current taps/sec
  hold: number;         // needed taps/sec
  hangT: number;        // seconds spent climbing / hanging
  tapLift: number;
  depth: number;
  pump?: number;
}

export interface WebStateData {
  id: string;
  x: number;
  y: number;
  vx: number;
  owner: number;
  life: number;
  k: string;            // 'web' | 'spit' | 'hook'
}

export interface BattleStateData {
  mode: string;         // 'pvp'
  status: 'waiting' | 'draft' | 'ready' | 'fight' | 'roundEnd' | 'matchEnd';
  stateT: number;
  round: number;
  roundTimer: number;   // 60s countdown per round
  matchTimer?: number;
  winner: number;       // -1 = none, 0 = Amber, 1 = Jade
  
  // Ability drafting phase state
  draftChoicesP1: string[];
  draftChoicesP2: string[];
  p1Drafted: boolean;
  p2Drafted: boolean;

  p1: PlayerStateData;
  p2: PlayerStateData;
  webs: WebStateData[];
}
