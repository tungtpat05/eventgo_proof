import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

test('pwa-install-banner component exists and handles standalone checks', () => {
  const componentPath = path.resolve(process.cwd(), 'src/components/shared/pwa-install-banner.tsx');
  assert.ok(fs.existsSync(componentPath), 'Component must exist');
  const content = fs.readFileSync(componentPath, 'utf8');
  assert.ok(content.includes('beforeinstallprompt'), 'Must handle beforeinstallprompt');
  assert.ok(content.includes('display-mode: standalone'), 'Must check standalone mode');
});

test('pwa-install-banner is mounted in dashboard layout', () => {
  const layoutPath = path.resolve(process.cwd(), 'src/app/(dashboard)/layout.tsx');
  assert.ok(fs.existsSync(layoutPath), 'Dashboard layout must exist');
  const content = fs.readFileSync(layoutPath, 'utf8');
  assert.ok(content.includes('PwaInstallBanner'), 'Dashboard layout must include PwaInstallBanner');
});

