import { sound } from '../../audio';
import { DEF_LOOK, getColor, getLooks, randomLook, saveLooks } from '../../gb';

export interface CustomizeState {
  player: 'p1' | 'p2';
}

export function bindCustomizeEvents(container: HTMLElement, state: CustomizeState, render: () => void) {
  const looks = getLooks();
  const lk = looks[state.player];

  // Tab toggle P1 / P2
  container.querySelector('#tabP1')?.addEventListener('click', () => {
    state.player = 'p1';
    render();
  });
  container.querySelector('#tabP2')?.addEventListener('click', () => {
    state.player = 'p2';
    render();
  });

  // Name input
  const nmInput = container.querySelector('#nm') as HTMLInputElement;
  if (nmInput) {
    nmInput.addEventListener('input', () => {
      lk.name = nmInput.value.replace(/[<>&"]/g, '').trim().slice(0, 10) || getColor(lk.color).label;
      looks[state.player] = lk;
      saveLooks(looks);
    });
  }

  // Swatches
  container.querySelectorAll('.sw[data-col]').forEach(btn => {
    btn.addEventListener('click', () => {
      const colId = (btn as HTMLElement).dataset.col!;
      lk.color = colId;
      looks[state.player] = lk;
      saveLooks(looks);
      sound.playTone(620, 0.06, 'triangle', 0.04, 180);
      render();
    });
  });

  // Patterns
  container.querySelectorAll('.opt[data-pat]').forEach(btn => {
    btn.addEventListener('click', () => {
      const patId = (btn as HTMLElement).dataset.pat!;
      lk.pattern = patId;
      looks[state.player] = lk;
      saveLooks(looks);
      sound.playTone(620, 0.06, 'triangle', 0.04, 180);
      render();
    });
  });

  // Accessories
  container.querySelectorAll('.opt[data-acc]').forEach(btn => {
    btn.addEventListener('click', () => {
      const accId = (btn as HTMLElement).dataset.acc!;
      lk.acc = accId;
      looks[state.player] = lk;
      saveLooks(looks);
      sound.playTone(620, 0.06, 'triangle', 0.04, 180);
      render();
    });
  });

  // Randomize
  container.querySelector('#btnRandLook')?.addEventListener('click', () => {
    const rand = randomLook();
    looks[state.player] = rand;
    saveLooks(looks);
    sound.playTone(680, 0.12, 'square', 0.04, 280);
    render();
  });

  // Reset
  container.querySelector('#btnResetLook')?.addEventListener('click', () => {
    looks[state.player] = { ...DEF_LOOK[state.player] };
    saveLooks(looks);
    sound.playTone(400, 0.1, 'triangle', 0.04, -100);
    render();
  });
}

