-- ============================================================================
-- EventGo Proof: RLS and Secured Business Functions
-- Authorization is campaign membership + explicit booth/submission assignment.
-- ============================================================================

-- Helper Functions
CREATE OR REPLACE FUNCTION public.is_campaign_manager(target_campaign_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM campaign_members
        WHERE campaign_id = target_campaign_id
          AND user_id = auth.uid()
          AND role = 'MANAGER'
          AND status = 'ACTIVE'
    );
$$;

CREATE OR REPLACE FUNCTION public.is_booth_supervisor(target_booth_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM booth_supervisor_assignments bsa
        JOIN campaign_members cm ON cm.id = bsa.supervisor_member_id
        WHERE bsa.booth_id = target_booth_id
          AND cm.user_id = auth.uid()
          AND cm.role = 'SUPERVISOR'
          AND cm.status = 'ACTIVE'
    );
$$;

CREATE OR REPLACE FUNCTION public.is_booth_approver(target_booth_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM booth_approver_assignments baa
        JOIN campaign_members cm ON cm.id = baa.approver_member_id
        WHERE baa.booth_id = target_booth_id
          AND cm.user_id = auth.uid()
          AND cm.role = 'APPROVER'
          AND cm.status = 'ACTIVE'
    ) OR EXISTS (
        SELECT 1
        FROM submissions s
        JOIN campaign_members cm ON cm.id = s.assigned_approver_member_id
        WHERE s.booth_id = target_booth_id
          AND cm.user_id = auth.uid()
          AND cm.role = 'APPROVER'
          AND cm.status = 'ACTIVE'
    );
$$;

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
        JOIN campaign_members cm ON cm.id = s.assigned_approver_member_id
        WHERE s.id = target_submission_id
          AND cm.user_id = auth.uid()
          AND cm.role = 'APPROVER'
          AND cm.status = 'ACTIVE'
    );
$$;

CREATE OR REPLACE FUNCTION public.can_access_campaign(target_campaign_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT public.is_campaign_manager(target_campaign_id)
    OR EXISTS (
        SELECT 1
        FROM locations l
        JOIN booths b ON b.location_id = l.id
        WHERE l.campaign_id = target_campaign_id
          AND (
              public.is_booth_supervisor(b.id)
              OR public.is_booth_approver(b.id)
          )
    );
$$;

CREATE OR REPLACE FUNCTION public.can_access_location(target_location_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM locations l
        WHERE l.id = target_location_id
          AND (
              public.is_campaign_manager(l.campaign_id)
              OR EXISTS (
                  SELECT 1 FROM booths b
                  WHERE b.location_id = l.id
                    AND (
                        public.is_booth_supervisor(b.id)
                        OR public.is_booth_approver(b.id)
                    )
              )
          )
    );
$$;

CREATE OR REPLACE FUNCTION public.can_access_booth(target_booth_id UUID)
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
              OR public.is_booth_approver(b.id)
          )
    );
$$;

CREATE OR REPLACE FUNCTION public.can_access_submission(target_submission_id UUID)
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
        WHERE s.id = target_submission_id
          AND (
              public.is_campaign_manager(l.campaign_id)
              OR public.is_booth_supervisor(b.id)
              OR public.is_submission_approver(s.id)
          )
    );
$$;

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_member_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE booths ENABLE ROW LEVEL SECURITY;
ALTER TABLE booth_supervisor_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE booth_approver_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_history ENABLE ROW LEVEL SECURITY;

-- 1. Profiles Policies
CREATE POLICY "Users can view profiles in their campaigns"
ON profiles FOR SELECT
USING (
    id = auth.uid()
    OR EXISTS (
        SELECT 1
        FROM campaign_members my_membership
        JOIN campaign_members target_membership
          ON target_membership.campaign_id = my_membership.campaign_id
        WHERE my_membership.user_id = auth.uid()
          AND my_membership.status = 'ACTIVE'
          AND target_membership.user_id = profiles.id
    )
);

CREATE POLICY "Users can create their own profile"
ON profiles FOR INSERT
WITH CHECK (id = auth.uid());

