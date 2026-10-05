# EventGo Proof — Hệ Thống Quản Lý & Nghiệm Thu Gian Hàng Sự Kiện

> **EventGo Proof** là nền tảng B2B SaaS số hóa toàn diện quy trình kiểm soát tuân thủ, thu thập bằng chứng hình ảnh hiện trường, thẩm định và đối soát biên bản nghiệm thu cho các chiến dịch kích hoạt thương hiệu (Activation Booths & Roadshows) trên nhiều địa điểm.

---

## 🎯 Quy trình nghiệp vụ cốt lõi (Core Workflow)

```
Chiến dịch (Campaign)
       │
       ▼
Địa điểm triển khai (Locations) ──► Nhập hàng loạt qua Excel / CSV
       │
       ▼
Bộ tiêu chí chuẩn hóa (Checklist Items) [Kết cấu, Logo, POSM, Trưng bày, Nhân sự]
       │
       ▼
Thu thập bằng chứng (Evidence Collection) ──► Giám sát viên chụp ảnh & nén trên Mobile
       │
       ▼
Thẩm định & Phê duyệt (Approval) ──► Duyệt Đạt (Approve) / Yêu cầu chụp lại (Revision)
       │
       ▼
Biên bản nghiệm thu & Xuất báo cáo (Report Generation) ──► Xuất PDF A4 & Excel (.xlsx)
```

---

## 🏗️ Kiến trúc kỹ thuật (Tech Stack & Architecture)

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router, React 19, Server Components, Server Actions, Proxy).
- **Ngôn ngữ**: TypeScript Strict Mode.
- **Giao diện**: Tailwind CSS v4, Lucide Icons, shadcn/ui design tokens.
- **Xác thực & Database**: Google OAuth qua Supabase Auth và PostgreSQL RLS phân quyền theo từng chiến dịch/location/submission.
- **Lưu trữ hình ảnh**: Cloudinary CDN (Direct Signed Upload, nén ảnh thông minh).
- **Xử lý bảng tính**: SheetJS (`xlsx`) đọc file danh sách địa điểm và xuất báo cáo đối soát.
- **In ấn & PDF**: CSS `@media print` chuẩn hóa A4 Vector Report.
- **Mô hình kiến trúc**: **Pragmatic Clean Architecture** (Domain $\leftarrow$ Application $\leftarrow$ Presentation $\leftarrow$ Infrastructure).

```
src/
├── app/                  # Next.js App Router (auth, dashboard, api)
├── components/           # UI Atomic components & Shared widgets
├── features/             # Feature-specific components & server actions
├── domain/               # Core business entities, enums, errors, repository ports
├── application/          # Use cases, interactors, DTOs & Zod schemas
├── infrastructure/       # Supabase, Cloudinary, SheetJS adapters
├── config/               # Biến môi trường tập trung có Zod validation
└── lib/                  # Utilities, formatters, cn class merger
```

---

## 🚀 Hướng dẫn cài đặt & Khởi chạy (Local Development)

### 1. Yêu cầu môi trường
- **Node.js**: Phiên bản 18.18 trở lên (Khuyến nghị Node.js 20 LTS).
- **NPM**: Đi kèm với Node.js.

### 2. Cài đặt các gói phụ thuộc
```bash
git clone https://github.com/your-org/eventgo_proof.git
cd eventgo_proof
npm install
```

### 3. Cấu hình biến môi trường (`.env.local`)
Copy file mẫu cấu hình:
```bash
cp .env.example .env.local
```
Mở file `.env.local` và điền các thông tin từ tài khoản của bạn:

```bash
# Supabase Configuration
# Lấy tại: https://supabase.com -> Project Settings -> API
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Cloudinary Configuration
# Lấy tại: https://cloudinary.com -> Dashboard
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret

# Application URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

> **Bắt buộc:** Ứng dụng không còn chế độ Mock/In-Memory. Thiếu Supabase hoặc Cloudinary sẽ trả lỗi cấu hình thay vì báo thành công giả.

Trong Supabase Dashboard:

1. Bật Google provider tại **Authentication → Providers → Google**.
2. Tắt email/password signup để Google là phương thức đăng nhập duy nhất.
3. Thêm callback URL `http://localhost:3000/auth/callback` và callback URL production tương ứng.

