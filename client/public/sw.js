// Gagambakbakan Icon Cache Service Worker
// Provides instant, offline, and weak-connection loading for all game icons and graphical badges.

const CACHE_NAME = 'gb-icons-cache-v1';

const ICON_ASSETS = [
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

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.all(
        ICON_ASSETS.map((url) =>
          fetch(url, { cache: 'reload' })
            .then((res) => {
              if (res.ok) return cache.put(url, res);
            })
            .catch(() => {
              // Silently ignore asset pre-fetch errors so one asset doesn't abort caching
            })
        )
      );
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      );
    }).then(() => self.clients.claim())
  );
});

function isIconRequest(url) {
  const p = url.pathname;
  return (
    p.startsWith('/abilities/') ||
    p.startsWith('/ranks/') ||
    p.startsWith('/leaderboard-badges/') ||
    p.startsWith('/categories/') ||
    p.startsWith('/exclusive-accessories/') ||
    p.startsWith('/ui/') ||
    p === '/logo.svg' ||
    p === '/favicon.svg' ||
    p === '/gagambai-logo.svg' ||
    p === '/icons.svg' ||
    /\.(png|svg|ico|webp)$/i.test(p)
  );
}

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Apply Cache-First to all icon and game image assets on the same origin
  if (url.origin === self.location.origin && isIconRequest(url)) {
    event.respondWith(
      caches.match(event.request, { ignoreSearch: true }).then((cached) => {
        if (cached) {
          // Serve instantly from cache without waiting for network
          return cached;
        }

        // Not cached yet: fetch from network and store in cache for future instant visits
        return fetch(event.request).then((networkRes) => {
          if (networkRes && networkRes.status === 200) {
            const clone = networkRes.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, clone);
            });
          }
          return networkRes;
        }).catch(() => {
          // Fallback if offline/weak connection and asset was not cached
          return caches.match('/logo.svg') || caches.match('/favicon.svg');
        });
      })
    );
  }
});
