# API Documentation

## Overview
This directory contains comprehensive documentation for the Healthcare IVR Platform APIs.

## Structure
- `auth/` - Authentication and authorization endpoints
- `orders/` - Order management and processing
- `patients/` - Patient data management
- `providers/` - Healthcare provider operations
- `analytics/` - Reporting and analytics
- `notifications/` - Real-time notification system

## Common Patterns
1. Authentication
   - All endpoints require JWT token
   - Territory validation in headers
   - HIPAA compliance checks

2. Response Format
   ```json
   {
     "status": "success|error",
     "data": {},
     "message": "string",
     "errors": []
   }
   ```

3. Error Handling
   - Standard HTTP status codes
   - Detailed error messages
   - Error tracking IDs

4. Rate Limiting
   - Per-endpoint limits
   - Territory-based quotas
   - Burst protection

## Security Requirements
- All PHI must be encrypted
- Access logging required
- Territory validation
- Role-based access 