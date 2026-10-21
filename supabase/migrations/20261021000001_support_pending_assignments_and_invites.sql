-- ============================================================================
-- Migration: 20261021000001_support_pending_assignments_and_invites.sql
-- Description: Cho phép phân công nhân sự đang ở trạng thái PENDING (chờ đăng nhập)
-- vào các gian hàng (Booth), tự động chuyển đổi sang ACTIVE khi user đăng nhập,
-- và hỗ trợ Preflight Validation không chặn kích hoạt chiến dịch nếu đã phân công.
-- ============================================================================

-- 1. Cho phép supervisor_member_id và approver_member_id NULL trong bảng assignments
ALTER TABLE public.booth_supervisor_assignments ALTER COLUMN supervisor_member_id DROP NOT NULL;
ALTER TABLE public.booth_approver_assignments ALTER COLUMN approver_member_id DROP NOT NULL;

-- 2. Bổ sung cột supervisor_invite_id và approver_invite_id liên kết với campaign_invites
ALTER TABLE public.booth_supervisor_assignments 
  ADD COLUMN IF NOT EXISTS supervisor_invite_id UUID REFERENCES public.campaign_invites(id) ON DELETE CASCADE;

ALTER TABLE public.booth_approver_assignments 
  ADD COLUMN IF NOT EXISTS approver_invite_id UUID REFERENCES public.campaign_invites(id) ON DELETE CASCADE;

-- 3. Ràng buộc: Một bản ghi phải có ít nhất member_id HOẶC invite_id
DO $$ BEGIN
  ALTER TABLE public.booth_supervisor_assignments 
    ADD CONSTRAINT chk_booth_supervisor_assigned 
    CHECK (supervisor_member_id IS NOT NULL OR supervisor_invite_id IS NOT NULL);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.booth_approver_assignments 
    ADD CONSTRAINT chk_booth_approver_assigned 
    CHECK (approver_member_id IS NOT NULL OR approver_invite_id IS NOT NULL);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 4. Cập nhật Trigger validate_booth_supervisor_assignment()
CREATE OR REPLACE FUNCTION public.validate_booth_supervisor_assignment()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    IF NEW.supervisor_member_id IS NOT NULL THEN
        IF NOT EXISTS (
            SELECT 1
            FROM booths b
            JOIN locations l ON l.id = b.location_id
            JOIN campaign_members cm ON cm.id = NEW.supervisor_member_id
            WHERE b.id = NEW.booth_id
              AND cm.campaign_id = l.campaign_id
              AND cm.role = 'SUPERVISOR'
              AND cm.status = 'ACTIVE'
        ) THEN
            RAISE EXCEPTION 'Supervisor must be an active supervisor member of the campaign containing this booth';
        END IF;
    ELSIF NEW.supervisor_invite_id IS NOT NULL THEN
        IF NOT EXISTS (
            SELECT 1
            FROM booths b
            JOIN locations l ON l.id = b.location_id
            JOIN campaign_invites ci ON ci.id = NEW.supervisor_invite_id
            WHERE b.id = NEW.booth_id
              AND ci.campaign_id = l.campaign_id
              AND ci.role = 'SUPERVISOR'
              AND ci.status = 'PENDING'
        ) THEN
            RAISE EXCEPTION 'Supervisor invite must be a pending supervisor invite of the campaign containing this booth';
        END IF;
    ELSE
        RAISE EXCEPTION 'Either supervisor_member_id or supervisor_invite_id must be provided';
    END IF;
    RETURN NEW;
END;
$$;

-- 5. Cập nhật Trigger validate_booth_approver_assignment()
CREATE OR REPLACE FUNCTION public.validate_booth_approver_assignment()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    IF NEW.approver_member_id IS NOT NULL THEN
        IF NOT EXISTS (
            SELECT 1
            FROM booths b
            JOIN locations l ON l.id = b.location_id
            JOIN campaign_members cm ON cm.id = NEW.approver_member_id
            WHERE b.id = NEW.booth_id
              AND cm.campaign_id = l.campaign_id
              AND cm.role = 'APPROVER'
              AND cm.status = 'ACTIVE'
        ) THEN
            RAISE EXCEPTION 'Approver must be an active approver member of the campaign containing this booth';
        END IF;
    ELSIF NEW.approver_invite_id IS NOT NULL THEN
        IF NOT EXISTS (
            SELECT 1
            FROM booths b
            JOIN locations l ON l.id = b.location_id
            JOIN campaign_invites ci ON ci.id = NEW.approver_invite_id
            WHERE b.id = NEW.booth_id
              AND ci.campaign_id = l.campaign_id
              AND ci.role = 'APPROVER'
              AND ci.status = 'PENDING'
        ) THEN
            RAISE EXCEPTION 'Approver invite must be a pending approver invite of the campaign containing this booth';
        END IF;
    ELSE
        RAISE EXCEPTION 'Either approver_member_id or approver_invite_id must be provided';
    END IF;
    RETURN NEW;
