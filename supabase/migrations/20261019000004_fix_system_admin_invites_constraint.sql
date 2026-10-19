-- Migration: Ensure unique constraint on email for system_admin_invites
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'system_admin_invites_email_key'
    ) THEN
        ALTER TABLE system_admin_invites ADD CONSTRAINT system_admin_invites_email_key UNIQUE (email);
    END IF;
END $$;
