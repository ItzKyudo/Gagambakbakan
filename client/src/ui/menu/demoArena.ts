import { createPhaserGame } from '../../game/phaserConfig';
import { LocalGameEngine } from '../../game/localGame';
import { getColor, getLooks } from '../../gb';

export function mountDemoFightArena(previewEl: HTMLElement): () => void {
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
    engine.update(dt, emptyInput, emptyInput);
    scene.gameState = engine.state;
    animId = requestAnimationFrame(loop);
  };
  animId = requestAnimationFrame(loop);

  return () => {
    cancelAnimationFrame(animId);
    game.destroy(true);
  };
}

