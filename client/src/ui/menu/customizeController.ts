import { sound } from '../../audio';
import { DEF_LOOK, customPatternSVG, getColor, getLevel, getLooks, getProgress, randomLook, saveLooks } from '../../gb';
import { fetchPodiumChampionStatus, getCachedPodiumChampionStatus } from '../../auth';
import { decodePatternArt, encodePatternArt, type PatternStroke } from '../../patternArt';

export interface CustomizeState {
  player: 'p1' | 'p2';
  drawColor: string;
}

let podiumFetchDone = false;
let lastPodiumState = { isTop1Rank: false, isTop1Level: false };

export function resetPodiumFetchFlag(): void {
  podiumFetchDone = false;
}

export function bindCustomizeEvents(container: HTMLElement, state: CustomizeState, render: () => void) {
  const looks = getLooks();

  if (!podiumFetchDone) {
    podiumFetchDone = true;
    void fetchPodiumChampionStatus().then(podium => {
      const changed = podium.isTop1Rank !== lastPodiumState.isTop1Rank || podium.isTop1Level !== lastPodiumState.isTop1Level;
      lastPodiumState = { ...podium };
      if (changed && container.isConnected) {
        render();
      }
    });
  }
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
      const capStrong = container.querySelector('.preview-caption strong');
      if (capStrong) capStrong.textContent = lk.name;
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

  const colorInput = container.querySelector('#patternColor') as HTMLInputElement | null;
  colorInput?.addEventListener('input', () => { state.drawColor = colorInput.value; });

  container.querySelector('#btnPatternUndo')?.addEventListener('click', () => {
    const strokes = decodePatternArt(lk.customPattern);
    strokes.pop();
    lk.customPattern = encodePatternArt(strokes);
    saveLooks(looks);
    render();
  });
  container.querySelector('#btnPatternClear')?.addEventListener('click', () => {
    lk.customPattern = '';
    saveLooks(looks);
    render();
  });

  if (lk.pattern === 'custom') {
    const preview = container.querySelector('#preview') as HTMLElement | null;
    const svg = preview?.querySelector('.spider-art') as SVGSVGElement | null;
    let current: PatternStroke | null = null;
    const pointFromEvent = (event: PointerEvent): [number, number] | null => {
      if (!svg) return null;
      const rect = svg.getBoundingClientRect();
      const scale = Math.min(rect.width / 240, rect.height / 180);
      const x = ((event.clientX - rect.left - (rect.width - 240 * scale) / 2) / scale - 41) / 95;
      const y = ((event.clientY - rect.top - (rect.height - 180 * scale) / 2) / scale - 54) / 75;
      return ((x - .5) / .5) ** 2 + ((y - .5) / .5) ** 2 <= 1 ? [x, y] : null;
    };
    const paint = () => {
      const group = svg?.querySelector('.custom-pattern');
      if (group) group.innerHTML = customPatternSVG(encodePatternArt([...decodePatternArt(lk.customPattern), ...(current ? [current] : [])]));
    };
    preview?.addEventListener('pointerdown', event => {
      const point = pointFromEvent(event);
      if (!point) return;
      current = { color: state.drawColor, points: [point] };
      preview.setPointerCapture(event.pointerId);
      paint();
    });
    preview?.addEventListener('pointermove', event => {
      if (!current || current.points.length >= 40) return;
      const point = pointFromEvent(event);
      const last = current.points[current.points.length - 1];
      if (point && Math.hypot(point[0] - last[0], point[1] - last[1]) > .018) {
        current.points.push(point);
        paint();
      }
    });
    const finish = () => {
      if (!current) return;
      lk.customPattern = encodePatternArt([...decodePatternArt(lk.customPattern), current]);
      current = null;
      saveLooks(looks);
      paint();
    };
    preview?.addEventListener('pointerup', finish);
    preview?.addEventListener('pointercancel', finish);
  }

  // Accessories (Standard & Exclusive Leaderboard)
  container.querySelectorAll('.opt[data-acc]').forEach(btn => {
    btn.addEventListener('click', () => {
      const isLocked = (btn as HTMLElement).dataset.locked === 'true';
      if (isLocked) {
        sound.playTone(180, 0.12, 'sawtooth', 0.04, -80);
        btn.classList.add('shake-reject');
        setTimeout(() => btn.classList.remove('shake-reject'), 400);
        return;
      }
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
    const prog = getProgress();
    const myLvl = getLevel(prog.onlineExp);
    const podium = getCachedPodiumChampionStatus();
    const rand = randomLook(myLvl, podium);
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

