-- Migration: Bổ sung RLS policies cho việc tạo campaign và gán manager ban đầu
-- Giúp người dùng có thể tạo chiến dịch và truy cập ngay cả khi sử dụng direct insert

-- 1. Cho phép authenticated user tạo campaign mới do chính mình làm creator
DROP POLICY IF EXISTS "Authenticated users can create campaigns" ON campaigns;
CREATE POLICY "Authenticated users can create campaigns"
ON campaigns FOR INSERT
TO authenticated
WITH CHECK (created_by = auth.uid());

-- 2. Cập nhật policy SELECT của campaigns để người tạo chiến dịch luôn đọc được bản ghi của mình (trước khi hoặc cùng lúc gia nhập campaign_members)
DROP POLICY IF EXISTS "Assigned users can view campaigns" ON campaigns;
CREATE POLICY "Assigned users can view campaigns"
ON campaigns FOR SELECT
TO authenticated
USING (created_by = auth.uid() OR public.can_access_campaign(id));

-- 3. Cho phép người tạo campaign thêm bản ghi thành viên đầu tiên của chính chiến dịch đó
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
