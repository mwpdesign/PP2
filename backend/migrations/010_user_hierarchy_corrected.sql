-- Migration 010: User Hierarchy System (Corrected)
-- Adds hierarchical user structure for sales/distribution chain and doctor profiles

-- =====================================================
-- PART 1: Add hierarchy fields to users table
-- =====================================================

-- Add hierarchy relationship fields
ALTER TABLE users ADD COLUMN IF NOT EXISTS parent_sales_id UUID REFERENCES users(id);
ALTER TABLE users ADD COLUMN IF NOT EXISTS parent_distributor_id UUID REFERENCES users(id);
ALTER TABLE users ADD COLUMN IF NOT EXISTS parent_master_distributor_id UUID REFERENCES users(id);
ALTER TABLE users ADD COLUMN IF NOT EXISTS added_by_id UUID REFERENCES users(id);
ALTER TABLE users ADD COLUMN IF NOT EXISTS added_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

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
-- PART 2: Create doctor_profiles table
-- =====================================================

CREATE TABLE IF NOT EXISTS doctor_profiles (
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
-- PART 3: Insert default hierarchy roles
-- =====================================================

-- Get the primary organization ID for system roles
DO $$
DECLARE
    primary_org_id UUID;
BEGIN
    -- Get the primary organization ID
    SELECT id INTO primary_org_id FROM organizations WHERE name = 'Healthcare IVR Primary Org' LIMIT 1;

    -- If no primary org found, use the first available organization
    IF primary_org_id IS NULL THEN
        SELECT id INTO primary_org_id FROM organizations LIMIT 1;
    END IF;

    -- System Administrator
    IF NOT EXISTS (SELECT 1 FROM roles WHERE name = 'system_admin') THEN
        INSERT INTO roles (id, name, display_name, description, is_system_role, is_active, organization_id, permissions)
        VALUES (
            gen_random_uuid(),
            'system_admin',
            'System Administrator',
            'Full system access - can manage all users and organizations',
            true,
            true,
            primary_org_id,
            '{}'::json
        );
    END IF;

    -- CHP Administrator
    IF NOT EXISTS (SELECT 1 FROM roles WHERE name = 'chp_admin') THEN
        INSERT INTO roles (id, name, display_name, description, is_system_role, is_active, organization_id, permissions)
        VALUES (
            gen_random_uuid(),
            'chp_admin',
            'CHP Administrator',
            'Community Health Program administrator - executive level access',
            true,
            true,
            primary_org_id,
            '{}'::json
        );
    END IF;

    -- Master Distributor
    IF NOT EXISTS (SELECT 1 FROM roles WHERE name = 'master_distributor') THEN
        INSERT INTO roles (id, name, display_name, description, is_system_role, is_active, organization_id, permissions)
        VALUES (
            gen_random_uuid(),
            'master_distributor',
            'Master Distributor',
            'Regional management and distribution oversight',
            true,
            true,
            primary_org_id,
            '{}'::json
        );
    END IF;

    -- Distributor
    IF NOT EXISTS (SELECT 1 FROM roles WHERE name = 'distributor') THEN
        INSERT INTO roles (id, name, display_name, description, is_system_role, is_active, organization_id, permissions)
        VALUES (
            gen_random_uuid(),
            'distributor',
            'Distributor',
            'Local distribution operations and sales management',
            true,
            true,
            primary_org_id,
            '{}'::json
        );
    END IF;

    -- Sales Representative
    IF NOT EXISTS (SELECT 1 FROM roles WHERE name = 'sales') THEN
        INSERT INTO roles (id, name, display_name, description, is_system_role, is_active, organization_id, permissions)
        VALUES (
            gen_random_uuid(),
            'sales',
            'Sales Representative',
            'Sales operations and customer management',
            true,
            true,
            primary_org_id,
            '{}'::json
        );
    END IF;

    -- Doctor (Healthcare Provider) - may already exist
    IF NOT EXISTS (SELECT 1 FROM roles WHERE name = 'doctor') THEN
        INSERT INTO roles (id, name, display_name, description, is_system_role, is_active, organization_id, permissions)
        VALUES (
            gen_random_uuid(),
            'doctor',
            'Healthcare Provider',
            'Licensed healthcare provider - practice owner',
            true,
            true,
            primary_org_id,
            '{}'::json
        );
    END IF;

    -- Office Administrator - may already exist
    IF NOT EXISTS (SELECT 1 FROM roles WHERE name = 'office_admin') THEN
        INSERT INTO roles (id, name, display_name, description, is_system_role, is_active, organization_id, permissions)
        VALUES (
            gen_random_uuid(),
            'office_admin',
            'Office Administrator',
            'Doctor office staff - administrative functions',
            true,
            true,
            primary_org_id,
            '{}'::json
        );
    END IF;

    -- Medical Staff - may already exist
    IF NOT EXISTS (SELECT 1 FROM roles WHERE name = 'medical_staff') THEN
        INSERT INTO roles (id, name, display_name, description, is_system_role, is_active, organization_id, permissions)
        VALUES (
            gen_random_uuid(),
            'medical_staff',
            'Medical Staff',
            'Doctor office staff - clinical support',
            true,
            true,
            primary_org_id,
            '{}'::json
        );
    END IF;

    -- IVR Company - may already exist
    IF NOT EXISTS (SELECT 1 FROM roles WHERE name = 'ivr_company') THEN
        INSERT INTO roles (id, name, display_name, description, is_system_role, is_active, organization_id, permissions)
        VALUES (
            gen_random_uuid(),
            'ivr_company',
            'IVR Company Specialist',
            'Insurance verification services - sees all IVRs',
            true,
            true,
            primary_org_id,
            '{}'::json
        );
    END IF;

    -- Shipping & Logistics
    IF NOT EXISTS (SELECT 1 FROM roles WHERE name = 'shipping_logistics') THEN
        INSERT INTO roles (id, name, display_name, description, is_system_role, is_active, organization_id, permissions)
        VALUES (
            gen_random_uuid(),
            'shipping_logistics',
            'Shipping & Logistics Coordinator',
            'Operations support - sees all orders',
            true,
            true,
            primary_org_id,
            '{}'::json
        );
    END IF;
END $$;

-- =====================================================
-- PART 4: Create trigger for updated_at on doctor_profiles
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
-- PART 5: Add hierarchy validation constraints
-- =====================================================

-- Ensure hierarchy relationships are logical
-- (These will be enforced in the application layer as well)

-- A user cannot be their own parent in any hierarchy
DO $$
BEGIN
    -- Check if constraints already exist before adding them
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'check_no_self_parent_sales'
        AND table_name = 'users'
    ) THEN
        ALTER TABLE users ADD CONSTRAINT check_no_self_parent_sales
            CHECK (id != parent_sales_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'check_no_self_parent_distributor'
        AND table_name = 'users'
    ) THEN
        ALTER TABLE users ADD CONSTRAINT check_no_self_parent_distributor
            CHECK (id != parent_distributor_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'check_no_self_parent_master_distributor'
        AND table_name = 'users'
    ) THEN
        ALTER TABLE users ADD CONSTRAINT check_no_self_parent_master_distributor
            CHECK (id != parent_master_distributor_id);
    END IF;
END $$;

-- =====================================================
-- PART 6: Log migration completion
-- =====================================================

-- Log the migration completion using the correct audit_logs structure
DO $$
DECLARE
    primary_org_id UUID;
BEGIN
    -- Get the primary organization ID
    SELECT id INTO primary_org_id FROM organizations WHERE name = 'Healthcare IVR Primary Org' LIMIT 1;

    -- If no primary org found, use the first available organization
    IF primary_org_id IS NULL THEN
        SELECT id INTO primary_org_id FROM organizations LIMIT 1;
    END IF;

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
        (SELECT id FROM users WHERE email = 'system@healthcare.local' LIMIT 1), -- System user if exists
        primary_org_id,
        'SCHEMA_MIGRATION',
        'DATABASE',
        gen_random_uuid(),
        '127.0.0.1'::inet,
        '{"migration": "010_user_hierarchy", "description": "Added user hierarchy system with sales/distribution chain and comprehensive doctor profiles"}'::jsonb,
        true,
        CURRENT_TIMESTAMP
    );
END $$;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

-- Display completion message
SELECT 'Migration 010_user_hierarchy completed successfully!' as status;