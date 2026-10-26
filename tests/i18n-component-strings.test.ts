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

test('step-4-assignments has no hybrid bilingual or hardcoded role strings', () => {
  const step4Path = path.resolve(
    process.cwd(),
    'src/features/campaigns/components/wizard/step-4-assignments.tsx'
  );
  const content = fs.readFileSync(step4Path, 'utf8');

  assert.ok(
    !content.includes('(Supervisor)'),
    'Should not contain "(Supervisor)" in copy'
  );
  assert.ok(
    !content.includes('(Approver)'),
    'Should not contain "(Approver)" in copy'
  );
  assert.ok(
    !content.includes('Supervisor hàng loạt:'),
    'Should not contain "Supervisor hàng loạt:"'
  );
  assert.ok(
    !content.includes('Approver hàng loạt:'),
    'Should not contain "Approver hàng loạt:"'
  );
  assert.ok(
    !content.includes('placeholder="-- Giữ nguyên Supervisor --"'),
    'Should not contain hardcoded placeholder "-- Giữ nguyên Supervisor --"'
  );
});

test('wizard-stepper has no hardcoded Vietnamese step labels or raw prefix', () => {
  const stepperPath = path.resolve(
    process.cwd(),
    'src/features/campaigns/components/wizard/wizard-stepper.tsx'
  );
  const content = fs.readFileSync(stepperPath, 'utf8');

  assert.ok(
    !content.includes("label: 'Địa điểm & Booth'"),
    'Should not contain hardcoded "Địa điểm & Booth"'
  );
  assert.ok(
    !content.includes("label: 'Checklist'"),
    'Should not contain hardcoded "Checklist"'
  );
  assert.ok(
    !content.includes('BƯỚC {item.step}'),
    'Should not contain hardcoded "BƯỚC {item.step}"'
  );
});

test('wizard-header uses translation keys', () => {
  const headerPath = path.resolve(
    process.cwd(),
    'src/features/campaigns/components/wizard/wizard-header.tsx'
  );
  const content = fs.readFileSync(headerPath, 'utf8');

  assert.ok(
    !content.includes('Chiến dịch quản lý'),
    'Should not contain hardcoded "Chiến dịch quản lý"'
  );
  assert.ok(
    !content.includes('Bản nháp'),
    'Should not contain hardcoded "Bản nháp"'
  );
});

test('campaign-personnel-section uses translations for table headers and actions', () => {
  const sectionPath = path.resolve(
    process.cwd(),
    'src/features/campaigns/components/wizard/campaign-personnel-section.tsx'
  );
  const content = fs.readFileSync(sectionPath, 'utf8');

  assert.ok(
    !content.includes('<th className="px-4 py-2.5">Thành viên</th>'),
    'Should not contain raw "<th ...>Thành viên</th>"'
  );
  assert.ok(
    !content.includes('Xóa khỏi chiến dịch\n'),
    'Should not contain raw "Xóa khỏi chiến dịch"'
  );
});

test('admin-header uses translations for client workspace and navigation', () => {
  const adminHeaderPath = path.resolve(
    process.cwd(),
    'src/features/admin/components/admin-header.tsx'
  );
  const content = fs.readFileSync(adminHeaderPath, 'utf8');

  assert.ok(
    !content.includes('<span>Workspace Khách hàng</span>'),
    'Should not contain raw "<span>Workspace Khách hàng</span>"'
  );
});

