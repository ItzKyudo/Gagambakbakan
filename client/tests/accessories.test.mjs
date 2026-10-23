import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import { runInNewContext } from 'node:vm';
import { test } from 'node:test';

function loadGbSource() {
  const code = stripTypeScriptTypes(readFileSync(new URL('../src/gb.ts', import.meta.url), 'utf8'))
    .replace(/import\s*\{[\s\S]*?\}\s*from\s*['"][^'"]+['"];?/g, '')
    .replace(/^import .*;$/gm, '')
    .replaceAll('export const ', 'const ')
    .replaceAll('export function ', 'function ')
    .replaceAll('export interface ', 'interface ')
    .replaceAll('export type ', 'type ');

  const context = {
    console: { warn() {} },
    Math,
    Object,
    Set,
    Array,
    Number,
    Boolean,
    Date,
    ALL_ABILITY_IDS: ['dash', 'web', 'surge'],
    ABILITIES: {},
    isNodeAvailableToUnlock: () => true,
    getRankFromRating: () => ({ id: 'wolf-spider' }),
    lsGet: () => null,
    lsSet: () => {},
    decodePatternArt: () => [],
    outExports: {}
  };

  runInNewContext(code + '\noutExports.STANDARD_ACCS = STANDARD_ACCS;\noutExports.EXCLUSIVE_ACCS = EXCLUSIVE_ACCS;\noutExports.ACC_LEVELS = ACC_LEVELS;\noutExports.isAccessoryUnlocked = isAccessoryUnlocked;\noutExports.randomLook = randomLook;\noutExports.getProgress = getProgress;', context);
  return context.outExports;
}

test('standard accessories require level thresholds; exclusive accessories indicate exact top category with spire names', () => {
  const gb = loadGbSource();

  // 1. Level 1 player tests
  const lvl1None = gb.isAccessoryUnlocked('none', 1);
  assert.equal(lvl1None.unlocked, true);

  const lvl1Band = gb.isAccessoryUnlocked('band', 1);
  assert.equal(lvl1Band.unlocked, true);

  const lvl1Horns = gb.isAccessoryUnlocked('horns', 1);
  assert.equal(lvl1Horns.unlocked, false);
  assert.match(lvl1Horns.reqText, /Level 3/);

  const lvl1Halo = gb.isAccessoryUnlocked('halo', 1);
  assert.equal(lvl1Halo.unlocked, false);
  assert.match(lvl1Halo.reqText, /Level 45/);

  // 2. Grinding level up to Level 15
  const lvl15Strawhat = gb.isAccessoryUnlocked('strawhat', 15);
  assert.equal(lvl15Strawhat.unlocked, true);

  const lvl15Tophat = gb.isAccessoryUnlocked('tophat', 15);
  assert.equal(lvl15Tophat.unlocked, false);
  assert.match(lvl15Tophat.reqText, /Level 18/);

  // 3. Level 50 player without #1 podium
  const lvl50ApexNoPodium = gb.isAccessoryUnlocked('apex_crown', 50, { isTop1Rank: false, isTop1Level: false });
  assert.equal(lvl50ApexNoPodium.unlocked, false);
  assert.equal(lvl50ApexNoPodium.reqText, 'Top 1 Rank');

  const lvl50LaurelNoPodium = gb.isAccessoryUnlocked('mythic_laurel', 50, { isTop1Rank: false, isTop1Level: false });
  assert.equal(lvl50LaurelNoPodium.unlocked, false);
  assert.equal(lvl50LaurelNoPodium.reqText, 'Top 1 Level');

  // 4. #1 Rank Champion unlocks Crown of Spires (and not Laurel of Spires)
  const rankChampionApex = gb.isAccessoryUnlocked('apex_crown', 20, { isTop1Rank: true, isTop1Level: false });
  assert.equal(rankChampionApex.unlocked, true);
  assert.equal(rankChampionApex.reqText, 'Top 1 Rank Claimed');

  const rankChampionLaurel = gb.isAccessoryUnlocked('mythic_laurel', 20, { isTop1Rank: true, isTop1Level: false });
  assert.equal(rankChampionLaurel.unlocked, false);
  assert.equal(rankChampionLaurel.reqText, 'Top 1 Level');

  // 5. #1 Level Legend unlocks Laurel of Spires (and not Crown of Spires)
  const levelLegendLaurel = gb.isAccessoryUnlocked('mythic_laurel', 50, { isTop1Rank: false, isTop1Level: true });
  assert.equal(levelLegendLaurel.unlocked, true);
  assert.equal(levelLegendLaurel.reqText, 'Top 1 Level Claimed');

  const levelLegendApex = gb.isAccessoryUnlocked('apex_crown', 50, { isTop1Rank: false, isTop1Level: true });
  assert.equal(levelLegendApex.unlocked, false);
  assert.equal(levelLegendApex.reqText, 'Top 1 Rank');

  // 6. Dual #1 Champion unlocks both
  const dualChampionApex = gb.isAccessoryUnlocked('apex_crown', 50, { isTop1Rank: true, isTop1Level: true });
  assert.equal(dualChampionApex.unlocked, true);
  const dualChampionLaurel = gb.isAccessoryUnlocked('mythic_laurel', 50, { isTop1Rank: true, isTop1Level: true });
  assert.equal(dualChampionLaurel.unlocked, true);
});

test('randomLook never picks locked or exclusive accessories for a lower-level player', () => {
  const gb = loadGbSource();
  for (let i = 0; i < 50; i++) {
    const look = gb.randomLook(1, { isTop1Rank: false, isTop1Level: false });
    assert.ok(['none', 'band'].includes(look.acc), `Random look selected locked acc: ${look.acc}`);
  }
});

test('accessory registries contain valid unique entries with spire names and positive milestone requirements', () => {
  const gb = loadGbSource();
  const ids = new Set();
  for (const [id, label, lvl] of gb.STANDARD_ACCS) {
    assert.ok(!ids.has(id), `Duplicate standard acc id: ${id}`);
    ids.add(id);
    assert.ok(typeof label === 'string' && label.length > 0);
    assert.ok(Number.isInteger(lvl) && lvl >= 1);
  }
  for (const ex of gb.EXCLUSIVE_ACCS) {
    assert.ok(!ids.has(ex.id), `Duplicate exclusive acc id: ${ex.id}`);
    ids.add(ex.id);
    assert.ok(typeof ex.label === 'string' && ex.label.length > 0);
    assert.ok(ex.label.toLowerCase().includes('spire'), `Exclusive label must include spire: ${ex.label}`);
    assert.ok(ex.board === 'rank' || ex.board === 'level');
    assert.ok(ex.reqText.includes('Top 1'));
  }
});
