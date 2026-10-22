import {
  createElement,
  ArrowLeft,
  User,
  LogIn,
  LogOut,
  Mail,
  AlertCircle,
  CheckCircle2,
  Swords,
  type IconNode
} from 'lucide';
import { getAuthUser, getUserProfile, isSupabaseConfigured } from '../../auth';
import { getColor, getLooks, spiderSVG } from '../../gb';
import type { AccountState } from './accountController';

function icon(node: IconNode, attrs: Record<string, string | number> = {}): string {
  return createElement(node, attrs).outerHTML;
}

export function renderAccountView(state: AccountState): string {
  const user = getAuthUser();
  const profile = getUserProfile();
  const looks = getLooks();
  const spiderColor = getColor(looks.p1.color);

  return `
    <div class="page account-page fullscreen-account">
      <header class="page-top" style="display:flex; align-items:center; justify-content:space-between; gap:18px;">
        <button type="button" class="btn ghost back-btn" id="btnBackToMain" title="Back to Menu" style="display:inline-flex; align-items:center; gap:8px; padding:8px 16px; font-weight:700; text-transform:uppercase; font-family:var(--label); font-size:15px; letter-spacing:0.06em; flex-shrink:0;">
          ${icon(ArrowLeft, { class: 'ico', width: 16, height: 16, 'stroke-width': 2.2 })}
          <span>Menu</span>
        </button>
        <div style="text-align:right;">
          <h1 style="margin:0; line-height:1.1;"><span class="a">${user ? 'Fighter' : 'Arena'}</span> <span class="j">${user ? 'Dossier' : 'Login'}</span></h1>
          <p class="note" style="margin:4px 0 0 0; color:${user ? 'var(--muted)' : 'var(--amber)'};">
            ${user ? 'Your authenticated profile, battle record &amp; rankings.' : 'Step onto the tingting. Sign in or register to play.'}
          </p>
        </div>
      </header>

      ${!isSupabaseConfigured ? `
        <div class="sec" style="background:rgba(228,88,79,0.1); border:1px solid rgba(228,88,79,0.3); border-radius:12px; padding:20px; display:flex; gap:14px; align-items:flex-start; max-width:480px; margin:20px auto;">
          <div style="color:var(--coral); flex-shrink:0;">
            ${icon(AlertCircle, { width: 24, height: 24, 'stroke-width': 2.2 })}
          </div>
          <div>
            <h3 style="margin:0 0 6px; color:var(--coral);">Supabase Not Configured</h3>
            <p style="margin:0; font-size:14px; color:var(--fg); opacity:0.85;">
              <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> must be configured in <code>client/.env</code>.
            </p>
          </div>
        </div>
      ` : `
        <div class="account-split-layout">
          <!-- LEFT COLUMN (40%): LOGIN / REGISTER / DOSSIER DIRECT ON BACKGROUND -->
          <div class="account-left-col">
            ${user ? `
              <div class="account-direct-wrap" style="max-width:440px; width:100%; display:grid; gap:18px;">
                <div style="display:flex; align-items:center; gap:16px;">
                  <div style="width:68px; height:68px; border-radius:50%; background:${spiderColor.dark}; border:2px solid ${spiderColor.main}; display:flex; align-items:center; justify-content:center; box-shadow:0 0 20px ${spiderColor.main}55;">
                    <div style="transform:scale(0.75); width:68px; height:68px; display:flex; align-items:center; justify-content:center;">
                      ${spiderSVG(looks.p1, '-acc-avatar')}
                    </div>
                  </div>
                  <div>
                    <div style="display:flex; align-items:center; gap:8px;">
                      <h2 style="margin:0; font-family:var(--display); font-size:26px;">${profile?.username || user.user_metadata?.username || 'Fighter'}</h2>
                      <span style="font-size:10px; font-weight:700; color:var(--jade); background:rgba(76,199,178,0.14); border:1px solid rgba(76,199,178,0.35); border-radius:12px; padding:2px 8px;">
                        VERIFIED
                      </span>
                    </div>
                    <div style="font-size:13px; color:var(--muted); margin-top:2px;">${user.email}</div>
                  </div>
                </div>

                <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
                  <div style="background:rgba(13,26,34,0.7); backdrop-filter:blur(8px); border:1px solid var(--line); border-radius:10px; padding:14px; text-align:center;">
                    <div style="font-size:11px; font-family:var(--label); text-transform:uppercase; color:var(--muted); letter-spacing:0.08em;">Rating (ELO)</div>
                    <div style="font-family:var(--display); font-size:32px; color:var(--amber); margin-top:2px;">${profile?.rating ?? 1000}</div>
                  </div>
                  <div style="background:rgba(13,26,34,0.7); backdrop-filter:blur(8px); border:1px solid var(--line); border-radius:10px; padding:14px; text-align:center;">
                    <div style="font-size:11px; font-family:var(--label); text-transform:uppercase; color:var(--muted); letter-spacing:0.08em;">Record</div>
                    <div style="font-family:var(--display); font-size:32px; color:var(--jade); margin-top:2px;">
                      ${profile?.wins ?? 0}<span style="font-size:18px; color:var(--muted);">W</span> - ${profile?.losses ?? 0}<span style="font-size:18px; color:var(--muted);">L</span>
                    </div>
                  </div>
                </div>

                <div style="display:grid; gap:10px; margin-top:8px;">
                  <button type="button" class="btn primary" id="btnBackToMain" style="justify-content:center; gap:8px; font-weight:700; text-transform:uppercase; min-height:46px;">
                    ${icon(Swords, { width: 16, height: 16, 'stroke-width': 2.2 })}
                    <span>Enter Arena (Play)</span>
                  </button>
                  <button type="button" class="btn ghost" id="btnAuthSignOut" style="justify-content:center; gap:8px; border-color:rgba(228,88,79,0.35); color:var(--coral); min-height:42px;">
                    ${icon(LogOut, { width: 15, height: 15, 'stroke-width': 2.2 })}
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            ` : `
              <div class="account-direct-wrap" style="max-width:440px; width:100%; display:grid; gap:16px;">
                <!-- TABS (LOG IN / CREATE ACCOUNT) -->
                <div class="tabs" role="group" aria-label="Account Action" style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
                  <button type="button" id="tabAuthLogin" class="btn ${state.mode === 'login' ? 'primary' : 'ghost'}" style="justify-content:center; gap:8px; font-weight:700; min-height:42px;">
                    ${icon(LogIn, { width: 16, height: 16, 'stroke-width': 2.2 })}
                    <span>Log In</span>
                  </button>
                  <button type="button" id="tabAuthRegister" class="btn ${state.mode === 'register' ? 'primary' : 'ghost'}" style="justify-content:center; gap:8px; font-weight:700; min-height:42px;">
                    ${icon(User, { width: 16, height: 16, 'stroke-width': 2.2 })}
                    <span>Create Account</span>
                  </button>
                </div>

                <div id="authAlertBox" style="${state.message ? '' : 'display:none;'}">
                  ${state.message ? `
                    <div class="auth-alert alert-${state.message.type}" style="
                      padding: 10px 14px;
                      border-radius: 8px;
                      font-size: 13px;
                      display: flex;
                      align-items: center;
                      gap: 10px;
                      ${state.message.type === 'error' ? 'background:rgba(228,88,79,0.18); border:1px solid rgba(228,88,79,0.4); color:#ffb3a8;' : ''}
                      ${state.message.type === 'success' ? 'background:rgba(76,199,178,0.18); border:1px solid rgba(76,199,178,0.4); color:#b0f2e3;' : ''}
                      ${state.message.type === 'info' ? 'background:rgba(90,169,240,0.18); border:1px solid rgba(90,169,240,0.4); color:#bfe0ff;' : ''}
                    ">
                      ${icon(state.message.type === 'error' ? AlertCircle : (state.message.type === 'success' ? CheckCircle2 : Mail), { width: 18, height: 18, 'stroke-width': 2.2, class: 'ico-flex' })}
                      <span>${state.message.text}</span>
                    </div>
                  ` : ''}
                </div>

                <form id="formAuth" onsubmit="return false;" style="display:grid; gap:14px;">
                  <div class="field" id="wrapAuthUsername" style="${state.mode === 'register' ? '' : 'display:none;'}">
                    <label class="lbl" for="txtAuthUsername" style="display:flex; justify-content:space-between;">
                      <span>Fighter Callsign (Username)</span>
                      <span style="font-size:11px; text-transform:none; opacity:0.7;">3–10 chars</span>
                    </label>
                    <input type="text" id="txtAuthUsername" placeholder="chex-gagamboy" maxlength="10" autocomplete="username" ${state.mode === 'register' ? 'required' : ''} spellcheck="false">
                  </div>

                  <div class="field">
                    <label class="lbl" for="txtAuthEmail">Email Address</label>
                    <input type="email" id="txtAuthEmail" placeholder="Enter your email" autocomplete="email" required spellcheck="false">
                    <small id="authEmailNote" class="note" style="margin-top:2px; ${state.mode === 'register' ? '' : 'display:none;'}">Supabase sends a verification email to activate your account.</small>
                  </div>

                  <div class="field">
                    <label class="lbl" for="txtAuthPassword">Password</label>
                    <input type="password" id="txtAuthPassword" placeholder="${state.mode === 'register' ? 'Minimum 6 characters' : 'Enter your password'}" autocomplete="${state.mode === 'register' ? 'new-password' : 'current-password'}" required>
                  </div>

                  <!-- DIRECT CLOUDFLARE TURNSTILE WIDGET (LEFT-ALIGNED WITH INPUTS) -->
                  <div id="wrapAuthTurnstile" style="${state.mode === 'register' ? '' : 'display:none;'}">
                    <div id="turnstileWidget" style="min-height:65px; display:flex; align-items:center; justify-content:flex-start; margin:6px 0;"></div>
                  </div>

                  <button type="submit" class="btn primary" id="btnAuthSubmit" ${state.loading ? 'disabled' : ''} style="width:100%; min-height:46px; margin-top:6px; font-weight:700; text-transform:uppercase; letter-spacing:0.08em; justify-content:center;">
                    <span id="btnAuthSubmitText">${state.loading ? 'Verifying...' : (state.mode === 'register' ? 'Create Account' : 'Log In &amp; Enter Arena')}</span>
                  </button>
                </form>
              </div>
            `}
          </div>

          <!-- RIGHT COLUMN (60%): LIVE AI SPIDER FIGHTING SCENE (NO CONTAINER BOX) -->
          <div class="account-right-col">
            <div class="account-preview-arena" id="accountBattlePreview" title="Live AI Sparring"></div>
          </div>
        </div>
      `}
    </div>
  `;
}
