import {
  createElement,
  type IconNode,
  ArrowLeft,
  Volume2,
  VolumeX,
  ArrowLeftRight,
  Swords,
  Shield,
  ArrowUp,
  Zap
} from 'lucide';
import { sound } from '../../audio';
import { getKeys, getLooks, keyLabel } from '../../gb';
import { createPhaserGame } from '../../game/phaserConfig';
import { LocalGameEngine } from '../../game/localGame';
import { ATK, BODY_Y, DIFF_SETTINGS, FALL_DEPTH, FALL_SPEED, REEL_CD, SINK, SPEED, TAP } from '../../game/constants';
import { learnDemoFrame } from '../../game/spiderMotion';

function icon(node: IconNode, attrs: Record<string, string | number> = {}): string {
  return createElement(node, attrs).outerHTML;
}

function keycap(key: string, label: string, phase = ''): string {
  return `<span class="learn-key"${phase ? ` data-learn-key="${phase}"` : ''}><kbd>${keyLabel(key)}</kbd><small>${label}</small></span>`;
}

export function renderLearnView(): string {
  const soundIconSvg = icon(sound.enabled ? Volume2 : VolumeX, {
    class: 'ico snd-ico', width: 15, height: 15, 'stroke-width': 2.2
  });
  const kb = getKeys();

  return `
    <div class="page learn-page">
      <header class="page-top">
        <div class="about-title-group">
          <h1><span class="a">Watch.</span> <span class="j">Fight.</span></h1>
          <p class="note">The real battle engine demonstrates every move.</p>
        </div>
        <div class="page-actions">
          <button type="button" class="btn ghost sound-toggle-btn ${sound.enabled ? 'sound-on' : 'sound-off'}" id="btnLearnSoundToggle" title="Toggle Sound">
            ${soundIconSvg}<span>Sound: ${sound.enabled ? 'ON' : 'OFF'}</span>
          </button>
          <button type="button" class="btn ghost" id="btnBackToMain" title="Back to Menu">
            ${icon(ArrowLeft, { class: 'ico', width: 15, height: 15, 'stroke-width': 2.2 })}<span>Menu</span>
          </button>
        </div>
      </header>

      <section class="learn-live" aria-label="Live battle tutorial">
        <div class="learn-live-head" aria-live="polite">
          <span class="learn-live-icon">
            <span data-learn-icon="move">${icon(ArrowLeftRight, { width: 22, height: 22 })}</span>
            <span data-learn-icon="strike" hidden>${icon(Swords, { width: 22, height: 22 })}</span>
            <span data-learn-icon="block" hidden>${icon(Shield, { width: 22, height: 22 })}</span>
            <span data-learn-icon="climb" hidden>${icon(ArrowUp, { width: 22, height: 22 })}</span>
          </span>
          <div><h2 id="learnLiveTitle">Move</h2><p id="learnLiveHint">Close the gap and control the center.</p></div>
          <span class="learn-engine-badge">Live engine</span>
        </div>
        <div class="arena learn-arena"><div id="learnBattlePreview"></div></div>
        <div class="learn-action-track" aria-label="Tutorial sequence">
          <span data-learn-step="move" class="active">${icon(ArrowLeftRight, { width: 17, height: 17 })}<b>Move</b></span>
          <span data-learn-step="strike">${icon(Swords, { width: 17, height: 17 })}<b>Strike</b></span>
          <span data-learn-step="block">${icon(Shield, { width: 17, height: 17 })}<b>Block</b></span>
          <span data-learn-step="climb">${icon(ArrowUp, { width: 17, height: 17 })}<b>Climb</b></span>
        </div>
        <div class="learn-p1-keys" aria-label="Player 1 controls">
          ${keycap(kb.p1.left, 'Left', 'move')}${keycap(kb.p1.right, 'Right', 'move')}
          ${keycap(kb.p1.strike, 'Strike', 'strike')}${keycap(kb.p1.block, 'Hold', 'block')}
          ${keycap(kb.p1.climb, 'Tap', 'climb')}
        </div>
      </section>

      <section class="learn-finale" aria-label="Skills">
        <span class="learn-finale-icon">${icon(Zap, { width: 24, height: 24 })}</span>
        <div><h2>Skills turn the fight</h2><p>Dash, control, defend, or recover with your equipped skills.</p></div>
        <div class="learn-skill-keys">${keycap(kb.p1.s1, 'Skill 1')}${keycap(kb.p1.s2, 'Skill 2')}</div>
      </section>

      <details class="learn-controls">
        <summary>Player 2 keys</summary>
        <div class="learn-key-row">
          ${keycap(kb.p2.left, 'Left')}${keycap(kb.p2.right, 'Right')}${keycap(kb.p2.strike, 'Strike')}
          ${keycap(kb.p2.block, 'Block')}${keycap(kb.p2.climb, 'Climb')}${keycap(kb.p2.s1, 'Skill 1')}${keycap(kb.p2.s2, 'Skill 2')}
        </div>
      </details>
    </div>
  `;
}

