-- Enhanced HIPAA-Compliant Audit System Migration
-- Phase 2: Foundation Systems - Task ID: mbrgdnzkoihwtfftils

-- Drop existing basic audit_logs table if it exists
DROP TABLE IF EXISTS audit_logs CASCADE;

-- Create comprehensive audit_logs table for HIPAA compliance
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- User and Organization Context
    user_id UUID NOT NULL REFERENCES users(id),
    organization_id UUID NOT NULL REFERENCES organizations(id),

    -- Action Classification
    action_type VARCHAR(50) NOT NULL, -- 'PHI_ACCESS', 'LOGIN', 'STATUS_CHANGE', etc.
    resource_type VARCHAR(50) NOT NULL, -- 'patient', 'ivr', 'order', etc.
    resource_id UUID,
    patient_id UUID REFERENCES patients(id), -- Direct patient reference for PHI tracking

    -- Request Context for HIPAA Compliance
    ip_address INET NOT NULL,
    user_agent TEXT,
    session_id VARCHAR(100),
    request_id VARCHAR(100),

    -- Audit Details
    metadata JSONB DEFAULT '{}', -- Additional context, accessed fields, etc.
    success BOOLEAN NOT NULL DEFAULT true,
    error_message TEXT,

    -- Immutable Timestamp
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create performance indexes
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_organization_id ON audit_logs(organization_id);
CREATE INDEX idx_audit_logs_patient_id ON audit_logs(patient_id);
CREATE INDEX idx_audit_logs_action_type ON audit_logs(action_type);
CREATE INDEX idx_audit_logs_resource_type ON audit_logs(resource_type);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX idx_audit_logs_success ON audit_logs(success);

-- Composite indexes for common queries
CREATE INDEX idx_audit_logs_user_patient ON audit_logs(user_id, patient_id);
CREATE INDEX idx_audit_logs_action_resource ON audit_logs(action_type, resource_type);
CREATE INDEX idx_audit_logs_date_range ON audit_logs(created_at, organization_id);

-- Create audit_log_exports table for tracking data exports
CREATE TABLE audit_log_exports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    export_type VARCHAR(50) NOT NULL, -- 'CSV', 'PDF', 'JSON'
    date_range_start TIMESTAMP WITH TIME ZONE NOT NULL,
    date_range_end TIMESTAMP WITH TIME ZONE NOT NULL,
    filters JSONB DEFAULT '{}',
    record_count INTEGER NOT NULL,
    file_hash VARCHAR(64), -- SHA-256 hash of exported file
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_exports_user_id ON audit_log_exports(user_id);
CREATE INDEX idx_audit_exports_created_at ON audit_log_exports(created_at);

-- Create function to prevent audit log modifications (HIPAA requirement)
CREATE OR REPLACE FUNCTION prevent_audit_log_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' OR TG_OP = 'DELETE' THEN
        RAISE EXCEPTION 'Audit logs are immutable and cannot be modified or deleted';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to enforce immutability
CREATE TRIGGER prevent_audit_log_updates
    BEFORE UPDATE OR DELETE ON audit_logs
    FOR EACH ROW EXECUTE FUNCTION prevent_audit_log_changes();

CREATE TRIGGER prevent_audit_export_updates
    BEFORE UPDATE OR DELETE ON audit_log_exports
    FOR EACH ROW EXECUTE FUNCTION prevent_audit_log_changes();

-- Insert initial audit log for migration
INSERT INTO audit_logs (
    user_id,
    organization_id,
    action_type,
    resource_type,
    ip_address,
    user_agent,
    metadata
) VALUES (
    (SELECT id FROM users WHERE email = 'admin@healthcare.local' LIMIT 1),
    (SELECT id FROM organizations WHERE name = 'Healthcare IVR Platform' LIMIT 1),
    'SYSTEM_MIGRATION',
    'audit_system',
    '127.0.0.1',
    'Database Migration Script',
    '{"migration": "007_enhanced_audit_system", "description": "Enhanced HIPAA-compliant audit system implementation"}'
);

-- Add comments for documentation
COMMENT ON TABLE audit_logs IS 'HIPAA-compliant audit logging for all system actions and PHI access';
COMMENT ON COLUMN audit_logs.action_type IS 'Type of action: PHI_ACCESS, PHI_EDIT, LOGIN_SUCCESS, LOGIN_FAILED, LOGOUT, IVR_STATUS_CHANGE, ORDER_CREATED, PERMISSION_CHANGED, EXPORT_DATA';
COMMENT ON COLUMN audit_logs.resource_type IS 'Type of resource being accessed: patient, ivr, order, user, organization';
COMMENT ON COLUMN audit_logs.patient_id IS 'Direct reference to patient for PHI access tracking';
COMMENT ON COLUMN audit_logs.metadata IS 'Additional context including accessed fields, reasons, and operation details';
COMMENT ON COLUMN audit_logs.created_at IS 'Immutable timestamp - cannot be modified after creation';