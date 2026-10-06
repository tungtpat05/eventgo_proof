-- ============================================================================
-- EventGo Proof: Campaign Creation Wizard & Checklist Templates Migration
-- Adds wizard_step to campaigns, default_supervisor_member_id to locations,
-- and checklist templates with standard activation presets.
-- ============================================================================

-- 1. Campaigns: Add wizard_step (1..5)
ALTER TABLE campaigns 
ADD COLUMN IF NOT EXISTS wizard_step INT NOT NULL DEFAULT 1;

-- 2. Locations: Add default_supervisor_member_id for cascading inheritance
ALTER TABLE locations 
ADD COLUMN IF NOT EXISTS default_supervisor_member_id UUID REFERENCES campaign_members(id) ON DELETE SET NULL;

-- 3. Checklist Templates
CREATE TABLE IF NOT EXISTS checklist_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    category checklist_category NOT NULL DEFAULT 'OTHER',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Checklist Template Items
CREATE TABLE IF NOT EXISTS checklist_template_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID NOT NULL REFERENCES checklist_templates(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category checklist_category NOT NULL DEFAULT 'OTHER',
    is_required BOOLEAN NOT NULL DEFAULT TRUE,
    order_index INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on template tables
ALTER TABLE checklist_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_template_items ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read active templates
CREATE POLICY "Allow authenticated users to read active checklist templates"
    ON checklist_templates FOR SELECT
    TO authenticated
    USING (is_active = TRUE);

CREATE POLICY "Allow authenticated users to read template items"
    ON checklist_template_items FOR SELECT
    TO authenticated
    USING (TRUE);
