# Healthcare IVR Platform

A HIPAA-compliant Interactive Voice Response (IVR) platform for healthcare providers with enterprise-grade security, multi-role authentication, and comprehensive order management workflows.

## 🚀 Quick Start

**Get up and running in under 5 minutes:**

```bash
# 1. Clone the repository
git clone https://github.com/your-org/healthcare-ivr-platform.git
cd healthcare-ivr-platform

# 2. Run automated setup (handles everything)
chmod +x scripts/setup_dev_env.sh
./scripts/setup_dev_env.sh

# 3. Start development servers
./start-local.sh
```

**Access the application:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs
- Health Check: http://localhost:8000/health

## ✅ Current Status

**Backend Complete & Operational:**
- ✅ FastAPI server running on port 8000
- ✅ Authentication system with 8 user roles
- ✅ HIPAA-compliant security middleware
- ✅ CORS configuration for development
- ✅ Encryption services and audit logging
- ✅ Mock authentication service for development

**Frontend Authentication Ready:**
- ✅ React + TypeScript + Tailwind CSS
- ✅ Role-based dashboard routing
- ✅ Professional enterprise UI design
- ✅ Complete authentication flow

## 🔐 Authentication System

The platform includes a comprehensive 8-role authentication system:

| Role | Email | Password | Dashboard |
|------|-------|----------|-----------|
| **Admin** | `admin@healthcare.local` | `admin123` | System administration |
| **Doctor** | `doctor@healthcare.local` | `doctor123` | Medical provider access |
| **IVR** | `ivr@healthcare.local` | `ivr123` | Interactive Voice Response |
| **Master Distributor** | `distributor@healthcare.local` | `distributor123` | Regional distribution |
| **CHP Admin** | `chp@healthcare.local` | `chp123` | Community Health Program |
| **Distributor** | `distributor2@healthcare.local` | `distributor123` | Local distribution |
| **Sales** | `sales@healthcare.local` | `sales123` | Sales representative |
| **Logistics** | `logistics@healthcare.local` | `logistics123` | Shipping & logistics |

## 🛠️ Development Setup

### Prerequisites

- **Python 3.12+** (for backend)
- **Node.js 18+** (for frontend)
- **PostgreSQL 15+** (for database)
- **Git** (for version control)

### Automated Setup

The automated setup script handles all configuration:

```bash
# Run the setup script
./scripts/setup_dev_env.sh
```

**What the script does:**
- ✅ Checks all prerequisites
- ✅ Creates Python virtual environment
- ✅ Installs backend dependencies
- ✅ Installs frontend dependencies
- ✅ Sets up PostgreSQL database
- ✅ Configures environment variables
- ✅ Initializes development configuration

### Manual Setup (Alternative)

If you prefer manual setup:

#### 1. Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

#### 2. Frontend Setup
```bash
cd frontend
npm install
```

#### 3. Database Setup
```bash
# Install PostgreSQL and create database
createdb healthcare_ivr
```

#### 4. Environment Configuration
```bash
# Copy environment template
cp env.example .env
# Edit .env with your local settings
```

### Development Workflow

#### Starting the Application

**Option 1: Local Development (Recommended)**
```bash
# Start both backend and frontend locally
./start-local.sh
```

**Option 2: Hybrid Development**
```bash
# Backend in Docker, frontend local
./start-hybrid-dev.sh
```

**Option 3: Full Docker**
```bash
# Everything in Docker
docker-compose up --build
```

#### Individual Services

