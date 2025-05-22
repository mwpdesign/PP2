-- Create shipping-related enums
CREATE TYPE address_type_enum AS ENUM ('from', 'to');
CREATE TYPE package_type_enum AS ENUM (
    'custom',
    'envelope',
    'small_box',
    'medium_box',
    'large_box',
    'medical_container'
);
CREATE TYPE shipping_service_type_enum AS ENUM (
    'ground',
    'express',
    'overnight',
    'priority',
    'economy'
);
CREATE TYPE shipment_status_enum AS ENUM (
    'pending',
    'label_created',
    'picked_up',
    'in_transit',
    'delivered',
    'exception'
);
CREATE TYPE tracking_status_enum AS ENUM (
    'pending',
    'in_transit',
    'out_for_delivery',
    'delivered',
    'exception',
    'returned'
);

-- Create shipping_addresses table
CREATE TABLE shipping_addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id),
    address_type address_type_enum NOT NULL,
    _street1 VARCHAR(500) NOT NULL,
    _street2 VARCHAR(500),
    _city VARCHAR(500) NOT NULL,
    _state VARCHAR(500) NOT NULL,
    _postal_code VARCHAR(500) NOT NULL,
    _country VARCHAR(500) NOT NULL,
    is_residential BOOLEAN DEFAULT TRUE,
    _phone VARCHAR(500),
    _email VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create shipments table
CREATE TABLE shipments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id),
    carrier VARCHAR(50) NOT NULL,
    service_type shipping_service_type_enum NOT NULL,
    tracking_number VARCHAR(100),
    status shipment_status_enum NOT NULL DEFAULT 'pending',
    _rate VARCHAR(500),
    currency VARCHAR(3) DEFAULT 'USD',
    label_url VARCHAR(500),
    estimated_delivery TIMESTAMP WITH TIME ZONE,
    actual_delivery TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create shipment_packages table
CREATE TABLE shipment_packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shipment_id UUID NOT NULL REFERENCES shipments(id),
    package_type package_type_enum NOT NULL,
    weight VARCHAR(500) NOT NULL,
    length VARCHAR(500),
    width VARCHAR(500),
    height VARCHAR(500),
    value VARCHAR(500),
    reference VARCHAR(100),
    requires_signature BOOLEAN DEFAULT TRUE,
    is_temperature_controlled BOOLEAN DEFAULT FALSE,
    temperature_range JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create shipment_tracking table
CREATE TABLE shipment_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shipment_id UUID NOT NULL REFERENCES shipments(id),
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    status tracking_status_enum NOT NULL,
    _location VARCHAR(500),
    _description VARCHAR(1000),
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_shipping_addresses_order_id ON shipping_addresses(order_id);
CREATE INDEX idx_shipments_order_id ON shipments(order_id);
CREATE INDEX idx_shipments_tracking_number ON shipments(tracking_number);
CREATE INDEX idx_shipment_packages_shipment_id ON shipment_packages(shipment_id);
CREATE INDEX idx_shipment_tracking_shipment_id ON shipment_tracking(shipment_id);

-- Add foreign key constraints
ALTER TABLE shipping_addresses
    ADD CONSTRAINT fk_shipping_addresses_order
    FOREIGN KEY (order_id)
    REFERENCES orders(id)
    ON DELETE CASCADE;

ALTER TABLE shipments
    ADD CONSTRAINT fk_shipments_order
    FOREIGN KEY (order_id)
    REFERENCES orders(id)
    ON DELETE CASCADE;

ALTER TABLE shipment_packages
    ADD CONSTRAINT fk_shipment_packages_shipment
    FOREIGN KEY (shipment_id)
    REFERENCES shipments(id)
    ON DELETE CASCADE;

ALTER TABLE shipment_tracking
    ADD CONSTRAINT fk_shipment_tracking_shipment
    FOREIGN KEY (shipment_id)
    REFERENCES shipments(id)
    ON DELETE CASCADE;

-- Add triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_shipping_addresses_updated_at
    BEFORE UPDATE ON shipping_addresses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shipments_updated_at
    BEFORE UPDATE ON shipments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shipment_packages_updated_at
    BEFORE UPDATE ON shipment_packages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 