import './style.css';
import './menu.css';
import { renderMenuPage, type MenuStartOptions } from './ui/menuPage';
import { GamePage } from './ui/gamePage';
import { createPhaserGame } from './game/phaserConfig';
import { GagambakbakanScene } from './game/GagambakbakanScene';
import { LocalGameEngine, type InputState } from './game/localGame';
import { network } from './network';
import { sound } from './audio';
import { getKeys, getLooks, getColor, getProgress, getLevel, getUnlockedIds, recordOnlineMatch, type PlayerKeys } from './gb';

const app = document.querySelector<HTMLDivElement>('#app')!;

let currentGame: Phaser.Game | null = null;
let currentScene: GagambakbakanScene | null = null;
let localEngine: LocalGameEngine | null = null;
let gamePage: GamePage | null = null;
let animationFrameId: number | null = null;

// Input tracking
const keysDown = new Set<string>();
const touchState = { left: false, right: false, strike: false, block: false, reel: 0 };
let abQueueP1 = [0, 0]; // [s1, s2]
let abQueueP2 = [0, 0]; // [s1, s2]
let reelP2 = 0;

function setupKeyboardListeners() {
  window.addEventListener('keydown', (e) => {
    // If draft modal is active, let draft handle 1/2/3/Enter
    if (gamePage?.isDraftOpen) return;

    if (e.code === 'KeyP' || e.code === 'Escape') {
      if (gamePage && !gamePage.isDraftOpen) {
        e.preventDefault();
        gamePage.togglePause();
      }
      return;
    }

    const preventKeys = ['Space', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'];
    if (preventKeys.includes(e.code) && currentGame) {
      e.preventDefault();
    }

    keysDown.add(e.code);

    if (!e.repeat) {
      const kb: PlayerKeys = getKeys();

      // P1 Climb & Skills
      if (e.code === kb.p1.climb) touchState.reel++;
      if (e.code === kb.p1.s1) abQueueP1[0]++;
      if (e.code === kb.p1.s2) abQueueP1[1]++;

      // P2 Climb & Skills (PvP)
      if (e.code === kb.p2.climb) reelP2++;
      if (e.code === kb.p2.s1) abQueueP2[0]++;
      if (e.code === kb.p2.s2) abQueueP2[1]++;
    }
  });

  window.addEventListener('keyup', (e) => {
    keysDown.delete(e.code);
  });

  window.addEventListener('blur', () => {
    keysDown.clear();
  });
}

setupKeyboardListeners();

function getPlayerInput(isPlayer2: boolean = false): InputState {
  const kb = getKeys();

  if (isPlayer2) {
    const reel = reelP2;
    const ab1 = abQueueP2[0];
    const ab2 = abQueueP2[1];
    return {
      left: keysDown.has(kb.p2.left),
      right: keysDown.has(kb.p2.right),
      strike: keysDown.has(kb.p2.strike),
      block: keysDown.has(kb.p2.block),
      reel,
      ab1,
      ab2
    };
  }

  // Primary player (P1)
  const left = keysDown.has(kb.p1.left) || touchState.left;
  const right = keysDown.has(kb.p1.right) || touchState.right;
  const strike = keysDown.has(kb.p1.strike) || touchState.strike;
  const block = keysDown.has(kb.p1.block) || touchState.block;
  const reel = touchState.reel;
  const ab1 = abQueueP1[0];
  const ab2 = abQueueP1[1];

  return { left, right, strike, block, reel, ab1, ab2 };
}

function clearInputs() {
  touchState.reel = 0;
  reelP2 = 0;
  abQueueP1[0] = 0;
  abQueueP1[1] = 0;
  abQueueP2[0] = 0;
  abQueueP2[1] = 0;
}

function showMainMenu() {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
  if (currentGame) {
    currentGame.destroy(true);
    currentGame = null;
    currentScene = null;
  }
  if (localEngine) {
    localEngine = null;
  }
  network.leave();

  sound.music.play('ambient');

  renderMenuPage(app, (opts) => {
    startGame(opts);
  });
}

async function startGame(opts: MenuStartOptions) {
  app.innerHTML = '';

  gamePage = new GamePage(app, {
    onBackToMenu: () => showMainMenu(),
    onPauseToggle: (isPaused) => {
      if (isPaused) sound.music.stop();
      else sound.music.play('duel');
    },
    onRematch: () => {
      if (opts.mode === 'online') {
        network.sendRestart();
      } else if (localEngine) {
        localEngine.startMatch();
      }
      gamePage?.hideModal();
    },
    onAbilityTrigger: (slot) => {
      if (slot === 0) abQueueP1[0]++;
      if (slot === 1) abQueueP1[1]++;
    },
    onTouchInput: (key, active) => {
      if (key === 'reel') {
        if (active) touchState.reel++;
      } else {
        touchState[key] = active;
      }
    }
  });

  gamePage.setLabels(opts.mode, opts.diff);

  // Initialize Phaser Game Scene
  const phaserSetup = createPhaserGame(gamePage.phaserContainer);
  currentGame = phaserSetup.game;
  currentScene = phaserSetup.scene;

  if (opts.mode === 'online') {
    startOnlineGame(opts);
  } else {
    startLocalGame(opts);
  }
}

async function startOnlineGame(opts: MenuStartOptions) {
  if (!gamePage || !currentScene) return;

  currentScene.isOnline = true;
  sound.music.play('ambient');

  gamePage.showModal('Connecting...', 'Searching for an opponent on Colyseus server...', [
    { label: 'Cancel', onClick: () => showMainMenu() }
  ]);

  try {
    let room;
    const prog = getProgress();
    const myLvl = getLevel(prog.onlineExp);
    const profile = {
      name: opts.playerName || `Player_${Math.floor(Math.random() * 900 + 100)}`,
      color: opts.playerColor?.main,
      colorDark: opts.playerColor?.dark,
      colorLight: opts.playerColor?.light,
      pattern: opts.playerPattern || 'stripes',
      acc: opts.playerAcc || 'none',
      level: myLvl,
      unlockedSkills: getUnlockedIds(prog)
    };

    if (opts.onlineAction === 'create') {
      const code = opts.roomCode || 'FIGHT';
      gamePage.setRoomCode(code);
      room = await network.createPrivateRoom(profile, code, getNetworkCallbacks());
    } else if (opts.onlineAction === 'join') {
      const code = opts.roomCode || '';
      gamePage.setRoomCode(code);
      room = await network.joinByRoomCode(profile, code, getNetworkCallbacks());
    } else {
      room = await network.quickMatch(profile, getNetworkCallbacks());
    }

    if (room && (!currentScene.gameState || currentScene.gameState.status === 'waiting')) {
      gamePage.setRoomCode(opts.roomCode || room.roomId.slice(0, 5).toUpperCase());
      gamePage.showModal('Waiting for Opponent', 'Share your room code or wait for player 2...', [
        { label: 'Leave', onClick: () => showMainMenu() }
      ]);
    }

    // Network loop
    function loop() {
      const inp = getPlayerInput(false);
      network.sendInput(inp);
      clearInputs();

      animationFrameId = requestAnimationFrame(loop);
    }
    animationFrameId = requestAnimationFrame(loop);

  } catch (err: any) {
    console.error('Online match error:', err);
    gamePage.showModal('Connection Failed', err.message || 'Could not connect to Colyseus server. Is it running on port 2567?', [
      { label: 'Play vs CPU', primary: true, onClick: () => startGame({ mode: 'cpu', diff: 'normal' }) },
      { label: 'Menu', onClick: () => showMainMenu() }
    ]);
  }
}

function getNetworkCallbacks() {
  return {
    onAssigned: (data: { id: number; name: string }) => {
      if (currentScene) currentScene.myPlayerId = data.id;
      if (gamePage) gamePage.setLabels('online', 'normal', data.id);
    },
    onStateChange: (state: any) => {
      if (currentScene) currentScene.gameState = state;
      if (gamePage) {
        gamePage.updateHud(state);

        // Handle drafting phase in online mode
        if (state.status === 'draft') {
          sound.music.play('ambient');
          const myId = currentScene ? currentScene.myPlayerId : 0;
          const myDrafted = myId === 0 ? state.p1Drafted : state.p2Drafted;
          const myChoices = myId === 0 ? state.draftChoicesP1 : state.draftChoicesP2;
          const myName = myId === 0 ? state.p1.name : state.p2.name;

          if (!myDrafted && myChoices && myChoices.length >= 1 && !gamePage.isDraftOpen) {
            gamePage.showDraftModal(myChoices, state.round || 1, myName || 'Player', (skills) => {
              network.sendSelectSkills(skills);
            });
          }
        } else if (state.status === 'ready' || state.status === 'fight') {
          if (gamePage.isDraftOpen) {
            gamePage.hideDraftModal();
          }
          gamePage.hideModal();
          sound.music.play('duel');
        }
      }
    },
    onFx: (fx: any) => {
      if (currentScene) currentScene.addFx(fx);
    },
    onSnd: (snd: { name: string }) => {
      sound.play(snd.name);
    },
    onShake: (shake: { amount: number }) => {
      if (currentScene) currentScene.addShake(shake.amount);
    },
    onRoundStart: () => {
      if (gamePage) {
        if (gamePage.isDraftOpen) gamePage.hideDraftModal();
        gamePage.hideModal();
      }
      sound.play('start');
      sound.music.play('duel');
    },
    onRoundWon: () => {
      sound.music.play('ambient');
    },
    onMatchEnd: (data: { winner: number; winnerName: string; p1Wins: number; p2Wins: number }) => {
      sound.music.play('ambient');
      if (gamePage) {
        if (gamePage.isDraftOpen) gamePage.hideDraftModal();
        const myId = currentScene ? currentScene.myPlayerId : 0;
        const isMe = myId === data.winner;
        const myWins = myId === 0 ? data.p1Wins : data.p2Wins;

        // EXP and level reward specifically for online matches
        const reward = recordOnlineMatch(isMe, myWins);
        if (reward.leveledUp) {
          sound.play('power_up');
        }

        const title = isMe ? 'VICTORY!' : 'DEFEAT!';
        const sub = `${data.winnerName} won the match (${data.p1Wins} - ${data.p2Wins})!`;

        const rewardHtml = `
          <div class="online-exp-reward-box">
            <div class="exp-badge-row">
              <span class="exp-plus-tag">+${reward.expGained} EXP</span>
              <span class="exp-breakdown-text">(${isMe ? 'Victory +100, ' : ''}Match +${reward.matchExp}${reward.roundExp > 0 ? `, Rounds +${reward.roundExp}` : ''})</span>
            </div>
            <div class="exp-bar-header">
              <span class="exp-lvl-title">Level ${reward.newLevel}</span>
              <span class="exp-vals">${reward.progress.expIntoLevel} / ${reward.progress.expForLevel} EXP</span>
            </div>
            <div class="exp-progress-track">
              <div class="exp-progress-fill" style="width:${reward.progress.progressPct}%;"></div>
            </div>
            ${reward.leveledUp ? `
              <div class="level-up-alert">
                <div class="lua-title">🎉 LEVEL UP! Reached Level ${reward.newLevel}!</div>
                <div class="lua-skills">
                  🕸️ +${reward.pointsGained} Ability Point earned! Visit the Abilities Web to unlock new skills.
                </div>
              </div>
            ` : ''}
          </div>
        `;

        gamePage.showModal(title, sub, [
          { label: 'Rematch', primary: true, onClick: () => network.sendRestart() },
          { label: 'Menu', onClick: () => showMainMenu() }
        ], rewardHtml);
      }
    },
    onPlayerLeft: () => {
      if (gamePage) {
        if (gamePage.isDraftOpen) gamePage.hideDraftModal();
        gamePage.showModal('Opponent Left', 'Your opponent disconnected from the match.', [
          { label: 'Menu', primary: true, onClick: () => showMainMenu() }
        ]);
      }
    },
    onError: (err: any) => {
      console.error('Room error:', err);
    },
    onDisconnect: () => {
      if (gamePage) {
        if (gamePage.isDraftOpen) gamePage.hideDraftModal();
        gamePage.showModal('Disconnected', 'Lost connection to game server.', [
          { label: 'Menu', primary: true, onClick: () => showMainMenu() }
        ]);
      }
    }
  };
}

function startLocalGame(opts: MenuStartOptions) {
  if (!gamePage || !currentScene) return;

  const lks = getLooks();
  const c1 = getColor(lks.p1.color);
  const c2 = getColor(lks.p2.color);

  currentScene.isOnline = false;
  currentScene.myPlayerId = 0;
  localEngine = new LocalGameEngine(
    opts.mode as 'cpu' | '2p',
    opts.diff,
    {
      name: opts.playerName || lks.p1.name,
      color: opts.playerColor?.main || c1.main,
      colorDark: opts.playerColor?.dark || c1.dark,
      colorLight: opts.playerColor?.light || c1.light,
      pattern: opts.playerPattern || lks.p1.pattern,
      acc: opts.playerAcc || lks.p1.acc
    },
    {
      name: opts.mode === 'cpu' ? 'Jade' : lks.p2.name,
      color: c2.main,
      colorDark: c2.dark,
      colorLight: c2.light,
      pattern: lks.p2.pattern,
      acc: lks.p2.acc
    }
  );

  localEngine.onFx = (fx) => {
    if (currentScene) currentScene.addFx(fx);
  };
  localEngine.onShake = (shake) => {
    if (currentScene) currentScene.addShake(shake.amount);
  };
  localEngine.onMatchEnd = (data) => {
    sound.music.play('ambient');
    if (gamePage) {
      if (gamePage.isDraftOpen) gamePage.hideDraftModal();
      const sub = `${data.winnerName} won the match (${data.p1Wins} - ${data.p2Wins})! Run it back?`;
      gamePage.showModal(`${data.winnerName} Takes It!`, sub, [
        { label: 'Rematch', primary: true, onClick: () => { localEngine?.startMatch(); gamePage?.hideModal(); } },
        { label: 'Menu', onClick: () => showMainMenu() }
      ]);
    }
  };

  sound.music.play('ambient');
  localEngine.startMatch();
  gamePage.hideModal();

  let lastTime = performance.now();
  function loop(now: number) {
    const dt = Math.min(0.033, (now - lastTime) / 1000);
    lastTime = now;

    const gp = gamePage;
    if (localEngine && gp && !gp.isPaused) {
      // Check drafting phase in local mode
      if (localEngine.state.status === 'draft') {
        if (!localEngine.state.p1Drafted && !gp.isDraftOpen) {
          gp.showDraftModal(
            localEngine.state.draftChoicesP1,
            localEngine.state.round,
            localEngine.state.p1.name || 'Amber',
            (skills) => {
              localEngine?.confirmDraft(0, skills);
              if (opts.mode === 'cpu') {
                sound.music.play('duel');
              }
            }
          );
        } else if (opts.mode === '2p' && localEngine.state.p1Drafted && !localEngine.state.p2Drafted && !gp.isDraftOpen) {
          gp.showDraftModal(
            localEngine.state.draftChoicesP2,
            localEngine.state.round,
            localEngine.state.p2.name || 'Jade',
            (skills) => {
              localEngine?.confirmDraft(1, skills);
              sound.music.play('duel');
            }
          );
        }
      } else if (localEngine.state.status === 'ready' || localEngine.state.status === 'fight') {
        if (gp.isDraftOpen) {
          gp.hideDraftModal();
        }
      }

      const inp0 = getPlayerInput(false);
      const inp1 = opts.mode === '2p' ? getPlayerInput(true) : undefined;
      localEngine.update(dt, inp0, inp1);
      clearInputs();

      if (currentScene) currentScene.gameState = localEngine.state;
      if (gamePage) gamePage.updateHud(localEngine.state);
    }

    animationFrameId = requestAnimationFrame(loop);
  }
  animationFrameId = requestAnimationFrame(loop);
}

// Initial Boot
showMainMenu();
