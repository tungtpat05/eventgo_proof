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

function extractIcuParams(str: string): string[] {
  const params = new Set<string>();
  let depth = 0;
  for (let i = 0; i < str.length; i++) {
    if (str[i] === '{') {
      if (depth === 0) {
        const match = str.slice(i + 1).match(/^([a-zA-Z_][a-zA-Z0-9_]*)/);
        if (match) {
          params.add(match[1]);
        }
      }
      depth++;
    } else if (str[i] === '}') {
      if (depth > 0) depth--;
    }
  }
  return Array.from(params).sort();
}

function getKeysAndParams(obj: Record<string, any>, prefix = ''): { keys: string[]; params: Record<string, string[]> } {
  const keys: string[] = [];
  const params: Record<string, string[]> = {};

  for (const [k, v] of Object.entries(obj)) {
    const fullKey = prefix.length ? `${prefix}.${k}` : k;
    if (typeof v === 'object' && v !== null && !Array.isArray(v)) {
      const nested = getKeysAndParams(v, fullKey);
      keys.push(...nested.keys);
      Object.assign(params, nested.params);
    } else if (typeof v === 'string') {
      keys.push(fullKey);
      const icuParams = extractIcuParams(v);
      if (icuParams.length > 0) {
        params[fullKey] = icuParams;
      }
    }
  }

  return { keys, params };
}

test('vi and en catalogs have 100% identical key structures and ICU variables across all 10 namespaces', () => {
  const namespaces = [
    'common',
    'auth',
    'roles',
    'campaigns',
    'operations',
    'locations',
    'billing',
    'reports',
    'admin',
    'errors',
  ];
  for (const ns of namespaces) {
    const viPath = path.resolve(process.cwd(), `messages/vi/${ns}.json`);
    const enPath = path.resolve(process.cwd(), `messages/en/${ns}.json`);
    assert.ok(fs.existsSync(viPath), `Missing messages/vi/${ns}.json`);
    assert.ok(fs.existsSync(enPath), `Missing messages/en/${ns}.json`);

    const viData = getKeysAndParams(JSON.parse(fs.readFileSync(viPath, 'utf8')));
    const enData = getKeysAndParams(JSON.parse(fs.readFileSync(enPath, 'utf8')));

    assert.deepEqual(viData.keys.sort(), enData.keys.sort(), `Key mismatch in namespace ${ns}`);

    for (const key of Object.keys(viData.params)) {
      assert.deepEqual(
        viData.params[key],
        enData.params[key],
        `ICU variable mismatch in ${ns}.${key}: vi has [${viData.params[key]}] but en has [${enData.params[key]}]`
      );
    }
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

test('en catalogs contain zero untranslated Vietnamese diacritic characters', () => {
  const namespaces = [
    'common',
    'auth',
    'roles',
    'campaigns',
    'operations',
    'locations',
    'billing',
    'reports',
    'admin',
    'errors',
  ];
  const viDiacriticsRegex = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ]/;

  for (const ns of namespaces) {
    const enPath = path.resolve(process.cwd(), `messages/en/${ns}.json`);
    const enData = getKeysAndParams(JSON.parse(fs.readFileSync(enPath, 'utf8')));
    const rawContent = fs.readFileSync(enPath, 'utf8');
    const parsed = JSON.parse(rawContent);

    function checkObject(obj: any, pathStr = '') {
      for (const [k, v] of Object.entries(obj)) {
        const curPath = pathStr ? `${pathStr}.${k}` : k;
        if (typeof v === 'string') {
          const match = v.match(viDiacriticsRegex);
          assert.ok(
            !match,
            `Namespace ${ns}.${curPath} contains Vietnamese character "${match?.[0]}" in English catalog: "${v}"`
          );
        } else if (typeof v === 'object' && v !== null) {
          checkObject(v, curPath);
        }
      }
    }
    checkObject(parsed);
  }
});

test('vi catalogs contain no raw hybrid role tokens like (Supervisor) or (Approver)', () => {
  const namespaces = [
    'common',
    'auth',
    'roles',
    'campaigns',
    'operations',
    'locations',
    'billing',
    'reports',
    'admin',
    'errors',
  ];
  const hybridTokens = ['(Supervisor)', '(Approver)', '(Manager)', '(Admin)'];

  for (const ns of namespaces) {
    const viPath = path.resolve(process.cwd(), `messages/vi/${ns}.json`);
    const raw = fs.readFileSync(viPath, 'utf8');
    for (const token of hybridTokens) {
      assert.ok(
        !raw.includes(token),
        `messages/vi/${ns}.json should not contain hybrid token "${token}"`
      );
    }
  }
});
