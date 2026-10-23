import { sound } from '../../audio';
import {
  ACCS,
  STANDARD_ACCS,
  EXCLUSIVE_ACCS,
  COLORS,
  PATTERNS,
  accessorySVG,
  getBattlefieldsData,
  getLevel,
  getLooks,
  getProgress,
  isAccessoryUnlocked,
  spiderSVG
} from '../../gb';
import { getCachedPodiumChampionStatus } from '../../auth';
import { getRankFromRating, getRankProgress, renderRankBadgeSVG, RANK_RATING_LABEL } from './rankTitle';
import { renderPodiumBadge } from './leaderboardBadge';

const LOCK_ICON = `<svg class="ico lock-ico" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`;

export function renderCustomizeView(customizePlayer: 'p1' | 'p2', drawColor: string): string {
  const looks = getLooks();
  const lk = looks[customizePlayer];
  const name = lk.name.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]!));
  const patternLabel = PATTERNS.find(([id]) => id === lk.pattern)?.[1];
  const accessoryLabel = ACCS.find(([id]) => id === lk.acc)?.[1];
  const prog = getProgress();
  const stats = getBattlefieldsData(prog);
  const rankInfo = getRankFromRating(stats.rating);
  const rankProgress = getRankProgress(stats.rating);
  const playerLvl = getLevel(prog.onlineExp);
  const podium = getCachedPodiumChampionStatus();

  return `
    <div class="page customize-page">
      <header class="page-top">
        <h1>Customize</h1>
        <div class="page-actions">
          <button type="button" class="btn ghost sound-toggle-btn ${sound.enabled ? 'sound-on' : 'sound-off'}" id="btnCustomSoundToggle" title="Toggle sound">${sound.enabled ? 'Sound On' : 'Sound Off'}</button>
          <button type="button" class="btn ghost" id="btnBackToMain">Menu</button>
        </div>
      </header>
      <p class="note customize-note">Build your fighter. Every change saves automatically and carries into battle.</p>

      <div class="customize-rank-banner">
        <div class="crb-badge">
          ${renderRankBadgeSVG(rankInfo.id, 38)}
        </div>
        <div class="crb-info">
          <div class="crb-header">
            <span class="crb-title" style="color:${rankInfo.badgeCol}">${rankInfo.species} &mdash; ${rankInfo.title} &bull; ${stats.rating} ${RANK_RATING_LABEL}</span>
            <span class="crb-sub">${rankProgress.nextRank ? `${rankProgress.ratingInTier} / ${rankProgress.ratingForTier} ${RANK_RATING_LABEL} to ${rankProgress.nextRank.title}` : 'Peak Tier'}</span>
          </div>
          <div class="crb-track">
            <div class="crb-fill" style="width:${rankProgress.progressPct}%; background:${rankInfo.badgeCol};"></div>
          </div>
        </div>
      </div>

      <section class="custom" aria-label="Customize your spider">
        <div class="tabs" role="group" aria-label="Which player">
          <button type="button" id="tabP1" aria-selected="${customizePlayer === 'p1'}">Player 1</button>
          <button type="button" id="tabP2" aria-selected="${customizePlayer === 'p2'}">Player 2 <small>PvP</small></button>
        </div>

        <div class="custom-preview-column">
          <div class="preview ${lk.pattern === 'custom' ? 'pattern-editing' : ''}" id="preview" role="img" aria-label="${name}, ${patternLabel} pattern, ${accessoryLabel} accessory" ${lk.pattern === 'custom' ? 'aria-describedby="patternHelp"' : ''}>
            ${spiderSVG(lk, '-cust')}
            <div class="preview-caption" aria-hidden="true">
              <strong>${name}</strong>
              <span>${patternLabel} &middot; ${accessoryLabel}</span>
            </div>
          </div>

          <div class="field custom-name-field">
            <label class="lbl" for="nm">Fighter name</label>
            <input type="text" id="nm" value="${name}" maxlength="10" autocomplete="off" spellcheck="false">
          </div>

          <fieldset class="field custom-color-field">
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

          <!-- EXCLUSIVE LEADERBOARD PODIUM ACCESSORIES (SEPARATED) -->
          <fieldset class="field exclusive-acc-fieldset">
            <legend class="lbl exclusive-acc-legend">
              <span class="exclusive-legend-content">
                <span class="exclusive-legend-icons">
                  ${renderPodiumBadge('rank', 1, 18)}
                  ${renderPodiumBadge('level', 1, 18)}
                </span>
                <span>Leaderboard #1 Exclusives</span>
                <span class="exclusive-header-badge">#1 Global Podium</span>
              </span>
            </legend>
            <p class="note exclusive-acc-desc">
              Crown honors reserved strictly for fighters holding the <strong>#1 Rank</strong> and <strong>#1 Level</strong> positions on the global leaderboards.
            </p>
            <div class="opts visual-opts exclusive-opts" id="exclusiveAcc">
              ${EXCLUSIVE_ACCS.map(ex => {
                const status = isAccessoryUnlocked(ex.id, playerLvl, podium);
                const isSelected = lk.acc === ex.id;
                const isLocked = !status.unlocked;
                return `
                  <button type="button" class="opt exclusive-opt ${isLocked ? 'opt-locked' : 'opt-unlocked'}" data-acc="${ex.id}" data-locked="${isLocked}" aria-label="${ex.label} exclusive accessory${isLocked ? ` (${status.reqText})` : ` (${ex.boardLabel} Champion Unlocked)`}" aria-pressed="${isSelected}">
                    <span class="choice-preview accessory-preview" aria-hidden="true">${accessorySVG(ex.id)}</span>
                    <span class="opt-name">${ex.label}</span>
                    <span class="opt-status-pill ${isLocked ? 'pill-locked' : 'pill-champion'}">
                      ${isLocked
                        ? `${LOCK_ICON}<span>${ex.reqText}</span>`
                        : `${renderPodiumBadge(ex.board, 1, 13)}<span>${ex.boardLabel} Champion</span>`
                      }
                    </span>
                  </button>
                `;
              }).join('')}
            </div>
          </fieldset>

          <!-- STANDARD COMBAT ACCESSORIES (LEVEL MILESTONES) -->
          <fieldset class="field">
            <div style="display:flex; justify-content:space-between; align-items:baseline; margin-bottom:6px;">
              <legend class="lbl" style="margin:0;">Standard Accessories</legend>
              <span class="note" style="font-size:11px; color:var(--muted);">Grind online EXP &amp; levels to unlock</span>
            </div>
            <div class="opts visual-opts" id="acc">
              ${STANDARD_ACCS.map(([id, label, reqLvl]) => {
                const status = isAccessoryUnlocked(id, playerLvl, podium);
                const isSelected = lk.acc === id;
                const isLocked = !status.unlocked;
                return `
                  <button type="button" class="opt ${isLocked ? 'opt-locked' : 'opt-unlocked'}" data-acc="${id}" data-locked="${isLocked}" aria-label="${label} accessory${isLocked ? ` (${status.reqText})` : ''}" aria-pressed="${isSelected}">
                    <span class="choice-preview accessory-preview" aria-hidden="true">${accessorySVG(id)}</span>
                    <span class="opt-name">${label}</span>
                    ${reqLvl > 1 ? `<span class="opt-status-pill ${isLocked ? 'pill-locked' : 'pill-unlocked'}">${isLocked ? `${LOCK_ICON}<span>Lv.${reqLvl}</span>` : `<span>Lv.${reqLvl}</span>`}</span>` : ''}
                  </button>
                `;
              }).join('')}
            </div>
          </fieldset>
        </div>
      </section>
    </div>
  `;
}
