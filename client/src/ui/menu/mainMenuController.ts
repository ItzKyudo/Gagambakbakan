import { sound } from '../../audio';
import { getColor, getLooks, getSettings, setMode } from '../../gb';
import type { MenuStartOptions, MenuTab } from './menuTypes';

interface MainMenuActions {
  navigate: (tab: Exclude<MenuTab, 'main'>) => void;
  openOnline: () => void;
  start: (options: MenuStartOptions) => void;
}

export function bindMainMenuEvents(container: HTMLElement, actions: MainMenuActions) {
  const pMain = container.querySelector('#pMain') as HTMLElement;
  const pPlay = container.querySelector('#pPlay') as HTMLElement;
  const pQuit = container.querySelector('#pQuit') as HTMLElement;

  container.querySelector('#btnGoPlay')?.addEventListener('click', () => {
    sound.playTone(520, 0.08, 'triangle', 0.05, 200);
    pMain.hidden = true;
    pPlay.hidden = false;
    pQuit.hidden = true;
  });

  container.querySelector('#btnGoCustomize')?.addEventListener('click', () => {
    sound.playTone(520, 0.08, 'triangle', 0.05, 200);
    actions.navigate('customize');
  });

  container.querySelector('#btnGoAbilities')?.addEventListener('click', () => {
    sound.playTone(520, 0.08, 'triangle', 0.05, 200);
    actions.navigate('abilities');
  });

  container.querySelector('#btnGoSettings')?.addEventListener('click', () => {
    sound.playTone(520, 0.08, 'triangle', 0.05, 200);
    actions.navigate('settings');
  });

  container.querySelector('#btnGoQuit')?.addEventListener('click', () => {
    sound.playTone(380, 0.08, 'triangle', 0.04, -120);
    pMain.hidden = true;
    pPlay.hidden = true;
    pQuit.hidden = false;
  });

  container.querySelector('#btnPlayBack')?.addEventListener('click', () => {
    sound.playTone(440, 0.08, 'triangle', 0.04, -100);
    pMain.hidden = false;
    pPlay.hidden = true;
  });

  container.querySelector('#btnQuitBack')?.addEventListener('click', () => {
    sound.playTone(440, 0.08, 'triangle', 0.04, -100);
    pMain.hidden = false;
    pQuit.hidden = true;
  });

  // Quick customize from character display
  const openCustomize = () => {
    sound.playTone(520, 0.08, 'triangle', 0.05, 200);
    actions.navigate('customize');
  };
  container.querySelector('#showcaseStage')?.addEventListener('click', openCustomize);
  container.querySelector('#btnQuickCustomize')?.addEventListener('click', openCustomize);
  container.querySelector('#badgeQuickCustomize')?.addEventListener('click', openCustomize);

  // Level card opens abilities
  container.querySelector('.menu-level-card')?.addEventListener('click', () => {
    sound.playTone(520, 0.08, 'triangle', 0.05, 200);
    actions.navigate('abilities');
  });

  // Play Modes
  container.querySelector('#btnModeCpu')?.addEventListener('click', () => {
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

  container.querySelector('#btnModeOnline')?.addEventListener('click', () => {
    sound.playTone(600, 0.1, 'triangle', 0.05, 200);
    actions.openOnline();
  });
}

