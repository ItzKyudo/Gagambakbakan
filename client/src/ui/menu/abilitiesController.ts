import { sound } from '../../audio';
import { acquireSkill, respecWeb } from '../../gb';
import { ABILITIES, SKILLS_LIST, WEB_EDGES, type AbilityId } from '../../game/abilities';
import { renderDetailCardHtml } from './abilitiesView';

export interface AbilitiesViewState {
  selectedNodeId: AbilityId;
  panX: number;
  panY: number;
  zoomScale: number;
  isPanelCollapsed: boolean;
  keyHandler: ((event: KeyboardEvent) => void) | null;
}

export function createAbilitiesViewState(): AbilitiesViewState {
  return {
    selectedNodeId: 'dash',
    panX: -40,
    panY: 0,
    zoomScale: 1,
    isPanelCollapsed: false,
    keyHandler: null
  };
}

export function clearAbilitiesKeyHandler(state: AbilitiesViewState) {
  if (!state.keyHandler) return;
  window.removeEventListener('keydown', state.keyHandler);
  state.keyHandler = null;
}

export function bindAbilitiesEvents(container: HTMLElement, state: AbilitiesViewState, render: () => void) {
  const stage = container.querySelector<HTMLElement>('#swvStage');
  const detailPanel = container.querySelector<HTMLElement>('#swvDetailPanel');
  const openCardTab = container.querySelector<HTMLElement>('#btnOpenCardTab');

  const setPanelCollapsed = (collapsed: boolean) => {
    state.isPanelCollapsed = collapsed;
    if (detailPanel) {
      detailPanel.classList.toggle('collapsed', state.isPanelCollapsed);
    }
    if (openCardTab) {
      openCardTab.classList.toggle('visible', state.isPanelCollapsed);
    }
  };

  const applyViewport = (anim = false) => {
    const vp = container.querySelector<SVGGElement>('#webViewport');
    if (!vp) return;
    if (anim) {
      vp.classList.add('animating');
      setTimeout(() => vp.classList.remove('animating'), 360);
    } else {
      vp.classList.remove('animating');
    }
    vp.setAttribute('transform', `translate(${state.panX.toFixed(1)}, ${state.panY.toFixed(1)}) scale(${state.zoomScale.toFixed(3)})`);
  };

  const centerOnNode = (id: AbilityId) => {
    const sel = ABILITIES[id] || ABILITIES.dash;
    const targetCenterX = state.isPanelCollapsed ? 550 : 440;
    const targetCenterY = 400;
    state.panX = targetCenterX - sel.x * state.zoomScale;
    state.panY = targetCenterY - sel.y * state.zoomScale;
    state.panX = Math.max(-650, Math.min(550, state.panX));
    state.panY = Math.max(-550, Math.min(550, state.panY));
    applyViewport(true);
  };

  const fitWeb = () => {
    state.panX = state.isPanelCollapsed ? 0 : -40;
    state.panY = 0;
    state.zoomScale = 1.0;
    applyViewport(true);
  };

  const bindDetailCardActions = () => {
    const btnAcquire = container.querySelector('#btnAcquireSkill') as HTMLButtonElement | null;
    if (btnAcquire) {
      btnAcquire.onclick = () => {
        const targetId = (btnAcquire.dataset.id as AbilityId) || state.selectedNodeId;
        const res = acquireSkill(targetId);
        if (res.success) {
          state.selectedNodeId = targetId;
          sound.playTone(520, 0.1, 'triangle', 0.05, 200);
          setTimeout(() => sound.playTone(780, 0.18, 'triangle', 0.05, 100), 100);
          render();
        } else {
          sound.playTone(280, 0.15, 'sawtooth', 0.05, -80);
        }
      };
    }

    const btnClose = container.querySelector<HTMLButtonElement>('#btnCloseDetailCard');
    if (btnClose) {
      btnClose.onclick = () => {
        sound.playTone(400, 0.06, 'triangle', 0.03, -100);
        setPanelCollapsed(true);
      };
    }
  };

  bindDetailCardActions();

  openCardTab?.addEventListener('click', () => {
    sound.playTone(540, 0.06, 'triangle', 0.03, 100);
    setPanelCollapsed(false);
  });

  const selectNode = (id: AbilityId, panTo = false) => {
    if (!id || !ABILITIES[id]) return;
    state.selectedNodeId = id;

    container.querySelectorAll<SVGElement>('.web-node').forEach(node => {
      node.classList.toggle('selected', node.dataset.id === id);
    });

    if (detailPanel) {
      detailPanel.innerHTML = renderDetailCardHtml(id);
      bindDetailCardActions();
    }

    sound.playTone(580, 0.05, 'triangle', 0.04, 120);

    if (panTo) {
      centerOnNode(id);
    }
  };

  // Drag to pan variables
  let isDragging = false;
  let startX = 0;
  let startY = 0;
  let initialPanX = 0;
  let initialPanY = 0;
  let dragDist = 0;

  if (stage) {
    stage.addEventListener('pointerdown', (e: PointerEvent) => {
      if (e.button !== 0) return;
      const target = e.target as HTMLElement | SVGElement;
      if (target.closest('.swv-nav-hud, .swv-detail-panel, .swv-header, .swv-bottom-bar, .swv-open-card-tab')) {
        return;
      }

      isDragging = true;
      dragDist = 0;
      startX = e.clientX;
      startY = e.clientY;
      initialPanX = state.panX;
      initialPanY = state.panY;
      stage.classList.add('dragging');
      stage.setPointerCapture(e.pointerId);
    });

    stage.addEventListener('pointermove', (e: PointerEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      dragDist = Math.hypot(dx, dy);

      const rect = stage.getBoundingClientRect();
      const ratio = 1100 / (rect.width || 1100);

      state.panX = initialPanX + dx * ratio;
      state.panY = initialPanY + dy * ratio;
      state.panX = Math.max(-650, Math.min(550, state.panX));
      state.panY = Math.max(-550, Math.min(550, state.panY));
      applyViewport(false);
    });

    const onPointerUp = (e: PointerEvent) => {
      if (!isDragging) return;
      isDragging = false;
      stage.classList.remove('dragging');
      try {
        stage.releasePointerCapture(e.pointerId);
      } catch {}
    };

    stage.addEventListener('pointerup', onPointerUp);
    stage.addEventListener('pointercancel', onPointerUp);

    // Wheel Zoom (anchored to cursor)
    stage.addEventListener('wheel', (e: WheelEvent) => {
      e.preventDefault();
      const rect = stage.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const svgX = (mouseX / (rect.width || 1100)) * 1100;
      const svgY = (mouseY / (rect.height || 800)) * 800;

      const zoomFactor = e.deltaY < 0 ? 1.15 : 0.87;
      const oldZoom = state.zoomScale;
      const newZoom = Math.max(0.55, Math.min(2.5, oldZoom * zoomFactor));

      state.panX = svgX - (svgX - state.panX) * (newZoom / oldZoom);
      state.panY = svgY - (svgY - state.panY) * (newZoom / oldZoom);
      state.zoomScale = newZoom;

      state.panX = Math.max(-650, Math.min(550, state.panX));
      state.panY = Math.max(-550, Math.min(550, state.panY));
      applyViewport(false);
    }, { passive: false });
  }

  // HUD Zoom Buttons
  container.querySelector('#btnZoomIn')?.addEventListener('click', () => {
    state.zoomScale = Math.min(2.5, state.zoomScale * 1.25);
    applyViewport(true);
    sound.playTone(600, 0.05, 'triangle', 0.03, 100);
  });

  container.querySelector('#btnZoomOut')?.addEventListener('click', () => {
    state.zoomScale = Math.max(0.55, state.zoomScale * 0.8);
    applyViewport(true);
    sound.playTone(450, 0.05, 'triangle', 0.03, -100);
  });

  container.querySelector('#btnZoomFit')?.addEventListener('click', () => {
    fitWeb();
    sound.playTone(550, 0.06, 'triangle', 0.03);
  });

  container.querySelector('#btnZoomCenter')?.addEventListener('click', () => {
    centerOnNode(state.selectedNodeId);
    sound.playTone(620, 0.06, 'triangle', 0.04, 150);
  });

  // Node interaction
  container.querySelectorAll<SVGElement>('.web-node[data-id]').forEach(node => {
    const id = node.dataset.id as AbilityId;
    if (!id || !ABILITIES[id]) return;

    // Hover: preview skill in details panel without losing selection halo
    node.addEventListener('mouseenter', () => {
      if (detailPanel) {
        detailPanel.innerHTML = renderDetailCardHtml(id);
        bindDetailCardActions();
      }
    });

    // Click: select node if not dragged
    node.addEventListener('click', () => {
      if (dragDist > 6) return;
      selectNode(id, false);
    });
  });

  // Directional traversal
  const getNextNodeInDirection = (currentId: AbilityId, dir: 'up' | 'down' | 'left' | 'right'): AbilityId | null => {
    const current = ABILITIES[currentId];
    if (!current) return null;

    let bestId: AbilityId | null = null;
    let bestScore = Infinity;

    for (const candidate of SKILLS_LIST) {
      if (candidate.id === currentId) continue;
      const dx = candidate.x - current.x;
      const dy = candidate.y - current.y;
      const dist = Math.hypot(dx, dy);

      const isDirectEdge = WEB_EDGES.some(
        ([a, b]) => (a === currentId && b === candidate.id) || (b === currentId && a === candidate.id)
      );
      const edgeMultiplier = isDirectEdge ? 0.6 : 1.0;

      let isValidDirection = false;
      let score = dist * edgeMultiplier;

      if (dir === 'up') {
        if (dy < -15 && Math.abs(dx) <= Math.abs(dy) * 1.8) {
          isValidDirection = true;
          score += Math.abs(dx) * 0.5;
        }
      } else if (dir === 'down') {
        if (dy > 15 && Math.abs(dx) <= Math.abs(dy) * 1.8) {
          isValidDirection = true;
          score += Math.abs(dx) * 0.5;
        }
      } else if (dir === 'left') {
        if (dx < -15 && Math.abs(dy) <= Math.abs(dx) * 1.8) {
          isValidDirection = true;
          score += Math.abs(dy) * 0.5;
        }
      } else if (dir === 'right') {
        if (dx > 15 && Math.abs(dy) <= Math.abs(dx) * 1.8) {
          isValidDirection = true;
          score += Math.abs(dy) * 0.5;
        }
      }

      if (isValidDirection && score < bestScore) {
        bestScore = score;
        bestId = candidate.id;
      }
    }

    // Secondary fallback if cone was too strict
    if (!bestId) {
      for (const candidate of SKILLS_LIST) {
        if (candidate.id === currentId) continue;
        const dx = candidate.x - current.x;
        const dy = candidate.y - current.y;
        const dist = Math.hypot(dx, dy);

        let isValid = false;
        if (dir === 'up' && dy < -10) isValid = true;
        if (dir === 'down' && dy > 10) isValid = true;
        if (dir === 'left' && dx < -10) isValid = true;
        if (dir === 'right' && dx > 10) isValid = true;

        if (isValid && dist < bestScore) {
          bestScore = dist;
          bestId = candidate.id;
        }
      }
    }

    return bestId;
  };

  // Keyboard navigation
  state.keyHandler = (e: KeyboardEvent) => {
    const targetTag = (e.target as HTMLElement)?.tagName?.toLowerCase();
    if (targetTag === 'input' || targetTag === 'textarea') return;

    const k = e.key;
    if (k === 'ArrowUp' || k === 'w' || k === 'W') {
      e.preventDefault();
      const next = getNextNodeInDirection(state.selectedNodeId, 'up');
      if (next) selectNode(next, false);
    } else if (k === 'ArrowDown' || k === 's' || k === 'S') {
      e.preventDefault();
      const next = getNextNodeInDirection(state.selectedNodeId, 'down');
      if (next) selectNode(next, false);
    } else if (k === 'ArrowLeft' || k === 'a' || k === 'A') {
      e.preventDefault();
      const next = getNextNodeInDirection(state.selectedNodeId, 'left');
      if (next) selectNode(next, false);
    } else if (k === 'ArrowRight' || k === 'd' || k === 'D') {
      e.preventDefault();
      const next = getNextNodeInDirection(state.selectedNodeId, 'right');
      if (next) selectNode(next, false);
    } else if (k === ' ' || k === 'Enter') {
      e.preventDefault();
      const res = acquireSkill(state.selectedNodeId);
      if (res.success) {
        sound.playTone(520, 0.1, 'triangle', 0.05, 200);
        setTimeout(() => sound.playTone(780, 0.18, 'triangle', 0.05, 100), 100);
        render();
      } else {
        sound.playTone(280, 0.15, 'sawtooth', 0.05, -80);
      }
    } else if (k === 'f' || k === 'F' || k === '0') {
      e.preventDefault();
      fitWeb();
    } else if (k === 'c' || k === 'C') {
      e.preventDefault();
      centerOnNode(state.selectedNodeId);
    } else if (k === '+' || k === '=') {
      e.preventDefault();
      state.zoomScale = Math.min(2.5, state.zoomScale * 1.25);
      applyViewport(true);
    } else if (k === '-' || k === '_') {
      e.preventDefault();
      state.zoomScale = Math.max(0.55, state.zoomScale * 0.8);
      applyViewport(true);
    } else if (k === 'Escape') {
      e.preventDefault();
      setPanelCollapsed(!state.isPanelCollapsed);
    }
  };

  window.addEventListener('keydown', state.keyHandler);

  // Respec Web Button
  container.querySelector('#btnRespecWeb')?.addEventListener('click', () => {
    if (confirm('Refund all spent ability points and reset web back to starter Dash?')) {
      respecWeb();
      state.selectedNodeId = 'dash';
      sound.playTone(400, 0.14, 'triangle', 0.04, -120);
      render();
    }
  });
}

