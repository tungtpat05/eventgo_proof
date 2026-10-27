<div align="center">

# 🎪 EventGo Proof
### Nền Tảng B2B SaaS Quản Lý & Nghiệm Thu Hiện Trường Sự Kiện

[![Production URL](https://img.shields.io/badge/Live_Demo-eventgo--proof.stup.id.vn-2563EB?style=for-the-badge&logo=vercel&logoColor=white)](https://eventgo-proof.stup.id.vn)

[![Next.js](https://img.shields.io/badge/Next.js-16.3-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2-20232A?style=flat-square&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x_Strict-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Database-Supabase_PostgreSQL-3ECF8E?style=flat-square&logo=supabase)](https://supabase.com/)
[![VietQR payOS](https://img.shields.io/badge/Payment-VietQR_payOS-0052CC?style=flat-square)](https://payos.vn/)
[![License](https://img.shields.io/badge/License-Proprietary-red?style=flat-square)](#-bản-quyền--giấy-phép)

<br />

> **EventGo Proof** là giải pháp phần mềm B2B SaaS số hóa toàn diện quy trình giám sát tuân thủ, thu thập bằng chứng hình ảnh hiện trường, thẩm định chất lượng và xuất biên bản nghiệm thu đối soát cho các chiến dịch kích hoạt thương hiệu (Brand Activation, Booths, Roadshows, Trade Marketing) trên quy mô lớn.

</div>

---

## 🌐 Trải nghiệm Trực tiếp (Live Production)

Hệ thống đã được triển khai chính thức trên môi trường Production tại:

👉 **[https://eventgo-proof.stup.id.vn](https://eventgo-proof.stup.id.vn)**

> **Lưu ý đăng nhập:** Hệ thống vận hành bằng tài khoản **Google OAuth** thực tế thông qua Supabase Auth. Bạn chỉ cần dùng tài khoản Google bất kỳ để đăng nhập, hệ thống sẽ tự động khởi tạo hồ sơ người dùng để trải nghiệm tạo chiến dịch hoặc tham gia nghiệm thu.

---

## 🎯 Quy trình nghiệp vụ cốt lõi (Core Workflow)

Hệ thống kết nối các bên tham gia trong suốt vòng đời của chiến dịch kích hoạt thương hiệu:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        CHIẾN DỊCH (CAMPAIGN)                           │
│  Tạo chiến dịch, thiết lập ngày bắt đầu/kết thúc, phân quyền thành viên│
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                    ĐỊA ĐIỂM TRIỂN KHAI (LOCATIONS)                     │
│    Khởi tạo điểm booth / Nhập hàng loạt từ danh sách Excel (.xlsx)     │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│              BỘ TIÊU CHÍ CHUẨN HÓA (CHECKLIST PRESETS)                 │
│  Kết cấu & Khung gian hàng │ Logo & Brand Identity │ POSM & Quà tặng   │
│  Sắp đặt & Trưng bày hàng hóa │ Nhân sự & Đồng phục PG/PB              │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│               THU THẬP BẰNG CHỨNG (EVIDENCE COLLECTION)                │
│  Giám sát viên (Supervisor) chụp ảnh hiện trường trên Mobile           │
│  Ảnh nén tự động trên client (< 600KB) & Upload trực tiếp Cloudinary   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   THẨM ĐỊNH & DUYỆT (APPROVAL FLOW)                    │
│  Người duyệt (Approver) kiểm tra bằng chứng phóng to:                  │
│  - Duyệt Đạt (Approve) ──► Ghi nhận kết quả nghiệm thu                 │
│  - Yêu cầu chụp lại (Revision) ──► Kèm lý do cụ thể, gửi lại hiện trường
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│              BIÊN BẢN NGHIỆM THU & BÁO CÁO (REPORTING)                 │
│  - Xuất Biên bản nghiệm thu tiêu chuẩn Vector PDF khổ A4 (@media print)│
│  - Xuất Bảng kê đối soát hiện trường chi tiết định dạng Excel (.xlsx)  │
└────────────────────────────────────────────────────────────────────────┘
```

---

## ✨ Tính năng nổi bật (Key Features)

### 1. Vận hành hiện trường & Thu thập bằng chứng
- **Tối ưu Mobile First**: Giao diện thao tác hiện trường mượt mà, hỗ trợ camera chụp ảnh trực tiếp và chọn từ thư viện ảnh.
- **Nén ảnh thông minh phía Client**: Giảm kích thước ảnh xuống dưới 600KB trước khi upload, tiết kiệm 80% băng thông 4G/5G tại hiện trường.
- **Tải ảnh an toàn (Direct Signed Upload)**: Upload trực tiếp lên Cloudinary CDN thông qua chữ ký số từ server, không làm tắc nghẽn backend.
- **Nhập dữ liệu địa điểm hàng loạt**: Đọc và kiểm tra file Excel (`.xlsx`) danh sách gian hàng, tự động phát hiện lỗi trùng lặp.

### 2. Thẩm định & Phê duyệt minh bạch
- **Duyệt theo từng tiêu chí**: Kiểm tra ảnh bằng chứng độ phân giải cao, hỗ trợ phóng to (zoom preview).
- **Luồng phản hồi hai chiều**: Cho phép trả về yêu cầu nộp lại ảnh (Revision) kèm ghi chú lý do bắt buộc (ví dụ: *ảnh mờ, góc chụp thiếu logo, POSM bị rách*).
- **Nhật ký kiểm toán (Audit Trail)**: Lưu vết đầy đủ lịch sử duyệt, người duyệt, thời gian và lý do chỉnh sửa.

### 3. Báo cáo & Nghiệm thu chuẩn doanh nghiệp
- **Biên bản nghiệm thu A4 Vector PDF**: Sử dụng CSS `@media print` căn chuẩn lưới A4, tự động ngắt trang, in ấn sắc nét phục vụ ký nhận bàn giao.
- **Xuất bảng kê Excel (`.xlsx`)**: Tích hợp SheetJS trích xuất chi tiết dữ liệu phục vụ bộ phận kế toán và quyết toán thương hiệu.

### 4. Gói cước & Cổng thanh toán VietQR (Billing & Subscriptions)
- **Tích hợp Open Banking VietQR (payOS)**: Tạo mã QR thanh toán động cho từng giao dịch gia hạn hoặc nâng cấp gói cước.
- **Xác thực Webhook tự động**: Xử lý kích hoạt gói và tăng hạn mức chiến dịch ngay khi tiền vào tài khoản với chữ ký bảo mật checksum.
- **Phân tầng gói dịch vụ**: Hỗ trợ các gói `FREE`, `STARTER`, `PRO` với hạn mức chiến dịch và tài nguyên linh hoạt.

### 5. Quản trị hệ thống (System Admin Portal)
- Phân quyền chuyên biệt cho Quản trị viên hệ thống (`profiles.is_system_admin`) tại khu vực `/admin`.
- Giám sát toàn bộ người dùng, đối soát giao dịch thanh toán và quản lý cấu hình các cổng thanh toán.

### 6. Đa ngôn ngữ (i18n)
- Hỗ trợ đầy đủ song ngữ **Tiếng Việt** và **English** thông qua thư viện `next-intl`.

---

## 🏗️ Kiến trúc kỹ thuật (Tech Stack & Architecture)

### Công nghệ sử dụng
- **Core Framework**: [Next.js 16](https://nextjs.org/) (App Router, Server Components, Server Actions).
- **UI & Runtime**: [React 19](https://react.dev/), TypeScript Strict Mode.
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/), Lucide Icons.
- **Cơ sở dữ liệu & Phân quyền**: [Supabase](https://supabase.com/) PostgreSQL với Row-Level Security (RLS) bảo vệ đa tầng và các hàm RPC nguyên tử (Atomic RPCs).
- **Xác thực**: Google OAuth 2.0 qua Supabase Auth.
- **Lưu trữ đa phương tiện**: [Cloudinary](https://cloudinary.com/) Media Storage & CDN.
- **Cổng thanh toán**: [payOS](https://payos.vn/) (Open Banking VietQR API).
- **Xử lý tài liệu**: [SheetJS](https://sheetjs.com/) (`xlsx`) & CSS Vector Print Engine.
- **Thông báo Email**: [Nodemailer](https://nodemailer.com/) với giao thức SMTP bảo mật.

### Mô hình kiến trúc: Pragmatic Clean Architecture
Dự án áp dụng mô hình phân lớp rõ ràng nhằm đảm bảo khả năng kiểm thử, mở rộng và bảo mật logic nghiệp vụ:

```
src/
├── app/                  # Next.js App Router (Dashboard, Admin, Auth, API Routes & Webhook)
├── components/           # UI Components tái sử dụng (Buttons, Cards, Dialogs, Tables)
├── features/             # Các khối tính năng nghiệp vụ & Server Actions
├── domain/               # Thực thể nghiệp vụ cốt lõi, Enums, Domain Errors & Repository Ports
├── application/          # Use cases, DTOs, tương tác nghiệp vụ & Zod Schemas
├── infrastructure/       # Bộ chuyển đổi ngoài: Supabase, Cloudinary, payOS, SheetJS, Mailer
├── config/               # Cấu hình biến môi trường tập trung có Zod validation
├── lib/                  # Tiện ích chung, bộ định dạng thời gian/tiền tệ, class merger
└── messages/             # Từ điển ngôn ngữ cho i18n (vi.json, en.json)
```

---

## 👥 Mô hình Phân quyền (RBAC Model)

Hệ thống áp dụng mô hình phân quyền chặt chẽ theo từng chiến dịch:

| Vai trò (Role) | Phạm vi & Trách nhiệm | Quyền hạn chính |
| :--- | :--- | :--- |
| **MANAGER** | Quản lý Chiến dịch | Tạo & chỉnh sửa chiến dịch, import địa điểm, gán nhân sự (Supervisor / Approver), xuất biên bản PDF/Excel, quản trị gói cước. |
| **SUPERVISOR** | Giám sát viên hiện trường | Xem danh sách booth được phân công, chụp và nộp ảnh bằng chứng theo từng tiêu chuẩn kiểm tra. |
| **APPROVER** | Thẩm định viên | Xem xét bằng chứng các booth được phân công, duyệt Đạt (Approve) hoặc yêu cầu chụp lại (Revision). |
| **SYSTEM ADMIN** | Quản trị viên hệ thống | Quản trị nền tảng (`/admin`), giám sát toàn bộ người dùng, đối soát giao dịch VietQR và cấu hình gói cước. |

> **Nguyên tắc cô lập dữ liệu:** Supervisor và Approver chỉ được truy cập vào đúng các địa điểm/hồ sơ nộp mà họ được chỉ định phân công, được bảo vệ nghiêm ngặt ở tầng cơ sở dữ liệu qua PostgreSQL Row Level Security (RLS).

---

## 🚀 Hướng dẫn Cài đặt & Chạy Local (Local Development)

### 1. Yêu cầu môi trường
- **Node.js**: Phiên bản 18.18 trở lên (Khuyến nghị **Node.js 20 LTS** hoặc **22 LTS**).
- **NPM**: Đi kèm với Node.js.
- Tài khoản [Supabase](https://supabase.com/), [Cloudinary](https://cloudinary.com/), và [payOS](https://payos.vn/) (nếu thử nghiệm thanh toán).

### 2. Cài đặt mã nguồn
```bash
git clone https://github.com/tungtpat05/eventgo_proof.git
cd eventgo_proof
npm install
```

### 3. Cấu hình biến môi trường (`.env.local`)
Tạo file cấu hình local từ mẫu:
```bash
cp .env.example .env.local
```

Mở file `.env.local` và điền các khóa API tương ứng:

```bash
# --- 1. Supabase (Bắt buộc) ---
# Lấy tại: https://supabase.com -> Project Settings -> API
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# --- 2. Cloudinary (Bắt buộc) ---
# Lấy tại: https://cloudinary.com -> Dashboard
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret

# --- 3. PayOS VietQR Open Banking (Tùy chọn cho luồng thanh toán) ---
# Lấy tại: https://payos.vn -> Kênh thanh toán
PAYOS_CLIENT_ID=your-payos-client-id
PAYOS_API_KEY=your-payos-api-key
PAYOS_CHECKSUM_KEY=your-payos-checksum-key

# --- 4. Cấu hình ứng dụng ---
NEXT_PUBLIC_APP_URL=http://localhost:3000

# --- 5. Email SMTP Configuration (Tùy chọn gửi email thông báo) ---
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-google-app-password
SMTP_FROM="EventGo Proof" <your-email@gmail.com>
```

> **Lưu ý xác thực Google trong Supabase:**
> 1. Truy cập Supabase Dashboard: **Authentication** $\rightarrow$ **Providers** $\rightarrow$ Kích hoạt **Google**.
> 2. Thêm Redirect URL: `http://localhost:3000/auth/callback` (và URL production tương ứng).

### 4. Khởi tạo Cơ sở dữ liệu (Supabase Database Migrations)

Cơ sở dữ liệu của EventGo Proof bao gồm schema, các bảng audit, phân quyền RLS và các thủ tục RPC. Hãy thực thi các file SQL trong thư mục `supabase/migrations/` theo thứ tự thời gian trên **Supabase SQL Editor** hoặc qua Supabase CLI:

```bash
# Thứ tự các file migration:
1. 20261002000001_initial_schema.sql
2. 20261002000002_rls_policies.sql
3. 20261002000003_seed_data.sql
4. 20261006000001_campaign_wizard_and_templates.sql
5. 20261007000001_add_campaign_insert_policy.sql
6. 20261007000002_fix_all_rls_policies.sql
7. 20261019000001_subscription_and_system_admin.sql
8. 20261019000002_subscription_plan_configs.sql
9. 20261019000003_fix_subscription_and_transaction_rls.sql
10. 20261019000004_fix_system_admin_invites_constraint.sql
11. 20261021000001_support_pending_assignments_and_invites.sql
12. 20261026000001_secure_activation_readiness_rpc.sql
13. 20261026000002_atomic_personnel_management_and_invites.sql
```

*(Nếu sử dụng Supabase CLI: Chạy lệnh `npx supabase db push` để tự động đồng bộ toàn bộ migration).*

### 5. Khởi chạy ứng dụng
```bash
npm run dev
```

Mở trình duyệt tại: **`http://localhost:3000`**

---

## 🧪 Kiểm thử & Đảm bảo Chất lượng (Testing & QA)

Dự án duy trì bộ kiểm thử tự động toàn diện bao gồm kiểm tra hợp đồng cơ sở dữ liệu, phân quyền bảo mật, xác thực Webhook và đồng bộ từ điển đa ngôn ngữ:

```bash
# Chạy toàn bộ các test cases tự động
npm test

# Kiểm tra chất lượng mã nguồn với ESLint
npm run lint

# Kiểm tra an toàn kiểu dữ liệu với TypeScript Compiler
npx tsc --noEmit
```

Các kịch bản kiểm thử chính trong thư mục `tests/`:
- `payos-webhook-validation.test.ts`: Kiểm tra xác thực chữ ký số webhook thanh toán VietQR.
- `batch-assignment-protection.test.ts`: Kiểm tra bảo vệ quyền phân công hàng loạt nhân sự.
- `campaign-member-actions.test.ts`: Kiểm tra các hành động và ràng buộc vai trò của thành viên.
- `campaign-date-validation.test.ts`: Kiểm tra tính hợp lệ của thời gian bắt đầu/kết thúc chiến dịch.
- `i18n-catalog-parity.test.ts`: Đảm bảo từ điển song ngữ Việt - Anh hoàn toàn khớp cấu trúc.

---

## 📦 Hướng dẫn Triển khai Production (Vercel)

Dự án được tối ưu hóa 100% để triển khai serverless trên **Vercel**:

1. Đẩy mã nguồn lên repository GitHub của bạn.
2. Truy cập [Vercel Dashboard](https://vercel.com/) $\rightarrow$ Chọn **Add New Project** $\rightarrow$ Import repository `eventgo_proof`.
3. Trong mục **Environment Variables**, sao chép toàn bộ các biến từ file `.env.example` và điền giá trị Production.
4. Đảm bảo cấu hình biến `NEXT_PUBLIC_APP_URL` chính xác với domain của bạn (ví dụ: `https://eventgo-proof.stup.id.vn`).
5. Thêm domain production vào **Redirect URLs** trên cấu hình Supabase Auth.
6. Nhấn **Deploy**.

---

## 📄 Bản quyền & Giấy phép

Dự án thuộc sở hữu của đội ngũ phát triển **EventGo Proof**. Mọi quyền được bảo lưu (All Rights Reserved).

Mọi thông tin liên hệ, phản hồi tính năng hoặc yêu cầu hỗ trợ kỹ thuật, vui lòng tạo **Issue** trên repository hoặc liên hệ quản trị viên dự án.
