-- ============================================================================
-- EventGo Proof: Initial Schema
-- Google identities + campaign-scoped roles + Campaign -> Location -> Booth -> Checklist hierarchy
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$ BEGIN
    CREATE TYPE campaign_role AS ENUM ('MANAGER', 'SUPERVISOR', 'APPROVER');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE campaign_member_status AS ENUM ('ACTIVE', 'REVOKED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE campaign_invite_status AS ENUM ('PENDING', 'ACCEPTED', 'REVOKED', 'EXPIRED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE campaign_status AS ENUM ('DRAFT', 'ACTIVE', 'COMPLETED', 'ARCHIVED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE submission_status AS ENUM ('DRAFT', 'SUBMITTED', 'NEEDS_REVISION', 'APPROVED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE approval_action AS ENUM ('APPROVE', 'REQUEST_REVISION');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE checklist_category AS ENUM ('STRUCTURE', 'BRANDING', 'POSM', 'STAFFING', 'CONDITION', 'OTHER');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 1. Profiles
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    phone VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_email_lower ON profiles (LOWER(email));

-- 2. Campaigns
CREATE TABLE IF NOT EXISTS campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    brand_name VARCHAR(255) NOT NULL,
    description TEXT,
    company_name VARCHAR(255) NOT NULL,
    company_tax_code VARCHAR(100),
    company_address TEXT,
    company_contact_name VARCHAR(255),
    company_contact_email VARCHAR(255),
    company_contact_phone VARCHAR(50),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status campaign_status NOT NULL DEFAULT 'DRAFT',
    created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT valid_campaign_dates CHECK (end_date >= start_date)
);

-- 3. Campaign Members & History
CREATE TABLE IF NOT EXISTS campaign_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    role campaign_role NOT NULL,
    status campaign_member_status NOT NULL DEFAULT 'ACTIVE',
    assigned_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    revoked_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    revoked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_campaign_member UNIQUE (campaign_id, user_id),
    CONSTRAINT revoked_state_is_consistent CHECK (
        (status = 'ACTIVE' AND revoked_at IS NULL)
        OR (status = 'REVOKED' AND revoked_at IS NOT NULL)
    )
);

CREATE TABLE IF NOT EXISTS campaign_member_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    member_id UUID REFERENCES campaign_members(id) ON DELETE SET NULL,
    member_user_id UUID NOT NULL,
    previous_role campaign_role,
    new_role campaign_role,
    previous_status campaign_member_status,
    new_status campaign_member_status NOT NULL,
    changed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS campaign_invites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    role campaign_role NOT NULL,
    status campaign_invite_status NOT NULL DEFAULT 'PENDING',
    invited_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
    accepted_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_pending_campaign_invites
    ON campaign_invites (campaign_id, LOWER(email))
    WHERE status = 'PENDING';

