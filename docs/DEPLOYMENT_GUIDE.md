# Healthcare IVR Platform - Deployment Guide

## Overview
This guide covers deployment of the Healthcare IVR Platform across different environments: local development, Docker containers, staging, and production AWS infrastructure.

## Prerequisites

### System Requirements
- **Operating System**: Linux (Ubuntu 20.04+), macOS, or Windows with WSL2
- **Memory**: Minimum 8GB RAM (16GB recommended for production)
- **Storage**: Minimum 50GB available space
- **Network**: Stable internet connection for package downloads

### Required Software
- **Docker**: Version 20.10+
- **Docker Compose**: Version 2.0+
- **Node.js**: Version 18+ (for local frontend development)
- **Python**: Version 3.9+ (for local backend development)
- **PostgreSQL**: Version 14+ (for local database)
- **Git**: Latest version

### AWS Requirements (Production)
- AWS Account with appropriate permissions
- AWS CLI configured
- ECR repository access
- RDS PostgreSQL instance
- S3 bucket for static files
- CloudWatch for monitoring

## Environment Configurations

### 1. Local Development Environment

#### Backend Setup
```bash
# Clone repository
git clone <repository-url>
cd healthcare-ivr-platform

# Backend setup
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Environment configuration
cp .env.example .env
# Edit .env with local configuration

# Database setup
docker-compose up -d postgres
alembic upgrade head

# Start backend server
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

#### Frontend Setup
```bash
# Frontend setup
cd frontend
npm install

# Environment configuration
cp .env.example .env.local
# Edit .env.local with local configuration

# Start frontend server
npm run dev
```

#### Environment Variables (.env)
```bash
# Database
DATABASE_URL=postgresql+asyncpg://postgres:password@localhost:5432/healthcare_ivr

# JWT Configuration
JWT_SECRET_KEY=your-secret-key-here
JWT_ALGORITHM=HS256
JWT_EXPIRATION_MINUTES=30

# CORS Configuration
BACKEND_CORS_ORIGINS=["http://localhost:3000"]
DEV_CORS_ORIGINS=["http://localhost:3000", "http://127.0.0.1:3000"]

# Application Settings
ENVIRONMENT=development
DEBUG=true
LOG_LEVEL=DEBUG

# Security
ENCRYPTION_KEY=your-encryption-key-here
```

### 2. Docker Development Environment

#### Docker Compose Setup
```bash
# Start all services
docker-compose up --build

# Start specific services
docker-compose up postgres redis
docker-compose up backend frontend

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Stop services
docker-compose down
```

#### Docker Compose Configuration
```yaml
# docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:14
    environment:
      POSTGRES_DB: healthcare_ivr
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql+asyncpg://postgres:password@postgres:5432/healthcare_ivr
      - REDIS_URL=redis://redis:6379
    depends_on:
      - postgres
      - redis
    volumes:
      - ./backend:/app

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - VITE_API_URL=http://localhost:8000
    depends_on:
      - backend
    volumes:
      - ./frontend:/app

volumes:
  postgres_data:
```

#### Backend Dockerfile
```dockerfile
# backend/Dockerfile
FROM python:3.9-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create non-root user
RUN useradd --create-home --shell /bin/bash app
USER app

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Start application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

#### Frontend Dockerfile
```dockerfile
# frontend/Dockerfile
FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy application code
COPY . .

# Build application
RUN npm run build

# Install serve for production
RUN npm install -g serve

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001
USER nextjs

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000 || exit 1

# Start application
CMD ["serve", "-s", "dist", "-l", "3000"]
```

### 3. Staging Environment

#### Staging Configuration
```bash
# Environment variables for staging
ENVIRONMENT=staging
DEBUG=false
LOG_LEVEL=INFO

# Database (AWS RDS)
DATABASE_URL=postgresql+asyncpg://username:password@staging-db.region.rds.amazonaws.com:5432/healthcare_ivr

# Security
JWT_SECRET_KEY=staging-secret-key
ENCRYPTION_KEY=staging-encryption-key

# CORS
BACKEND_CORS_ORIGINS=["https://staging.healthcare-ivr.com"]

# AWS Services
AWS_REGION=us-east-1
S3_BUCKET=healthcare-ivr-staging
```

