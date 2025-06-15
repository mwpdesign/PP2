-- Migration 011: User Invitation System
-- Task ID: mbvu8p4nc9bidurxtvc
-- Phase 1: Database Schema for User Invitation Tracking
-- Creates comprehensive invitation tracking for all user types

-- =====================================================
-- USER INVITATIONS TABLE
-- =====================================================

-- Create user_invitations table for tracking all invitation types
CREATE TABLE IF NOT EXISTS user_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Invitation details
    email VARCHAR(255) NOT NULL,
    invitation_token VARCHAR(255) NOT NULL UNIQUE,
    invitation_type VARCHAR(50) NOT NULL, -- 'doctor', 'sales', 'distributor', 'master_distributor', 'office_admin', 'medical_staff', 'ivr_company', 'shipping_logistics'

    -- User information
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    role_name VARCHAR(50) NOT NULL, -- The role they will be assigned

    -- Invitation status and lifecycle
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'sent', 'accepted', 'expired', 'cancelled'
    invited_by_id UUID REFERENCES users(id) ON DELETE SET NULL,
    invited_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    sent_at TIMESTAMP WITH TIME ZONE, -- When email was actually sent
    accepted_at TIMESTAMP WITH TIME ZONE, -- When invitation was accepted
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL, -- Invitation expiry (default 7 days)

    -- Hierarchy relationships (for sales chain invitations)
    parent_sales_id UUID REFERENCES users(id) ON DELETE SET NULL,
    parent_distributor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    parent_master_distributor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    parent_doctor_id UUID REFERENCES users(id) ON DELETE SET NULL, -- For practice staff

    -- Additional invitation data
    invitation_message TEXT, -- Custom message from inviter
    invitation_metadata JSONB DEFAULT '{}', -- Additional invitation context

    -- Email tracking
    email_attempts INTEGER DEFAULT 0,
    last_email_sent_at TIMESTAMP WITH TIME ZONE,
    email_delivery_status VARCHAR(50), -- 'pending', 'delivered', 'bounced', 'failed'

    -- Security and audit
    ip_address INET, -- IP address when invitation was created
    user_agent TEXT, -- User agent when invitation was created

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- USER TABLE ENHANCEMENTS
-- =====================================================

-- Add invitation status fields to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS invitation_status VARCHAR(50) DEFAULT 'active';
ALTER TABLE users ADD COLUMN IF NOT EXISTS invitation_accepted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS original_invitation_id UUID REFERENCES user_invitations(id) ON DELETE SET NULL;

