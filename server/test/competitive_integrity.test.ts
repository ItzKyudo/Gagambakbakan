import assert from 'node:assert/strict';
import test from 'node:test';

process.env.SUPABASE_URL = 'https://game.example';
process.env.SUPABASE_ANON_KEY = 'public-test-key';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'server-test-key';

const { authenticateBattle, levelFromExp, recordBattleResult } = require('../src/competitiveStore');
const { BattleRoom } = require('../src/rooms/BattleRoom');

test('account identity and progression come from verified profile, never join options', async () => {
  const originalFetch = globalThis.fetch;
  const calls: string[] = [];
  globalThis.fetch = async (input, init) => {
    const path = String(input);
    calls.push(path);
    if (path.endsWith('/auth/v1/user')) {
      assert.equal(new Headers(init?.headers).get('Authorization'), 'Bearer real-token');
      return Response.json({ id: 'user-1' });
    }
    if (path.includes('/rest/v1/profiles?id=')) return Response.json([{
      id: 'user-1', username: 'Verified', rating: 810, online_exp: 100,
      unlocked_skills: ['dash', 'surge', 'anchor', 'haste']
    }]);
    throw new Error(`Unexpected request: ${path}`);
  };
  try {
    const options = {
      name: 'Fake', rank: 'brown-widow', rating: 5000, level: 100,
      unlockedSkills: ['dash', 'surge', 'anchor', 'haste'],
      isRanked: true, acc: 'none'
    };
    const identity = await BattleRoom.onAuth('real-token', options, { ip: 'test-verified-1' } as any) as any;
    assert.equal(identity.userId, 'user-1');
    assert.equal(options.name, 'Verified');
    assert.equal(options.rank, 'philippine-tarantula');
    assert.equal(options.rating, 810);
    assert.equal(options.level, 2);
    assert.deepEqual(options.unlockedSkills, ['dash', 'surge', 'anchor']);
    assert.equal(calls.length, 2);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('ranked requires a token; guests get level-one casual skills', async () => {
  await assert.rejects(authenticateBattle(undefined, true), /Sign in/);
  const guest = await authenticateBattle(undefined, false);
  assert.equal(guest.rating, 0);
  assert.equal(guest.level, 1);
  assert.equal(guest.isRanked, false);
  assert.deepEqual(guest.unlockedSkills, ['dash', 'web', 'surge']);
  assert.equal(levelFromExp(3850), 12);
  assert.equal(levelFromExp(4500), 13);
});

test('online results are sent to the server-only database RPC', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input, init) => {
    assert.equal(String(input), 'https://game.example/rest/v1/rpc/record_battle_result');
    assert.equal(new Headers(init?.headers).get('apikey'), 'server-test-key');
    assert.deepEqual(JSON.parse(String(init?.body)), {
      p_match_id: 'match-1', p_p1: 'user-1', p_p2: 'user-2', p_winner: 0,
      p_p1_rounds: 2, p_p2_rounds: 1, p_ranked: true
    });
    return Response.json({ recorded: true });
  };
  try {
    await recordBattleResult('match-1', 'user-1', 'user-2', 0, 2, 1, true);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('five tied rounds end as a draw instead of repeating forever', () => {
  const room = Object.create(BattleRoom.prototype) as any;
  let finished = 0;
  room.battleState = {
    round: 5, status: 'roundEnd', p1: { wins: 0, grip: 120, guard: 100 },
    p2: { wins: 0, grip: 120, guard: 100 }
  };
  room.finishMatch = () => { finished++; };
  room.endRound();
  assert.equal(room.battleState.status, 'matchEnd');
  assert.equal(room.battleState.winner, -1);
  assert.equal(finished, 1);
});

test('join ignores forged level, rating, skills, and exclusive accessory', async () => {
  const guest = await authenticateBattle(undefined, false);
  const room = Object.create(BattleRoom.prototype) as any;
  room.battleState = { status: 'waiting', p1: { id: 0, connected: false }, p2: { id: 1, connected: false } };
  room.playerInputs = new Map();
  const client = { sessionId: 'guest-session', auth: guest, send() {} };
  room.onJoin(client, {
    name: 'Guest', level: 100, rating: 9000, rank: 'brown-widow',
    unlockedSkills: ['dash', 'surge', 'anchor', 'haste'], acc: 'apex_crown', isRanked: true
  });
  assert.equal(room.battleState.p1.level, 1);
  assert.equal(room.battleState.p1.rating, 0);
  assert.equal(room.battleState.p1.acc, 'none');
  assert.equal(room.battleState.p1.isRanked, false);
  assert.deepEqual(room.battleState.p1.unlockedSkills, ['dash', 'web', 'surge']);
  room.battleState.p1.connected = false;
  room.battleState.p1.acc = 'apex_crown';
  room.onJoin(client, { name: 'Guest', acc: 'invalid' });
  assert.equal(room.battleState.p1.acc, 'none');
});
