# Healthcare IVR Platform - System Patterns

## Architecture Overview

### Backend Architecture
1. FastAPI Application Structure
   - Domain-driven design
   - Modular API endpoints
   - Service layer pattern
   - Repository pattern for data access

2. Database Design
   - PostgreSQL with encryption
   - Field-level encryption for PHI
   - Row-level security
   - Audit logging tables

3. Authentication & Authorization
   - Mock authentication service for development
   - JWT token validation with role information
   - Role-based access control (8 distinct user roles)
   - Territory-based permissions
   - Profile endpoint integration with JWT data

### Frontend Architecture
1. React Component Structure
   - Atomic design pattern
   - Container/Presenter pattern
   - Custom hooks for business logic
   - Context for state management

2. Data Flow
   - Redux for global state
   - React Query for API cache
   - WebSocket for real-time updates
   - Local storage for preferences

3. Authentication Flow
   - Login component with form validation
   - JWT token storage and management
   - Role-based dashboard routing
   - Protected route components

## Key Technical Patterns

### Authentication Patterns
1. Backend Authentication
   - Mock authentication service with 8 user roles
   - JWT token generation with role and organization data
   - Profile endpoint that merges JWT data with user profile
   - Secure token validation and user lookup

2. Frontend Authentication
   - AuthContext for global authentication state
   - DashboardRouter for intelligent role-based routing
   - Protected routes with authentication checks
   - Automatic token refresh and logout handling

3. Role-Based Access Control
   - 8 distinct user roles: Admin, Doctor, IVR, Master Distributor, CHP Admin, Distributor, Sales, Shipping and Logistics
   - Role-specific dashboard components
   - Consistent dashboard design pattern across all roles
   - Route protection based on user roles

### Security Patterns
1. Encryption
   - AWS KMS for key management
   - Field-level encryption
   - Secure key rotation
   - Encrypted data transmission

2. Access Control
   - Role hierarchy
   - Territory-based access
   - Permission inheritance
   - Dynamic policy evaluation

3. CORS Configuration
   - Environment-based CORS settings
   - Development vs production configurations
   - Restrictive origins for healthcare compliance
   - Proper header and method limitations

4. Security Middleware
   - SecurityHeadersMiddleware: HIPAA-compliant security headers
   - RequestLoggingMiddleware: Audit trail with unique request IDs
   - PHIProtectionMiddleware: Framework for protecting health information
   - RateLimitingMiddleware: API protection with configurable limits

### Data Management
1. Patient Data
   - Encrypted storage
   - Secure transmission
   - Access logging
   - Version control

2. Order Processing
   - Status machine
   - Audit trail
   - Territory routing
   - Real-time updates

### Integration Patterns
1. External Services
   - Circuit breaker pattern
   - Retry with backoff
   - Timeout handling
   - Error recovery

2. Event Handling
   - WebSocket notifications
   - Event sourcing
   - Message queues
   - Dead letter queues

## Design Decisions

### Technology Choices
1. Backend
   - FastAPI for performance
   - SQLAlchemy for ORM
   - Pydantic for validation
   - Alembic for migrations

2. Frontend
   - React with TypeScript
   - Tailwind CSS
   - React Query
   - WebSocket

3. Infrastructure
   - AWS for cloud services
   - Terraform for IaC
   - Docker for containerization
   - ECS for orchestration

### Authentication Decisions
1. Development Authentication
   - Mock authentication service for local development
   - JWT tokens with role and organization information
   - Profile endpoint that includes role data from JWT
   - 8 distinct user roles for comprehensive testing

2. User Role System
   - **Admin**: System administration and user management
   - **Doctor**: Medical provider access and patient care
   - **IVR**: Interactive Voice Response system operations
   - **Master Distributor**: Regional distribution management
   - **CHP Admin**: Community Health Program administration
   - **Distributor**: Local distribution operations
   - **Sales**: Sales representative tools and customer management
   - **Shipping and Logistics**: Logistics operations and delivery tracking

3. Dashboard Routing
   - Intelligent routing based on user role
   - Consistent dashboard design pattern
   - Role-specific functionality and navigation
   - Secure route protection

### Security Decisions
1. Authentication
   - JWT tokens for session management
   - Role-based access control
   - Secure token validation
   - Profile data integration

2. Data Protection
   - Field-level encryption
   - Access logging
   - Audit trails
   - Secure transmission

3. CORS and Communication Security
   - Environment-specific CORS configurations
   - Restrictive production settings for healthcare compliance
   - Comprehensive security headers for HIPAA compliance
   - Request logging and audit trail for compliance
   - Rate limiting for API protection

## Component Architecture Patterns

### Authentication Components
1. **AuthContext**: Global authentication state management
   - User authentication status
   - JWT token management
   - Role information storage
   - Login/logout functionality

2. **DashboardRouter**: Intelligent role-based routing
   - Analyzes user role from authentication context
   - Routes to appropriate dashboard component
   - Handles authentication failures
   - Provides fallback routing

3. **PrivateRoute**: Protected route wrapper
   - Checks authentication status
   - Redirects unauthenticated users to login
   - Preserves intended destination
   - Handles loading states

4. **AdminRoute**: Admin-specific route protection
   - Additional role-based checks
   - Admin-only access control
   - Proper error handling
   - Secure redirection

### Dashboard Components
1. **Simple Dashboard Pattern**: Consistent design across all roles
   - Header with user information and logout
   - Role-specific welcome message
   - Quick action buttons relevant to role
   - Statistics grid with role-appropriate metrics
   - Consistent styling and layout

2. **Role-Specific Dashboards**:
   - **AdminDashboard**: System administration tools
   - **WoundCareDashboard**: Medical provider interface
   - **SimpleIVRDashboard**: IVR system operations
   - **MasterDistributorDashboard**: Regional distribution management
   - **SimpleCHPAdminDashboard**: Community health program tools
   - **SimpleDistributorDashboard**: Local distribution operations
   - **SimpleSalesDashboard**: Sales representative tools
   - **SimpleLogisticsDashboard**: Logistics and delivery tracking

### Layout Patterns
1. **Flexible Layout System**: Accommodates different user role requirements
   - Reusable sidebar components
   - Customizable navigation items
   - Role-specific branding
   - Responsive design patterns

2. **Navigation Consistency**: Standardized navigation across roles
   - Professional Heroicons for all navigation items
   - Consistent spacing and typography
   - Proper user profile and logout positioning
   - Enterprise-grade appearance

## Error Handling Patterns

### Authentication Errors
1. **Token Validation Failures**: Automatic logout and redirect to login
2. **Role Mismatch**: Appropriate error messages and fallback routing
3. **Network Errors**: Retry mechanisms and user feedback
4. **Session Expiry**: Graceful handling and re-authentication prompts

### Component Error Boundaries
1. **Dashboard Error Boundaries**: Prevent authentication errors from crashing the app
2. **Route Error Handling**: Fallback components for routing failures
3. **API Error Handling**: Consistent error messaging and recovery options

## Server Management Patterns

### Development Environment
1. **Port Management**: Backend on 8000, Frontend on 3000
2. **Process Management**: Clean startup and shutdown procedures
3. **CORS Configuration**: Proper cross-origin request handling
4. **Environment Variables**: Secure configuration management

### Authentication Service
1. **Mock User Database**: Comprehensive user data for all 8 roles
2. **JWT Token Generation**: Secure token creation with role information
3. **Profile Endpoint**: Integration of JWT data with user profile information
4. **Debug Logging**: Enhanced logging for authentication troubleshooting