END;
$$;

-- 6. Cập nhật RPC assign_booth_personnel hỗ trợ cả member_id và invite_id
CREATE OR REPLACE FUNCTION public.assign_booth_personnel(
    p_booth_id UUID,
    p_supervisor_member_id UUID DEFAULT NULL,
    p_approver_member_id UUID DEFAULT NULL,
    p_deadline TIMESTAMPTZ DEFAULT NULL,
    p_supervisor_invite_id UUID DEFAULT NULL,
    p_approver_invite_id UUID DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    target_campaign_id UUID;
BEGIN
    SELECT l.campaign_id INTO target_campaign_id
    FROM booths b
    JOIN locations l ON l.id = b.location_id
    WHERE b.id = p_booth_id;

    IF target_campaign_id IS NULL OR NOT public.is_campaign_manager(target_campaign_id) THEN
        RAISE EXCEPTION 'Chỉ có Manager của chiến dịch mới được phân công nhân sự';
    END IF;

    IF p_deadline IS NOT NULL THEN
        UPDATE booths SET deadline = p_deadline WHERE id = p_booth_id;
    END IF;

    -- Xử lý phân công Supervisor
    IF p_supervisor_member_id IS NULL AND p_supervisor_invite_id IS NULL THEN
        DELETE FROM booth_supervisor_assignments WHERE booth_id = p_booth_id;
    ELSE
        INSERT INTO booth_supervisor_assignments (booth_id, supervisor_member_id, supervisor_invite_id, assigned_by)
        VALUES (p_booth_id, p_supervisor_member_id, p_supervisor_invite_id, auth.uid())
        ON CONFLICT (booth_id) DO UPDATE SET
            supervisor_member_id = EXCLUDED.supervisor_member_id,
            supervisor_invite_id = EXCLUDED.supervisor_invite_id,
            assigned_by = auth.uid(),
            updated_at = NOW();
    END IF;

    -- Xử lý phân công Approver
    IF p_approver_member_id IS NULL AND p_approver_invite_id IS NULL THEN
        DELETE FROM booth_approver_assignments WHERE booth_id = p_booth_id;
    ELSE
        INSERT INTO booth_approver_assignments (booth_id, approver_member_id, approver_invite_id, assigned_by)
        VALUES (p_booth_id, p_approver_member_id, p_approver_invite_id, auth.uid())
        ON CONFLICT (booth_id) DO UPDATE SET
            approver_member_id = EXCLUDED.approver_member_id,
            approver_invite_id = EXCLUDED.approver_invite_id,
            assigned_by = auth.uid(),
            updated_at = NOW();
    END IF;
END;
$$;

-- 7. Cập nhật accept_pending_campaign_invites() để tự động chuyển booth từ invite_id sang member_id khi login
CREATE OR REPLACE FUNCTION public.accept_pending_campaign_invites()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    current_user_id UUID := auth.uid();
    current_email TEXT := LOWER(COALESCE(auth.jwt() ->> 'email', ''));
    accepted_count INTEGER := 0;
    invite_record RECORD;
    new_member_id UUID;
BEGIN
    IF current_user_id IS NULL OR current_email = '' THEN
        RAISE EXCEPTION 'Authentication with a verified email is required';
    END IF;

    FOR invite_record IN
        SELECT * FROM campaign_invites
        WHERE LOWER(email) = current_email
          AND status = 'PENDING'
          AND (expires_at IS NULL OR expires_at > NOW())
        FOR UPDATE
    LOOP
        INSERT INTO campaign_members (campaign_id, user_id, role, status, assigned_by)
        VALUES (invite_record.campaign_id, current_user_id, invite_record.role, 'ACTIVE', invite_record.invited_by)
        ON CONFLICT (campaign_id, user_id) DO UPDATE SET
            role = CASE
                WHEN campaign_members.status = 'REVOKED' THEN EXCLUDED.role
                ELSE campaign_members.role
            END,
            status = 'ACTIVE',
            revoked_by = NULL,
            revoked_at = NULL,
            assigned_by = EXCLUDED.assigned_by
        RETURNING id INTO new_member_id;

        -- Tự động chuyển tất cả các Booth được phân công cho invite này sang member chính thức
        IF new_member_id IS NOT NULL THEN
            UPDATE booth_supervisor_assignments
            SET supervisor_member_id = new_member_id, supervisor_invite_id = NULL
            WHERE supervisor_invite_id = invite_record.id;

            UPDATE booth_approver_assignments
            SET approver_member_id = new_member_id, approver_invite_id = NULL
            WHERE approver_invite_id = invite_record.id;
        END IF;

        UPDATE campaign_invites
        SET status = 'ACCEPTED', accepted_by = current_user_id, updated_at = NOW()
        WHERE id = invite_record.id;

        accepted_count := accepted_count + 1;
    END LOOP;

    RETURN accepted_count;
END;
$$;

-- 8. Cập nhật check_campaign_activation_readiness không chặn nếu đã gán supervisor_invite_id
CREATE OR REPLACE FUNCTION public.check_campaign_activation_readiness(p_campaign_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    errors JSONB := '[]'::JSONB;
    loc_count INT;
    r RECORD;
BEGIN
    -- 1. Địa điểm
    SELECT COUNT(*) INTO loc_count FROM locations WHERE campaign_id = p_campaign_id;
    IF loc_count = 0 THEN
        errors := errors || jsonb_build_array('Chiến dịch chưa có địa điểm nào.');
    END IF;

    -- 2. Địa điểm không có booth
    FOR r IN (
        SELECT l.name FROM locations l
        LEFT JOIN booths b ON b.location_id = l.id
        WHERE l.campaign_id = p_campaign_id
        GROUP BY l.id, l.name
        HAVING COUNT(b.id) = 0
    ) LOOP
        errors := errors || jsonb_build_array('Địa điểm "' || r.name || '" chưa có gian hàng (booth) nào.');
    END LOOP;

    -- 3. Booth không có checklist
    FOR r IN (
        SELECT b.name FROM booths b
        JOIN locations l ON l.id = b.location_id
        LEFT JOIN checklist_items ci ON ci.booth_id = b.id
        WHERE l.campaign_id = p_campaign_id
        GROUP BY b.id, b.name
        HAVING COUNT(ci.id) = 0
    ) LOOP
        errors := errors || jsonb_build_array('Gian hàng "' || r.name || '" chưa có tiêu chí checklist nào.');
    END LOOP;

    -- 4. Booth thiếu Supervisor (Chưa có cả Member lẫn Invite)
    FOR r IN (
        SELECT b.name, l.name AS loc_name FROM booths b
        JOIN locations l ON l.id = b.location_id
        LEFT JOIN booth_supervisor_assignments bsa ON bsa.booth_id = b.id
        WHERE l.campaign_id = p_campaign_id 
          AND bsa.supervisor_member_id IS NULL 
          AND bsa.supervisor_invite_id IS NULL
    ) LOOP
        errors := errors || jsonb_build_array('Gian hàng "' || r.name || '" tại "' || r.loc_name || '" chưa có Giám sát viên (Supervisor).');
    END LOOP;

    -- 5. Booth thiếu Approver (Chưa có cả Member lẫn Invite)
    FOR r IN (
        SELECT b.name, l.name AS loc_name FROM booths b
        JOIN locations l ON l.id = b.location_id
        LEFT JOIN booth_approver_assignments baa ON baa.booth_id = b.id
        WHERE l.campaign_id = p_campaign_id 
          AND baa.approver_member_id IS NULL 
          AND baa.approver_invite_id IS NULL
    ) LOOP
        errors := errors || jsonb_build_array('Gian hàng "' || r.name || '" tại "' || r.loc_name || '" chưa có Người phê duyệt (Approver).');
    END LOOP;

    RETURN jsonb_build_object(
        'can_activate', jsonb_array_length(errors) = 0,
        'errors', errors
    );
END;
$$;
