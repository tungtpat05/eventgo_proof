-- ============================================================================
-- Migration: 20261026000002_atomic_personnel_management_and_invites.sql
-- Description:
-- 1. Thu hồi thành viên nguyên tử (set_campaign_member_access):
--    - Dọn dẹp booth_supervisor_assignments và booth_approver_assignments trong cùng transaction.
--    - Chặn thu hồi nếu Approver đang có bài nộp ở trạng thái 'SUBMITTED' (tránh mồ côi bài nộp).
--    - Đảm bảo thiết lập đầy đủ status='REVOKED', revoked_at=NOW(), revoked_by=auth.uid()
--      thỏa mãn constraint revoked_state_is_consistent.
-- 2. Hủy lời mời an toàn (cancel_campaign_invite):
--    - Khóa bản ghi invite FOR UPDATE, kiểm tra status='PENDING'.
--    - Báo lỗi nếu người nhận đã chấp nhận lời mời (status='ACCEPTED').
--    - Kích hoạt ON DELETE CASCADE tự động dọn booth assignments.
-- 3. Chống mời trùng (invite_campaign_member):
--    - Bỏ cơ chế UPSERT âm thầm ghi đè vai trò (Silent Role Overwrite).
--    - Báo lỗi rõ ràng nếu email đã là thành viên ACTIVE hoặc đã có lời mời PENDING.
-- 4. Quyền duyệt bài nộp dự phòng cho Manager (review_submission & is_submission_approver):
--    - Mở rộng quyền để Manager có thể đánh giá bài nộp nếu Approver vắng mặt/khuyết.
-- ============================================================================

