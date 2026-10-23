import { createPhaserGame } from '../../game/phaserConfig';
import { LocalGameEngine } from '../../game/localGame';
import { getColor, getLooks, getEffectiveQuality } from '../../gb';

export function mountDemoFightArena(previewEl: HTMLElement): () => void {
  const effQuality = getEffectiveQuality();
  // On low quality devices, skip the live AI battle in background menus to keep low-end PCs 100% cool and responsive
  if (effQuality === 'low') {
    previewEl.innerHTML = `
      <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; min-height:220px; color:var(--muted); font-family:var(--label); font-weight:700; letter-spacing:0.06em; text-transform:uppercase; text-align:center; padding:20px; opacity:0.8;">
        <span style="color:var(--jade-light); font-size:18px; margin-bottom:4px;">Gagambakbakan Arena</span>
        <span style="font-size:12px; color:var(--muted);">Performance Mode Active</span>
      </div>
    `;
    return () => {};
  }

  const looks = getLooks();
  const c1 = getColor(looks.p1.color);
  const c2 = (c1.id === 'jade' || c1.id === 'toxic') ? getColor('amber') : getColor('jade');

  const engine = new LocalGameEngine(
    'demo',
    'normal',
    {
      name: 'Chex',
      color: c1.main,
      colorDark: c1.dark,
      colorLight: c1.light,
      pattern: looks.p1.pattern || 'stripes',
      customPattern: looks.p1.customPattern || '',
      acc: looks.p1.acc || 'none'
    },
    {
      name: 'klyde',
      color: c2.main,
      colorDark: c2.dark,
      colorLight: c2.light,
      pattern: 'spots',
      customPattern: '',
      acc: 'none'
    }
  );

  engine.startMatch();
  const { game, scene } = createPhaserGame(previewEl, { transparent: true });
  scene.gameState = engine.state;

  engine.onFx = (fx) => scene.addFx(fx);
  engine.onShake = (shake) => scene.addShake(shake.amount);

  let lastTime = performance.now();
  let animId = 0;
  const emptyInput = { left: false, right: false, strike: false, heavy: false, block: false, reel: 0, ab1: 0, ab2: 0 };

  const loop = (now: number) => {
    const dt = Math.min(0.033, (now - lastTime) / 1000);
    lastTime = now;
    if (!document.hidden) {
      engine.update(dt, emptyInput, emptyInput);
      scene.gameState = engine.state;
    }
    animId = requestAnimationFrame(loop);
  };
  animId = requestAnimationFrame(loop);

  return () => {
    cancelAnimationFrame(animId);
    game.destroy(true);
  };
}

