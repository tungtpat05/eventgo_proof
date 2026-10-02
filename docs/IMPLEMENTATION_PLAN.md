# EventGo Proof — Implementation Plan & Progress Tracker

> **Mục đích tài liệu:** Theo dõi tiến độ triển khai chi tiết từng giai đoạn (Phase 1 → Phase 15) theo đúng đặc tả kỹ thuật tại [AI_IMPLEMENTATION_SPEC.md](file:///d:/eventgo_proof/docs/AI_IMPLEMENTATION_SPEC.md) và yêu cầu nghiệp vụ từ [EventGo Proof - Report.pdf](file:///d:/eventgo_proof/docs/EventGo%20Proof%20-%20Report.pdf).

---

## 📊 Tổng quan tiến độ (Progress Overview)

- **Trạng thái hiện tại:** 🟡 **Giai đoạn chuẩn bị (Phase 0 hoàn thành — Chờ phê duyệt bắt đầu Phase 1)**
- **Tiến độ tổng thể:** `0% / 15 Phases`
- **Ký hiệu trạng thái:**
  - `⚪ CHƯA BẮT ĐẦU (NOT STARTED)`
  - `🟡 ĐANG THỰC HIỆN (IN PROGRESS)`
  - `🟢 ĐÃ HOÀN THÀNH (COMPLETED)`
  - `🔴 BỊ NGHẼN / CHỜ THÔNG TIN (BLOCKED)`

---

## 📑 Bảng theo dõi các giai đoạn (Phase Tracking Table)

| Phase | Tên giai đoạn | Trọng tâm công việc | Trạng thái | Ngày bắt đầu | Ngày hoàn thành |
| :---: | :--- | :--- | :---: | :---: | :---: |
| **0** | **Kiến trúc & Kế hoạch** | Phân tích tài liệu, thiết kế Clean Architecture, DB Schema, RLS, Plan | 🟢 HOÀN THÀNH | 2026-10-02 | 2026-10-02 |
| **1** | **Khởi tạo nền tảng (Foundation)** | Next.js App Router, TS Strict, Tailwind, shadcn/ui, Env config, Structure | ⚪ CHƯA BẮT ĐẦU | — | — |
| **2** | **Cơ sở dữ liệu (Database & RLS)** | SQL Migrations, UUIDs, Enums, Tables, Constraints, Indexes, RLS Policies | ⚪ CHƯA BẮT ĐẦU | — | — |
| **3** | **Xác thực (Authentication)** | Supabase Auth SSR, Cookie Session, Middleware bảo vệ route, Login / Logout | ⚪ CHƯA BẮT ĐẦU | — | — |
| **4** | **Phân quyền & Multi-tenancy** | Cô lập Organization, Phân quyền Role (PM, Supervisor, Approver) | ⚪ CHƯA BẮT ĐẦU | — | — |
| **5** | **Quản lý Chiến dịch (Campaigns)** | CRUD Chiến dịch, Chi tiết chiến dịch, Trạng thái (Draft/Active/Done) | ⚪ CHƯA BẮT ĐẦU | — | — |
| **6** | **Quản lý Địa điểm (Locations)** | CRUD Địa điểm, Gán chiến dịch, Import danh sách từ file Excel/CSV | ⚪ CHƯA BẮT ĐẦU | — | — |
| **7** | **Bộ tiêu chí nghiệm thu (Checklists)** | Tạo & quản lý Checklist Items theo chiến dịch, phân loại tiêu chí | ⚪ CHƯA BẮT ĐẦU | — | — |
| **8** | **Phân công nhân sự (Assignments)** | Gán Supervisor & Approver phụ trách từng địa điểm, cài đặt Deadline | ⚪ CHƯA BẮT ĐẦU | — | — |
| **9** | **Thu thập bằng chứng (Evidence & Cloudinary)** | Upload ảnh trực tiếp Cloudinary có chữ ký bảo mật, nén ảnh, xem trước | ⚪ CHƯA BẮT ĐẦU | — | — |
| **10** | **Quy trình nộp nghiệm thu (Submission)** | Nộp bằng chứng theo từng checklist item, ghi chú hiện trường | ⚪ CHƯA BẮT ĐẦU | — | — |
| **11** | **Duyệt & Yêu cầu chỉnh sửa (Approval)** | Giao diện duyệt bằng chứng, Chấp thuận, Bắt buộc lý do khi sửa, Lịch sử | ⚪ CHƯA BẮT ĐẦU | — | — |
| **12** | **Bảng điều khiển (Dashboard & KPIs)** | Thống kê số lượng, tỷ lệ hoàn thành, cảnh báo cần sửa, chờ duyệt | ⚪ CHƯA BẮT ĐẦU | — | — |
| **13** | **Báo cáo & Xuất file (Reports & Export)** | Tổng hợp biên bản nghiệm thu chiến dịch, Xuất PDF & bảng tính Excel | ⚪ CHƯA BẮT ĐẦU | — | — |
| **14** | **Dữ liệu mẫu (Demo & Seed Data)** | Kịch bản dữ liệu demo thực tế tại Việt Nam, tài khoản định sẵn các role | ⚪ CHƯA BẮT ĐẦU | — | — |
| **15** | **Hoàn thiện & Tối ưu (Polish & Verify)** | Giao diện mobile hiện trường, Trạng thái rỗng/lỗi, Build Vercel check, README | ⚪ CHƯA BẮT ĐẦU | — | — |

---

## 🔍 Chi tiết từng giai đoạn thực hiện (Detailed Checklist)

### Phase 1: Khởi tạo nền tảng (Project Foundation)
- [ ] Khởi tạo dự án Next.js 15+ (App Router, TypeScript strict mode).
- [ ] Cài đặt & cấu hình Tailwind CSS, Lucide Icons, shadcn/ui.
- [ ] Thiết lập cấu trúc thư mục Clean Architecture (`domain/`, `application/`, `infrastructure/`, `features/`, `components/`).
- [ ] Tạo file cấu hình môi trường `.env.example` và `.env.local` (đảm bảo `.env.local` nằm trong `.gitignore`).
- [ ] Tạo module kiểm tra biến môi trường tập trung `src/config/env.ts` bằng Zod.
- [ ] Kiểm tra TypeScript compilation & linting.

### Phase 2: Cơ sở dữ liệu & Phân quyền mức hàng (Database & RLS)
- [ ] Soạn thảo migration SQL tạo các Custom Enums (`user_role`, `campaign_status`, `submission_status`, `approval_action`, `checklist_category`).
- [ ] Tạo các bảng cốt lõi: `organizations`, `profiles`, `campaigns`, `locations`, `checklist_items`, `submissions`, `evidence`, `approval_history`.
- [ ] Thiết lập Primary Keys (UUID), Foreign Keys (Cascade/Restrict) và Check Constraints (kiểm tra ngày chiến dịch, bắt buộc lý do khi yêu cầu sửa).
- [ ] Tạo các Indexes tối ưu hóa truy vấn lọc theo Organization, Campaign, Location, Submission Status.
- [ ] Thiết lập các hàm bảo mật `auth.current_org_id()`, `auth.current_user_role()`.
- [ ] Thiết lập toàn bộ chính sách RLS (Row Level Security) đảm bảo cô lập Multi-tenancy tuyệt đối.

### Phase 3: Xác thực người dùng (Authentication)
- [ ] Cấu hình Supabase SSR Client (`@supabase/ssr`) cho Browser, Server Component, Server Action.
- [ ] Viết `src/middleware.ts` tự động refresh session cookie và bảo vệ các private route.
- [ ] Tạo giao diện trang Đăng nhập (`/login`) với React Hook Form + Zod.
- [ ] Xử lý logic Đăng nhập (Sign In) và Đăng xuất (Sign Out).
- [ ] Tạo Trigger PostgreSQL tự động đồng bộ user mới từ `auth.users` sang bảng `profiles`.

### Phase 4: Phân quyền & Cô lập tổ chức (Authorization & Multi-Tenancy)
- [ ] Xây dựng guard/interactor kiểm tra quyền hạn role tại Application Layer (`PROJECT_MANAGER`, `SUPERVISOR`, `APPROVER`).
- [ ] Xây dựng Layout Dashboard chính với Sidebar phân quyền hiển thị theo Role.
- [ ] Kiểm tra kiểm thử: Ngăn chặn triệt để User Organization A truy cập dữ liệu Organization B.

### Phase 5: Quản lý Chiến dịch (Campaign Management)
- [ ] Triển khai Domain Entity & Repository cho Campaign.
- [ ] Xây dựng Use Cases: `CreateCampaign`, `UpdateCampaign`, `GetCampaignList`, `GetCampaignDetails`.
- [ ] Giao diện danh sách chiến dịch (`/campaigns`) có phân loại trạng thái (`DRAFT`, `ACTIVE`, `COMPLETED`, `ARCHIVED`).
- [ ] Form tạo mới/chỉnh sửa chiến dịch (`/campaigns/new`, `/campaigns/[id]/edit`).
- [ ] Trang chi tiết chiến dịch (`/campaigns/[id]`) hiển thị tiến độ tổng thể.

### Phase 6: Quản lý Địa điểm & Import dữ liệu (Locations)
- [ ] Triển khai Domain Entity & Repository cho Location.
- [ ] Form tạo mới/chỉnh sửa địa điểm triển khai gian hàng (`/locations`).
- [ ] Tích hợp thư viện SheetJS (`xlsx`) đọc file danh sách địa điểm (Excel/CSV).
- [ ] Modal Bulk Import: validate dữ liệu từng dòng, preview lỗi trước khi lưu vào DB.
- [ ] Liên kết địa điểm vào chiến dịch tương ứng.

### Phase 7: Quản lý Bộ tiêu chí nghiệm thu (Checklist Items)
- [ ] Xây dựng tiêu chí nghiệm thu theo từng chiến dịch (`checklist_items`).
- [ ] Giao diện cấu hình checklist cho Project Manager: thêm tiêu chí, phân loại danh mục (Kết cấu, Logo nhận diện, POSM, Nhân sự, Hiện trạng trước/sau).
- [ ] Thiết lập cờ `is_required` và thứ tự hiển thị `order_index`.

### Phase 8: Phân công nhân sự (Assignments)
- [ ] Chức năng phân công Supervisor (người phụ trách hiện trường) và Approver (người duyệt) cho từng địa điểm.
- [ ] Thiết lập hạn chót (Deadline) hoàn thành nghiệm thu từng địa điểm.
- [ ] Hiển thị danh sách địa điểm theo quyền truy cập của Supervisor được giao việc.

### Phase 9: Thu thập bằng chứng & Tích hợp Cloudinary (Evidence Collection)
- [ ] Xây dựng Route Handler / Server Action tạo chữ ký upload an toàn (`signed upload`) từ Cloudinary.
- [ ] Đảm bảo bí mật `CLOUDINARY_API_SECRET` không bao giờ lộ ra trình duyệt.
- [ ] Component chụp/chọn ảnh tối ưu trên Mobile (nén ảnh client-side trước khi upload).
- [ ] Lưu metadata ảnh (`image_url`, `thumbnail_url`, `cloudinary_public_id`, dung lượng, kích thước) vào bảng `evidence`.
- [ ] Dialog xem trước ảnh kích thước lớn cho người kiểm tra.

### Phase 10: Quy trình nộp nghiệm thu (Submission Workflow)
- [ ] Giao diện nghiệm thu trên Mobile dành cho Site Supervisor (`/locations/[id]/submit`).
- [ ] Đính kèm bằng chứng ảnh và ghi chú hiện trường cho từng Checklist Item.
- [ ] Chuyển trạng thái từ `DRAFT` $\rightarrow$ `SUBMITTED`.
- [ ] Kiểm tra ràng buộc: Phải có ít nhất 1 ảnh bằng chứng mới cho phép nộp.

### Phase 11: Duyệt bằng chứng & Yêu cầu chỉnh sửa (Review & Approval)
- [ ] Trang danh sách chờ duyệt dành cho Approver / PM (`/approvals`).
- [ ] Giao diện so sánh bằng chứng ảnh đối chiếu với mô tả tiêu chí.
- [ ] Hành động Chấp thuận (`APPROVE`): khóa trạng thái hoàn thành.
- [ ] Hành động Yêu cầu sửa (`REQUEST_REVISION`): bắt buộc nhập lý do chi tiết.
- [ ] Ghi nhận lịch sử duyệt bất biến (`approval_history`) kèm người duyệt, thời gian, quyết định.
- [ ] Quy trình Supervisor nộp lại (`Resubmit`) bằng chứng khắc phục.

### Phase 12: Bảng điều khiển tiến độ (Dashboard & Metrics)
- [ ] Trang tổng quan Dashboard (`/dashboard`):
  - Thẻ đếm: Tổng số chiến dịch, chiến dịch đang chạy, tổng số địa điểm.
  - Thẻ tiến độ: Địa điểm hoàn thành, địa điểm đang chờ duyệt, địa điểm cần sửa.
- [ ] Danh sách việc cần làm nhanh (Pending Actions) cho từng Role.

### Phase 13: Báo cáo nghiệm thu & Xuất file (Reports & Export)
- [ ] Trang báo cáo tổng kết chiến dịch (`/campaigns/[id]/report`).
- [ ] Tổng hợp thông tin chiến dịch, danh sách địa điểm, trạng thái từng tiêu chí, ảnh minh chứng Before/After, lịch sử duyệt.
- [ ] Tích hợp xuất file PDF hoàn chỉnh sẵn sàng gửi khách hàng/đối tác.
- [ ] Xuất bảng tính Excel tổng hợp dữ liệu phục vụ đối soát thanh toán.

### Phase 14: Dữ liệu mẫu (Demo & Seed Data)
- [ ] Script khởi tạo dữ liệu mẫu sát thực tế tại Việt Nam:
  - Tổ chức: `EventGo Demo Agency`
  - Chiến dịch: `Summer Activation 2026`
  - Địa điểm: `Vincom Bà Triệu`, `Aeon Mall Hà Đông`, `Lotte Mall Tây Hồ`
  - Tiêu chí: Lắp đặt gian hàng, Vị trí logo thương hiệu, POSM & Standee, Trưng bày sản phẩm, Nhân sự trực quầy.
- [ ] Chuẩn bị sẵn 3 tài khoản demo cho 3 vai trò: Project Manager, Site Supervisor, Approver.

### Phase 15: Tinh chỉnh & Sẵn sàng bàn giao (Polish & Verification)
- [ ] Kiểm tra toàn diện UX trên thiết bị di động (Mobile Field Inspector).
- [ ] Rà soát các trạng thái: Loading (Skeleton), Empty states, Error boundaries.
- [ ] Chạy kiểm tra TypeScript (`tsc --noEmit`), Lint, và Production Build (`npm run build`).
- [ ] Viết tài liệu `README.md` chuyên nghiệp (hướng dẫn cài đặt, cấu hình env, demo workflow, kiến trúc).

---

## 📝 Nhật ký cập nhật tiến độ (Progress Log)

| Ngày | Giai đoạn | Nội dung thực hiện | Người thực hiện |
| :---: | :---: | :--- | :---: |
| 2026-10-02 | Phase 0 | Đọc toàn bộ báo cáo dự án & tài liệu kỹ thuật; lập Blueprint kiến trúc & Kế hoạch tiến độ `docs/IMPLEMENTATION_PLAN.md`. | Antigravity AI |
