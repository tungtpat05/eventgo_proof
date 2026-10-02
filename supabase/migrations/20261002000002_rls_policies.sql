-- ============================================================================
-- EventGo Proof: Migration 002 - Row Level Security (RLS) & Tenant Isolation
-- ============================================================================

-- 1. Helper Functions to avoid recursion and optimize RLS lookups
CREATE OR REPLACE FUNCTION public.current_org_id()
RETURNS UUID AS $$
  SELECT organization_id FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS user_role AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 2. Enable RLS on all domain tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_history ENABLE ROW LEVEL SECURITY;

-- 3. Organizations Policies
CREATE POLICY "Users can view their own organization"
    ON organizations FOR SELECT
    USING (id = public.current_org_id());

-- 4. Profiles Policies
CREATE POLICY "Users can view profiles within their organization"
    ON profiles FOR SELECT
    USING (organization_id = public.current_org_id());

CREATE POLICY "Users can update their own profile"
    ON profiles FOR UPDATE
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid() AND organization_id = public.current_org_id());

-- 5. Campaigns Policies
CREATE POLICY "Users can view campaigns of their organization"
    ON campaigns FOR SELECT
    USING (organization_id = public.current_org_id());

CREATE POLICY "Project Managers can insert campaigns"
    ON campaigns FOR INSERT
    WITH CHECK (
        organization_id = public.current_org_id()
        AND public.current_user_role() = 'PROJECT_MANAGER'
    );

CREATE POLICY "Project Managers can update campaigns"
    ON campaigns FOR UPDATE
    USING (
        organization_id = public.current_org_id()
        AND public.current_user_role() = 'PROJECT_MANAGER'
    );

CREATE POLICY "Project Managers can delete campaigns"
    ON campaigns FOR DELETE
    USING (
        organization_id = public.current_org_id()
        AND public.current_user_role() = 'PROJECT_MANAGER'
    );

-- 6. Locations Policies
CREATE POLICY "Users can view locations in their organization"
    ON locations FOR SELECT
    USING (organization_id = public.current_org_id());

CREATE POLICY "Project Managers can manage locations"
    ON locations FOR ALL
    USING (
        organization_id = public.current_org_id()
        AND public.current_user_role() = 'PROJECT_MANAGER'
    );

-- 7. Checklist Items Policies
CREATE POLICY "Users can view checklist items of org campaigns"
    ON checklist_items FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM campaigns c
            WHERE c.id = checklist_items.campaign_id
            AND c.organization_id = public.current_org_id()
        )
    );

CREATE POLICY "Project Managers can manage checklist items"
    ON checklist_items FOR ALL
    USING (
        public.current_user_role() = 'PROJECT_MANAGER'
        AND EXISTS (
            SELECT 1 FROM campaigns c
            WHERE c.id = checklist_items.campaign_id
            AND c.organization_id = public.current_org_id()
        )
    );

-- 8. Submissions Policies
CREATE POLICY "Users can view submissions within their organization"
    ON submissions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM locations l
            WHERE l.id = submissions.location_id
            AND l.organization_id = public.current_org_id()
        )
    );

CREATE POLICY "Supervisors and PMs can insert or update submissions"
    ON submissions FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM locations l
            WHERE l.id = submissions.location_id
            AND l.organization_id = public.current_org_id()
            AND (
                public.current_user_role() = 'PROJECT_MANAGER'
                OR l.assigned_supervisor_id = auth.uid()
                OR public.current_user_role() = 'APPROVER'
            )
        )
    );

-- 9. Evidence Policies
CREATE POLICY "Users can view evidence of accessible submissions"
    ON evidence FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM submissions s
            JOIN locations l ON l.id = s.location_id
            WHERE s.id = evidence.submission_id
            AND l.organization_id = public.current_org_id()
        )
    );

CREATE POLICY "Supervisors and PMs can insert evidence"
    ON evidence FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM submissions s
            JOIN locations l ON l.id = s.location_id
            WHERE s.id = evidence.submission_id
            AND l.organization_id = public.current_org_id()
            AND (
                public.current_user_role() = 'PROJECT_MANAGER'
                OR l.assigned_supervisor_id = auth.uid()
            )
        )
    );

-- 10. Approval History Policies (Immutable log)
CREATE POLICY "Users can view approval history within organization"
    ON approval_history FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM submissions s
            JOIN locations l ON l.id = s.location_id
            WHERE s.id = approval_history.submission_id
            AND l.organization_id = public.current_org_id()
        )
    );

CREATE POLICY "Approvers and PMs can insert approval history"
    ON approval_history FOR INSERT
    WITH CHECK (
        reviewer_id = auth.uid()
        AND public.current_user_role() IN ('PROJECT_MANAGER', 'APPROVER')
        AND EXISTS (
            SELECT 1 FROM submissions s
            JOIN locations l ON l.id = s.location_id
            WHERE s.id = approval_history.submission_id
            AND l.organization_id = public.current_org_id()
        )
    );
