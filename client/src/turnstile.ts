const SITE_KEY = (import.meta as any).env?.VITE_TURNSTILE_SITE_KEY || '0x4AAAAAAFhE6e7Ab8d3bFSY';

let scriptPromise: Promise<void> | null = null;

export function getTurnstileSiteKey(): string {
  return SITE_KEY;
}

export function loadTurnstileScript(): Promise<void> {
  if (typeof (window as any).turnstile !== 'undefined') {
    return Promise.resolve();
  }
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve) => {
    const existing = document.querySelector('script[src*="challenges.cloudflare.com/turnstile"]');
    if (existing) {
      existing.addEventListener('load', () => resolve());
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => {
      console.warn('Turnstile script failed to load, continuing in fallback mode.');
      resolve();
    };
    document.head.appendChild(script);
  });
  return scriptPromise;
}

export function renderTurnstile(
  container: HTMLElement,
  onVerify: (token: string) => void,
  onExpire?: () => void
): string | null {
  const turnstile = (window as any).turnstile;
  if (!turnstile) return null;

  try {
    // Clear container children if any previous widget was embedded
    container.innerHTML = '';
    return turnstile.render(container, {
      sitekey: SITE_KEY,
      theme: 'dark',
      callback: (token: string) => onVerify(token),
      'expired-callback': () => onExpire?.(),
      'error-callback': () => onExpire?.()
    });
  } catch (err) {
    console.warn('Error rendering Turnstile widget:', err);
    return null;
  }
}

export function resetTurnstile(widgetId: string | null): void {
  if (widgetId && (window as any).turnstile) {
    try {
      (window as any).turnstile.reset(widgetId);
    } catch {}
  }
}

