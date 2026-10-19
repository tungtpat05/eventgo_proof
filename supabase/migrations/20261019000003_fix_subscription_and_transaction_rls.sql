-- ============================================================================
-- EventGo Proof: Fix RLS Policies for Transactions and Subscriptions
-- ============================================================================

-- 1. Cho phép Authenticated User tự tạo bản ghi giao dịch thanh toán cho chính mình
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'transactions' 
        AND policyname = 'Users can insert own transactions'
    ) THEN
        CREATE POLICY "Users can insert own transactions"
            ON transactions FOR INSERT
            TO authenticated
            WITH CHECK (user_id = auth.uid());
    END IF;
END $$;

-- 2. Cho phép Authenticated User cập nhật trạng thái giao dịch của chính mình nếu cần
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'transactions' 
        AND policyname = 'Users can update own transactions'
    ) THEN
        CREATE POLICY "Users can update own transactions"
            ON transactions FOR UPDATE
            TO authenticated
            USING (user_id = auth.uid())
            WITH CHECK (user_id = auth.uid());
    END IF;
END $$;

-- Ghi chú: Hệ thống Backend Server Actions và Webhook tự động sử dụng SUPABASE_SERVICE_ROLE_KEY
-- để nâng gói và cập nhật đối soát độc lập, tránh phụ thuộc vào RLS phiên người dùng thông thường.