#### Staging Deployment Script
```bash
#!/bin/bash
# deploy-staging.sh

set -e

echo "Deploying to staging environment..."

# Build and tag images
docker build -t healthcare-ivr-backend:staging ./backend
docker build -t healthcare-ivr-frontend:staging ./frontend

# Tag for ECR
docker tag healthcare-ivr-backend:staging $ECR_REGISTRY/healthcare-ivr-backend:staging
docker tag healthcare-ivr-frontend:staging $ECR_REGISTRY/healthcare-ivr-frontend:staging

# Push to ECR
docker push $ECR_REGISTRY/healthcare-ivr-backend:staging
docker push $ECR_REGISTRY/healthcare-ivr-frontend:staging

# Update ECS service
aws ecs update-service \
    --cluster healthcare-ivr-staging \
    --service backend-service \
    --force-new-deployment

aws ecs update-service \
    --cluster healthcare-ivr-staging \
    --service frontend-service \
    --force-new-deployment

echo "Staging deployment complete!"
```

### 4. Production AWS Environment

#### AWS Architecture
```
Internet Gateway
    ↓
Application Load Balancer (HTTPS)
    ↓
ECS Fargate Cluster
    ├── Backend Service (Multiple Tasks)
    └── Frontend Service (Multiple Tasks)
    ↓
RDS PostgreSQL (Multi-AZ)
S3 Bucket (Static Files)
CloudWatch (Monitoring)
```

#### Production Environment Variables
```bash
# Environment
ENVIRONMENT=production
DEBUG=false
LOG_LEVEL=WARNING

# Database (AWS RDS)
DATABASE_URL=postgresql+asyncpg://username:password@prod-db.region.rds.amazonaws.com:5432/healthcare_ivr

# Security
JWT_SECRET_KEY=production-secret-key-from-secrets-manager
ENCRYPTION_KEY=production-encryption-key-from-kms

# CORS
BACKEND_CORS_ORIGINS=["https://healthcare-ivr.com"]

# AWS Services
AWS_REGION=us-east-1
S3_BUCKET=healthcare-ivr-production
CLOUDWATCH_LOG_GROUP=/aws/ecs/healthcare-ivr
```

#### ECS Task Definition (Backend)
```json
{
  "family": "healthcare-ivr-backend",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "executionRoleArn": "arn:aws:iam::account:role/ecsTaskExecutionRole",
  "taskRoleArn": "arn:aws:iam::account:role/ecsTaskRole",
  "containerDefinitions": [
    {
      "name": "backend",
      "image": "account.dkr.ecr.region.amazonaws.com/healthcare-ivr-backend:latest",
      "portMappings": [
        {
          "containerPort": 8000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "ENVIRONMENT",
          "value": "production"
        }
      ],
      "secrets": [
        {
          "name": "DATABASE_URL",
          "valueFrom": "arn:aws:secretsmanager:region:account:secret:healthcare-ivr/database-url"
        },
        {
          "name": "JWT_SECRET_KEY",
          "valueFrom": "arn:aws:secretsmanager:region:account:secret:healthcare-ivr/jwt-secret"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/aws/ecs/healthcare-ivr-backend",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      },
      "healthCheck": {
        "command": ["CMD-SHELL", "curl -f http://localhost:8000/health || exit 1"],
        "interval": 30,
        "timeout": 5,
        "retries": 3,
        "startPeriod": 60
      }
    }
  ]
}
```

#### ECS Service Configuration
```json
{
  "serviceName": "healthcare-ivr-backend",
  "cluster": "healthcare-ivr-production",
  "taskDefinition": "healthcare-ivr-backend:latest",
  "desiredCount": 3,
  "launchType": "FARGATE",
  "networkConfiguration": {
    "awsvpcConfiguration": {
      "subnets": ["subnet-12345", "subnet-67890"],
      "securityGroups": ["sg-backend"],
      "assignPublicIp": "DISABLED"
    }
  },
  "loadBalancers": [
    {
      "targetGroupArn": "arn:aws:elasticloadbalancing:region:account:targetgroup/backend-tg",
      "containerName": "backend",
      "containerPort": 8000
    }
  ],
  "healthCheckGracePeriodSeconds": 300,
  "deploymentConfiguration": {
    "maximumPercent": 200,
    "minimumHealthyPercent": 50
  }
}
```