export function bindLearnDemo(container: HTMLElement): () => void {
  const parent = container.querySelector<HTMLElement>('#learnBattlePreview');
  if (!parent) return () => {};

  const looks = getLooks();
  const engine = new LocalGameEngine('2p', 'normal', looks.p1, looks.p2);
  const state = engine.state;
  state.status = 'fight';
  const { game, scene } = createPhaserGame(parent);
  scene.gameState = state;

  const title = container.querySelector<HTMLElement>('#learnLiveTitle');
  const hint = container.querySelector<HTMLElement>('#learnLiveHint');
  const steps = container.querySelectorAll<HTMLElement>('[data-learn-step]');
  const keys = container.querySelectorAll<HTMLElement>('[data-learn-key]');
  const icons = container.querySelectorAll<HTMLElement>('[data-learn-icon]');
  const copy = {
    move: ['Move', 'Close the gap and control the center.'],
    strike: ['Strike', 'Wind up, lunge, and knock your rival back.'],
    block: ['Block', 'Raise your front legs before the hit lands.'],
    climb: ['Climb', 'Tap quickly before your silk reaches the pond.']
  } as const;
  let lastPhase = '';
  let phaseFxPlayed = false;
  let animationFrame = 0;
  const started = performance.now();

  function reset() {
    Object.assign(state.p1, { x: 440, face: 1, move: 0, walkPhase: 0, grip: 100, guard: 100, hang: false, falling: false, drop: 0, hb: 0, stun: 0, blocking: false, blockT: 0, inv: 0, hitFlash: 0, ko: false, atkT: 0, atkType: 1 });
    Object.assign(state.p2, { x: 760, face: -1, move: 0, walkPhase: 0, grip: 100, guard: 100, hang: false, falling: false, drop: 0, hb: 0, stun: 0, blocking: false, blockT: 0, inv: 0, hitFlash: 0, ko: false, atkT: 0, atkType: 1 });
  }

  function renderFrame(now: number) {
    const frame = learnDemoFrame((now - started) / 1000);
    if (frame.phase !== lastPhase) {
      reset();
      lastPhase = frame.phase;
      phaseFxPlayed = false;
      state.p1.atkType = frame.cycle % 3;
      title!.textContent = copy[frame.phase][0];
      hint!.textContent = copy[frame.phase][1];
      steps.forEach(step => step.classList.toggle('active', step.dataset.learnStep === frame.phase));
      keys.forEach(key => key.classList.toggle('active', key.dataset.learnKey === frame.phase));
      icons.forEach(icon => { icon.hidden = icon.dataset.learnIcon !== frame.phase; });
    }

    const t = frame.time;
    if (frame.phase === 'move') {
      const travel = Math.min(t, 1.42) * SPEED;
      state.p1.x = 440 + travel;
      state.p1.move = t < 1.42 ? 1 : 0;
      state.p1.walkPhase = travel * .055;
    } else if (frame.phase === 'strike') {
      const attackT = Math.max(0, Math.min(ATK.end, t - .28));
      const hitT = Math.max(0, attackT - ATK.wind);
      state.p1.x = 520 + 110 * Math.min(.16, Math.max(0, attackT - .1));
      state.p1.atkT = attackT;
      state.p2.x = 592 + 430 / 7 * (1 - Math.exp(-7 * hitT));
      state.p2.hitFlash = hitT > 0 && hitT < .2 ? .2 - hitT : 0;
      state.p2.stun = Math.max(0, .28 - hitT);
      if (hitT > 0 && !phaseFxPlayed) {
        phaseFxPlayed = true;
        const x = (state.p1.x + state.p2.x) / 2;
        scene.addFx({ type: 'spark', x, y: BODY_Y - 6, col: '#ffffff', count: 10, sp: 260 });
        scene.addFx({ type: 'spark', x, y: BODY_Y - 6, col: state.p1.color, count: 8, sp: 220 });
        scene.addShake(7);
      }
    } else if (frame.phase === 'block') {
      const attackT = Math.max(0, Math.min(ATK.end, t - .28));
      const hitT = Math.max(0, attackT - ATK.wind);
      state.p1.x = 520 + 110 * Math.min(.16, Math.max(0, attackT - .1));
      state.p1.atkT = attackT;
      state.p2.x = 592 + 150 / 7 * (1 - Math.exp(-7 * hitT));
      state.p2.blocking = t >= .4 && t < .9;
      state.p2.blockT = Math.max(0, t - .4);
      state.p2.guard = Math.max(0, 100 - Math.max(0, t - .4) * 9 - (hitT > 0 ? 22 : 0));
      if (hitT > 0 && !phaseFxPlayed) {
        phaseFxPlayed = true;
        scene.addFx({ type: 'spark', x: (state.p1.x + state.p2.x) / 2, y: BODY_Y - 6, col: state.p2.colorLight, count: 8, sp: 180 });
        scene.addShake(3);
      }
    } else {
      const fallTime = (FALL_DEPTH - 12) / FALL_SPEED;
      state.p1.x = 340;
      state.p2.x = 760;
      state.p1.hang = true;
      state.p1.hb = 1 - Math.exp(-9 * t);
      if (t < fallTime) {
        state.p1.falling = true;
        state.p1.drop = 12 + FALL_SPEED * t;
      } else {
        state.p1.falling = false;
        const climbTime = Math.max(0, t - fallTime - .25);
        const tapInterval = Math.max(REEL_CD, 1 / DIFF_SETTINGS.normal.reel);
        state.p1.drop = FALL_DEPTH + SINK * (t - fallTime) - TAP * Math.floor(climbTime / tapInterval);
        if (state.p1.drop <= 0) {
          const recoveredFor = -state.p1.drop / (TAP / tapInterval - SINK);
          state.p1.hang = false;
          state.p1.drop = 0;
          state.p1.hb = Math.exp(-9 * recoveredFor);
          state.p1.inv = Math.max(0, 1.1 - recoveredFor);
        }
      }
    }

    animationFrame = requestAnimationFrame(renderFrame);
  }

  reset();
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
    state.p1.x = 520;
    state.p2.x = 592;
    state.p2.blocking = true;
    title!.textContent = copy.block[0];
    hint!.textContent = copy.block[1];
    steps.forEach(step => step.classList.toggle('active', step.dataset.learnStep === 'block'));
    keys.forEach(key => key.classList.toggle('active', key.dataset.learnKey === 'block'));
    icons.forEach(icon => { icon.hidden = icon.dataset.learnIcon !== 'block'; });
  } else {
    animationFrame = requestAnimationFrame(renderFrame);
  }

  return () => {
    cancelAnimationFrame(animationFrame);
    game.destroy(true);
  };
}
