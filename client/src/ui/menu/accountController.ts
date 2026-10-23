import { sound } from '../../audio';
import { signInUser, signOutUser, signUpUser, validateUsername } from '../../auth';
import { loadTurnstileScript, renderTurnstile, resetTurnstile } from '../../turnstile';
import { mountDemoFightArena } from './demoArena';

export interface AccountState {
  mode: 'login' | 'register';
  message: { type: 'error' | 'success' | 'info'; text: string } | null;
  loading: boolean;
  captchaToken: string | null;
  widgetId: string | null;
}

export function createAccountState(): AccountState {
  return {
    mode: 'login',
    message: null,
    loading: false,
    captchaToken: null,
    widgetId: null
  };
}

export function bindAccountEvents(
  container: HTMLElement,
  state: AccountState,
  render: () => void
): () => void {
  // Alert renderer helper
  const showAlert = (msg: { type: 'error' | 'success' | 'info'; text: string } | null) => {
    state.message = msg;
    const alertBox = container.querySelector('#authAlertBox') as HTMLElement | null;
    if (!alertBox) return;
    if (!msg) {
      alertBox.innerHTML = '';
      alertBox.style.display = 'none';
      return;
    }
    alertBox.style.display = 'block';
    alertBox.innerHTML = `
      <div class="auth-alert alert-${msg.type}" style="
        padding: 10px 14px;
        border-radius: 8px;
        font-size: 13px;
        display: flex;
        align-items: center;
        gap: 10px;
        ${msg.type === 'error' ? 'background:rgba(228,88,79,0.18); border:1px solid rgba(228,88,79,0.4); color:#ffb3a8;' : ''}
        ${msg.type === 'success' ? 'background:rgba(76,199,178,0.18); border:1px solid rgba(76,199,178,0.4); color:#b0f2e3;' : ''}
        ${msg.type === 'info' ? 'background:rgba(90,169,240,0.18); border:1px solid rgba(90,169,240,0.4); color:#bfe0ff;' : ''}
      ">
        <span>${msg.text}</span>
      </div>
    `;
  };

  const ensureTurnstile = () => {
    if (state.widgetId) return;
    loadTurnstileScript().then(() => {
      const widgetEl = container.querySelector('#turnstileWidget') as HTMLElement | null;
      if (widgetEl && !state.widgetId) {
        state.widgetId = renderTurnstile(
          widgetEl,
          (token) => {
            state.captchaToken = token;
          },
          () => {
            state.captchaToken = null;
          }
        );
      }
    });
  };

  // In-place tab mode switching (avoids destroying or restarting the fight scene)
  const tabLogin = container.querySelector('#tabAuthLogin');
  const tabRegister = container.querySelector('#tabAuthRegister');

  const switchMode = (mode: 'login' | 'register') => {
    state.mode = mode;
    state.captchaToken = null;
    resetTurnstile(state.widgetId);
    sound.playTone(520, 0.08, 'triangle', 0.05, 150);

    // Update active tab buttons
    if (tabLogin) tabLogin.className = `btn ${mode === 'login' ? 'primary' : 'ghost'}`;
    if (tabRegister) tabRegister.className = `btn ${mode === 'register' ? 'primary' : 'ghost'}`;

    // Update form fields in place
    const wrapUsername = container.querySelector('#wrapAuthUsername') as HTMLElement | null;
    const txtUsername = container.querySelector('#txtAuthUsername') as HTMLInputElement | null;
    const emailNote = container.querySelector('#authEmailNote') as HTMLElement | null;
    const txtPassword = container.querySelector('#txtAuthPassword') as HTMLInputElement | null;
    const wrapTurnstile = container.querySelector('#wrapAuthTurnstile') as HTMLElement | null;
    const submitText = container.querySelector('#btnAuthSubmitText') as HTMLElement | null;

    showAlert(null);

    if (wrapUsername) wrapUsername.style.display = mode === 'register' ? 'block' : 'none';
    if (txtUsername) txtUsername.required = mode === 'register';
    if (emailNote) emailNote.style.display = mode === 'register' ? 'block' : 'none';
    if (txtPassword) {
      txtPassword.placeholder = mode === 'register' ? 'Minimum 6 characters' : 'Enter your password';
      txtPassword.autocomplete = mode === 'register' ? 'new-password' : 'current-password';
    }
    if (wrapTurnstile) wrapTurnstile.style.display = 'block';
    if (submitText) {
      submitText.textContent = mode === 'register' ? 'Create Account' : 'Log In & Enter Arena';
    }

    ensureTurnstile();
  };

  tabLogin?.addEventListener('click', () => switchMode('login'));
  tabRegister?.addEventListener('click', () => switchMode('register'));

  ensureTurnstile();

  // Sign out button (authenticated view)
  container.querySelector('#btnAuthSignOut')?.addEventListener('click', async () => {
    sound.playTone(380, 0.08, 'triangle', 0.04, -120);
    state.loading = true;
    try {
      await signOutUser();
      state.message = { type: 'info', text: 'You have been signed out.' };
    } finally {
      state.loading = false;
      render();
    }
  });

  // Mount Smooth Live AI Sparring Arena on the right side with transparent background
  const previewEl = container.querySelector<HTMLElement>('#accountBattlePreview');
  const cleanupArena = previewEl ? mountDemoFightArena(previewEl) : null;

  // Submit form
  const formAuth = container.querySelector('#formAuth') as HTMLFormElement | null;
  const submitBtn = container.querySelector('#btnAuthSubmit') as HTMLButtonElement | null;
  const submitText = container.querySelector('#btnAuthSubmitText') as HTMLElement | null;

  const setSubmitLoading = (loading: boolean) => {
    state.loading = loading;
    if (submitBtn) submitBtn.disabled = loading;
    if (submitText) {
      submitText.textContent = loading
        ? 'Verifying...'
        : (state.mode === 'register' ? 'Create Account' : 'Log In & Enter Arena');
    }
  };

  const submitHandler = async (e?: Event) => {
    e?.preventDefault();
    if (state.loading) return;

    const emailInput = container.querySelector('#txtAuthEmail') as HTMLInputElement | null;
    const passwordInput = container.querySelector('#txtAuthPassword') as HTMLInputElement | null;
    const usernameInput = container.querySelector('#txtAuthUsername') as HTMLInputElement | null;

    const email = emailInput?.value.trim() || '';
    const password = passwordInput?.value || '';
    const username = usernameInput?.value.trim() || '';

    if (!email || !password) {
      showAlert({ type: 'error', text: 'Please fill in all required fields.' });
      return;
    }

    if (state.mode === 'register') {
      const userCheck = validateUsername(username);
      if (!userCheck.ok) {
        showAlert({ type: 'error', text: userCheck.message || 'Invalid username.' });
        return;
      }
      if (password.length < 6) {
        showAlert({ type: 'error', text: 'Password must be at least 6 characters.' });
        return;
      }

      // Check Turnstile token if turnstile widget is mounted
      const hasTurnstileWidget = Boolean(container.querySelector('#turnstileWidget'));
      if (hasTurnstileWidget && !state.captchaToken && typeof (window as any).turnstile !== 'undefined') {
        showAlert({ type: 'error', text: 'Please complete the anti-spam verification.' });
        return;
      }

      setSubmitLoading(true);
      showAlert(null);

      const res = await signUpUser(email, password, username, state.captchaToken || undefined);
      setSubmitLoading(false);

      if (!res.ok) {
        sound.playTone(220, 0.15, 'sawtooth', 0.05, -50);
        resetTurnstile(state.widgetId);
        state.captchaToken = null;
        showAlert({ type: 'error', text: res.message || 'Failed to create account.' });
      } else if (res.needsConfirmation) {
        sound.playTone(660, 0.12, 'triangle', 0.05, 200);
        switchMode('login');
        showAlert({
          type: 'info',
          text: `Verification email sent to ${email}! Please check your inbox and confirm your email before logging in.`
        });
      } else {
        sound.playTone(720, 0.15, 'square', 0.05, 300);
        showAlert({ type: 'success', text: `Welcome, ${username}! Your callsign is active.` });
      }
    } else {
      // Login
      const hasTurnstileWidget = Boolean(container.querySelector('#turnstileWidget'));
      if (hasTurnstileWidget && !state.captchaToken && typeof (window as any).turnstile !== 'undefined') {
        showAlert({ type: 'error', text: 'Please complete the anti-spam verification.' });
        return;
      }

      setSubmitLoading(true);
      showAlert(null);

      const res = await signInUser(email, password, state.captchaToken || undefined);
      setSubmitLoading(false);

      if (!res.ok) {
        sound.playTone(220, 0.15, 'sawtooth', 0.05, -50);
        resetTurnstile(state.widgetId);
        state.captchaToken = null;
        showAlert({ type: 'error', text: res.message || 'Invalid email or password.' });
      } else {
        sound.playTone(720, 0.15, 'square', 0.05, 300);
        render();
      }
    }
  };

  formAuth?.addEventListener('submit', submitHandler);

  return () => {
    resetTurnstile(state.widgetId);
    cleanupArena?.();
  };
}
