import { Room, Client } from 'colyseus';
import { BattleStateData, PlayerStateData, WebStateData } from './schema/BattleState';
import { BattleCombat, type PlayerInput } from './BattleCombat';
import { ABILITIES, getRandomAbilities, isAbilityId, selectDraftAbilities, AbilityId } from '../abilities';

const TAP = 8, FALL_DEPTH = 100, SINK = 17;

export class BattleRoom extends Room<{ state: BattleStateData }> {
  maxClients = 2;
  
  private battleState!: BattleStateData;
  private playerInputs: Map<string, PlayerInput> = new Map();
  private combat!: BattleCombat;

  onCreate(options: any) {
    this.battleState = {
      mode: 'pvp',
      status: 'waiting',
      stateT: 0,
      round: 1,
      winner: -1,
      draftChoicesP1: [],
      draftChoicesP2: [],
      p1Drafted: false,
      p2Drafted: false,
      p1: {} as PlayerStateData,
      p2: {} as PlayerStateData,
      webs: []
    };

    this.resetSpider(this.battleState.p1, 0, 'Amber', 340, 1);
    this.resetSpider(this.battleState.p2, 1, 'Jade', 620, -1);
    this.combat = new BattleCombat(this.battleState, (type, data) => this.broadcast(type, data));

    // Handle incoming inputs from players
    this.onMessage('input', (client, data: Partial<PlayerInput>) => {
      const current = this.playerInputs.get(client.sessionId);
      if (!current || !data || typeof data !== 'object') return;
      if (typeof data.left === 'boolean') current.left = data.left;
      if (typeof data.right === 'boolean') current.right = data.right;
      if (typeof data.strike === 'boolean') current.strike = data.strike;
      if (typeof data.block === 'boolean') current.block = data.block;
      if (data.reel) current.reel += data.reel;
      if (data.ab1) current.ab1 += data.ab1;
      if (data.ab2) current.ab2 += data.ab2;
    });

    this.onMessage('selectSkills', (client, data: { skills?: unknown }) => {
      if (this.battleState.status !== 'draft') return;
      const isP1 = this.battleState.p1.sessionId === client.sessionId;
      const isP2 = this.battleState.p2.sessionId === client.sessionId;
      if (!isP1 && !isP2) return;

      const target = isP1 ? this.battleState.p1 : this.battleState.p2;
      const choices = (isP1 ? this.battleState.draftChoicesP1 : this.battleState.draftChoicesP2).filter(isAbilityId);
      const [s1, s2] = selectDraftAbilities(data?.skills, choices);

      target.skill1 = s1;
      target.skill2 = s2;
      target.cd1max = ABILITIES[s1 as AbilityId]?.cd || 3;
      target.cd2max = s2 ? (ABILITIES[s2 as AbilityId]?.cd || 5) : 0;

      if (isP1) this.battleState.p1Drafted = true;
      if (isP2) this.battleState.p2Drafted = true;

      this.broadcast('playerDrafted', { id: target.id, skill1: s1, skill2: s2 });

      if (this.battleState.p1Drafted && this.battleState.p2Drafted) {
        this.startFightReady();
      }
    });

    this.onMessage('restart', () => {
      if (this.battleState.status === 'matchEnd') {
        this.battleState.p1.wins = 0;
        this.battleState.p2.wins = 0;
        this.battleState.p1.falls = 0;
        this.battleState.p2.falls = 0;
        this.battleState.round = 1;
        this.startMatch();
      }
    });

    // 60 FPS authoritative server loop
    this.setSimulationInterval((dtMs) => {
      this.update(Math.min(0.033, dtMs / 1000));
      this.broadcast('state', this.battleState);
    }, 1000 / 60);
  }

