-- Migration 008 Corrected: Role-Based Permissions System
-- Phase 2: Foundation Systems - Role-Based Permissions
-- Corrected version that works with existing table structures

-- Add missing columns to roles table
ALTER TABLE roles
ADD COLUMN IF NOT EXISTS display_name VARCHAR(200),
ADD COLUMN IF NOT EXISTS is_system_role BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES users(id);

-- Add missing columns to permissions table
ALTER TABLE permissions
ADD COLUMN IF NOT EXISTS display_name VARCHAR(200),
ADD COLUMN IF NOT EXISTS resource VARCHAR(100),
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- Update existing permissions to use new resource column (copy from resource_type)
UPDATE permissions SET resource = resource_type WHERE resource IS NULL;

-- Add missing indexes
CREATE INDEX IF NOT EXISTS idx_roles_is_active ON roles(is_active);
CREATE INDEX IF NOT EXISTS idx_permissions_resource ON permissions(resource);
CREATE INDEX IF NOT EXISTS idx_permissions_is_active ON permissions(is_active);

-- Clear existing permissions and insert new comprehensive set
DELETE FROM role_permissions;
DELETE FROM permissions;

-- Get a user ID for granted_by (use first admin user or create system user)
DO $$
DECLARE
    system_user_id UUID;
    org_id UUID;
