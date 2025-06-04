# Local Development Authentication Setup

## Overview

The Healthcare IVR Platform now has a fully functional local development authentication system that follows the Local Development Authentication Strategy principles:

- ✅ **No external service dependencies** - Uses in-memory mock users
- ✅ **File-based user management** - Mock users defined in `mock_auth_service.py`
- ✅ **Simulated token generation** - JWT tokens generated locally
- ✅ **Multiple user roles** - Admin, Doctor, and IVR roles supported
- ✅ **Clear separation** - Completely separate from production authentication

## Quick Start

### 1. Environment Setup

Set these environment variables for local development:

```bash
export AUTH_MODE=local
export ENVIRONMENT=development
export DEBUG=true
```

### 2. Available Mock Users

| Email | Password | Role | Permissions |
|-------|----------|------|-------------|
| `admin@healthcare.local` | `admin123` | Admin | Full access (superuser) |
| `doctor@healthcare.local` | `doctor123` | Doctor | Patient and order management |
| `ivr@healthcare.local` | `ivr123` | IVR | IVR system access |

### 3. Start the Server

```bash
cd backend
export AUTH_MODE=local && export ENVIRONMENT=development && export DEBUG=true
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### 4. Test Authentication

```bash
# Test admin login
curl -X POST "http://localhost:8000/api/v1/auth/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin@healthcare.local&password=admin123"

# Test doctor login
curl -X POST "http://localhost:8000/api/v1/auth/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=doctor@healthcare.local&password=doctor123"
```

## Technical Implementation

### Authentication Flow

1. **Login Request** → `POST /api/v1/auth/login`
2. **Route Handler** → `backend/app/api/auth/routes.py`
3. **Authentication Logic** → `backend/app/core/security.py:authenticate_user()`
4. **Mock Service Check** → `backend/app/services/mock_auth_service.py`
5. **Token Generation** → JWT token with user data and role
6. **Response** → Access token for frontend use

### Key Files

- **`app/services/mock_auth_service.py`** - Mock user database and authentication logic
- **`app/core/security.py`** - Enhanced `authenticate_user()` function with mock support
- **`app/api/auth/routes.py`** - Login endpoint with comprehensive logging
- **`app/core/config/__init__.py`** - Configuration settings for AUTH_MODE

### Security Features

- **Environment Protection**: Mock authentication only works in development mode
- **Comprehensive Logging**: Detailed logs for debugging authentication issues
- **Role-Based Access**: Different permission levels for each user type
- **Token Validation**: Standard JWT tokens with expiration
- **Fallback Support**: Falls back to database authentication if mock fails

## Debugging

### Enable Detailed Logging

The system includes comprehensive logging. Check logs for:

```
INFO - Authentication attempt for user: admin@healthcare.local
INFO - AUTH_MODE: local
INFO - Environment: development
INFO - Using mock authentication service
INFO - Mock authentication successful for: admin@healthcare.local
INFO - Authentication successful for user: admin@healthcare.local
INFO - Access token created successfully for user: admin@healthcare.local
```

### Test Script

Run the authentication test script:

```bash
cd backend
python test_auth.py
```

### Common Issues

1. **"Mock authentication attempted in non-development environment"**
   - Solution: Set `ENVIRONMENT=development` and `AUTH_MODE=local`

2. **"Authentication failed"**
   - Check exact email and password match
   - Verify environment variables are set
   - Check server logs for detailed error messages

3. **"Could not validate credentials"**
   - Ensure JWT token is properly formatted
   - Check SECRET_KEY configuration

## Frontend Integration

The frontend should send login requests to:

```javascript
POST /api/v1/auth/login
Content-Type: application/x-www-form-urlencoded
Body: username=admin@healthcare.local&password=admin123
```

Expected response:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "refresh_token": null
}
```

## Production Separation

- Mock authentication is **automatically disabled** in production
- Set `AUTH_MODE=cognito` and `ENVIRONMENT=production` for AWS Cognito
- Mock users are **never accessible** outside development environment
- Database authentication serves as fallback in all environments

## Testing Verification

✅ **Mock Service Tests**: All mock users authenticate correctly
✅ **Login Endpoint Tests**: HTTP 200 for valid credentials, HTTP 401 for invalid
✅ **Token Generation**: Valid JWT tokens created with proper user data
✅ **Role Support**: Admin, Doctor, and IVR roles working
✅ **Error Handling**: Proper error responses for invalid credentials
✅ **Environment Safety**: Mock auth disabled outside development

## Next Steps

1. **Frontend Integration**: Update frontend login component to use these credentials
2. **Role Testing**: Verify role-based access control in frontend
3. **Token Storage**: Implement secure token storage in frontend
4. **Auto-login**: Consider auto-login for development convenience

---

**Status**: ✅ **FULLY FUNCTIONAL** - Local development authentication is working perfectly!