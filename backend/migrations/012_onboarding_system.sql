-- Migration: Add onboarding system fields to users table
-- Task ID: mbvuajvrbewmyth9eys
-- Date: January 2025

-- Add onboarding tracking fields to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_started_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_step INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_skipped BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS first_login_at TIMESTAMP WITH TIME ZONE;

-- Create onboarding_progress table for detailed tracking
CREATE TABLE IF NOT EXISTS onboarding_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    step_name VARCHAR(100) NOT NULL,
    step_order INTEGER NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP WITH TIME ZONE,
    data JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_onboarding_progress_user_id ON onboarding_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_progress_step_order ON onboarding_progress(step_order);
CREATE INDEX IF NOT EXISTS idx_users_onboarding_completed ON users(onboarding_completed);
CREATE INDEX IF NOT EXISTS idx_users_first_login_at ON users(first_login_at);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_onboarding_progress_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_onboarding_progress_updated_at
    BEFORE UPDATE ON onboarding_progress
    FOR EACH ROW
    EXECUTE FUNCTION update_onboarding_progress_updated_at();

-- Insert default onboarding steps for each role
-- Doctor onboarding steps
INSERT INTO onboarding_progress (user_id, step_name, step_order, completed)
SELECT
    u.id,
    step_name,
    step_order,
    FALSE
FROM users u
CROSS JOIN (
    VALUES
        ('welcome', 1),
        ('profile_setup', 2),
        ('patient_management', 3),
        ('ivr_workflow', 4),
        ('dashboard_tour', 5)
) AS steps(step_name, step_order)
WHERE u.role_id IN (
    SELECT id FROM roles WHERE name = 'Doctor'
)
ON CONFLICT DO NOTHING;

-- IVR Company onboarding steps
INSERT INTO onboarding_progress (user_id, step_name, step_order, completed)
SELECT
    u.id,
    step_name,
    step_order,
    FALSE
FROM users u
CROSS JOIN (
    VALUES
        ('welcome', 1),
        ('review_queue', 2),
        ('approval_workflow', 3),
        ('communication_tools', 4),
        ('dashboard_tour', 5)
) AS steps(step_name, step_order)
WHERE u.role_id IN (
    SELECT id FROM roles WHERE name = 'IVR'
)
ON CONFLICT DO NOTHING;

-- Sales onboarding steps
INSERT INTO onboarding_progress (user_id, step_name, step_order, completed)
SELECT
    u.id,
    step_name,
    step_order,
    FALSE
FROM users u
CROSS JOIN (
    VALUES
        ('welcome', 1),
        ('doctor_management', 2),
        ('schedule_setup', 3),
        ('analytics_overview', 4),
        ('dashboard_tour', 5)
) AS steps(step_name, step_order)
WHERE u.role_id IN (
    SELECT id FROM roles WHERE name = 'Sales'
)
ON CONFLICT DO NOTHING;

-- Master Distributor onboarding steps
INSERT INTO onboarding_progress (user_id, step_name, step_order, completed)
SELECT
    u.id,
    step_name,
    step_order,
    FALSE
FROM users u
CROSS JOIN (
    VALUES
        ('welcome', 1),
        ('order_management', 2),
        ('shipping_logistics', 3),
        ('analytics_reports', 4),
        ('dashboard_tour', 5)
) AS steps(step_name, step_order)
WHERE u.role_id IN (
    SELECT id FROM roles WHERE name = 'Master Distributor'
)
ON CONFLICT DO NOTHING;

-- Regional Distributor onboarding steps
INSERT INTO onboarding_progress (user_id, step_name, step_order, completed)
SELECT
    u.id,
    step_name,
    step_order,
    FALSE
FROM users u
CROSS JOIN (
    VALUES
        ('welcome', 1),
        ('order_queue', 2),
        ('shipment_tracking', 3),
        ('territory_management', 4),
        ('dashboard_tour', 5)
) AS steps(step_name, step_order)
WHERE u.role_id IN (
    SELECT id FROM roles WHERE name = 'Distributor'
)
ON CONFLICT DO NOTHING;

-- Admin onboarding steps
INSERT INTO onboarding_progress (user_id, step_name, step_order, completed)
SELECT
    u.id,
    step_name,
    step_order,
    FALSE
FROM users u
CROSS JOIN (
    VALUES
        ('welcome', 1),
        ('user_management', 2),
        ('system_configuration', 3),
        ('audit_compliance', 4),
        ('dashboard_tour', 5)
) AS steps(step_name, step_order)
WHERE u.role_id IN (
    SELECT id FROM roles WHERE name = 'Admin'
)
ON CONFLICT DO NOTHING;

-- CHP Admin onboarding steps
INSERT INTO onboarding_progress (user_id, step_name, step_order, completed)
SELECT
    u.id,
    step_name,
    step_order,
    FALSE
FROM users u
CROSS JOIN (
    VALUES
        ('welcome', 1),
        ('program_management', 2),
        ('community_partners', 3),
        ('compliance_tracking', 4),
        ('dashboard_tour', 5)
) AS steps(step_name, step_order)
WHERE u.role_id IN (
    SELECT id FROM roles WHERE name = 'CHP Admin'
)
ON CONFLICT DO NOTHING;

-- Logistics onboarding steps
INSERT INTO onboarding_progress (user_id, step_name, step_order, completed)
SELECT
    u.id,
    step_name,
    step_order,
    FALSE
FROM users u
CROSS JOIN (
    VALUES
        ('welcome', 1),
        ('shipping_queue', 2),
        ('carrier_management', 3),
        ('warehouse_config', 4),
        ('dashboard_tour', 5)
) AS steps(step_name, step_order)
WHERE u.role_id IN (
    SELECT id FROM roles WHERE name = 'Shipping and Logistics'
)
ON CONFLICT DO NOTHING;

-- Add comment for tracking
COMMENT ON TABLE onboarding_progress IS 'Tracks detailed onboarding progress for each user by role';
COMMENT ON COLUMN users.onboarding_completed IS 'Whether user has completed their role-specific onboarding';
COMMENT ON COLUMN users.first_login_at IS 'Timestamp of users first login to trigger onboarding';