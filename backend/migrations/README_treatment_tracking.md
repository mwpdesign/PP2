# Treatment Tracking Database Schema

## Overview
This migration creates the foundation for tracking when products from orders are used on patients for treatment. The `treatment_records` table provides a comprehensive audit trail of product usage in clinical settings.

## Migration: 010_treatment_tracking.sql

### Table: treatment_records

**Purpose**: Track when products from orders are applied to patients during treatment

**Fields**:
- `id` (UUID, Primary Key) - Unique identifier for each treatment record
- `patient_id` (UUID, Foreign Key) - References patients table
- `order_id` (UUID, Foreign Key) - References orders table
- `product_id` (VARCHAR(100)) - Product code/SKU of the item used
- `product_name` (VARCHAR(255)) - Human readable name of the product
- `quantity_used` (INTEGER) - Number of units used (must be > 0)
- `date_applied` (DATE) - When the treatment was performed
- `diagnosis` (TEXT) - Medical condition being treated
- `procedure_performed` (TEXT) - Description of the medical procedure
- `wound_location` (VARCHAR(255)) - Anatomical location of treatment
- `doctor_notes` (TEXT) - Clinical notes from treating physician
- `recorded_by` (UUID, Foreign Key) - User who recorded this treatment
- `created_at` (TIMESTAMP) - When record was created
- `updated_at` (TIMESTAMP) - When record was last modified

### Constraints
- **Primary Key**: `id`
- **Foreign Keys**:
  - `patient_id` → `patients(id)` (CASCADE DELETE)
  - `order_id` → `orders(id)` (CASCADE DELETE)
  - `recorded_by` → `users(id)` (RESTRICT DELETE)
- **Check Constraints**:
  - `quantity_used > 0`

### Indexes
- `idx_treatment_records_patient_id` - For patient-based queries
- `idx_treatment_records_order_id` - For order-based queries
- `idx_treatment_records_date_applied` - For date-based queries
- `idx_treatment_records_recorded_by` - For user-based queries
- `idx_treatment_records_product_id` - For product-based queries
- `idx_treatment_records_patient_date` - Composite index for patient timeline queries

### Triggers
- `trigger_update_treatment_records_updated_at` - Automatically updates `updated_at` timestamp on record modification

## Use Cases

1. **Clinical Documentation**: Track what products were used on which patients
2. **Inventory Management**: Monitor product consumption rates
3. **Billing & Insurance**: Link product usage to patient treatments for billing
4. **Compliance**: Maintain audit trail of medical product usage
5. **Analytics**: Analyze treatment patterns and product effectiveness
6. **Quality Assurance**: Review treatment protocols and outcomes

## Sample Queries

### Find all treatments for a patient
```sql
SELECT tr.*, p.product_name, tr.date_applied, tr.diagnosis
FROM treatment_records tr
WHERE tr.patient_id = 'patient-uuid'
ORDER BY tr.date_applied DESC;
```

### Track product usage from an order
```sql
SELECT tr.product_id, tr.product_name, SUM(tr.quantity_used) as total_used
FROM treatment_records tr
WHERE tr.order_id = 'order-uuid'
GROUP BY tr.product_id, tr.product_name;
```

### Find recent treatments by doctor
```sql
SELECT tr.*, pt.first_name, pt.last_name
FROM treatment_records tr
JOIN patients pt ON tr.patient_id = pt.id
WHERE tr.recorded_by = 'doctor-uuid'
  AND tr.date_applied >= CURRENT_DATE - INTERVAL '30 days'
ORDER BY tr.date_applied DESC;
```

## Next Steps

This basic schema provides the foundation for treatment tracking. Future enhancements may include:

1. **Document Storage**: Add support for treatment photos and documentation
2. **Treatment Outcomes**: Track healing progress and treatment effectiveness
3. **Product Lot Tracking**: Link to specific product batches for recalls
4. **Treatment Protocols**: Standardized treatment workflows
5. **Integration**: Connect with EHR systems and billing platforms

## Verification

The migration was successfully applied with:
- ✅ Table created with all required fields
- ✅ All indexes created for performance
- ✅ Foreign key constraints established
- ✅ Update trigger functional
- ✅ Check constraints enforced

**Migration Status**: ✅ COMPLETE
**Database Impact**: New table added, no existing data affected
**Performance**: Optimized with appropriate indexes