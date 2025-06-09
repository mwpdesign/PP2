# Database Schema Documentation

## Overview
The Healthcare IVR Platform uses PostgreSQL as the primary database with comprehensive schema design supporting multi-tenancy, HIPAA compliance, and complex healthcare workflows.

## Database Configuration
- **Database Engine**: PostgreSQL 14+
- **Connection**: `postgresql+asyncpg://postgres:password@localhost:5432/healthcare_ivr`
- **ORM**: SQLAlchemy with async support
- **Migrations**: Alembic for schema versioning

## Core Tables

### Users and Authentication

#### users
Primary user authentication and profile table.

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    organization_id UUID REFERENCES organizations(id),
    is_active BOOLEAN DEFAULT true,
    is_superuser BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_organization ON users(organization_id);
```

**Roles Supported:**
- `ADMIN`: System administrators
- `DOCTOR`: Medical providers
- `IVR`: IVR Company users
- `MASTER_DISTRIBUTOR`: Regional distribution managers
- `CHP_ADMIN`: Community Health Program administrators
- `DISTRIBUTOR`: Local distributors
- `SALES`: Sales representatives
- `LOGISTICS`: Shipping and logistics coordinators

#### organizations
Multi-tenant organization management.

```sql
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    tax_id VARCHAR(50),
    address TEXT,
    phone VARCHAR(20),
    email VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Healthcare Entities

#### patients
Patient information with HIPAA compliance.

```sql
CREATE TABLE patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    date_of_birth DATE NOT NULL,
    gender VARCHAR(20),
    phone VARCHAR(20),
    email VARCHAR(255),
    address TEXT,
    emergency_contact_name VARCHAR(200),
    emergency_contact_phone VARCHAR(20),
    medicaid_number VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_patients_name ON patients(last_name, first_name);
CREATE INDEX idx_patients_medicaid ON patients(medicaid_number);
CREATE INDEX idx_patients_dob ON patients(date_of_birth);
```

#### healthcare_providers
Medical providers and facilities.

```sql
CREATE TABLE healthcare_providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'INDIVIDUAL', 'FACILITY'
    npi VARCHAR(10) UNIQUE,
    tax_id VARCHAR(50),
    specialization VARCHAR(100),
    address TEXT,
    phone VARCHAR(20),
    email VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_providers_npi ON healthcare_providers(npi);
CREATE INDEX idx_providers_type ON healthcare_providers(type);
```

## IVR System Tables

### IVR Requests

#### ivr_requests
Main IVR request table with comprehensive tracking.

```sql
CREATE TABLE ivr_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ivr_number VARCHAR(50) UNIQUE NOT NULL,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES healthcare_providers(id),
    submitter_id UUID REFERENCES users(id),

    -- Insurance Information
    insurance_provider VARCHAR(255) NOT NULL,
    policy_number VARCHAR(100),
    group_number VARCHAR(100),
    coverage_type VARCHAR(50) DEFAULT 'Primary',

    -- Medical Information
    diagnosis_code VARCHAR(20),
    treatment_plan TEXT,
    medical_necessity TEXT,

    -- Request Status and Priority
    status VARCHAR(50) DEFAULT 'pending_review',
    priority VARCHAR(20) DEFAULT 'medium',

    -- Approval Information
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    coverage_percentage DECIMAL(5,2),
    deductible_amount DECIMAL(10,2),
    copay_amount DECIMAL(10,2),
    out_of_pocket_max DECIMAL(10,2),
    coverage_notes TEXT,

    -- Rejection Information
    rejected_by UUID REFERENCES users(id),
    rejected_at TIMESTAMP WITH TIME ZONE,
    rejection_reason VARCHAR(100),
    rejection_notes TEXT,

    -- Document Request Information
    document_request_by UUID REFERENCES users(id),
    document_request_at TIMESTAMP WITH TIME ZONE,
    document_types TEXT[], -- Array of requested document types
    document_deadline DATE,
    document_request_notes TEXT,

    -- Timestamps
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_ivr_requests_status ON ivr_requests(status);
CREATE INDEX idx_ivr_requests_priority ON ivr_requests(priority);
CREATE INDEX idx_ivr_requests_patient ON ivr_requests(patient_id);
CREATE INDEX idx_ivr_requests_doctor ON ivr_requests(doctor_id);
CREATE INDEX idx_ivr_requests_submitted ON ivr_requests(submitted_at);
CREATE INDEX idx_ivr_requests_number ON ivr_requests(ivr_number);
```

