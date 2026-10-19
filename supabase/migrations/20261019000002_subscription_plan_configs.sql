-- ============================================================================
-- EventGo Proof: Dynamic Subscription Plan Configurations Migration
-- ============================================================================

-- 1. Bảng cấu hình gói dịch vụ (Pricing, Quota, Features, Status)
CREATE TABLE IF NOT EXISTS subscription_plan_configs (
    tier subscription_plan_tier PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    price_monthly_vnd NUMERIC(12, 0) NOT NULL DEFAULT 0,
    max_active_campaigns INTEGER NOT NULL DEFAULT 2,
    max_booths INTEGER, -- NULL = Không giới hạn
    max_participants INTEGER, -- NULL = Không giới hạn
    description TEXT NOT NULL DEFAULT '',
    features JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_popular BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger auto-update updated_at
CREATE OR REPLACE TRIGGER update_subscription_plan_configs_modtime
    BEFORE UPDATE ON subscription_plan_configs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 2. Row Level Security (RLS)
ALTER TABLE subscription_plan_configs ENABLE ROW LEVEL SECURITY;

-- Mọi người dùng (kể cả khách vãng lai hoặc đã đăng nhập) đều có thể xem cấu hình gói
CREATE POLICY "Public read subscription plan configs"
    ON subscription_plan_configs FOR SELECT
    USING (true);

-- Chỉ System Admin mới có quyền thêm/sửa/xóa cấu hình gói
CREATE POLICY "System Admins full access to subscription plan configs"
    ON subscription_plan_configs FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.is_system_admin = TRUE
        )
    );

-- 3. Khởi tạo dữ liệu mặc định (Seed Data)
INSERT INTO subscription_plan_configs (
    tier, 
    name, 
    price_monthly_vnd, 
    max_active_campaigns, 
    max_booths, 
    max_participants, 
    description, 
    features, 
    is_popular, 
    is_active
) VALUES 
(
    'FREE',
    'Gói Free',
    0,
    2,
    NULL,
    NULL,
    'Cá nhân hoặc chạy thử nghiệm 1-2 chiến dịch song song',
    '["2 Chiến dịch hoạt động cùng lúc", "Không giới hạn Booths & Người tham gia", "Bộ tiêu chí Checklist cơ bản"]'::jsonb,
    FALSE,
    TRUE
),
(
    'STARTER',
    'Gói Starter',
    2000,
    5,
    NULL,
    NULL,
    'Dành cho Agency sự kiện vừa & nhỏ chạy đồng thời',
    '["5 Chiến dịch hoạt động cùng lúc", "Không giới hạn Booths & Người tham gia", "Thư viện mẫu Checklist chuẩn hóa", "Cộng dồn thời gian khi thanh toán sớm"]'::jsonb,
    TRUE,
    TRUE
),
(
    'PRO',
    'Gói Pro',
    5000,
    20,
    NULL,
    NULL,
    'Agency chuyên nghiệp & Nhãn hàng chạy quy mô lớn',
    '["20 Chiến dịch hoạt động cùng lúc", "Không giới hạn Booths & Người tham gia", "Ưu tiên tốc độ xử lý biên bản & đối soát", "Hỗ trợ kỹ thuật 24/7"]'::jsonb,
    FALSE,
    TRUE
)
ON CONFLICT (tier) DO NOTHING;