test('phase 1 shared components contain no hardcoded Vietnamese UI copy', () => {
  const statusBadgePath = path.resolve(process.cwd(), 'src/components/shared/status-badge.tsx');
  const statusBadge = fs.readFileSync(statusBadgePath, 'utf8');
  assert.ok(!statusBadge.includes('Bản nháp'), 'status-badge should not have hardcoded "Bản nháp"');
  assert.ok(!statusBadge.includes('Chờ phê duyệt'), 'status-badge should not have hardcoded "Chờ phê duyệt"');
  assert.ok(!statusBadge.includes('Đang triển khai'), 'status-badge should not have hardcoded "Đang triển khai"');
  assert.ok(!statusBadge.includes('Đã duyệt đạt'), 'status-badge should not have hardcoded "Đã duyệt đạt"');

  const paginationPath = path.resolve(process.cwd(), 'src/components/shared/table-pagination.tsx');
  const pagination = fs.readFileSync(paginationPath, 'utf8');
  assert.ok(!pagination.includes('Hiển thị'), 'table-pagination should not have hardcoded "Hiển thị"');
  assert.ok(!pagination.includes('trong tổng số'), 'table-pagination should not have hardcoded "trong tổng số"');

  const toolbarPath = path.resolve(process.cwd(), 'src/components/shared/data-table-toolbar.tsx');
  const toolbar = fs.readFileSync(toolbarPath, 'utf8');
  assert.ok(!toolbar.includes("'Tìm kiếm dữ liệu...'"), 'data-table-toolbar should not have hardcoded default placeholder');
  assert.ok(!toolbar.includes('Đang chọn'), 'data-table-toolbar should not have hardcoded "Đang chọn"');

  const filterInputsPath = path.resolve(process.cwd(), 'src/components/shared/column-filter-inputs.tsx');
  const filterInputs = fs.readFileSync(filterInputsPath, 'utf8');
  assert.ok(!filterInputs.includes("'Tìm kiếm...'"), 'column-filter-inputs should not have hardcoded default placeholder');
  assert.ok(!filterInputs.includes('Đang áp dụng bộ lọc cột này'), 'column-filter-inputs should not have hardcoded tooltip');
});

test('phase 2 auth, invite, not-found, and error pages are localized and mount LanguageSwitcher', () => {
  const loginFormPath = path.resolve(process.cwd(), 'src/features/auth/components/login-form.tsx');
  const loginForm = fs.readFileSync(loginFormPath, 'utf8');
  assert.ok(!loginForm.includes('>Đăng nhập hệ thống<'), 'login-form should not have hardcoded title');
  assert.ok(!loginForm.includes('>Đăng nhập bằng Google<'), 'login-form should not have hardcoded button');
  assert.ok(!loginForm.includes('>Nền tảng Nghiệm thu Gian hàng<'), 'login-form should not have hardcoded brand sub');

  const authLayoutPath = path.resolve(process.cwd(), 'src/app/(auth)/layout.tsx');
  const authLayout = fs.readFileSync(authLayoutPath, 'utf8');
  assert.ok(authLayout.includes('LanguageSwitcher'), 'auth layout must mount LanguageSwitcher');

  const invitePagePath = path.resolve(process.cwd(), 'src/app/auth/invite/page.tsx');
  const invitePage = fs.readFileSync(invitePagePath, 'utf8');
  assert.ok(invitePage.includes('LanguageSwitcher'), 'invite page must mount LanguageSwitcher');
  assert.ok(!invitePage.includes('(Supervisor)'), 'invite page must not have hybrid "(Supervisor)"');
  assert.ok(!invitePage.includes('(Approver)'), 'invite page must not have hybrid "(Approver)"');
  assert.ok(!invitePage.includes('(Manager)'), 'invite page must not have hybrid "(Manager)"');

  const notFoundPath = path.resolve(process.cwd(), 'src/app/not-found.tsx');
  const notFound = fs.readFileSync(notFoundPath, 'utf8');
  assert.ok(notFound.includes('LanguageSwitcher'), 'not-found page must mount LanguageSwitcher');
  assert.ok(!notFound.includes('>Không tìm thấy trang<'), 'not-found should not have hardcoded title');

  const errorPath = path.resolve(process.cwd(), 'src/app/error.tsx');
  const error = fs.readFileSync(errorPath, 'utf8');
  assert.ok(error.includes('LanguageSwitcher'), 'error page must mount LanguageSwitcher');
  assert.ok(!error.includes('>Đã xảy ra lỗi tải trang<'), 'error page should not have hardcoded title');
});

