# Authentication System

## Overview
The authentication system provides secure, HIPAA-compliant access control with territory-based isolation and multi-factor authentication.

## Core Features

### User Authentication
```typescript
interface AuthRequest {
  username: string;
  password: string;
  territory_id: string;
  mfa_token?: string;
}

interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: "Bearer";
  expires_in: number;
  territory_id: string;
}
```

### Multi-Factor Authentication
- Required for all PHI access
- Territory-specific tokens
- Device tracking
- Session management

### Session Management
```typescript
interface SessionInfo {
  user_id: string;
  territory_id: string;
  device_id: string;
  last_activity: string;
  permissions: string[];
  mfa_verified: boolean;
}
```

## Implementation

### AWS Cognito Integration
```python
class CognitoService:
    async def authenticate_user(
        self,
        username: str,
        password: str,
        territory_id: str
    ) -> AuthResponse:
        # Validate territory access
        await self.validate_territory_access(username, territory_id)
        
        # Authenticate with Cognito
        auth_response = await cognito.authenticate(
            username=username,
            password=password
        )
        
        # Create session
        session = await self.create_session(
            user_id=auth_response.user_id,
            territory_id=territory_id
        )
        
        return AuthResponse(
            access_token=auth_response.access_token,
            refresh_token=auth_response.refresh_token,
            territory_id=territory_id
        )
```

### Territory Validation
```python
async def validate_territory_access(
    self,
    user_id: str,
    territory_id: str
) -> bool:
    user_territories = await self.get_user_territories(user_id)
    if territory_id not in user_territories:
        raise TerritoryAccessDenied(
            f"User {user_id} does not have access to territory {territory_id}"
        )
    return True
```

## Security Features

### Token Management
- JWT tokens with territory claims
- Automatic token refresh
- Token revocation on security events
- Session timeout management

### Access Control
```python
@requires_territory
@requires_permission(['PHI_READ'])
async def get_patient_data(
    patient_id: str,
    territory_id: str,
    current_user: User
) -> Patient:
    audit_log.record_phi_access(
        user_id=current_user.id,
        patient_id=patient_id,
        territory_id=territory_id
    )
    return await patient_service.get_patient(patient_id, territory_id)
```

## Frontend Integration

### Auth Context
```typescript
interface AuthContext {
  user: User | null;
  territory: Territory | null;
  isAuthenticated: boolean;
  isMFARequired: boolean;
  login: (credentials: AuthRequest) => Promise<void>;
  logout: () => Promise<void>;
  switchTerritory: (territoryId: string) => Promise<void>;
}

const AuthProvider: React.FC = ({ children }) => {
  // Implementation
};
```

### Protected Routes
```typescript
const ProtectedRoute: React.FC<{
  requiredPermissions: string[];
}> = ({ requiredPermissions, children }) => {
  const { user, territory } = useAuth();
  
  if (!user || !territory) {
    return <Navigate to="/login" />;
  }
  
  if (!hasPermissions(user, requiredPermissions)) {
    return <Navigate to="/unauthorized" />;
  }
  
  return <>{children}</>;
};
```

## Error Handling

### Common Errors
```json
{
  "status": "error",
  "error": {
    "code": "AUTHENTICATION_FAILED",
    "message": "Invalid credentials",
    "details": {
      "requires_mfa": true
    }
  }
}
```

### Error Codes
- `AUTHENTICATION_FAILED`: Invalid credentials
- `MFA_REQUIRED`: MFA verification needed
- `TERRITORY_ACCESS_DENIED`: No access to territory
- `SESSION_EXPIRED`: User session expired
- `INVALID_TOKEN`: Invalid or expired token

## Audit Logging
- All authentication attempts
- Territory switches
- MFA verifications
- Session management events
- Permission changes

## Rate Limiting
- Login attempts: 5 per minute per IP
- MFA attempts: 3 per minute per user
- Token refresh: 10 per minute per user
- Territory switches: 10 per minute per user 