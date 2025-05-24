-- Migration: Add Order Status History Table
-- Description: Creates the order_status_history table for tracking order status changes
-- with proper HIPAA compliance and audit trail capabilities

BEGIN;

-- Create enum for order statuses if not exists
DO $$ BEGIN
    CREATE TYPE order_status AS ENUM (
        'DRAFT',
        'PENDING_VERIFICATION',
        'VERIFIED',
        'PROCESSING',
        'READY_TO_SHIP',
        'SHIPPED',
        'DELIVERED',
        'RETURNED',
        'ON_HOLD',
        'CANCELLED',
        'COMPLETED',
        'REJECTED'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create order_status_history table
CREATE TABLE IF NOT EXISTS order_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    previous_status order_status NOT NULL,
    new_status order_status NOT NULL,
    changed_by UUID NOT NULL REFERENCES users(id),
    territory_id UUID NOT NULL REFERENCES territories(id),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Add metadata for HIPAA compliance
    phi_access_reason TEXT NOT NULL,
    access_location TEXT,
    ip_address TEXT,
    user_agent TEXT,
    
    -- Add constraints
    CONSTRAINT valid_status_transition CHECK (
        previous_status != new_status AND
        (previous_status, new_status) IN (
            ('DRAFT', 'PENDING_VERIFICATION'),
            ('PENDING_VERIFICATION', 'VERIFIED'),
            ('PENDING_VERIFICATION', 'REJECTED'),
            ('VERIFIED', 'PROCESSING'),
            ('VERIFIED', 'CANCELLED'),
            ('PROCESSING', 'READY_TO_SHIP'),
            ('PROCESSING', 'ON_HOLD'),
            ('PROCESSING', 'CANCELLED'),
            ('READY_TO_SHIP', 'SHIPPED'),
            ('READY_TO_SHIP', 'ON_HOLD'),
            ('READY_TO_SHIP', 'CANCELLED'),
            ('SHIPPED', 'DELIVERED'),
            ('SHIPPED', 'RETURNED'),
            ('DELIVERED', 'COMPLETED'),
            ('DELIVERED', 'RETURNED'),
            ('RETURNED', 'COMPLETED'),
            ('RETURNED', 'PROCESSING'),
            ('ON_HOLD', 'PROCESSING'),
            ('ON_HOLD', 'CANCELLED')
        )
    )
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_order_status_history_order_id 
    ON order_status_history(order_id);

CREATE INDEX IF NOT EXISTS idx_order_status_history_created_at 
    ON order_status_history(created_at);

CREATE INDEX IF NOT EXISTS idx_order_status_history_territory 
    ON order_status_history(territory_id);

CREATE INDEX IF NOT EXISTS idx_order_status_history_status 
    ON order_status_history(new_status);

-- Add composite index for status transition queries
CREATE INDEX IF NOT EXISTS idx_order_status_history_transition 
    ON order_status_history(order_id, previous_status, new_status);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_order_status_history_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_order_status_history_timestamp
    BEFORE UPDATE ON order_status_history
    FOR EACH ROW
    EXECUTE FUNCTION update_order_status_history_timestamp();

-- Add audit trigger for HIPAA compliance
CREATE OR REPLACE FUNCTION audit_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO audit_log (
        table_name,
        record_id,
        action,
        changed_by,
        territory_id,
        old_data,
        new_data,
        phi_access_reason
    ) VALUES (
        'order_status_history',
        NEW.id,
        TG_OP,
        NEW.changed_by,
        NEW.territory_id,
        row_to_json(OLD),
        row_to_json(NEW),
        NEW.phi_access_reason
    );
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER audit_order_status_change
    AFTER INSERT OR UPDATE OR DELETE ON order_status_history
    FOR EACH ROW
    EXECUTE FUNCTION audit_order_status_change();

-- Grant appropriate permissions
GRANT SELECT, INSERT ON order_status_history TO app_user;

COMMIT; 