## Database Migration and Setup

### Local Database Setup
```bash
# Start PostgreSQL
docker-compose up -d postgres

# Run migrations
cd backend
alembic upgrade head

# Seed initial data (optional)
python scripts/seed_data.py
```

### Production Database Setup
```bash
# Create RDS instance (via AWS CLI or Console)
aws rds create-db-instance \
    --db-instance-identifier healthcare-ivr-prod \
    --db-instance-class db.t3.medium \
    --engine postgres \
    --engine-version 14.9 \
    --master-username postgres \
    --master-user-password $DB_PASSWORD \
    --allocated-storage 100 \
    --storage-type gp2 \
    --vpc-security-group-ids sg-database \
    --db-subnet-group-name healthcare-ivr-subnet-group \
    --backup-retention-period 7 \
    --multi-az \
    --storage-encrypted

# Run migrations on production
DATABASE_URL=$PROD_DATABASE_URL alembic upgrade head
```

## Security Configuration

### SSL/TLS Setup
```bash
# Generate SSL certificate (Let's Encrypt)
certbot certonly --dns-route53 -d healthcare-ivr.com -d *.healthcare-ivr.com

# Configure ALB with SSL certificate
aws elbv2 create-listener \
    --load-balancer-arn $ALB_ARN \
    --protocol HTTPS \
    --port 443 \
    --certificates CertificateArn=$CERT_ARN \
    --default-actions Type=forward,TargetGroupArn=$TARGET_GROUP_ARN
```

### Security Groups
```bash
# Backend security group
aws ec2 create-security-group \
    --group-name healthcare-ivr-backend \
    --description "Backend security group"

# Allow ALB to backend
aws ec2 authorize-security-group-ingress \
    --group-id $BACKEND_SG \
    --protocol tcp \
    --port 8000 \
    --source-group $ALB_SG

# Database security group
aws ec2 create-security-group \
    --group-name healthcare-ivr-database \
    --description "Database security group"

# Allow backend to database
aws ec2 authorize-security-group-ingress \
    --group-id $DB_SG \
    --protocol tcp \
    --port 5432 \
    --source-group $BACKEND_SG
```

## Monitoring and Logging

### CloudWatch Configuration
```bash
# Create log groups
aws logs create-log-group --log-group-name /aws/ecs/healthcare-ivr-backend
aws logs create-log-group --log-group-name /aws/ecs/healthcare-ivr-frontend

# Create CloudWatch alarms
aws cloudwatch put-metric-alarm \
    --alarm-name "HighCPUUtilization" \
    --alarm-description "High CPU utilization" \
    --metric-name CPUUtilization \
    --namespace AWS/ECS \
    --statistic Average \
    --period 300 \
    --threshold 80 \
    --comparison-operator GreaterThanThreshold \
    --evaluation-periods 2
```

### Health Checks
```python
# Backend health check endpoint
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "1.0.0",
        "database": await check_database_connection(),
        "redis": await check_redis_connection()
    }
```

## Backup and Recovery

### Database Backup
```bash
# Automated RDS backups (configured during creation)
# Manual snapshot
aws rds create-db-snapshot \
    --db-instance-identifier healthcare-ivr-prod \
    --db-snapshot-identifier healthcare-ivr-manual-$(date +%Y%m%d)

# Restore from snapshot
aws rds restore-db-instance-from-db-snapshot \
    --db-instance-identifier healthcare-ivr-restored \
    --db-snapshot-identifier healthcare-ivr-manual-20241201
```

### Application Backup
```bash
# Backup application files to S3
aws s3 sync /app/uploads s3://healthcare-ivr-backups/uploads/$(date +%Y%m%d)/

# Backup configuration
aws s3 cp /app/config s3://healthcare-ivr-backups/config/$(date +%Y%m%d)/ --recursive
```

