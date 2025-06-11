-- Migration 010: User Hierarchy System
-- Adds hierarchical user structure for sales/distribution chain and doctor profiles

-- =====================================================
-- PART 1: Add hierarchy fields to users table
-- =====================================================

-- Add hierarchy relationship fields
ALTER TABLE users ADD COLUMN parent_sales_id UUID REFERENCES users(id);
ALTER TABLE users ADD COLUMN parent_distributor_id UUID REFERENCES users(id);
ALTER TABLE users ADD COLUMN parent_master_distributor_id UUID REFERENCES users(id);
ALTER TABLE users ADD COLUMN added_by_id UUID REFERENCES users(id);
ALTER TABLE users ADD COLUMN added_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- Create indexes for hierarchy queries
CREATE INDEX IF NOT EXISTS idx_users_parent_sales_id ON users(parent_sales_id);
CREATE INDEX IF NOT EXISTS idx_users_parent_distributor_id ON users(parent_distributor_id);
CREATE INDEX IF NOT EXISTS idx_users_parent_master_distributor_id ON users(parent_master_distributor_id);
CREATE INDEX IF NOT EXISTS idx_users_added_by_id ON users(added_by_id);

-- Add comments for documentation
COMMENT ON COLUMN users.parent_sales_id IS 'ID of the sales representative who added this doctor';
COMMENT ON COLUMN users.parent_distributor_id IS 'ID of the distributor who manages this user';
COMMENT ON COLUMN users.parent_master_distributor_id IS 'ID of the master distributor who manages this user';
COMMENT ON COLUMN users.added_by_id IS 'ID of the user who added this user to the system';
COMMENT ON COLUMN users.added_at IS 'Timestamp when this user was added to the system';

-- =====================================================
-- PART 2: Update role field to support all hierarchy roles
-- =====================================================

-- First, let's check if we need to update the role constraint
-- The role field should support all these values:
-- system_admin, chp_admin, master_distributor, distributor, sales
-- doctor, office_admin, medical_staff, ivr_company, shipping_logistics

-- Note: We'll handle role updates in the backend models since the role field
-- is already a foreign key to the roles table

-- =====================================================
-- PART 3: Create doctor_profiles table
-- =====================================================

CREATE TABLE doctor_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Personal Information
    professional_title VARCHAR(100), -- Dr., MD, DO, etc.
    specialty VARCHAR(200), -- Wound Care, Podiatry, etc.

    -- Professional Credentials
    medical_license_number VARCHAR(50),
    medical_license_state VARCHAR(2),
    npi_number VARCHAR(10), -- National Provider Identifier
    medicare_ptan VARCHAR(20), -- Medicare Provider Transaction Access Number
    medicaid_provider_number VARCHAR(50),
    tax_id VARCHAR(20), -- Federal Tax ID or EIN
    dea_number VARCHAR(20), -- Drug Enforcement Administration number

    -- Facility Information
    primary_facility_name VARCHAR(200),
    facility_address_line1 VARCHAR(200),
    facility_address_line2 VARCHAR(200),
    facility_city VARCHAR(100),
    facility_state VARCHAR(2),
    facility_zip_code VARCHAR(10),
    facility_phone VARCHAR(20),
    facility_fax VARCHAR(20),
    office_contact_name VARCHAR(100),
    office_contact_phone VARCHAR(20),
    office_contact_email VARCHAR(255),

    -- Shipping Information
    shipping_address_line1 VARCHAR(200),
    shipping_address_line2 VARCHAR(200),
    shipping_city VARCHAR(100),
    shipping_state VARCHAR(2),
    shipping_zip_code VARCHAR(10),
    shipping_contact_name VARCHAR(100),
    shipping_contact_phone VARCHAR(20),
    delivery_instructions TEXT,
    preferred_delivery_time VARCHAR(100), -- Morning, Afternoon, etc.

    -- Professional Information
    professional_bio TEXT,
    years_in_practice INTEGER,
    board_certifications TEXT[], -- Array of certifications
    hospital_affiliations TEXT[], -- Array of hospital names

    -- Practice Details
    practice_type VARCHAR(50), -- Solo, Group, Hospital-based, etc.
    patient_volume_per_month INTEGER,
    wound_care_percentage INTEGER, -- What % of practice is wound care

    -- Insurance and Billing
    accepts_medicare BOOLEAN DEFAULT true,
    accepts_medicaid BOOLEAN DEFAULT true,
    preferred_insurance_carriers TEXT[], -- Array of insurance names
    billing_contact_name VARCHAR(100),
    billing_contact_phone VARCHAR(20),
    billing_contact_email VARCHAR(255),

    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by_id UUID REFERENCES users(id),
    updated_by_id UUID REFERENCES users(id),

    -- Constraints
    UNIQUE(user_id), -- One profile per user
    CONSTRAINT check_npi_format CHECK (npi_number ~ '^[0-9]{10}$' OR npi_number IS NULL),
    CONSTRAINT check_state_format CHECK (
        (medical_license_state ~ '^[A-Z]{2}$' OR medical_license_state IS NULL) AND
        (facility_state ~ '^[A-Z]{2}$' OR facility_state IS NULL) AND
        (shipping_state ~ '^[A-Z]{2}$' OR shipping_state IS NULL)
    ),
    CONSTRAINT check_wound_care_percentage CHECK (
        wound_care_percentage IS NULL OR
        (wound_care_percentage >= 0 AND wound_care_percentage <= 100)
    )
);

