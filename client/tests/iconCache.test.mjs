import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { stripTypeScriptTypes } from 'node:module';
import { runInNewContext } from 'node:vm';
import { test } from 'node:test';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const clientDir = resolve(__dirname, '..');
const publicDir = resolve(clientDir, 'public');

function source(relPath) {
  return stripTypeScriptTypes(readFileSync(resolve(clientDir, relPath), 'utf8'))
    .replace(/import\s+(?:\{[\s\S]*?\}|[\w\s,*]+)\s+from\s+['"][^'"]+['"];?/g, '')
    .replace(/export /g, '');
}

test('all icon urls in iconCache exist in client/public directory', () => {
  const context = { window: {}, console };
  runInNewContext(source('src/iconCache.ts'), context);

  const allUrls = context.getAllIconUrls();
  assert.ok(Array.isArray(allUrls) && allUrls.length > 0, 'getAllIconUrls should return a non-empty array');

  // Verify all 16 abilities exist
  const expectedAbilities = [
    'anchor', 'carapace', 'dash', 'haste', 'hook', 'leech', 'mend', 'pounce',
    'power', 'riposte', 'shield', 'spit', 'surge', 'sweep', 'tremor', 'web'
  ];
  for (const ab of expectedAbilities) {
    const expectedPath = `/abilities/${ab}.png`;
    assert.ok(allUrls.includes(expectedPath), `Missing ability icon: ${expectedPath}`);
  }

  // Verify all files actually exist in public directory
  for (const url of allUrls) {
    const filePath = resolve(publicDir, url.replace(/^\//, ''));
    assert.ok(existsSync(filePath), `Public asset file does not exist: ${filePath} (from url ${url})`);
  }
});

test('priority icon urls are a subset of all icon urls and exist', () => {
  const context = { window: {}, console };
  runInNewContext(source('src/iconCache.ts'), context);

  const allUrls = new Set(context.getAllIconUrls());
  const priorityUrls = context.getPriorityIconUrls();

  assert.ok(Array.isArray(priorityUrls) && priorityUrls.length > 0);
  for (const url of priorityUrls) {
    assert.ok(allUrls.has(url), `Priority icon ${url} should be in ALL_ICON_URLS`);
    const filePath = resolve(publicDir, url.replace(/^\//, ''));
    assert.ok(existsSync(filePath), `Priority file missing on disk: ${filePath}`);
  }
});

test('initIconCache and cache warming execute gracefully with browser mocks', async () => {
  const storedInCache = new Map();
  const fakeCache = {
    match: async (url) => storedInCache.get(url),
    put: async (url, res) => { storedInCache.set(url, res); }
  };
  const fakeCaches = {
    open: async (name) => {
      assert.equal(name, 'gb-icons-cache-v1');
      return fakeCache;
    }
  };

  const registeredWorkers = [];
  const fakeNavigator = {
    serviceWorker: {
      register: async (script, opts) => {
        registeredWorkers.push({ script, opts });
        return {};
      }
    }
  };

  class FakeImage {
    constructor() {
      this.src = '';
      this.complete = true;
    }
    decode() {
      return Promise.resolve();
    }
  }

  const fakeWindow = {
    location: { protocol: 'http:', hostname: 'localhost' },
    caches: fakeCaches,
    addEventListener: (event, handler) => {
      if (event === 'load') handler();
    },
    requestIdleCallback: (cb) => cb()
  };

  const context = {
    window: fakeWindow,
    navigator: fakeNavigator,
    Image: FakeImage,
    fetch: async () => ({ ok: true, status: 200 }),
    console
  };

  runInNewContext(source('src/iconCache.ts'), context);

  context.initIconCache();

  // Verify service worker registration was triggered
  assert.equal(registeredWorkers.length, 1);
  assert.equal(registeredWorkers[0].script, '/sw.js');
  assert.equal(registeredWorkers[0].opts.scope, '/');

  // Test preloadIconImage
  const img = await context.preloadIconImage('/abilities/dash.png');
  assert.ok(img);
  assert.equal(img.src, '/abilities/dash.png');
  assert.equal(context.getCachedImage('/abilities/dash.png'), img);
});

test('service worker sw.js file exists and has valid syntax', () => {
  const swPath = resolve(publicDir, 'sw.js');
  assert.ok(existsSync(swPath), 'sw.js must exist in public folder');
  const content = readFileSync(swPath, 'utf8');
  assert.ok(content.includes('gb-icons-cache-v1'), 'sw.js must specify gb-icons-cache-v1');
  assert.ok(content.includes('isIconRequest'), 'sw.js must filter icon requests');
  assert.ok(content.includes('caches.match'), 'sw.js must check caches');

  // Verify it can be evaluated in JS context without syntax error
  const fakeSelf = {
    addEventListener: () => {},
    location: { origin: 'http://localhost:5173' }
  };
  runInNewContext(content, { self: fakeSelf, caches: {}, fetch: () => {}, console });
});
