-- ============================================================================
-- EventGo Proof: Fix RLS Policies for Profiles, Subscriptions & Transactions
-- (Loại bỏ triệt để lỗi Infinite Recursion trên bảng profiles và subscriptions)
-- ============================================================================

-- 1. Xóa ngay policy đệ quy vô tận trên bảng profiles (nguyên nhân gây sập RLS)
DROP POLICY IF EXISTS "System Admins can view all profiles" ON profiles;

-- 2. Tạo hàm kiểm tra System Admin với SECURITY DEFINER
-- Chạy dưới quyền superuser (bypasses RLS) nên KHÔNG BAO GIỜ bị đệ quy vô tận
CREATE OR REPLACE FUNCTION public.is_system_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT COALESCE(
        (SELECT is_system_admin FROM profiles WHERE id = auth.uid()),
        false
    );
$$;

-- 3. Cập nhật hàm can_view_profile (SECURITY DEFINER)
-- Cho phép: User xem chính mình, System Admin xem tất cả profiles, hoặc thành viên cùng Campaign
CREATE OR REPLACE FUNCTION public.can_view_profile(target_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT target_user_id = auth.uid()
    OR public.is_system_admin()
    OR EXISTS (
        SELECT 1
        FROM campaign_members my_membership
        JOIN campaign_members target_membership
          ON target_membership.campaign_id = my_membership.campaign_id
        WHERE my_membership.user_id = auth.uid()
          AND my_membership.status = 'ACTIVE'
          AND target_membership.user_id = target_user_id
    );
$$;

-- Cấp quyền thực thi hàm cho authenticated và service_role
GRANT EXECUTE ON FUNCTION public.is_system_admin() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.can_view_profile(UUID) TO authenticated, service_role;

-- 4. Đảm bảo RLS bảng profiles sử dụng can_view_profile
DROP POLICY IF EXISTS "Users can view profiles in their campaigns" ON profiles;
CREATE POLICY "Users can view profiles in their campaigns"
    ON profiles FOR SELECT
    TO authenticated
    USING (public.can_view_profile(id));

-- 5. Cập nhật RLS bảng subscriptions dùng public.is_system_admin() (an toàn 100%)
DROP POLICY IF EXISTS "Users can view own subscription" ON subscriptions;
CREATE POLICY "Users can view own subscription"
    ON subscriptions FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

DROP POLICY IF EXISTS "System Admins full access to subscriptions" ON subscriptions;
CREATE POLICY "System Admins full access to subscriptions"
    ON subscriptions FOR ALL
    TO authenticated
    USING (public.is_system_admin());

-- 6. Cập nhật RLS bảng transactions
DROP POLICY IF EXISTS "Users can insert own transactions" ON transactions;
CREATE POLICY "Users can insert own transactions"
    ON transactions FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own transactions" ON transactions;
CREATE POLICY "Users can update own transactions"
    ON transactions FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can view own transactions" ON transactions;
CREATE POLICY "Users can view own transactions"
    ON transactions FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

DROP POLICY IF EXISTS "System Admins full access to transactions" ON transactions;
CREATE POLICY "System Admins full access to transactions"
    ON transactions FOR ALL
    TO authenticated
    USING (public.is_system_admin());

-- 7. Cập nhật RLS bảng system_admin_invites
DROP POLICY IF EXISTS "System Admins manage admin invites" ON system_admin_invites;
CREATE POLICY "System Admins manage admin invites"
    ON system_admin_invites FOR ALL
    TO authenticated
    USING (public.is_system_admin());
