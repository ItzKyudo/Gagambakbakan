import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import { runInNewContext } from 'node:vm';
import { test } from 'node:test';

const source = stripTypeScriptTypes(readFileSync(new URL('../src/ui/menu/leaderboardView.ts', import.meta.url), 'utf8'))
  .replace(/^import .*;$/gm, '').replaceAll('export function', 'function');

test('leaderboard queries, states, safe names, and stale responses', async () => {
  const pending = [];
  const queries = [];
  const element = () => ({ textContent: '', hidden: false, children: {}, querySelector(key) { return this.children[key] ??= element(); }, addEventListener(_, fn) { this.click = fn; }, focus() {} });
  const buttons = ['online_exp', 'rating'].map(board => ({ ...element(), dataset: { board }, setAttribute(key, value) { this[key] = value; } }));
  const body = { rows: [], replaceChildren() { this.rows = []; }, insertRow() {
    const row = { cells: [], insertCell() { const cell = element(); this.cells.push(cell); return cell; } };
    this.rows.push(row);
    return row;
  } };
  const table = { ...element(), caption: element(), tHead: { rows: [{ cells: [element(), element(), element()] }] }, tBodies: [body] };
  const nodes = { '#leaderboardStatus': element(), '#leaderboardRetry': element(), '#leaderboardDescription': element(), h1: element(), table };
  const page = { isConnected: true, querySelector: key => nodes[key], querySelectorAll: () => buttons };
  const context = {
    supabase: { from(name) {
      const query = { name, orders: [] };
      queries.push(query);
      return {
        select(columns) { query.columns = columns; return this; },
        order(column, options) { query.orders.push({ column, ...options }); return this; },
        limit(limit) { query.limit = limit; return new Promise(resolve => pending.push(resolve)); }
      };
    } },
    getLevel: exp => exp >= 100 ? 2 : 1,
    getRankFromRating: () => ({ id: 'wolf-spider', species: 'Wolf Spider', title: 'Grave Stalker' }),
    renderRankBadgeSVG: id => `<img src="/ranks/${id}.svg">`,
    renderPodiumBadge: (board, place) => `<img class="leaderboard-podium-badge" src="/leaderboard-badges/${board}-${place}.svg" alt="Place ${place}">`,
    SKILLS_LIST: [{ id: 'dash', name: 'Dash', icon: 'ic-dash', desc: 'A quick hop.' }],
    RANK_RATING_LABEL: 'Venom'
  };
  runInNewContext(source, context);
  context.bindLeaderboardEvents({ querySelector: () => page });
  assert.match(nodes['#leaderboardStatus'].textContent, /Loading/);
  assert.equal(queries[0].name, 'profiles');
  assert.equal(queries[0].columns, 'username, online_exp, rating');
  assert.equal(queries[0].orders[0].column, 'online_exp');
  assert.equal(queries[0].orders[0].ascending, false);
  assert.equal(queries[0].orders[0].nullsFirst, false);
  assert.equal(queries[0].orders[1].column, 'username');
  assert.equal(queries[0].limit, 10);
  pending.shift()({ data: [{ username: '<img onerror=alert(1)>', online_exp: 100, rating: 25, unlocked_skills: ['dash', 'dash', '<script>'], wins: 3, losses: 1 }] });
  await new Promise(setImmediate);
  const identity = body.rows[0].cells[1];
  assert.equal(identity.querySelector('.leaderboard-name').textContent, '<img onerror=alert(1)>');
  assert.doesNotMatch(identity.innerHTML, /onerror|<script>/);
  assert.doesNotMatch(identity.innerHTML, /ability|Dash|win rate|wolf-spider|Grave Stalker/);
  assert.equal(body.rows[0].className, 'leaderboard-place-1');
  assert.match(body.rows[0].cells[0].innerHTML, /leaderboard-badges\/level-1\.svg/);
  assert.match(body.rows[0].cells[2].innerHTML, /Level 2/);
  assert.doesNotMatch(body.rows[0].cells[2].innerHTML, /Venom/);
  buttons[1].click();
  assert.equal(queries[1].orders[0].column, 'rating');
  pending.shift()({ data: [
    { username: 'Spider 1', rating: 25 },
    { username: 'Spider 2', rating: 20 },
    { username: 'Spider 3', rating: 15 },
    { username: 'Spider 4', rating: 10 }
  ] });
  await new Promise(setImmediate);
  assert.match(body.rows[0].cells[0].innerHTML, /leaderboard-badges\/rank-1\.svg/);
  assert.equal(body.rows[3].cells[0].textContent, '4');
  assert.match(body.rows[0].cells[2].innerHTML, /<strong>25 Venom<\/strong>/);
  assert.match(body.rows[0].cells[1].innerHTML, /wolf-spider.svg/);
  assert.match(body.rows[0].cells[1].innerHTML, /Grave Stalker/);
  assert.doesNotMatch(body.rows[0].cells[2].innerHTML, /Level|EXP/);
  buttons[0].click();
  buttons[1].click();
  pending.pop()({ data: [] });
  await new Promise(setImmediate);
  pending.shift()({ error: new Error('stale') });
  await new Promise(setImmediate);
  assert.match(nodes['#leaderboardStatus'].textContent, /No players/);
  assert.equal(table.hidden, true);
  buttons[1].click();
  pending.shift()({ error: new Error('offline') });
  await new Promise(setImmediate);
  assert.equal(nodes['#leaderboardRetry'].hidden, false);
  nodes['#leaderboardRetry'].click();
  page.isConnected = false;
  pending.shift()({ data: [] });
  await new Promise(setImmediate);
  assert.match(nodes['#leaderboardStatus'].textContent, /Loading/);
  context.supabase = null;
  context.bindLeaderboardEvents({ querySelector: () => page });
  assert.match(nodes['#leaderboardStatus'].textContent, /not configured/);
});

test('six distinct podium badges; no badge outside top three', () => {
  const source = stripTypeScriptTypes(readFileSync(new URL('../src/ui/menu/leaderboardBadge.ts', import.meta.url), 'utf8'))
    .replaceAll('export function', 'function');
  const context = {};
  runInNewContext(source, context);
  const assets = new Set();
  for (const board of ['level', 'rank']) {
    for (const place of [1, 2, 3]) {
      const markup = context.renderLeaderboardBadge(board, place);
      assert.match(markup, new RegExp(`${board}-${place}.svg`));
      assert.match(markup, new RegExp(`#${place}`));
      const podium = context.renderPodiumBadge(board, place);
      assert.match(podium, new RegExp(`${board}-${place}.svg`));
      assert.match(podium, /leaderboard-podium-badge/);
      const asset = readFileSync(new URL(`../public/leaderboard-badges/${board}-${place}.svg`, import.meta.url), 'utf8');
      assert.match(asset, /<svg/);
      assets.add(asset);
    }
    for (const place of [0, -1, 4, 10, 1.5, NaN]) {
      assert.equal(context.renderLeaderboardBadge(board, place), '');
      assert.equal(context.renderPodiumBadge(board, place), '');
    }
  }
  assert.equal(assets.size, 6);
});
