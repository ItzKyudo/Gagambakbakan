import { sound } from '../../audio';
import { ACCS, COLORS, PATTERNS, accessorySVG, getLooks, spiderSVG } from '../../gb';

export function renderCustomizeView(customizePlayer: 'p1' | 'p2', drawColor: string): string {
  const looks = getLooks();
  const lk = looks[customizePlayer];
  const patternLabel = PATTERNS.find(([id]) => id === lk.pattern)?.[1];
  const accessoryLabel = ACCS.find(([id]) => id === lk.acc)?.[1];

  return `
    <div class="page customize-page">
      <header class="page-top">
        <h1>Customize</h1>
        <div class="page-actions">
          <button type="button" class="btn ghost sound-toggle-btn ${sound.enabled ? 'sound-on' : 'sound-off'}" id="btnCustomSoundToggle" title="Toggle sound">${sound.enabled ? 'Sound On' : 'Sound Off'}</button>
          <button type="button" class="btn ghost" id="btnBackToMain">Menu</button>
        </div>
      </header>
      <p class="note">Build your fighter. Every change saves automatically and carries into battle.</p>

      <section class="custom" aria-label="Customize your spider">
        <div class="tabs" role="group" aria-label="Which player">
          <button type="button" id="tabP1" aria-selected="${customizePlayer === 'p1'}">Player 1</button>
          <button type="button" id="tabP2" aria-selected="${customizePlayer === 'p2'}">Player 2 <small>PvP</small></button>
        </div>

        <div class="custom-preview-column">
          <div class="preview ${lk.pattern === 'custom' ? 'pattern-editing' : ''}" id="preview" role="img" aria-label="${lk.name}, ${patternLabel} pattern, ${accessoryLabel} accessory" ${lk.pattern === 'custom' ? 'aria-describedby="patternHelp"' : ''}>
            ${spiderSVG(lk, '-cust')}
            <div class="preview-caption" aria-hidden="true">
              <strong>${lk.name}</strong>
              <span>${patternLabel} &middot; ${accessoryLabel}</span>
            </div>
          </div>

          <div class="field">
            <label class="lbl" for="nm">Fighter name</label>
            <input type="text" id="nm" value="${lk.name}" maxlength="10" autocomplete="off" spellcheck="false">
          </div>

          <fieldset class="field">
            <legend class="lbl">Shell color</legend>
            <div class="swatches" id="sw">
              ${COLORS.map(col => `
                <button type="button" class="sw" data-col="${col.id}" style="--c:${col.main}" aria-label="${col.label}" title="${col.label}" aria-pressed="${lk.color === col.id}"></button>
              `).join('')}
            </div>
          </fieldset>

          <div class="crow">
            <button type="button" class="btn ghost" id="btnRandLook">Randomize</button>
            <button type="button" class="btn ghost" id="btnResetLook">Reset</button>
          </div>
        </div>

        <div class="custom-options-column">
          <fieldset class="field">
            <legend class="lbl">Body pattern</legend>
            <div class="opts visual-opts" id="pat">
              ${PATTERNS.map(([id, label]) => `
                <button type="button" class="opt" data-pat="${id}" aria-label="${label} pattern" aria-pressed="${lk.pattern === id}">
                  <span class="choice-preview" aria-hidden="true">${spiderSVG({ ...lk, pattern: id, acc: 'none' }, `-pat-${id}`)}</span>
                  <span>${label}</span>
                </button>
              `).join('')}
            </div>
            ${lk.pattern === 'custom' ? `
              <div class="pattern-studio">
                <p id="patternHelp">Draw directly on the abdomen. Pick a new color for each stroke.</p>
                <label class="pattern-color">Stroke color <input type="color" id="patternColor" value="${drawColor}" aria-label="Drawing color"></label>
                <button type="button" class="btn ghost" id="btnPatternUndo">Undo stroke</button>
                <button type="button" class="btn ghost" id="btnPatternClear">Clear</button>
              </div>
            ` : ''}
          </fieldset>

          <fieldset class="field">
            <legend class="lbl">Accessory</legend>
            <div class="opts visual-opts" id="acc">
              ${ACCS.map(([id, label]) => `
                <button type="button" class="opt" data-acc="${id}" aria-label="${label} accessory" aria-pressed="${lk.acc === id}">
                  <span class="choice-preview accessory-preview" aria-hidden="true">${accessorySVG(id)}</span>
                  <span>${label}</span>
                </button>
              `).join('')}
            </div>
          </fieldset>
        </div>
      </section>
    </div>
  `;
}
