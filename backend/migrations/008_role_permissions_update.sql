-- Migration 008 Update: Role-Based Permissions System
-- Phase 2: Foundation Systems - Role-Based Permissions
-- Updates existing schema and adds role-based permissions data

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

-- Insert comprehensive permissions
INSERT INTO permissions (name, display_name, description, resource, action, resource_type) VALUES
-- Patient permissions
('patient.create', 'Create Patients', 'Create new patient records', 'patient', 'create', 'patient'),
('patient.read', 'View Patients', 'View patient information', 'patient', 'read', 'patient'),
('patient.update', 'Update Patients', 'Update patient information', 'patient', 'update', 'patient'),
('patient.delete', 'Delete Patients', 'Delete patient records', 'patient', 'delete', 'patient'),
('patient.phi_access', 'Access PHI', 'Access protected health information', 'patient', 'phi_access', 'patient'),

-- IVR permissions
('ivr.create', 'Create IVR Requests', 'Create insurance verification requests', 'ivr', 'create', 'ivr'),
('ivr.read', 'View IVR Requests', 'View insurance verification requests', 'ivr', 'read', 'ivr'),
('ivr.update', 'Update IVR Requests', 'Update insurance verification requests', 'ivr', 'update', 'ivr'),
('ivr.approve', 'Approve IVR Requests', 'Approve insurance verification requests', 'ivr', 'approve', 'ivr'),
('ivr.reject', 'Reject IVR Requests', 'Reject insurance verification requests', 'ivr', 'reject', 'ivr'),

-- Order permissions
('order.create', 'Create Orders', 'Create product orders', 'order', 'create', 'order'),
('order.read', 'View Orders', 'View order information', 'order', 'read', 'order'),
('order.update', 'Update Orders', 'Update order information', 'order', 'update', 'order'),
('order.cancel', 'Cancel Orders', 'Cancel orders', 'order', 'cancel', 'order'),
('order.ship', 'Ship Orders', 'Mark orders as shipped', 'order', 'ship', 'order'),

-- User management permissions
('user.create', 'Create Users', 'Create new user accounts', 'user', 'create', 'user'),
('user.read', 'View Users', 'View user information', 'user', 'read', 'user'),
('user.update', 'Update Users', 'Update user information', 'user', 'update', 'user'),
('user.deactivate', 'Deactivate Users', 'Deactivate user accounts', 'user', 'deactivate', 'user'),
('user.assign_roles', 'Assign Roles', 'Assign roles to users', 'user', 'assign_roles', 'user'),

-- Settings permissions
('settings.read', 'View Settings', 'View system settings', 'settings', 'read', 'settings'),
('settings.update', 'Update Settings', 'Update system settings', 'settings', 'update', 'settings'),
('settings.permissions', 'Manage Permissions', 'Manage user permissions and roles', 'settings', 'permissions', 'settings'),

-- Analytics permissions
('analytics.read', 'View Analytics', 'View analytics and reports', 'analytics', 'read', 'analytics'),
('analytics.export', 'Export Analytics', 'Export analytics data', 'analytics', 'export', 'analytics'),

-- Audit permissions
('audit.read', 'View Audit Logs', 'View audit logs and compliance reports', 'audit', 'read', 'audit'),
('audit.export', 'Export Audit Logs', 'Export audit logs', 'audit', 'export', 'audit');

-- Clear existing roles and insert new ones
DELETE FROM user_roles;
DELETE FROM roles WHERE name IN ('healthcare_provider', 'office_administrator', 'medical_staff');

-- Insert default roles with proper organization_id (using first organization)
INSERT INTO roles (name, display_name, description, is_system_role, is_active, organization_id)
SELECT
    role_name,
    role_display_name,
    role_description,
    role_is_system,
    TRUE,
    (SELECT id FROM organizations LIMIT 1)
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
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT healthcare_provider_id, id FROM permissions;

    -- Office Administrator gets limited permissions
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT office_admin_id, id FROM permissions
    WHERE name IN (
        'patient.read', 'patient.update', 'patient.phi_access',
        'ivr.read', 'ivr.create',
        'order.read', 'order.create',
        'user.read', 'user.create', 'user.update',
        'settings.read', 'settings.update', 'settings.permissions',
        'analytics.read'
    );

    -- Medical Staff gets basic permissions
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT medical_staff_id, id FROM permissions
    WHERE name IN (
        'patient.read', 'patient.phi_access',
        'ivr.read', 'ivr.create',
        'order.read', 'order.create',
        'analytics.read'
    );
END $$;

-- Assign Healthcare Provider role to existing doctor users
INSERT INTO user_roles (user_id, role_id, assigned_by, is_active)
SELECT
    u.id,
    r.id,
    u.id,
    TRUE
FROM users u
CROSS JOIN roles r
WHERE u.email LIKE '%doctor%' OR u.email LIKE '%dr.%'
AND r.name = 'healthcare_provider'
ON CONFLICT (user_id, role_id) DO NOTHING;

-- Update display names for existing roles if they're NULL
UPDATE roles SET display_name =
    CASE
        WHEN name = 'healthcare_provider' THEN 'Healthcare Provider'
        WHEN name = 'office_administrator' THEN 'Office Administrator'
        WHEN name = 'medical_staff' THEN 'Medical Staff'
        ELSE INITCAP(REPLACE(name, '_', ' '))
    END
WHERE display_name IS NULL;

-- Update display names for permissions if they're NULL
UPDATE permissions SET display_name =
    CASE
        WHEN name LIKE '%.create' THEN 'Create ' || INITCAP(SPLIT_PART(name, '.', 1))
        WHEN name LIKE '%.read' THEN 'View ' || INITCAP(SPLIT_PART(name, '.', 1))
        WHEN name LIKE '%.update' THEN 'Update ' || INITCAP(SPLIT_PART(name, '.', 1))
        WHEN name LIKE '%.delete' THEN 'Delete ' || INITCAP(SPLIT_PART(name, '.', 1))
        ELSE INITCAP(REPLACE(name, '_', ' '))
    END
WHERE display_name IS NULL;

-- Set all permissions as active
UPDATE permissions SET is_active = TRUE WHERE is_active IS NULL;

-- Set all roles as active
UPDATE roles SET is_active = TRUE WHERE is_active IS NULL;

COMMENT ON COLUMN roles.display_name IS 'Human-readable display name for the role';
COMMENT ON COLUMN roles.is_system_role IS 'System roles cannot be deleted or modified';
COMMENT ON COLUMN permissions.display_name IS 'Human-readable display name for the permission';
COMMENT ON COLUMN permissions.resource IS 'The resource type this permission applies to';