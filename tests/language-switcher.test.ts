import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

test('LanguageSwitcher renders a segmented EN-VI pill button and avoids flag emojis', () => {
  const switcherPath = path.resolve(
    process.cwd(),
    'src/components/shared/language-switcher.tsx'
  );
  const content = fs.readFileSync(switcherPath, 'utf8');

  // Must not have the old emoji flags
  assert.ok(!content.includes('🇬🇧'), 'Should not contain flag emoji 🇬🇧');
  assert.ok(!content.includes('🇻🇳'), 'Should not contain flag emoji 🇻🇳');

  // Must contain EN and VI options
  assert.ok(content.includes("'en'"), 'Should support EN locale');
  assert.ok(content.includes("'vi'"), 'Should support VI locale');
  assert.ok(content.includes('EN'), 'Should display EN label');
  assert.ok(content.includes('VI'), 'Should display VI label');

  // Must have role="group" for segmented control accessibility
  assert.ok(content.includes('role="group"'), 'Should have role="group" for segmented pill');

  // Left-right ordering: EN appears before VI in the button group
  const enIndex = content.indexOf("'en'");
  const viIndex = content.indexOf("'vi'");
  assert.ok(enIndex < viIndex, 'EN option should be on the left (before VI)');
});
