import './styles/base.css';
import './styles/ui.css';
import './styles/game.css';
import './styles/draft.css';
import './styles/pages.css';
import './styles/menu.css';
import './styles/abilities.css';
import './styles/rewards.css';
import { renderMenuPage, type MenuStartOptions } from './ui/menuPage';
import { GamePage } from './ui/gamePage';
import { createPhaserGame } from './game/phaserConfig';
import { GagambakbakanScene } from './game/GagambakbakanScene';
import { LocalGameEngine, type InputState } from './game/localGame';
import { network } from './network';
import { sound } from './audio';
import { getKeys, getLooks, getColor, getProgress, getLevel, getUnlockedIds, recordOnlineMatch, applyQualityClass, type PlayerKeys } from './gb';
import { getAuthUser, syncBattleResultToDatabase } from './auth';
import { RANK_RATING_LABEL } from './ui/menu/rankTitle';
import { saveMatchHistory } from './matchHistory';
import { getRoute, setRoute } from './router';
import type { MenuTab } from './ui/menu/menuTypes';

const app = document.querySelector<HTMLDivElement>('#app')!;

let currentGame: Phaser.Game | null = null;
let currentScene: GagambakbakanScene | null = null;
let localEngine: LocalGameEngine | null = null;
let gamePage: GamePage | null = null;
let animationFrameId: number | null = null;

// Input tracking
const keysDown = new Set<string>();
const touchState = { left: false, right: false, strike: false, heavy: false, block: false, reel: 0 };
let abQueueP1 = [0, 0]; // [s1, s2]
let abQueueP2 = [0, 0]; // [s1, s2]
let reelP2 = 0;
let onlineDraftSubmitted = false;
let hasBooted = false;
let isBlockedByDevice = false;

function isMobileOrTablet(): boolean {
  const ua = navigator.userAgent || '';
  const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|Tablet|Silk|Kindle|PlayBook/i.test(ua);
  const isIPadOS = /Macintosh/i.test(ua) && navigator.maxTouchPoints > 1;
  const isCoarseNoHover = window.matchMedia('(hover: none) and (pointer: coarse)').matches;
  const isTouchDevice = window.matchMedia('(pointer: coarse)').matches;
  const isSmallScreen = window.matchMedia('(max-width: 1024px)').matches;

  return isMobileUA || isIPadOS || isCoarseNoHover || (isTouchDevice && isSmallScreen);
}

function bootApp() {
  const currentRoute = getRoute();
  if (currentRoute === 'game' || currentRoute === 'match') {
    let saved: MenuStartOptions | null = null;
    try {
      const raw = sessionStorage.getItem('gb_active_game');
      if (raw) saved = JSON.parse(raw);
    } catch {}
    if (saved && saved.mode) {
      startGame(saved);
      return;
    }
    showMainMenu('play');
    return;
  }
  showMainMenu(currentRoute);
}

function syncDeviceAvailability() {
  const blocked = isMobileOrTablet();
  isBlockedByDevice = blocked;
  document.documentElement.classList.toggle('is-mobile-or-tablet', blocked);

  const blockerEl = document.getElementById('mobile-blocker');
  if (blockerEl) {
    blockerEl.setAttribute('aria-hidden', blocked ? 'false' : 'true');
  }
  app.setAttribute('aria-hidden', blocked ? 'true' : 'false');

  if (blocked) {
    keysDown.clear();
    sound.music.stop();
    if (gamePage && !gamePage.isPaused && localEngine) {
      gamePage.togglePause();
    }
  } else if (!hasBooted) {
    hasBooted = true;
    bootApp();
  }
}

