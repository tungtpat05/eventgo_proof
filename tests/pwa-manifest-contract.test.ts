import { test } from 'node:test';
import assert from 'node:assert/strict';
import manifest from '../src/app/manifest';

test('manifest returns correct PWA properties for standalone mobile launch', () => {
  const config = manifest();
  assert.equal(config.display, 'standalone');
  assert.equal(config.start_url, '/dashboard');
  assert.equal(config.theme_color, '#2563eb');
  assert.ok(Array.isArray(config.icons) && config.icons.length >= 2);
  const icon192 = config.icons.find((i) => i.sizes === '192x192');
  assert.ok(icon192, 'Manifest must have 192x192 icon');
  const icon512 = config.icons.find((i) => i.sizes === '512x512');
  assert.ok(icon512, 'Manifest must have 512x512 icon');
});

