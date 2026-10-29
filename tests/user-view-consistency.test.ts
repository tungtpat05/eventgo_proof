import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

test('Sidebar contains Báo cáo (Reports) link and routes to /reports', () => {
  const sidebarPath = path.resolve(process.cwd(), 'src/components/shared/sidebar.tsx');
  const content = fs.readFileSync(sidebarPath, 'utf8');

  assert.ok(content.includes("href: '/reports'"), 'Sidebar must have href: /reports');
  assert.ok(content.includes("t('nav.reports')"), "Sidebar must use t('nav.reports')");
  assert.ok(content.includes('BarChart3'), 'Sidebar must use BarChart3 icon for reports');
});

test('Header getClientBreadcrumb handles /reports and /locations', () => {
  const headerPath = path.resolve(process.cwd(), 'src/components/shared/header.tsx');
  const content = fs.readFileSync(headerPath, 'utf8');

  assert.ok(
    content.includes("pathname.startsWith('/reports')"),
    'Header breadcrumb must check /reports'
  );
  assert.ok(
    content.includes("t('breadcrumbs.reports')"),
    'Header breadcrumb must return t(breadcrumbs.reports)'
  );
  assert.ok(
    content.includes("pathname.startsWith('/locations')"),
    'Header breadcrumb must check /locations'
  );
  assert.ok(
    content.includes("t('breadcrumbs.locations')"),
    'Header breadcrumb must return t(breadcrumbs.locations)'
  );
});

test('Supervision page uses SupervisionCampaignList with KPIs, search, status tabs and pagination', () => {
  const pagePath = path.resolve(process.cwd(), 'src/app/(dashboard)/campaigns/supervision/page.tsx');
  const pageContent = fs.readFileSync(pagePath, 'utf8');

  assert.ok(
    pageContent.includes('SupervisionCampaignList'),
    'Supervision page must mount SupervisionCampaignList'
  );
  assert.ok(
    pageContent.includes('assignedBoothsCountByCampaign'),
    'Supervision page must compute assignedBoothsCount per campaign'
  );

  const compPath = path.resolve(
    process.cwd(),
    'src/features/campaigns/components/supervision-campaign-list.tsx'
  );
  const compContent = fs.readFileSync(compPath, 'utf8');

  assert.ok(compContent.includes('TablePagination'), 'SupervisionCampaignList must use TablePagination');
  assert.ok(compContent.includes('kpiTotalCampaigns'), 'SupervisionCampaignList must display KPI total campaigns');
  assert.ok(compContent.includes('kpiActive'), 'SupervisionCampaignList must display KPI active');
  assert.ok(compContent.includes('kpiTotalBooths'), 'SupervisionCampaignList must display KPI total booths');
  assert.ok(compContent.includes('tabActive'), 'SupervisionCampaignList must have status filter tabs');
  assert.ok(compContent.includes('searchQuery'), 'SupervisionCampaignList must support search filter');
});

test('Approvals page uses ApprovalCampaignList with KPIs, search, status tabs, pagination and local pending review count', () => {
  const pagePath = path.resolve(process.cwd(), 'src/app/(dashboard)/campaigns/approvals/page.tsx');
  const pageContent = fs.readFileSync(pagePath, 'utf8');

  assert.ok(
    pageContent.includes('ApprovalCampaignList'),
    'Approvals page must mount ApprovalCampaignList'
  );
  assert.ok(
    pageContent.includes('pendingByCampaign'),
    'Approvals page must compute pending reviews per campaign'
  );

  const compPath = path.resolve(
    process.cwd(),
    'src/features/campaigns/components/approval-campaign-list.tsx'
  );
  const compContent = fs.readFileSync(compPath, 'utf8');

  assert.ok(compContent.includes('TablePagination'), 'ApprovalCampaignList must use TablePagination');
  assert.ok(compContent.includes('kpiTotalCampaigns'), 'ApprovalCampaignList must display KPI total campaigns');
  assert.ok(compContent.includes('kpiTotalPending'), 'ApprovalCampaignList must display KPI total pending');
  assert.ok(compContent.includes('kpiNeedAction'), 'ApprovalCampaignList must display KPI urgent action');
  assert.ok(compContent.includes('pendingCountBadge'), 'ApprovalCampaignList must display local pending badge on card');
  assert.ok(compContent.includes('searchQuery'), 'ApprovalCampaignList must support search filter');
});

