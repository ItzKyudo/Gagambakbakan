import Phaser from 'phaser';
import { GagambakbakanScene } from './GagambakbakanScene';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from './constants';

export interface PhaserGameOptions {
  transparent?: boolean;
}

export function createPhaserGame(
  parentElement: HTMLElement,
  options?: PhaserGameOptions
): { game: Phaser.Game; scene: GagambakbakanScene } {
  const scene = new GagambakbakanScene();
  if (options?.transparent) {
    scene.transparentBg = true;
  }

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
      antialias: true,
      pixelArt: false,
      roundPixels: true
    },
    fps: {
      target: 60,
      forceSetTimeOut: true
    }
  };

  const game = new Phaser.Game(config);
  return { game, scene };
}
