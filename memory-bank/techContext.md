# Healthcare IVR Platform - Technical Context

## Technology Stack

### Frontend
- React 18.x
- TypeScript 5.x
- Tailwind CSS 3.x
- React Query
- Redux Toolkit
- WebSocket
- Jest + React Testing Library
- React Router v6 for routing
- Heroicons for consistent iconography

### Backend
- Python 3.12
- FastAPI
- SQLAlchemy
- Pydantic
- Alembic
- pytest
- uvicorn
- Mock Authentication Service (development)

### Database
- PostgreSQL 15
- Redis for caching
- AWS RDS (production)
- AWS ElastiCache (production)

### Cloud Infrastructure
- AWS Services:
  - Cognito (production)
  - KMS
  - S3
  - Lambda
  - ECS Fargate
  - CloudWatch
  - CloudTrail

### DevOps
- Docker
- Terraform
- GitHub Actions
- AWS CodePipeline

## Development Setup

### Prerequisites
1. Python 3.12+
2. Node.js 18+
3. Docker Desktop
4. AWS CLI
5. Terraform CLI
6. PostgreSQL 15+

### Local Environment
1. Backend Setup
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   export AUTH_MODE=local
   export ENVIRONMENT=development
   export DEBUG=true
   python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   ```

2. Frontend Setup
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

3. Database Setup
   ```bash
   docker-compose up -d db
   alembic upgrade head
   ```

### Current Development Configuration
- **Backend Port**: 8000
- **Frontend Port**: 3000
- **Authentication Mode**: Mock authentication service
- **Environment**: Development with debug logging enabled
- **CORS**: Configured for localhost:3000 ↔ localhost:8000

### Environment Variables
- Backend (.env):
  - AUTH_MODE=local
  - ENVIRONMENT=development
  - DEBUG=true
  - DATABASE_URL
  - JWT_SECRET

- Frontend (.env):
  - REACT_APP_API_URL=http://localhost:8000
  - REACT_APP_WS_URL=ws://localhost:8000

## Authentication System

### Current Implementation (Development)
1. **Mock Authentication Service**
   - 8 distinct user roles
   - JWT token generation with role information
   - Profile endpoint integration
   - Comprehensive user database for testing

2. **User Roles**
   - Admin: System administration
   - Doctor: Medical provider access
   - IVR: Interactive Voice Response system
   - Master Distributor: Regional distribution management
   - CHP Admin: Community Health Program administration
   - Distributor: Local distribution operations
   - Sales: Sales representative tools
   - Shipping and Logistics: Logistics operations

3. **Authentication Flow**
   - Login → JWT generation → Profile fetch → Role-based routing
   - JWT tokens include role and organization information
   - Profile endpoint returns role data for frontend routing

### Production Migration Path
- AWS Cognito integration planned
- Role-based access control ready for production
- Territory-based permissions framework in place

## Technical Constraints

### Security Requirements
1. HIPAA Compliance
   - Field-level encryption
   - Audit logging
   - Access control
   - Secure transmission

2. Authentication
   - JWT token validation
   - Role-based access control
   - Secure session management
   - Protected route components

### Performance Requirements
1. API Response Times
   - 95th percentile < 500ms
   - 99th percentile < 1s

2. Real-time Updates
   - WebSocket latency < 100ms
   - Connection recovery < 2s

### Scalability Requirements
1. Database
   - Multi-AZ deployment
   - Read replicas
   - Connection pooling

2. Application
   - Horizontal scaling
   - Load balancing
   - Cache optimization

## Dependencies

### Core Dependencies
- aws-sdk
- cryptography
- sqlalchemy
- fastapi
- react
- typescript
- tailwindcss
- react-router-dom
- @heroicons/react

### Development Dependencies
- pytest
- jest
- eslint
- prettier
- black
- flake8

### Infrastructure Dependencies
- terraform-aws-provider
- docker
- nginx
- redis

## Component Architecture

### Frontend Components
1. **Authentication Components**
   - AuthContext: Global authentication state
   - DashboardRouter: Role-based routing logic
   - PrivateRoute: Protected route wrapper
   - AdminRoute: Admin-specific route protection

2. **Dashboard Components**
   - Simple dashboard pattern for all 8 user roles
   - Consistent design with Tailwind CSS
   - Role-specific functionality and navigation

3. **Layout Components**
   - Flexible sidebar system
   - Responsive design patterns
   - Professional Heroicons integration

### Backend Services
1. **Authentication Services**
   - Mock authentication service
   - JWT token generation and validation
   - User profile management
   - Role-based access control

2. **API Structure**
   - FastAPI with modular endpoints
   - Pydantic validation
   - Comprehensive error handling

## Development Workflow

### Server Management
1. **Backend Server**
   ```bash
   cd backend
   export AUTH_MODE=local && export ENVIRONMENT=development && export DEBUG=true
   python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   ```

2. **Frontend Server**
   ```bash
   cd frontend
   npm run dev
   ```

3. **Process Management**
   - Clean server startup/shutdown procedures
   - Port conflict resolution
   - CORS configuration for development

### Testing Strategy
1. **Authentication Testing**
   - All 8 user credentials verified
   - JWT token generation and validation
   - Role-based routing verification
   - End-to-end authentication flow

2. **Component Testing**
   - Dashboard component consistency
   - Route protection validation
   - Error boundary testing

### Debugging Tools
1. **Backend Logging**
   - Enhanced authentication service logging
   - JWT token validation debugging
   - Profile endpoint request/response logging

2. **Frontend Debugging**
   - AuthContext state monitoring
   - Role information persistence tracking
   - Routing decision logging

## Known Technical Debt

### Resolved Issues ✅
- ✅ Backend profile endpoint role information bug
- ✅ AdminRoute component routing bug
- ✅ JWT role persistence in frontend
- ✅ CORS configuration for development
- ✅ Server port management

### Current Limitations
- Mock authentication service (development only)
- Simple dashboard components (ready for enhancement)
- Basic role-based routing (expandable for complex permissions)

### Future Technical Improvements
- AWS Cognito integration for production
- Enhanced role-based permissions system
- Advanced dashboard features
- Multi-factor authentication support
- Territory isolation implementation