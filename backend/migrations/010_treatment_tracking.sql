-- Migration: 010_treatment_tracking.sql
-- Description: Create treatment_records table for tracking product usage on patients
-- Date: 2025-01-27

-- Create treatment_records table
CREATE TABLE treatment_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL,
    order_id UUID NOT NULL,
    product_id VARCHAR(100) NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    quantity_used INTEGER NOT NULL CHECK (quantity_used > 0),
    date_applied DATE NOT NULL,
    diagnosis TEXT,
    procedure_performed TEXT,
    wound_location VARCHAR(255),
    doctor_notes TEXT,
    recorded_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Foreign key constraints
    CONSTRAINT fk_treatment_patient
        FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
    CONSTRAINT fk_treatment_order
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    CONSTRAINT fk_treatment_recorded_by
        FOREIGN KEY (recorded_by) REFERENCES users(id) ON DELETE RESTRICT
);

-- Create indexes for performance
CREATE INDEX idx_treatment_records_patient_id ON treatment_records(patient_id);
CREATE INDEX idx_treatment_records_order_id ON treatment_records(order_id);
CREATE INDEX idx_treatment_records_date_applied ON treatment_records(date_applied);
CREATE INDEX idx_treatment_records_recorded_by ON treatment_records(recorded_by);
CREATE INDEX idx_treatment_records_product_id ON treatment_records(product_id);

-- Create composite index for common queries
CREATE INDEX idx_treatment_records_patient_date ON treatment_records(patient_id, date_applied DESC);

-- Create trigger function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_treatment_records_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER trigger_update_treatment_records_updated_at
    BEFORE UPDATE ON treatment_records
    FOR EACH ROW
    EXECUTE FUNCTION update_treatment_records_updated_at();

-- Add comments for documentation
COMMENT ON TABLE treatment_records IS 'Records of when products from orders are used on patients for treatment';
COMMENT ON COLUMN treatment_records.id IS 'Unique identifier for the treatment record';
COMMENT ON COLUMN treatment_records.patient_id IS 'Reference to the patient who received treatment';
COMMENT ON COLUMN treatment_records.order_id IS 'Reference to the order that provided the products';
COMMENT ON COLUMN treatment_records.product_id IS 'Product code/SKU of the item used';
COMMENT ON COLUMN treatment_records.product_name IS 'Human readable name of the product';
COMMENT ON COLUMN treatment_records.quantity_used IS 'Number of units of the product used';
COMMENT ON COLUMN treatment_records.date_applied IS 'Date when the treatment was performed';
COMMENT ON COLUMN treatment_records.diagnosis IS 'Medical condition being treated';
COMMENT ON COLUMN treatment_records.procedure_performed IS 'Description of the medical procedure';
COMMENT ON COLUMN treatment_records.wound_location IS 'Anatomical location of the wound/treatment area';
COMMENT ON COLUMN treatment_records.doctor_notes IS 'Clinical notes from the treating physician';
COMMENT ON COLUMN treatment_records.recorded_by IS 'User who recorded this treatment record';

-- Insert sample data for testing
INSERT INTO treatment_records (
    patient_id,
    order_id,
    product_id,
    product_name,
    quantity_used,
    date_applied,
    diagnosis,
    procedure_performed,
    wound_location,
    doctor_notes,
    recorded_by
) VALUES
(
    (SELECT id FROM patients LIMIT 1),
    (SELECT id FROM orders LIMIT 1),
    'WC-DRESS-001',
    'Hydrocolloid Wound Dressing 4x4',
    2,
    CURRENT_DATE - INTERVAL '1 day',
    'Chronic venous leg ulcer',
    'Wound cleaning and dressing application',
    'Left lower leg, medial aspect',
    'Wound showing signs of healing. Minimal exudate. Patient tolerated procedure well.',
    (SELECT id FROM users WHERE role = 'doctor' LIMIT 1)
),
(
    (SELECT id FROM patients LIMIT 1),
    (SELECT id FROM orders LIMIT 1),
    'WC-FOAM-002',
    'Foam Wound Dressing 6x6',
    1,
    CURRENT_DATE - INTERVAL '3 days',
    'Diabetic foot ulcer',
    'Debridement and foam dressing application',
    'Right foot, plantar surface',
    'Wound bed clean after debridement. Applied foam dressing for moisture management.',
    (SELECT id FROM users WHERE role = 'doctor' LIMIT 1)
);

-- Verify the table was created successfully
SELECT
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'treatment_records'
ORDER BY ordinal_position;