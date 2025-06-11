-- Migration 008: Role-Based Permissions System
-- Phase 2: Foundation Systems - Role-Based Permissions
-- Creates comprehensive role and permission management system

-- Create roles table
CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    display_name VARCHAR(200) NOT NULL,
    description TEXT,
    is_system_role BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

-- Create permissions table
CREATE TABLE IF NOT EXISTS permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    display_name VARCHAR(200) NOT NULL,
    description TEXT,
    resource VARCHAR(100) NOT NULL, -- patient, ivr, order, user, etc.
    action VARCHAR(100) NOT NULL,   -- create, read, update, delete, approve, etc.
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create role_permissions junction table
CREATE TABLE IF NOT EXISTS role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    granted_by UUID REFERENCES users(id),
    UNIQUE(role_id, permission_id)
);

-- Create user_roles table (many-to-many relationship)
CREATE TABLE IF NOT EXISTS user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    assigned_by UUID REFERENCES users(id),
    is_active BOOLEAN DEFAULT TRUE,
    expires_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(user_id, role_id)
);

-- Create permission_delegations table for temporary permission grants
CREATE TABLE IF NOT EXISTS permission_delegations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    delegator_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    delegatee_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    resource_id UUID, -- Specific resource ID if delegation is resource-specific
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    reason TEXT,
    created_by UUID REFERENCES users(id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_roles_organization_id ON roles(organization_id);
CREATE INDEX IF NOT EXISTS idx_roles_name ON roles(name);
CREATE INDEX IF NOT EXISTS idx_roles_is_active ON roles(is_active);

CREATE INDEX IF NOT EXISTS idx_permissions_resource ON permissions(resource);
CREATE INDEX IF NOT EXISTS idx_permissions_action ON permissions(action);
CREATE INDEX IF NOT EXISTS idx_permissions_is_active ON permissions(is_active);

CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_id ON role_permissions(permission_id);

CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON user_roles(role_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_is_active ON user_roles(is_active);

CREATE INDEX IF NOT EXISTS idx_permission_delegations_delegatee ON permission_delegations(delegatee_user_id);
CREATE INDEX IF NOT EXISTS idx_permission_delegations_expires_at ON permission_delegations(expires_at);
CREATE INDEX IF NOT EXISTS idx_permission_delegations_is_active ON permission_delegations(is_active);

-- Insert default permissions
INSERT INTO permissions (name, display_name, description, resource, action) VALUES
-- Patient permissions
('patient.create', 'Create Patients', 'Create new patient records', 'patient', 'create'),
('patient.read', 'View Patients', 'View patient information', 'patient', 'read'),
('patient.update', 'Update Patients', 'Update patient information', 'patient', 'update'),
('patient.delete', 'Delete Patients', 'Delete patient records', 'patient', 'delete'),
('patient.phi_access', 'Access PHI', 'Access protected health information', 'patient', 'phi_access'),

-- IVR permissions
('ivr.create', 'Create IVR Requests', 'Create insurance verification requests', 'ivr', 'create'),
('ivr.read', 'View IVR Requests', 'View insurance verification requests', 'ivr', 'read'),
('ivr.update', 'Update IVR Requests', 'Update insurance verification requests', 'ivr', 'update'),
('ivr.approve', 'Approve IVR Requests', 'Approve insurance verification requests', 'ivr', 'approve'),
('ivr.reject', 'Reject IVR Requests', 'Reject insurance verification requests', 'ivr', 'reject'),

-- Order permissions
('order.create', 'Create Orders', 'Create product orders', 'order', 'create'),
('order.read', 'View Orders', 'View order information', 'order', 'read'),
('order.update', 'Update Orders', 'Update order information', 'order', 'update'),
('order.cancel', 'Cancel Orders', 'Cancel orders', 'order', 'cancel'),
('order.ship', 'Ship Orders', 'Mark orders as shipped', 'order', 'ship'),

-- User management permissions
('user.create', 'Create Users', 'Create new user accounts', 'user', 'create'),
('user.read', 'View Users', 'View user information', 'user', 'read'),
('user.update', 'Update Users', 'Update user information', 'user', 'update'),
('user.deactivate', 'Deactivate Users', 'Deactivate user accounts', 'user', 'deactivate'),
('user.assign_roles', 'Assign Roles', 'Assign roles to users', 'user', 'assign_roles'),

-- Settings permissions
('settings.read', 'View Settings', 'View system settings', 'settings', 'read'),
('settings.update', 'Update Settings', 'Update system settings', 'settings', 'update'),
('settings.permissions', 'Manage Permissions', 'Manage user permissions and roles', 'settings', 'permissions'),

-- Analytics permissions
('analytics.read', 'View Analytics', 'View analytics and reports', 'analytics', 'read'),
('analytics.export', 'Export Analytics', 'Export analytics data', 'analytics', 'export'),

-- Audit permissions
('audit.read', 'View Audit Logs', 'View audit logs and compliance reports', 'audit', 'read'),
('audit.export', 'Export Audit Logs', 'Export audit logs', 'audit', 'export')
ON CONFLICT (name) DO NOTHING;

-- Insert default roles
INSERT INTO roles (name, display_name, description, is_system_role, organization_id) VALUES
('healthcare_provider', 'Healthcare Provider', 'Full access to all medical and administrative functions', TRUE, NULL),
('office_administrator', 'Office Administrator', 'Limited patient access with settings management capabilities', FALSE, NULL),
('medical_staff', 'Medical Staff', 'View patients and create orders, no settings access', FALSE, NULL)
ON CONFLICT (name) DO NOTHING;

-- Get role IDs for permission assignments
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
    SELECT healthcare_provider_id, id FROM permissions
    ON CONFLICT (role_id, permission_id) DO NOTHING;

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
    )
    ON CONFLICT (role_id, permission_id) DO NOTHING;

    -- Medical Staff gets basic permissions
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT medical_staff_id, id FROM permissions
    WHERE name IN (
        'patient.read', 'patient.phi_access',
        'ivr.read', 'ivr.create',
        'order.read', 'order.create',
        'analytics.read'
    )
    ON CONFLICT (role_id, permission_id) DO NOTHING;
END $$;

-- Assign Healthcare Provider role to existing users with role 'doctor'
INSERT INTO user_roles (user_id, role_id, assigned_by)
SELECT u.id, r.id, u.id
FROM users u, roles r
WHERE u.role_id = (SELECT id FROM user_roles_enum WHERE name = 'doctor')
AND r.name = 'healthcare_provider'
ON CONFLICT (user_id, role_id) DO NOTHING;

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_roles_updated_at BEFORE UPDATE ON roles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE roles IS 'User roles for role-based access control';
COMMENT ON TABLE permissions IS 'System permissions that can be assigned to roles';
COMMENT ON TABLE role_permissions IS 'Junction table linking roles to permissions';
COMMENT ON TABLE user_roles IS 'Junction table linking users to roles';
COMMENT ON TABLE permission_delegations IS 'Temporary permission delegations between users';

COMMENT ON COLUMN roles.is_system_role IS 'System roles cannot be deleted or modified';
COMMENT ON COLUMN permissions.resource IS 'The resource type this permission applies to';
COMMENT ON COLUMN permissions.action IS 'The action this permission allows on the resource';
COMMENT ON COLUMN permission_delegations.resource_id IS 'Specific resource ID if delegation is resource-specific';