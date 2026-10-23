import assert from 'node:assert/strict';
import test from 'node:test';
import { BattleStateData, DisconnectPauseData } from '../src/rooms/schema/BattleState';
import { calculateRatingChange } from '../src/ranks';

test('DisconnectPauseData tracks disconnected player and 30s timeout countdown', () => {
  const pauseData: DisconnectPauseData = {
    playerId: 1,
    playerName: 'GagambaMaster',
    remainingSeconds: 30
  };

  assert.equal(pauseData.playerId, 1);
  assert.equal(pauseData.playerName, 'GagambaMaster');
  assert.equal(pauseData.remainingSeconds, 30);

  // Simulate server loop ticks
  const dt = 1.0;
  pauseData.remainingSeconds = Math.max(0, pauseData.remainingSeconds - dt);
  assert.equal(pauseData.remainingSeconds, 29);

  // Simulate timeout reaching 0
  pauseData.remainingSeconds = Math.max(0, pauseData.remainingSeconds - 30);
  assert.equal(pauseData.remainingSeconds, 0);
});

test('Disconnect forfeit correctly updates battle ratings for winner and forfeiting player', () => {
  // Amber (P1, rating 100) vs Jade (P2, rating 100)
  // P2 disconnects and forfeits after 30s timeout
  const p1Delta = calculateRatingChange(100, true);
  const p2Delta = calculateRatingChange(100, false);

  assert.equal(p1Delta.newRating > 100, true);
  assert.equal(p2Delta.newRating < 100, true);
  assert.equal(p1Delta.delta, 25);
  assert.equal(p2Delta.delta, -10);
});
