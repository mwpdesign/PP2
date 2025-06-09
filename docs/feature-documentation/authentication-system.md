# Authentication System Documentation

## Overview
The Healthcare IVR Platform implements a comprehensive JWT-based authentication system with role-based access control, supporting 8 distinct user roles with secure token management and session handling.

## Architecture

### Authentication Flow
1. **User Login**: Credentials submitted to `/api/v1/auth/login`
2. **Token Generation**: JWT token created with user role and organization
3. **Token Storage**: Secure storage in localStorage with key `authToken`
4. **API Requests**: Bearer token included in Authorization header
5. **Token Validation**: Server validates token on each request
6. **Role-Based Routing**: Frontend routes users to appropriate dashboards
7. **Session Management**: 30-minute session timeout with activity tracking

### Security Features
- JWT token-based authentication
- Role-based access control (RBAC)
- Secure token storage and management
- Session timeout and automatic logout
- HIPAA-compliant security headers
- Request logging and audit trails

## User Roles

### 1. Admin Role
- **Username**: `admin@healthcare.local`
- **Password**: `admin123`
- **Dashboard**: `/admin/dashboard`
- **Permissions**: Full system administration access
- **Features**: User management, system configuration, audit logs

### 2. Doctor Role
- **Username**: `doctor@healthcare.local`
- **Password**: `doctor123`
- **Dashboard**: `/doctor/dashboard`
- **Permissions**: Patient management, IVR submission, medical records
- **Features**: Patient intake, IVR requests, medical documentation

### 3. IVR Company Role
- **Username**: `ivr@healthcare.local`
- **Password**: `ivr123`
- **Dashboard**: `/ivr-company/dashboard`
- **Permissions**: IVR review, approval workflows, document requests
- **Features**: Review queue, approval/rejection, document management

### 4. Master Distributor Role
- **Username**: `distributor@healthcare.local`
- **Password**: `distributor123`
- **Dashboard**: `/distributor/dashboard`
- **Permissions**: Regional distribution management, order oversight
- **Features**: Order management, shipping logistics, performance analytics

### 5. CHP Admin Role
- **Username**: `chp@healthcare.local`
- **Password**: `chp123`
- **Dashboard**: `/chp/dashboard`
- **Permissions**: Community Health Program administration
- **Features**: Program management, compliance tracking, reporting

### 6. Regional Distributor Role
- **Username**: `distributor2@healthcare.local`
- **Password**: `distributor123`
- **Dashboard**: `/distributor-regional/dashboard`
- **Permissions**: Local distribution operations
- **Features**: Local order fulfillment, inventory management

### 7. Sales Role
- **Username**: `sales@healthcare.local`
- **Password**: `sales123`
- **Dashboard**: `/sales/dashboard`
- **Permissions**: Sales operations and customer management
- **Features**: Customer relations, sales tracking, lead management

### 8. Shipping and Logistics Role
- **Username**: `logistics@healthcare.local`
- **Password**: `logistics123`
- **Dashboard**: `/logistics/dashboard`
- **Permissions**: Shipping and logistics operations
- **Features**: Shipment tracking, carrier management, delivery coordination

## Technical Implementation

### JWT Token Structure
```json
{
  "sub": "ivr@healthcare.local",
  "role": "IVR",
  "org": "2276e0c1-6a32-470e-b7e7-dcdbb286d76b",
  "is_superuser": false,
  "exp": 1750040611,
  "iat": 1750037011
}
```

### Token Claims
- **sub**: Subject (username/email)
- **role**: User role for authorization
- **org**: Organization UUID for multi-tenancy
- **is_superuser**: Administrative privileges flag
- **exp**: Token expiration timestamp
- **iat**: Token issued at timestamp

