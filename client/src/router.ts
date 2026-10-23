import type { MenuTab } from './ui/menu/menuTypes';

export type AppRoute = MenuTab | 'game' | 'match';

export function getRoute(): AppRoute {
  if (typeof window === 'undefined') return 'main';
  const hash = window.location.hash.replace(/^#\/?/, '').split('?')[0].trim().toLowerCase();
  const path = window.location.pathname.replace(/^\//, '').split('?')[0].trim().toLowerCase();
  const raw = hash || path;

  if (raw === 'play') return 'play';
  if (raw === 'game' || raw === 'match') return 'game';
  if (raw === 'customize') return 'customize';
  if (raw === 'abilities') return 'abilities';
  if (raw === 'settings') return 'settings';
  if (raw === 'about') return 'about';
  if (raw === 'learn') return 'learn';
  if (raw === 'account') return 'account';
  if (raw === 'leaderboard') return 'leaderboard';
  if (raw === 'profile') return 'profile';
  return 'main';
}

export function setRoute(route: AppRoute) {
  if (typeof window === 'undefined') return;
  const targetHash = route === 'main' ? '#/' : `#/${route}`;
  if (window.location.hash !== targetHash) {
    try {
      window.location.hash = targetHash;
    } catch {}
  }
}
