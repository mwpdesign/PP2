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

### Backend
- Python 3.12
- FastAPI
- SQLAlchemy
- Pydantic
- Alembic
- pytest
- uvicorn

### Database
- PostgreSQL 15
- Redis for caching
- AWS RDS
- AWS ElastiCache

### Cloud Infrastructure
- AWS Services:
  - Cognito
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
   ```

2. Frontend Setup
   ```bash
   cd frontend
   npm install
   ```

3. Database Setup
   ```bash
   docker-compose up -d db
   alembic upgrade head
   ```

### Environment Variables
- Backend (.env):
  - DATABASE_URL
  - AWS_ACCESS_KEY
  - AWS_SECRET_KEY
  - KMS_KEY_ID
  - JWT_SECRET

- Frontend (.env):
  - REACT_APP_API_URL
  - REACT_APP_WS_URL
  - REACT_APP_COGNITO_POOL_ID

## Technical Constraints

### Security Requirements
1. HIPAA Compliance
   - Field-level encryption
   - Audit logging
   - Access control
   - Secure transmission

2. Authentication
   - MFA required
   - Token rotation
   - Session management
   - Device tracking

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