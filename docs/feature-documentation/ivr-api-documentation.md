# IVR API Documentation

## Overview
The IVR (Insurance Verification Request) API provides endpoints for managing insurance verification requests, including approval workflows, document requests, and status management.

## Base URL
```
http://localhost:8000/api/v1/ivr
```

## Authentication
All endpoints require JWT authentication with Bearer token:
```
Authorization: Bearer <jwt_token>
```

## Endpoints

### 1. List IVR Requests
Get a list of all IVR requests for the authenticated user.

**Endpoint:** `GET /requests`

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Response:**
```json
{
  "requests": [
    {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "ivr_number": "IVR-2024-001",
      "patient_name": "John Smith",
      "doctor_name": "Dr. Sarah Wilson",
      "insurance": "Blue Cross Blue Shield",
      "status": "pending_review",
      "priority": "high",
      "days_pending": 3,
      "submitted_date": "2024-03-15",
      "patient_id": "P-1234",
      "doctor_id": "D-001",
      "products": [
        {
          "id": "prod-001",
          "product_name": "Rampart Wound Matrix",
          "q_code": "Q4201",
          "total_quantity": 15,
          "total_cost": 2250.00,
          "sizes": [
            {
              "size": "2x2",
              "dimensions": "2cm x 2cm",
              "unit_price": 150.00,
              "quantity": 10,
              "total": 1500.00
            },
            {
              "size": "4x4",
              "dimensions": "4cm x 4cm",
              "unit_price": 250.00,
              "quantity": 5,
              "total": 1250.00
            }
          ]
        }
      ]
    }
  ]
}
```

### 2. Get IVR Request Details
Get detailed information about a specific IVR request.

**Endpoint:** `GET /requests/{request_id}`

**Parameters:**
- `request_id` (UUID): The unique identifier of the IVR request

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Response:**
```json
{
  "id": "660e8400-e29b-41d4-a716-446655440001",
  "ivr_number": "IVR-2024-001",
  "patient": {
    "name": "John Smith",
    "date_of_birth": "1965-03-15",
    "medicaid_number": "123456789",
    "insurance": {
      "provider": "Blue Cross Blue Shield",
      "policy_number": "BCBS123456789",
      "group_number": "GRP001",
      "coverage_type": "Primary"
    },
    "medical_history": {
      "conditions": ["Diabetes Type 2", "Hypertension"],
      "allergies": ["Penicillin"],
      "medications": ["Metformin", "Lisinopril"]
    }
  },
  "doctor": {
    "name": "Dr. Sarah Wilson",
    "npi": "1234567890",
    "practice": "Boston Wound Care Center",
    "phone": "(555) 123-4567"
  },
  "products": [
    {
      "id": "prod-001",
      "product_name": "Rampart Wound Matrix",
      "q_code": "Q4201",
      "total_quantity": 15,
      "total_cost": 2250.00,
      "sizes": [
        {
          "size": "2x2",
          "dimensions": "2cm x 2cm",
          "unit_price": 150.00,
          "quantity": 10,
          "total": 1500.00
        }
      ]
    }
  ],
  "status": "pending_review",
  "priority": "high",
  "submitted_date": "2024-03-15T10:30:00Z",
  "last_updated": "2024-03-15T10:30:00Z"
}
```

### 3. Create IVR Request
Create a new IVR request with patient information and product selections.

**Endpoint:** `POST /requests`

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "patient_id": "P-1234",
  "doctor_id": "D-001",
  "insurance_provider": "Blue Cross Blue Shield",
  "policy_number": "BCBS123456789",
  "diagnosis_code": "E11.621",
  "treatment_plan": "Advanced wound care with skin substitute",
  "selected_products": [
    {
      "product_name": "Rampart Wound Matrix",
      "q_code": "Q4201",
      "sizes": [
        {
          "size": "2x2",
          "dimensions": "2cm x 2cm",
          "unit_price": 150.00,
          "quantity": 10
        },
        {
          "size": "4x4",
          "dimensions": "4cm x 4cm",
          "unit_price": 250.00,
          "quantity": 5
        }
      ]
    }
  ],
  "priority": "high",
  "notes": "Urgent wound care needed"
}
```

**Response:**
```json
{
  "id": "660e8400-e29b-41d4-a716-446655440004",
  "ivr_number": "IVR-2024-004",
  "status": "pending_review",
  "message": "IVR request created successfully"
}
```

### 4. Approve IVR Request
Approve an IVR request with coverage details.

**Endpoint:** `POST /requests/{request_id}/approve`

**Parameters:**
- `request_id` (UUID): The unique identifier of the IVR request

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "coverage_percentage": 80,
  "deductible_amount": 500.00,
  "copay_amount": 25.00,
  "out_of_pocket_max": 2000.00,
  "coverage_notes": "Approved for wound care treatment with 80% coverage"
}
```

**Response:**
```json
{
  "id": "660e8400-e29b-41d4-a716-446655440001",
  "status": "approved",
  "approval_date": "2024-03-16T14:30:00Z",
  "coverage_details": {
    "coverage_percentage": 80,
    "deductible_amount": 500.00,
    "copay_amount": 25.00,
    "out_of_pocket_max": 2000.00,
    "coverage_notes": "Approved for wound care treatment with 80% coverage"
  },
  "message": "IVR request approved successfully"
}
```

