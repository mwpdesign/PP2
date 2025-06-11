-- Migration 008 Final: Role-Based Permissions System
-- Phase 2: Foundation Systems - Role-Based Permissions
-- Final corrected version with proper UUID handling

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

-- Insert comprehensive permissions with explicit UUID generation
INSERT INTO permissions (id, name, display_name, description, resource, action, resource_type, is_active) VALUES
-- Patient permissions
(gen_random_uuid(), 'patient.create', 'Create Patients', 'Create new patient records', 'patient', 'create', 'patient', TRUE),
(gen_random_uuid(), 'patient.read', 'View Patients', 'View patient information', 'patient', 'read', 'patient', TRUE),
(gen_random_uuid(), 'patient.update', 'Update Patients', 'Update patient information', 'patient', 'update', 'patient', TRUE),
(gen_random_uuid(), 'patient.delete', 'Delete Patients', 'Delete patient records', 'patient', 'delete', 'patient', TRUE),
(gen_random_uuid(), 'patient.phi_access', 'Access PHI', 'Access protected health information', 'patient', 'phi_access', 'patient', TRUE),

-- IVR permissions
(gen_random_uuid(), 'ivr.create', 'Create IVR Requests', 'Create insurance verification requests', 'ivr', 'create', 'ivr', TRUE),
(gen_random_uuid(), 'ivr.read', 'View IVR Requests', 'View insurance verification requests', 'ivr', 'read', 'ivr', TRUE),
(gen_random_uuid(), 'ivr.update', 'Update IVR Requests', 'Update insurance verification requests', 'ivr', 'update', 'ivr', TRUE),
(gen_random_uuid(), 'ivr.approve', 'Approve IVR Requests', 'Approve insurance verification requests', 'ivr', 'approve', 'ivr', TRUE),
(gen_random_uuid(), 'ivr.reject', 'Reject IVR Requests', 'Reject insurance verification requests', 'ivr', 'reject', 'ivr', TRUE),

-- Order permissions
(gen_random_uuid(), 'order.create', 'Create Orders', 'Create product orders', 'order', 'create', 'order', TRUE),
(gen_random_uuid(), 'order.read', 'View Orders', 'View order information', 'order', 'read', 'order', TRUE),
(gen_random_uuid(), 'order.update', 'Update Orders', 'Update order information', 'order', 'update', 'order', TRUE),
(gen_random_uuid(), 'order.cancel', 'Cancel Orders', 'Cancel orders', 'order', 'cancel', 'order', TRUE),
(gen_random_uuid(), 'order.ship', 'Ship Orders', 'Mark orders as shipped', 'order', 'ship', 'order', TRUE),

-- User management permissions
(gen_random_uuid(), 'user.create', 'Create Users', 'Create new user accounts', 'user', 'create', 'user', TRUE),
(gen_random_uuid(), 'user.read', 'View Users', 'View user information', 'user', 'read', 'user', TRUE),
(gen_random_uuid(), 'user.update', 'Update Users', 'Update user information', 'user', 'update', 'user', TRUE),
(gen_random_uuid(), 'user.deactivate', 'Deactivate Users', 'Deactivate user accounts', 'user', 'deactivate', 'user', TRUE),
(gen_random_uuid(), 'user.assign_roles', 'Assign Roles', 'Assign roles to users', 'user', 'assign_roles', 'user', TRUE),

-- Settings permissions
(gen_random_uuid(), 'settings.read', 'View Settings', 'View system settings', 'settings', 'read', 'settings', TRUE),
(gen_random_uuid(), 'settings.update', 'Update Settings', 'Update system settings', 'settings', 'update', 'settings', TRUE),
(gen_random_uuid(), 'settings.permissions', 'Manage Permissions', 'Manage user permissions and roles', 'settings', 'permissions', 'settings', TRUE),

-- Analytics permissions
(gen_random_uuid(), 'analytics.read', 'View Analytics', 'View analytics and reports', 'analytics', 'read', 'analytics', TRUE),
(gen_random_uuid(), 'analytics.export', 'Export Analytics', 'Export analytics data', 'analytics', 'export', 'analytics', TRUE),

-- Audit permissions
(gen_random_uuid(), 'audit.read', 'View Audit Logs', 'View audit logs and compliance reports', 'audit', 'read', 'audit', TRUE),
(gen_random_uuid(), 'audit.export', 'Export Audit Logs', 'Export audit logs', 'audit', 'export', 'audit', TRUE);

-- Clear existing roles and insert new ones
DELETE FROM user_roles;
DELETE FROM roles WHERE name IN ('healthcare_provider', 'office_administrator', 'medical_staff');

-- Insert default roles with explicit UUID generation and proper organization_id
INSERT INTO roles (id, name, display_name, description, is_system_role, is_active, organization_id, permissions)
SELECT
    gen_random_uuid(),
    role_name,
    role_display_name,
    role_description,
    role_is_system,
    TRUE,
    (SELECT id FROM organizations LIMIT 1),
    '{}'::json
FROM (VALUES
    ('healthcare_provider', 'Healthcare Provider', 'Full access to all medical and administrative functions', TRUE),
    ('office_administrator', 'Office Administrator', 'Limited patient access with settings management capabilities', FALSE),
    ('medical_staff', 'Medical Staff', 'View patients and create orders, no settings access', FALSE)
) AS role_data(role_name, role_display_name, role_description, role_is_system);

-- Assign permissions to roles
DO $$
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
    INSERT INTO role_permissions (id, role_id, permission_id)
    SELECT gen_random_uuid(), healthcare_provider_id, id FROM permissions;

    -- Office Administrator gets limited permissions
    INSERT INTO role_permissions (id, role_id, permission_id)
    SELECT gen_random_uuid(), office_admin_id, id FROM permissions
    WHERE name IN (
        'patient.read', 'patient.update', 'patient.phi_access',
        'ivr.read', 'ivr.create',
        'order.read', 'order.create',
        'user.read', 'user.create', 'user.update',
        'settings.read', 'settings.update', 'settings.permissions',
        'analytics.read'
    );

    -- Medical Staff gets basic permissions
    INSERT INTO role_permissions (id, role_id, permission_id)
    SELECT gen_random_uuid(), medical_staff_id, id FROM permissions
    WHERE name IN (
        'patient.read', 'patient.phi_access',
        'ivr.read', 'ivr.create',
        'order.read', 'order.create',
        'analytics.read'
    );
END $$;

-- Assign Healthcare Provider role to existing doctor users
INSERT INTO user_roles (id, user_id, role_id, assigned_by, is_active)
SELECT
    gen_random_uuid(),
    u.id,
    r.id,
    u.id,
    TRUE
FROM users u
CROSS JOIN roles r
WHERE (u.email LIKE '%doctor%' OR u.email LIKE '%dr.%' OR u.email = 'doctor@healthcare.local')
AND r.name = 'healthcare_provider'
ON CONFLICT (user_id, role_id) DO NOTHING;

COMMENT ON COLUMN roles.display_name IS 'Human-readable display name for the role';
COMMENT ON COLUMN roles.is_system_role IS 'System roles cannot be deleted or modified';
COMMENT ON COLUMN permissions.display_name IS 'Human-readable display name for the permission';
COMMENT ON COLUMN permissions.resource IS 'The resource type this permission applies to';