test('phase 5 field supervision and camera uploader are fully localized', () => {
  const supervisionPagePath = path.resolve(process.cwd(), 'src/app/(dashboard)/campaigns/supervision/page.tsx');
  const supervisionPage = fs.readFileSync(supervisionPagePath, 'utf8');
  assert.ok(supervisionPage.includes("getTranslations('operations.supervision')"));
  assert.ok(!supervisionPage.includes('>Chiến Dịch Giám Sát Hiện Trường<'));

  const supervisionDetailPath = path.resolve(process.cwd(), 'src/app/(dashboard)/campaigns/supervision/[id]/page.tsx');
  const supervisionDetail = fs.readFileSync(supervisionDetailPath, 'utf8');
  assert.ok(supervisionDetail.includes("getTranslations('operations.supervision')"));
  assert.ok(!supervisionDetail.includes('>Quay lại danh sách giám sát<'));

  const boothCardPath = path.resolve(process.cwd(), 'src/features/supervision/components/booth-supervision-card.tsx');
  const boothCard = fs.readFileSync(boothCardPath, 'utf8');
  assert.ok(boothCard.includes("useTranslations('operations.supervision')"));
  assert.ok(!boothCard.includes('>Xác nhận nộp bằng chứng<'));

  const cameraUploaderPath = path.resolve(process.cwd(), 'src/features/evidence/components/camera-uploader.tsx');
  const cameraUploader = fs.readFileSync(cameraUploaderPath, 'utf8');
  assert.ok(cameraUploader.includes("useTranslations('operations.camera')"));
  assert.ok(!cameraUploader.includes('Đang tối ưu ảnh...'));
});

test('phase 6 approvals queue and review panel are fully localized', () => {
  const approvalsPagePath = path.resolve(process.cwd(), 'src/app/(dashboard)/campaigns/approvals/page.tsx');
  const approvalsPage = fs.readFileSync(approvalsPagePath, 'utf8');
  assert.ok(approvalsPage.includes("getTranslations('operations.approvals')"));
  assert.ok(!approvalsPage.includes('>Chiến Dịch Phê Duyệt Bằng Chứng<'));

  const approvalsDetailPath = path.resolve(process.cwd(), 'src/app/(dashboard)/campaigns/approvals/[id]/page.tsx');
  const approvalsDetail = fs.readFileSync(approvalsDetailPath, 'utf8');
  assert.ok(approvalsDetail.includes("getTranslations('operations.approvals')"));
  assert.ok(!approvalsDetail.includes('>Quay lại danh sách phê duyệt<'));

  const reviewPanelPath = path.resolve(process.cwd(), 'src/features/approvals/components/review-panel.tsx');
  const reviewPanel = fs.readFileSync(reviewPanelPath, 'utf8');
  assert.ok(reviewPanel.includes("useTranslations('operations.approvals')"));
  assert.ok(!reviewPanel.includes('>Nhấn bất kỳ đâu để đóng<'));
  assert.ok(!reviewPanel.includes('>Quyết định kiểm duyệt<'));
  assert.ok(!reviewPanel.includes('>Lịch sử kiểm duyệt bất biến<'));
  assert.ok(!reviewPanel.includes("'✓ Đã Duyệt Đạt'"));
});

test('phase 7 locations directory, form, and excel import are fully localized', () => {
  const locationsPagePath = path.resolve(process.cwd(), 'src/app/(dashboard)/locations/page.tsx');
  const locationsPage = fs.readFileSync(locationsPagePath, 'utf8');
  assert.ok(locationsPage.includes("getTranslations('locations.page')"));
  assert.ok(!locationsPage.includes('>Địa Điểm Triển Khai<'));

  const locationListPath = path.resolve(process.cwd(), 'src/features/locations/components/location-list.tsx');
  const locationList = fs.readFileSync(locationListPath, 'utf8');
  assert.ok(locationList.includes("useTranslations('locations.list')"));
  assert.ok(!locationList.includes('>Chưa có địa điểm nào<'));

  const locationFormPath = path.resolve(process.cwd(), 'src/features/locations/components/location-form.tsx');
  const locationForm = fs.readFileSync(locationFormPath, 'utf8');
  assert.ok(locationForm.includes("useTranslations('locations.form')"));
  assert.ok(!locationForm.includes('>Thêm Địa Điểm Mới<'));
  assert.ok(!locationForm.includes('>Lưu địa điểm<'));

  const importModalPath = path.resolve(process.cwd(), 'src/features/locations/components/import-modal.tsx');
  const importModal = fs.readFileSync(importModalPath, 'utf8');
  assert.ok(importModal.includes("useTranslations('locations.import')"));
  assert.ok(!importModal.includes('>Nhập Danh Sách Địa Điểm Hàng Loạt<'));
  assert.ok(!importModal.includes('>Kiểm tra & Xem trước dữ liệu<'));
});