-- 4. Locations (Cấp địa điểm - e.g. TTTM Vincom, Siêu thị Big C)
CREATE TABLE IF NOT EXISTS locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    deadline TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Booths (Cấp gian hàng tại từng địa điểm)
CREATE TABLE IF NOT EXISTS booths (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(100),
    description TEXT,
    deadline TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Booth Assignments (Phân công Supervisor và Approver theo từng Booth)
CREATE TABLE IF NOT EXISTS booth_supervisor_assignments (
    booth_id UUID PRIMARY KEY REFERENCES booths(id) ON DELETE CASCADE,
    supervisor_member_id UUID NOT NULL REFERENCES campaign_members(id) ON DELETE CASCADE,
    assigned_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS booth_approver_assignments (
    booth_id UUID PRIMARY KEY REFERENCES booths(id) ON DELETE CASCADE,
    approver_member_id UUID NOT NULL REFERENCES campaign_members(id) ON DELETE CASCADE,
    assigned_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Checklist Items (Tiêu chí kiểm tra nghiệm thu riêng cho từng Booth)
CREATE TABLE IF NOT EXISTS checklist_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booth_id UUID NOT NULL REFERENCES booths(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category checklist_category NOT NULL DEFAULT 'OTHER',
    is_required BOOLEAN NOT NULL DEFAULT TRUE,
    order_index INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Submissions (Báo cáo nghiệm thu theo Booth & Checklist Item)
CREATE TABLE IF NOT EXISTS submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booth_id UUID NOT NULL REFERENCES booths(id) ON DELETE CASCADE,
    checklist_item_id UUID NOT NULL REFERENCES checklist_items(id) ON DELETE CASCADE,
    assigned_approver_member_id UUID NOT NULL REFERENCES campaign_members(id) ON DELETE RESTRICT,
    status submission_status NOT NULL DEFAULT 'DRAFT',
    notes TEXT,
    submitted_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
    submitted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_booth_checklist_item UNIQUE (booth_id, checklist_item_id)
);

-- 9. Evidence (Hình ảnh bằng chứng nghiệm thu)
CREATE TABLE IF NOT EXISTS evidence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    thumbnail_url TEXT,
    cloudinary_public_id VARCHAR(255) NOT NULL,
    file_size_bytes INT,
    width INT,
    height INT,
    uploaded_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. Approval History (Nhật ký phê duyệt)
CREATE TABLE IF NOT EXISTS approval_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
    reviewer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
    action approval_action NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT revision_requires_notes CHECK (
        (action = 'REQUEST_REVISION' AND notes IS NOT NULL AND LENGTH(TRIM(notes)) > 0)
        OR action = 'APPROVE'
    )
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_campaigns_created_by ON campaigns(created_by, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_campaign_members_user_role_status ON campaign_members(user_id, role, status);
CREATE INDEX IF NOT EXISTS idx_campaign_members_campaign_status ON campaign_members(campaign_id, status);
CREATE INDEX IF NOT EXISTS idx_campaign_member_history_campaign ON campaign_member_history(campaign_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_campaign_invites_email_status ON campaign_invites(LOWER(email), status);
CREATE INDEX IF NOT EXISTS idx_locations_campaign ON locations(campaign_id);
CREATE INDEX IF NOT EXISTS idx_booths_location ON booths(location_id);
CREATE INDEX IF NOT EXISTS idx_booth_supervisor_member ON booth_supervisor_assignments(supervisor_member_id);
CREATE INDEX IF NOT EXISTS idx_booth_approver_member ON booth_approver_assignments(approver_member_id);
CREATE INDEX IF NOT EXISTS idx_checklist_booth ON checklist_items(booth_id, order_index);
CREATE INDEX IF NOT EXISTS idx_submissions_booth_status ON submissions(booth_id, status);
CREATE INDEX IF NOT EXISTS idx_submissions_approver_status ON submissions(assigned_approver_member_id, status);
CREATE INDEX IF NOT EXISTS idx_evidence_submission ON evidence(submission_id);
CREATE INDEX IF NOT EXISTS idx_approval_history_submission ON approval_history(submission_id, created_at DESC);

-- ============================================================================
-- Triggers and Validation Functions
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.prevent_created_by_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    IF NEW.created_by IS DISTINCT FROM OLD.created_by THEN
        RAISE EXCEPTION 'created_by is immutable';
    END IF;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.protect_profile_identity()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    IF NEW.id IS DISTINCT FROM OLD.id THEN
        RAISE EXCEPTION 'Profile identity is immutable';
    END IF;
    IF auth.uid() IS NOT NULL
       AND LOWER(NEW.email) IS DISTINCT FROM LOWER(COALESCE(auth.jwt() ->> 'email', OLD.email)) THEN
        RAISE EXCEPTION 'Profile email must match the authenticated Google identity';
    END IF;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.protect_last_campaign_manager()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
    remaining_managers INT;
BEGIN
    IF OLD.role = 'MANAGER' AND OLD.status = 'ACTIVE'
       AND (
           TG_OP = 'DELETE'
           OR NEW.role <> 'MANAGER'
           OR NEW.status <> 'ACTIVE'
       ) THEN
        PERFORM 1 FROM campaigns WHERE id = OLD.campaign_id FOR UPDATE;

        SELECT COUNT(*) INTO remaining_managers
        FROM campaign_members
        WHERE campaign_id = OLD.campaign_id
          AND role = 'MANAGER'
          AND status = 'ACTIVE'
          AND id <> OLD.id;

        IF remaining_managers = 0 THEN
            RAISE EXCEPTION 'Campaign must retain at least one active manager';
        END IF;
    END IF;

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    END IF;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.record_campaign_member_history()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO campaign_member_history (
            campaign_id, member_id, member_user_id, new_role, new_status, changed_by
        ) VALUES (
            NEW.campaign_id, NEW.id, NEW.user_id, NEW.role, NEW.status,
            COALESCE(auth.uid(), NEW.assigned_by, NEW.user_id)
        );
    ELSIF NEW.role IS DISTINCT FROM OLD.role OR NEW.status IS DISTINCT FROM OLD.status THEN
        INSERT INTO campaign_member_history (
            campaign_id, member_id, member_user_id,
            previous_role, new_role, previous_status, new_status, changed_by
        ) VALUES (
            NEW.campaign_id, NEW.id, NEW.user_id,
            OLD.role, NEW.role, OLD.status, NEW.status,
            COALESCE(auth.uid(), NEW.revoked_by, NEW.assigned_by)
        );
    END IF;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_booth_supervisor_assignment()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
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
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_booth_approver_assignment()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
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
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_submission_approver()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM booths b
        JOIN locations l ON l.id = b.location_id
        JOIN campaign_members cm ON cm.id = NEW.assigned_approver_member_id
        WHERE b.id = NEW.booth_id
          AND cm.campaign_id = l.campaign_id
          AND cm.role = 'APPROVER'
          AND cm.status = 'ACTIVE'
    ) THEN
        RAISE EXCEPTION 'Submission approver must be an active approver member of the campaign containing this booth';
    END IF;
    RETURN NEW;
END;
$$;

-- Trigger kiểm tra tính toàn vẹn khi chuyển chiến dịch từ DRAFT -> ACTIVE
CREATE OR REPLACE FUNCTION public.validate_campaign_activation()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
    loc_count INT;
    empty_loc_name TEXT;
    empty_booth_name TEXT;
    unassigned_supervisor_booth TEXT;
    unassigned_approver_booth TEXT;
BEGIN
    -- Chỉ kiểm tra khi trạng thái chuyển sang ACTIVE
    IF NEW.status = 'ACTIVE' AND (OLD.status IS DISTINCT FROM 'ACTIVE') THEN
        -- 1. Phải có ít nhất 1 địa điểm
        SELECT COUNT(*) INTO loc_count FROM locations WHERE campaign_id = NEW.id;
        IF loc_count = 0 THEN
            RAISE EXCEPTION 'Không thể kích hoạt: Chiến dịch cần có ít nhất 1 địa điểm triển khai.';
        END IF;

        -- 2. Mọi địa điểm phải có ít nhất 1 gian hàng (booth)
        SELECT l.name INTO empty_loc_name
        FROM locations l
        LEFT JOIN booths b ON b.location_id = l.id
        WHERE l.campaign_id = NEW.id
        GROUP BY l.id, l.name
        HAVING COUNT(b.id) = 0
        LIMIT 1;

        IF empty_loc_name IS NOT NULL THEN
            RAISE EXCEPTION 'Không thể kích hoạt: Địa điểm "%" chưa có gian hàng (booth) nào.', empty_loc_name;
        END IF;

        -- 3. Mọi gian hàng phải có ít nhất 1 tiêu chí checklist
        SELECT b.name INTO empty_booth_name
        FROM booths b
        JOIN locations l ON l.id = b.location_id
        LEFT JOIN checklist_items ci ON ci.booth_id = b.id
        WHERE l.campaign_id = NEW.id
        GROUP BY b.id, b.name
        HAVING COUNT(ci.id) = 0
        LIMIT 1;

        IF empty_booth_name IS NOT NULL THEN
            RAISE EXCEPTION 'Không thể kích hoạt: Gian hàng "%" chưa có tiêu chí checklist nào.', empty_booth_name;
        END IF;

        -- 4. Mọi gian hàng phải được phân công Supervisor
        SELECT b.name INTO unassigned_supervisor_booth
        FROM booths b
        JOIN locations l ON l.id = b.location_id
        LEFT JOIN booth_supervisor_assignments bsa ON bsa.booth_id = b.id
        WHERE l.campaign_id = NEW.id AND bsa.supervisor_member_id IS NULL
        LIMIT 1;

        IF unassigned_supervisor_booth IS NOT NULL THEN
            RAISE EXCEPTION 'Không thể kích hoạt: Gian hàng "%" chưa được phân công Giám sát viên (Supervisor).', unassigned_supervisor_booth;
        END IF;

        -- 5. Mọi gian hàng phải được phân công Approver
        SELECT b.name INTO unassigned_approver_booth
        FROM booths b
        JOIN locations l ON l.id = b.location_id
        LEFT JOIN booth_approver_assignments baa ON baa.booth_id = b.id
        WHERE l.campaign_id = NEW.id AND baa.approver_member_id IS NULL
        LIMIT 1;

        IF unassigned_approver_booth IS NOT NULL THEN
            RAISE EXCEPTION 'Không thể kích hoạt: Gian hàng "%" chưa được phân công Người phê duyệt (Approver).', unassigned_approver_booth;
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

-- Apply Triggers
DROP TRIGGER IF EXISTS trg_profiles_updated_at ON profiles;
CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_profile_identity_immutable ON profiles;
CREATE TRIGGER trg_profile_identity_immutable BEFORE UPDATE ON profiles
FOR EACH ROW EXECUTE FUNCTION public.protect_profile_identity();

DROP TRIGGER IF EXISTS trg_campaigns_updated_at ON campaigns;
CREATE TRIGGER trg_campaigns_updated_at BEFORE UPDATE ON campaigns
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_campaign_created_by_immutable ON campaigns;
CREATE TRIGGER trg_campaign_created_by_immutable BEFORE UPDATE ON campaigns
FOR EACH ROW EXECUTE FUNCTION public.prevent_created_by_change();

DROP TRIGGER IF EXISTS trg_validate_campaign_activation ON campaigns;
CREATE TRIGGER trg_validate_campaign_activation BEFORE UPDATE OF status ON campaigns
FOR EACH ROW EXECUTE FUNCTION public.validate_campaign_activation();

DROP TRIGGER IF EXISTS trg_campaign_members_updated_at ON campaign_members;
CREATE TRIGGER trg_campaign_members_updated_at BEFORE UPDATE ON campaign_members
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_protect_last_manager ON campaign_members;
CREATE TRIGGER trg_protect_last_manager BEFORE UPDATE OR DELETE ON campaign_members
FOR EACH ROW EXECUTE FUNCTION public.protect_last_campaign_manager();

DROP TRIGGER IF EXISTS trg_campaign_member_history ON campaign_members;
CREATE TRIGGER trg_campaign_member_history AFTER INSERT OR UPDATE ON campaign_members
FOR EACH ROW EXECUTE FUNCTION public.record_campaign_member_history();

DROP TRIGGER IF EXISTS trg_campaign_invites_updated_at ON campaign_invites;
CREATE TRIGGER trg_campaign_invites_updated_at BEFORE UPDATE ON campaign_invites
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_locations_updated_at ON locations;
CREATE TRIGGER trg_locations_updated_at BEFORE UPDATE ON locations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_booths_updated_at ON booths;
CREATE TRIGGER trg_booths_updated_at BEFORE UPDATE ON booths
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_booth_supervisor_assignments_updated_at ON booth_supervisor_assignments;
CREATE TRIGGER trg_booth_supervisor_assignments_updated_at BEFORE UPDATE ON booth_supervisor_assignments
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_validate_booth_supervisor ON booth_supervisor_assignments;
CREATE TRIGGER trg_validate_booth_supervisor BEFORE INSERT OR UPDATE ON booth_supervisor_assignments
FOR EACH ROW EXECUTE FUNCTION public.validate_booth_supervisor_assignment();

DROP TRIGGER IF EXISTS trg_booth_approver_assignments_updated_at ON booth_approver_assignments;
CREATE TRIGGER trg_booth_approver_assignments_updated_at BEFORE UPDATE ON booth_approver_assignments
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_validate_booth_approver ON booth_approver_assignments;
CREATE TRIGGER trg_validate_booth_approver BEFORE INSERT OR UPDATE ON booth_approver_assignments
FOR EACH ROW EXECUTE FUNCTION public.validate_booth_approver_assignment();

DROP TRIGGER IF EXISTS trg_checklist_items_updated_at ON checklist_items;
CREATE TRIGGER trg_checklist_items_updated_at BEFORE UPDATE ON checklist_items
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_submissions_updated_at ON submissions;
CREATE TRIGGER trg_submissions_updated_at BEFORE UPDATE ON submissions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_validate_submission_approver ON submissions;
CREATE TRIGGER trg_validate_submission_approver BEFORE INSERT OR UPDATE OF assigned_approver_member_id, booth_id ON submissions
FOR EACH ROW EXECUTE FUNCTION public.validate_submission_approver();

