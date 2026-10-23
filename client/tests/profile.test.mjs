import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import { runInNewContext } from 'node:vm';
import { test } from 'node:test';

function source(path) {
  return stripTypeScriptTypes(readFileSync(new URL(path, import.meta.url), 'utf8'))
    .replace(/^import .*;$/gm, '').replace(/export /g, '');
}

test('match history keeps account, slot, mode and score; fetches every page; reports failures', async () => {
  let user = { id: 'account-1' };
  let failure = false;
  const inserts = [];
  const filters = [];
  const pages = [];
  const context = {
    getAuthUser: () => user,
    crypto: { randomUUID: () => 'unique-match' },
    console: { warn() {} },
    supabase: { from(table) {
      assert.equal(table, 'match_history');
      return {
        async insert(rows) { inserts.push(rows); return { error: failure ? new Error('offline') : null }; },
        select() { return this; },
        eq(key, value) { filters.push([key, value]); return this; },
        order() { return this; },
        async range(start, end) { pages.push([start, end]); return failure ? { error: new Error('offline') }
          : { data: start === 0 ? Array.from({ length: 1000 }, () => ({ won: true })) : [{ won: false }] }; }
      };
    } }
  };
  runInNewContext(source('../src/matchHistory.ts'), context);
  await context.saveMatchHistory([{ player_slot: 'p2', mode: '2p', opponent: 'Amber', won: true, rounds_won: 2, rounds_lost: 1 }]);
  assert.equal(inserts[0][0].user_id, 'account-1');
  assert.equal(inserts[0][0].player_slot, 'p2');
  assert.equal(inserts[0][0].mode, '2p');
  assert.equal(inserts[0][0].rounds_lost, 1);
  assert.ok(Date.parse(inserts[0][0].played_at));
  const records = await context.fetchMatchHistory('p2');
  assert.equal(records.length, 1001);
  assert.deepEqual(pages, [[0, 999], [1000, 1999]]);
  assert.deepEqual(filters[0], ['user_id', 'account-1']);
  assert.deepEqual(filters[1], ['player_slot', 'p2']);
  const stats = context.summarizeMatches([{ won: true }, { won: false }, { won: true }]);
  assert.equal(stats.wins, 2);
  assert.equal(stats.losses, 1);
  assert.equal(stats.winRate, 67);
  assert.equal(context.summarizeMatches([]).winRate, 0);
  failure = true;
  await assert.rejects(context.fetchMatchHistory('p1'), /offline/);
  user = null;
  await context.saveMatchHistory([]);
  assert.equal(inserts.length, 1);
  await assert.rejects(context.fetchMatchHistory('p1'), /Sign in/);
});

test('profile abilities are visible and read-only; Player 2 has no account rank', () => {
  const context = {
    getProgress: () => ({ rating: 400, onlineExp: 100 }),
    getLevel: () => 2,
    getUnlockedIds: () => ['dash'],
    getRankFromRating: () => ({ id: 'huntsman-spider', species: 'Huntsman Spider', title: 'Nightmare Prowler' }),
    renderRankBadgeSVG: () => '<img class="rank-badge-svg">',
    RANK_RATING_LABEL: 'Venom',
    MATCH_MODES: { cpu: 'vs AI', '2p': 'Local PvP', online: 'Casual online', ranked: 'Ranked' },
    SKILLS_LIST: [{ id: 'dash', name: 'Dash', desc: 'A quick hop.', icon: 'ic-dash', cd: 3, use: 'stand' },
      { id: 'web', name: 'Web', desc: 'Trap.', icon: 'ic-web', cd: 5, use: 'stand' }]
  };
  runInNewContext(source('../src/ui/menu/profileView.ts'), context);
  const html = context.renderProfileView('p1');
  assert.match(html, /Nightmare Prowler/);
  assert.match(html, /data-profile-mode="ranked"/);
  assert.match(html, /<strong>400<\/strong> Venom/);
  assert.match(html, /profile-rank-bottom/);
  assert.doesNotMatch(html, /profile-rank-desc/);
  const abilities = html.split('<ul class="profile-abilities">')[1];
  assert.match(abilities, /Dash/);
  assert.doesNotMatch(abilities, /<button|<input|<details|Trap\./);
  const p2 = context.renderProfileView('p2');
  assert.doesNotMatch(p2, /rank-badge-svg|Nightmare Prowler|data-profile-mode="ranked"/);
  assert.match(p2, /shared ability pool/);
});
