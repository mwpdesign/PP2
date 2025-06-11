-- Migration: Add comprehensive product catalog tables for Order Management System
-- Date: 2025-06-10
-- Description: Creates product_categories, enhanced products, product_sizes, inventory, and product_pricing tables

-- Create product_categories table
CREATE TABLE IF NOT EXISTS product_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    parent_category_id UUID REFERENCES product_categories(id) ON DELETE SET NULL,
    category_code VARCHAR(20) UNIQUE NOT NULL,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,

    -- Regulatory and compliance fields
    requires_prescription BOOLEAN DEFAULT FALSE,
    regulatory_class VARCHAR(50), -- Class I, II, III

    -- Metadata
    category_metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create indexes for product_categories
CREATE INDEX IF NOT EXISTS ix_product_categories_parent_id ON product_categories(parent_category_id);
CREATE INDEX IF NOT EXISTS ix_product_categories_code ON product_categories(category_code);
CREATE INDEX IF NOT EXISTS ix_product_categories_active ON product_categories(is_active);

-- Drop existing products table if it exists (will be recreated with enhanced structure)
DROP TABLE IF EXISTS products CASCADE;

-- Create enhanced products table
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Basic product information
    name VARCHAR(255) NOT NULL,
    description TEXT,
    short_description VARCHAR(500),
    manufacturer VARCHAR(100),
    brand VARCHAR(100),

    -- Product identification
    sku VARCHAR(50) UNIQUE NOT NULL,
    upc VARCHAR(20),
    manufacturer_part_number VARCHAR(50),

    -- Medical/regulatory codes
    hcpcs_code VARCHAR(20),
    ndc_number VARCHAR(20), -- National Drug Code
    fda_device_id VARCHAR(50),

    -- Category and classification
    category_id UUID NOT NULL REFERENCES product_categories(id) ON DELETE RESTRICT,

    -- Regulatory and compliance
    regulatory_class VARCHAR(50), -- Class I, II, III
    fda_cleared BOOLEAN DEFAULT FALSE,
    requires_prescription BOOLEAN DEFAULT FALSE,
    controlled_substance BOOLEAN DEFAULT FALSE,
    latex_free BOOLEAN DEFAULT TRUE,
    sterile BOOLEAN DEFAULT FALSE,

    -- Product specifications
    unit_of_measure VARCHAR(20) DEFAULT 'each', -- each, box, case, etc.
    weight NUMERIC(10, 4), -- in grams
    dimensions VARCHAR(50), -- L x W x H

    -- Pricing (base price - specific pricing in product_pricing table)
    base_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    cost NUMERIC(10, 2), -- wholesale cost

    -- Status and availability
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    is_discontinued BOOLEAN DEFAULT FALSE,
    requires_cold_storage BOOLEAN DEFAULT FALSE,
    hazardous_material BOOLEAN DEFAULT FALSE,

    -- Inventory management flags
    track_inventory BOOLEAN DEFAULT TRUE,
    allow_backorder BOOLEAN DEFAULT FALSE,

    -- Metadata and additional information
    product_metadata JSONB DEFAULT '{}',
    compliance_notes TEXT,
    usage_instructions TEXT,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create indexes for products
CREATE INDEX IF NOT EXISTS ix_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS ix_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS ix_products_hcpcs_code ON products(hcpcs_code);
CREATE INDEX IF NOT EXISTS ix_products_manufacturer ON products(manufacturer);
CREATE INDEX IF NOT EXISTS ix_products_active ON products(is_active);
CREATE INDEX IF NOT EXISTS ix_products_discontinued ON products(is_discontinued);
CREATE INDEX IF NOT EXISTS ix_products_name_search ON products(name); -- For text search

-- Create product_sizes table
CREATE TABLE IF NOT EXISTS product_sizes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,

    -- Size identification
    size_name VARCHAR(50) NOT NULL, -- "Small", "2x2", "10ml"
    size_code VARCHAR(20) NOT NULL, -- "SM", "2X2", "10ML"
    dimensions VARCHAR(50), -- "2x2 cm", "10ml"

    -- Size-specific details
    unit_of_measure VARCHAR(20) DEFAULT 'each',
    units_per_package INTEGER DEFAULT 1,
    weight NUMERIC(10, 4),

    -- Size-specific identifiers
    sku_suffix VARCHAR(20), -- Added to base SKU
    upc VARCHAR(20),

    -- Status
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    display_order INTEGER DEFAULT 0,

    -- Metadata
    size_metadata JSONB DEFAULT '{}',

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,

    -- Unique constraint on product_id + size_code
    UNIQUE(product_id, size_code)
);