### Authentication Service
```typescript
class AuthenticationService {
  private static instance: AuthenticationService;
  private baseURL = 'http://localhost:8000/api/v1';

  // Singleton pattern for service instance
  public static getInstance(): AuthenticationService;

  // Core authentication methods
  public async login(username: string, password: string): Promise<LoginResponse>;
  public async logout(): Promise<void>;
  public async refreshToken(): Promise<string>;
  public async getCurrentUser(): Promise<UserProfile>;

  // Token management
  public getToken(): string | null;
  public isAuthenticated(): boolean;
  public isTokenExpired(): boolean;

  // Session management
  public startSessionTimeout(): void;
  public resetSessionTimeout(): void;
  public clearSessionTimeout(): void;
}
```

### API Client Integration
```typescript
class APIClient {
  private authService: AuthenticationService;

  // Automatic token injection
  private async makeRequest(config: RequestConfig): Promise<Response> {
    const token = this.authService.getToken();
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return fetch(config.url, config);
  }

  // Automatic token refresh on 401
  private async handleUnauthorized(): Promise<void> {
    await this.authService.refreshToken();
    // Retry original request
  }
}
```

## Frontend Integration

### AuthContext Provider
```typescript
interface AuthContextType {
  user: UserProfile | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
```

### Route Protection
```typescript
const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <LoadingSpinner />;
  if (!isAuthenticated) return <Navigate to="/login" />;

  return <>{children}</>;
};
```

### Role-Based Routing
```typescript
const DashboardRouter: React.FC = () => {
  const { user } = useAuth();

  switch (user?.role) {
    case 'ADMIN': return <Navigate to="/admin/dashboard" />;
    case 'DOCTOR': return <Navigate to="/doctor/dashboard" />;
    case 'IVR': return <Navigate to="/ivr-company/dashboard" />;
    case 'MASTER_DISTRIBUTOR': return <Navigate to="/distributor/dashboard" />;
    case 'CHP_ADMIN': return <Navigate to="/chp/dashboard" />;
    case 'DISTRIBUTOR': return <Navigate to="/distributor-regional/dashboard" />;
    case 'SALES': return <Navigate to="/sales/dashboard" />;
    case 'LOGISTICS': return <Navigate to="/logistics/dashboard" />;
    default: return <Navigate to="/login" />;
  }
};
```

## Backend Implementation

### Authentication Endpoints

#### Login Endpoint
```python
@router.post("/login", response_model=TokenResponse)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db)
) -> TokenResponse:
    user = await authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    access_token = create_access_token(
        data={"sub": user.email, "role": user.role, "org": str(user.organization_id)}
    )
    return TokenResponse(access_token=access_token, token_type="bearer")
```

#### Profile Endpoint
```python
@router.get("/profile", response_model=UserProfile)
async def get_profile(
    current_user: User = Depends(get_current_user)
) -> UserProfile:
    return UserProfile(
        id=current_user.id,
        email=current_user.email,
        first_name=current_user.first_name,
        last_name=current_user.last_name,
        role=current_user.role,
        organization_id=current_user.organization_id
    )
```

### JWT Token Management
```python
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=30)

    to_encode.update({"exp": expire, "iat": datetime.utcnow()})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        role: str = payload.get("role")
        if username is None or role is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        return TokenData(username=username, role=role)
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
```

### Role-Based Access Control
```python
def require_role(allowed_roles: List[str]):
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            current_user = kwargs.get('current_user')
            if not current_user or current_user.role not in allowed_roles:
                raise HTTPException(status_code=403, detail="Insufficient permissions")
            return await func(*args, **kwargs)
        return wrapper
    return decorator

# Usage example
@router.get("/ivr/requests")
@require_role(["IVR", "ADMIN"])
async def get_ivr_requests(current_user: User = Depends(get_current_user)):
    # Only IVR and ADMIN users can access this endpoint
    pass
```

## Security Features

### Token Security
- **Secure Storage**: Tokens stored in localStorage with secure key
- **Expiration**: 30-minute token expiration for security
- **Refresh Mechanism**: Automatic token refresh on expiration
- **Logout Cleanup**: Complete token cleanup on logout

### Session Management
- **Activity Tracking**: User activity monitoring for session timeout
- **Automatic Logout**: Session timeout after 30 minutes of inactivity
- **Session Reset**: Activity resets session timeout
- **Secure Cleanup**: Complete session data cleanup on logout