BEGIN
    -- Get first organization
    SELECT id INTO org_id FROM organizations LIMIT 1;

    -- Try to find an existing admin user
    SELECT id INTO system_user_id FROM users WHERE email LIKE '%admin%' LIMIT 1;

    -- If no admin user found, use first user
    IF system_user_id IS NULL THEN
        SELECT id INTO system_user_id FROM users LIMIT 1;
    END IF;

    -- Insert comprehensive permissions with proper created_at and granted_by
    INSERT INTO permissions (id, name, display_name, description, resource, action, resource_type, is_active, created_at) VALUES
    -- Patient permissions
    (gen_random_uuid(), 'patient.create', 'Create Patients', 'Create new patient records', 'patient', 'create', 'patient', TRUE, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'patient.read', 'View Patients', 'View patient information', 'patient', 'read', 'patient', TRUE, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'patient.update', 'Update Patients', 'Update patient information', 'patient', 'update', 'patient', TRUE, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'patient.delete', 'Delete Patients', 'Delete patient records', 'patient', 'delete', 'patient', TRUE, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'patient.phi_access', 'Access PHI', 'Access protected health information', 'patient', 'phi_access', 'patient', TRUE, CURRENT_TIMESTAMP),

    -- IVR permissions
    (gen_random_uuid(), 'ivr.create', 'Create IVR Requests', 'Create insurance verification requests', 'ivr', 'create', 'ivr', TRUE, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'ivr.read', 'View IVR Requests', 'View insurance verification requests', 'ivr', 'read', 'ivr', TRUE, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'ivr.update', 'Update IVR Requests', 'Update insurance verification requests', 'ivr', 'update', 'ivr', TRUE, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'ivr.approve', 'Approve IVR Requests', 'Approve insurance verification requests', 'ivr', 'approve', 'ivr', TRUE, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'ivr.reject', 'Reject IVR Requests', 'Reject insurance verification requests', 'ivr', 'reject', 'ivr', TRUE, CURRENT_TIMESTAMP),

    -- Order permissions
    (gen_random_uuid(), 'order.create', 'Create Orders', 'Create product orders', 'order', 'create', 'order', TRUE, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'order.read', 'View Orders', 'View order information', 'order', 'read', 'order', TRUE, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'order.update', 'Update Orders', 'Update order information', 'order', 'update', 'order', TRUE, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'order.cancel', 'Cancel Orders', 'Cancel orders', 'order', 'cancel', 'order', TRUE, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'order.ship', 'Ship Orders', 'Mark orders as shipped', 'order', 'ship', 'order', TRUE, CURRENT_TIMESTAMP),

    -- User management permissions
    (gen_random_uuid(), 'user.create', 'Create Users', 'Create new user accounts', 'user', 'create', 'user', TRUE, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'user.read', 'View Users', 'View user information', 'user', 'read', 'user', TRUE, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'user.update', 'Update Users', 'Update user information', 'user', 'update', 'user', TRUE, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'user.deactivate', 'Deactivate Users', 'Deactivate user accounts', 'user', 'deactivate', 'user', TRUE, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'user.assign_roles', 'Assign Roles', 'Assign roles to users', 'user', 'assign_roles', 'user', TRUE, CURRENT_TIMESTAMP),

    -- Settings permissions
    (gen_random_uuid(), 'settings.read', 'View Settings', 'View system settings', 'settings', 'read', 'settings', TRUE, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'settings.update', 'Update Settings', 'Update system settings', 'settings', 'update', 'settings', TRUE, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'settings.permissions', 'Manage Permissions', 'Manage user permissions and roles', 'settings', 'permissions', 'settings', TRUE, CURRENT_TIMESTAMP),

    -- Analytics permissions
    (gen_random_uuid(), 'analytics.read', 'View Analytics', 'View analytics and reports', 'analytics', 'read', 'analytics', TRUE, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'analytics.export', 'Export Analytics', 'Export analytics data', 'analytics', 'export', 'analytics', TRUE, CURRENT_TIMESTAMP),

    -- Audit permissions
    (gen_random_uuid(), 'audit.read', 'View Audit Logs', 'View audit logs and compliance reports', 'audit', 'read', 'audit', TRUE, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'audit.export', 'Export Audit Logs', 'Export audit logs', 'audit', 'export', 'audit', TRUE, CURRENT_TIMESTAMP);

    -- Clear existing roles and insert new ones
    DELETE FROM user_roles;
    DELETE FROM roles WHERE name IN ('healthcare_provider', 'office_administrator', 'medical_staff');

    -- Insert default roles with proper created_at and organization_id
    INSERT INTO roles (id, name, display_name, description, is_system_role, is_active, organization_id, permissions, created_at, updated_at)
    SELECT
        gen_random_uuid(),
        role_name,
        role_display_name,
        role_description,
        role_is_system,
        TRUE,
        org_id,
        '{}'::json,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    FROM (VALUES
        ('healthcare_provider', 'Healthcare Provider', 'Full access to all medical and administrative functions', TRUE),
        ('office_administrator', 'Office Administrator', 'Limited patient access with settings management capabilities', FALSE),
        ('medical_staff', 'Medical Staff', 'View patients and create orders, no settings access', FALSE)
    ) AS role_data(role_name, role_display_name, role_description, role_is_system);

    -- Assign permissions to roles
    DECLARE
        healthcare_provider_id UUID;
        office_admin_id UUID;
        medical_staff_id UUID;
    BEGIN
        -- Get role IDs
        SELECT id INTO healthcare_provider_id FROM roles WHERE name = 'healthcare_provider';
        SELECT id INTO office_admin_id FROM roles WHERE name = 'office_administrator';
        SELECT id INTO medical_staff_id FROM roles WHERE name = 'medical_staff';

        -- Healthcare Provider gets all permissions
        INSERT INTO role_permissions (role_id, permission_id, granted_at, granted_by)
        SELECT healthcare_provider_id, id, CURRENT_TIMESTAMP, system_user_id FROM permissions;

        -- Office Administrator gets limited permissions
        INSERT INTO role_permissions (role_id, permission_id, granted_at, granted_by)
        SELECT office_admin_id, id, CURRENT_TIMESTAMP, system_user_id FROM permissions
        WHERE name IN (
            'patient.read', 'patient.update', 'patient.phi_access',
            'ivr.read', 'ivr.create',
            'order.read', 'order.create',
            'user.read', 'user.create', 'user.update',
            'settings.read', 'settings.update', 'settings.permissions',
            'analytics.read'
        );

        -- Medical Staff gets basic permissions
        INSERT INTO role_permissions (role_id, permission_id, granted_at, granted_by)
        SELECT medical_staff_id, id, CURRENT_TIMESTAMP, system_user_id FROM permissions
        WHERE name IN (
            'patient.read', 'patient.phi_access',
            'ivr.read', 'ivr.create',
            'order.read', 'order.create',
            'analytics.read'
        );
    END;

    -- Assign Healthcare Provider role to existing doctor users
    INSERT INTO user_roles (id, user_id, role_id, assigned_by, is_active, assigned_at)
    SELECT
        gen_random_uuid(),
        u.id,
        r.id,
        system_user_id,
        TRUE,
        CURRENT_TIMESTAMP
    FROM users u
    CROSS JOIN roles r
    WHERE (u.email LIKE '%doctor%' OR u.email LIKE '%dr.%' OR u.email = 'doctor@healthcare.local')
    AND r.name = 'healthcare_provider'
    ON CONFLICT (user_id, role_id) DO NOTHING;

END $$;

COMMENT ON COLUMN roles.display_name IS 'Human-readable display name for the role';
COMMENT ON COLUMN roles.is_system_role IS 'System roles cannot be deleted or modified';
COMMENT ON COLUMN permissions.display_name IS 'Human-readable display name for the permission';
COMMENT ON COLUMN permissions.resource IS 'The resource type this permission applies to';