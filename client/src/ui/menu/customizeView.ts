import { sound } from '../../audio';
import { ACCS, COLORS, PATTERNS, getLooks, spiderSVG } from '../../gb';

/* ====================================================
   2. CUSTOMIZE VIEW (Matching customize.html)
   ==================================================== */
export function renderCustomizeView(customizePlayer: 'p1' | 'p2'): string {
  const looks = getLooks();
  const lk = looks[customizePlayer];

  return `
    <div class="page" style="max-width:560px; margin-inline:auto;">
      <header class="page-top">
        <h1>Customize</h1>
        <div style="display:flex; gap:8px; align-items:center;">
          <button type="button" class="btn ghost sound-toggle-btn ${sound.enabled ? 'sound-on' : 'sound-off'}" id="btnCustomSoundToggle" title="Toggle Sound (Music & SFX)">${sound.enabled ? 'ðŸ”Š Sound On' : 'ðŸ”‡ Sound Off'}</button>
          <button type="button" class="btn ghost" id="btnBackToMain">Menu</button>
        </div>
      </header>
      <p class="note">Design your spider, then go back to the menu to see it. Changes save automatically.</p>

      <section class="custom" aria-label="Customize your spider">
        <div class="tabs" role="group" aria-label="Which player">
          <button type="button" id="tabP1" aria-selected="${customizePlayer === 'p1'}">Player 1</button>
          <button type="button" id="tabP2" aria-selected="${customizePlayer === 'p2'}">Player 2 <small>PvP</small></button>
        </div>

        <div class="preview" id="preview" role="img" aria-label="Preview of your spider">
          ${spiderSVG(lk, '-cust')}
        </div>

        <div class="field">
          <label class="lbl" for="nm">Name</label>
          <input type="text" id="nm" value="${lk.name}" maxlength="10" autocomplete="off" spellcheck="false">
        </div>

        <div class="field">
          <span class="lbl">Color</span>
          <div class="swatches" id="sw">
            ${COLORS.map(col => `
              <button type="button" class="sw" data-col="${col.id}" style="--c:${col.main}" aria-label="${col.label}" aria-pressed="${lk.color === col.id}"></button>
            `).join('')}
          </div>
        </div>

        <div class="field">
          <span class="lbl">Pattern</span>
          <div class="opts" id="pat">
            ${PATTERNS.map(([id, label]) => `
              <button type="button" class="opt" data-pat="${id}" aria-pressed="${lk.pattern === id}">${label}</button>
            `).join('')}
          </div>
        </div>

        <div class="field">
          <span class="lbl">Accessory</span>
          <div class="opts" id="acc">
            ${ACCS.map(([id, label]) => `
              <button type="button" class="opt" data-acc="${id}" aria-pressed="${lk.acc === id}">${label}</button>
            `).join('')}
          </div>
        </div>

        <div class="crow">
          <button type="button" class="btn ghost" id="btnRandLook">Randomize</button>
          <button type="button" class="btn ghost" id="btnResetLook">Reset</button>
        </div>
      </section>
    </div>
  `;
}

