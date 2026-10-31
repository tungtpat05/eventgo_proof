import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

test('sw.js exists and handles fetch events with offline fallback', () => {
  const swPath = path.resolve(process.cwd(), 'public/sw.js');
  assert.ok(fs.existsSync(swPath), 'public/sw.js must exist');
  const content = fs.readFileSync(swPath, 'utf8');
  assert.ok(content.includes("addEventListener('fetch'"), 'Must listen to fetch');
  assert.ok(content.includes('/~offline'), 'Must reference offline fallback');
});

test('offline fallback page exists', () => {
  const offlinePagePath = path.resolve(process.cwd(), 'src/app/~offline/page.tsx');
  assert.ok(fs.existsSync(offlinePagePath), 'src/app/~offline/page.tsx must exist');
});

test('service-worker-register component exists and handles registration', () => {
  const registerPath = path.resolve(process.cwd(), 'src/components/shared/service-worker-register.tsx');
  assert.ok(fs.existsSync(registerPath), 'Register component must exist');
  const content = fs.readFileSync(registerPath, 'utf8');
  assert.ok(content.includes('serviceWorker.register'), 'Must call serviceWorker.register');
});