-- Create indexes for product_sizes
CREATE INDEX IF NOT EXISTS ix_product_sizes_product_id ON product_sizes(product_id);
CREATE INDEX IF NOT EXISTS ix_product_sizes_code ON product_sizes(size_code);
CREATE INDEX IF NOT EXISTS ix_product_sizes_active ON product_sizes(is_active);

-- Create inventory table
CREATE TABLE IF NOT EXISTS inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_size_id UUID NOT NULL REFERENCES product_sizes(id) ON DELETE CASCADE,

    -- Location information
    warehouse_location VARCHAR(50),
    bin_location VARCHAR(20),

    -- Inventory quantities
    quantity_available INTEGER DEFAULT 0 NOT NULL,
    quantity_reserved INTEGER DEFAULT 0 NOT NULL,
    quantity_on_order INTEGER DEFAULT 0 NOT NULL,

    -- Inventory management thresholds
    reorder_level INTEGER DEFAULT 10 NOT NULL,
    reorder_quantity INTEGER DEFAULT 50 NOT NULL,
    max_stock_level INTEGER,

    -- Lot and expiration tracking
    lot_number VARCHAR(50),
    expiration_date TIMESTAMP WITH TIME ZONE,

    -- Cost tracking
    unit_cost NUMERIC(10, 2),
    total_value NUMERIC(12, 2),

    -- Status
    is_active BOOLEAN DEFAULT TRUE NOT NULL,

    -- Timestamps
    last_counted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create indexes for inventory
CREATE INDEX IF NOT EXISTS ix_inventory_product_size_id ON inventory(product_size_id);
CREATE INDEX IF NOT EXISTS ix_inventory_warehouse ON inventory(warehouse_location);
CREATE INDEX IF NOT EXISTS ix_inventory_lot_number ON inventory(lot_number);
CREATE INDEX IF NOT EXISTS ix_inventory_expiration ON inventory(expiration_date);
CREATE INDEX IF NOT EXISTS ix_inventory_low_stock ON inventory(quantity_available, reorder_level);
CREATE INDEX IF NOT EXISTS ix_inventory_active ON inventory(is_active);

