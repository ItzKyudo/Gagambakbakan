import { getAbilityPoints, getExpProgress, getProgress, getUnlockedIds } from '../../gb';
import { ABILITIES, SKILLS_LIST, WEB_EDGES, isNodeAvailableToUnlock, type AbilityId } from '../../game/abilities';
import { getPlayerRankTitle } from './rankTitle';

/* ====================================================
   3. ABILITIES SPIDER WEB VIEW
   ==================================================== */
export function renderDetailCardHtml(nodeId: AbilityId): string {
  const prog = getProgress();
  const pts = getAbilityPoints(prog);
  const unlockedIds = getUnlockedIds(prog);
  const sel = ABILITIES[nodeId] || ABILITIES.dash;
  const selUnlocked = unlockedIds.includes(sel.id);
  const selAvailable = isNodeAvailableToUnlock(sel.id, unlockedIds);

  let actionHtml = '';
  if (selUnlocked) {
    actionHtml = `
      <div class="ac-acquired-banner">
        <svg class="ico mini" viewBox="0 0 24 24" width="16" height="16"><path d="M20 6L9 17l-5-5" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>
        <span>SKILL ACQUIRED &amp; EQUIPPED</span>
      </div>
    `;
  } else if (selAvailable) {
    if (pts.available > 0) {
      actionHtml = `
        <button type="button" class="btn-acquire-action" id="btnAcquireSkill" data-id="${sel.id}">
          <svg class="ico" viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
          <span>ACQUIRE FOR 1 POINT</span>
        </button>
      `;
    } else {
      actionHtml = `
        <div class="ac-locked-banner warning">
          <span>PATH REACHED &bull; 0 POINTS AVAILABLE</span>
          <small>Level up in Online Matches to earn +1 Ability Point.</small>
        </div>
      `;
    }
  } else {
    actionHtml = `
      <div class="ac-locked-banner">
        <svg class="ico mini" viewBox="0 0 24 24" width="16" height="16"><rect x="5" y="11" width="14" height="10" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M8 11V8a4 4 0 018 0v3" fill="none" stroke="currentColor" stroke-width="2"/></svg>
        <span>LOCKED &mdash; PATH NOT REACHED</span>
        <small>Unlock adjacent connecting skills in the spider web first.</small>
      </div>
    `;
  }

  return `
    <div class="ac-card-top-row">
      <span class="ac-sector-tag" style="color:${sel.sectorColor}; border-color:${sel.sectorColor}66; background:${sel.sectorColor}1a;">${sel.sectorName}</span>
      <button type="button" class="ac-close-btn" id="btnCloseDetailCard" title="Minimize details panel" aria-label="Close details">
        <svg class="ico close-ico" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>

    <div class="ac-card-head">
      <div class="ac-gem-preview">
        <img src="/abilities/${sel.id}.png" alt="${sel.name}" class="ac-gem-img" />
      </div>
      <div>
        <h2 class="ac-name">${sel.name}</h2>
        <div class="ac-chips">
          <span class="ac-chip cd">
            <svg class="ico chip-ico" viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2"/><path d="M10 2h4"/></svg>
            <span>${sel.cd}s Cooldown</span>
          </span>
          <span class="ac-chip stance ${sel.use}">
            ${sel.use === 'hang' ? `
              <svg class="ico chip-ico" viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="5" r="2"/><line x1="12" y1="7" x2="12" y2="21"/><line x1="5" y1="12" x2="19" y2="12"/><path d="M5 15a7 7 0 0 0 14 0"/></svg>
              <span>Dangling only</span>
            ` : `
              <svg class="ico chip-ico" viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              <span>Clinging</span>
            `}
          </span>
        </div>
      </div>
    </div>

    <p class="ac-desc">${sel.desc}</p>

    <div class="ac-tip-box">
      <span class="ac-tip-label">
        <svg class="ico tactic-ico" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z"/></svg>
        <span>COMBAT TACTIC</span>
      </span>
      ${sel.tip}
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
  isRespecConfirmOpen = false
): string {
  const prog = getProgress();
  const expInfo = getExpProgress(prog.onlineExp);
  const pts = getAbilityPoints(prog);
  const unlockedIds = getUnlockedIds(prog);
  const rankTitle = getPlayerRankTitle(expInfo.level);

  // Edges SVG
  const edgesSVG = WEB_EDGES.map(([aId, bId]) => {
    const a = ABILITIES[aId];
    const b = ABILITIES[bId];
    if (!a || !b) return '';
    const aUnlocked = unlockedIds.includes(aId);
    const bUnlocked = unlockedIds.includes(bId);

    let edgeClass = 'silk-edge edge-locked';
    if (aUnlocked && bUnlocked) {
      edgeClass = 'silk-edge edge-active';
    } else if (
      (aUnlocked && isNodeAvailableToUnlock(bId, unlockedIds)) ||
      (bUnlocked && isNodeAvailableToUnlock(aId, unlockedIds))
    ) {
      edgeClass = 'silk-edge edge-available';
    }

    return `<line class="${edgeClass}" x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" />`;
  }).join('');

  // Nodes SVG
  const nodesSVG = SKILLS_LIST.map(s => {
    const isUnlockedNode = unlockedIds.includes(s.id);
    const isAvail = isNodeAvailableToUnlock(s.id, unlockedIds);
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
          <image href="/abilities/${s.id}.png" x="-22" y="-24" width="44" height="48" preserveAspectRatio="xMidYMid meet" style="opacity:${isUnlockedNode ? 1 : (isAvail ? 0.95 : 0.4)}; filter:${isUnlockedNode ? `drop-shadow(0 0 6px ${strokeCol})` : (isAvail ? 'contrast(1.08) brightness(0.95)' : 'grayscale(1) brightness(0.4)')};" />

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
              <text x="0" y="3.5" text-anchor="middle" font-size="9.5" font-weight="900" fill="#ffd694">1</text>
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
        <text class="node-label ${isUnlockedNode ? 'unlocked' : (isAvail ? 'available' : 'locked')}" x="0" y="42" text-anchor="middle" dominant-baseline="central">${s.name.toUpperCase()}</text>
      </g>
    `;
  }).join('');

  return `
    <div class="spider-web-view">
      <!-- TOP HEADER: NAV & POINTS HUD -->
      <header class="swv-header">
        <button type="button" class="swv-back-btn" id="btnBackToMain">
          <svg class="ico" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          <span>Menu</span>
        </button>

        <div class="swv-title-block">
          <h1 class="swv-title"><span class="a">SPIDER WEB</span> <span class="j">OF ABILITIES</span></h1>
          <div class="swv-sectors-pill">
            <span class="sec-pill aerial">
              <svg class="ico sec-ico" viewBox="0 0 24 24" width="11" height="11" fill="currentColor"><path d="M12 4l-7 12h14z"/></svg>
              <span>Aerial Silk</span>
            </span>
            <span class="sec-pill control">
              <svg class="ico sec-ico" viewBox="0 0 24 24" width="11" height="11" fill="currentColor"><path d="M4 12l12-7v14z"/></svg>
              <span>Venom Control</span>
            </span>
            <span class="sec-pill assault">
              <svg class="ico sec-ico" viewBox="0 0 24 24" width="11" height="11" fill="currentColor"><path d="M20 12l-12-7v14z"/></svg>
              <span>Mandible Assault</span>
            </span>
            <span class="sec-pill vitality">
              <svg class="ico sec-ico" viewBox="0 0 24 24" width="11" height="11" fill="currentColor"><path d="M12 20l-7-12h14z"/></svg>
              <span>Carapace Bulwark</span>
            </span>
          </div>
        </div>

        <div class="swv-right-hud">
          <div class="sbb-exp-group">
            <span class="sbb-lvl">LVL ${expInfo.level} &bull; ${rankTitle}</span>
            <div class="sbb-track" title="${expInfo.expIntoLevel} / ${expInfo.expForLevel} EXP towards Level ${expInfo.level + 1}">
              <div class="sbb-fill" style="width:${expInfo.progressPct}%;"></div>
            </div>
            <span class="sbb-exp-val">${expInfo.expIntoLevel} / ${expInfo.expForLevel} EXP</span>
          </div>
        </div>
      </header>

      <!-- STAGE: SVG CANVAS & FLOATING DETAIL CARD -->
      <div class="swv-stage" id="swvStage">
        <!-- Top Left HUD: Ability Points & Reset Points (Icon and Numbers only) -->
        <div class="swv-top-hud">
          <div class="swv-points-badge ${pts.available > 0 ? 'has-points' : ''}" title="${pts.available} Ability Points ready to allocate">
            <span class="sp-icon">
              <svg class="ico pts-ico" viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
            </span>
            <span class="sp-val">${pts.available}</span>
          </div>
          <button type="button" class="btn-respec ${pts.spent === 0 ? 'dim' : ''}" id="btnRespecWeb" title="${pts.spent > 0 ? `Reset Points & refund ${pts.spent} spent point${pts.spent === 1 ? '' : 's'}` : 'Reset Points (No points spent)'}" aria-label="Reset Points">
            <svg class="ico respec-ico" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
              <path d="M3 3v5h5"/>
            </svg>
          </button>
        </div>

        <!-- Canvas Navigation Controls (Bottom Left) -->
        <div class="swv-nav-hud">
          <div class="swv-zoom-group">
            <button type="button" class="swv-hud-btn" id="btnZoomIn" title="Zoom In (+)">
              <svg class="ico hud-ico" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            </button>
            <button type="button" class="swv-hud-btn" id="btnZoomOut" title="Zoom Out (−)">
              <svg class="ico hud-ico" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="5" y1="12" x2="19" y2="12"/></svg>
            </button>
            <button type="button" class="swv-hud-btn" id="btnZoomFit" title="Fit Entire Web (0 / F)">
              <svg class="ico hud-ico" viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>
              <span>Fit</span>
            </button>
            <button type="button" class="swv-hud-btn" id="btnZoomCenter" title="Center Selected Node (C)">
              <svg class="ico hud-ico" viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/></svg>
              <span>Focus</span>
            </button>
          </div>
          <div class="swv-hud-help">
            <span class="hud-help-icon">
              <svg class="ico hud-help-ico" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3.5"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4M5 5l3 3M16 16l3 3M5 19l3-3M16 8l3-3"/></svg>
            </span>
            <span><strong>Drag</strong> to Pan &middot; <strong>Scroll</strong> to Zoom &middot; <strong>Arrows/WASD</strong> to Move &middot; <strong>Space</strong> to Unlock</span>
          </div>
        </div>

        <!-- Unhide Tab when Panel is Collapsed -->
        <button type="button" class="swv-open-card-tab ${isPanelCollapsed ? 'visible' : ''}" id="btnOpenCardTab" title="Show Ability Details">
          <svg class="ico tab-ico" viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
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
          ${renderDetailCardHtml(selectedNodeId)}
        </aside>
      </div>


      <!-- CONFIRMATION MODAL FOR RESETTING ABILITIES -->
      ${isRespecConfirmOpen ? `
        <div class="swv-modal-overlay" id="swvRespecModalOverlay">
          <div class="swv-modal-card" role="dialog" aria-modal="true" aria-labelledby="respecModalTitle">
            <div class="swv-modal-header">
              <div class="swv-modal-title-group">
                <svg class="ico respec-modal-ico" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
                  <path d="M3 3v5h5"/>
                </svg>
                <h2 id="respecModalTitle">Reset Abilities?</h2>
              </div>
              <button type="button" class="swv-modal-close-btn" id="btnCancelRespecX" aria-label="Close dialog">
                <svg class="ico" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            <div class="swv-modal-body">
              <p class="swv-modal-desc">
                Refund all spent ability points and reset your spider web back to starter <strong>Dash</strong>?
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
                <svg class="ico note-ico" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                <span>All unlocked ability branches will be cleared. You can immediately re-allocate all ${pts.total} points anywhere in the web.</span>
              </div>
            </div>

            <div class="swv-modal-footer">
              <button type="button" class="swv-btn-cancel" id="btnCancelRespec">Cancel</button>
              <button type="button" class="swv-btn-confirm-respec" id="btnConfirmRespec">
                <svg class="ico" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
                  <path d="M3 3v5h5"/>
                </svg>
                <span>Reset &amp; Refund Points</span>
              </button>
            </div>
          </div>
        </div>
      ` : ''}
    </div>
  `;
}
