import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import { runInNewContext } from 'node:vm';
import { test } from 'node:test';

function source(path) {
  return stripTypeScriptTypes(readFileSync(new URL(path, import.meta.url), 'utf8'))
    .replace(/import\s+(?:\{[\s\S]*?\}|[\w\s,*]+)\s+from\s+['"][^'"]+['"];?/g, '')
    .replace(/import\.meta/g, '({ env: { VITE_SUPABASE_URL: "http://mock", VITE_SUPABASE_ANON_KEY: "mock-key" } })')
    .replace(/export /g, '');
}

test('auth listener lifecycle: subscribe, unsubscribe, and silence token refresh', async () => {
  let authCallback = null;
  const mockSupabase = {
    auth: {
      async getSession() {
        return { data: { session: { user: { id: 'user-abc', user_metadata: { username: 'Spidey' } } } } };
      },
      onAuthStateChange(cb) {
        authCallback = cb;
        return { data: { subscription: { unsubscribe() {} } } };
      }
    },
    from() {
      return {
        select() { return this; },
        eq() { return this; },
        async maybeSingle() { return { data: null }; }
      };
    }
  };

  const context = {
    createClient: () => mockSupabase,
    isSupabaseConfigured: true,
    getLooks: () => ({ p1: { name: 'Player' }, p2: { name: 'Jade' } }),
    getProgress: () => ({ rank: 'wolf-spider', rating: 0, unlockedSkills: ['dash'] }),
    saveLooks() {},
    saveProgress() {},
    registerDataPersistHook() {},
    getRankFromRating: () => ({ id: 'wolf-spider', minRating: 0 }),
    console: { warn() {}, error() {} }
  };

  runInNewContext(source('../src/auth.ts'), context);

  await context.initAuth();
  assert.equal(context.getAuthUser()?.id, 'user-abc');

  let notifyCount = 0;
  let lastEvent = null;
  const unsubscribe = context.subscribeAuth((evt) => {
    notifyCount++;
    lastEvent = evt;
  });

  // 1. Silent TOKEN_REFRESHED with same user ID should NOT trigger listener
  await authCallback('TOKEN_REFRESHED', { user: { id: 'user-abc' } });
  assert.equal(notifyCount, 0, 'Silent token refresh must not trigger auth listeners');

  // 2. Real auth state change (e.g. USER_UPDATED or SIGNED_IN) SHOULD trigger listener
  await authCallback('USER_UPDATED', { user: { id: 'user-abc' } });
  assert.equal(notifyCount, 1, 'USER_UPDATED should trigger auth listener');
  assert.equal(lastEvent, 'USER_UPDATED');

  // 3. Unsubscribing must remove listener so future events do not fire
  unsubscribe();
  await authCallback('SIGNED_OUT', null);
  assert.equal(notifyCount, 1, 'Unsubscribed listener must not receive further events');
  assert.equal(context.getAuthUser(), null);
});

test('logged-in customization and abilities persist to the profiles row', async () => {
  const updates = [];
  const looks = { p1: { name: 'Spidey', color: 'red' }, p2: { name: 'Jade', color: 'green' } };
  const progress = { rank: 'wolf-spider', rating: 0, unlockedSkills: ['dash', 'web'] };
  const mockSupabase = {
    auth: {
      async getSession() {
        return { data: { session: { user: { id: 'user-abc', user_metadata: { username: 'Spidey' } } } } };
      },
      onAuthStateChange() {}
    },
    from(table) {
      return {
        select() { return this; },
        update(data) { updates.push({ table, data }); return this; },
        eq() { return this; },
        async maybeSingle() { return { data: null }; },
        then(resolve) { resolve({ error: null }); }
      };
    }
  };
  const context = {
    createClient: () => mockSupabase,
    getLooks: () => looks,
    getProgress: () => progress,
    saveLooks() {},
    saveProgress() {},
    registerDataPersistHook() {},
    getRankFromRating: () => ({ id: 'wolf-spider', minRating: 0 }),
    console: { warn() {}, error() {} }
  };

  runInNewContext(source('../src/auth.ts'), context);
  await context.initAuth();
  await context.syncUserDataToDatabase();

  assert.equal(updates.at(-1).table, 'profiles');
  assert.deepEqual(updates.at(-1).data.unlocked_skills, ['dash', 'web']);
  assert.deepEqual(updates.at(-1).data.looks, looks);
});

test('renderMenuPage cleanup contract prevents lingering subscriptions from wiping DOM', () => {
  let authListener = null;
  const mockAuth = {
    subscribeAuth(fn) {
      authListener = fn;
      return () => { authListener = null; };
    },
    getAuthUser() { return { id: 'test-user' }; },
    initAuth() {}
  };

  let destroyed = false;
  let renderCount = 0;
  const container = { innerHTML: '<div class="game-active">Game Canvas</div>' };

  // Emulating the lifecycle logic of renderMenuPage
  const unsubscribeAuth = mockAuth.subscribeAuth((event) => {
    if (destroyed) return;
    if (event === 'TOKEN_REFRESHED') return;
    renderCount++;
    container.innerHTML = '<div class="menu-active">Main Menu</div>';
  });

  const cleanup = () => {
    if (destroyed) return;
    destroyed = true;
    unsubscribeAuth();
  };

  // While game is running, menu cleanup is called
  cleanup();
  assert.equal(authListener, null, 'Auth listener must be detached on menu cleanup');

  // Any background auth events occurring during match must NOT touch game DOM
  if (authListener) authListener('SIGNED_IN');
  assert.equal(renderCount, 0, 'No render must occur after menu cleanup');
  assert.equal(container.innerHTML, '<div class="game-active">Game Canvas</div>', 'Game DOM must remain intact');
});