CREATE POLICY "Users can update their own profile"
ON profiles FOR UPDATE
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- 2. Campaigns Policies
CREATE POLICY "Assigned users can view campaigns"
ON campaigns FOR SELECT
USING (public.can_access_campaign(id));

CREATE POLICY "Managers can update campaigns"
ON campaigns FOR UPDATE
USING (public.is_campaign_manager(id))
WITH CHECK (public.is_campaign_manager(id));

CREATE POLICY "Managers can delete campaigns"
ON campaigns FOR DELETE
USING (public.is_campaign_manager(id));

-- 3. Campaign Members Policies
CREATE POLICY "Users can view members of their campaigns"
ON campaign_members FOR SELECT
USING (
    user_id = auth.uid()
    OR public.is_campaign_manager(campaign_id)
    OR EXISTS (
        SELECT 1 FROM campaign_members cm
        WHERE cm.campaign_id = campaign_members.campaign_id
          AND cm.user_id = auth.uid()
          AND cm.status = 'ACTIVE'
    )
);

CREATE POLICY "Managers can add campaign members"
ON campaign_members FOR INSERT
WITH CHECK (public.is_campaign_manager(campaign_id));

CREATE POLICY "Managers can update campaign members"
ON campaign_members FOR UPDATE
USING (public.is_campaign_manager(campaign_id))
WITH CHECK (public.is_campaign_manager(campaign_id));

CREATE POLICY "Managers can view member history"
ON campaign_member_history FOR SELECT
USING (public.is_campaign_manager(campaign_id));

CREATE POLICY "Managers and invitees can view invitations"
ON campaign_invites FOR SELECT
USING (
    public.is_campaign_manager(campaign_id)
    OR LOWER(email) = LOWER(COALESCE(auth.jwt() ->> 'email', ''))
);

CREATE POLICY "Managers can create invitations"
ON campaign_invites FOR INSERT
WITH CHECK (public.is_campaign_manager(campaign_id) AND invited_by = auth.uid());

CREATE POLICY "Managers can update invitations"
ON campaign_invites FOR UPDATE
USING (public.is_campaign_manager(campaign_id))
WITH CHECK (public.is_campaign_manager(campaign_id));

-- 4. Locations Policies
CREATE POLICY "Assigned users can view locations"
ON locations FOR SELECT
USING (
    public.is_campaign_manager(campaign_id)
    OR EXISTS (
        SELECT 1 FROM booths b
        WHERE b.location_id = locations.id
          AND (public.is_booth_supervisor(b.id) OR public.is_booth_approver(b.id))
    )
);

CREATE POLICY "Managers can create locations"
ON locations FOR INSERT
WITH CHECK (public.is_campaign_manager(campaign_id));

CREATE POLICY "Managers can update locations"
ON locations FOR UPDATE
USING (public.is_campaign_manager(campaign_id))
WITH CHECK (public.is_campaign_manager(campaign_id));

CREATE POLICY "Managers can delete locations"
ON locations FOR DELETE
USING (public.is_campaign_manager(campaign_id));

-- 5. Booths Policies
CREATE POLICY "Assigned users can view booths"
ON booths FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM locations l
        WHERE l.id = booths.location_id
          AND public.is_campaign_manager(l.campaign_id)
    )
    OR public.is_booth_supervisor(id)
    OR public.is_booth_approver(id)
);

CREATE POLICY "Managers can create booths"
ON booths FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM locations l
        WHERE l.id = booths.location_id
          AND public.is_campaign_manager(l.campaign_id)
    )
);

CREATE POLICY "Managers can update booths"
ON booths FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM locations l
        WHERE l.id = booths.location_id
          AND public.is_campaign_manager(l.campaign_id)
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM locations l
        WHERE l.id = booths.location_id
          AND public.is_campaign_manager(l.campaign_id)
    )
);

CREATE POLICY "Managers can delete booths"
ON booths FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM locations l
        WHERE l.id = booths.location_id
          AND public.is_campaign_manager(l.campaign_id)
    )
);

