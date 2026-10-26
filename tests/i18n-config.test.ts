import { test } from 'node:test';
import assert from 'node:assert/strict';
import { locales, defaultLocale, isValidLocale } from '../src/i18n/config';

test('locales includes vi and en with vi as default', () => {
  assert.equal(defaultLocale, 'vi');
  assert.ok(locales.includes('vi'));
  assert.ok(locales.includes('en'));
  assert.equal(isValidLocale('vi'), true);
  assert.equal(isValidLocale('en'), true);
  assert.equal(isValidLocale('fr'), false);
  assert.equal(isValidLocale(''), false);
});
