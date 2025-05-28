-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create demo organization
INSERT INTO organizations (id, name, description)
VALUES (
    uuid_generate_v4(),
    'Demo Healthcare Organization',
    'Demo organization for testing'
);

-- Create demo roles
INSERT INTO roles (id, name, description, organization_id)
VALUES 
    ('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Admin', 'Administrator', uuid_generate_v4()),
    ('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Doctor', 'Healthcare Provider', uuid_generate_v4()),
    ('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'IVRCompany', 'IVR Company', uuid_generate_v4()),
    ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Logistics', 'Logistics Manager', uuid_generate_v4()),
    ('f1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'SalesRep', 'Sales Representative', uuid_generate_v4())
ON CONFLICT (id) DO NOTHING;

-- Create demo users
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
    'doctor@test.com',
    crypt('demo123', gen_salt('bf')),
    'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'John',
    'Smith',
    uuid_generate_v4(),
    true,
    false
),
(
    'admin@test.com',
    crypt('demo123', gen_salt('bf')),
    'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'Admin',
    'User',
    uuid_generate_v4(),
    true,
    true
),
(
    'ivr@test.com',
    crypt('demo123', gen_salt('bf')),
    'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'IVR',
    'Representative',
    uuid_generate_v4(),
    true,
    false
),
(
    'logistics@test.com',
    crypt('demo123', gen_salt('bf')),
    'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'Logistics',
    'Manager',
    uuid_generate_v4(),
    true,
    false
),
(
    'sales@test.com',
    crypt('demo123', gen_salt('bf')),
    'f1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'Sales',
    'Representative',
    uuid_generate_v4(),
    true,
    false
)
ON CONFLICT (email) DO NOTHING; 