**Backend Only:**
```bash
cd backend
export AUTH_MODE=local
export ENVIRONMENT=development
export DEBUG=true
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

**Frontend Only:**
```bash
cd frontend
npm run dev
```

## 🏗️ Architecture

### Technology Stack

**Backend:**
- Python 3.12 + FastAPI
- SQLAlchemy + PostgreSQL
- JWT Authentication
- HIPAA-compliant encryption
- Comprehensive audit logging

**Frontend:**
- React 18 + TypeScript
- Tailwind CSS + Heroicons
- React Router v6
- Role-based routing
- Professional enterprise design

**Security:**
- Field-level PHI encryption
- CORS configuration
- Security headers middleware
- Rate limiting
- Request logging with audit trails

### Project Structure

```
healthcare-ivr-platform/
├── backend/                 # Python FastAPI backend
│   ├── app/                # Application code
│   │   ├── api/           # API endpoints
│   │   ├── core/          # Core functionality
│   │   ├── models/        # Database models
│   │   ├── schemas/       # Pydantic schemas
│   │   └── services/      # Business logic
│   ├── tests/             # Test suites
│   └── requirements.txt   # Python dependencies
├── frontend/              # React TypeScript frontend
│   ├── src/              # Source code
│   │   ├── components/   # React components
│   │   ├── pages/        # Page components
│   │   ├── contexts/     # React contexts
│   │   └── types/        # TypeScript types
│   └── package.json      # Node dependencies
├── scripts/              # Development scripts
├── memory-bank/          # Project documentation
└── docker-compose.yml    # Docker configuration
```

## 🧪 Testing

### Backend Tests
```bash
cd backend
pytest
```

### Frontend Tests
```bash
cd frontend
npm test
```

### End-to-End Testing
```bash
# Test authentication flow for all user roles
# All 8 user credentials verified working
```

## 🔧 Development Tools

### Code Quality

**Backend:**
```bash
cd backend
black .          # Code formatting
flake8 .         # Linting
mypy .           # Type checking
```

**Frontend:**
```bash
cd frontend
npm run lint     # ESLint
npm run format   # Prettier
```

### Database Management

```bash
# Run migrations
cd backend
alembic upgrade head

# Create new migration
alembic revision --autogenerate -m "Description"
```

## 📊 Monitoring & Debugging

### Health Checks
- Backend Health: http://localhost:8000/health
- CORS Test: http://localhost:8000/cors-test

### Logs
```bash
# Backend logs (when running locally)
tail -f backend/logs/app.log

# Docker logs
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Development Endpoints
- API Documentation: http://localhost:8000/docs
- Interactive API: http://localhost:8000/redoc
- Debug Authentication: http://localhost:8000/api/v1/auth/debug/mock-auth

## 🛡️ Security & Compliance

### HIPAA Compliance Features
- ✅ Field-level PHI encryption
- ✅ Comprehensive audit logging
- ✅ Role-based access control
- ✅ Secure communication (HTTPS in production)
- ✅ Security headers middleware
- ✅ Rate limiting and request monitoring

### Security Headers
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- X-XSS-Protection: 1; mode=block
- Referrer-Policy: strict-origin-when-cross-origin
- Content-Security-Policy: Comprehensive CSP

### Environment Security
- ✅ Environment-based CORS configuration
- ✅ Separate development/production settings
- ✅ No hardcoded secrets
- ✅ JWT token validation
- ✅ Encrypted data at rest

## 🚀 Deployment

### Production Checklist
- [ ] Update environment variables in production
- [ ] Configure AWS Cognito (replace mock auth)
- [ ] Set up production database
- [ ] Configure HTTPS/SSL certificates
- [ ] Enable production CORS origins
- [ ] Set up monitoring and alerting

### AWS Deployment
```bash
# Build and deploy to AWS ECS/Fargate
# (Deployment scripts in development)
```

## 📚 Documentation

### API Documentation
- Interactive docs: http://localhost:8000/docs
- OpenAPI spec: http://localhost:8000/openapi.json

### Project Documentation
- Memory Bank: `memory-bank/` directory
- Feature docs: `docs/feature-documentation/`
- Architecture: `memory-bank/systemPatterns.md`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Run tests: `npm test` and `pytest`
5. Commit changes: `git commit -m 'Add amazing feature'`
6. Push to branch: `git push origin feature/amazing-feature`
7. Submit a pull request

### Development Guidelines
- Follow existing code patterns
- Write tests for new features
- Update documentation
- Ensure HIPAA compliance
- Test all user roles

## 📞 Support

For development questions or issues:
1. Check the Memory Bank documentation
2. Review API documentation
3. Test with provided user credentials
4. Check logs for detailed error information

## 📄 License

[Your License Here]

---

**🎯 Ready to develop? Run `./scripts/setup_dev_env.sh` and start coding!**