-- Create product_pricing table
CREATE TABLE IF NOT EXISTS product_pricing (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_size_id UUID NOT NULL REFERENCES product_sizes(id) ON DELETE CASCADE,

    -- Pricing information
    price NUMERIC(10, 2) NOT NULL,
    cost NUMERIC(10, 2),

    -- Price type and tier
    price_type VARCHAR(20) DEFAULT 'standard' NOT NULL, -- standard, wholesale, contract, promotional
    customer_tier VARCHAR(20), -- bronze, silver, gold

    -- Effective dates
    effective_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE,

    -- Quantity breaks
    min_quantity INTEGER DEFAULT 1 NOT NULL,
    max_quantity INTEGER,

    -- Currency and region
    currency VARCHAR(3) DEFAULT 'USD' NOT NULL,
    region VARCHAR(50),

    -- Status
    is_active BOOLEAN DEFAULT TRUE NOT NULL,

    -- Metadata
    pricing_notes VARCHAR(500),
    pricing_metadata JSONB DEFAULT '{}',

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create indexes for product_pricing
CREATE INDEX IF NOT EXISTS ix_product_pricing_product_size_id ON product_pricing(product_size_id);
CREATE INDEX IF NOT EXISTS ix_product_pricing_effective_date ON product_pricing(effective_date);
CREATE INDEX IF NOT EXISTS ix_product_pricing_price_type ON product_pricing(price_type);
CREATE INDEX IF NOT EXISTS ix_product_pricing_active ON product_pricing(is_active);
CREATE INDEX IF NOT EXISTS ix_product_pricing_current ON product_pricing(effective_date, end_date, is_active);

-- Create trigger function for updating updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
CREATE TRIGGER update_product_categories_updated_at BEFORE UPDATE ON product_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_product_sizes_updated_at BEFORE UPDATE ON product_sizes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_inventory_updated_at BEFORE UPDATE ON inventory FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_product_pricing_updated_at BEFORE UPDATE ON product_pricing FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample product categories
INSERT INTO product_categories (name, category_code, description, regulatory_class) VALUES
('Wound Care', 'WOUND', 'Wound care and dressing products', 'Class I'),
('Surgical Supplies', 'SURG', 'Surgical instruments and supplies', 'Class II'),
('Dressings', 'DRESS', 'Medical dressings and bandages', 'Class I'),
('Compression Therapy', 'COMP', 'Compression garments and devices', 'Class I'),
('Skin Care', 'SKIN', 'Skin care and protection products', 'Class I');

-- Insert sample products with comprehensive data
INSERT INTO products (
    name, description, manufacturer, sku, hcpcs_code, category_id,
    base_price, regulatory_class, latex_free, sterile
) VALUES
(
    'Advanced Foam Dressing',
    'Highly absorbent foam dressing for moderate to heavy exudate wounds',
    'MedSupply Corp',
    'AFD-001',
    'A6209',
    (SELECT id FROM product_categories WHERE category_code = 'DRESS'),
    15.99,
    'Class I',
    TRUE,
    TRUE
),
(
    'Hydrocolloid Dressing',
    'Self-adhesive hydrocolloid dressing for light to moderate exudate',
    'WoundTech Inc',
    'HCD-001',
    'A6234',
    (SELECT id FROM product_categories WHERE category_code = 'DRESS'),
    12.50,
    'Class I',
    TRUE,
    TRUE
),
(
    'Compression Bandage System',
    'Multi-layer compression bandage system for venous leg ulcers',
    'CompressionCare',
    'CBS-001',
    'A6448',
    (SELECT id FROM product_categories WHERE category_code = 'COMP'),
    45.00,
    'Class I',
    TRUE,
    FALSE
);

-- Insert product sizes for the sample products
INSERT INTO product_sizes (product_id, size_name, size_code, dimensions, sku_suffix) VALUES
-- Advanced Foam Dressing sizes
((SELECT id FROM products WHERE sku = 'AFD-001'), '2x2 inch', '2X2', '2x2 inches', '-2X2'),
((SELECT id FROM products WHERE sku = 'AFD-001'), '4x4 inch', '4X4', '4x4 inches', '-4X4'),
((SELECT id FROM products WHERE sku = 'AFD-001'), '6x6 inch', '6X6', '6x6 inches', '-6X6'),

-- Hydrocolloid Dressing sizes
((SELECT id FROM products WHERE sku = 'HCD-001'), '2x2 inch', '2X2', '2x2 inches', '-2X2'),
((SELECT id FROM products WHERE sku = 'HCD-001'), '4x4 inch', '4X4', '4x4 inches', '-4X4'),

-- Compression Bandage System sizes
((SELECT id FROM products WHERE sku = 'CBS-001'), 'Small', 'SM', 'Ankle 18-22cm', '-SM'),
((SELECT id FROM products WHERE sku = 'CBS-001'), 'Medium', 'MD', 'Ankle 22-26cm', '-MD'),
((SELECT id FROM products WHERE sku = 'CBS-001'), 'Large', 'LG', 'Ankle 26-30cm', '-LG');

-- Insert sample inventory records
INSERT INTO inventory (product_size_id, warehouse_location, quantity_available, reorder_level, reorder_quantity)
SELECT
    ps.id,
    'Main Warehouse',
    CASE
        WHEN ps.size_code = '2X2' THEN 500
        WHEN ps.size_code = '4X4' THEN 300
        WHEN ps.size_code = '6X6' THEN 150
        WHEN ps.size_code = 'SM' THEN 100
        WHEN ps.size_code = 'MD' THEN 150
        WHEN ps.size_code = 'LG' THEN 100
        ELSE 200
    END,
    50,
    200
FROM product_sizes ps;

-- Insert sample pricing records
INSERT INTO product_pricing (product_size_id, price, price_type, effective_date)
SELECT
    ps.id,
    CASE
        WHEN p.sku = 'AFD-001' AND ps.size_code = '2X2' THEN 15.99
        WHEN p.sku = 'AFD-001' AND ps.size_code = '4X4' THEN 25.99
        WHEN p.sku = 'AFD-001' AND ps.size_code = '6X6' THEN 35.99
        WHEN p.sku = 'HCD-001' AND ps.size_code = '2X2' THEN 12.50
        WHEN p.sku = 'HCD-001' AND ps.size_code = '4X4' THEN 18.50
        WHEN p.sku = 'CBS-001' AND ps.size_code = 'SM' THEN 42.00
        WHEN p.sku = 'CBS-001' AND ps.size_code = 'MD' THEN 45.00
        WHEN p.sku = 'CBS-001' AND ps.size_code = 'LG' THEN 48.00
        ELSE p.base_price
    END,
    'standard',
    NOW()
FROM product_sizes ps
JOIN products p ON ps.product_id = p.id;

-- Add comments for documentation
COMMENT ON TABLE product_categories IS 'Hierarchical product categories for organizing medical supplies';
COMMENT ON TABLE products IS 'Enhanced product catalog with comprehensive medical product information';
COMMENT ON TABLE product_sizes IS 'Multi-size variants for products (enhanced from IVR structure)';
COMMENT ON TABLE inventory IS 'Real-time inventory tracking for product sizes';
COMMENT ON TABLE product_pricing IS 'Dynamic pricing with effective dates and customer tiers';

-- Migration completed successfully
SELECT 'Product catalog tables created successfully with sample data' AS status;