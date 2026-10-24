export const MATCHMAKING_LIMIT = 6;
export const MATCHMAKING_WINDOW_MS = 60_000;
const MAX_TRACKED_IPS = 10_000;

export const matchmakingAttempts = new Map<string, { count: number; resetAt: number }>();

export function checkMatchmakingRateLimit(ip?: string, now = Date.now()): { allowed: boolean; retryAfterMs: number } {
  if (matchmakingAttempts.size >= MAX_TRACKED_IPS) {
    for (const [storedIp, attempt] of matchmakingAttempts) {
      if (attempt.resetAt <= now) matchmakingAttempts.delete(storedIp);
    }
  }

  const key = ip || 'unknown';
  const current = matchmakingAttempts.get(key);

  if (!current && matchmakingAttempts.size >= MAX_TRACKED_IPS) {
    return { allowed: false, retryAfterMs: MATCHMAKING_WINDOW_MS };
  }

  if (!current || current.resetAt <= now) {
    matchmakingAttempts.set(key, { count: 1, resetAt: now + MATCHMAKING_WINDOW_MS });
    return { allowed: true, retryAfterMs: 0 };
  }

  if (current.count >= MATCHMAKING_LIMIT) {
    return { allowed: false, retryAfterMs: current.resetAt - now };
  }

  current.count++;

  return { allowed: true, retryAfterMs: 0 };
}