**Status Values:**
- `pending_review`: Initial status when submitted
- `in_review`: Being reviewed by IVR company
- `approved`: Approved with coverage details
- `rejected`: Rejected with reason
- `awaiting_documents`: Additional documents required
- `escalated`: Requires supervisor review

**Priority Levels:**
- `low`: Standard processing
- `medium`: Normal priority
- `high`: Expedited processing
- `critical`: Emergency processing

### Product Management

#### ivr_products
Products selected for IVR requests.

```sql
CREATE TABLE ivr_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ivr_request_id UUID REFERENCES ivr_requests(id) ON DELETE CASCADE,
    product_name VARCHAR(255) NOT NULL,
    q_code VARCHAR(20),
    total_quantity INTEGER NOT NULL DEFAULT 0,
    total_cost DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_ivr_products_request ON ivr_products(ivr_request_id);
CREATE INDEX idx_ivr_products_qcode ON ivr_products(q_code);
```

#### ivr_product_sizes
Size variants for multi-size products.

```sql
CREATE TABLE ivr_product_sizes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ivr_product_id UUID REFERENCES ivr_products(id) ON DELETE CASCADE,
    size VARCHAR(50) NOT NULL,
    dimensions VARCHAR(100),
    unit_price DECIMAL(10,2) NOT NULL,
    quantity INTEGER NOT NULL,
    total DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_ivr_product_sizes_product ON ivr_product_sizes(ivr_product_id);
CREATE INDEX idx_ivr_product_sizes_size ON ivr_product_sizes(size);
```

## Audit and Compliance Tables

#### audit_logs
Comprehensive audit trail for HIPAA compliance.

```sql
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    session_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for audit queries
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at);
```

#### encryption_audit
PHI encryption tracking for compliance.

```sql
CREATE TABLE encryption_audit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name VARCHAR(100) NOT NULL,
    record_id UUID NOT NULL,
    field_name VARCHAR(100) NOT NULL,
    encryption_key_id VARCHAR(255) NOT NULL,
    encrypted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    encryption_algorithm VARCHAR(50) DEFAULT 'AES-256-GCM'
);

-- Indexes
CREATE INDEX idx_encryption_audit_table ON encryption_audit(table_name, record_id);
CREATE INDEX idx_encryption_audit_key ON encryption_audit(encryption_key_id);
```

## Insurance and Medical Tables

#### insurance_providers
Insurance company information.

```sql
CREATE TABLE insurance_providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'PRIVATE', 'MEDICARE', 'MEDICAID'
    contact_phone VARCHAR(20),
    contact_email VARCHAR(255),
    website VARCHAR(255),
    coverage_details JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### patient_insurance
Patient insurance coverage details.

```sql
CREATE TABLE patient_insurance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    insurance_provider_id UUID REFERENCES insurance_providers(id),
    policy_number VARCHAR(100) NOT NULL,
    group_number VARCHAR(100),
    coverage_type VARCHAR(50) DEFAULT 'Primary',
    effective_date DATE,
    expiration_date DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_patient_insurance_patient ON patient_insurance(patient_id);
