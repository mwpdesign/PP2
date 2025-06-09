# Healthcare IVR Platform Documentation

## Overview
The Healthcare IVR Platform is a comprehensive HIPAA-compliant system for managing Insurance Verification Requests (IVR) in the wound care industry. The platform supports multi-role authentication, complex approval workflows, and enterprise-grade security features.

## Quick Start
- **Frontend**: React/TypeScript on `http://localhost:3000`
- **Backend**: FastAPI/Python on `http://localhost:8000`
- **Database**: PostgreSQL on `localhost:5432`
- **Test Credentials**: `ivr@healthcare.local` / `ivr123`

## Documentation Structure

### 🚀 Getting Started
- [Development Setup](DEVELOPMENT_SETUP.md) - Local development environment setup
- [Setup Checklist](SETUP_CHECKLIST.md) - Complete setup verification
- [Git Workflow](GIT_WORKFLOW.md) - Development workflow and branching strategy

### 🏗️ Architecture & Implementation
- [Implementation Guide](IMPLEMENTATION_GUIDE.md) - Complete implementation roadmap
- [Backend Capability Inventory](backend-capability-inventory.md) - Backend features and capabilities
- [Project Context](PROJECT_CONTEXT.md) - High-level project overview

### 🔐 Security & Compliance
- [Authentication System](feature-documentation/authentication-system.md) - Complete auth system documentation
- [HIPAA Compliance](HIPAA_COMPLIANCE.md) - HIPAA compliance guidelines and requirements
- [Security Features](feature-documentation/security-features.md) - Security implementation details
- [Key Management](KEY_MANAGEMENT.md) - Encryption and key management

### 📊 Database & Data Management
- [Database Schema](feature-documentation/database-schema-complete.md) - Complete database schema documentation
- [Compliance Checks](feature-documentation/compliance-checks.md) - Data compliance validation

### 🎯 Feature Documentation

#### IVR System (Latest Implementation)
- [IVR Workflow Complete](feature-documentation/ivr-workflow-complete.md) - **NEW** Complete IVR implementation
- [IVR API Documentation](feature-documentation/ivr-api-documentation.md) - **NEW** Complete API reference
- [IVR Navigation Test Results](feature-documentation/ivr-navigation-test-results.md) - Navigation testing
- [IVR Form Integration Report](feature-documentation/ivr-form-integration-report.md) - Form integration details
- [IVR System Integration](feature-documentation/ivr-system-integration.md) - System integration overview

#### User Management & Dashboards
- [User Authentication](feature-documentation/user-authentication.md) - User management system
- [Doctor Dashboard Audit](feature-documentation/doctor-dashboard-audit.md) - Doctor dashboard features
- [Patient Management](feature-documentation/patient-management.md) - Patient management system

#### Order & Workflow Management
- [Order Workflow](feature-documentation/order-workflow.md) - Order management system
- [Order Management](feature-documentation/order-management.md) - Order processing features

#### System Features
- [Analytics and Reporting](feature-documentation/analytics-and-reporting.md) - Analytics capabilities
- [Notifications System](feature-documentation/notifications-system.md) - Notification features
- [Environment Configuration](feature-documentation/environment-configuration-validation.md) - Environment setup

### 🔧 Technical Configuration
- [CORS Middleware Configuration](feature-documentation/cors-middleware-configuration.md) - CORS setup and security
- [Environment Stack Documentation](feature-documentation/environment-stack-documentation.md) - Technology stack details

### 📋 Operations & Maintenance
- [Disaster Recovery](disaster_recovery.md) - Backup and recovery procedures
- [Current Task Status](CURRENT_TASK.md) - Current development status
- [Authentication Fix Summary](AUTHENTICATION_FIX_SUMMARY.md) - Recent authentication fixes
- [Credential Cleanup Report](CREDENTIAL_CLEANUP_REPORT.md) - Security cleanup procedures

### 📚 Review & Quality Assurance
- [Review Documentation](review/) - Code review and QA documentation
- [Design Documents](design-docs/) - System design and architecture
- [Runbooks](runbooks/) - Operational procedures

## Recent Major Updates

### ✅ IVR Workflow Implementation (Latest - Commit d46db50)
**Complete IVR workflow system with authentication, navigation, and approval workflows**

#### Key Features Delivered:
- **Authentication & Security**: Fixed token storage, UUID handling, role-based access
- **IVR Company Dashboard**: Stats cards, review queue, professional UI
- **Review Detail Page**: Three-column layout with comprehensive information
- **Approval Workflow**: Three modal types (Approve, Reject, Request Documents)
- **Navigation System**: 8 routes under `/ivr-company/*` with role-based access
- **Backend Integration**: Complete API endpoints with PostgreSQL database
- **Testing Infrastructure**: Comprehensive test suite with authentication flow

#### Breaking Changes:
- **Route Migration**: All IVR routes moved from `/ivr/*` to `/ivr-company/*`
- **Token Key**: Authentication now uses `authToken` instead of `token`
- **UUID Format**: IVR requests now use proper UUIDs instead of "IVR-001" format

### ✅ Authentication System Overhaul (Phase 11)
**Complete 8-role authentication system with JWT tokens and role-based routing**

#### Features:
- 8 distinct user roles with proper dashboards
- JWT token-based authentication with 30-minute sessions
- Role-based route protection and navigation
- Secure token storage and management
- HIPAA-compliant security headers

### ✅ Smart Auto-Population System (Phase 2)
**Intelligent form completion system reducing IVR completion time by 40-60%**

#### Features:
- Insurance provider auto-complete with coverage information
- Form duplication from previous IVRs
- Medical condition templates
- HIPAA-compliant audit trails
- Professional loading states and user feedback

