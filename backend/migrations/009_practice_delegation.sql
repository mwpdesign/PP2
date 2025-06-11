-- Migration 009: Practice-Level Delegation System
-- Adds practice delegation fields to users table for doctor-staff relationships

-- Add practice delegation columns to users table
ALTER TABLE users ADD COLUMN parent_doctor_id UUID REFERENCES users(id);
ALTER TABLE users ADD COLUMN practice_role VARCHAR(50);
ALTER TABLE users ADD COLUMN invitation_token VARCHAR(255);
ALTER TABLE users ADD COLUMN invited_at TIMESTAMP WITH TIME ZONE;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_parent_doctor_id ON users(parent_doctor_id);
CREATE INDEX IF NOT EXISTS idx_users_practice_role ON users(practice_role);
CREATE INDEX IF NOT EXISTS idx_users_invitation_token ON users(invitation_token);

-- Add comments for documentation
COMMENT ON COLUMN users.parent_doctor_id IS 'ID of the doctor who owns this practice (null for doctors themselves)';
COMMENT ON COLUMN users.practice_role IS 'Practice-level role: office_admin or medical_staff';
COMMENT ON COLUMN users.invitation_token IS 'Unique token for staff invitation acceptance';
COMMENT ON COLUMN users.invited_at IS 'Timestamp when invitation was created';

-- Create constraint to ensure practice_role is valid
ALTER TABLE users ADD CONSTRAINT check_practice_role
    CHECK (practice_role IS NULL OR practice_role IN ('office_admin', 'medical_staff'));

-- Create constraint to ensure invitation_token is unique when not null
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_invitation_token_unique
    ON users(invitation_token) WHERE invitation_token IS NOT NULL;