-- Create indexes for doctor_profiles
CREATE INDEX IF NOT EXISTS idx_doctor_profiles_user_id ON doctor_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_doctor_profiles_npi_number ON doctor_profiles(npi_number);
CREATE INDEX IF NOT EXISTS idx_doctor_profiles_medical_license ON doctor_profiles(medical_license_number);
CREATE INDEX IF NOT EXISTS idx_doctor_profiles_specialty ON doctor_profiles(specialty);
CREATE INDEX IF NOT EXISTS idx_doctor_profiles_facility_state ON doctor_profiles(facility_state);
CREATE INDEX IF NOT EXISTS idx_doctor_profiles_shipping_state ON doctor_profiles(shipping_state);

-- Add comments for doctor_profiles table
COMMENT ON TABLE doctor_profiles IS 'Comprehensive doctor profile information including credentials, facility, and shipping details';
COMMENT ON COLUMN doctor_profiles.npi_number IS 'National Provider Identifier - must be exactly 10 digits';
COMMENT ON COLUMN doctor_profiles.medicare_ptan IS 'Medicare Provider Transaction Access Number';
COMMENT ON COLUMN doctor_profiles.wound_care_percentage IS 'Percentage of practice dedicated to wound care (0-100)';

-- =====================================================
-- PART 4: Insert default hierarchy roles
-- =====================================================

-- Insert the new hierarchy roles into the roles table
-- Note: We'll use a more flexible approach that checks if roles exist first

