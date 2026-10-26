import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

test('no hybrid bilingual strings exist in assignment dialog or workspace', () => {
  const assignmentDialogPath = path.resolve(
    process.cwd(),
    'src/features/locations/components/assignment-dialog.tsx'
  );
  const content = fs.readFileSync(assignmentDialogPath, 'utf8');

  assert.ok(
    !content.includes('Giám sát hiện trường (Site Supervisor)'),
    'Should not contain hardcoded hybrid "Giám sát hiện trường (Site Supervisor)"'
  );
  assert.ok(
    !content.includes('Người kiểm duyệt (Approver)'),
    'Should not contain hardcoded hybrid "Người kiểm duyệt (Approver)"'
  );
});

test('campaign-workspace uses translated role options instead of raw english strings', () => {
  const workspacePath = path.resolve(
    process.cwd(),
    'src/features/campaigns/components/workspace/campaign-workspace.tsx'
  );
  const content = fs.readFileSync(workspacePath, 'utf8');

  assert.ok(
    !content.includes('<option value={CampaignRole.SUPERVISOR}>Supervisor</option>'),
    'Should not contain hardcoded option "Supervisor"'
  );
  assert.ok(
    !content.includes('<option value={CampaignRole.APPROVER}>Approver</option>'),
    'Should not contain hardcoded option "Approver"'
  );
});
