import {
  createElement,
  type IconNode,
  ArrowLeft,
  Volume2,
  VolumeX,
  BookOpen,
} from 'lucide';
import { sound } from '../../audio';

function icon(node: IconNode, attrs: Record<string, string | number> = {}): string {
  return createElement(node, attrs).outerHTML;
}

/* ====================================================
   ABOUT VIEW
   Lore, Rules, Mechanics & Credits
   ==================================================== */
export function renderAboutView(): string {
  const soundIconSvg = icon(sound.enabled ? Volume2 : VolumeX, {
    class: 'ico snd-ico',
    width: 15,
    height: 15,
    'stroke-width': 2.2
  });

  return `
    <div class="page about-page" style="max-width:820px; margin-inline:auto;">
      <header class="page-top">
        <div class="about-title-group">
          <h1><span class="a">About</span> <span class="j">Gagambakbakan</span></h1>
          <p class="note">Two spiders. One twig. The Filipino street derby reborn.</p>
        </div>
        <div style="display:flex; gap:10px; align-items:center;">
          <button type="button" class="btn ghost sound-toggle-btn ${sound.enabled ? 'sound-on' : 'sound-off'}" id="btnAboutSoundToggle" title="Toggle Sound">
            ${soundIconSvg}
            <span>Sound: ${sound.enabled ? 'ON' : 'OFF'}</span>
          </button>
          <button type="button" class="btn ghost" id="btnBackToMain" title="Back to Menu">
            ${icon(ArrowLeft, { class: 'ico', width: 15, height: 15, 'stroke-width': 2.2 })}
            <span>Menu</span>
          </button>
        </div>
      </header>

      <!-- SECTION 1: THE FOLKLORE & NOSTALGIA -->
      <section class="sec about-hero-sec">
        <div class="about-sec-head">
          <div class="about-sec-icon-badge amber">
            ${icon(BookOpen, { width: 20, height: 20, 'stroke-width': 2.2 })}
          </div>
          <div>
            <h2>The Folklore &amp; Nostalgia</h2>
            <small class="about-tagline">Ang Klasikong Larong Batang Pinoy: Laban ng Gagamba</small>
          </div>
        </div>
        <p class="about-text">
          <strong>Gagambakbakan</strong> is a digital tribute to the nostalgic Filipino childhood pastime of spider fighting (<em>derby ng gagamba</em>). Across barangays, schoolyards, and rural provinces, kids would hunt orb-weavers in mango trees and gumamela bushes, keep them in matchboxes (<em>posporo</em>) divided with cardboard, and face off on a thin coconut broomstick strand (<em>tingting</em>) or wooden twig suspended above a basin of water.
        </p>
        <p class="about-text">
          The duel was about wits, balance, and quick reflexes: spiders wrestled and tangled silk, and the duel ended cleanly when one spider was knocked off the twig into the water or retreated. <strong>Gagambakbakan</strong> preserves that spirit in a high-octane competitive physics brawler!
        </p>
      </section>
    </div>
  `;
}