-- 1. Cải tiến RPC set_campaign_member_access đảm bảo tính nguyên tử
CREATE OR REPLACE FUNCTION public.set_campaign_member_access(
    p_member_id UUID,
    p_role campaign_role,
    p_revoke BOOLEAN DEFAULT FALSE
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    target_campaign_id UUID;
    target_user_id UUID;
    current_role campaign_role;
    current_status campaign_member_status;
    has_pending_submissions BOOLEAN;
BEGIN
    SELECT campaign_id, user_id, role, status
    INTO target_campaign_id, target_user_id, current_role, current_status
    FROM campaign_members
    WHERE id = p_member_id;

    IF target_campaign_id IS NULL THEN
        RAISE EXCEPTION 'Không tìm thấy thành viên chiến dịch.';
    END IF;

    IF NOT public.is_campaign_manager(target_campaign_id) THEN
        RAISE EXCEPTION 'Chỉ có Quản lý chiến dịch mới có quyền thay đổi trạng thái thành viên.';
    END IF;

    IF p_revoke THEN
        -- Kiểm tra bảo vệ Manager cuối cùng
        IF current_role = 'MANAGER' AND current_status = 'ACTIVE' THEN
            IF (
                SELECT COUNT(*)
                FROM campaign_members
                WHERE campaign_id = target_campaign_id
                  AND role = 'MANAGER'
                  AND status = 'ACTIVE'
            ) <= 1 THEN
                RAISE EXCEPTION 'Không thể thu hồi quyền của Quản lý duy nhất còn lại trong chiến dịch.';
            END IF;
        END IF;

        -- Kiểm tra nếu Approver đang có bài nộp chờ duyệt (tránh mồ côi bài nộp)
        SELECT EXISTS (
            SELECT 1
            FROM submissions s
            WHERE s.assigned_approver_member_id = p_member_id
              AND s.status = 'SUBMITTED'
        ) INTO has_pending_submissions;

        IF has_pending_submissions THEN
            RAISE EXCEPTION 'Không thể thu hồi quyền Approver khi đang có bài nộp chờ phê duyệt. Vui lòng duyệt hoặc phân công lại trước.';
        END IF;

        -- Dọn dẹp phân công booth nguyên tử trong cùng transaction
        DELETE FROM booth_supervisor_assignments WHERE supervisor_member_id = p_member_id;
        DELETE FROM booth_approver_assignments WHERE approver_member_id = p_member_id;

        -- Cập nhật trạng thái REVOKED thỏa mãn constraint revoked_state_is_consistent
        UPDATE campaign_members
        SET role = p_role,
            status = 'REVOKED'::campaign_member_status,
            revoked_by = auth.uid(),
            revoked_at = NOW(),
            updated_at = NOW()
        WHERE id = p_member_id;
    ELSE
        -- Khôi phục thành viên sang ACTIVE
        UPDATE campaign_members
        SET role = p_role,
            status = 'ACTIVE'::campaign_member_status,
            revoked_by = NULL,
            revoked_at = NULL,
            assigned_by = auth.uid(),
            updated_at = NOW()
        WHERE id = p_member_id;
    END IF;
END;
$$;

-- 2. Tạo RPC cancel_campaign_invite an toàn và chống race condition
CREATE OR REPLACE FUNCTION public.cancel_campaign_invite(
    p_invite_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    target_campaign_id UUID;
    current_invite_status campaign_invite_status;
BEGIN
    SELECT campaign_id, status
    INTO target_campaign_id, current_invite_status
    FROM campaign_invites
    WHERE id = p_invite_id
    FOR UPDATE;

    IF target_campaign_id IS NULL THEN
        RAISE EXCEPTION 'Không tìm thấy lời mời tham gia chiến dịch.';
    END IF;

    IF NOT public.is_campaign_manager(target_campaign_id) THEN
        RAISE EXCEPTION 'Chỉ có Quản lý chiến dịch mới có quyền thu hồi lời mời.';
    END IF;

    IF current_invite_status = 'ACCEPTED' THEN
        RAISE EXCEPTION 'Lời mời đã được người dùng kích hoạt và trở thành thành viên chính thức. Vui lòng làm mới danh sách.';
    END IF;

    IF current_invite_status != 'PENDING' THEN
        RAISE EXCEPTION 'Lời mời không ở trạng thái chờ kích hoạt.';
    END IF;

    -- Xóa bản ghi invite (kích hoạt ON DELETE CASCADE xóa assignments tương ứng)
    DELETE FROM campaign_invites WHERE id = p_invite_id;
END;
$$;

-- 3. Cải tiến RPC invite_campaign_member loại bỏ UPSERT âm thầm ghi đè vai trò
CREATE OR REPLACE FUNCTION public.invite_campaign_member(
    p_campaign_id UUID,
    p_email TEXT,
    p_role campaign_role
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    current_user_id UUID := auth.uid();
    normalized_email TEXT := LOWER(TRIM(p_email));
    target_user_id UUID;
    existing_member_role campaign_role;
    existing_member_status campaign_member_status;
    existing_invite_role campaign_role;
BEGIN
    IF NOT public.is_campaign_manager(p_campaign_id) THEN
        RAISE EXCEPTION 'Chỉ có Quản lý chiến dịch mới có quyền mời thành viên.';
    END IF;

    -- Kiểm tra nếu email đã có tài khoản profiles
    SELECT id INTO target_user_id FROM profiles WHERE LOWER(email) = normalized_email LIMIT 1;

    IF target_user_id IS NOT NULL THEN
        -- Kiểm tra trong campaign_members
        SELECT role, status INTO existing_member_role, existing_member_status
        FROM campaign_members
        WHERE campaign_id = p_campaign_id AND user_id = target_user_id;

        IF existing_member_status = 'ACTIVE' THEN
            RAISE EXCEPTION 'Email này đã là thành viên chính thức của chiến dịch với vai trò %. Hãy thay đổi vai trò trong danh sách.', existing_member_role;
        END IF;

        IF existing_member_status = 'REVOKED' THEN
            -- Khôi phục thành viên đã từng bị revoke với vai trò mới
            UPDATE campaign_members
            SET role = p_role,
                status = 'ACTIVE',
                assigned_by = current_user_id,
                revoked_by = NULL,
                revoked_at = NULL,
                updated_at = NOW()
            WHERE campaign_id = p_campaign_id AND user_id = target_user_id;
            RETURN 'MEMBER_ADDED';
        END IF;

        -- Chưa từng tham gia: Thêm mới
        INSERT INTO campaign_members (campaign_id, user_id, role, status, assigned_by)
        VALUES (p_campaign_id, target_user_id, p_role, 'ACTIVE', current_user_id);
        RETURN 'MEMBER_ADDED';
    END IF;

    -- Nếu user chưa có tài khoản EventGo: Kiểm tra trong campaign_invites
    SELECT role INTO existing_invite_role
    FROM campaign_invites
    WHERE campaign_id = p_campaign_id
      AND LOWER(email) = normalized_email
      AND status = 'PENDING';

    IF existing_invite_role IS NOT NULL THEN
        RAISE EXCEPTION 'Email này đã có lời mời đang chờ kích hoạt với vai trò %. Bạn có thể gửi lại email hoặc thu hồi lời mời.', existing_invite_role;
    END IF;

    -- Thêm mới lời mời PENDING
    INSERT INTO campaign_invites (campaign_id, email, role, status, invited_by)
    VALUES (p_campaign_id, normalized_email, p_role, 'PENDING', current_user_id);

    RETURN 'INVITE_CREATED';
END;
$$;

-- 4. Mở rộng quyền đánh giá bài nộp cho Campaign Manager
CREATE OR REPLACE FUNCTION public.is_submission_approver(target_submission_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM submissions s
        JOIN booths b ON b.id = s.booth_id
        JOIN locations l ON l.id = b.location_id
        LEFT JOIN campaign_members cm ON cm.id = s.assigned_approver_member_id
        WHERE s.id = target_submission_id
          AND (
              -- Là approver được phân công và đang ACTIVE
              (cm.user_id = auth.uid() AND cm.role = 'APPROVER' AND cm.status = 'ACTIVE')
              -- HOẶC là Manager của chiến dịch
              OR public.is_campaign_manager(l.campaign_id)
          )
    );
$$;

-- Phân quyền thực thi các RPC mới cho authenticated users
REVOKE ALL ON FUNCTION public.set_campaign_member_access(UUID, campaign_role, BOOLEAN) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_campaign_member_access(UUID, campaign_role, BOOLEAN) TO authenticated;

REVOKE ALL ON FUNCTION public.cancel_campaign_invite(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cancel_campaign_invite(UUID) TO authenticated;

REVOKE ALL ON FUNCTION public.invite_campaign_member(UUID, TEXT, campaign_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.invite_campaign_member(UUID, TEXT, campaign_role) TO authenticated;
