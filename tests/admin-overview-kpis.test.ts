import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { SubscriptionPlanTier, SubscriptionStatus } from '../src/domain/enums';

test('admin overview KPI logic correctly counts active and paid subscriptions', () => {
  const subscriptions = [
    { id: '1', plan: SubscriptionPlanTier.PRO, status: SubscriptionStatus.ACTIVE },
    { id: '2', plan: SubscriptionPlanTier.STARTER, status: SubscriptionStatus.ACTIVE },
    { id: '3', plan: SubscriptionPlanTier.FREE, status: SubscriptionStatus.ACTIVE },
    { id: '4', plan: SubscriptionPlanTier.PRO, status: SubscriptionStatus.EXPIRED },
    { id: '5', plan: SubscriptionPlanTier.STARTER, status: SubscriptionStatus.CANCELED },
  ];

  const activeSubscriptions = subscriptions.filter(
    (s) => s.status === SubscriptionStatus.ACTIVE
  ).length;

  const paidSubscriptions = subscriptions.filter(
    (s) => s.status === SubscriptionStatus.ACTIVE && s.plan !== SubscriptionPlanTier.FREE
  ).length;

  assert.equal(activeSubscriptions, 3);
  assert.equal(paidSubscriptions, 2);
});

test('admin overview contracts: totalBooths is replaced by paidSubscribers in page.tsx and admin-actions.ts', () => {
  const actionsPath = path.resolve(process.cwd(), 'src/features/admin/actions/admin-actions.ts');
  const actionsContent = fs.readFileSync(actionsPath, 'utf8');

  // Must not query booths anymore
  assert.ok(!actionsContent.includes("from('booths')"), "admin-actions.ts should not query 'booths' table");
  assert.ok(actionsContent.includes('paidSubscriptions'), 'admin-actions.ts must return paidSubscriptions');

  const pagePath = path.resolve(process.cwd(), 'src/app/(admin)/admin/dashboard/page.tsx');
  const pageContent = fs.readFileSync(pagePath, 'utf8');

  assert.ok(!pageContent.includes('kpiTotalBooths'), 'page.tsx should not reference kpiTotalBooths');
  assert.ok(!pageContent.includes('totalBooths'), 'page.tsx should not reference totalBooths');
  assert.ok(pageContent.includes('kpiPaidSubscribers'), 'page.tsx must reference kpiPaidSubscribers');
  assert.ok(pageContent.includes('kpiConversionRateBadge'), 'page.tsx must reference kpiConversionRateBadge');
});

test('admin i18n catalogs: contain kpiPaidSubscribers and removed booth KPIs', () => {
  const viAdmin = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'messages/vi/admin.json'), 'utf8'));
  const enAdmin = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'messages/en/admin.json'), 'utf8'));

  assert.ok(viAdmin.dashboard.kpiPaidSubscribers, 'VI must have kpiPaidSubscribers');
  assert.ok(enAdmin.dashboard.kpiPaidSubscribers, 'EN must have kpiPaidSubscribers');
  assert.ok(viAdmin.dashboard.kpiPaidSubscriptionsDesc, 'VI must have kpiPaidSubscriptionsDesc');
  assert.ok(enAdmin.dashboard.kpiPaidSubscriptionsDesc, 'EN must have kpiPaidSubscriptionsDesc');
  assert.ok(viAdmin.dashboard.kpiConversionRateBadge, 'VI must have kpiConversionRateBadge');
  assert.ok(enAdmin.dashboard.kpiConversionRateBadge, 'EN must have kpiConversionRateBadge');

  assert.equal(viAdmin.dashboard.kpiTotalBooths, undefined, 'VI should not have kpiTotalBooths');
  assert.equal(enAdmin.dashboard.kpiTotalBooths, undefined, 'EN should not have kpiTotalBooths');
});