### HIPAA Compliance
- **Audit Logging**: All authentication events logged
- **Secure Headers**: HIPAA-compliant security headers
- **Data Protection**: PHI access logging and protection
- **Access Control**: Strict role-based access control

## Configuration

### Environment Variables
```bash
# JWT Configuration
JWT_SECRET_KEY=your-secret-key-here
JWT_ALGORITHM=HS256
JWT_EXPIRATION_MINUTES=30

# Authentication Settings
AUTH_TOKEN_STORAGE_KEY=authToken
SESSION_TIMEOUT_MINUTES=30

# CORS Configuration
BACKEND_CORS_ORIGINS=["http://localhost:3000"]
DEV_CORS_ORIGINS=["http://localhost:3000", "http://127.0.0.1:3000"]
```

### Frontend Configuration
```typescript
export const AUTH_CONFIG = {
  baseURL: 'http://localhost:8000/api/v1',
  tokenStorageKey: 'authToken',
  sessionTimeoutMinutes: 30,
  refreshThresholdMinutes: 5
};
```

## Testing

### Authentication Testing
```typescript
// Test login flow
const testLogin = async () => {
  const authService = AuthenticationService.getInstance();

  try {
    await authService.login('ivr@healthcare.local', 'ivr123');
    console.log('Login successful');

    const user = await authService.getCurrentUser();
    console.log('User profile:', user);

    const isAuth = authService.isAuthenticated();
    console.log('Is authenticated:', isAuth);

  } catch (error) {
    console.error('Login failed:', error);
  }
};
```

### Role Testing
```bash
# Test each role login
curl -X POST "http://localhost:8000/api/v1/auth/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin@healthcare.local&password=admin123"

curl -X POST "http://localhost:8000/api/v1/auth/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=doctor@healthcare.local&password=doctor123"

curl -X POST "http://localhost:8000/api/v1/auth/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=ivr@healthcare.local&password=ivr123"
```

## Troubleshooting

### Common Issues

#### 1. Token Not Found
**Problem**: `localStorage.getItem('token')` returns null
**Solution**: Use correct key `localStorage.getItem('authToken')`

#### 2. 401 Unauthorized
**Problem**: API calls return 401 status
**Solutions**:
- Check token expiration
- Verify token format (Bearer prefix)
- Confirm user has required role permissions

#### 3. Route Conflicts
**Problem**: Users redirected to wrong dashboard
**Solutions**:
- Check route order in App.tsx
- Verify DashboardRouter logic
- Confirm role mapping in routing

#### 4. Session Timeout Issues
**Problem**: Unexpected logouts
**Solutions**:
- Check session timeout configuration
- Verify activity tracking
- Review token expiration settings

### Debug Information
```typescript
// Debug authentication state
const debugAuth = () => {
  const token = localStorage.getItem('authToken');
  console.log('Token:', token);

  if (token) {
    const payload = JSON.parse(atob(token.split('.')[1]));
    console.log('Token payload:', payload);
    console.log('Token expires:', new Date(payload.exp * 1000));
  }

  const authService = AuthenticationService.getInstance();
  console.log('Is authenticated:', authService.isAuthenticated());
  console.log('Is token expired:', authService.isTokenExpired());
};
```

## Maintenance

### Regular Tasks
- Monitor token expiration and refresh rates
- Review authentication logs for security issues
- Update test credentials periodically
- Audit role permissions and access patterns

### Security Updates
- Rotate JWT secret keys regularly
- Update password policies as needed
- Review and update CORS configurations
- Monitor for authentication vulnerabilities

### Performance Monitoring
- Track authentication response times
- Monitor token refresh frequency
- Analyze session timeout patterns
- Review authentication error rates

## Support

### Documentation
- API documentation available at `/docs`
- Frontend component documentation in codebase
- Security procedures documented separately
- HIPAA compliance documentation maintained

### Contact Information
- **Technical Support**: Development team
- **Security Issues**: Security team
- **Access Requests**: System administrators
- **Bug Reports**: Development team through issue tracking