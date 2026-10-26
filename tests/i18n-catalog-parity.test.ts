import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  CampaignRole,
  SubmissionStatus,
  CampaignStatus,
  CampaignMemberStatus,
  CampaignInviteStatus,
  ChecklistCategory,
} from '../src/domain/enums';
import {
  getRoleLabel,
  getSubmissionStatusLabel,
  getCampaignStatusLabel,
  getMemberStatusLabel,
  getChecklistCategoryLabel,
} from '../src/lib/i18n/enum-presenters';

function getKeys(obj: Record<string, any>, prefix = ''): string[] {
  return Object.keys(obj).reduce((acc: string[], k) => {
    const pre = prefix.length ? prefix + '.' : '';
    if (typeof obj[k] === 'object' && obj[k] !== null && !Array.isArray(obj[k])) {
      acc.push(...getKeys(obj[k], pre + k));
    } else {
      acc.push(pre + k);
    }
    return acc;
  }, []);
}

test('vi and en catalogs have 100% identical key structures across all namespaces', () => {
  const namespaces = ['common', 'roles', 'campaigns', 'operations', 'admin'];
  for (const ns of namespaces) {
    const viPath = path.resolve(process.cwd(), `messages/vi/${ns}.json`);
    const enPath = path.resolve(process.cwd(), `messages/en/${ns}.json`);
    assert.ok(fs.existsSync(viPath), `Missing messages/vi/${ns}.json`);
    assert.ok(fs.existsSync(enPath), `Missing messages/en/${ns}.json`);

    const viKeys = getKeys(JSON.parse(fs.readFileSync(viPath, 'utf8'))).sort();
    const enKeys = getKeys(JSON.parse(fs.readFileSync(enPath, 'utf8'))).sort();
    assert.deepEqual(viKeys, enKeys, `Key mismatch in namespace ${ns}`);
  }
});

test('enum presenter returns translated string for every role and status', () => {
  const fakeTRoles = (key: string) => `trans_${key}`;
  for (const role of Object.values(CampaignRole)) {
    const label = getRoleLabel(role, fakeTRoles);
    assert.ok(label.startsWith('trans_'), `Failed to translate role ${role}`);
  }
  for (const status of Object.values(SubmissionStatus)) {
    const label = getSubmissionStatusLabel(status, fakeTRoles);
    assert.ok(label.startsWith('trans_'), `Failed to translate submission status ${status}`);
  }
  for (const status of Object.values(CampaignStatus)) {
    const label = getCampaignStatusLabel(status, fakeTRoles);
    assert.ok(label.startsWith('trans_'), `Failed to translate campaign status ${status}`);
  }
  for (const status of Object.values(CampaignMemberStatus)) {
    const label = getMemberStatusLabel(status, fakeTRoles);
    assert.ok(label.startsWith('trans_'), `Failed to translate member status ${status}`);
  }
  for (const cat of Object.values(ChecklistCategory)) {
    const label = getChecklistCategoryLabel(cat, fakeTRoles);
    assert.ok(label.startsWith('trans_'), `Failed to translate checklist category ${cat}`);
  }
});
