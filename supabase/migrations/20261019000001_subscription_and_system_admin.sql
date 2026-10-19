-- ============================================================================
-- EventGo Proof: System Admin, Subscription & Transaction Management Migration
-- ============================================================================

-- 1. Bổ sung cờ System Admin vào bảng profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS is_system_admin BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_profiles_system_admin ON profiles(is_system_admin) WHERE is_system_admin = TRUE;

-- 2. Tạo Enum cho gói dịch vụ và giao dịch
DO $$ BEGIN
    CREATE TYPE subscription_plan_tier AS ENUM ('FREE', 'STARTER', 'PRO');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE subscription_status AS ENUM ('ACTIVE', 'PAST_DUE', 'CANCELED', 'EXPIRED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE transaction_status AS ENUM ('PENDING', 'SUCCESS', 'FAILED', 'CANCELLED', 'REFUNDED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_gateway_provider AS ENUM ('PAYOS_VIETQR', 'MANUAL_BANK_TRANSFER');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 3. Bảng quản lý Subscription của từng người dùng
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
    plan subscription_plan_tier NOT NULL DEFAULT 'FREE',
    status subscription_status NOT NULL DEFAULT 'ACTIVE',
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ, -- NULL nghĩa là không giới hạn (dành cho gói Free)
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan ON subscriptions(plan);
CREATE INDEX IF NOT EXISTS idx_subscriptions_expires_at ON subscriptions(expires_at);

-- 4. Bảng lời mời System Admin qua Email
CREATE TABLE IF NOT EXISTS system_admin_invites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL,
    invited_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'ACCEPTED', 'REVOKED'
    accepted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_pending_admin_invites_email 
ON system_admin_invites (LOWER(email)) 
WHERE status = 'PENDING';

-- 5. Bảng quản lý Đơn hàng & Giao dịch Thanh toán (Transactions)
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_code VARCHAR(100) UNIQUE NOT NULL,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    plan subscription_plan_tier NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'VND',
    provider payment_gateway_provider NOT NULL DEFAULT 'PAYOS_VIETQR',
    status transaction_status NOT NULL DEFAULT 'PENDING',
    payment_url TEXT,
    qr_code_url TEXT,
    gateway_transaction_id VARCHAR(255),
    notes TEXT,
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_code ON transactions(transaction_code);

-- 6. Row Level Security (RLS)
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_admin_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Subscriptions: User tự xem của mình; System Admin toàn quyền xem và sửa
CREATE POLICY "Users can view own subscription"
    ON subscriptions FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "System Admins full access to subscriptions"
    ON subscriptions FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() AND profiles.is_system_admin = TRUE
        )
    );

-- Transactions: User xem giao dịch của mình; System Admin toàn quyền xem và sửa
CREATE POLICY "Users can view own transactions"
    ON transactions FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "System Admins full access to transactions"
    ON transactions FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() AND profiles.is_system_admin = TRUE
        )
    );

-- System Admin Invites: Chỉ System Admin mới được quản lý
CREATE POLICY "System Admins manage admin invites"
    ON system_admin_invites FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() AND profiles.is_system_admin = TRUE
        )
    );

-- Checklist Templates: Cập nhật RLS cho phép Admin thêm/sửa/xóa mẫu
CREATE POLICY "System Admins can mutate checklist templates"
    ON checklist_templates FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() AND profiles.is_system_admin = TRUE
        )
    );

CREATE POLICY "System Admins can mutate checklist template items"
    ON checklist_template_items FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() AND profiles.is_system_admin = TRUE
        )
    );

-- 7. Trigger tự động cấp gói FREE khi có Profile mới (Auto-provisioning)
CREATE OR REPLACE FUNCTION handle_new_user_subscription()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO subscriptions (user_id, plan, status, started_at, expires_at)
    VALUES (NEW.id, 'FREE', 'ACTIVE', NOW(), NULL)
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_profile_created_create_subscription ON profiles;
CREATE TRIGGER on_profile_created_create_subscription
    AFTER INSERT ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user_subscription();

-- 8. Function kích hoạt quyền Admin khi chấp nhận lời mời pending
CREATE OR REPLACE FUNCTION accept_pending_admin_invites()
RETURNS VOID AS $$
DECLARE
    v_user_email VARCHAR(255);
    v_user_id UUID;
    v_has_invite BOOLEAN;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RETURN;
    END IF;

    SELECT LOWER(email) INTO v_user_email FROM profiles WHERE id = v_user_id;
    IF v_user_email IS NULL THEN
        RETURN;
    END IF;

    -- Kiểm tra xem có lời mời pending cho email này không
    SELECT EXISTS (
        SELECT 1 FROM system_admin_invites 
        WHERE LOWER(email) = v_user_email AND status = 'PENDING'
    ) INTO v_has_invite;

    IF v_has_invite THEN
        -- Cập nhật quyền Admin cho user
        UPDATE profiles SET is_system_admin = TRUE, updated_at = NOW() WHERE id = v_user_id;

        -- Đánh dấu lời mời đã được chấp nhận
        UPDATE system_admin_invites 
        SET status = 'ACCEPTED', accepted_at = NOW(), updated_at = NOW()
        WHERE LOWER(email) = v_user_email AND status = 'PENDING';

        -- Tự động gán gói PRO cho Admin
        INSERT INTO subscriptions (user_id, plan, status, started_at, expires_at)
        VALUES (v_user_id, 'PRO', 'ACTIVE', NOW(), NULL)
        ON CONFLICT (user_id) 
        DO UPDATE SET plan = 'PRO', status = 'ACTIVE', expires_at = NULL, updated_at = NOW();
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
