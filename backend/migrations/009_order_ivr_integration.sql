-- Migration: 009_order_ivr_integration.sql
-- Description: Integrate orders table with IVR requests for Healthcare IVR Platform
-- Date: 2025-01-27

-- Add IVR integration fields to existing orders table
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS ivr_request_id UUID,
ADD COLUMN IF NOT EXISTS shipping_address JSONB,
ADD COLUMN IF NOT EXISTS products JSONB,
ADD COLUMN IF NOT EXISTS processed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS shipped_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS received_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS received_by UUID;

-- Add foreign key constraints
ALTER TABLE orders
ADD CONSTRAINT fk_orders_ivr_request
FOREIGN KEY (ivr_request_id) REFERENCES ivr_requests(id) ON DELETE CASCADE;

ALTER TABLE orders
ADD CONSTRAINT fk_orders_received_by
FOREIGN KEY (received_by) REFERENCES users(id) ON DELETE SET NULL;

-- Add unique constraint to ensure one IVR can only have one order
ALTER TABLE orders
ADD CONSTRAINT uq_orders_ivr_request_id UNIQUE (ivr_request_id);

-- Add check constraints for order status progression
ALTER TABLE orders
ADD CONSTRAINT chk_orders_timestamps CHECK (
    (processed_at IS NULL OR processed_at >= created_at) AND
    (shipped_at IS NULL OR shipped_at >= COALESCE(processed_at, created_at)) AND
    (received_at IS NULL OR received_at >= COALESCE(shipped_at, processed_at, created_at))
);

-- Create additional indexes for performance
CREATE INDEX IF NOT EXISTS idx_orders_ivr_request_id ON orders(ivr_request_id);
CREATE INDEX IF NOT EXISTS idx_orders_processed_at ON orders(processed_at);
CREATE INDEX IF NOT EXISTS idx_orders_shipped_at ON orders(shipped_at);
CREATE INDEX IF NOT EXISTS idx_orders_received_at ON orders(received_at);
CREATE INDEX IF NOT EXISTS idx_orders_received_by ON orders(received_by);

-- Update existing order_documents table to ensure it has proper constraints
-- (The table already exists, so we just need to verify the structure)
DO $$
BEGIN
    -- Check if document_type constraint exists, if not add it
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints
        WHERE constraint_name = 'chk_order_documents_type'
    ) THEN
        ALTER TABLE order_documents
        ADD CONSTRAINT chk_order_documents_type
        CHECK (document_type IN ('shipping_label', 'invoice', 'receipt', 'delivery_confirmation', 'return_authorization', 'other'));
    END IF;
END $$;

-- Add comments for new fields
COMMENT ON COLUMN orders.ivr_request_id IS 'Reference to the IVR request that generated this order (one-to-one relationship)';
COMMENT ON COLUMN orders.shipping_address IS 'JSON object containing complete shipping address information';
COMMENT ON COLUMN orders.products IS 'JSON array of products from the approved IVR request with sizes and quantities';
COMMENT ON COLUMN orders.processed_at IS 'Timestamp when order processing began';
COMMENT ON COLUMN orders.shipped_at IS 'Timestamp when order was shipped';
COMMENT ON COLUMN orders.received_at IS 'Timestamp when order was received by patient/facility';
COMMENT ON COLUMN orders.received_by IS 'User who confirmed receipt of the order';

-- Insert sample data to test the integration
-- First, let's get a sample IVR request that's approved
DO $$
DECLARE
    sample_ivr_id UUID;
    sample_patient_id UUID;
    sample_provider_id UUID;
    sample_facility_id UUID;
    sample_user_id UUID;
    sample_org_id UUID;
