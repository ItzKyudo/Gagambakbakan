import {
  createElement,
  type IconNode,
  ArrowLeft,
  Volume2,
  VolumeX,
  Gamepad2,
  Swords,
  Sparkles,
  Shield,
  Zap,
  Compass,
  ArrowUp,
  RotateCcw
} from 'lucide';
import { sound } from '../../audio';
import { ACTIONS, getKeys, keyLabel } from '../../gb';

function icon(node: IconNode, attrs: Record<string, string | number> = {}): string {
  return createElement(node, attrs).outerHTML;
}

/* ====================================================
   LEARN VIEW
   Spider Controls & Battle Mechanics
   ==================================================== */
export function renderLearnView(): string {
  const soundIconSvg = icon(sound.enabled ? Volume2 : VolumeX, {
    class: 'ico snd-ico',
    width: 15,
    height: 15,
    'stroke-width': 2.2
  });

  const kb = getKeys();

  return `
    <div class="page about-page" style="max-width:820px; margin-inline:auto;">
      <header class="page-top">
        <div class="about-title-group">
          <h1><span class="a">How to</span> <span class="j">Play</span></h1>
          <p class="note">Master the twig: spider controls, combat rules, and survival tactics.</p>
        </div>
        <div style="display:flex; gap:10px; align-items:center;">
          <button type="button" class="btn ghost sound-toggle-btn ${sound.enabled ? 'sound-on' : 'sound-off'}" id="btnLearnSoundToggle" title="Toggle Sound">
            ${soundIconSvg}
            <span>Sound: ${sound.enabled ? 'ON' : 'OFF'}</span>
          </button>
          <button type="button" class="btn ghost" id="btnBackToMain" title="Back to Menu">
            ${icon(ArrowLeft, { class: 'ico', width: 15, height: 15, 'stroke-width': 2.2 })}
            <span>Menu</span>
          </button>
        </div>
      </header>

      <!-- SECTION 1: SPIDER CONTROLS -->
      <section class="sec" aria-label="Spider Controls">
        <div class="about-sec-head">
          <div class="about-sec-icon-badge amber">
            ${icon(Gamepad2, { width: 20, height: 20, 'stroke-width': 2.2 })}
          </div>
          <div>
            <h2>Spider Controls</h2>
            <small class="about-tagline">Keyboard bindings for Player 1 &amp; Player 2</small>
          </div>
        </div>
        <p class="about-text" style="margin-bottom:12px;">
          Positioning and timing are everything. Crawl along the twig, strike with front limbs, block attacks, and tap to climb when knocked off.
        </p>

        <div class="keys" style="margin-bottom:14px;">
          <div class="kcol p1" style="background:var(--surface-2); padding:12px 14px; border-radius:8px; border:1px solid var(--line);">
            <h3><i class="swatch" style="background:var(--amber);"></i> Player 1</h3>
            ${ACTIONS.map(([k, label]) => `
              <div class="kr">
                <span style="font-size:14px;">${label}</span>
                <span class="kb" style="cursor:default; text-align:center;">${keyLabel(kb.p1[k])}</span>
              </div>
            `).join('')}
          </div>

          <div class="kcol p2" style="background:var(--surface-2); padding:12px 14px; border-radius:8px; border:1px solid var(--line);">
            <h3><i class="swatch" style="background:var(--jade);"></i> Player 2 (Local PvP)</h3>
            ${ACTIONS.map(([k, label]) => `
              <div class="kr">
                <span style="font-size:14px;">${label}</span>
                <span class="kb" style="cursor:default; text-align:center;">${keyLabel(kb.p2[k])}</span>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="about-cards-grid" style="margin-top:8px;">
          <div class="about-card">
            <div class="about-card-top">
              <span class="card-ico amber">${icon(Compass, { width: 18, height: 18, 'stroke-width': 2.2 })}</span>
              <h3>Move Left &amp; Right</h3>
            </div>
            <p>Crawl along the twig. Spiders cannot walk through each other — push your opponent toward the edges to restrict their movement.</p>
          </div>

          <div class="about-card">
            <div class="about-card-top">
              <span class="card-ico teal">${icon(Swords, { width: 18, height: 18, 'stroke-width': 2.2 })}</span>
              <h3>Strike</h3>
            </div>
            <p>Lunge with your front legs to deliver knockback. Hits land up to <strong>84px</strong> reach. Stagger an unguarding spider to knock them off the twig.</p>
          </div>

          <div class="about-card">
            <div class="about-card-top">
              <span class="card-ico blue">${icon(Shield, { width: 18, height: 18, 'stroke-width': 2.2 })}</span>
              <h3>Block &amp; Guard</h3>
            </div>
            <p>Raise your limbs to defend. Absorbs strike knockback, but depletes guard stamina. Don't let your guard break!</p>
          </div>

          <div class="about-card">
            <div class="about-card-top">
              <span class="card-ico green">${icon(ArrowUp, { width: 18, height: 18, 'stroke-width': 2.2 })}</span>
              <h3>Climb (Tap)</h3>
            </div>
            <p>When knocked off the twig, <strong>mash the Climb key</strong> rapidly! Each tap pulls your spider upward along your silk lifeline back onto the stick.</p>
          </div>

          <div class="about-card">
            <div class="about-card-top">
              <span class="card-ico amber">${icon(Zap, { width: 18, height: 18, 'stroke-width': 2.2 })}</span>
              <h3>Skills 1 &amp; 2</h3>
            </div>
            <p>Cast your equipped abilities (Dash, Surge, Web Spit, Riposte, etc.). Unlock and equip up to 2 skills in the <strong>Abilities</strong> menu.</p>
          </div>
        </div>

        <p class="note" style="margin-top:10px;">
          Want to change your layout? Remap keys anytime in the <strong>Settings</strong> page.
        </p>
      </section>

      <!-- SECTION 2: BATTLE MECHANICS -->
      <section class="sec" aria-label="Battle Mechanics">
        <div class="about-sec-head">
          <div class="about-sec-icon-badge jade">
            ${icon(Swords, { width: 20, height: 20, 'stroke-width': 2.2 })}
          </div>
          <div>
            <h2>How Mechanics Work</h2>
            <small class="about-tagline">Physics, Lifelines, Fatigue &amp; Round Rules</small>
          </div>
        </div>

        <div class="about-cards-grid" style="margin-top:6px;">
          <div class="about-card">
            <div class="about-card-top">
              <span class="card-ico teal">${icon(Compass, { width: 18, height: 18, 'stroke-width': 2.2 })}</span>
              <h3>The Twig &amp; The Pond</h3>
            </div>
            <p>Duels are fought on a single suspended stick above dark pond water. There are no ring ropes or walls: the goal is to knock your rival completely into the water below.</p>
          </div>

          <div class="about-card">
            <div class="about-card-top">
              <span class="card-ico amber">${icon(ArrowUp, { width: 18, height: 18, 'stroke-width': 2.2 })}</span>
              <h3>Lifeline &amp; Falling</h3>
            </div>
            <p>When struck cleanly off the twig, a spider anchors a silk safety line and dangles above the water. A fall is not an immediate defeat — you have a chance to recover!</p>
          </div>

          <div class="about-card">
            <div class="about-card-top">
              <span class="card-ico blue">${icon(RotateCcw, { width: 18, height: 18, 'stroke-width': 2.2 })}</span>
              <h3>Reeling &amp; Fall Fatigue</h3>
            </div>
            <p>Mash your Climb key to reel up. But beware: <strong>each fall in a round increases Fatigue</strong> (up to 4x). With higher fatigue, you fall deeper and sink faster toward the water line!</p>
          </div>

          <div class="about-card">
            <div class="about-card-top">
              <span class="card-ico amber">${icon(Shield, { width: 18, height: 18, 'stroke-width': 2.2 })}</span>
              <h3>Guard &amp; Guard Break</h3>
            </div>
            <p>Holding Block negates knockback, but sustained attacks drain your guard gauge. If guard runs out, you suffer a <strong>Guard Break</strong>: stunned for 0.9s with zero defense.</p>
          </div>

          <div class="about-card">
            <div class="about-card-top">
              <span class="card-ico green">${icon(Sparkles, { width: 18, height: 18, 'stroke-width': 2.2 })}</span>
              <h3>Recovery &amp; Invulnerability</h3>
            </div>
            <p>When you successfully reel back onto the stick, you receive a brief <strong>1.1s invulnerability window</strong>, giving you space to reposition without being instantly hit off again.</p>
          </div>

          <div class="about-card">
            <div class="about-card-top">
              <span class="card-ico teal">${icon(Zap, { width: 18, height: 18, 'stroke-width': 2.2 })}</span>
              <h3>Abilities Synergy</h3>
            </div>
            <p>Combine skills to adapt your playstyle: use <em>Dash</em> to close distance, <em>Web Spit</em> to slow down aggressive opponents, or <em>Surge</em> to recover lift when dangling!</p>
          </div>
        </div>
      </section>

      <!-- SECTION 3: DERBY TACTICS -->
      <section class="sec" aria-label="Tactics & Tips">
        <div class="about-sec-head">
          <div class="about-sec-icon-badge amber">
            ${icon(Sparkles, { width: 20, height: 20, 'stroke-width': 2.2 })}
          </div>
          <div>
            <h2>Derby Pro Tips</h2>
            <small class="about-tagline">Tactics to dominate the stick</small>
          </div>
        </div>

        <div class="about-cards-grid three-cols" style="margin-top:6px;">
          <div class="about-card sector-card aerial">
            <h3>Hold the Center</h3>
            <p>Standing in the center of the twig gives you room to absorb hits. Being cornered near the stick tips makes recovery nearly impossible.</p>
          </div>

          <div class="about-card sector-card control">
            <h3>Mash Early on Falls</h3>
            <p>Do not wait until your spider sinks near the water surface. Start mashing Climb the split second you get knocked off to stop downward momentum.</p>
          </div>

          <div class="about-card">
            <h3>Punish Whiffed Strikes</h3>
            <p>Every strike has a windup and recovery animation. If an enemy strikes from out of range, step forward and counter before they can block.</p>
          </div>
        </div>
      </section>
    </div>
  `;
}

