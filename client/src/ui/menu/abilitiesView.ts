import {
  createElement,
  type IconNode,
  ArrowLeft,
  Zap,
  RotateCcw,
  Plus,
  Minus,
  Maximize,
  Crosshair,
  Compass,
  ChevronLeft,
  X,
  Check,
  Lock,
  Clock,
  Anchor,
  Shield,
  Lightbulb,
  Info
} from 'lucide';
import { SKILL_CATALOG, nodeForAbility, type SkillSpecies } from '../../../../server/src/skillCatalog';
import { getAbilityPoints, getExpProgress, getProgress, getUnlockedIds, getLooks, SPIDERS } from '../../gb';
import { ABILITIES, SKILLS_LIST, WEB_EDGES, getSpiderAbility, isNodeAvailableToUnlock, type AbilityId } from '../../game/abilities';
import { spiderAbilityIcon, spiderIconHue } from '../../game/spiderIcons';
import { spiderMove } from '../../game/spiderMoves';
import { getPlayerRankTitle } from './rankTitle';

function icon(node: IconNode, attrs: Record<string, string | number> = {}): string {
  return createElement(node, attrs).outerHTML;
}

/* ====================================================
   3. ABILITIES SPIDER WEB VIEW
   ==================================================== */
export function renderDetailCardHtml(nodeId: AbilityId, species = getLooks().p1.species): string {
  const prog = getProgress();
  const spider = SPIDERS.find(s => s.id === species) || SPIDERS[0];
  const pts = getAbilityPoints(prog, species);
  const unlockedIds = getUnlockedIds(prog, species);
  const sel = getSpiderAbility(species, ABILITIES[nodeId] ? nodeId : 'dash');
  const node = SKILL_CATALOG[species as SkillSpecies].nodes[nodeForAbility(sel.id)!];
  const effect = spiderMove(species, sel.id).effect;
  const tactic = effect.zone
    ? 'Hold a lane and make opponents cross the threat area before they can reach you.'
    : effect.dash || effect.vault
      ? 'Change distance to break their timing, then use the opening to re-enter with a strike.'
      : effect.shot
        ? 'Punish an approach from range; fire as your opponent commits to a lane.'
        : effect.barrier || effect.reduction || effect.reflect || effect.shield || effect.heal
          ? 'Activate before a trade so the opponent spends their attack into your defense.'
          : 'Wait for your opponent to enter range, then punish their recovery or dropped guard.';
  const selUnlocked = unlockedIds.includes(sel.id);
  const selAvailable = (spider.pool as readonly string[]).includes(sel.id) && isNodeAvailableToUnlock(sel.id, unlockedIds);

  let actionHtml = '';
  if (selUnlocked) {
    actionHtml = `
      <div class="ac-acquired-banner">
        ${icon(Check, { class: 'ico mini', width: 16, height: 16, 'stroke-width': 2.5 })}
        <span>SKILL ACQUIRED</span>
      </div>
    `;
  } else if (selAvailable) {
    if (pts.available >= node.cost) {
      actionHtml = `
        <button type="button" class="btn-acquire-action" id="btnAcquireSkill" data-id="${sel.id}">
          ${icon(Zap, { class: 'ico', width: 16, height: 16, fill: 'currentColor' })}
          <span>ACQUIRE FOR ${node.cost} POINT${node.cost === 1 ? '' : 'S'}</span>
        </button>
      `;
    } else {
      actionHtml = `
        <div class="ac-locked-banner warning">
          <span>PATH REACHED &bull; 0 POINTS AVAILABLE</span>
          <small>Play online matches with ${spider.name} to earn ${node.cost - pts.available} more point${node.cost - pts.available === 1 ? '' : 's'}.</small>
        </div>
      `;
    }
  } else {
    actionHtml = `
      <div class="ac-locked-banner">
        ${icon(Lock, { class: 'ico mini', width: 16, height: 16, 'stroke-width': 2 })}
        <span>LOCKED</span>
        <small>Requires ${node.requires.map(id => SKILL_CATALOG[species as SkillSpecies].nodes[id].name).join(', ')}.</small>
      </div>
    `;
  }

  return `
    <div class="ac-card-top-row">
      <span class="ac-sector-tag" style="color:${sel.sectorColor}; border-color:${sel.sectorColor}66; background:${sel.sectorColor}1a;">${sel.sectorName}</span>
      <button type="button" class="ac-close-btn" id="btnCloseDetailCard" title="Minimize details panel" aria-label="Close details">
        ${icon(X, { class: 'ico close-ico', width: 14, height: 14, 'stroke-width': 2.5 })}
      </button>
    </div>

    <div class="ac-card-head">
      <div class="ac-gem-preview">
        <img src="${spiderAbilityIcon(species, sel.id)}" alt="" class="ac-gem-img" style="--spider-icon-hue:${spiderIconHue(species)}" />
      </div>
      <div>
        <h2 class="ac-name">${sel.name}</h2>
        <div class="ac-chips">
          <span class="ac-chip cd">
            ${icon(Clock, { class: 'ico chip-ico', width: 13, height: 13, 'stroke-width': 2 })}
            <span>${sel.cd}s Cooldown</span>
          </span>
          <span class="ac-chip stance ${sel.use}">
            ${sel.use === 'hang' ? `
              ${icon(Anchor, { class: 'ico chip-ico', width: 13, height: 13, 'stroke-width': 2 })}
              <span>Dangling only</span>
            ` : `
              ${icon(Shield, { class: 'ico chip-ico', width: 13, height: 13, 'stroke-width': 2 })}
              <span>Clinging</span>
            `}
          </span>
        </div>
      </div>
    </div>

    <p class="ac-desc">${sel.desc}</p>

    <div class="ac-tip-box">
      <span class="ac-tip-label">
        ${icon(Lightbulb, { class: 'ico tactic-ico', width: 14, height: 14, 'stroke-width': 2 })}
        <span>COMBAT TACTIC</span>
      </span>
      ${tactic}
    </div>

    <div class="ac-action-area">
      ${actionHtml}
    </div>
  `;
}