CREATE INDEX idx_patient_insurance_policy ON patient_insurance(policy_number);
```

#### medical_conditions
Patient medical conditions and history.

```sql
CREATE TABLE medical_conditions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    condition_name VARCHAR(255) NOT NULL,
    icd_10_code VARCHAR(20),
    diagnosis_date DATE,
    status VARCHAR(50) DEFAULT 'Active', -- 'Active', 'Resolved', 'Chronic'
    notes TEXT,
    diagnosed_by UUID REFERENCES healthcare_providers(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_medical_conditions_patient ON medical_conditions(patient_id);
CREATE INDEX idx_medical_conditions_icd ON medical_conditions(icd_10_code);
```

## Document Management

#### documents
Document storage and metadata.

```sql
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL,
    file_path VARCHAR(500),
    file_size BIGINT,
    mime_type VARCHAR(100),
    checksum VARCHAR(255),

    -- Relationships
    patient_id UUID REFERENCES patients(id),
    ivr_request_id UUID REFERENCES ivr_requests(id),
    uploaded_by UUID REFERENCES users(id),

    -- Metadata
    is_phi BOOLEAN DEFAULT false,
    encryption_key_id VARCHAR(255),
    access_level VARCHAR(50) DEFAULT 'RESTRICTED',

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_documents_patient ON documents(patient_id);
CREATE INDEX idx_documents_ivr_request ON documents(ivr_request_id);
CREATE INDEX idx_documents_type ON documents(type);
CREATE INDEX idx_documents_phi ON documents(is_phi);
```

## Database Relationships

### Entity Relationship Diagram
```
users ──┐
        ├── ivr_requests (submitter_id, approved_by, rejected_by)
        └── audit_logs

patients ──┐
           ├── ivr_requests
           ├── patient_insurance
           ├── medical_conditions
           └── documents

healthcare_providers ──┐
                       ├── ivr_requests (doctor_id)
                       └── medical_conditions (diagnosed_by)

ivr_requests ──┐
               ├── ivr_products
               └── documents

ivr_products ──┐
               └── ivr_product_sizes

organizations ──┐
                └── users
```

### Foreign Key Constraints
- All foreign keys use `ON DELETE CASCADE` where appropriate
- Audit tables preserve references even after parent deletion
- User references use `ON DELETE SET NULL` for historical data

## Data Types and Constraints

### UUID Usage
- All primary keys use UUID for security and distribution
- Generated using `gen_random_uuid()` function
- Provides 128-bit unique identifiers

### Timestamp Handling
- All timestamps use `TIMESTAMP WITH TIME ZONE`
- Automatic `created_at` and `updated_at` tracking
- UTC storage with timezone awareness

### JSON/JSONB Fields
- `coverage_details` in insurance_providers
- `old_values` and `new_values` in audit_logs
- Flexible schema for complex data structures

### Array Fields
- `document_types` in ivr_requests for multiple document types
- PostgreSQL native array support

## Indexes and Performance

### Primary Indexes
- All tables have UUID primary keys with automatic indexes
- Foreign key columns automatically indexed

### Search Indexes
- Patient name search: `idx_patients_name`
- IVR status filtering: `idx_ivr_requests_status`
- Audit trail queries: `idx_audit_logs_created`

### Composite Indexes
- Multi-column indexes for common query patterns
- Optimized for dashboard and reporting queries

## Security and Encryption

### PHI Protection
- Sensitive fields encrypted at application level
- Encryption audit trail maintained
- Access logging for all PHI access

### Row-Level Security
```sql
-- Enable RLS on sensitive tables
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE ivr_requests ENABLE ROW LEVEL SECURITY;

-- Example policy for organization isolation
CREATE POLICY org_isolation ON patients
    FOR ALL TO authenticated_users
    USING (organization_id = current_setting('app.current_org_id')::UUID);
```

### Data Masking
- Sensitive data masked in non-production environments
- Configurable masking rules per field type
- Audit trail for data access and masking

## Migrations

### Alembic Configuration
```python
# alembic/env.py
from app.models import Base
target_metadata = Base.metadata

def run_migrations_online():
    configuration = config.get_section(config.config_ini_section)
    configuration['sqlalchemy.url'] = DATABASE_URL

    connectable = engine_from_config(
        configuration,
        prefix='sqlalchemy.',
        poolclass=pool.NullPool,
    )
```

### Migration Files
- **Initial Schema**: `001_initial_schema.py`
- **IVR System**: `002_ivr_system.py`
- **Multi-size Products**: `003_ivr_products_multi_size.py`
- **Audit System**: `004_audit_system.py`

### Migration Commands
```bash
# Create new migration
alembic revision --autogenerate -m "description"

# Apply migrations
alembic upgrade head

# Rollback migration
alembic downgrade -1
```

## Backup and Recovery

### Backup Strategy
- Daily full backups with point-in-time recovery
- Transaction log shipping for high availability
- Encrypted backups for PHI protection

### Recovery Procedures
- Automated backup verification
- Documented recovery procedures
- Regular disaster recovery testing

## Performance Monitoring

### Query Performance
- Slow query logging enabled
- Query plan analysis for optimization
- Index usage monitoring

### Database Metrics
- Connection pool monitoring
- Lock contention analysis
- Storage usage tracking

## Maintenance

### Regular Tasks
- Index maintenance and rebuilding
- Statistics updates for query optimization
- Vacuum and analyze operations

### Health Checks
- Connection pool health
- Replication lag monitoring
- Disk space monitoring

## Development Guidelines

### Schema Changes
- All changes through Alembic migrations
- Backward compatibility requirements
- Testing in staging environment

### Data Access Patterns
- Use async SQLAlchemy for all operations
- Implement proper connection pooling
- Follow HIPAA compliance guidelines

### Testing
- Unit tests for all models
- Integration tests for complex queries
- Performance tests for critical paths

## Support and Documentation

### Database Administration
- PostgreSQL 14+ required
- Async driver support (asyncpg)
- Connection pooling configuration

### Troubleshooting
- Query performance analysis
- Lock contention resolution
- Backup and recovery procedures

### Contact Information
- **Database Team**: Available for schema questions
- **Performance Issues**: Database optimization team
- **Backup/Recovery**: Infrastructure team