-- 6. Booth Assignments Policies
CREATE POLICY "Managers and assigned supervisors can view supervisor assignments"
ON booth_supervisor_assignments FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM booths b
        JOIN locations l ON l.id = b.location_id
        WHERE b.id = booth_id AND public.is_campaign_manager(l.campaign_id)
    )
    OR public.is_booth_supervisor(booth_id)
);

CREATE POLICY "Managers can manage supervisor assignments"
ON booth_supervisor_assignments FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM booths b
        JOIN locations l ON l.id = b.location_id
        WHERE b.id = booth_id AND public.is_campaign_manager(l.campaign_id)
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM booths b
        JOIN locations l ON l.id = b.location_id
        WHERE b.id = booth_id AND public.is_campaign_manager(l.campaign_id)
    )
);

CREATE POLICY "Managers and assigned approvers can view approver assignments"
ON booth_approver_assignments FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM booths b
        JOIN locations l ON l.id = b.location_id
        WHERE b.id = booth_id AND public.is_campaign_manager(l.campaign_id)
    )
    OR public.is_booth_approver(booth_id)
);

CREATE POLICY "Managers can manage approver assignments"
ON booth_approver_assignments FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM booths b
        JOIN locations l ON l.id = b.location_id
        WHERE b.id = booth_id AND public.is_campaign_manager(l.campaign_id)
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM booths b
        JOIN locations l ON l.id = b.location_id
        WHERE b.id = booth_id AND public.is_campaign_manager(l.campaign_id)
    )
);

-- 7. Checklist Items Policies
CREATE POLICY "Assigned users can view checklist items"
ON checklist_items FOR SELECT
USING (public.can_access_booth(booth_id));

CREATE POLICY "Managers can manage checklist items"
ON checklist_items FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM booths b
        JOIN locations l ON l.id = b.location_id
        WHERE b.id = checklist_items.booth_id
          AND public.is_campaign_manager(l.campaign_id)
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM booths b
        JOIN locations l ON l.id = b.location_id
        WHERE b.id = checklist_items.booth_id
          AND public.is_campaign_manager(l.campaign_id)
    )
);

-- 8. Submissions, Evidence, Approval History Policies
CREATE POLICY "Assigned users can view submissions"
ON submissions FOR SELECT
USING (public.can_access_submission(id));

CREATE POLICY "Assigned users can view evidence"
ON evidence FOR SELECT
USING (public.can_access_submission(submission_id));

CREATE POLICY "Assigned users can view approval history"
ON approval_history FOR SELECT
USING (public.can_access_submission(submission_id));