  private resetSpider(s: PlayerStateData, id: number, name: string, x: number, face: number) {
    s.id = id;
    s.name = name;
    s.color = s.color || (id === 0 ? '#f2a33a' : '#4cc7b2');
    s.colorDark = s.colorDark || (id === 0 ? '#8f4f14' : '#1d6a64');
    s.colorLight = s.colorLight || (id === 0 ? '#ffd694' : '#b0f2e3');
    s.pattern = s.pattern || 'stripes';
    s.acc = s.acc || 'none';
    s.level = s.level || 1;
    s.connected = false;
    s.sessionId = s.sessionId || '';
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
    s.skill1 = s.skill1 || 'dash';
    s.skill2 = s.skill2 || 'web';
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

  onJoin(client: Client, options: any) {
    const isP1 = !this.battleState.p1.connected;
    const player = isP1 ? this.battleState.p1 : this.battleState.p2;

    player.sessionId = client.sessionId;
    player.connected = true;
    if (options.name) player.name = String(options.name).slice(0, 10);
    if (typeof options.color === 'string') player.color = options.color.slice(0, 20);
    if (typeof options.colorDark === 'string') player.colorDark = options.colorDark.slice(0, 20);
    if (typeof options.colorLight === 'string') player.colorLight = options.colorLight.slice(0, 20);
    if (['stripes', 'dots', 'chevron', 'rings', 'cross', 'split', 'webmark', 'diamonds', 'plain'].includes(options.pattern)) player.pattern = options.pattern;
    if (['none', 'band', 'crown', 'horns', 'goggles', 'halo', 'mohawk', 'mask', 'tophat'].includes(options.acc)) player.acc = options.acc;
    if (options.level) player.level = Math.max(1, parseInt(options.level, 10) || 1);
    if (Array.isArray(options.unlockedSkills) && options.unlockedSkills.length > 0) {
      player.unlockedSkills = [...new Set<AbilityId>(options.unlockedSkills.filter(isAbilityId) as AbilityId[])];
    }

    this.playerInputs.set(client.sessionId, {
      left: false,
      right: false,
      strike: false,
      block: false,
      reel: 0,
      ab1: 0,
      ab2: 0
    });

    client.send('assigned', { id: player.id, name: player.name });

    if (this.battleState.p1.connected && this.battleState.p2.connected && this.battleState.status === 'waiting') {
      this.startMatch();
    }
  }

  onLeave(client: Client) {
    if (this.battleState.p1.sessionId === client.sessionId) {
      this.battleState.p1.connected = false;
    } else if (this.battleState.p2.sessionId === client.sessionId) {
      this.battleState.p2.connected = false;
    }
    this.playerInputs.delete(client.sessionId);
    this.broadcast('playerLeft', { sessionId: client.sessionId });
  }

  private startMatch() {
    this.battleState.round = 1;
    this.battleState.winner = -1;
    this.battleState.p1.wins = 0;
    this.battleState.p2.wins = 0;
    this.battleState.p1.falls = 0;
    this.battleState.p2.falls = 0;

    // Draw 3 skills for each player based on their unlocked web skills (or level fallback)
    this.battleState.draftChoicesP1 = getRandomAbilities(3, [], this.battleState.p1.unlockedSkills || this.battleState.p1.level || 1);
    this.battleState.draftChoicesP2 = getRandomAbilities(3, [], this.battleState.p2.unlockedSkills || this.battleState.p2.level || 1);
    this.battleState.p1Drafted = false;
    this.battleState.p2Drafted = false;
    this.battleState.status = 'draft';
    this.battleState.stateT = 0;

    this.broadcast('draftStart', {
      choicesP1: this.battleState.draftChoicesP1,
      choicesP2: this.battleState.draftChoicesP2
    });
  }

  private startFightReady() {
    this.startRound();
  }

  private startRound() {
    this.battleState.p1.falls = 0;
    this.battleState.p2.falls = 0;
    this.resetSpiderRound(this.battleState.p1, 440, 1);
    this.resetSpiderRound(this.battleState.p2, 760, -1);
    this.battleState.webs = [];
    this.battleState.status = 'ready';
    this.battleState.stateT = 0;
    this.combat.resetRound();

    this.broadcast('roundStart', { round: this.battleState.round });
  }

  private resetSpiderRound(s: PlayerStateData, x: number, face: number) {
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

  private update(dt: number) {
    this.battleState.stateT += dt;

    if (this.battleState.status === 'ready' && this.battleState.stateT >= 1.5) {
      this.battleState.status = 'fight';
      this.battleState.stateT = 0;
    }

    const inp0 = this.playerInputs.get(this.battleState.p1.sessionId) || { left: false, right: false, strike: false, block: false, reel: 0, ab1: 0, ab2: 0 };
    const inp1 = this.playerInputs.get(this.battleState.p2.sessionId) || { left: false, right: false, strike: false, block: false, reel: 0, ab1: 0, ab2: 0 };

    this.combat.update(dt, inp0, inp1);

    // Reset single-frame pulse inputs
    inp0.reel = 0;
    inp0.ab1 = 0;
    inp0.ab2 = 0;
    inp1.reel = 0;
    inp1.ab1 = 0;
    inp1.ab2 = 0;

    if (this.battleState.status === 'roundEnd' && this.battleState.stateT > 2.4) {
      this.endRound();
    }
  }

  private endRound() {
    const p1Wins = this.battleState.p1.wins;
    const p2Wins = this.battleState.p2.wins;

    if (p1Wins >= 2 || p2Wins >= 2) {
      this.battleState.status = 'matchEnd';
      this.battleState.stateT = 0;
      this.battleState.winner = p1Wins >= 2 ? 0 : 1;
      const winnerName = this.battleState.winner === 0 ? this.battleState.p1.name : this.battleState.p2.name;
      this.broadcast('matchEnd', {
        winner: this.battleState.winner,
        winnerName,
        p1Wins,
        p2Wins
      });
    } else {
      this.battleState.round++;
      this.startRound();
    }
  }
}
