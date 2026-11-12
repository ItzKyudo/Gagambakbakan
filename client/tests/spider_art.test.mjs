import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import { runInNewContext } from 'node:vm';
import { test } from 'node:test';

const source = readFileSync(new URL('../src/gb.ts', import.meta.url), 'utf8');
const svgFunction = source.slice(source.indexOf('export function spiderSVGraw('), source.indexOf('export function spiderSVG('));
const context = {
  getColor: () => ({ main: '#f2a33a', dark: '#8f4f14', light: '#ffd694' }),
  accessoryMarkup: () => '',
  customPatternSVG: () => ''
};
runInNewContext(stripTypeScriptTypes(svgFunction).replace('export ', ''), context);

test('five spider species keep the original body and gain distinct equipment', () => {
  const spiders = ['weaver', 'hunter', 'guardian', 'wolf', 'lynx'].map(species =>
    context.spiderSVGraw({ species, color: 'amber', pattern: 'plain', acc: 'none', customPattern: '' })
  );
  assert.equal(new Set(spiders).size, 5);
  for (const svg of spiders) {
    assert.match(svg, /<svg.*class="spider-art"/);
    assert.match(svg, /M41 94 C40 70 59 55 87 54/);
  }
  for (const species of ['weaver', 'hunter', 'guardian', 'wolf', 'lynx']) {
    const look = { species, color: 'amber', pattern: 'plain', acc: 'none', customPattern: '' };
    assert.doesNotMatch(context.spiderSVGraw(look, 1), /class="spider-upgrade"/);
    assert.match(context.spiderSVGraw(look, 5), /class="spider-upgrade"/);
    assert.match(context.spiderSVGraw(look, 10), /fill="#4b5664"/);
    assert.notEqual(context.spiderSVGraw(look, 5), context.spiderSVGraw(look, 10));
    assert.notEqual(context.spiderSVGraw(look, 10), context.spiderSVGraw(look, 15));
    const elite = context.spiderSVGraw(look, 15);
    assert.equal((elite.match(/<g(?:\s|>)/g) || []).length, (elite.match(/<\/g>/g) || []).length);
  }
});