### 5. Reject IVR Request
Reject an IVR request with reason and notes.

**Endpoint:** `POST /requests/{request_id}/reject`

**Parameters:**
- `request_id` (UUID): The unique identifier of the IVR request

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "rejection_reason": "insufficient_documentation",
  "rejection_notes": "Additional medical documentation required for approval"
}
```

**Response:**
```json
{
  "id": "660e8400-e29b-41d4-a716-446655440001",
  "status": "rejected",
  "rejection_date": "2024-03-16T14:30:00Z",
  "rejection_details": {
    "reason": "insufficient_documentation",
    "notes": "Additional medical documentation required for approval"
  },
  "message": "IVR request rejected"
}
```

### 6. Request Additional Documents
Request additional documents for an IVR request.

**Endpoint:** `POST /requests/{request_id}/request-documents`

**Parameters:**
- `request_id` (UUID): The unique identifier of the IVR request

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "document_types": ["medical_records", "insurance_card", "physician_notes"],
  "deadline": "2024-03-20",
  "request_notes": "Please provide complete medical records and current insurance card"
}
```

**Response:**
```json
{
  "id": "660e8400-e29b-41d4-a716-446655440001",
  "status": "awaiting_documents",
  "document_request_date": "2024-03-16T14:30:00Z",
  "document_request": {
    "types": ["medical_records", "insurance_card", "physician_notes"],
    "deadline": "2024-03-20",
    "notes": "Please provide complete medical records and current insurance card"
  },
  "message": "Document request sent successfully"
}
```

## Status Codes

### Success Responses
- `200 OK`: Request successful
- `201 Created`: Resource created successfully

### Error Responses
- `400 Bad Request`: Invalid request data
- `401 Unauthorized`: Authentication required or invalid token
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `422 Unprocessable Entity`: Validation errors
- `500 Internal Server Error`: Server error

## Error Response Format
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request data",
    "details": {
      "field": "coverage_percentage",
      "issue": "Must be between 0 and 100"
    }
  }
}
```

## Data Models

### IVR Request Status Values
- `pending_review`: Initial status when request is submitted
- `in_review`: Request is being reviewed by IVR company
- `approved`: Request has been approved with coverage details
- `rejected`: Request has been rejected
- `awaiting_documents`: Additional documents are required
- `escalated`: Request requires escalation to supervisor

### Priority Levels
- `low`: Standard processing time
- `medium`: Expedited processing
- `high`: Urgent processing required
- `critical`: Emergency processing

### Document Types
- `medical_records`: Complete medical records
- `insurance_card`: Current insurance card copy
- `physician_notes`: Doctor's treatment notes
- `lab_results`: Laboratory test results
- `imaging_reports`: X-ray, MRI, or other imaging reports
- `prior_authorization`: Previous authorization documents

### Rejection Reasons
- `insufficient_documentation`: Missing or incomplete documentation
- `coverage_exclusion`: Treatment not covered by insurance
- `prior_authorization_required`: Prior authorization needed
- `policy_limitations`: Policy limits exceeded
- `medical_necessity`: Medical necessity not established
- `provider_network`: Provider not in network

## Authentication Details

### JWT Token Structure
The JWT token contains the following claims:
```json
{
  "sub": "ivr@healthcare.local",
  "role": "IVR",
  "org": "2276e0c1-6a32-470e-b7e7-dcdbb286d76b",
  "is_superuser": false,
  "exp": 1750040611
}
```

### Required Permissions
- **IVR Company Role**: Full access to all IVR endpoints
- **Admin Role**: Full access to all IVR endpoints
- **Doctor Role**: Read-only access to own IVR requests
- **Other Roles**: No access to IVR endpoints

## Rate Limiting
- **Default Limit**: 100 requests per minute per user
- **Burst Limit**: 200 requests per minute for short bursts
- **Headers**: Rate limit information included in response headers

## Testing

### Test Credentials
```
Username: ivr@healthcare.local
Password: ivr123
Role: IVR Company
```

### Sample Test Request
```bash
# Login to get token
curl -X POST "http://localhost:8000/api/v1/auth/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=ivr@healthcare.local&password=ivr123"

# Use token to get IVR requests
curl -X GET "http://localhost:8000/api/v1/ivr/requests" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json"
```

## Support

### Common Issues
1. **401 Unauthorized**: Check token validity and expiration
2. **404 Not Found**: Verify request ID format (must be UUID)
3. **422 Validation Error**: Check request body format and required fields
4. **500 Server Error**: Check server logs for detailed error information

### Debug Information
- Enable debug logging by setting `LOG_LEVEL=DEBUG`
- Check request IDs in logs for tracing specific requests
- Verify database connectivity and schema migrations

### Contact
- **API Support**: Available during business hours
- **Documentation**: Updated with each release
- **Bug Reports**: Submit through development team
- **Feature Requests**: Submit through product management