test('Dashboard page is a SaaS Command Center with top-level KPIs, Action Center and Campaign Console', () => {
  const dashPath = path.resolve(process.cwd(), 'src/app/(dashboard)/dashboard/page.tsx');
  const content = fs.readFileSync(dashPath, 'utf8');

  assert.ok(content.includes('DashboardCampaignConsole'), 'Dashboard must mount DashboardCampaignConsole');
  assert.ok(content.includes('kpiTotalCampaigns'), 'Dashboard must display total campaigns KPI');
  assert.ok(content.includes('kpiMyRoles'), 'Dashboard must display user roles distribution KPI');
  assert.ok(content.includes('kpiPendingReviews'), 'Dashboard must display pending reviews KPI');
  assert.ok(content.includes('kpiCompletionRate'), 'Dashboard must display operational completion rate KPI');
  assert.ok(content.includes('actionCenterTitle'), 'Dashboard must have Action Required center');

  const consolePath = path.resolve(
    process.cwd(),
    'src/features/campaigns/components/dashboard-campaign-console.tsx'
  );
  const consoleContent = fs.readFileSync(consolePath, 'utf8');

  assert.ok(consoleContent.includes('TablePagination'), 'DashboardCampaignConsole must support pagination');
  assert.ok(consoleContent.includes('tabRoleManaged'), 'DashboardCampaignConsole must have role tabs');
  assert.ok(consoleContent.includes('searchQuery'), 'DashboardCampaignConsole must support search');
});

test('Approval detail page uses ApprovalDetailQueue with tabs, search, and pagination to prevent DOM overload', () => {
  const detailPagePath = path.resolve(
    process.cwd(),
    'src/app/(dashboard)/campaigns/approvals/[id]/page.tsx'
  );
  const pageContent = fs.readFileSync(detailPagePath, 'utf8');

  assert.ok(
    pageContent.includes('ApprovalDetailQueue'),
    'Approval detail page must mount ApprovalDetailQueue'
  );

  const queuePath = path.resolve(
    process.cwd(),
    'src/features/approvals/components/approval-detail-queue.tsx'
  );
  const queueContent = fs.readFileSync(queuePath, 'utf8');

  assert.ok(queueContent.includes('TablePagination'), 'ApprovalDetailQueue must use TablePagination');
  assert.ok(queueContent.includes('tabPending'), 'ApprovalDetailQueue must have pending reviews tab');
  assert.ok(queueContent.includes('tabNeedsRevision'), 'ApprovalDetailQueue must have revision tab');
  assert.ok(queueContent.includes('tabApproved'), 'ApprovalDetailQueue must have approved tab');
  assert.ok(queueContent.includes('searchQuery'), 'ApprovalDetailQueue must support search filtering');
});

test('Managed campaigns route is /campaigns/managed with backward-compatible root redirect', () => {
  const managedPagePath = path.resolve(
    process.cwd(),
    'src/app/(dashboard)/campaigns/managed/page.tsx'
  );
  assert.ok(fs.existsSync(managedPagePath), 'Managed campaigns page must exist at /campaigns/managed/page.tsx');
  const managedContent = fs.readFileSync(managedPagePath, 'utf8');
  assert.ok(managedContent.includes('getManagedCampaignsWithProgressUseCase'), 'Managed page must fetch managed campaigns');

  const rootPagePath = path.resolve(
    process.cwd(),
    'src/app/(dashboard)/campaigns/page.tsx'
  );
  const rootContent = fs.readFileSync(rootPagePath, 'utf8');
  assert.ok(rootContent.includes("redirect("), 'Root /campaigns must redirect');
  assert.ok(rootContent.includes("/campaigns/managed"), 'Root /campaigns must redirect to /campaigns/managed');

  const sidebarPath = path.resolve(process.cwd(), 'src/components/shared/sidebar.tsx');
  const sidebarContent = fs.readFileSync(sidebarPath, 'utf8');
  assert.ok(sidebarContent.includes("href: '/campaigns/managed'"), 'Sidebar must link managed campaigns to /campaigns/managed');

  const supervisionPath = path.resolve(
    process.cwd(),
    'src/app/(dashboard)/campaigns/supervision/page.tsx'
  );
  const supervisionContent = fs.readFileSync(supervisionPath, 'utf8');
  assert.ok(!supervisionContent.includes("href=\"/campaigns\""), 'Supervision empty state must not link to /campaigns');

  const approvalsPath = path.resolve(
    process.cwd(),
    'src/app/(dashboard)/campaigns/approvals/page.tsx'
  );
  const approvalsContent = fs.readFileSync(approvalsPath, 'utf8');
  assert.ok(!approvalsContent.includes("href=\"/campaigns\""), 'Approvals empty state must not link to /campaigns');
});

