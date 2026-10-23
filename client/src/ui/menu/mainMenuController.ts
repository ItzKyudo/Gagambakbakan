import { sound } from '../../audio';
import { getAuthUser } from '../../auth';
import { getColor, getLevel, getLooks, getProgress, getSettings, getUnlockedIds, setMode } from '../../gb';
import { network } from '../../network';
import type { MenuStartOptions, MenuTab } from './menuTypes';
import { mountDemoFightArena } from './demoArena';
import { getPlayerRankTitle, getRankFromRating } from './rankTitle';

interface MainMenuActions {
  navigate: (tab: MenuTab) => void;
  start: (options: MenuStartOptions) => void;
}

function formatQueueTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export function bindMainMenuEvents(container: HTMLElement, actions: MainMenuActions) {
  const pMain = container.querySelector('#pMain') as HTMLElement;
  const pPlay = container.querySelector('#pPlay') as HTMLElement;
  const pQuit = container.querySelector('#pQuit') as HTMLElement;
  const playModeBtns = pPlay ? pPlay.querySelectorAll<HTMLButtonElement>('.mb:not(.quiet)') : [];

  let queueTimer: any = null;
  let queueSeconds = 0;
  let isQueueing = false;
  let isMatched = false;
  let isRankedQueue = false;

  const toggleRankCard = (showRank: boolean) => {
    const spiderCard = container.querySelector<HTMLElement>('#showcaseSpiderCard');
    const rankCard = container.querySelector<HTMLElement>('#showcaseRankCard');
    if (spiderCard) spiderCard.style.display = showRank ? 'none' : 'flex';
    if (rankCard) rankCard.style.display = showRank ? 'flex' : 'none';
  };

  const cancelQueue = (tagNote?: string) => {
    if (!isQueueing && !isMatched) return;
    isQueueing = false;
    isMatched = false;
    if (queueTimer) {
      clearInterval(queueTimer);
      queueTimer = null;
    }
    queueSeconds = 0;
    network.leave();

    const curProg = getProgress();
    const rInfo = getRankFromRating(curProg.rating);

    // Reset Online Quick Match button
    const btnOnline = container.querySelector('#btnModeOnline') as HTMLElement | null;
    const labelOnline = container.querySelector('#onlineBtnLabel') as HTMLElement | null;
    const tagOnline = container.querySelector('#onlineBtnTag') as HTMLElement | null;
    const sideOnline = container.querySelector('#onlineQueueSide') as HTMLElement | null;
    const iconOnline = btnOnline?.querySelector('.ico') as HTMLElement | null;

    if (btnOnline) {
      btnOnline.classList.remove('queueing', 'matched');
      btnOnline.title = '';
    }
    if (iconOnline) iconOnline.classList.remove('queue-spin');
    if (labelOnline) labelOnline.innerHTML = 'Multiplayer Online';
    if (tagOnline) {
      tagOnline.style.display = 'inline';
      tagOnline.textContent = !isRankedQueue && tagNote ? tagNote : 'Quick match';
    }
    if (sideOnline) sideOnline.style.display = 'none';

    // Reset Rank button
    const btnRank = container.querySelector('#btnModeRank') as HTMLElement | null;
    const labelRank = container.querySelector('#rankBtnLabel') as HTMLElement | null;
    const tagRank = container.querySelector('#rankBtnTag') as HTMLElement | null;
    const sideRank = container.querySelector('#rankQueueSide') as HTMLElement | null;
    const iconRank = btnRank?.querySelector('.ico') as HTMLElement | null;

    if (btnRank) {
      btnRank.classList.remove('queueing', 'matched');
      btnRank.title = '';
    }
    if (iconRank) iconRank.classList.remove('queue-spin');
    if (labelRank) labelRank.innerHTML = 'Rank';
    if (tagRank) {
      tagRank.style.display = 'inline';
      tagRank.textContent = isRankedQueue && tagNote ? tagNote : `Strict same-rank • ${rInfo.title}`;
    }
    if (sideRank) sideRank.style.display = 'none';

    isRankedQueue = false;
  };

  const startQueue = async (ranked: boolean = false) => {
    if (isQueueing || isMatched) return;
    isQueueing = true;
    isMatched = false;
    isRankedQueue = ranked;
    queueSeconds = 0;

    const btn = (ranked ? container.querySelector('#btnModeRank') : container.querySelector('#btnModeOnline')) as HTMLElement | null;
    const label = (ranked ? container.querySelector('#rankBtnLabel') : container.querySelector('#onlineBtnLabel')) as HTMLElement | null;
    const tag = (ranked ? container.querySelector('#rankBtnTag') : container.querySelector('#onlineBtnTag')) as HTMLElement | null;
    const side = (ranked ? container.querySelector('#rankQueueSide') : container.querySelector('#onlineQueueSide')) as HTMLElement | null;
    const timer = (ranked ? container.querySelector('#rankQueueTimer') : container.querySelector('#onlineQueueTimer')) as HTMLElement | null;
    const icon = btn?.querySelector('.ico') as HTMLElement | null;

    sound.playTone(600, 0.1, 'triangle', 0.05, 200);

    if (btn) {
      btn.classList.add('queueing');
      btn.classList.remove('matched');
      btn.title = 'Click to cancel queue';
    }
    if (icon) {
      icon.classList.add('queue-spin');
    }
    if (tag) {
      tag.style.display = 'none';
    }
    if (side) {
      side.style.display = 'flex';
    }
    if (timer) {
      timer.textContent = '00:00';
    }
    if (label) {
      const currentProg = getProgress();
      const rankTitle = getPlayerRankTitle(currentProg.rating);
      label.innerHTML = ranked
        ? `<span class="queue-main-title">Searching ${rankTitle}...</span>`
        : `<span class="queue-main-title">Queueing (${rankTitle})...</span>`;
    }

    queueTimer = setInterval(() => {
      queueSeconds++;
      const currentTimer = ranked ? container.querySelector('#rankQueueTimer') : container.querySelector('#onlineQueueTimer');
      if (currentTimer) currentTimer.textContent = formatQueueTime(queueSeconds);
    }, 1000);

    const onMatchSuccess = () => {
      if (!isQueueing || isMatched) return;
      isMatched = true;
      isQueueing = false;
      if (queueTimer) {
        clearInterval(queueTimer);
        queueTimer = null;
      }

      if (btn) {
        btn.classList.remove('queueing');
        btn.classList.add('matched');
      }
      if (icon) {
        icon.classList.remove('queue-spin');
      }
      if (label) {
        label.innerHTML = '<span class="queue-main-title">Match Found!</span>';
      }
      sound.play('power_up');

      setTimeout(() => {
        if (!isMatched) return;
        const st = getSettings();
        const lks = getLooks();
        const col = getColor(lks.p1.color);
        actions.start({
          mode: 'online',
          isRanked: ranked,
          diff: st.diff,
          playerName: lks.p1.name,
          playerColor: { main: col.main, light: col.light, dark: col.dark },
          playerPattern: lks.p1.pattern,
          playerCustomPattern: lks.p1.customPattern,
          playerAcc: lks.p1.acc
        });
      }, 650);
    };

    try {
      const looks = getLooks();
      const color = getColor(looks.p1.color);
      const prog = getProgress();
      const myLvl = getLevel(prog.onlineExp);
      const profile = {
        name: looks.p1.name || `Player_${Math.floor(Math.random() * 900 + 100)}`,
        color: color.main,
        colorDark: color.dark,
        colorLight: color.light,
        pattern: looks.p1.pattern || 'stripes',
        customPattern: looks.p1.customPattern || '',
        acc: looks.p1.acc || 'none',
        level: myLvl,
        rank: prog.rank || 'wolf-spider',
        rating: Number.isFinite(prog.rating) ? prog.rating : 0,
        isRanked: ranked,
        unlockedSkills: getUnlockedIds(prog)
      };

      const room = await network.quickMatch(profile, {
        onAssigned: (_data) => {
          // Assigned player slot
        },
        onStateChange: (state) => {
          if (!isQueueing || isMatched) return;
          const hasOpponent = (state.p1?.connected && state.p2?.connected) || state.status !== 'waiting';
          if (hasOpponent && state.status !== 'waiting') {
            onMatchSuccess();
          }
        },
        onError: (_err) => {
          if (!isQueueing) return;
          sound.playTone(220, 0.15, 'sawtooth', 0.05, -50);
          cancelQueue('Server unreachable. Click to retry.');
        },
        onDisconnect: () => {
          if (isQueueing && !isMatched) {
            cancelQueue('Disconnected. Click to retry.');
          }
        }
      });

      if (!isQueueing) {
        room.leave();
        return;
      }

      // If room already has both players ready upon joining
      if (room.state && room.state.status && room.state.status !== 'waiting') {
        onMatchSuccess();
      }
    } catch (err: any) {
      if (!isQueueing) return;
      sound.playTone(220, 0.15, 'sawtooth', 0.05, -50);
      cancelQueue('Connection failed. Click to retry.');
    }
  };

  if (!pPlay.hidden) {
    toggleRankCard(true);
    playModeBtns.forEach(b => b.classList.remove('selected'));
    const rankBtn = container.querySelector<HTMLButtonElement>('#btnModeRank');
    if (rankBtn) {
      rankBtn.classList.add('selected');
    }
  }

  container.querySelector('#btnGoPlay')?.addEventListener('click', () => {
    cancelQueue();
    if (!getAuthUser()) {
      sound.playTone(520, 0.08, 'triangle', 0.05, 200);
      actions.navigate('account');
      return;
    }
    sound.playTone(520, 0.08, 'triangle', 0.05, 200);
    actions.navigate('play');
  });

  container.querySelector('#btnGoLeaderboard')?.addEventListener('click', () => {
    cancelQueue();
    sound.playTone(520, 0.08, 'triangle', 0.05, 200);
    actions.navigate('leaderboard');
  });

  container.querySelector('#btnGoLearn')?.addEventListener('click', () => {
    cancelQueue();
    sound.playTone(520, 0.08, 'triangle', 0.05, 200);
    actions.navigate('learn');
  });

  container.querySelector('#btnGoAbout')?.addEventListener('click', () => {
    cancelQueue();
    sound.playTone(520, 0.08, 'triangle', 0.05, 200);
    actions.navigate('about');
  });

  container.querySelector('#btnGoAbilities')?.addEventListener('click', () => {
    cancelQueue();
    sound.playTone(520, 0.08, 'triangle', 0.05, 200);
    actions.navigate('abilities');
  });

  container.querySelector('#btnGoSettings')?.addEventListener('click', () => {
    cancelQueue();
    sound.playTone(520, 0.08, 'triangle', 0.05, 200);
    actions.navigate('settings');
  });

  container.querySelector('#btnGoQuit')?.addEventListener('click', () => {
    cancelQueue();
    sound.playTone(380, 0.08, 'triangle', 0.04, -120);
    pMain.hidden = true;
    pPlay.hidden = true;
    pQuit.hidden = false;
  });

  container.querySelector('#btnPlayBack')?.addEventListener('click', () => {
    cancelQueue();
    sound.playTone(440, 0.08, 'triangle', 0.04, -100);
    actions.navigate('main');
  });

  container.querySelector('#btnQuitBack')?.addEventListener('click', () => {
    cancelQueue();
    sound.playTone(440, 0.08, 'triangle', 0.04, -100);
    pMain.hidden = false;
    pQuit.hidden = true;
    toggleRankCard(false);
  });

  // Quick customize from character display
  const openCustomize = () => {
    cancelQueue();
    sound.playTone(520, 0.08, 'triangle', 0.05, 200);
    actions.navigate('customize');
  };
  container.querySelector('#showcaseStage')?.addEventListener('click', openCustomize);
  container.querySelector('#btnQuickCustomize')?.addEventListener('click', openCustomize);

  // View profile from character card
  const openProfile = () => {
    cancelQueue();
    sound.playTone(520, 0.08, 'triangle', 0.05, 200);
    actions.navigate('profile');
  };
  container.querySelector('#badgeViewProfile')?.addEventListener('click', openProfile);
  container.querySelector('#btnViewProfile')?.addEventListener('click', (e) => {
    e.stopPropagation();
    openProfile();
  });

  // Level card opens abilities
  container.querySelector('.menu-level-card')?.addEventListener('click', () => {
    cancelQueue();
    sound.playTone(520, 0.08, 'triangle', 0.05, 200);
    actions.navigate('abilities');
  });

  // Play Modes
  playModeBtns.forEach(btn => {
    btn.addEventListener('mouseenter', () => {
      playModeBtns.forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
    });
    btn.addEventListener('focus', () => {
      playModeBtns.forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
    });
  });
  container.querySelector('#btnModeCpu')?.addEventListener('click', () => {
    cancelQueue();
    if (!getAuthUser()) {
      actions.navigate('account');
      return;
    }
    const st = getSettings();
    const lks = getLooks();
    const col = getColor(lks.p1.color);
    setMode('cpu');
    sound.playTone(580, 0.12, 'square', 0.05, 260);
    actions.start({
      mode: 'cpu',
      diff: st.diff,
      playerName: lks.p1.name,
      playerColor: { main: col.main, light: col.light, dark: col.dark },
      playerPattern: lks.p1.pattern,
      playerCustomPattern: lks.p1.customPattern,
      playerAcc: lks.p1.acc
    });
  });

  container.querySelector('#btnMode2p')?.addEventListener('click', () => {
    cancelQueue();
    if (!getAuthUser()) {
      actions.navigate('account');
      return;
    }
    const st = getSettings();
    const lks = getLooks();
    const col = getColor(lks.p1.color);
    setMode('2p');
    sound.playTone(580, 0.12, 'square', 0.05, 260);
    actions.start({
      mode: '2p',
      diff: st.diff,
      playerName: lks.p1.name,
      playerColor: { main: col.main, light: col.light, dark: col.dark },
      playerPattern: lks.p1.pattern,
      playerCustomPattern: lks.p1.customPattern,
      playerAcc: lks.p1.acc
    });
  });

  // Ranked Match Button (Strict Same-Rank Pairing)
  container.querySelector('#btnModeRank')?.addEventListener('click', () => {
    if (!getAuthUser()) {
      actions.navigate('account');
      return;
    }
    if (isQueueing) {
      sound.playTone(440, 0.08, 'triangle', 0.04, -100);
      cancelQueue();
    } else if (!isMatched) {
      startQueue(true);
    }
  });

  container.querySelector('#btnCancelRankQueue')?.addEventListener('click', (e) => {
    e.stopPropagation();
    if (isQueueing) {
      sound.playTone(440, 0.08, 'triangle', 0.04, -100);
      cancelQueue();
    }
  });

  // Online Multiplayer Quick Match Button
  container.querySelector('#btnModeOnline')?.addEventListener('click', () => {
    if (!getAuthUser()) {
      actions.navigate('account');
      return;
    }
    if (isQueueing) {
      sound.playTone(440, 0.08, 'triangle', 0.04, -100);
      cancelQueue();
    } else if (!isMatched) {
      startQueue(false);
    }
  });

  container.querySelector('#btnCancelQueue')?.addEventListener('click', (e) => {
    e.stopPropagation();
    if (isQueueing) {
      sound.playTone(440, 0.08, 'triangle', 0.04, -100);
      cancelQueue();
    }
  });

  // Mount Smooth Live AI Sparring Arena on the right side if logged out
  const previewEl = container.querySelector<HTMLElement>('#menuBattlePreview');
  const cleanupArena = previewEl ? mountDemoFightArena(previewEl) : null;

  return () => {
    cancelQueue();
    cleanupArena?.();
  };
}

