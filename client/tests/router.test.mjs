import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import { runInNewContext } from 'node:vm';
import { test } from 'node:test';

function source(path) {
  return stripTypeScriptTypes(readFileSync(new URL(path, import.meta.url), 'utf8'))
    .replace(/import\s+(?:\{[\s\S]*?\}|[\w\s,*]+)\s+from\s+['"][^'"]+['"];?/g, '')
    .replace(/export /g, '');
}

test('router parses hash routes, path routes, and defaults to main', () => {
  const fakeWindow = {
    location: { hash: '#/play', pathname: '/' }
  };
  const context = { window: fakeWindow };
  runInNewContext(source('../src/router.ts'), context);

  assert.equal(context.getRoute(), 'play');

  fakeWindow.location.hash = '#/game';
  assert.equal(context.getRoute(), 'game');

  fakeWindow.location.hash = '#/match';
  assert.equal(context.getRoute(), 'game');

  fakeWindow.location.hash = '#/customize';
  assert.equal(context.getRoute(), 'customize');

  fakeWindow.location.hash = '';
  fakeWindow.location.pathname = '/play';
  assert.equal(context.getRoute(), 'play');

  fakeWindow.location.pathname = '/';
  assert.equal(context.getRoute(), 'main');

  context.setRoute('play');
  assert.equal(fakeWindow.location.hash, '#/play');

  context.setRoute('main');
  assert.equal(fakeWindow.location.hash, '#/');
});