BEGIN
    -- Get sample IDs from existing data
    SELECT id INTO sample_ivr_id FROM ivr_requests WHERE status = 'approved' LIMIT 1;
    SELECT patient_id INTO sample_patient_id FROM ivr_requests WHERE id = sample_ivr_id;
    SELECT provider_id INTO sample_provider_id FROM ivr_requests WHERE id = sample_ivr_id;
    SELECT facility_id INTO sample_facility_id FROM ivr_requests WHERE id = sample_ivr_id;
    SELECT id INTO sample_user_id FROM users WHERE role = 'doctor' LIMIT 1;
    SELECT id INTO sample_org_id FROM organizations LIMIT 1;

    -- Only insert if we have the required data and no existing order for this IVR
    IF sample_ivr_id IS NOT NULL AND sample_patient_id IS NOT NULL AND
       NOT EXISTS (SELECT 1 FROM orders WHERE ivr_request_id = sample_ivr_id) THEN

        INSERT INTO orders (
            id,
            organization_id,
            order_number,
            patient_id,
            provider_id,
            created_by_id,
            ivr_session_id,
            status,
            order_type,
            priority,
            _total_amount,
            _notes,
            _insurance_data,
            _payment_info,
            _delivery_info,
            completion_date,
            created_at,
            updated_at,
            ivr_request_id,
            shipping_address,
            products
        ) VALUES (
            gen_random_uuid(),
            COALESCE(sample_org_id, gen_random_uuid()),
            'ORD-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-001',
            sample_patient_id,
            sample_provider_id,
            COALESCE(sample_user_id, sample_provider_id),
            'IVR-SESSION-' || sample_ivr_id::text,
            'pending'::order_status_enum,
            'medical_supplies'::order_type_enum,
            'medium'::order_priority_enum,
            '475.00',
            'Order created from approved IVR request',
            '{"provider": "Blue Cross Blue Shield", "policy_number": "BC123456789"}',
            '{"method": "insurance", "status": "pre_authorized"}',
            '{"method": "standard", "estimated_days": 3}',
            NOW() + INTERVAL '3 days',
            NOW(),
            NOW(),
            sample_ivr_id,
            '{
                "street": "123 Medical Center Dr",
                "city": "Healthcare City",
                "state": "CA",
                "zip": "90210",
                "country": "USA",
                "attention": "Dr. Smith",
                "phone": "(555) 123-4567"
            }',
            '[
                {
                    "product_name": "Advanced Wound Dressing",
                    "q_code": "Q4100",
                    "sizes": [
                        {
                            "size": "2x2",
                            "dimensions": "2 inch x 2 inch",
                            "unit_price": 25.00,
                            "quantity": 10,
                            "total": 250.00
                        },
                        {
                            "size": "4x4",
                            "dimensions": "4 inch x 4 inch",
                            "unit_price": 45.00,
                            "quantity": 5,
                            "total": 225.00
                        }
                    ],
                    "total_quantity": 15,
                    "total_cost": 475.00
                }
            ]'
        );

        RAISE NOTICE 'Sample order created for IVR request: %', sample_ivr_id;
    ELSE
        RAISE NOTICE 'No approved IVR request found or order already exists';
    END IF;
END $$;

-- Verify the migration
DO $$
BEGIN
    -- Check if new columns exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'orders' AND column_name = 'ivr_request_id'
    ) THEN
        RAISE EXCEPTION 'ivr_request_id column was not added to orders table';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'orders' AND column_name = 'shipping_address'
    ) THEN
        RAISE EXCEPTION 'shipping_address column was not added to orders table';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'orders' AND column_name = 'products'
    ) THEN
        RAISE EXCEPTION 'products column was not added to orders table';
    END IF;

    -- Check if unique constraint exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'uq_orders_ivr_request_id'
    ) THEN
        RAISE EXCEPTION 'Unique constraint on ivr_request_id was not created';
    END IF;

    -- Check if foreign key constraint exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'fk_orders_ivr_request'
    ) THEN
        RAISE EXCEPTION 'Foreign key constraint to ivr_requests was not created';
    END IF;

    RAISE NOTICE 'Order-IVR integration migration completed successfully';
END $$;