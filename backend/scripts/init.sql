-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create organizations table
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description VARCHAR(500),
    settings JSONB NOT NULL DEFAULT '{}',
    security_policy JSONB NOT NULL DEFAULT '{}',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE
);

-- Create roles table
CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL,
    description VARCHAR(255),
    organization_id UUID REFERENCES organizations(id),
    parent_role_id UUID REFERENCES roles(id),
    permissions JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE
);

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE,
    email VARCHAR(255) UNIQUE NOT NULL,
    encrypted_password VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    is_superuser BOOLEAN DEFAULT FALSE,
    role_id UUID NOT NULL REFERENCES roles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE,
    mfa_enabled BOOLEAN DEFAULT FALSE,
    mfa_secret VARCHAR(32),
    force_password_change BOOLEAN DEFAULT FALSE,
    password_changed_at TIMESTAMP WITH TIME ZONE,
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP WITH TIME ZONE,
    organization_id UUID NOT NULL REFERENCES organizations(id)
);

-- Insert demo organization
INSERT INTO organizations (id, name, description)
VALUES (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'Demo Healthcare Organization',
    'Demo organization for testing'
);

-- Insert demo roles
INSERT INTO roles (id, name, description, organization_id)
VALUES 
    ('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'admin', 'Administrator', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'),
    ('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'provider', 'Healthcare Provider', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'),
    ('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'staff', 'Staff Member', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11');

-- Insert demo users
INSERT INTO users (
    email,
    encrypted_password,
    role_id,
    first_name,
    last_name,
    organization_id,
    is_active,
    is_superuser
)
VALUES 
(
    'admin@example.com',
    '$2b$12$9xK0.8ZeqHDWxX4cQ5QxPOYgK0e/x9X7K8F0X9X7K8F0X9X7K8F0.',  -- admin123
    'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'Admin',
    'User',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    true,
    true
),
(
    'provider@example.com',
    '$2b$12$9xK0.8ZeqHDWxX4cQ5QxPOYgK0e/x9X7K8F0X9X7K8F0X9X7K8F0.',  -- admin123
    'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'Provider',
    'User',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    true,
    false
),
(
    'staff@example.com',
    '$2b$12$9xK0.8ZeqHDWxX4cQ5QxPOYgK0e/x9X7K8F0X9X7K8F0X9X7K8F0.',  -- admin123
    'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'Staff',
    'User',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    true,
    false
);
