// Client-side icon cache & pre-warming helper
// Ensures icons are cached on disk (Service Worker & CacheStorage) and in-memory (decoded Image cache)
// for instant loading without requiring a strong internet connection.

export const ALL_ICON_URLS: readonly string[] = [
  // App brand & UI
  '/logo.svg',
  '/favicon.svg',
  '/gagambai-logo.svg',
  '/icons.svg',
  '/ui/spider-next.svg',

  // All 16 ability icons
  '/abilities/anchor.png',
  '/abilities/carapace.png',
  '/abilities/dash.png',
  '/abilities/haste.png',
  '/abilities/hook.png',
  '/abilities/leech.png',
  '/abilities/mend.png',
  '/abilities/pounce.png',
  '/abilities/power.png',
  '/abilities/riposte.png',
  '/abilities/shield.png',
  '/abilities/spit.png',
  '/abilities/surge.png',
  '/abilities/sweep.png',
  '/abilities/tremor.png',
  '/abilities/web.png',

  // Rank Badges (SVGs and PNG fallbacks)
  '/ranks/wolf-spider.svg',
  '/ranks/wolf-spider-128.png',
  '/ranks/wolf-spider-64.png',
  '/ranks/wolf-spider-256.png',
  '/ranks/wolf-spider.png',
  '/ranks/huntsman-spider.svg',
  '/ranks/huntsman-spider-128.png',
  '/ranks/huntsman-spider-64.png',
  '/ranks/huntsman-spider-256.png',
  '/ranks/huntsman-spider.png',
  '/ranks/philippine-tarantula.svg',
  '/ranks/philippine-tarantula-128.png',
  '/ranks/philippine-tarantula-64.png',
  '/ranks/philippine-tarantula-256.png',
  '/ranks/philippine-tarantula.png',
  '/ranks/brown-widow.svg',
  '/ranks/brown-widow-128.png',
  '/ranks/brown-widow-64.png',
  '/ranks/brown-widow-256.png',
  '/ranks/brown-widow.png',

  // Leaderboard Podium Badges
  '/leaderboard-badges/level-1.svg',
  '/leaderboard-badges/level-2.svg',
  '/leaderboard-badges/level-3.svg',
  '/leaderboard-badges/rank-1.svg',
  '/leaderboard-badges/rank-2.svg',
  '/leaderboard-badges/rank-3.svg',

  // Categories & Exclusive Accessories
  '/categories/aerial.png',
  '/categories/aerial_full.png',
  '/categories/assault.png',
  '/categories/assault_full.png',
  '/categories/control.png',
  '/categories/control_full.png',
  '/categories/vitality.png',
  '/categories/vitality_full.png',
  '/exclusive-accessories/apex-crown.svg',
  '/exclusive-accessories/mythic-laurel.svg'
];

export const PRIORITY_ICON_URLS: readonly string[] = [
  '/logo.svg',
  '/favicon.svg',
  '/ui/spider-next.svg',
  '/ranks/wolf-spider.svg',
  '/ranks/wolf-spider-128.png',
  '/ranks/huntsman-spider.svg',
  '/ranks/huntsman-spider-128.png',
  '/ranks/philippine-tarantula.svg',
  '/ranks/philippine-tarantula-128.png',
  '/ranks/brown-widow.svg',
  '/ranks/brown-widow-128.png',
  '/abilities/dash.png',
  '/abilities/web.png'
];

export function getAllIconUrls(): readonly string[] {
  return ALL_ICON_URLS;
}

export function getPriorityIconUrls(): readonly string[] {
  return PRIORITY_ICON_URLS;
}

const inMemoryIconCache = new Map<string, HTMLImageElement>();
let isInitialized = false;

export function getCachedImage(url: string): HTMLImageElement | undefined {
  return inMemoryIconCache.get(url);
}

export function preloadIconImage(url: string): Promise<HTMLImageElement | null> {
  if (typeof window === 'undefined' || typeof Image === 'undefined') {
    return Promise.resolve(null);
  }

  const existing = inMemoryIconCache.get(url);
  if (existing && existing.complete) {
    return Promise.resolve(existing);
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.src = url;
    inMemoryIconCache.set(url, img);

    if (typeof img.decode === 'function') {
      img.decode()
        .then(() => resolve(img))
        .catch(() => resolve(img));
    } else {
      img.onload = () => resolve(img);
      img.onerror = () => resolve(img);
    }
  });
}

export function warmCacheStorage(urls: readonly string[] = ALL_ICON_URLS): Promise<void> {
  if (typeof window === 'undefined' || !('caches' in window)) {
    return Promise.resolve();
  }

  return window.caches.open('gb-icons-cache-v1')
    .then((cache) => {
      const tasks = urls.map((url) =>
        cache.match(url, { ignoreSearch: true }).then((cached) => {
          if (!cached) {
            return fetch(url).then((res) => {
              if (res.ok) return cache.put(url, res);
            }).catch(() => {});
          }
        }).catch(() => {})
      );
      return Promise.all(tasks).then(() => {});
    })
    .catch(() => {});
}

export function registerIconServiceWorker(): void {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

  const isLocalhost = Boolean(
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname === '[::1]'
  );

  if (window.location.protocol === 'https:' || isLocalhost) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch((err) => {
        console.warn('Icon service worker registration error:', err);
      });
    }, { once: true });
  }
}

export function initIconCache(): void {
  if (typeof window === 'undefined' || isInitialized) return;
  isInitialized = true;

  // 1. Register Service Worker for persistent caching across browser restarts
  registerIconServiceWorker();

  // 2. Pre-warm CacheStorage immediately
  void warmCacheStorage();

  // 3. Preload & decode images into browser memory in priority stages
  const schedule = (cb: () => void) => {
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(cb, { timeout: 2000 });
    } else {
      setTimeout(cb, 50);
    }
  };

  schedule(() => {
    // Stage 1: Priority icons
    for (const url of PRIORITY_ICON_URLS) {
      void preloadIconImage(url);
    }

    // Stage 2: Remaining icons
    schedule(() => {
      for (const url of ALL_ICON_URLS) {
        if (!inMemoryIconCache.has(url)) {
          void preloadIconImage(url);
        }
      }
    });
  });
}
