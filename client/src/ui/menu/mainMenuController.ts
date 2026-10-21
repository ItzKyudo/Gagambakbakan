import { sound } from '../../audio';
import { getColor, getLevel, getLooks, getProgress, getSettings, getUnlockedIds, setMode } from '../../gb';
import { network } from '../../network';
import type { MenuStartOptions, MenuTab } from './menuTypes';

interface MainMenuActions {
  navigate: (tab: Exclude<MenuTab, 'main'>) => void;
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

  let queueTimer: any = null;
  let queueSeconds = 0;
  let isQueueing = false;
  let isMatched = false;

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

    const btn = container.querySelector('#btnModeOnline') as HTMLElement | null;
    const label = container.querySelector('#onlineBtnLabel') as HTMLElement | null;
    const tag = container.querySelector('#onlineBtnTag') as HTMLElement | null;
    const side = container.querySelector('#onlineQueueSide') as HTMLElement | null;
    const icon = btn?.querySelector('.ico') as HTMLElement | null;

    if (btn) {
      btn.classList.remove('queueing', 'matched');
      btn.title = '';
    }
    if (icon) {
      icon.classList.remove('queue-spin');
    }
    if (label) {
      label.innerHTML = 'Multiplayer Online';
    }
    if (tag) {
      tag.style.display = 'inline';
      tag.textContent = tagNote || 'Quick match';
    }
    if (side) {
      side.style.display = 'none';
    }
  };

  const startQueue = async () => {
    if (isQueueing || isMatched) return;
    isQueueing = true;
    isMatched = false;
    queueSeconds = 0;

    const btn = container.querySelector('#btnModeOnline') as HTMLElement | null;
    const label = container.querySelector('#onlineBtnLabel') as HTMLElement | null;
    const tag = container.querySelector('#onlineBtnTag') as HTMLElement | null;
    const side = container.querySelector('#onlineQueueSide') as HTMLElement | null;
    const timer = container.querySelector('#onlineQueueTimer') as HTMLElement | null;
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
      label.innerHTML = '<span class="queue-main-title">Queueing...</span>';
    }

    queueTimer = setInterval(() => {
      queueSeconds++;
      const currentTimer = container.querySelector('#onlineQueueTimer');
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
          diff: st.diff,
          playerName: lks.p1.name,
          playerColor: { main: col.main, light: col.light, dark: col.dark },
          playerPattern: lks.p1.pattern,
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
        acc: looks.p1.acc || 'none',
        level: myLvl,
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

  container.querySelector('#btnGoPlay')?.addEventListener('click', () => {
    cancelQueue();
    sound.playTone(520, 0.08, 'triangle', 0.05, 200);
    pMain.hidden = true;
    pPlay.hidden = false;
    pQuit.hidden = true;
  });

  container.querySelector('#btnGoCustomize')?.addEventListener('click', () => {
    cancelQueue();
    sound.playTone(520, 0.08, 'triangle', 0.05, 200);
    actions.navigate('customize');
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
    pMain.hidden = false;
    pPlay.hidden = true;
  });

  container.querySelector('#btnQuitBack')?.addEventListener('click', () => {
    cancelQueue();
    sound.playTone(440, 0.08, 'triangle', 0.04, -100);
    pMain.hidden = false;
    pQuit.hidden = true;
  });

  // Quick customize from character display
  const openCustomize = () => {
    cancelQueue();
    sound.playTone(520, 0.08, 'triangle', 0.05, 200);
    actions.navigate('customize');
  };
  container.querySelector('#showcaseStage')?.addEventListener('click', openCustomize);
  container.querySelector('#btnQuickCustomize')?.addEventListener('click', openCustomize);
  container.querySelector('#badgeQuickCustomize')?.addEventListener('click', openCustomize);

  // Level card opens abilities
  container.querySelector('.menu-level-card')?.addEventListener('click', () => {
    cancelQueue();
    sound.playTone(520, 0.08, 'triangle', 0.05, 200);
    actions.navigate('abilities');
  });

  // Play Modes
  container.querySelector('#btnModeCpu')?.addEventListener('click', () => {
    cancelQueue();
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
      playerAcc: lks.p1.acc
    });
  });

  container.querySelector('#btnMode2p')?.addEventListener('click', () => {
    cancelQueue();
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
      playerAcc: lks.p1.acc
    });
  });

  // Online Multiplayer Button
  container.querySelector('#btnModeOnline')?.addEventListener('click', () => {
    if (isQueueing) {
      // Clicking button while queueing cancels the queue
      sound.playTone(440, 0.08, 'triangle', 0.04, -100);
      cancelQueue();
    } else if (!isMatched) {
      startQueue();
    }
  });

  container.querySelector('#btnCancelQueue')?.addEventListener('click', (e) => {
    e.stopPropagation();
    if (isQueueing) {
      sound.playTone(440, 0.08, 'triangle', 0.04, -100);
      cancelQueue();
    }
  });
}

