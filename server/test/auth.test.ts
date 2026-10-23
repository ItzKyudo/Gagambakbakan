import assert from 'node:assert/strict';
import test from 'node:test';
import { validateUsername } from '../src/auth';

test('validateUsername accepts valid usernames', () => {
  assert.equal(validateUsername('Talon').ok, true);
  assert.equal(validateUsername('Spider_99').ok, true);
  assert.equal(validateUsername('  Amber_1  ').clean, 'Amber_1');
  assert.equal(validateUsername('Abc').ok, true);
  assert.equal(validateUsername('1234567890').ok, true);
});

test('validateUsername rejects invalid or dangerous usernames', () => {
  assert.equal(validateUsername('').ok, false);
  assert.equal(validateUsername('ab').ok, false);
  assert.equal(validateUsername('waytoolongname123').ok, false);
  assert.equal(validateUsername('has space').ok, false);
  assert.equal(validateUsername('<script>').ok, false);
  assert.equal(validateUsername('user!@#').ok, false);
});