-- ============================================================================
-- Secured Business RPC Functions
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO profiles (id, email, full_name, avatar_url)
    VALUES (
        NEW.id,
        LOWER(COALESCE(NEW.email, '')),
        COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name', NEW.email, 'Google User'),
        COALESCE(NEW.raw_user_meta_data ->> 'avatar_url', NEW.raw_user_meta_data ->> 'picture')
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        avatar_url = EXCLUDED.avatar_url,
        updated_at = NOW();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT OR UPDATE OF email, raw_user_meta_data ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

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
            assigned_by = EXCLUDED.assigned_by;

        UPDATE campaign_invites
        SET status = 'ACCEPTED', accepted_by = current_user_id, updated_at = NOW()
        WHERE id = invite_record.id;

        accepted_count := accepted_count + 1;
    END LOOP;

    RETURN accepted_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_campaign_with_manager(
    p_title TEXT,
    p_brand_name TEXT,
    p_description TEXT,
    p_company_name TEXT,
    p_company_tax_code TEXT,
    p_company_address TEXT,
    p_company_contact_name TEXT,
    p_company_contact_email TEXT,
    p_company_contact_phone TEXT,
    p_start_date DATE,
    p_end_date DATE,
    p_status campaign_status
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    current_user_id UUID := auth.uid();
    new_campaign_id UUID;
BEGIN
    IF current_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    INSERT INTO campaigns (
        title, brand_name, description,
        company_name, company_tax_code, company_address,
        company_contact_name, company_contact_email, company_contact_phone,
        start_date, end_date, status, created_by
    ) VALUES (
        p_title, p_brand_name, NULLIF(p_description, ''),
        p_company_name, NULLIF(p_company_tax_code, ''), NULLIF(p_company_address, ''),
        NULLIF(p_company_contact_name, ''), NULLIF(p_company_contact_email, ''), NULLIF(p_company_contact_phone, ''),
        p_start_date, p_end_date, p_status, current_user_id
    )
    RETURNING id INTO new_campaign_id;

    INSERT INTO campaign_members (campaign_id, user_id, role, status, assigned_by)
    VALUES (new_campaign_id, current_user_id, 'MANAGER', 'ACTIVE', current_user_id);

    RETURN new_campaign_id;
END;
$$;

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
BEGIN
    IF NOT public.is_campaign_manager(p_campaign_id) THEN
        RAISE EXCEPTION 'Only campaign managers can add members';
    END IF;

    SELECT id INTO target_user_id FROM profiles WHERE LOWER(email) = normalized_email LIMIT 1;

    IF target_user_id IS NOT NULL THEN
        INSERT INTO campaign_members (campaign_id, user_id, role, status, assigned_by)
        VALUES (p_campaign_id, target_user_id, p_role, 'ACTIVE', current_user_id)
        ON CONFLICT (campaign_id, user_id) DO UPDATE SET
            role = EXCLUDED.role,
            status = 'ACTIVE',
            assigned_by = current_user_id,
            revoked_by = NULL,
            revoked_at = NULL;
        RETURN 'MEMBER_ADDED';
    END IF;

    INSERT INTO campaign_invites (campaign_id, email, role, status, invited_by)
    VALUES (p_campaign_id, normalized_email, p_role, 'PENDING', current_user_id)
    ON CONFLICT (campaign_id, (LOWER(email))) WHERE status = 'PENDING'
    DO UPDATE SET role = EXCLUDED.role, invited_by = current_user_id, updated_at = NOW();

    RETURN 'INVITE_CREATED';
END;
$$;

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
BEGIN
    SELECT campaign_id INTO target_campaign_id FROM campaign_members WHERE id = p_member_id;
    IF target_campaign_id IS NULL OR NOT public.is_campaign_manager(target_campaign_id) THEN
        RAISE EXCEPTION 'Only campaign managers can change member access';
    END IF;

    UPDATE campaign_members
    SET role = p_role,
        status = CASE WHEN p_revoke THEN 'REVOKED'::campaign_member_status ELSE 'ACTIVE'::campaign_member_status END,
        revoked_by = CASE WHEN p_revoke THEN auth.uid() ELSE NULL END,
        revoked_at = CASE WHEN p_revoke THEN NOW() ELSE NULL END,
        assigned_by = CASE WHEN p_revoke THEN assigned_by ELSE auth.uid() END
    WHERE id = p_member_id;
END;
$$;

-- Phân công nhân sự theo Booth
CREATE OR REPLACE FUNCTION public.assign_booth_personnel(
    p_booth_id UUID,
    p_supervisor_member_id UUID,
    p_approver_member_id UUID,
    p_deadline TIMESTAMPTZ DEFAULT NULL
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

    IF p_supervisor_member_id IS NULL THEN
        DELETE FROM booth_supervisor_assignments WHERE booth_id = p_booth_id;
    ELSE
        INSERT INTO booth_supervisor_assignments (booth_id, supervisor_member_id, assigned_by)
        VALUES (p_booth_id, p_supervisor_member_id, auth.uid())
        ON CONFLICT (booth_id) DO UPDATE SET
            supervisor_member_id = EXCLUDED.supervisor_member_id,
            assigned_by = auth.uid(),
            updated_at = NOW();
    END IF;

    IF p_approver_member_id IS NULL THEN
        DELETE FROM booth_approver_assignments WHERE booth_id = p_booth_id;
    ELSE
        INSERT INTO booth_approver_assignments (booth_id, approver_member_id, assigned_by)
        VALUES (p_booth_id, p_approver_member_id, auth.uid())
        ON CONFLICT (booth_id) DO UPDATE SET
            approver_member_id = EXCLUDED.approver_member_id,
            assigned_by = auth.uid(),
            updated_at = NOW();
    END IF;
END;
$$;

-- Nộp Evidence nghiệm thu theo Booth
CREATE OR REPLACE FUNCTION public.submit_evidence(
    p_booth_id UUID,
    p_checklist_item_id UUID,
    p_notes TEXT,
    p_photos JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    current_user_id UUID := auth.uid();
    approver_member_id UUID;
    submission_id UUID;
    photo JSONB;
BEGIN
    IF current_user_id IS NULL OR NOT public.is_booth_supervisor(p_booth_id) THEN
        RAISE EXCEPTION 'Chỉ Supervisor được phân công mới có quyền nộp bằng chứng cho gian hàng này';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM checklist_items ci
        WHERE ci.id = p_checklist_item_id AND ci.booth_id = p_booth_id
    ) THEN
        RAISE EXCEPTION 'Tiêu chí checklist không thuộc gian hàng này';
    END IF;

    SELECT baa.approver_member_id INTO approver_member_id
    FROM booth_approver_assignments baa
    WHERE baa.booth_id = p_booth_id;

    IF approver_member_id IS NULL THEN
        RAISE EXCEPTION 'Gian hàng chưa được phân công người phê duyệt';
    END IF;

    IF p_photos IS NULL OR JSONB_ARRAY_LENGTH(p_photos) = 0 THEN
        RAISE EXCEPTION 'Cần ít nhất 1 ảnh bằng chứng để nộp nghiệm thu';
    END IF;

    SELECT id INTO submission_id
    FROM submissions
    WHERE booth_id = p_booth_id AND checklist_item_id = p_checklist_item_id
    FOR UPDATE;

    IF submission_id IS NULL THEN
        INSERT INTO submissions (
            booth_id, checklist_item_id, assigned_approver_member_id,
            status, notes, submitted_by, submitted_at
        ) VALUES (
            p_booth_id, p_checklist_item_id, approver_member_id,
            'SUBMITTED', NULLIF(p_notes, ''), current_user_id, NOW()
        ) RETURNING id INTO submission_id;
    ELSE
        IF EXISTS (SELECT 1 FROM submissions WHERE id = submission_id AND status = 'APPROVED') THEN
            RAISE EXCEPTION 'Bài nộp đã được duyệt không thể chỉnh sửa';
        END IF;

        UPDATE submissions SET
            assigned_approver_member_id = approver_member_id,
            status = 'SUBMITTED',
            notes = NULLIF(p_notes, ''),
            submitted_by = current_user_id,
            submitted_at = NOW()
        WHERE id = submission_id;
    END IF;

    FOR photo IN SELECT * FROM JSONB_ARRAY_ELEMENTS(p_photos)
    LOOP
        INSERT INTO evidence (
            submission_id, image_url, thumbnail_url, cloudinary_public_id, uploaded_by
        ) VALUES (
            submission_id,
            photo ->> 'imageUrl',
            NULLIF(photo ->> 'thumbnailUrl', ''),
            photo ->> 'cloudinaryPublicId',
            current_user_id
        );
    END LOOP;

    RETURN submission_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.assign_submission_approver(
    p_submission_id UUID,
    p_approver_member_id UUID
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
    FROM submissions s
    JOIN booths b ON b.id = s.booth_id
    JOIN locations l ON l.id = b.location_id
    WHERE s.id = p_submission_id;

    IF target_campaign_id IS NULL OR NOT public.is_campaign_manager(target_campaign_id) THEN
        RAISE EXCEPTION 'Chỉ có Manager của chiến dịch mới được gán lại người duyệt';
    END IF;

    IF EXISTS (SELECT 1 FROM submissions WHERE id = p_submission_id AND status = 'APPROVED') THEN
        RAISE EXCEPTION 'Không thể đổi người duyệt bài nộp đã được phê duyệt';
    END IF;

    UPDATE submissions
    SET assigned_approver_member_id = p_approver_member_id
    WHERE id = p_submission_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.review_submission(
    p_submission_id UUID,
    p_action approval_action,
    p_notes TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    current_user_id UUID := auth.uid();
BEGIN
    IF current_user_id IS NULL OR NOT public.is_submission_approver(p_submission_id) THEN
        RAISE EXCEPTION 'Chỉ người phê duyệt được phân công mới có quyền đánh giá bài nộp này';
    END IF;

    IF p_action = 'REQUEST_REVISION' AND COALESCE(LENGTH(TRIM(p_notes)), 0) = 0 THEN
        RAISE EXCEPTION 'Yêu cầu sửa đổi bắt buộc phải có ghi chú lý do';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM submissions WHERE id = p_submission_id AND status = 'SUBMITTED' FOR UPDATE
    ) THEN
        RAISE EXCEPTION 'Chỉ có thể phê duyệt hoặc yêu cầu sửa đổi bài nộp đang chờ duyệt';
    END IF;

    UPDATE submissions
    SET status = CASE
        WHEN p_action = 'APPROVE' THEN 'APPROVED'::submission_status
        ELSE 'NEEDS_REVISION'::submission_status
    END
    WHERE id = p_submission_id;

    INSERT INTO approval_history (submission_id, reviewer_id, action, notes)
    VALUES (p_submission_id, current_user_id, p_action, NULLIF(p_notes, ''));
END;
$$;

-- Hàm tiền kiểm tra trạng thái kích hoạt chiến dịch (cho Client / Server Component gọi)
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

    -- 4. Booth thiếu Supervisor
    FOR r IN (
        SELECT b.name, l.name AS loc_name FROM booths b
        JOIN locations l ON l.id = b.location_id
        LEFT JOIN booth_supervisor_assignments bsa ON bsa.booth_id = b.id
        WHERE l.campaign_id = p_campaign_id AND bsa.supervisor_member_id IS NULL
    ) LOOP
        errors := errors || jsonb_build_array('Gian hàng "' || r.name || '" tại "' || r.loc_name || '" chưa có Giám sát viên (Supervisor).');
    END LOOP;

    -- 5. Booth thiếu Approver
    FOR r IN (
        SELECT b.name, l.name AS loc_name FROM booths b
        JOIN locations l ON l.id = b.location_id
        LEFT JOIN booth_approver_assignments baa ON baa.booth_id = b.id
        WHERE l.campaign_id = p_campaign_id AND baa.approver_member_id IS NULL
    ) LOOP
        errors := errors || jsonb_build_array('Gian hàng "' || r.name || '" tại "' || r.loc_name || '" chưa có Người phê duyệt (Approver).');
    END LOOP;

    RETURN jsonb_build_object(
        'can_activate', jsonb_array_length(errors) = 0,
        'errors', errors
    );
END;
$$;

-- Revoke & Grant permissions
REVOKE ALL ON FUNCTION public.create_campaign_with_manager(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, DATE, DATE, campaign_status) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.accept_pending_campaign_invites() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.invite_campaign_member(UUID, TEXT, campaign_role) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.set_campaign_member_access(UUID, campaign_role, BOOLEAN) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.assign_booth_personnel(UUID, UUID, UUID, TIMESTAMPTZ) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.submit_evidence(UUID, UUID, TEXT, JSONB) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.assign_submission_approver(UUID, UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.review_submission(UUID, approval_action, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.check_campaign_activation_readiness(UUID) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.create_campaign_with_manager(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, DATE, DATE, campaign_status) TO authenticated;
GRANT EXECUTE ON FUNCTION public.accept_pending_campaign_invites() TO authenticated;
GRANT EXECUTE ON FUNCTION public.invite_campaign_member(UUID, TEXT, campaign_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_campaign_member_access(UUID, campaign_role, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION public.assign_booth_personnel(UUID, UUID, UUID, TIMESTAMPTZ) TO authenticated;
GRANT EXECUTE ON FUNCTION public.submit_evidence(UUID, UUID, TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.assign_submission_approver(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.review_submission(UUID, approval_action, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_campaign_activation_readiness(UUID) TO authenticated;

GRANT EXECUTE ON FUNCTION public.is_campaign_manager(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_booth_supervisor(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_booth_approver(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_submission_approver(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.can_access_campaign(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.can_access_location(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.can_access_booth(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.can_access_submission(UUID) TO authenticated, service_role;
