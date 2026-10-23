import Phaser from 'phaser';
import { GagambakbakanScene } from './GagambakbakanScene';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from './constants';
import { getEffectiveQuality } from '../gb';

export interface PhaserGameOptions {
  transparent?: boolean;
}

export function createPhaserGame(
  parentElement: HTMLElement,
  options?: PhaserGameOptions
): { game: Phaser.Game; scene: GagambakbakanScene } {
  const effQuality = getEffectiveQuality();
  const isLow = effQuality === 'low';

  const scene = new GagambakbakanScene();
  if (options?.transparent) {
    scene.transparentBg = true;
  }
  scene.quality = effQuality;

  const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    parent: parentElement,
    width: CANVAS_WIDTH,
    height: CANVAS_HEIGHT,
    transparent: options?.transparent ?? false,
    backgroundColor: options?.transparent ? undefined : '#12201f',
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: CANVAS_WIDTH,
      height: CANVAS_HEIGHT
    },
    scene: [scene],
    render: {
      antialias: !isLow,
      pixelArt: false,
      roundPixels: true,
      powerPreference: 'high-performance'
    },
    fps: {
      target: 60,
      forceSetTimeOut: false
    }
  };

  const game = new Phaser.Game(config);
  return { game, scene };
}
