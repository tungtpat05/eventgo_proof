import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

test('sidebar mobile navigation accommodates safe-area-inset-bottom', () => {
  const sidebarPath = path.resolve(process.cwd(), 'src/components/shared/sidebar.tsx');
  const content = fs.readFileSync(sidebarPath, 'utf8');
  assert.ok(
    content.includes('safe-area-inset-bottom') || content.includes('pb-safe'),
    'Must handle safe-area padding'
  );
});

test('globals.css provides safe area utility', () => {
  const cssPath = path.resolve(process.cwd(), 'src/app/globals.css');
  const content = fs.readFileSync(cssPath, 'utf8');
  assert.ok(
    content.includes('safe-area-inset-bottom') || content.includes('pb-safe'),
    'Must provide safe-area utilities'
  );
});

