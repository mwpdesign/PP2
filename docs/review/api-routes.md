# API Routes (To Understand Current Endpoints)

## File Structure

```plaintext
backend/app/api/
├── users/
│   └── routes.py
├── patients/
│   └── routes.py
├── orders/
│   └── routes.py
├── auth/
│   └── routes.py
```

## Description
- **users/routes.py**: Endpoints for user management, authentication, and role assignment.
- **patients/routes.py**: Endpoints for patient CRUD, PHI access, and territory validation.
- **orders/routes.py**: Endpoints for order creation, status updates, and workflow management.
- **auth/routes.py**: Endpoints for authentication, token issuance, and session management.

## Review Context
API routes define the business logic and available operations. Review for:
- RESTful design and consistency
- Security (auth, territory checks, PHI protection)
- Completeness (all business operations exposed?)
- Error handling and validation 