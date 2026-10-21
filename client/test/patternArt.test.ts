import assert from 'node:assert/strict';
import test from 'node:test';
import { decodePatternArt, encodePatternArt } from '../src/patternArt';

test('round-trips multicolor body strokes', () => {
  const encoded = encodePatternArt([
    { color: '#E8593F', points: [[0, 0], [.5, .75]] },
    { color: '#00cec9', points: [[1, 1]] }
  ]);
  assert.deepEqual(decodePatternArt(encoded), [
    { color: '#e8593f', points: [[0, 0], [.5, .75]] },
    { color: '#00cec9', points: [[1, 1]] }
  ]);
});

test('rejects malformed or out-of-body coordinate data', () => {
  assert.deepEqual(decodePatternArt('ffffff:ff00'), []);
  assert.deepEqual(decodePatternArt('ffffff:<script>'), []);
});
