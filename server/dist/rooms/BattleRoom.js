"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BattleRoom = void 0;
const colyseus_1 = require("colyseus");
const abilities_1 = require("../abilities");
const STICK = { l: 130, r: 830, y: 240, th: 22 };
const POND_Y = 478, BODY_H = 30;
const BODY_Y = STICK.y + STICK.th + BODY_H;
const LBL_Y = BODY_Y + 46;
const MAXDROP = POND_Y - BODY_Y - 26 - 4;
const REACH = 84, MINDIST = 48, SPEED = 175, PARRY = 0.08;
const ATK = { wind: 0.16, act: 0.26, end: 0.46 };
const REEL_CD = 0.14, TAP = 8, FALL_DEPTH = 100, SINK = 17, FALL_SPEED = 320, SURGE_LIFT = 50;
const FATIGUE_MAX = 4;
const cl = (v, a, b) => Math.max(a, Math.min(b, v));
class BattleRoom extends colyseus_1.Room {
    maxClients = 2;
    battleState;
    playerInputs = new Map();
    tapTimes = [[], []];
    tapBuf = [false, false];
    reelCd = [0, 0];
    kb = [0, 0];
    cool = [0, 0];
    timeElapsed = 0;
    onCreate(options) {
        this.battleState = {
            roomCode: options.roomCode || this.roomId.slice(0, 5).toUpperCase(),
            mode: 'pvp',
            status: 'waiting',
            stateT: 0,
            round: 1,
            winner: -1,
            draftChoicesP1: [],
            draftChoicesP2: [],
            p1Drafted: false,
            p2Drafted: false,
            p1: {},
            p2: {},
            webs: []
        };
        this.resetSpider(this.battleState.p1, 0, 'Amber', 340, 1);
        this.resetSpider(this.battleState.p2, 1, 'Jade', 620, -1);
        // Handle incoming inputs from players
        this.onMessage('input', (client, data) => {
            const current = this.playerInputs.get(client.sessionId);
            if (!current)
                return;
            if (typeof data.left === 'boolean')
                current.left = data.left;
            if (typeof data.right === 'boolean')
                current.right = data.right;
            if (typeof data.strike === 'boolean')
                current.strike = data.strike;
            if (typeof data.block === 'boolean')
                current.block = data.block;
            if (data.reel)
                current.reel += data.reel;
            if (data.ab1)
                current.ab1 += data.ab1;
            if (data.ab2)
                current.ab2 += data.ab2;
        });
        this.onMessage('selectSkills', (client, data) => {
            if (this.battleState.status !== 'draft')
                return;
            const isP1 = this.battleState.p1.sessionId === client.sessionId;
            const isP2 = this.battleState.p2.sessionId === client.sessionId;
            if (!isP1 && !isP2)
                return;
            const target = isP1 ? this.battleState.p1 : this.battleState.p2;
            const choices = isP1 ? this.battleState.draftChoicesP1 : this.battleState.draftChoicesP2;
            const s1 = data.skills && data.skills[0] && choices.includes(data.skills[0]) ? data.skills[0] : (choices[0] || 'dash');
            const s2 = data.skills && data.skills[1] && choices.includes(data.skills[1]) ? data.skills[1] : (choices[1] || 'web');
            target.skill1 = s1;
            target.skill2 = s2;
            target.cd1max = abilities_1.ABILITIES[s1]?.cd || 3;
            target.cd2max = abilities_1.ABILITIES[s2]?.cd || 5;
            if (isP1)
                this.battleState.p1Drafted = true;
            if (isP2)
                this.battleState.p2Drafted = true;
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
            this.update(dtMs / 1000);
            this.broadcast('state', this.battleState);
        }, 1000 / 60);
    }
    resetSpider(s, id, name, x, face) {
        s.id = id;
        s.name = name;
        s.color = s.color || (id === 0 ? '#f2a33a' : '#4cc7b2');
        s.colorDark = s.colorDark || (id === 0 ? '#8f4f14' : '#1d6a64');
        s.colorLight = s.colorLight || (id === 0 ? '#ffd694' : '#b0f2e3');
        s.pattern = s.pattern || 'stripes';
        s.acc = s.acc || 'none';
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
        s.cd1max = abilities_1.ABILITIES[s.skill1]?.cd || 3;
        s.cd2 = 0;
        s.cd2max = abilities_1.ABILITIES[s.skill2]?.cd || 5;
        s.snare = 0;
        s.dashT = 0;
        s.dashDir = 0;
        s.pounce = false;
        s.atkT = 0;
        s.atkId = 0;
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
    onJoin(client, options) {
        const isP1 = !this.battleState.p1.connected;
        const player = isP1 ? this.battleState.p1 : this.battleState.p2;
        player.sessionId = client.sessionId;
        player.connected = true;
        if (options.name)
            player.name = String(options.name).slice(0, 10);
        if (options.color)
            player.color = options.color;
        if (options.colorDark)
            player.colorDark = options.colorDark;
        if (options.colorLight)
            player.colorLight = options.colorLight;
        if (options.pattern)
            player.pattern = options.pattern;
        if (options.acc)
            player.acc = options.acc;
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
    onLeave(client) {
        if (this.battleState.p1.sessionId === client.sessionId) {
            this.battleState.p1.connected = false;
        }
        else if (this.battleState.p2.sessionId === client.sessionId) {
            this.battleState.p2.connected = false;
        }
        this.playerInputs.delete(client.sessionId);
        this.broadcast('playerLeft', { sessionId: client.sessionId });
    }
    startMatch() {
        this.battleState.round = 1;
        this.battleState.winner = -1;
        this.battleState.p1.wins = 0;
        this.battleState.p2.wins = 0;
        this.battleState.p1.falls = 0;
        this.battleState.p2.falls = 0;
        // Draw 3 skills for each player to draft
        this.battleState.draftChoicesP1 = (0, abilities_1.getRandomAbilities)(3);
        this.battleState.draftChoicesP2 = (0, abilities_1.getRandomAbilities)(3);
        this.battleState.p1Drafted = false;
        this.battleState.p2Drafted = false;
        this.battleState.status = 'draft';
        this.battleState.stateT = 0;
        this.broadcast('draftStart', {
            choicesP1: this.battleState.draftChoicesP1,
            choicesP2: this.battleState.draftChoicesP2
        });
    }
    startFightReady() {
        this.startRound();
    }
    startRound() {
        this.battleState.p1.falls = 0;
        this.battleState.p2.falls = 0;
        this.resetSpiderRound(this.battleState.p1, 340, 1);
        this.resetSpiderRound(this.battleState.p2, 620, -1);
        this.battleState.webs = [];
        this.battleState.status = 'ready';
        this.battleState.stateT = 0;
        this.tapTimes = [[], []];
        this.tapBuf = [false, false];
        this.reelCd = [0, 0];
        this.kb = [0, 0];
        this.cool = [0, 0];
        this.broadcast('roundStart', { round: this.battleState.round });
    }
    resetSpiderRound(s, x, face) {
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
        s.cd1max = abilities_1.ABILITIES[s.skill1]?.cd || 3;
        s.cd2 = 0;
        s.cd2max = abilities_1.ABILITIES[s.skill2]?.cd || 5;
        s.snare = 0;
        s.dashT = 0;
        s.dashDir = 0;
        s.pounce = false;
        s.atkT = 0;
        s.atkId = 0;
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
    emitFx(fx) {
        this.broadcast('fx', fx);
    }
    emitSound(name) {
        this.broadcast('snd', { name });
    }
    emitShake(amount) {
        this.broadcast('shake', { amount });
    }
    fall(s) {
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
        s.x = cl(s.x, STICK.l, STICK.r);
        s.falls++;
        const f = Math.min(s.falls - 1, FATIGUE_MAX);
        s.tapLift = TAP;
        const sinkV = SINK * (1 + 0.5 * f);
        s.depth = Math.min(FALL_DEPTH + 12 * f, MAXDROP - 30);
        s.hold = sinkV / s.tapLift;
        this.tapTimes[s.id] = [];
        s.rate = 0;
        this.emitFx({ type: 'txt', x: s.x, y: LBL_Y, text: s.falls > 1 ? `FALL ×${s.falls}` : 'FALL!', col: '#e8593f' });
        this.emitFx({ type: 'dust', x: s.x, y: STICK.y + STICK.th, count: 6 });
        this.emitShake(6);
        this.emitSound('fall');
    }
    recover(s) {
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
        s.x = cl(s.x, STICK.l + 10, STICK.r - 10);
        this.emitFx({ type: 'txt', x: s.x, y: LBL_Y, text: 'BACK UP!', col: s.colorLight });
        this.emitFx({ type: 'dust', x: s.x, y: STICK.y + STICK.th, count: 8 });
        this.emitSound('recover');
    }
    guardBreak(s) {
        s.guard = 0;
        s.gLock = true;
        s.stun = 0.9;
        s.blocking = false;
        s.atkT = 0;
        this.emitFx({ type: 'txt', x: s.x, y: LBL_Y, text: 'GUARD BREAK', col: '#e8593f' });
        this.emitFx({ type: 'spark', x: s.x, y: BODY_Y, col: '#bfe0f4', count: 12, sp: 200 });
        this.emitShake(6);
        this.emitSound('guardbreak');
    }
    knockOut(s) {
        if (this.battleState.status !== 'fight')
            return;
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
    absorb(b) {
        b.shield = 0;
        this.emitFx({ type: 'txt', x: b.x, y: LBL_Y, text: 'ABSORBED', col: '#cfe9ff' });
        this.emitFx({ type: 'spark', x: b.x, y: BODY_Y, col: '#cfe9ff', count: 12, sp: 220 });
        this.emitShake(3);
        this.emitSound('absorb');
    }
    counter(b, a) {
        b.riposte = 0;
        a.stun = Math.max(a.stun, 0.7);
        a.atkT = 0;
        this.cool[a.id] = 0.2;
        this.emitFx({ type: 'txt', x: b.x, y: LBL_Y + 4, text: 'RIPOSTE!', col: '#ffffff' });
        this.emitFx({ type: 'spark', x: (a.x + b.x) / 2, y: BODY_Y - 6, col: '#ffffff', count: 16, sp: 280 });
        this.emitShake(8);
        this.emitSound('parry');
    }
    doStrike(a, b) {
        if (b.ko || b.hang)
            return;
        const d = (b.x - a.x) * a.face;
        if (d < 0 || d > REACH || b.inv > 0)
            return;
        const pw = a.power > 0;
        if (pw)
            a.power = 0;
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
                this.emitSound('parry');
            }
            else {
                // Normal block
                b.guard -= pw ? 38 : 22;
                b.grip = Math.max(1, b.grip - (pw ? 6 : 3));
                this.kb[b.id] = a.face * (pw ? 260 : 150);
                a.stun = 0.18;
                this.emitFx({ type: 'txt', x: b.x, y: LBL_Y, text: 'BLOCK', col: b.colorLight });
                this.emitFx({ type: 'spark', x: hx, y: hy, col: b.colorLight, count: 8, sp: 180 });
                this.emitShake(3);
                this.emitSound('block');
                if (b.guard <= 0)
                    this.guardBreak(b);
            }
        }
        else if (b.shield > 0) {
            this.absorb(b);
            a.stun = 0.25;
            a.atkT = 0;
        }
        else {
            // Direct hit
            b.grip -= pw ? 36 : 20;
            this.kb[b.id] = a.face * (pw ? 640 : 430);
            b.stun = pw ? 0.42 : 0.28;
            b.atkT = 0;
            b.hitFlash = 0.2;
            this.emitFx({ type: 'spark', x: hx, y: hy, col: '#ffffff', count: 10, sp: 260 });
            this.emitFx({ type: 'spark', x: hx, y: hy, col: a.color, count: 8, sp: 220 });
            this.emitShake(pw ? 12 : 7);
            this.emitSound(pw ? 'power_strike' : 'strike');
            if (pw)
                this.emitFx({ type: 'txt', x: b.x, y: LBL_Y, text: 'POWER HIT!', col: a.colorLight });
            if (a.leech > 0) {
                a.leech = 0;
                a.grip = Math.min(100, a.grip + 20);
                this.emitFx({ type: 'txt', x: a.x, y: LBL_Y, text: '+20 GRIP', col: '#9cf0a8' });
                this.emitFx({ type: 'spark', x: a.x, y: BODY_Y, col: '#d24a5a', count: 8, sp: 150 });
            }
            if (b.grip <= 0)
                this.fall(b);
        }
    }
    useSkill(s, o, slotIndex, inp) {
        const id = slotIndex === 0 ? s.skill1 : s.skill2;
        const def = abilities_1.ABILITIES[id];
        if (!def)
            return false;
        if (slotIndex === 0) {
            s.cd1 = def.cd;
            s.cd1max = def.cd;
        }
        else {
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
                s.grip = Math.min(100, s.grip + 35);
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
                    }
                    else if (o.shield > 0) {
                        this.absorb(o);
                    }
                    else if (o.blocking) {
                        o.guard -= 15;
                        this.kb[o.id] = s.face * 300;
                        this.emitFx({ type: 'txt', x: o.x, y: LBL_Y, text: 'BLOCK', col: o.colorLight });
                        if (o.guard <= 0)
                            this.guardBreak(o);
                    }
                    else {
                        o.grip -= 10;
                        this.kb[o.id] = s.face * 650;
                        o.stun = 0.3;
                        o.atkT = 0;
                        o.hitFlash = 0.2;
                        this.emitFx({ type: 'txt', x: o.x, y: LBL_Y, text: 'SWEPT!', col: s.colorLight });
                        this.emitFx({ type: 'spark', x: o.x, y: BODY_Y, col: '#ffffff', count: 10, sp: 240 });
                        this.emitShake(8);
                        if (o.grip <= 0)
                            this.fall(o);
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
                    }
                    else if (o.blocking) {
                        this.emitFx({ type: 'txt', x: o.x, y: LBL_Y, text: 'HELD', col: o.colorLight });
                    }
                    else {
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
    stepWebs(dt) {
        const webs = this.battleState.webs;
        for (let i = webs.length - 1; i >= 0; i--) {
            const w = webs[i];
            const me = w.owner === 0 ? this.battleState.p1 : this.battleState.p2;
            const t = w.owner === 0 ? this.battleState.p2 : this.battleState.p1;
            w.x += w.vx * dt;
            w.life -= dt;
            let gone = w.life <= 0 || w.x < -20 || w.x > 980;
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
                }
                else if (t.blocking) {
                    t.guard -= w.k === 'spit' ? 10 : 12;
                    this.emitFx({ type: 'txt', x: t.x, y: LBL_Y, text: 'BLOCK', col: t.colorLight });
                    this.emitSound('block');
                    if (t.guard <= 0)
                        this.guardBreak(t);
                }
                else if (t.shield > 0) {
                    this.absorb(t);
                }
                else if (w.k === 'hook') {
                    const pull = Math.max(0, Math.abs(me.x - t.x) - 50) * 7 * 0.9;
                    this.kb[t.id] = (me.x > t.x ? 1 : -1) * Math.min(1000, pull);
                    t.stun = Math.max(t.stun, 0.35);
                    t.atkT = 0;
                    t.grip = Math.max(1, t.grip - 4);
                    t.hitFlash = 0.15;
                    this.emitFx({ type: 'txt', x: t.x, y: LBL_Y, text: 'HOOKED!', col: me.colorLight });
                    this.emitFx({ type: 'spark', x: t.x, y: BODY_Y, col: '#f3f7ee', count: 8, sp: 180 });
                    this.emitSound('hook');
                }
                else if (w.k === 'spit') {
                    t.stun = Math.max(t.stun, 0.9);
                    t.atkT = 0;
                    t.grip = Math.max(1, t.grip - 6);
                    t.hitFlash = 0.15;
                    this.emitFx({ type: 'txt', x: t.x, y: LBL_Y, text: 'VENOM!', col: '#9cf06a' });
                    this.emitFx({ type: 'spark', x: t.x, y: BODY_Y, col: '#9cf06a', count: 10, sp: 180 });
                    this.emitSound('spit');
                }
                else {
                    t.snare = 1.6;
                    t.grip = Math.max(1, t.grip - 4);
                    t.hitFlash = 0.15;
                    this.emitFx({ type: 'txt', x: t.x, y: LBL_Y, text: 'TANGLED!', col: me.colorLight });
                    this.emitFx({ type: 'spark', x: t.x, y: BODY_Y, col: '#f3f7ee', count: 10, sp: 180 });
                    this.emitSound('web');
                }
            }
            if (gone)
                webs.splice(i, 1);
        }
    }
    stepSpider(s, o, inp, dt) {
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
        if (s.ko)
            return;
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
                }
            }
            else {
                const times = this.tapTimes[id];
                while (times.length && this.timeElapsed - times[0] > 1)
                    times.shift();
                s.rate = times.length;
                const f = Math.min(s.falls - 1, FATIGUE_MAX);
                const sinkV = SINK * (1 + 0.5 * f);
                s.drop += s.anchorT > 0 ? 0 : sinkV * dt;
                if (inp.reel > 0)
                    this.tapBuf[id] = true;
                if (this.tapBuf[id] && this.reelCd[id] <= 0) {
                    this.tapBuf[id] = false;
                    s.drop -= s.tapLift;
                    this.reelCd[id] = REEL_CD;
                    times.push(this.timeElapsed);
                    this.emitSound('reel');
                }
                // Hang abilities (surge, anchor)
                if (inp.ab1 > 0 && s.cd1 <= 0 && abilities_1.ABILITIES[s.skill1]?.use === 'hang') {
                    this.useSkill(s, o, 0, inp);
                }
                else if (inp.ab2 > 0 && s.cd2 <= 0 && abilities_1.ABILITIES[s.skill2]?.use === 'hang') {
                    this.useSkill(s, o, 1, inp);
                }
            }
            s.face = o.x >= s.x ? 1 : -1;
            if (s.drop <= 0)
                this.recover(s);
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
        }
        else {
            this.kb[id] = 0;
        }
        // Dash / Pounce movement
        if (s.dashT > 0) {
            s.dashT -= dt;
            let dxn = cl(s.x + s.dashDir * 900 * dt, STICK.l + 6, STICK.r - 6);
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
                this.emitSound('swing');
            }
            return;
        }
        const wait = this.battleState.status === 'fight' && o.hang && !o.ko;
        if (wait) {
            inp = { left: false, right: false, strike: false, block: false, reel: 0, ab1: 0, ab2: 0 };
            s.blocking = false;
        }
        if (s.stun <= 0)
            s.grip = Math.min(100, s.grip + 2 * dt);
        if (s.atkT <= 0 && s.stun <= 0)
            s.face = o.x >= s.x ? 1 : -1;
        const free = s.stun <= 0 && s.atkT <= 0;
        // Stand abilities
        if (free) {
            if (inp.ab1 > 0 && s.cd1 <= 0 && abilities_1.ABILITIES[s.skill1]?.use === 'stand') {
                if (!(s.snare > 0 && (s.skill1 === 'dash' || s.skill1 === 'pounce'))) {
                    if (this.useSkill(s, o, 0, inp))
                        return;
                }
            }
            if (inp.ab2 > 0 && s.cd2 <= 0 && abilities_1.ABILITIES[s.skill2]?.use === 'stand') {
                if (!(s.snare > 0 && (s.skill2 === 'dash' || s.skill2 === 'pounce'))) {
                    if (this.useSkill(s, o, 1, inp))
                        return;
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
            if (s.guard <= 0)
                this.guardBreak(s);
        }
        else {
            s.blocking = false;
            s.guard = Math.min(100, s.guard + (s.stun > 0 ? 5 : 22) * dt);
            if (s.gLock && s.guard >= 35)
                s.gLock = false;
        }
        // Movement
        let v = 0;
        if (free && s.stun <= 0) {
            v = ((inp.right ? 1 : 0) - (inp.left ? 1 : 0)) * SPEED * (s.blocking ? 0.35 : 1) * (s.snare > 0 ? 0.4 : 1) * (s.hasteT > 0 ? 1.5 : 1);
        }
        if (wait && free && s.stun <= 0) {
            let wtx = s.id === 0 ? 340 : 620;
            if (Math.abs(wtx - o.x) < 260)
                wtx = o.x < 480 ? 750 : 210;
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
            const prevAtk = s.atkT;
            s.atkT += dt;
            if (prevAtk < ATK.wind && s.atkT >= ATK.wind) {
                this.doStrike(s, o);
            }
            if (s.atkT > 0.1 && s.atkT < ATK.act) {
                const lx = s.x + s.face * 110 * dt;
                if (o.hang || o.ko || Math.abs(lx - o.x) >= MINDIST - 8) {
                    s.x = cl(lx, STICK.l + 6, STICK.r - 6);
                }
            }
            if (s.atkT >= ATK.end) {
                s.atkT = 0;
                this.cool[id] = 0.1;
            }
        }
        else if (free && inp.strike && this.cool[id] <= 0 && !s.blocking) {
            s.atkT = 0.0001;
            s.atkId++;
            this.emitSound('swing');
        }
    }
    separate(dt) {
        const a = this.battleState.p1;
        const b = this.battleState.p2;
        if (a.hang || b.hang || a.ko || b.ko)
            return;
        const dx = b.x - a.x;
        const ad = Math.abs(dx);
        if (ad < MINDIST - 4) {
            const push = (MINDIST - ad) * Math.min(1, dt * 10);
            const sg = dx >= 0 ? 1 : -1;
            a.x = cl(a.x - sg * push / 2, STICK.l + 6, STICK.r - 6);
            b.x = cl(b.x + sg * push / 2, STICK.l + 6, STICK.r - 6);
        }
    }
    update(dt) {
        this.timeElapsed += dt;
        this.battleState.stateT += dt;
        if (this.battleState.status === 'ready' && this.battleState.stateT >= 1.5) {
            this.battleState.status = 'fight';
            this.battleState.stateT = 0;
        }
        const inp0 = this.playerInputs.get(this.battleState.p1.sessionId) || { left: false, right: false, strike: false, block: false, reel: 0, ab1: 0, ab2: 0 };
        const inp1 = this.playerInputs.get(this.battleState.p2.sessionId) || { left: false, right: false, strike: false, block: false, reel: 0, ab1: 0, ab2: 0 };
        if (this.battleState.status === 'fight') {
            this.stepSpider(this.battleState.p1, this.battleState.p2, inp0, dt);
            this.stepSpider(this.battleState.p2, this.battleState.p1, inp1, dt);
            this.separate(dt);
            this.stepWebs(dt);
        }
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
    endRound() {
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
        }
        else {
            this.battleState.round++;
            this.startRound();
        }
    }
}
exports.BattleRoom = BattleRoom;
