-- Create orders table and related schemas

-- Create order status enum
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

-- Create order type enum
CREATE TYPE order_type_enum AS ENUM (
    'prescription',
    'medical_supplies',
    'equipment',
    'test_kit'
);

-- Create payment status enum
CREATE TYPE payment_status_enum AS ENUM (
    'pending',
    'authorized',
    'paid',
    'refunded',
    'failed'
);

-- Create orders table
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id),
    provider_id UUID NOT NULL REFERENCES providers(id),
    territory_id UUID NOT NULL REFERENCES territories(id),
    order_type order_type_enum NOT NULL,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    status order_status NOT NULL DEFAULT 'DRAFT',
    payment_status payment_status_enum NOT NULL DEFAULT 'pending',
    _total_amount VARCHAR(500) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    requires_verification BOOLEAN DEFAULT TRUE,
    requires_temperature_control BOOLEAN DEFAULT FALSE,
    temperature_range JSONB,
    notes TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID NOT NULL REFERENCES users(id),
    updated_by UUID NOT NULL REFERENCES users(id)
);

-- Create indexes
CREATE INDEX idx_orders_patient_id ON orders(patient_id);
CREATE INDEX idx_orders_provider_id ON orders(provider_id);
CREATE INDEX idx_orders_territory_id ON orders(territory_id);
CREATE INDEX idx_orders_order_number ON orders(order_number);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at);

-- Add foreign key constraints
ALTER TABLE orders
    ADD CONSTRAINT fk_orders_patient
    FOREIGN KEY (patient_id)
    REFERENCES patients(id)
    ON DELETE RESTRICT;

ALTER TABLE orders
    ADD CONSTRAINT fk_orders_provider
    FOREIGN KEY (provider_id)
    REFERENCES providers(id)
    ON DELETE RESTRICT;

ALTER TABLE orders
    ADD CONSTRAINT fk_orders_territory
    FOREIGN KEY (territory_id)
    REFERENCES territories(id)
    ON DELETE RESTRICT;

ALTER TABLE orders
    ADD CONSTRAINT fk_orders_created_by
    FOREIGN KEY (created_by)
    REFERENCES users(id)
    ON DELETE RESTRICT;

ALTER TABLE orders
    ADD CONSTRAINT fk_orders_updated_by
    FOREIGN KEY (updated_by)
    REFERENCES users(id)
    ON DELETE RESTRICT;

-- Create trigger for updated_at
CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create audit trigger
CREATE TRIGGER audit_orders_changes
    AFTER INSERT OR UPDATE OR DELETE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION log_rbac_changes(); 