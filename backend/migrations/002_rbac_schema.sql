-- RBAC Schema Migration

-- Create permissions table
CREATE TABLE IF NOT EXISTS permissions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description VARCHAR(255),
    resource VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL,
    conditions JSONB,
    requires_mfa BOOLEAN DEFAULT FALSE,
    requires_phi_access BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_permissions_name ON permissions(name);
CREATE INDEX IF NOT EXISTS idx_permissions_resource_action ON permissions(resource, action);

-- Create roles table
CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description VARCHAR(255),
    is_system_role BOOLEAN DEFAULT FALSE,
    requires_mfa BOOLEAN DEFAULT FALSE,
    requires_phi_access BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_roles_name ON roles(name);

-- Create territories table
CREATE TABLE IF NOT EXISTS territories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description VARCHAR(255),
    parent_id INTEGER REFERENCES territories(id) ON DELETE CASCADE,
    boundary JSONB,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_territories_name ON territories(name);
CREATE INDEX IF NOT EXISTS idx_territories_parent_id ON territories(parent_id);

-- Create users table if not exists (might have been created in previous migration)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    cognito_id VARCHAR(36) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    is_superuser BOOLEAN DEFAULT FALSE,
    requires_mfa BOOLEAN DEFAULT FALSE,
    phi_access_enabled BOOLEAN DEFAULT FALSE,
    last_login TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_cognito_id ON users(cognito_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Create association tables
CREATE TABLE IF NOT EXISTS role_permissions (
    role_id INTEGER REFERENCES roles(id) ON DELETE CASCADE,
    permission_id INTEGER REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS user_roles (
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    role_id INTEGER REFERENCES roles(id) ON DELETE CASCADE,
    territory_id INTEGER REFERENCES territories(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id, territory_id)
);

CREATE TABLE IF NOT EXISTS role_hierarchies (
    parent_role_id INTEGER REFERENCES roles(id) ON DELETE CASCADE,
    child_role_id INTEGER REFERENCES roles(id) ON DELETE CASCADE,
    PRIMARY KEY (parent_role_id, child_role_id),
    CHECK (parent_role_id != child_role_id)
);

-- Create trigger functions for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for all tables
CREATE TRIGGER update_permissions_updated_at
    BEFORE UPDATE ON permissions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_roles_updated_at
    BEFORE UPDATE ON roles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_territories_updated_at
    BEFORE UPDATE ON territories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create default system roles
INSERT INTO roles (name, description, is_system_role, requires_mfa, requires_phi_access)
VALUES
    ('superuser', 'Full system access', true, true, true),
    ('admin', 'System administrator', true, true, true),
    ('provider', 'Healthcare provider', true, true, true),
    ('staff', 'Medical staff', true, true, true),
    ('receptionist', 'Front desk staff', true, false, false)
ON CONFLICT (name) DO NOTHING;

-- Create default permissions
INSERT INTO permissions (name, description, resource, action, requires_mfa, requires_phi_access)
VALUES
    ('view_phi', 'View protected health information', 'phi', 'read', true, true),
    ('edit_phi', 'Edit protected health information', 'phi', 'write', true, true),
    ('manage_users', 'Manage system users', 'users', 'manage', true, false),
    ('manage_roles', 'Manage roles and permissions', 'roles', 'manage', true, false),
    ('view_reports', 'View system reports', 'reports', 'read', false, false),
    ('manage_territories', 'Manage territories', 'territories', 'manage', false, false)
ON CONFLICT (name) DO NOTHING;

-- Create audit logging function
CREATE OR REPLACE FUNCTION log_rbac_changes()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO audit_logs (
        event_type,
        table_name,
        record_id,
        old_values,
        new_values,
        user_id,
        ip_address
    ) VALUES (
        TG_OP,
        TG_TABLE_NAME,
        CASE
            WHEN TG_OP = 'DELETE' THEN OLD.id
            ELSE NEW.id
        END,
        CASE
            WHEN TG_OP = 'DELETE' THEN row_to_json(OLD)
            WHEN TG_OP = 'UPDATE' THEN row_to_json(OLD)
            ELSE NULL
        END,
        CASE
            WHEN TG_OP = 'DELETE' THEN NULL
            ELSE row_to_json(NEW)
        END,
        current_setting('app.current_user_id', true)::integer,
        current_setting('app.current_ip', true)
    );
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create audit triggers for RBAC tables
CREATE TRIGGER audit_permissions_changes
    AFTER INSERT OR UPDATE OR DELETE ON permissions
    FOR EACH ROW EXECUTE FUNCTION log_rbac_changes();

CREATE TRIGGER audit_roles_changes
    AFTER INSERT OR UPDATE OR DELETE ON roles
    FOR EACH ROW EXECUTE FUNCTION log_rbac_changes();

CREATE TRIGGER audit_territories_changes
    AFTER INSERT OR UPDATE OR DELETE ON territories
    FOR EACH ROW EXECUTE FUNCTION log_rbac_changes();

CREATE TRIGGER audit_user_roles_changes
    AFTER INSERT OR UPDATE OR DELETE ON user_roles
    FOR EACH ROW EXECUTE FUNCTION log_rbac_changes(); 