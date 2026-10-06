-- ============================================================================
-- Migration: Sửa đổi và tối ưu hóa toàn diện các RLS Policies trong hệ thống
-- Giải quyết triệt để lỗi snapshot uncommitted rows và infinite recursion (42P17)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. BẢNG CAMPAIGNS
-- ----------------------------------------------------------------------------
-- Cho phép authenticated user tạo campaign mới do mình tạo
DROP POLICY IF EXISTS "Authenticated users can create campaigns" ON campaigns;
CREATE POLICY "Authenticated users can create campaigns"
ON campaigns FOR INSERT
TO authenticated
WITH CHECK (created_by = auth.uid());

-- Đảm bảo người tạo luôn đọc được chiến dịch của mình (phục vụ RETURNING id)
DROP POLICY IF EXISTS "Assigned users can view campaigns" ON campaigns;
CREATE POLICY "Assigned users can view campaigns"
ON campaigns FOR SELECT
TO authenticated
USING (created_by = auth.uid() OR public.can_access_campaign(id));

-- ----------------------------------------------------------------------------
-- 2. BẢNG CAMPAIGN_MEMBERS
-- ----------------------------------------------------------------------------
-- Cho phép Manager thêm thành viên HOẶC người tạo chiến dịch tự thêm bản ghi đầu tiên
DROP POLICY IF EXISTS "Managers can add campaign members" ON campaign_members;
CREATE POLICY "Managers can add campaign members"
ON campaign_members FOR INSERT
TO authenticated
WITH CHECK (
    public.is_campaign_manager(campaign_id)
    OR EXISTS (
        SELECT 1 FROM campaigns
        WHERE id = campaign_members.campaign_id
          AND created_by = auth.uid()
    )
);

-- ----------------------------------------------------------------------------
-- 3. CÁC HÀM SECURITY DEFINER ĐỂ TRÁNH INFINITE RECURSION (LỖI 42P17)
-- ----------------------------------------------------------------------------
-- Khi policy của bảng locations truy vấn booths và policy của booths truy vấn locations,
-- PostgreSQL sẽ báo lỗi 'infinite recursion detected in policy' (42P17).
-- Để cắt đứt chu kỳ đệ quy, các hàm kiểm tra phân quyền liên bảng PHẢI là SECURITY DEFINER
-- để chạy dưới quyền database owner và KHÔNG kích hoạt kiểm tra RLS lặp lại.

-- Hàm kiểm tra user có quyền quản lý location (dành cho bảng booths)
CREATE OR REPLACE FUNCTION public.is_location_manager(target_location_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM locations l
        JOIN campaign_members cm ON cm.campaign_id = l.campaign_id
        WHERE l.id = target_location_id
          AND cm.user_id = auth.uid()
          AND cm.role = 'MANAGER'
          AND cm.status = 'ACTIVE'
    );
$$;

-- Hàm kiểm tra user là supervisor hoặc approver trong location (dành cho bảng locations)
CREATE OR REPLACE FUNCTION public.is_location_supervisor_or_approver(target_location_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM booths b
        WHERE b.location_id = target_location_id
          AND (
              public.is_booth_supervisor(b.id)
              OR public.is_booth_approver(b.id)
          )
    );
$$;

-- Hàm kiểm tra quyền xem submission (dành cho bảng submissions)
CREATE OR REPLACE FUNCTION public.can_view_submission(target_submission_id UUID, target_booth_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM booths b
        JOIN locations l ON l.id = b.location_id
        WHERE b.id = target_booth_id
          AND (
              public.is_campaign_manager(l.campaign_id)
              OR public.is_booth_supervisor(b.id)
          )
    )
    OR public.is_submission_approver(target_submission_id);
$$;

GRANT EXECUTE ON FUNCTION public.is_location_manager(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_location_supervisor_or_approver(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.can_view_submission(UUID, UUID) TO authenticated, service_role;

-- ----------------------------------------------------------------------------
-- 4. BẢNG LOCATIONS
-- ----------------------------------------------------------------------------
-- Sửa policy SELECT:
-- 1) Manager kiểm tra trực tiếp cột campaign_id (không đệ quy, không lỗi uncommitted snapshot)
-- 2) Supervisor/Approver kiểm tra qua hàm SECURITY DEFINER (cắt đứt đệ quy sang booths)
DROP POLICY IF EXISTS "Assigned users can view locations" ON locations;
CREATE POLICY "Assigned users can view locations"
ON locations FOR SELECT
TO authenticated
USING (
    public.is_campaign_manager(campaign_id)
    OR public.is_location_supervisor_or_approver(id)
);

DROP POLICY IF EXISTS "Managers can create locations" ON locations;
CREATE POLICY "Managers can create locations"
ON locations FOR INSERT
TO authenticated
WITH CHECK (public.is_campaign_manager(campaign_id));

DROP POLICY IF EXISTS "Managers can update locations" ON locations;
CREATE POLICY "Managers can update locations"
ON locations FOR UPDATE
TO authenticated
USING (public.is_campaign_manager(campaign_id))
WITH CHECK (public.is_campaign_manager(campaign_id));

DROP POLICY IF EXISTS "Managers can delete locations" ON locations;
CREATE POLICY "Managers can delete locations"
ON locations FOR DELETE
TO authenticated
USING (public.is_campaign_manager(campaign_id));

-- ----------------------------------------------------------------------------
-- 5. BẢNG BOOTHS
-- ----------------------------------------------------------------------------
-- Sửa policy SELECT & INSERT/UPDATE/DELETE:
-- Sử dụng is_location_manager(location_id) là hàm SECURITY DEFINER để cắt đứt đệ quy ngược lại locations
DROP POLICY IF EXISTS "Assigned users can view booths" ON booths;
CREATE POLICY "Assigned users can view booths"
ON booths FOR SELECT
TO authenticated
USING (
    public.is_location_manager(location_id)
    OR public.is_booth_supervisor(id)
    OR public.is_booth_approver(id)
);

DROP POLICY IF EXISTS "Managers can create booths" ON booths;
CREATE POLICY "Managers can create booths"
ON booths FOR INSERT
TO authenticated
WITH CHECK (
    public.is_location_manager(location_id)
);

DROP POLICY IF EXISTS "Managers can update booths" ON booths;
CREATE POLICY "Managers can update booths"
ON booths FOR UPDATE
TO authenticated
USING (public.is_location_manager(location_id))
WITH CHECK (public.is_location_manager(location_id));

DROP POLICY IF EXISTS "Managers can delete booths" ON booths;
CREATE POLICY "Managers can delete booths"
ON booths FOR DELETE
TO authenticated
USING (public.is_location_manager(location_id));

-- ----------------------------------------------------------------------------
-- 6. BẢNG SUBMISSIONS
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Assigned users can view submissions" ON submissions;
CREATE POLICY "Assigned users can view submissions"
ON submissions FOR SELECT
TO authenticated
USING (
    public.can_view_submission(id, booth_id)
);
