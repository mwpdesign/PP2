# Patient Management System

## Overview
The Patient Management System handles secure storage and processing of patient information in compliance with HIPAA regulations, featuring field-level encryption and territory-based access control.

## Data Model

### Patient Schema
```python
@phi_protected
class Patient(BaseModel):
    id: str
    territory_id: str
    
    # PHI Fields (Encrypted)
    first_name: EncryptedStr
    last_name: EncryptedStr
    date_of_birth: EncryptedDate
    ssn: EncryptedStr
    
    # Contact Information (Encrypted)
    email: EncryptedStr
    phone: EncryptedStr
    address: EncryptedJSON
    
    # Insurance Information (Encrypted)
    insurance: EncryptedJSON = {
        "carrier": str,
        "policy_number": str,
        "group_number": str,
        "coverage_details": dict
    }
    
    # Medical Information (Encrypted)
    medical_record: EncryptedJSON
    
    # Metadata (Non-PHI)
    created_at: datetime
    updated_at: datetime
    status: str
    
    class Config:
        encryption_context = ['territory_id']
```

## API Endpoints

### Create Patient
```http
POST /api/v1/patients
Content-Type: application/json
Authorization: Bearer {token}
Territory-Id: {territory_id}

{
  "first_name": "string",
  "last_name": "string",
  "date_of_birth": "YYYY-MM-DD",
  "ssn": "string",
  "email": "string",
  "phone": "string",
  "address": {
    "street": "string",
    "city": "string",
    "state": "string",
    "zip": "string"
  },
  "insurance": {
    "carrier": "string",
    "policy_number": "string",
    "group_number": "string"
  }
}
```

### Update Patient
```http
PUT /api/v1/patients/{patient_id}
Content-Type: application/json
Authorization: Bearer {token}
Territory-Id: {territory_id}

{
  "field": "value"
}
```

## Implementation

### Patient Service
```python
class PatientService:
    def __init__(self, territory_id: str):
        self.territory_id = territory_id
        self.encryption = PHIEncryption()
    
    async def create_patient(self, data: dict) -> Patient:
        # Validate territory
        await validate_territory(self.territory_id)
        
        # Create patient with encrypted fields
        patient = Patient(
            territory_id=self.territory_id,
            **data
        )
        
        # Save and audit
        await self.repository.save(patient)
        await audit_log.record_phi_creation(
            patient.id,
            self.territory_id
        )
        
        return patient
```

### Field-Level Encryption
```python
class PHIEncryption:
    async def encrypt_field(
        self,
        value: Any,
        context: dict
    ) -> EncryptedValue:
        kms_key = await self.get_territory_key(context['territory_id'])
        return await self.encrypt(value, kms_key)
    
    async def decrypt_field(
        self,
        encrypted_value: EncryptedValue,
        context: dict
    ) -> Any:
        await audit_log.record_phi_access(context)
        kms_key = await self.get_territory_key(context['territory_id'])
        return await self.decrypt(encrypted_value, kms_key)
```

## Frontend Components

### Patient Form
```typescript
interface PatientFormProps {
  patient?: Patient;
  territory: Territory;
  onSubmit: (data: PatientFormData) => Promise<void>;
}

const PatientForm: React.FC<PatientFormProps> = ({
  patient,
  territory,
  onSubmit
}) => {
  // Implementation
};
```

### Patient List
```typescript
const PatientList: React.FC = () => {
  const { territory } = useTerritory();
  const { data, isLoading } = useQuery(
    ['patients', territory.id],
    () => fetchPatients(territory.id)
  );
  
  return (
    <Table>
      <thead>
        <tr>
          <th>Name</th>
          <th>DOB</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {data?.map(patient => (
          <PatientRow
            key={patient.id}
            patient={patient}
            territory={territory}
          />
        ))}
      </tbody>
    </Table>
  );
};
```

## Security Features

### Access Control
- Territory-based isolation
- Role-based permissions
- PHI access logging
- Field-level encryption

### Audit Trail
```typescript
interface PHIAuditEvent {
  timestamp: string;
  user_id: string;
  territory_id: string;
  patient_id: string;
  action: 'view' | 'create' | 'update' | 'delete';
  fields_accessed: string[];
}
```

## Error Handling

### Common Errors
```json
{
  "status": "error",
  "error": {
    "code": "PATIENT_NOT_FOUND",
    "message": "Patient not found",
    "details": {
      "patient_id": "uuid"
    }
  }
}
```

### Error Codes
- `PATIENT_NOT_FOUND`: Patient does not exist
- `INVALID_PHI`: Invalid PHI data format
- `TERRITORY_MISMATCH`: Patient not in user's territory
- `ENCRYPTION_ERROR`: Encryption/decryption failed
- `VALIDATION_ERROR`: Invalid patient data

## Performance Considerations
- Encrypted field caching
- Batch processing capabilities
- Query optimization
- Territory-based indexing 