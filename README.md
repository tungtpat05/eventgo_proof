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

- **Framework**: [Next.js 15+](https://nextjs.org/) (App Router, React 19, Server Components, Server Actions).
- **Ngôn ngữ**: TypeScript Strict Mode.
- **Giao diện**: Tailwind CSS v4, Lucide Icons, shadcn/ui design tokens.
- **Xác thực & Database**: Supabase Auth (SSR Cookie-based) & PostgreSQL với Row Level Security (RLS) bảo vệ Multi-tenancy.
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

> **Lưu ý:** Khi chưa điền thông tin Supabase/Cloudinary, ứng dụng vẫn hoạt động trơn tru ở chế độ **Mock / Demo In-Memory** để kiểm tra giao diện và luồng nghiệp vụ.

### 4. Khởi tạo Cơ sở dữ liệu (Supabase Migrations)
Khi kết nối dự án Supabase, copy và chạy lần lượt 3 file script SQL trong thư mục `supabase/migrations/` trên **Supabase SQL Editor**:
1. `20261002000001_initial_schema.sql`: Khởi tạo Enums, 8 Bảng dữ liệu, Foreign Keys, Check Constraints và Indexes.
2. `20261002000002_rls_policies.sql`: Thiết lập Row Level Security (RLS) cô lập tổ chức và phân quyền Role.
3. `20261002000003_seed_data.sql`: Nạp dữ liệu mẫu thực tế tại Hà Nội.

### 5. Khởi chạy máy chủ phát triển
```bash
npm run dev
```
Mở trình duyệt tại: `http://localhost:3000` (sẽ tự động chuyển hướng đến `/dashboard`).

---

## 👥 Tài khoản thử nghiệm (Demo Roles)

Hệ thống hỗ trợ nút bấm chọn nhanh tài khoản tại trang Đăng nhập (`/login`):

| Vai trò (Role) | Email đăng nhập | Trách nhiệm chính |
|---|---|---|
| **Project Manager (PM)** | `pm1@eventgo.vn` | Khởi tạo chiến dịch, import địa điểm từ Excel, gán nhân sự, xuất báo cáo. |
| **Site Supervisor (Giám sát)** | `supervisor1@eventgo.vn` | Giao diện mobile hiện trường: xem checklist, chụp/tải ảnh, nộp bằng chứng. |
| **Approver (Người kiểm duyệt)** | `approver1@eventgo.vn` | Kiểm tra ảnh phóng to, phê duyệt, bắt buộc lý do khi yêu cầu chụp lại. |

---

## 🧪 Kịch bản kiểm thử End-to-End (Demo Flow)

1. **Đăng nhập với vai trò PM**:
   - Truy cập `/campaigns` $\rightarrow$ Nhấn **"Tạo chiến dịch mới"** (VD: *Summer Activation 2026*).
   - Truy cập `/locations/import` $\rightarrow$ Tải lên file Excel mẫu để nhập hàng loạt các điểm Vincom, Aeon Mall.
2. **Đóng vai trò Site Supervisor (Hiện trường)**:
   - Mở chi tiết địa điểm `/locations/[id]` $\rightarrow$ Nhấn **"Chụp & Nộp bằng chứng"**.
   - Chọn tiêu chí cần nghiệm thu $\rightarrow$ Chọn/chụp ảnh từ điện thoại (ảnh tự động nén tối ưu dưới 600KB) $\rightarrow$ Nhập ghi chú $\rightarrow$ Nhấn **"Nộp bằng chứng"**.
3. **Đóng vai trò Approver (Duyệt)**:
   - Truy cập `/approvals` $\rightarrow$ Kiểm tra ảnh bằng chứng hiện trường phóng to.
   - Nhấn **"Yêu cầu chụp lại"** (bắt buộc nhập lý do: *"Ảnh logo bị lóa đèn sảnh"*).
   - Supervisor nộp lại ảnh mới $\rightarrow$ Approver nhấn **"Duyệt Đạt"**.
4. **Đóng vai trò PM (Xuất biên bản)**:
   - Truy cập `/reports` $\rightarrow$ Xem biên bản nghiệm thu chiến dịch tổng thể.
   - Nhấn **"In / Xuất PDF"** hoặc **"Xuất Excel (.xlsx)"** để bàn giao đối tác.

---

## 📦 Triển khai lên Vercel (Production Deployment)

1. Đẩy mã nguồn lên kho chứa GitHub.
2. Đăng nhập [Vercel](https://vercel.com/) $\rightarrow$ Chọn **"Add New Project"** $\rightarrow$ Import repository `eventgo_proof`.
3. Trong mục **Environment Variables**, điền đầy đủ các biến từ `.env.example`.
4. Nhấn **Deploy**. Ứng dụng chạy 100% serverless không phát sinh chi phí hạ tầng.