DO $$
BEGIN
    -- System Administrator
    IF NOT EXISTS (SELECT 1 FROM roles WHERE name = 'system_admin') THEN
        INSERT INTO roles (id, name, display_name, description, is_system_role, is_active)
        VALUES (
            gen_random_uuid(),
            'system_admin',
            'System Administrator',
            'Full system access - can manage all users and organizations',
            true,
            true
        );
    END IF;

    -- CHP Administrator
    IF NOT EXISTS (SELECT 1 FROM roles WHERE name = 'chp_admin') THEN
        INSERT INTO roles (id, name, display_name, description, is_system_role, is_active)
        VALUES (
            gen_random_uuid(),
            'chp_admin',
            'CHP Administrator',
            'Community Health Program administrator - executive level access',
            true,
            true
        );
    END IF;

    -- Master Distributor
    IF NOT EXISTS (SELECT 1 FROM roles WHERE name = 'master_distributor') THEN
        INSERT INTO roles (id, name, display_name, description, is_system_role, is_active)
        VALUES (
            gen_random_uuid(),
            'master_distributor',
            'Master Distributor',
            'Regional management and distribution oversight',
            true,
            true
        );
    END IF;

    -- Distributor
    IF NOT EXISTS (SELECT 1 FROM roles WHERE name = 'distributor') THEN
        INSERT INTO roles (id, name, display_name, description, is_system_role, is_active)
        VALUES (
            gen_random_uuid(),
            'distributor',
            'Distributor',
            'Local distribution operations and sales management',
            true,
            true
        );
    END IF;

    -- Sales Representative
    IF NOT EXISTS (SELECT 1 FROM roles WHERE name = 'sales') THEN
        INSERT INTO roles (id, name, display_name, description, is_system_role, is_active)
        VALUES (
            gen_random_uuid(),
            'sales',
            'Sales Representative',
            'Sales operations and customer management',
            true,
            true
        );
    END IF;

    -- Doctor (Healthcare Provider) - may already exist
    IF NOT EXISTS (SELECT 1 FROM roles WHERE name = 'doctor') THEN
        INSERT INTO roles (id, name, display_name, description, is_system_role, is_active)
        VALUES (
            gen_random_uuid(),
            'doctor',
            'Healthcare Provider',
            'Licensed healthcare provider - practice owner',
            true,
            true
        );
    END IF;

    -- Office Administrator - may already exist
    IF NOT EXISTS (SELECT 1 FROM roles WHERE name = 'office_admin') THEN
        INSERT INTO roles (id, name, display_name, description, is_system_role, is_active)
        VALUES (
            gen_random_uuid(),
            'office_admin',
            'Office Administrator',
            'Doctor office staff - administrative functions',
            true,
            true
        );
    END IF;

    -- Medical Staff - may already exist
    IF NOT EXISTS (SELECT 1 FROM roles WHERE name = 'medical_staff') THEN
        INSERT INTO roles (id, name, display_name, description, is_system_role, is_active)
        VALUES (
            gen_random_uuid(),
            'medical_staff',
            'Medical Staff',
            'Doctor office staff - clinical support',
            true,
            true
        );
    END IF;

    -- IVR Company - may already exist
    IF NOT EXISTS (SELECT 1 FROM roles WHERE name = 'ivr_company') THEN
        INSERT INTO roles (id, name, display_name, description, is_system_role, is_active)
        VALUES (
            gen_random_uuid(),
            'ivr_company',
            'IVR Company Specialist',
            'Insurance verification services - sees all IVRs',
            true,
            true
        );
    END IF;

    -- Shipping & Logistics
    IF NOT EXISTS (SELECT 1 FROM roles WHERE name = 'shipping_logistics') THEN
        INSERT INTO roles (id, name, display_name, description, is_system_role, is_active)
        VALUES (
            gen_random_uuid(),
            'shipping_logistics',
            'Shipping & Logistics Coordinator',
            'Operations support - sees all orders',
            true,
            true
        );
    END IF;
END $$;

-- =====================================================
-- PART 5: Create trigger for updated_at on doctor_profiles
-- =====================================================

CREATE OR REPLACE FUNCTION update_doctor_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_doctor_profiles_updated_at
    BEFORE UPDATE ON doctor_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_doctor_profiles_updated_at();

-- =====================================================
-- PART 6: Add hierarchy validation constraints
-- =====================================================

-- Ensure hierarchy relationships are logical
-- (These will be enforced in the application layer as well)

-- A user cannot be their own parent in any hierarchy
ALTER TABLE users ADD CONSTRAINT check_no_self_parent_sales
    CHECK (id != parent_sales_id);

ALTER TABLE users ADD CONSTRAINT check_no_self_parent_distributor
    CHECK (id != parent_distributor_id);

ALTER TABLE users ADD CONSTRAINT check_no_self_parent_master_distributor
    CHECK (id != parent_master_distributor_id);

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

-- Log the migration completion
INSERT INTO audit_logs (
    id,
    action_type,
    resource_type,
    resource_id,
    details,
    user_id,
    organization_id,
    created_at
) VALUES (
    gen_random_uuid(),
    'SCHEMA_MIGRATION',
    'DATABASE',
    gen_random_uuid(),
    '{"migration": "010_user_hierarchy", "description": "Added user hierarchy system with sales/distribution chain and comprehensive doctor profiles"}',
    NULL, -- System migration
    NULL, -- System-wide
    CURRENT_TIMESTAMP
);