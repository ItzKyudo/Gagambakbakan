import assert from 'node:assert/strict';
import test from 'node:test';
import {
  MATCHMAKING_LIMIT,
  MATCHMAKING_WINDOW_MS,
  checkMatchmakingRateLimit,
  matchmakingAttempts
} from '../src/matchmakingRateLimit';

test('matchmaking rate limit blocks bursts per IP and resets after its window', () => {
  matchmakingAttempts.clear();
  const now = 1_000;

  for (let attempt = 0; attempt < MATCHMAKING_LIMIT; attempt++) {
    assert.equal(checkMatchmakingRateLimit('203.0.113.1', now).allowed, true);
  }

  assert.equal(checkMatchmakingRateLimit('203.0.113.1', now).allowed, false);
  assert.equal(checkMatchmakingRateLimit('203.0.113.2', now).allowed, true);
  assert.equal(checkMatchmakingRateLimit('203.0.113.1', now + MATCHMAKING_WINDOW_MS).allowed, true);
});