export function renderAbilitiesView(
  selectedNodeId: AbilityId,
  isPanelCollapsed: boolean,
  panX: number,
  panY: number,
  zoomScale: number,
  isRespecConfirmOpen = false,
  species = getLooks().p1.species
): string {
  const prog = getProgress();
  const spider = SPIDERS.find(s => s.id === species) || SPIDERS[0];
  const expInfo = getExpProgress(prog.spiderProgress?.[spider.id]?.exp || 0);
  const pts = getAbilityPoints(prog, species);
  const unlockedIds = getUnlockedIds(prog, species);
  const rankTitle = getPlayerRankTitle(expInfo.level);

  // Edges SVG
  const edgesSVG = WEB_EDGES.map(([aId, bId]) => {
    if (!(spider.pool as readonly string[]).includes(aId) || !(spider.pool as readonly string[]).includes(bId)) return '';
    const a = ABILITIES[aId];
    const b = ABILITIES[bId];
    if (!a || !b) return '';
    const aUnlocked = unlockedIds.includes(aId);
    const bUnlocked = unlockedIds.includes(bId);

    let edgeClass = 'silk-edge edge-locked';
    if (aUnlocked && bUnlocked) {
      edgeClass = 'silk-edge edge-active';
    } else if (
      (aUnlocked && isNodeAvailableToUnlock(bId, unlockedIds))
    ) {
      edgeClass = 'silk-edge edge-available';
    }

    return `<line class="${edgeClass}" x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" />`;
  }).join('');

  // Nodes SVG
  const nodesSVG = SKILLS_LIST.filter(s => (spider.pool as readonly string[]).includes(s.id)).map(base => getSpiderAbility(species, base.id)).map(s => {
    const isUnlockedNode = unlockedIds.includes(s.id);
    const isAvail = isNodeAvailableToUnlock(s.id, unlockedIds);
    const node = SKILL_CATALOG[species as SkillSpecies].nodes[nodeForAbility(s.id)!];
    const isSelected = selectedNodeId === s.id;
    const isCenter = s.id === 'dash';

    let fillCol = '#0d1817';
    let strokeCol = 'rgba(52, 80, 75, 0.6)';

    if (isUnlockedNode) {
      fillCol = '#112322';
      strokeCol = s.sectorColor;
    } else if (isAvail) {
      fillCol = '#231d14';
      strokeCol = '#f2a33a';
    }

    return `
      <g class="web-node ${isSelected ? 'selected' : ''}" data-id="${s.id}" transform="translate(${s.x}, ${s.y})" cursor="pointer" tabindex="0" role="button" aria-label="${s.name}">
        <title>${s.name}</title>
        <!-- Completely stable, non-moving hit area -->
        <circle class="node-hit-area" cx="0" cy="0" r="34" fill="transparent" />

        <!-- Inner visual group with pointer-events: none that scales smoothly in place -->
        <g class="node-visual">
          <!-- Selection Halo -->
          <circle class="node-select-halo" cx="0" cy="0" r="32" fill="none" stroke="#f2a33a" stroke-width="2.2" stroke-dasharray="6 4" />

          <!-- Available Beacon Pulse -->
          ${!isUnlockedNode && isAvail ? `
            <circle class="node-avail-pulse" cx="0" cy="0" r="26" fill="none" stroke="#f2a33a" stroke-width="2" />
          ` : ''}

          <!-- Base Shape -->
          ${isCenter ? `
            <polygon class="node-gem-shape" points="0,-27 23.4,-13.5 23.4,13.5 0,27 -23.4,13.5 -23.4,-13.5" fill="#142624" stroke="#ffd694" stroke-width="3" />
          ` : `
            <polygon class="node-gem-shape" points="0,-26 22.5,-13 22.5,13 0,26 -22.5,13 -22.5,-13" fill="${fillCol}" stroke="${strokeCol}" stroke-width="${isUnlockedNode ? '2.8' : (isAvail ? '2.4' : '1.5')}" />
          `}

          <!-- Extracted Ability Card Art -->
          <image href="${spiderAbilityIcon(species, s.id)}" x="-22" y="-24" width="44" height="48" preserveAspectRatio="xMidYMid meet" style="opacity:${isUnlockedNode ? 1 : (isAvail ? 0.95 : 0.4)}; filter:hue-rotate(${spiderIconHue(species)}) ${isUnlockedNode ? `drop-shadow(0 0 6px ${strokeCol})` : (isAvail ? 'contrast(1.08) brightness(0.95)' : 'grayscale(1) brightness(0.4)')};" />

          <!-- Corner Badges -->
          ${!isUnlockedNode && !isAvail ? `
            <g transform="translate(10, 10)">
              <circle cx="0" cy="0" r="7.5" fill="#160e0d" stroke="#e8593f" stroke-width="1.2" />
              <use href="#ic-lock" x="-4.5" y="-4.5" width="9" height="9" fill="#ff9d8a" />
            </g>
          ` : ''}
          ${!isUnlockedNode && isAvail ? `
            <g transform="translate(11, -11)">
              <circle cx="0" cy="0" r="7.5" fill="#2a1e0b" stroke="#f2a33a" stroke-width="1.2" />
              <text x="0" y="3.5" text-anchor="middle" font-size="9.5" font-weight="900" fill="#ffd694">${node.cost}</text>
            </g>
          ` : ''}
          ${isUnlockedNode && !isCenter ? `
            <g transform="translate(11, -11)">
              <circle cx="0" cy="0" r="7" fill="#0d2420" stroke="#4cc7b2" stroke-width="1.2" />
              <path d="M-3 0 L-0.8 2.2 L3 -2" stroke="#4cc7b2" stroke-width="1.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
            </g>
          ` : ''}
        </g>

        <!-- Name Tag -->
        <text class="node-label ${isUnlockedNode ? 'unlocked' : (isAvail ? 'available' : 'locked')}" x="0" y="42" text-anchor="middle" dominant-baseline="central">${s.name.split(' ')[0].toUpperCase()}</text>
      </g>
    `;
  }).join('');

  return `
    <div class="spider-web-view">
      <!-- TOP HEADER: NAV & POINTS HUD -->
      <header class="swv-header">
        <button type="button" class="swv-back-btn" id="btnBackToMain">
          ${icon(ArrowLeft, { class: 'ico', width: 16, height: 16, 'stroke-width': 2.2 })}
          <span>Menu</span>
        </button>

        <div class="swv-title-block">
          <h1 class="swv-title"><span class="a">SPIDER WEB</span> <span class="j">OF ABILITIES</span></h1>
          <div class="swv-sectors-pill" aria-label="Skill tiers">
            <span class="sec-pill aerial">Starter Core · Free</span>
            <span class="sec-pill control">Inner Hex · 1 point</span>
            <span class="sec-pill assault">Outer Hex · 2 points</span>
            <span class="sec-pill vitality">Apex · 3 points</span>
          </div>
        </div>

        <div class="swv-right-hud">
          <div class="sbb-exp-group">
            <span class="sbb-lvl">LVL ${expInfo.level} &bull; ${rankTitle}</span>
            <div class="sbb-track" title="${expInfo.expIntoLevel} / ${expInfo.expForLevel} EXP towards Level ${expInfo.level + 1}">
              <div class="sbb-fill" style="transform:scaleX(${expInfo.progressPct / 100});"></div>
            </div>
            <span class="sbb-exp-val">${expInfo.expIntoLevel} / ${expInfo.expForLevel} EXP</span>
          </div>
        </div>
      </header>

      <nav class="swv-species-tabs" aria-label="Spider ability progress">
        ${SPIDERS.map(s => `<button type="button" data-ability-spider="${s.id}" aria-current="${s.id === spider.id ? 'true' : 'false'}">${s.name}</button>`).join('')}
      </nav>

      <!-- STAGE: SVG CANVAS & FLOATING DETAIL CARD -->
      <div class="swv-stage" id="swvStage">
        <!-- Top Left HUD: Ability Points & Reset Points (Icon and Numbers only) -->
        <div class="swv-top-hud">
          <div class="swv-points-badge ${pts.available > 0 ? 'has-points' : ''}" title="${pts.available} Ability Points ready to allocate">
            <span class="sp-icon">
              ${icon(Zap, { class: 'ico pts-ico', width: 17, height: 17, fill: 'currentColor' })}
            </span>
            <span class="sp-val">${pts.available}</span>
          </div>
          <button type="button" class="btn-respec ${pts.spent === 0 ? 'dim' : ''}" id="btnRespecWeb" title="${pts.spent > 0 ? `Reset Points & refund ${pts.spent} spent point${pts.spent === 1 ? '' : 's'}` : 'Reset Points (No points spent)'}" aria-label="Reset Points">
            ${icon(RotateCcw, { class: 'ico respec-ico', width: 16, height: 16, 'stroke-width': 2.2 })}
          </button>
        </div>

        <!-- Canvas Navigation Controls (Bottom Left) -->
        <div class="swv-nav-hud">
          <div class="swv-zoom-group">
            <button type="button" class="swv-hud-btn" id="btnZoomIn" title="Zoom In (+)">
              ${icon(Plus, { class: 'ico hud-ico', width: 14, height: 14, 'stroke-width': 2.5 })}
            </button>
            <button type="button" class="swv-hud-btn" id="btnZoomOut" title="Zoom Out (−)">
              ${icon(Minus, { class: 'ico hud-ico', width: 14, height: 14, 'stroke-width': 2.5 })}
            </button>
            <button type="button" class="swv-hud-btn" id="btnZoomFit" title="Fit Entire Web (0 / F)">
              ${icon(Maximize, { class: 'ico hud-ico', width: 13, height: 13, 'stroke-width': 2 })}
              <span>Fit</span>
            </button>
            <button type="button" class="swv-hud-btn" id="btnZoomCenter" title="Center Selected Node (C)">
              ${icon(Crosshair, { class: 'ico hud-ico', width: 13, height: 13, 'stroke-width': 2 })}
              <span>Focus</span>
            </button>
          </div>
          <div class="swv-hud-help">
            <span class="hud-help-icon">
              ${icon(Compass, { class: 'ico hud-help-ico', width: 14, height: 14, 'stroke-width': 2 })}
            </span>
            <span><strong>Drag</strong> to Pan &middot; <strong>Scroll</strong> to Zoom &middot; <strong>Arrows/WASD</strong> to Move &middot; <strong>Space</strong> to Unlock</span>
          </div>
        </div>

        <!-- Unhide Tab when Panel is Collapsed -->
        <button type="button" class="swv-open-card-tab ${isPanelCollapsed ? 'visible' : ''}" id="btnOpenCardTab" title="Show Ability Details">
          ${icon(ChevronLeft, { class: 'ico tab-ico', width: 13, height: 13, 'stroke-width': 2.5 })}
          <span>Skill Details</span>
        </button>

        <svg class="swv-svg-canvas" id="swvSvgCanvas" viewBox="0 0 1100 800" preserveAspectRatio="xMidYMid meet">
          <defs>
            <filter id="glow-teal" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <radialGradient id="hub-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stop-color="#ffd694" stop-opacity="0.25"/>
              <stop offset="100%" stop-color="#ffd694" stop-opacity="0"/>
            </radialGradient>
          </defs>

          <!-- Interactive Viewport Transform Group -->
          <g id="webViewport" class="web-viewport" transform="translate(${panX}, ${panY}) scale(${zoomScale})">
            <!-- Atmospheric Spider Web Background Threads -->
            <g class="web-backdrop-threads" stroke="rgba(76, 199, 178, 0.08)" stroke-width="1" fill="none">
              <circle cx="500" cy="380" r="135" stroke-dasharray="3 4"/>
              <circle cx="500" cy="380" r="245" stroke-dasharray="4 5"/>
              <circle cx="500" cy="380" r="340" stroke-dasharray="4 6"/>
              <circle cx="500" cy="380" r="430" stroke-dasharray="5 7"/>

              <line x1="500" y1="380" x2="160" y2="40" stroke="rgba(76, 199, 178, 0.05)"/>
              <line x1="500" y1="380" x2="840" y2="40" stroke="rgba(76, 199, 178, 0.05)"/>
              <line x1="500" y1="380" x2="160" y2="720" stroke="rgba(76, 199, 178, 0.05)"/>
              <line x1="500" y1="380" x2="840" y2="720" stroke="rgba(76, 199, 178, 0.05)"/>
            </g>

            <!-- Center Glow behind Dash -->
            <circle cx="500" cy="380" r="105" fill="url(#hub-glow)" pointer-events="none"/>

            <!-- Silk Edges Layer -->
            <g class="web-edges-layer">
              ${edgesSVG}
            </g>

            <!-- Web Nodes Layer -->
            <g class="web-nodes-layer">
              ${nodesSVG}
            </g>
          </g>
        </svg>

        <!-- Floating Detail Card (Assassin's Creed Origins Style) -->
        <aside class="swv-detail-panel ${isPanelCollapsed ? 'collapsed' : ''}" id="swvDetailPanel" aria-label="Selected Ability Details">
          ${renderDetailCardHtml(selectedNodeId, species)}
        </aside>
      </div>


      <!-- CONFIRMATION MODAL FOR RESETTING ABILITIES -->
      ${isRespecConfirmOpen ? `
        <div class="swv-modal-overlay" id="swvRespecModalOverlay">
          <div class="swv-modal-card" role="dialog" aria-modal="true" aria-labelledby="respecModalTitle">
            <div class="swv-modal-header">
              <div class="swv-modal-title-group">
                ${icon(RotateCcw, { class: 'ico respec-modal-ico', width: 22, height: 22, 'stroke-width': 2.2 })}
                <h2 id="respecModalTitle">Reset Abilities?</h2>
              </div>
              <button type="button" class="swv-modal-close-btn" id="btnCancelRespecX" aria-label="Close dialog">
                ${icon(X, { class: 'ico', width: 16, height: 16, 'stroke-width': 2.5 })}
              </button>
            </div>

            <div class="swv-modal-body">
              <p class="swv-modal-desc">
                Refund all spent ability points and keep the four starter skills?
              </p>

              <div class="swv-modal-stats-box">
                <div class="swv-modal-stat">
                  <span class="mstat-lbl">Points to Refund</span>
                  <span class="mstat-val refund">+${pts.spent}</span>
                </div>
                <div class="swv-modal-stat-divider"></div>
                <div class="swv-modal-stat">
                  <span class="mstat-lbl">Available After Reset</span>
                  <span class="mstat-val available">${pts.total}</span>
                </div>
              </div>

              <div class="swv-modal-note">
                ${icon(Info, { class: 'ico note-ico', width: 15, height: 15, 'stroke-width': 2 })}
                <span>Purchased skills will be cleared. Rebuild from the four starters and their prerequisites.</span>
              </div>
            </div>

            <div class="swv-modal-footer">
              <button type="button" class="swv-btn-cancel" id="btnCancelRespec">Cancel</button>
              <button type="button" class="swv-btn-confirm-respec" id="btnConfirmRespec">
                ${icon(RotateCcw, { class: 'ico', width: 16, height: 16, 'stroke-width': 2.2 })}
                <span>Reset &amp; Refund Points</span>
              </button>
            </div>
          </div>
        </div>
      ` : ''}
    </div>
  `;
}