## Deployment Automation

### CI/CD Pipeline (GitHub Actions)
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v3

    - name: Configure AWS credentials
      uses: aws-actions/configure-aws-credentials@v2
      with:
        aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
        aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        aws-region: us-east-1

    - name: Login to Amazon ECR
      id: login-ecr
      uses: aws-actions/amazon-ecr-login@v1

    - name: Build and push backend image
      env:
        ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
        ECR_REPOSITORY: healthcare-ivr-backend
        IMAGE_TAG: ${{ github.sha }}
      run: |
        docker build -t $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG ./backend
        docker push $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG

    - name: Build and push frontend image
      env:
        ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
        ECR_REPOSITORY: healthcare-ivr-frontend
        IMAGE_TAG: ${{ github.sha }}
      run: |
        docker build -t $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG ./frontend
        docker push $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG

    - name: Update ECS service
      run: |
        aws ecs update-service \
          --cluster healthcare-ivr-production \
          --service backend-service \
          --force-new-deployment
```

## Troubleshooting

### Common Issues

#### 1. Database Connection Issues
```bash
# Check database connectivity
psql -h localhost -p 5432 -U postgres -d healthcare_ivr

# Check connection from application
python -c "
import asyncpg
import asyncio
async def test():
    conn = await asyncpg.connect('postgresql://postgres:password@localhost:5432/healthcare_ivr')
    print('Connected successfully')
    await conn.close()
asyncio.run(test())
"
```

#### 2. Authentication Issues
```bash
# Check JWT token
python -c "
import jwt
token = 'your-jwt-token-here'
payload = jwt.decode(token, options={'verify_signature': False})
print(payload)
"

# Verify token storage
# Check browser localStorage for 'authToken' key
```

#### 3. CORS Issues
```bash
# Test CORS
curl -H "Origin: http://localhost:3000" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: X-Requested-With" \
     -X OPTIONS \
     http://localhost:8000/api/v1/auth/login
```

#### 4. Docker Issues
```bash
# Check container logs
docker-compose logs backend
docker-compose logs frontend

# Check container health
docker-compose ps

# Rebuild containers
docker-compose down
docker-compose up --build
```

### Performance Optimization

#### Database Optimization
```sql
-- Check slow queries
SELECT query, mean_time, calls
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;

-- Analyze table statistics
ANALYZE patients;
ANALYZE ivr_requests;

-- Check index usage
SELECT schemaname, tablename, attname, n_distinct, correlation
FROM pg_stats
WHERE tablename = 'ivr_requests';
```

#### Application Optimization
```bash
# Monitor memory usage
docker stats

# Check application metrics
curl http://localhost:8000/metrics

# Profile application
python -m cProfile -o profile.stats app/main.py
```

## Security Checklist

### Pre-Deployment Security
- [ ] All secrets stored in AWS Secrets Manager
- [ ] Database encryption enabled
- [ ] SSL/TLS certificates configured
- [ ] Security groups properly configured
- [ ] IAM roles follow least privilege principle
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] Input validation implemented
- [ ] Audit logging enabled

### Post-Deployment Security
- [ ] Penetration testing completed
- [ ] Vulnerability scanning performed
- [ ] Security monitoring configured
- [ ] Incident response plan documented
- [ ] Backup and recovery tested
- [ ] HIPAA compliance verified

## Support and Maintenance

### Regular Maintenance Tasks
- Monitor application and database performance
- Review security logs and alerts
- Update dependencies and security patches
- Backup verification and recovery testing
- Capacity planning and scaling

### Emergency Procedures
- Incident response plan
- Rollback procedures
- Emergency contacts
- Escalation procedures
- Communication plan

### Contact Information
- **DevOps Team**: devops@healthcare-ivr.com
- **Security Team**: security@healthcare-ivr.com
- **On-Call**: +1-555-ONCALL
- **Emergency**: emergency@healthcare-ivr.com

---

**Last Updated**: December 2024
**Version**: 1.0.0
**Environment**: Production Ready