function setupKeyboardListeners() {
  window.addEventListener('keydown', (e) => {
    // If draft modal is active, let draft handle 1/2/3/Enter
    if (isBlockedByDevice) return;
    if (gamePage?.isDraftOpen) return;

    if (e.code === 'KeyP' || e.code === 'Escape') {
      if (gamePage && !gamePage.isDraftOpen) {
        e.preventDefault();
        gamePage.togglePause();
      }
      return;
    }

    const isZoomKey = (e.ctrlKey || e.metaKey) && (
      e.key === '+' || e.key === '-' || e.key === '=' || e.key === '_' || e.key === '0' ||
      e.code === 'Equal' || e.code === 'Minus' || e.code === 'Digit0' ||
      e.code === 'NumpadAdd' || e.code === 'NumpadSubtract' || e.code === 'Numpad0' ||
      e.keyCode === 187 || e.keyCode === 189 || e.keyCode === 107 || e.keyCode === 109 || e.keyCode === 48 || e.keyCode === 96
    );
    if (isZoomKey && gamePage) {
      e.preventDefault();
      e.stopPropagation();
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

  // Global capture for wheel zoom attempts while in game
  window.addEventListener('wheel', (e: WheelEvent) => {
    if ((e.ctrlKey || e.metaKey) && gamePage) {
      e.preventDefault();
      e.stopPropagation();
    }
  }, { capture: true, passive: false });
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
      heavy: keysDown.has(kb.p2.heavy),
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
  const heavy = keysDown.has(kb.p1.heavy) || touchState.heavy;
  const block = keysDown.has(kb.p1.block) || touchState.block;
  const reel = touchState.reel;
  const ab1 = abQueueP1[0];
  const ab2 = abQueueP1[1];

  return { left, right, strike, heavy, block, reel, ab1, ab2 };
}

function clearInputs() {
  touchState.reel = 0;
  reelP2 = 0;
  abQueueP1[0] = 0;
  abQueueP1[1] = 0;
  abQueueP2[0] = 0;
  abQueueP2[1] = 0;
}

let currentMenuCleanup: (() => void) | null = null;

function showMainMenu(initialTab?: MenuTab) {
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
  gamePage?.destroy();
  gamePage = null;
  onlineDraftSubmitted = false;
  keysDown.clear();
  touchState.left = touchState.right = touchState.strike = touchState.heavy = touchState.block = false;
  clearInputs();

  currentMenuCleanup?.();
  currentMenuCleanup = null;

  sound.music.play('ambient');

  const currentRoute = getRoute();
  const tab: MenuTab = initialTab || (currentRoute !== 'game' && currentRoute !== 'match' ? currentRoute : 'main');
  setRoute(tab === 'main' ? 'main' : tab);

  currentMenuCleanup = renderMenuPage(app, (opts) => {
    currentMenuCleanup = null;
    startGame(opts);
  }, tab);
}

async function startGame(opts: MenuStartOptions) {
  if (!getAuthUser()) {
    showMainMenu('account');
    return;
  }
  currentMenuCleanup?.();
  currentMenuCleanup = null;
  setRoute('game');

  try {
    sessionStorage.setItem('gb_active_game', JSON.stringify(opts));
  } catch {}

  app.innerHTML = '';

  gamePage = new GamePage(app, {
    onBackToMenu: () => {
      try { sessionStorage.removeItem('gb_active_game'); } catch {}
      showMainMenu('play');
    },
    onSurrender: () => {
      if (opts.mode === 'online') {
        network.sendSurrender();
      }
    },
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
  const page = gamePage;
  const scene = currentScene;

  currentScene.isOnline = true;
  onlineDraftSubmitted = false;
  sound.music.play('ambient');

  // If match was already found via menu queue, start directly without modal delay
  if (network.room) {
    network.setCallbacks(getNetworkCallbacks(Boolean(opts.isRanked)));
    if (network.myPlayerId >= 0) {
      currentScene.myPlayerId = network.myPlayerId;
      gamePage.setLabels('online', 'normal', network.myPlayerId);
    }

    if (network.room.state) {
      currentScene.gameState = network.room.state;
      gamePage.updateHud(network.room.state);

      if (network.room.state.status === 'draft') {
        const myId = network.myPlayerId >= 0 ? network.myPlayerId : (currentScene ? currentScene.myPlayerId : 0);
        const myDrafted = myId === 0 ? network.room.state.p1Drafted : network.room.state.p2Drafted;
        const myChoices = myId === 0 ? network.room.state.draftChoicesP1 : network.room.state.draftChoicesP2;
        const myName = myId === 0 ? network.room.state.p1?.name : network.room.state.p2?.name;

        if (!myDrafted && !onlineDraftSubmitted && myChoices && myChoices.length >= 1 && !gamePage.isDraftOpen) {
          gamePage.showDraftModal(myChoices, network.room.state.round || 1, myName || 'Player', (skills) => {
            onlineDraftSubmitted = true;
            network.sendSelectSkills(skills);
          });
        }
      } else if (network.room.state.status === 'ready' || network.room.state.status === 'fight') {
        sound.music.play('duel');
      }
    }

    function loop() {
      const inp = getPlayerInput(false);
      network.sendInput(inp);
      clearInputs();

      animationFrameId = requestAnimationFrame(loop);
    }
    animationFrameId = requestAnimationFrame(loop);
    return;
  }

  const serverHost = network.serverUrl.replace(/^https?:\/\//, '').replace(/^wss?:\/\//, '').replace(/\/.*$/, '');
  gamePage.showModal('Connecting...', `Connecting to Gagambakbakan Battle Server (${serverHost})...\n\nNote: If the server was idle, Render free tier takes ~30-50s to wake up.`, [
    { label: 'Cancel', onClick: () => {
      try { sessionStorage.removeItem('gb_active_game'); } catch {}
      showMainMenu('play');
    } }
  ]);

  try {
    const prog = getProgress();
    const myLvl = getLevel(prog.onlineExp);
    const profile = {
      name: opts.playerName || `Player_${Math.floor(Math.random() * 900 + 100)}`,
      color: opts.playerColor?.main,
      colorDark: opts.playerColor?.dark,
      colorLight: opts.playerColor?.light,
      pattern: opts.playerPattern || 'stripes',
      customPattern: opts.playerCustomPattern || '',
      acc: opts.playerAcc || 'none',
      level: myLvl,
      rank: prog.rank || 'wolf-spider',
      rating: Number.isFinite(prog.rating) ? prog.rating : 0,
      isRanked: Boolean(opts.isRanked),
      unlockedSkills: getUnlockedIds(prog)
    };

    const room = await network.quickMatch(profile, getNetworkCallbacks(Boolean(opts.isRanked)));

    if (gamePage !== page || currentScene !== scene) {
      room.leave();
      return;
    }

    if (room && (!currentScene.gameState || currentScene.gameState.status === 'waiting')) {
      gamePage.showModal('Waiting for Opponent', 'Waiting for another player to join...', [
        { label: 'Leave', onClick: () => {
          try { sessionStorage.removeItem('gb_active_game'); } catch {}
          showMainMenu('play');
        } }
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
    if (gamePage !== page || currentScene !== scene) return;
    console.error('Online match error:', err);
    const errText = err?.message
      ? `${err.message}\n\n(Tip: Render free instances spin down when inactive. If the server is currently waking up, please wait a moment and click Try Again!)`
      : 'Could not connect to the Gagambakbakan battle server. The server may still be waking up.';
    gamePage.showModal('Connection Issue', errText, [
      { label: 'Try Again', primary: true, onClick: () => startOnlineGame(opts) },
      { label: 'Play vs CPU', onClick: () => startGame({ mode: 'cpu', diff: 'normal' }) },
      { label: 'Menu', onClick: () => {
        try { sessionStorage.removeItem('gb_active_game'); } catch {}
        showMainMenu('play');
      } }
    ]);
  }
}

function getNetworkCallbacks(isRanked: boolean) {
  let matchRecorded = false;
  let lastHandledStatus = '';
  return {
    onAssigned: (data: { id: number; name: string }) => {
      if (currentScene) currentScene.myPlayerId = data.id;
      if (gamePage) gamePage.setLabels('online', 'normal', data.id);
    },
    onDraftStart: () => {
      onlineDraftSubmitted = false;
    },
    onPlayerDrafted: (data: { id: number; skill1: string; skill2: string }) => {
      const myId = network.myPlayerId >= 0 ? network.myPlayerId : (currentScene ? currentScene.myPlayerId : 0);
      if (data.id === myId) {
        onlineDraftSubmitted = true;
      }
    },
    onStateChange: (state: any) => {
      if (currentScene) currentScene.gameState = state;
      if (gamePage) {
        gamePage.updateHud(state);

        const statusChanged = lastHandledStatus !== state.status;
        lastHandledStatus = state.status;

        // Handle drafting phase in online mode
        if (state.status === 'draft') {
          if (statusChanged) {
            sound.music.play('ambient');
            gamePage.hideModal();
          }
          const myId = network.myPlayerId >= 0 ? network.myPlayerId : (currentScene ? currentScene.myPlayerId : 0);
          const myDrafted = myId === 0 ? state.p1Drafted : state.p2Drafted;
          const myChoices = myId === 0 ? state.draftChoicesP1 : state.draftChoicesP2;
          const myName = myId === 0 ? state.p1.name : state.p2.name;

          if (!myDrafted && !onlineDraftSubmitted && myChoices && myChoices.length >= 1 && !gamePage.isDraftOpen) {
            gamePage.showDraftModal(myChoices, state.round || 1, myName || 'Player', (skills) => {
              onlineDraftSubmitted = true;
              network.sendSelectSkills(skills);
            });
          }
        } else if (state.status === 'ready' || state.status === 'fight') {
          onlineDraftSubmitted = false;
          if (statusChanged) {
            if (gamePage.isDraftOpen) {
              gamePage.hideDraftModal();
            }
            // Dismiss pre-match lobby modal (Connecting... or Waiting for Opponent) when match starts
            gamePage.hideModal();
            sound.music.play('duel');
          }
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
      onlineDraftSubmitted = false;
      if (gamePage) {
        if (gamePage.isDraftOpen) gamePage.hideDraftModal();
        gamePage.hideModal();
      }
      sound.play('start');
      sound.music.play('duel');
    },
    onRoundWon: () => {
      // Gameplay music continues until match end
    },
    onMatchEnd: (data: { winner: number; winnerName: string; p1Wins: number; p2Wins: number; forfeit?: boolean; isTimeOut?: boolean }) => {
      if (matchRecorded) return;
      matchRecorded = true;
      sound.music.play('ambient');
      onlineDraftSubmitted = false;
      if (gamePage) {
        if (gamePage.isDraftOpen) gamePage.hideDraftModal();
        gamePage.closeInGameMenu();
        const myId = network.myPlayerId >= 0 ? network.myPlayerId : (currentScene ? currentScene.myPlayerId : 0);
        const isMe = myId === data.winner;
        const myWins = myId === 0 ? data.p1Wins : data.p2Wins;
        void saveMatchHistory([{
          player_slot: 'p1', mode: isRanked ? 'ranked' : 'online', won: isMe,
          opponent: (myId === 0 ? currentScene?.gameState?.p2.name : currentScene?.gameState?.p1.name) || 'Opponent',
          rounds_won: myWins, rounds_lost: myId === 0 ? data.p2Wins : data.p1Wins
        }]);

        // EXP and level reward specifically for online matches
        const reward = recordOnlineMatch(isMe, myWins);
        // Sync battlefield results, rating, rank, and EXP to database
        syncBattleResultToDatabase(reward, getLooks());

        if (reward.leveledUp) {
          sound.play('power_up');
        }

        const title = isMe ? (data.forfeit ? 'VICTORY BY FORFEIT!' : 'VICTORY!') : (data.forfeit ? 'DEFEAT BY SURRENDER' : 'DEFEAT!');
        const sub = data.forfeit
          ? (isMe ? 'Your opponent surrendered the match. Full victory awarded!' : 'You surrendered the match.')
          : `${data.winnerName} won the match (${data.p1Wins} - ${data.p2Wins})!`;

        const rewardHtml = `
          <div class="online-exp-reward-box">
            <div class="rank-result-row" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; padding:8px 12px; background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.1); border-radius:8px;">
              <div>
                <span style="font-weight:700; color:${reward.ratingChange >= 0 ? '#4cc7b2' : '#e4584f'}; font-size:14px;">
                  ${reward.ratingChange >= 0 ? '▲ +' : '▼ '}${reward.ratingChange} ${RANK_RATING_LABEL}
                </span>
                <span style="font-size:12px; color:var(--fg); opacity:0.8; margin-left:6px;">(${reward.newRating} ${RANK_RATING_LABEL})</span>
              </div>
              <div style="font-weight:700; font-size:12px; color:var(--amber); text-transform:uppercase; letter-spacing:0.04em;">
                ${reward.rankTitle}
              </div>
            </div>
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
            <div style="margin-top:12px; padding:6px 10px; background:rgba(0,0,0,0.2); border-radius:6px; font-size:12px; color:var(--muted); text-align:center;">
              Battlefields Record: <strong style="color:var(--jade);">${reward.totalWins}W</strong> - <strong style="color:var(--coral);">${reward.totalLosses}L</strong> (${reward.winRate}% Win Rate)
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
          { label: 'Menu', onClick: () => {
            try { sessionStorage.removeItem('gb_active_game'); } catch {}
            showMainMenu('play');
          } }
        ], rewardHtml);
      }
    },
    onRematchVote: (data: { count: number; ready: boolean }) => {
      if (gamePage && !data.ready) {
        const rematchBtn = gamePage.rootElement.querySelector('.overlay-modal .btn.primary') as HTMLButtonElement | null;
        if (rematchBtn) {
          rematchBtn.textContent = `Rematch (${data.count}/2 voted)`;
          rematchBtn.disabled = true;
        }
      }
    },
    onPlayerLeft: () => {
      if (gamePage && !matchRecorded && currentScene?.gameState?.status !== 'matchEnd') {
        if (gamePage.isDraftOpen) gamePage.hideDraftModal();
        gamePage.closeInGameMenu();
        gamePage.showModal('Opponent Left', 'Your opponent disconnected from the match.', [
          { label: 'Menu', primary: true, onClick: () => {
            try { sessionStorage.removeItem('gb_active_game'); } catch {}
            showMainMenu('play');
          } }
        ]);
      }
    },
    onError: (err: any) => {
      console.error('Room error:', err);
    },
    onDisconnect: () => {
      if (gamePage && !matchRecorded && currentScene?.gameState?.status !== 'matchEnd') {
        if (gamePage.isDraftOpen) gamePage.hideDraftModal();
        gamePage.closeInGameMenu();
        gamePage.showModal('Disconnected', 'Lost connection to game server.', [
          { label: 'Menu', primary: true, onClick: () => {
            try { sessionStorage.removeItem('gb_active_game'); } catch {}
            showMainMenu('play');
          } }
        ]);
      }
    }
  };
}

function startLocalGame(opts: MenuStartOptions) {
  if (!gamePage || !currentScene) return;

  const lks = getLooks();
  const c1 = getColor(opts.playerColor?.main || lks.p1.color);
  const c2 = getColor(lks.p2.color);

  // In CPU mode, if Player 1 is using Jade or Toxic green, ensure CPU chooses a contrasting color (Amber)
  const cpuColor = opts.mode === 'cpu'
    ? ((c1.id === 'jade' || c1.id === 'toxic') ? getColor('amber') : getColor('jade'))
    : c2;
  const cpuName = opts.mode === 'cpu'
    ? ((c1.id === 'jade' || c1.id === 'toxic') ? 'Amber' : 'Jade')
    : lks.p2.name;

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
      customPattern: opts.playerCustomPattern || lks.p1.customPattern,
      acc: opts.playerAcc || lks.p1.acc
    },
    {
      name: cpuName,
      color: cpuColor.main,
      colorDark: cpuColor.dark,
      colorLight: cpuColor.light,
      pattern: opts.mode === 'cpu' ? 'stripes' : lks.p2.pattern,
      customPattern: opts.mode === 'cpu' ? '' : lks.p2.customPattern,
      acc: opts.mode === 'cpu' ? 'none' : lks.p2.acc
    }
  );

  localEngine.onFx = (fx) => {
    if (currentScene) currentScene.addFx(fx);
  };
  localEngine.onShake = (shake) => {
    if (currentScene) currentScene.addShake(shake.amount);
  };
  localEngine.onMatchEnd = (data) => {
    void saveMatchHistory([
      { player_slot: 'p1', mode: opts.mode === 'cpu' ? 'cpu' : '2p', opponent: cpuName,
        won: data.winner === 0, rounds_won: data.p1Wins, rounds_lost: data.p2Wins },
      ...(opts.mode === '2p' ? [{ player_slot: 'p2' as const, mode: '2p' as const,
        opponent: opts.playerName || lks.p1.name, won: data.winner === 1,
        rounds_won: data.p2Wins, rounds_lost: data.p1Wins }] : [])
    ]);
    sound.music.play('ambient');
    if (gamePage) {
      if (gamePage.isDraftOpen) gamePage.hideDraftModal();
      const sub = `${data.winnerName} won the match (${data.p1Wins} - ${data.p2Wins})! Run it back?`;
      gamePage.showModal(`${data.winnerName} Takes It!`, sub, [
        { label: 'Rematch', primary: true, onClick: () => { localEngine?.startMatch(); gamePage?.hideModal(); } },
        { label: 'Menu', onClick: () => {
          try { sessionStorage.removeItem('gb_active_game'); } catch {}
          showMainMenu('play');
        } }
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

// Global URL routing listener
window.addEventListener('hashchange', () => {
  const r = getRoute();
  if (r === 'game' || r === 'match') {
    if (!currentGame && !localEngine && !gamePage) {
      let saved: MenuStartOptions | null = null;
      try {
        const raw = sessionStorage.getItem('gb_active_game');
        if (raw) saved = JSON.parse(raw);
      } catch {}
      if (saved && saved.mode) {
        startGame(saved);
      } else {
        showMainMenu('play');
      }
    }
  } else if (currentGame || localEngine || gamePage) {
    try { sessionStorage.removeItem('gb_active_game'); } catch {}
    showMainMenu(r);
  }
});

// Initial Boot
applyQualityClass();
window.addEventListener('resize', syncDeviceAvailability);
window.addEventListener('orientationchange', syncDeviceAvailability);
syncDeviceAvailability();
