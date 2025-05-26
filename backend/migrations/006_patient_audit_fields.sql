-- Add audit fields to patients table
ALTER TABLE patients
    ADD COLUMN created_by_id UUID NOT NULL REFERENCES users(id),
    ADD COLUMN updated_by_id UUID REFERENCES users(id);

-- Create indexes for better query performance
CREATE INDEX idx_patients_created_by ON patients(created_by_id);
CREATE INDEX idx_patients_updated_by ON patients(updated_by_id);

-- Add comment for documentation
COMMENT ON COLUMN patients.created_by_id IS 'ID of the user who created the patient record';
COMMENT ON COLUMN patients.updated_by_id IS 'ID of the user who last updated the patient record';

-- Rollback SQL
-- ALTER TABLE patients DROP COLUMN created_by_id;
-- ALTER TABLE patients DROP COLUMN updated_by_id; 