## User Roles & Access

### 1. Admin (`admin@healthcare.local` / `admin123`)
- **Dashboard**: `/admin/dashboard`
- **Permissions**: Full system administration
- **Features**: User management, system configuration, audit logs

### 2. Doctor (`doctor@healthcare.local` / `doctor123`)
- **Dashboard**: `/doctor/dashboard`
- **Permissions**: Patient management, IVR submission
- **Features**: Patient intake, IVR requests, medical documentation

### 3. IVR Company (`ivr@healthcare.local` / `ivr123`)
- **Dashboard**: `/ivr-company/dashboard`
- **Permissions**: IVR review, approval workflows
- **Features**: Review queue, approval/rejection, document management

### 4. Master Distributor (`distributor@healthcare.local` / `distributor123`)
- **Dashboard**: `/distributor/dashboard`
- **Permissions**: Regional distribution management
- **Features**: Order management, shipping logistics, analytics

### 5. CHP Admin (`chp@healthcare.local` / `chp123`)
- **Dashboard**: `/chp/dashboard`
- **Permissions**: Community Health Program administration
- **Features**: Program management, compliance tracking

### 6. Regional Distributor (`distributor2@healthcare.local` / `distributor123`)
- **Dashboard**: `/distributor-regional/dashboard`
- **Permissions**: Local distribution operations
- **Features**: Local fulfillment, inventory management

### 7. Sales (`sales@healthcare.local` / `sales123`)
- **Dashboard**: `/sales/dashboard`
- **Permissions**: Sales operations
- **Features**: Customer relations, sales tracking

### 8. Logistics (`logistics@healthcare.local` / `logistics123`)
- **Dashboard**: `/logistics/dashboard`
- **Permissions**: Shipping and logistics
- **Features**: Shipment tracking, carrier management

## API Documentation

### Base URLs
- **Frontend**: `http://localhost:3000`
- **Backend API**: `http://localhost:8000/api/v1`
- **API Documentation**: `http://localhost:8000/docs`

### Key Endpoints
- **Authentication**: `POST /api/v1/auth/login`
- **User Profile**: `GET /api/v1/auth/profile`
- **IVR Requests**: `GET /api/v1/ivr/requests`
- **IVR Approval**: `POST /api/v1/ivr/requests/{id}/approve`
- **IVR Rejection**: `POST /api/v1/ivr/requests/{id}/reject`
- **Document Request**: `POST /api/v1/ivr/requests/{id}/request-documents`

## Development Workflow

### Local Development
```bash
# Backend
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Frontend
cd frontend
npm install
npm run dev

# Database
docker-compose up postgres
alembic upgrade head
```

### Testing
```bash
# Backend Tests
cd backend
pytest

# Frontend Tests
cd frontend
npm test

# Integration Tests
npm run test:e2e
```

### Deployment
```bash
# Docker Environment
docker-compose up --build

# AWS Deployment
# See deployment documentation for complete AWS setup
```

## Technology Stack

### Frontend
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React Context + Hooks
- **Routing**: React Router v6
- **HTTP Client**: Fetch API with custom wrapper
- **Build Tool**: Vite

### Backend
- **Framework**: FastAPI (Python 3.9+)
- **Database**: PostgreSQL with asyncpg
- **ORM**: SQLAlchemy (async)
- **Authentication**: JWT tokens
- **Validation**: Pydantic
- **Migrations**: Alembic

### Infrastructure
- **Database**: PostgreSQL 14+
- **Containerization**: Docker & Docker Compose
- **Cloud Platform**: AWS (ECS, RDS, S3)
- **Monitoring**: CloudWatch
- **Security**: AWS KMS, HIPAA compliance

## Security Features

### HIPAA Compliance
- PHI encryption at rest and in transit
- Comprehensive audit logging
- Role-based access control
- Secure session management
- Data masking in non-production environments

### Authentication Security
- JWT token-based authentication
- 30-minute session timeout
- Automatic token refresh
- Secure token storage
- Role-based route protection

### API Security
- CORS configuration
- Rate limiting
- Request logging
- Security headers
- Input validation

## Performance Metrics

### Current Performance
- **Authentication**: < 200ms response time
- **Dashboard Load**: < 500ms initial load
- **API Responses**: < 100ms average
- **Database Queries**: Optimized with proper indexing

### Scalability
- Horizontal scaling with Docker containers
- Database connection pooling
- Async request handling
- Efficient caching strategies

## Support & Maintenance

### Regular Tasks
- Monitor authentication logs
- Update dependencies
- Review security configurations
- Performance monitoring
- Database maintenance

### Troubleshooting
- Check browser console for frontend errors
- Verify backend server status on port 8000
- Confirm database connectivity
- Review authentication token storage

### Contact Information
- **Development Team**: Available for technical support
- **Security Team**: HIPAA compliance and security issues
- **Infrastructure Team**: Deployment and scaling support

## Contributing

### Development Guidelines
- Follow existing code patterns
- Write comprehensive tests
- Update documentation
- Follow security best practices
- Maintain HIPAA compliance

### Code Review Process
- All changes require pull request review
- Security review for authentication changes
- Performance review for database changes
- Documentation updates required

## License & Compliance

### HIPAA Compliance
- All PHI handling follows HIPAA guidelines
- Comprehensive audit trails maintained
- Encryption requirements met
- Access controls properly implemented

### Security Standards
- Regular security audits
- Penetration testing
- Vulnerability assessments
- Compliance monitoring

---

**Last Updated**: December 2024
**Version**: 1.0.0
**Commit**: d46db50 (IVR Workflow Complete Implementation)