-- Update existing users to have 'active' status (they're already registered)
UPDATE users SET invitation_status = 'active' WHERE invitation_status IS NULL;

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Primary indexes for user_invitations
CREATE INDEX IF NOT EXISTS idx_user_invitations_email ON user_invitations(email);
CREATE INDEX IF NOT EXISTS idx_user_invitations_token ON user_invitations(invitation_token);
CREATE INDEX IF NOT EXISTS idx_user_invitations_status ON user_invitations(status);
CREATE INDEX IF NOT EXISTS idx_user_invitations_type ON user_invitations(invitation_type);
CREATE INDEX IF NOT EXISTS idx_user_invitations_invited_by ON user_invitations(invited_by_id);
CREATE INDEX IF NOT EXISTS idx_user_invitations_organization ON user_invitations(organization_id);
CREATE INDEX IF NOT EXISTS idx_user_invitations_expires_at ON user_invitations(expires_at);

-- Hierarchy relationship indexes
CREATE INDEX IF NOT EXISTS idx_user_invitations_parent_sales ON user_invitations(parent_sales_id);
CREATE INDEX IF NOT EXISTS idx_user_invitations_parent_distributor ON user_invitations(parent_distributor_id);
CREATE INDEX IF NOT EXISTS idx_user_invitations_parent_master_distributor ON user_invitations(parent_master_distributor_id);
CREATE INDEX IF NOT EXISTS idx_user_invitations_parent_doctor ON user_invitations(parent_doctor_id);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_user_invitations_status_expires ON user_invitations(status, expires_at);
CREATE INDEX IF NOT EXISTS idx_user_invitations_org_type ON user_invitations(organization_id, invitation_type);
CREATE INDEX IF NOT EXISTS idx_user_invitations_invited_by_status ON user_invitations(invited_by_id, status);

-- User table indexes for new fields
CREATE INDEX IF NOT EXISTS idx_users_invitation_status ON users(invitation_status);
CREATE INDEX IF NOT EXISTS idx_users_original_invitation ON users(original_invitation_id);

-- =====================================================
-- CONSTRAINTS AND VALIDATION
-- =====================================================

-- Ensure invitation_type is valid
ALTER TABLE user_invitations ADD CONSTRAINT check_invitation_type
    CHECK (invitation_type IN (
        'doctor', 'sales', 'distributor', 'master_distributor',
        'office_admin', 'medical_staff', 'ivr_company', 'shipping_logistics',
        'admin', 'chp_admin'
    ));

-- Ensure status is valid
ALTER TABLE user_invitations ADD CONSTRAINT check_invitation_status
    CHECK (status IN ('pending', 'sent', 'accepted', 'expired', 'cancelled', 'failed'));

-- Ensure user invitation_status is valid
ALTER TABLE users ADD CONSTRAINT check_user_invitation_status
    CHECK (invitation_status IN ('pending', 'invited', 'active', 'suspended', 'deactivated'));

-- Ensure email_delivery_status is valid
ALTER TABLE user_invitations ADD CONSTRAINT check_email_delivery_status
    CHECK (email_delivery_status IS NULL OR email_delivery_status IN ('pending', 'delivered', 'bounced', 'failed'));

-- Ensure expires_at is after invited_at
ALTER TABLE user_invitations ADD CONSTRAINT check_expires_after_invited
    CHECK (expires_at > invited_at);

-- Ensure accepted_at is after invited_at when not null
ALTER TABLE user_invitations ADD CONSTRAINT check_accepted_after_invited
    CHECK (accepted_at IS NULL OR accepted_at >= invited_at);

-- =====================================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- =====================================================

-- Create trigger function for updating updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_invitations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for user_invitations
CREATE TRIGGER trigger_user_invitations_updated_at
    BEFORE UPDATE ON user_invitations
    FOR EACH ROW
    EXECUTE FUNCTION update_user_invitations_updated_at();

-- =====================================================
-- SAMPLE DATA AND COMMENTS
-- =====================================================

-- Add table comments for documentation
COMMENT ON TABLE user_invitations IS 'Comprehensive tracking of user invitations for all user types in the healthcare IVR platform';
COMMENT ON COLUMN user_invitations.invitation_type IS 'Type of user being invited: doctor, sales, distributor, master_distributor, office_admin, medical_staff, ivr_company, shipping_logistics, admin, chp_admin';
COMMENT ON COLUMN user_invitations.status IS 'Current invitation status: pending (created), sent (email sent), accepted (user registered), expired (past expiry), cancelled (manually cancelled), failed (email failed)';
COMMENT ON COLUMN user_invitations.invitation_token IS 'Unique secure token for invitation acceptance - used in invitation URLs';
COMMENT ON COLUMN user_invitations.expires_at IS 'Invitation expiry timestamp - typically 7 days from creation';
COMMENT ON COLUMN user_invitations.invitation_metadata IS 'Additional invitation context like custom permissions, territory assignments, etc.';
COMMENT ON COLUMN user_invitations.email_delivery_status IS 'Email delivery tracking: pending, delivered, bounced, failed';

COMMENT ON COLUMN users.invitation_status IS 'User account status: pending (invited but not registered), invited (invitation sent), active (normal user), suspended (temporarily disabled), deactivated (permanently disabled)';
COMMENT ON COLUMN users.invitation_accepted_at IS 'Timestamp when user accepted their invitation and completed registration';
COMMENT ON COLUMN users.original_invitation_id IS 'Reference to the original invitation that created this user account';

-- =====================================================
-- AUDIT LOGGING
-- =====================================================

-- Log the migration completion
DO $$
DECLARE
    primary_org_id UUID;
    system_user_id UUID;
BEGIN
    -- Get the primary organization ID
    SELECT id INTO primary_org_id FROM organizations WHERE name = 'Healthcare IVR Primary Org' LIMIT 1;

    -- If no primary org found, use the first available organization
    IF primary_org_id IS NULL THEN
        SELECT id INTO primary_org_id FROM organizations LIMIT 1;
    END IF;

    -- Get system user for audit logging
    SELECT id INTO system_user_id FROM users WHERE email = 'system@healthcare.local' LIMIT 1;

    -- Insert audit log for migration
    INSERT INTO audit_logs (
        id,
        user_id,
        organization_id,
        action_type,
        resource_type,
        resource_id,
        ip_address,
        metadata,
        success,
        created_at
    ) VALUES (
        gen_random_uuid(),
        system_user_id,
        primary_org_id,
        'SCHEMA_MIGRATION',
        'DATABASE',
        gen_random_uuid(),
        '127.0.0.1'::inet,
        '{"migration": "011_user_invitation_system", "description": "Added comprehensive user invitation tracking system for all user types", "task_id": "mbvu8p4nc9bidurxtvc"}'::jsonb,
        true,
        CURRENT_TIMESTAMP
    );
END $$;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

-- Display completion message
SELECT 'Migration 011_user_invitation_system completed successfully!' as status,
       'User invitation tracking system ready for all user types' as details,
       'Task ID: mbvu8p4nc9bidurxtvc' as task_reference;