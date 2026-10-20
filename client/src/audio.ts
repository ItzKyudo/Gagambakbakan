import { playSound, getSettings, saveSettings, music } from './gb';

class SoundEngine {
  public get enabled(): boolean {
    return getSettings().sfx;
  }

  public set enabled(val: boolean) {
    saveSettings({ ...getSettings(), sfx: val });
  }

  public playTone(freq: number, duration: number, type: OscillatorType = 'square', volume: number = 0.05, slide?: number) {
    playSound(freq, duration, type, volume, slide);
  }

  public play(name: string) {
    switch (name) {
      case 'strike':
        playSound(190, 0.14, 'sawtooth', 0.08, -110);
        break;
      case 'power_strike':
        playSound(130, 0.14, 'sawtooth', 0.08, -110);
        break;
      case 'parry':
        playSound(900, 0.16, 'square', 0.05, 320);
        break;
      case 'block':
        playSound(520, 0.08, 'triangle', 0.06);
        break;
      case 'guardbreak':
        playSound(160, 0.25, 'sawtooth', 0.07, -80);
        break;
      case 'fall':
        playSound(420, 0.4, 'sine', 0.07, -320);
        break;
      case 'recover':
        playSound(520, 0.18, 'triangle', 0.06, 260);
        break;
      case 'ko':
        playSound(130, 0.5, 'sawtooth', 0.09, -90);
        break;
      case 'web':
        playSound(700, 0.12, 'triangle', 0.04, -300);
        break;
      case 'dash':
        playSound(260, 0.12, 'sine', 0.04, 260);
        break;
      case 'pounce':
        playSound(330, 0.14, 'sawtooth', 0.04, 300);
        break;
      case 'surge':
        playSound(380, 0.25, 'triangle', 0.06, 420);
        break;
      case 'anchor':
        playSound(220, 0.25, 'triangle', 0.06, 120);
        break;
      case 'spit':
        playSound(520, 0.1, 'sawtooth', 0.04, 200);
        break;
      case 'power_up':
        playSound(300, 0.2, 'sawtooth', 0.05, 300);
        break;
      case 'shield':
        playSound(480, 0.2, 'triangle', 0.05, 200);
        break;
      case 'mend':
        playSound(600, 0.25, 'sine', 0.05, 300);
        break;
      case 'riposte':
        playSound(560, 0.14, 'square', 0.04, 200);
        break;
      case 'leech':
        playSound(260, 0.2, 'sawtooth', 0.04, 160);
        break;
      case 'carapace':
        playSound(340, 0.22, 'triangle', 0.05, 240);
        break;
      case 'hook':
        playSound(420, 0.12, 'sawtooth', 0.04, -120);
        break;
      case 'sweep':
        playSound(240, 0.14, 'sawtooth', 0.05, -100);
        break;
      case 'tremor':
        playSound(110, 0.4, 'sawtooth', 0.08, -60);
        break;
      case 'haste':
        playSound(500, 0.18, 'square', 0.03, 400);
        break;
      case 'absorb':
        playSound(700, 0.12, 'triangle', 0.05, -200);
        break;
      case 'reel':
        playSound(500 + Math.random() * 120, 0.04, 'square', 0.02);
        break;
      case 'swing':
        playSound(300, 0.09, 'sine', 0.03, 220);
        break;
      case 'start':
        playSound(440, 0.12, 'triangle', 0.05, 220);
        break;
      case 'card_select':
        playSound(620, 0.12, 'triangle', 0.06, 380);
        setTimeout(() => playSound(930, 0.1, 'sine', 0.04), 70);
        break;
      case 'card_deselect':
        playSound(440, 0.09, 'triangle', 0.05, -140);
        break;
      case 'card_confirm':
        playSound(520, 0.12, 'square', 0.04, 260);
        setTimeout(() => playSound(780, 0.18, 'triangle', 0.05, 200), 90);
        break;
      case 'deal':
        playSound(280, 0.25, 'sawtooth', 0.025, 450);
        break;
      default:
        break;
    }
  }

  public music = music;
}

export const sound = new SoundEngine();
