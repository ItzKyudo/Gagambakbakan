import { sound } from '../../audio';
import { defaultKeys, getProgress, getSettings, saveKeys, saveProgress, saveSettings } from '../../gb';
import type { ListeningKey } from './settingsView';

export interface SettingsState {
  listeningKey: ListeningKey | null;
}

export function bindSettingsEvents(container: HTMLElement, state: SettingsState, render: () => void) {
  const st = getSettings();

  // SFX checkbox & volume
  const chkSfx = container.querySelector('#chkSfx') as HTMLInputElement;
  const rngSfx = container.querySelector('#rngSfx') as HTMLInputElement;
  const sfxP = container.querySelector('#sfxP') as HTMLElement;

  chkSfx?.addEventListener('change', () => {
    st.sfx = chkSfx.checked;
    if (st.sfx) st.sound = true;
    else if (!st.music) st.sound = false;
    saveSettings(st);
    if (st.sfx && st.sound) {
      sound.playTone(600, 0.08, 'triangle', 0.04, 150);
    }
    render();
  });

  rngSfx?.addEventListener('input', () => {
    st.sfxVol = parseInt(rngSfx.value, 10) / 100;
    if (sfxP) sfxP.textContent = `${rngSfx.value}%`;
    if (st.sfxVol > 0 && (!st.sound || !st.sfx)) {
      st.sound = true;
      st.sfx = true;
    }
    saveSettings(st);
  });

  // Music checkbox & volume
  const chkMus = container.querySelector('#chkMus') as HTMLInputElement;
  const rngMus = container.querySelector('#rngMus') as HTMLInputElement;
  const musP = container.querySelector('#musP') as HTMLElement;

  chkMus?.addEventListener('change', () => {
    st.music = chkMus.checked;
    if (st.music) st.sound = true;
    else if (!st.sfx) st.sound = false;
    saveSettings(st);
    if (st.music && st.sound) {
      sound.music.play('ambient');
    } else {
      sound.music.stop();
    }
    render();
  });

  rngMus?.addEventListener('input', () => {
    st.musicVol = parseInt(rngMus.value, 10) / 100;
    if (musP) musP.textContent = `${rngMus.value}%`;
    if (st.musicVol > 0 && (!st.sound || !st.music)) {
      st.sound = true;
      st.music = true;
    }
    saveSettings(st);
    sound.music.setVolume(st.musicVol);
    if (st.music && st.sound && st.musicVol > 0) {
      sound.music.play('ambient');
    }
  });

  // CPU difficulty radio
  container.querySelectorAll('input[name="diff"]').forEach(radio => {
    radio.addEventListener('change', () => {
      const val = (radio as HTMLInputElement).value as 'easy' | 'normal' | 'hard';
      st.diff = val;
      saveSettings(st);
      sound.playTone(520, 0.08, 'triangle', 0.04, 160);
    });
  });

  // Key bind buttons
  container.querySelectorAll('.kb[data-p][data-a]').forEach(btn => {
    btn.addEventListener('click', () => {
      const p = (btn as HTMLElement).dataset.p as 'p1' | 'p2';
      const a = (btn as HTMLElement).dataset.a as string;
      state.listeningKey = { player: p, action: a };
      sound.playTone(700, 0.06, 'sine', 0.03);
      render();
    });
  });

  // Reset keys
  container.querySelector('#btnResetKeys')?.addEventListener('click', () => {
    saveKeys(defaultKeys());
    sound.playTone(400, 0.1, 'triangle', 0.04, -100);
    render();
  });

  // Progress unlock all & reset
  const chkUnlockAll = container.querySelector('#chkUnlockAll') as HTMLInputElement;
  chkUnlockAll?.addEventListener('change', () => {
    const p = getProgress();
    p.unlockAll = chkUnlockAll.checked;
    saveProgress(p);
    sound.playTone(640, 0.1, 'square', 0.04, 200);
  });

  container.querySelector('#btnResetProg')?.addEventListener('click', () => {
    if (confirm('Reset your match stats, online EXP, and unlock progress?')) {
      saveProgress({ played: 0, wins: 0, unlockAll: false, onlineExp: 0, onlinePlayed: 0, onlineWins: 0, unlockedSkills: ['dash', 'web', 'surge'] });
      sound.playTone(320, 0.15, 'sawtooth', 0.05, -120);
      render();
    }
  });
}

