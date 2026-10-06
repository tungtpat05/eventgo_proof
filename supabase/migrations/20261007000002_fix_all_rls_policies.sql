-- ============================================================================
-- Migration: Sửa đổi và tối ưu hóa toàn diện các RLS Policies trong hệ thống
-- Giải quyết triệt để lỗi snapshot uncommitted rows khi INSERT ... RETURNING
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
-- 3. BẢNG LOCATIONS
-- ----------------------------------------------------------------------------
-- Sửa policy SELECT: Không gọi hàm đệ quy can_access_location(id) vì hàm STABLE
-- sẽ không nhìn thấy row vừa insert trong mệnh đề RETURNING id.
-- Truy cập trực tiếp cột campaign_id của row đang xét.
DROP POLICY IF EXISTS "Assigned users can view locations" ON locations;
CREATE POLICY "Assigned users can view locations"
ON locations FOR SELECT
TO authenticated
USING (
    public.is_campaign_manager(campaign_id)
    OR EXISTS (
        SELECT 1 FROM booths b
        WHERE b.location_id = locations.id
          AND (
              public.is_booth_supervisor(b.id)
              OR public.is_booth_approver(b.id)
          )
    )
);

-- Đảm bảo policy INSERT của locations chuẩn xác
DROP POLICY IF EXISTS "Managers can create locations" ON locations;
CREATE POLICY "Managers can create locations"
ON locations FOR INSERT
TO authenticated
WITH CHECK (public.is_campaign_manager(campaign_id));

-- ----------------------------------------------------------------------------
-- 4. BẢNG BOOTHS
-- ----------------------------------------------------------------------------
-- Tương tự locations: Sửa policy SELECT của booths để không tự query lại booths(id)
-- mà kiểm tra trực tiếp qua location_id đã tồn tại.
DROP POLICY IF EXISTS "Assigned users can view booths" ON booths;
CREATE POLICY "Assigned users can view booths"
ON booths FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM locations l
        WHERE l.id = booths.location_id
          AND public.is_campaign_manager(l.campaign_id)
    )
    OR public.is_booth_supervisor(id)
    OR public.is_booth_approver(id)
);

-- Policy INSERT của booths
DROP POLICY IF EXISTS "Managers can create booths" ON booths;
CREATE POLICY "Managers can create booths"
ON booths FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM locations l
        WHERE l.id = booths.location_id
          AND public.is_campaign_manager(l.campaign_id)
    )
);

-- ----------------------------------------------------------------------------
-- 5. BẢNG SUBMISSIONS (Dự phòng cho direct insert/select)
-- ----------------------------------------------------------------------------
-- Tối ưu policy SELECT của submissions để tránh đệ quy snapshot
DROP POLICY IF EXISTS "Assigned users can view submissions" ON submissions;
CREATE POLICY "Assigned users can view submissions"
ON submissions FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM booths b
        JOIN locations l ON l.id = b.location_id
        WHERE b.id = submissions.booth_id
          AND (
              public.is_campaign_manager(l.campaign_id)
              OR public.is_booth_supervisor(b.id)
          )
    )
    OR public.is_submission_approver(id)
);