test('phase 8 billing page, plans grid, quotas, and PayOS modal are fully localized', () => {
  const billingPagePath = path.resolve(process.cwd(), 'src/app/(dashboard)/settings/billing/page.tsx');
  const billingPage = fs.readFileSync(billingPagePath, 'utf8');
  assert.ok(billingPage.includes("useTranslations('billing.page')"));
  assert.ok(!billingPage.includes('>Gói Dịch Vụ & Thanh Toán<'));

  const planGridPath = path.resolve(process.cwd(), 'src/features/subscriptions/components/billing-plan-grid.tsx');
  const planGrid = fs.readFileSync(planGridPath, 'utf8');
  assert.ok(planGrid.includes("useTranslations('billing.plans')"));
  assert.ok(!planGrid.includes('>Chọn Gói Cước Phù Hợp Cho Doanh Nghiệp<'));
  assert.ok(!planGrid.includes('>Phổ biến nhất<'));

  const quotaCardPath = path.resolve(process.cwd(), 'src/features/subscriptions/components/billing-quota-card.tsx');
  const quotaCard = fs.readFileSync(quotaCardPath, 'utf8');
  assert.ok(quotaCard.includes("useTranslations('billing.quota')"));
  assert.ok(!quotaCard.includes('>Gói Thuê Bao Hiện Tại<'));
  assert.ok(!quotaCard.includes('>Gói Miễn phí vĩnh viễn<'));

  const payosModalPath = path.resolve(process.cwd(), 'src/features/subscriptions/components/payos-checkout-modal.tsx');
  const payosModal = fs.readFileSync(payosModalPath, 'utf8');
  assert.ok(payosModal.includes("useTranslations('billing.payosModal')"));
  assert.ok(!payosModal.includes('>Số tiền thanh toán<'));
  assert.ok(!payosModal.includes('>Thông tin chuyển khoản thủ công<'));
  assert.ok(!payosModal.includes('>Tôi đã chuyển khoản — Kiểm tra lại ngay<'));

  const txnTablePath = path.resolve(process.cwd(), 'src/features/subscriptions/components/transaction-history-table.tsx');
  const txnTable = fs.readFileSync(txnTablePath, 'utf8');
  assert.ok(txnTable.includes("useTranslations('billing.transactions')"));
  assert.ok(!txnTable.includes('>Chưa có lịch sử giao dịch nào<'));

  const upgradeDialogPath = path.resolve(process.cwd(), 'src/features/subscriptions/components/upgrade-confirm-dialog.tsx');
  const upgradeDialog = fs.readFileSync(upgradeDialogPath, 'utf8');
  assert.ok(upgradeDialog.includes("useTranslations('billing.upgradeDialog')"));
  assert.ok(!upgradeDialog.includes('>Xác Nhận Nâng Cấp Gói Thuê Bao<'));
});
test('phase 9 reports page and report view are fully localized with multilingual excel export', () => {
  const reportsPagePath = path.resolve(process.cwd(), 'src/app/(dashboard)/reports/page.tsx');
  const reportsPage = fs.readFileSync(reportsPagePath, 'utf8');
  assert.ok(reportsPage.includes("getTranslations('reports.page')"));
  assert.ok(!reportsPage.includes('>Chưa có chiến dịch nào được chọn hoặc không tìm thấy.<'));

  const reportViewPath = path.resolve(process.cwd(), 'src/features/reports/components/report-view.tsx');
  const reportView = fs.readFileSync(reportViewPath, 'utf8');
  assert.ok(reportView.includes("useTranslations('reports.view')"));
  assert.ok(reportView.includes("useTranslations('reports.excel')"));
  assert.ok(!reportView.includes('>Báo Cáo Nghiệm Thu Chiến Dịch<'));
  assert.ok(!reportView.includes('>Xuất Báo Cáo Excel<'));
  assert.ok(!reportView.includes('>In / Lưu PDF<'));
  assert.ok(!reportView.includes("'Chiến Dịch'"));
  assert.ok(!reportView.includes("'Thương Hiệu'"));
});

