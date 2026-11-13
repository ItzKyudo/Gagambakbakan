export interface PlayerStateData {
  sessionId: string;
  userId?: string | null;
  id: number;           // 0 = Amber, 1 = Jade
  name: string;
  species: string;
  connected: boolean;
  color: string;
  colorDark: string;
  colorLight: string;
  pattern: string;      // 'stripes' | 'dots' | 'chevron' | 'plain'
  customPattern: string;
  acc: string;          // 'none' | 'band' | 'horns' | 'apex_crown' | 'mythic_laurel'
  level: number;        // Player online level
  spiderLevel?: number; // Cosmetic level for the selected species
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
  grip: number;         // 0 - 120
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
  meleeInvT?: number;
  projectileInvT?: number;
  dashPulse?: import('../../spiderMoves').SpiderPulse;
  dashStunOnWall?: number;
  dashHitWall?: boolean;
  tetherT?: number;
  tetherAnchorX?: number;
  tetherMaxDistance?: number;
  tetherStun?: number;
  evasionChance?: number;
  evasionT?: number;
  meleeDamageFraction?: number;
  meleeDamageT?: number;
  meleeDamageRequiresBarrier?: boolean;
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
  soak: number;
  burn: number;
  igniteStacks?: number;
  shredStacks?: number;
  shredT?: number;
  tailwindStacks?: number;
  tailwindT?: number;
  tremorT?: number;
  bleedT?: number;
  silenceT?: number;
  speedMultiplier?: number;
  speedT?: number;
  reductionFraction?: number;
  reductionT?: number;
  regenPerSecond?: number;
  regenT?: number;
  reflectDamage?: number;
  reflectFraction?: number;
  reflectRequiresBarrier?: boolean;
  reflectT?: number;
  reflectSoak?: number;
  reflectIgnite?: number;
  reflectToxin?: number;
  barrierHp?: number;
  barrierT?: number;
  stealthT?: number;
  cooldownFraction?: number;
  cooldownT?: number;
  rootImmuneT?: number;
  critChance?: number;
  critT?: number;
  revealT?: number;
  revealRange?: number;
  airT?: number;
  dashBounceBack?: number;
  dashSpeedOnHazard?: { multiplier: number; duration: number; range: number };
  disorientT?: number;
  attackSpeedMultiplier?: number;
  attackSpeedT?: number;
  reflectShotsT?: number;
  knockbackImmuneT?: number;
  nextAttackBonus?: number;
  refreshToxinOnHit?: boolean;
  aftershockT?: number;
  lastVolleyId?: string;
  volleyHits?: number;
  bloomT?: number;
  bloomDamage?: number;
  hallucinationT?: number;
  comboT?: number;
  comboNext?: number;
  comboHits?: number;
  comboDamage?: number;
  comboRange?: number;
  comboRefund?: number;
  toxin?: number;
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
  species?: string;
  damage?: number;
  toxin?: number;
  pushOnSoaked?: number;
  cutsTraps?: boolean;
  volleyId?: string;
  attackSlowMultiplier?: number;
  attackSlowDuration?: number;
  attackSlowHits?: number;
  bloomDamage?: number;
  hallucination?: number;
  zoneRadius?: number;
  zonePulse?: import('../../spiderMoves').SpiderPulse;
  oneShot?: boolean;
  interval?: number;
  tickT?: number;
  followsOwner?: boolean;
  blocksShots?: boolean;
  blocksMovement?: boolean;
  slowMultiplier?: number;
  damagePerMeter?: number;
  healOwnerPerSecond?: number;
  healRequiresEnemy?: boolean;
  targetX?: number;
  progressiveSlow?: boolean;
  cage?: boolean;
  outerOnly?: boolean;
  grantStealthInterval?: number;
  mist?: boolean;
  dustCloud?: boolean;
  cooldownRateFraction?: number;
  rootImmune?: boolean;
  shotSpeedMultiplier?: number;
  stealthTick?: number;
}

export interface DisconnectPauseData {
  playerId: number;
  playerName: string;
  remainingSeconds: number;
}

export interface BattleStateData {
  mode: string;         // 'pvp'
  status: 'waiting' | 'select' | 'draft' | 'ready' | 'fight' | 'roundEnd' | 'matchEnd';
  stateT: number;
  round: number;
  roundTimer: number;   // 60s countdown per round
  matchTimer?: number;
  winner: number;       // -1 = none, 0 = Amber, 1 = Jade
  isPaused?: boolean;
  disconnectPause?: DisconnectPauseData | null;
  
  // Ability drafting phase state
  draftChoicesP1: string[];
  draftChoicesP2: string[];
  p1Drafted: boolean;
  p2Drafted: boolean;
  p1Selected: boolean;
  p2Selected: boolean;

  p1: PlayerStateData;
  p2: PlayerStateData;
  webs: WebStateData[];
}
