import { createElement, ArrowLeft, Volume2, VolumeX, type IconNode } from 'lucide';
import { sound } from '../../audio';
import { ACTIONS, getExpProgress, getKeys, getProgress, getSettings, getUnlockedIds, keyLabel } from '../../gb';
import { SKILLS_LIST } from '../../game/abilities';

function icon(node: IconNode, attrs: Record<string, string | number> = {}): string {
  return createElement(node, attrs).outerHTML;
}

export interface ListeningKey {
  player: 'p1' | 'p2';
  action: string;
}

/* ====================================================
   4. SETTINGS VIEW (Matching settings.html)
   ==================================================== */
export function renderSettingsView(listeningKey: ListeningKey | null): string {
  const st = getSettings();
  const kb = getKeys();
  const prog = getProgress();
  const expInfo = getExpProgress(prog.onlineExp);
  const unlockedCount = getUnlockedIds(prog).length;

  return `
    <div class="page settings-page" style="max-width:760px; margin-inline:auto;">
      <header class="page-top" style="display:flex; align-items:center; justify-content:space-between; gap:18px;">
        <button type="button" class="btn ghost back-btn" id="btnBackToMain" title="Back to Menu" style="display:inline-flex; align-items:center; gap:8px; padding:8px 16px; font-weight:700; text-transform:uppercase; font-family:var(--label); font-size:15px; letter-spacing:0.06em; flex-shrink:0;">
          ${icon(ArrowLeft, { class: 'ico', width: 16, height: 16, 'stroke-width': 2.2 })}
          <span>Menu</span>
        </button>
        <div style="text-align:right;">
          <h1 style="margin:0; line-height:1.1;">Settings</h1>
          <p class="note" style="margin:4px 0 0 0;">Changes save automatically.</p>
        </div>
      </header>

      <!-- SOUND & MUSIC -->
      <section class="sec" aria-label="Sound and music">
        <h2>Sound &amp; music</h2>
        <div class="row master-sound-row" style="background:var(--surface-2); padding:10px 14px; border-radius:6px; border:1px solid var(--line); margin-bottom:12px; display:flex; align-items:center; justify-content:space-between;">
          <label class="t" style="font-weight:700; font-size:15px; cursor:pointer; display:flex; align-items:center; gap:10px;">
            <input type="checkbox" id="chkMasterSound" ${sound.enabled ? 'checked' : ''} style="width:18px;height:18px;accent-color:var(--jade);">
            <span>Master Sound (${sound.enabled ? 'ON' : 'OFF'})</span>
          </label>
          <div style="display:flex; align-items:center; gap:12px;">
            <span class="pct" style="color:${sound.enabled ? 'var(--jade-light)' : 'var(--muted)'}; font-weight:700; display:inline-flex; align-items:center; gap:6px;">
              ${icon(sound.enabled ? Volume2 : VolumeX, { class: 'ico', width: 15, height: 15, 'stroke-width': 2.2 })}
              <span>${sound.enabled ? 'Active' : 'Muted'}</span>
            </span>
            <button type="button" class="btn ghost sound-toggle-btn ${sound.enabled ? 'sound-on' : 'sound-off'}" id="btnQuickSoundToggle">
              ${sound.enabled ? 'Mute All' : 'Unmute All'}
            </button>
          </div>
        </div>
        <div class="row">
          <label class="t"><input type="checkbox" id="chkSfx" ${st.sfx ? 'checked' : ''}> Sound effects</label>
          <span class="pct" id="sfxP">${Math.round(st.sfxVol * 100)}%</span>
          <div class="slider"><input type="range" id="rngSfx" min="0" max="100" step="5" value="${Math.round(st.sfxVol * 100)}" aria-label="Sound effects volume"></div>
        </div>
        <div class="row">
          <label class="t"><input type="checkbox" id="chkMus" ${st.music ? 'checked' : ''}> Music</label>
          <span class="pct" id="musP">${Math.round(st.musicVol * 100)}%</span>
          <div class="slider"><input type="range" id="rngMus" min="0" max="100" step="5" value="${Math.round(st.musicVol * 100)}" aria-label="Music volume"></div>
        </div>
      </section>

      <!-- CPU SKILL -->
      <section class="sec" aria-label="CPU skill">
        <h2>AI Difficulty</h2>
        <div class="seg" role="radiogroup" aria-label="CPU skill">
          <label><input type="radio" name="diff" value="easy" ${st.diff === 'easy' ? 'checked' : ''}><span>Easy</span></label>
          <label><input type="radio" name="diff" value="normal" ${st.diff === 'normal' ? 'checked' : ''}><span>Normal</span></label>
          <label><input type="radio" name="diff" value="hard" ${st.diff === 'hard' ? 'checked' : ''}><span>Hard</span></label>
        </div>
      </section>

      <!-- KEY BINDS -->
      <section class="sec" aria-label="Key binds">
        <h2>Key binds</h2>
        <p class="note">Click a key, then press the new one. Esc cancels. If the key is already used, the two actions swap keys. Esc, P, H and Tab are reserved for the game.</p>
        <div class="keys" id="keysBox">
          <div class="kcol p1">
            <h3><i class="swatch" style="background:var(--amber);"></i> Player 1</h3>
            ${ACTIONS.map(([k, label]) => `
              <div class="kr">
                <span>${label}</span>
                <button type="button" class="kb ${listeningKey?.player === 'p1' && listeningKey?.action === k ? 'on' : ''}" data-p="p1" data-a="${k}">${listeningKey?.player === 'p1' && listeningKey?.action === k ? '...' : keyLabel(kb.p1[k])}</button>
              </div>
            `).join('')}
          </div>

          <div class="kcol p2">
            <h3><i class="swatch" style="background:var(--jade);"></i> Player 2</h3>
            ${ACTIONS.map(([k, label]) => `
              <div class="kr">
                <span>${label}</span>
                <button type="button" class="kb ${listeningKey?.player === 'p2' && listeningKey?.action === k ? 'on' : ''}" data-p="p2" data-a="${k}">${listeningKey?.player === 'p2' && listeningKey?.action === k ? '...' : keyLabel(kb.p2[k])}</button>
              </div>
            `).join('')}
          </div>
        </div>
        <div class="msg" id="kmsg" aria-live="polite">${listeningKey ? 'Press any key for ' + listeningKey.action + ' (Esc cancels)' : ''}</div>
        <div class="btns"><button type="button" class="btn ghost" id="btnResetKeys">Reset keys</button></div>
      </section>

      <!-- PROGRESS -->
      <section class="sec" aria-label="Progress">
        <h2>Progress & Levels</h2>
        <div class="settings-prog-grid" style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-block:12px; background:var(--surface-2); padding:14px; border-radius:8px; border:1px solid var(--line);">
          <div>
            <div style="font-family:var(--label); font-size:12px; color:var(--muted); text-transform:uppercase;">Player Level</div>
            <div style="font-family:var(--display); font-size:22px; color:var(--amber-light);">Level ${expInfo.level}</div>
            <div style="font-size:12px; color:var(--fg);">${expInfo.totalExp} Total EXP</div>
          </div>
          <div>
            <div style="font-family:var(--label); font-size:12px; color:var(--muted); text-transform:uppercase;">Abilities Unlocked</div>
            <div style="font-family:var(--display); font-size:22px; color:var(--jade-light);">${unlockedCount} / ${SKILLS_LIST.length}</div>
            <div style="font-size:12px; color:var(--muted);">Skills Active in Spider Web</div>
          </div>
        </div>
        <p class="note" style="margin-bottom:12px;">EXP is earned only from Online matches. Each level unlocks new battle abilities.</p>
        <label class="row" style="grid-template-columns:auto 1fr; gap:8px;">
          <input type="checkbox" id="chkUnlockAll" ${prog.unlockAll ? 'checked' : ''} style="width:20px;height:20px;accent-color:var(--amber)">
          <span>Unlock every ability (testing mode)</span>
        </label>
        <div class="btns"><button type="button" class="btn ghost" id="btnResetProg">Reset progress</button></div>
      </section>
    </div>
  `;
}