test('phase 10 admin portal components and pages are fully localized', () => {
  const sidebarPath = path.resolve(process.cwd(), 'src/features/admin/components/admin-sidebar.tsx');
  const sidebar = fs.readFileSync(sidebarPath, 'utf8');
  assert.ok(sidebar.includes("useTranslations('admin.sidebar')"));
  assert.ok(!sidebar.includes('>Quản Trị Hệ Thống<'));
  assert.ok(!sidebar.includes('>Workspace Khách hàng<'));

  const profileViewPath = path.resolve(process.cwd(), 'src/features/admin/components/admin-profile-view.tsx');
  const profileView = fs.readFileSync(profileViewPath, 'utf8');
  assert.ok(profileView.includes("useTranslations('admin.profile')"));
  assert.ok(!profileView.includes('>Thông Tin Cá Nhân Quản Trị Viên<'));

  const dashboardPagePath = path.resolve(process.cwd(), 'src/app/(admin)/admin/dashboard/page.tsx');
  const dashboardPage = fs.readFileSync(dashboardPagePath, 'utf8');
  assert.ok(dashboardPage.includes("useTranslations('admin.dashboard')"));
  assert.ok(!dashboardPage.includes('>Tổng Quan Hệ Thống<'));

  const plansPagePath = path.resolve(process.cwd(), 'src/app/(admin)/admin/plans/page.tsx');
  const plansPage = fs.readFileSync(plansPagePath, 'utf8');
  assert.ok(plansPage.includes("useTranslations('admin.plans')"));
  assert.ok(!plansPage.includes('>Quản Lý Gói Thuê Bao & Bảng Giá<'));

  const subscriptionsPagePath = path.resolve(process.cwd(), 'src/app/(admin)/admin/subscriptions/page.tsx');
  const subscriptionsPage = fs.readFileSync(subscriptionsPagePath, 'utf8');
  assert.ok(subscriptionsPage.includes("useTranslations('admin.subscriptions')"));
  assert.ok(!subscriptionsPage.includes('>Quản Lý Thuê Bao Khách Hàng<'));

  const txnsPagePath = path.resolve(process.cwd(), 'src/app/(admin)/admin/transactions/page.tsx');
  const txnsPage = fs.readFileSync(txnsPagePath, 'utf8');
  assert.ok(txnsPage.includes("useTranslations('admin.transactions')"));
  assert.ok(!txnsPage.includes('>Lịch Sử Giao Dịch Toàn Hệ Thống<'));

  const paymentSettingsPath = path.resolve(process.cwd(), 'src/app/(admin)/admin/payment-settings/page.tsx');
  const paymentSettings = fs.readFileSync(paymentSettingsPath, 'utf8');
  assert.ok(paymentSettings.includes("useTranslations('admin.paymentSettings')"));
  assert.ok(!paymentSettings.includes('>Cấu Hình Cổng Thanh Toán & Nhận Tiền<'));

  const adminsPagePath = path.resolve(process.cwd(), 'src/app/(admin)/admin/admins/page.tsx');
  const adminsPage = fs.readFileSync(adminsPagePath, 'utf8');
  assert.ok(adminsPage.includes("useTranslations('admin.admins')"));
  assert.ok(!adminsPage.includes('>Mời Quản Trị Viên Mới Qua Email<'));

  const templatesPagePath = path.resolve(process.cwd(), 'src/app/(admin)/admin/templates/page.tsx');
  const templatesPage = fs.readFileSync(templatesPagePath, 'utf8');
  assert.ok(templatesPage.includes("useTranslations('admin.templates')"));
  assert.ok(!templatesPage.includes('>Chưa có bộ mẫu checklist nào<'));

  const newTemplatePagePath = path.resolve(process.cwd(), 'src/app/(admin)/admin/templates/new/page.tsx');
  const newTemplatePage = fs.readFileSync(newTemplatePagePath, 'utf8');
  assert.ok(newTemplatePage.includes("useTranslations('admin.templates')"));
  assert.ok(!newTemplatePage.includes('>Quay lại Thư viện mẫu<'));
});

