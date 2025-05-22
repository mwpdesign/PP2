# Healthcare IVR Platform

A HIPAA-compliant platform for healthcare insurance verification requests (IVR) built with React, FastAPI, and AWS.

## Current Development Status

🔄 **Phase 5: Order Management System**
- ✅ Completed Product Catalog System
- 🔄 Implementing Order Processing Workflow
  - Order validation rules with HIPAA compliance (In Progress)
  - Insurance verification integration (Next)
  - Order status tracking and notifications (Planned)

## Features

- 🔐 HIPAA-compliant data handling
- 👥 Multi-role authentication system
- 🏥 Provider network management
- 📋 Insurance verification workflow
- 📦 Order management and logistics
  - ✅ Product catalog management
  - ✅ Territory-based pricing
  - 🔄 Order validation rules
  - 📋 Insurance verification (Planned)
- 📱 Real-time notifications
- 📊 Comprehensive analytics

## Tech Stack

- **Frontend**: React + TypeScript + Tailwind CSS
- **Backend**: Python FastAPI + SQLAlchemy
- **Database**: PostgreSQL with encryption
- **Cache**: Redis
- **Cloud**: AWS (Cognito, RDS, S3, KMS, Lambda)
- **Infrastructure**: Terraform
- **Deployment**: Docker + ECS Fargate

## Prerequisites

- Docker and Docker Compose
- Node.js 18+
- Python 3.11+
- AWS CLI configured
- Terraform 1.0+

## Getting Started

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/healthcare-ivr-platform.git
   cd healthcare-ivr-platform
   ```

2. **Set up environment variables**
   ```bash
   # Backend
   cp backend/.env.example backend/.env
   # Frontend
   cp frontend/.env.example frontend/.env
   ```
   Update the environment variables with your AWS credentials and other configurations.

3. **Start the development environment**
   ```bash
   docker-compose up -d
   ```

   This will start:
   - PostgreSQL database
   - Redis cache
   - Backend FastAPI service
   - Frontend React application

4. **Access the applications**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs

## Development Setup

### Backend Development

1. **Create Python virtual environment**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: .\venv\Scripts\activate
   pip install -r requirements.txt
   ```

2. **Run migrations**
   ```bash
   alembic upgrade head
   ```

3. **Start backend server**
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

### Frontend Development

1. **Install dependencies**
   ```bash
   cd frontend
   npm install
   ```

2. **Start development server**
   ```bash
   npm run dev
   ```

## Infrastructure Deployment

1. **Initialize Terraform**
   ```bash
   cd infrastructure
   terraform init
   ```

2. **Plan deployment**
   ```bash
   terraform plan -out=tfplan
   ```

3. **Apply changes**
   ```bash
   terraform apply tfplan
   ```

## Security Notes

- All PHI (Protected Health Information) is encrypted at rest using AWS KMS
- Access to PHI is logged for audit compliance
- Multi-factor authentication (MFA) is enabled by default
- Role-based access control (RBAC) with territory management
- Regular security audits and compliance checks

## Contributing

1. Create a feature branch
2. Commit your changes
3. Push to the branch
4. Create a Pull Request

## License

[Your License] - See LICENSE file for details 