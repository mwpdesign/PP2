# Development Environment Setup Guide

## Overview

This guide explains how to set up a secure development environment for the Healthcare IVR Platform without using hard-coded credentials.

## Quick Start

1. **Copy the environment template:**
   ```bash
   cp env.example .env
   ```

2. **Generate secure keys:**
   ```bash
   # Generate a strong secret key
   python -c "import secrets; print('SECRET_KEY=' + secrets.token_urlsafe(32))" >> .env

   # Generate encryption key
   python -c "import base64, os; print('ENCRYPTION_KEY=' + base64.urlsafe_b64encode(os.urandom(32)).decode())" >> .env

   # Generate JWT secret
   python -c "import secrets; print('JWT_SECRET_KEY=' + secrets.token_urlsafe(32))" >> .env
   ```

3. **Set development-specific values:**
   ```bash
   echo "ENVIRONMENT=development" >> .env
   echo "DEBUG=true" >> .env
   echo "AUTH_MODE=local" >> .env
   echo "USE_COGNITO=false" >> .env
   ```

## Development Configuration

### Database Setup

For local development, use PostgreSQL:

```bash
# Create development database
createdb healthcare_ivr_dev

# Add to .env
echo "DATABASE_URL=postgresql+asyncpg://postgres:your_password@localhost:5432/healthcare_ivr_dev" >> .env
```

### Mock Authentication

The platform includes a mock authentication service for development:

**Available Mock Users:**
- Admin: `admin@healthcare.local` / `admin123`
- Doctor: `doctor@healthcare.local` / `doctor123`
- IVR: `ivr@healthcare.local` / `ivr123`

These credentials are only available when `AUTH_MODE=local` and `ENVIRONMENT=development`.

### External Services

#### TinyMCE API Key
1. Get a free API key from [TinyMCE](https://www.tiny.cloud/)
2. Add to .env: `TINYMCE_API_KEY=your_api_key`

#### AWS LocalStack (for local AWS testing)
```bash
# Start LocalStack
docker run -d -p 4566:4566 localstack/localstack

# Add to .env
echo "AWS_ACCESS_KEY_ID=test" >> .env
echo "AWS_SECRET_ACCESS_KEY=test" >> .env
echo "LOCALSTACK_ENDPOINT=http://localhost:4566" >> .env
```

## Security Best Practices

### Environment Variables

1. **Never commit .env files** - they're in .gitignore for a reason
2. **Use strong, unique keys** for each environment
3. **Rotate keys regularly** in production
4. **Use different keys** for development, staging, and production

### Password Management

For scripts that need passwords:

```bash
# Create admin user
ADMIN_PASSWORD=your_secure_password python backend/create_admin.py

# Hash a password
PASSWORD_TO_HASH=your_password python hash_password.py
```

### Development vs Production

| Setting | Development | Production |
|---------|-------------|------------|
| `DEBUG` | `true` | `false` |
| `ENVIRONMENT` | `development` | `production` |
| `AUTH_MODE` | `local` | `cognito` |
| `USE_COGNITO` | `false` | `true` |
| `ENABLE_MOCK_SERVICES` | `true` | `false` |

## Frontend Configuration

Create `frontend/.env.local`:

```bash
# TinyMCE API Key
REACT_APP_TINYMCE_API_KEY=your_tinymce_api_key

# API Base URL
REACT_APP_API_BASE_URL=http://localhost:8000
```

## Verification

Test your setup:

```bash
# Backend
cd backend
python -c "from app.core.config import settings; print('Config loaded successfully')"

# Frontend
cd frontend
npm start
```

## Troubleshooting

### Common Issues

1. **"SECRET_KEY not set"** - Generate and set a strong secret key
2. **"Database connection failed"** - Check DATABASE_URL and ensure PostgreSQL is running
3. **"TinyMCE API key invalid"** - Get a valid API key from TinyMCE
4. **"Mock users not working"** - Ensure `AUTH_MODE=local` and `ENVIRONMENT=development`

### Environment Validation

Run the environment validation script:

```bash
cd backend
python scripts/validate_environment.py
```

This will check for:
- Required environment variables
- Secure key generation
- Database connectivity
- Service availability

## Production Deployment

For production deployment:

1. **Use AWS Secrets Manager** or similar for sensitive values
2. **Enable Cognito authentication** (`USE_COGNITO=true`)
3. **Disable debug mode** (`DEBUG=false`)
4. **Use production database** with proper credentials
5. **Set strong, unique keys** for all security settings

## Security Checklist

- [ ] No hard-coded credentials in source code
- [ ] Strong, unique keys generated for each environment
- [ ] .env files not committed to version control
- [ ] Mock services disabled in production
- [ ] Database credentials secured
- [ ] API keys properly configured
- [ ] CORS origins restricted appropriately
- [ ] Debug mode disabled in production