### 4. Khởi tạo Cơ sở dữ liệu (Supabase Migrations)
Khi kết nối dự án Supabase, copy và chạy lần lượt 3 file script SQL trong thư mục `supabase/migrations/` trên **Supabase SQL Editor**:
1. `20261002000001_initial_schema.sql`: Khởi tạo profile, campaign membership, assignments, submissions và audit tables.
2. `20261002000002_rls_policies.sql`: Thiết lập RLS cùng các RPC atomic cho campaign, assignment, evidence và approval.
3. `20261002000003_seed_data.sql`: Chỉ tạo dữ liệu mẫu khi đã có ít nhất một profile Google.

Các script này là initial schema đã được viết lại. Nếu database từng chạy schema organization/global-role cũ, hãy reset database trước khi chạy lại ba script.

### 5. Khởi chạy máy chủ phát triển
```bash
npm run dev
```
Mở trình duyệt tại: `http://localhost:3000` (sẽ tự động chuyển hướng đến `/dashboard`).

---

## 👥 Google OAuth và role theo chiến dịch

- Mọi tài khoản đăng nhập bằng Google và đều có thể tạo chiến dịch.
- Người tạo tự động trở thành `MANAGER`.
- Manager thêm tài khoản khác bằng email với role `MANAGER`, `SUPERVISOR` hoặc `APPROVER`.
- Supervisor chỉ xem và nộp evidence tại location được giao.
- Approver chỉ xem và duyệt submission được giao.
- Manager không nộp evidence và không duyệt; Manager chỉ quản trị campaign, member và assignment.
- Có thể thay đổi role hoặc thu hồi quyền người tạo nếu campaign vẫn còn ít nhất một Manager.

---

## 🧪 Kịch bản kiểm thử End-to-End (Demo Flow)

1. **Đăng nhập Google và tạo campaign**:
   - Truy cập `/campaigns` $\rightarrow$ Nhấn **"Tạo chiến dịch mới"** (VD: *Summer Activation 2026*).
   - Truy cập `/locations/import` $\rightarrow$ Tải lên file Excel mẫu để nhập hàng loạt các điểm Vincom, Aeon Mall.
   - Thêm Supervisor và Approver bằng email, sau đó phân công cho location.
2. **Đăng nhập bằng tài khoản Supervisor được phân công**:
   - Mở chi tiết địa điểm `/locations/[id]` $\rightarrow$ Nhấn **"Chụp & Nộp bằng chứng"**.
   - Chọn tiêu chí cần nghiệm thu $\rightarrow$ Chọn/chụp ảnh từ điện thoại (ảnh tự động nén tối ưu dưới 600KB) $\rightarrow$ Nhập ghi chú $\rightarrow$ Nhấn **"Nộp bằng chứng"**.
3. **Đăng nhập bằng tài khoản Approver được phân công**:
   - Truy cập `/approvals` $\rightarrow$ Kiểm tra ảnh bằng chứng hiện trường phóng to.
   - Nhấn **"Yêu cầu chụp lại"** (bắt buộc nhập lý do: *"Ảnh logo bị lóa đèn sảnh"*).
   - Supervisor nộp lại ảnh mới $\rightarrow$ Approver nhấn **"Duyệt Đạt"**.
4. **Quay lại tài khoản Manager để xuất biên bản**:
   - Truy cập `/reports` $\rightarrow$ Xem biên bản nghiệm thu chiến dịch tổng thể.
   - Nhấn **"In / Xuất PDF"** hoặc **"Xuất Excel (.xlsx)"** để bàn giao đối tác.

---

## 📦 Triển khai lên Vercel (Production Deployment)

1. Đẩy mã nguồn lên kho chứa GitHub.
2. Đăng nhập [Vercel](https://vercel.com/) $\rightarrow$ Chọn **"Add New Project"** $\rightarrow$ Import repository `eventgo_proof`.
3. Trong mục **Environment Variables**, điền đầy đủ các biến từ `.env.example`.
4. Nhấn **Deploy**. Ứng dụng chạy 100% serverless không phát sinh chi phí hạ tầng.
