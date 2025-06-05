# Environment Configuration Validation System

## Overview

The Environment Configuration Validation system provides comprehensive validation, management, and standardization of environment variables and configuration settings for the Healthcare IVR Platform. This system ensures consistent, secure, and reliable configuration across all deployment environments.

## Features

### Core Validation Capabilities

1. **Required Variable Validation**: Ensures all required environment variables are present
2. **Data Type Validation**: Validates that variables have correct data types (string, int, bool)
3. **Pattern Validation**: Validates variables against regex patterns (URLs, versions, etc.)
4. **Security Validation**: Checks for insecure default values and weak security settings
5. **Environment Consistency**: Validates configuration appropriateness for target environment
6. **Database Configuration**: Validates PostgreSQL connection settings
7. **Authentication Configuration**: Validates local/Cognito authentication settings
8. **CORS Configuration**: Validates CORS origins and security settings
9. **AWS Configuration**: Validates AWS credentials and service settings

### Configuration Management

1. **Template Generation**: Generates environment-specific .env templates
2. **Configuration Reports**: Comprehensive validation reports with suggestions
3. **Security Auditing**: Security-focused configuration checks
4. **Missing Variable Detection**: Identifies missing required variables
5. **Environment Information**: Provides detailed environment status

## Architecture

### Core Components

```
app/core/
├── config_validator.py     # Core validation logic
├── config_manager.py       # Configuration management
└── config/                 # Configuration definitions
    └── __init__.py        # Settings and configuration
```

### API Endpoints

```
/api/v1/config/
├── status                  # GET - Configuration status
├── validate               # GET - Run validation
├── environment            # GET - Environment info
├── missing-vars           # GET - Missing variables
├── security-check         # GET - Security audit
├── report                 # GET - Full validation report
├── validate-encryption    # POST - Validate encryption
└── validate-database      # POST - Validate database
```

### CLI Tools

```
backend/scripts/validate_config.py
├── validate               # Validate configuration
├── template              # Generate templates
└── check-missing         # Check missing variables
```

## Configuration Requirements

### Core Application Settings

| Variable | Required | Type | Description |
|----------|----------|------|-------------|
| `PROJECT_NAME` | Yes | string | Application name |
| `VERSION` | No | string | Application version (semver) |
| `API_V1_STR` | Yes | string | API version prefix |
| `DEBUG` | Yes | bool | Debug mode flag |
| `ENVIRONMENT` | Yes | string | Environment (development/staging/production) |

### Security Configuration

| Variable | Required | Type | Description |
|----------|----------|------|-------------|
| `SECRET_KEY` | Yes | string | JWT secret key (min 32 chars) |
| `ALGORITHM` | Yes | string | JWT algorithm (HS256/HS384/HS512/RS256) |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Yes | int | Token expiration time |
| `ENCRYPTION_KEY` | Yes | string | Fernet encryption key |
| `ENCRYPTION_SALT` | No | string | Encryption salt |
| `ENABLE_LOCAL_ENCRYPTION` | Yes | bool | Enable local encryption |

### Database Configuration

| Variable | Required | Type | Description |
|----------|----------|------|-------------|
| `DATABASE_URL` | Yes | string | PostgreSQL connection URL |
| `DB_HOST` | No | string | Database host (alternative) |
| `DB_PORT` | No | int | Database port (alternative) |
| `DB_NAME` | No | string | Database name (alternative) |
| `DB_USER` | No | string | Database user (alternative) |
| `DB_PASSWORD` | No | string | Database password (alternative) |

### Authentication Configuration

| Variable | Required | Type | Description |
|----------|----------|------|-------------|
| `AUTH_MODE` | Yes | string | Authentication mode (local/cognito) |
| `USE_COGNITO` | Yes | bool | Enable AWS Cognito |
| `AWS_COGNITO_USER_POOL_ID` | Conditional | string | Cognito User Pool ID |
| `AWS_COGNITO_CLIENT_ID` | Conditional | string | Cognito Client ID |
| `COGNITO_CLIENT_SECRET` | Conditional | string | Cognito Client Secret |

### CORS Configuration

| Variable | Required | Type | Description |
|----------|----------|------|-------------|
| `BACKEND_CORS_ORIGINS` | Yes | JSON array | Allowed CORS origins |
| `DEV_CORS_ORIGINS` | No | JSON array | Development CORS origins |

## Usage

### CLI Usage

#### Validate Configuration

```bash
# Validate current environment
python backend/scripts/validate_config.py validate

# Validate specific environment
python backend/scripts/validate_config.py validate --environment production
```

#### Generate Configuration Template

```bash
# Generate development template
python backend/scripts/validate_config.py template development

# Generate production template to file
python backend/scripts/validate_config.py template production --output .env.production
```

#### Check Missing Variables

```bash
# Check missing variables
python backend/scripts/validate_config.py check-missing

# Check for specific environment
python backend/scripts/validate_config.py check-missing --environment staging
```

### API Usage

#### Get Configuration Status

```bash
curl -X GET "http://localhost:8000/api/v1/config/status"
```

Response:
```json
{
  "environment_info": {
    "environment": "development",
    "debug_mode": true,
    "auth_mode": "local",
    "use_cognito": false,
    "database_url_configured": true,
    "encryption_enabled": true,
    "cors_origins_count": 2,
    "validation_status": "valid"
  },
  "security_check": {
    "encryption_key_valid": true,
    "secret_key_secure": true,
    "debug_mode_appropriate": true,
    "cors_configured": true,
    "issues": []
  },
  "missing_required_vars": [],
  "validation_passed": true
}
```

#### Run Configuration Validation

```bash
curl -X GET "http://localhost:8000/api/v1/config/validate"
```

Response:
```json
{
  "is_valid": true,
  "results": [
    {
      "level": "warning",
      "message": "Using development database in production",
      "key": "DATABASE_URL",
      "suggestion": "Use production database URL"
    }
  ],
  "summary": {
    "errors": 0,
    "warnings": 1,
    "info": 0
  }
}
```

#### Get Validation Report

```bash
curl -X GET "http://localhost:8000/api/v1/config/report"
```

### Python Integration

#### Startup Validation

```python
from app.core.config_manager import validate_startup_configuration

# In main.py startup event
@app.on_event("startup")
async def startup_event():
    if not validate_startup_configuration():
        logger.error("Configuration validation failed")
        raise RuntimeError("Invalid configuration")
```

#### Manual Validation

```python
from app.core.config_validator import validate_configuration

# Validate configuration
is_valid, results = validate_configuration("production")

if not is_valid:
    for result in results:
        if result.level == ValidationLevel.ERROR:
            print(f"Error: {result.message}")
```

#### Configuration Management

```python
from app.core.config_manager import get_config_manager

config_manager = get_config_manager()

# Check security configuration
security_status = config_manager.check_security_configuration()

# Generate environment template
template = config_manager.generate_config_template("production")

# Validate encryption setup
encryption_valid = config_manager.validate_encryption_setup()
```

## Environment-Specific Validation

### Development Environment

- Allows debug mode
- Requires basic security settings
- Validates local database configuration
- Checks development CORS origins

### Staging Environment

- Warns about debug mode
- Requires stronger security settings
- Validates AWS configuration
- Checks production-like settings

### Production Environment

- Prohibits debug mode
- Requires all security settings
- Validates AWS credentials
- Enforces strict CORS policies

## Security Features

### Security Validation Checks

1. **Insecure Default Detection**: Identifies default/weak values
2. **Key Length Validation**: Ensures minimum security key lengths
3. **Debug Mode Checks**: Validates debug settings for environment
4. **CORS Security**: Validates CORS origin security
5. **Encryption Validation**: Validates Fernet encryption keys

### Security-Sensitive Variables

Variables marked as security-sensitive receive additional validation:

- `SECRET_KEY`
- `ENCRYPTION_KEY`
- `ENCRYPTION_SALT`
- `DB_PASSWORD`
- `COGNITO_CLIENT_SECRET`
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `DEMO_USER_PASSWORD`

## Error Handling

### Validation Levels

1. **ERROR**: Critical issues that prevent application startup
2. **WARNING**: Issues that should be addressed but don't prevent startup
3. **INFO**: Informational messages about configuration

### Common Validation Errors

1. **Missing Required Variables**: Required environment variables not set
2. **Invalid Data Types**: Variables with incorrect data types
3. **Pattern Mismatches**: Variables that don't match required patterns
4. **Security Issues**: Weak or default security values
5. **Environment Inconsistencies**: Configuration inappropriate for environment

## Integration Points

### Application Startup

The configuration validation system integrates with application startup to ensure valid configuration before the application starts.

### API Endpoints

REST API endpoints provide runtime access to configuration validation and status information.

### CLI Tools

Command-line tools enable configuration validation in CI/CD pipelines and development workflows.

### Monitoring Integration

Configuration status can be monitored through health check endpoints and logging systems.

## Best Practices

### Development

1. Use the CLI tools to validate configuration before starting development
2. Generate environment templates for new developers
3. Run validation checks in pre-commit hooks

### Deployment

1. Validate configuration in CI/CD pipelines
2. Use environment-specific validation
3. Monitor configuration status in production

### Security

1. Regularly audit security configuration
2. Rotate security keys and validate new keys
3. Monitor for configuration drift

## Troubleshooting

### Common Issues

1. **Missing Environment Variables**: Use `check-missing` command to identify
2. **Invalid Database URL**: Check PostgreSQL URL format and connectivity
3. **Weak Security Keys**: Generate strong keys using provided commands
4. **CORS Issues**: Validate CORS origins format and security

### Debug Commands

```bash
# Get detailed validation report
python backend/scripts/validate_config.py validate

# Check specific configuration aspect
curl -X GET "http://localhost:8000/api/v1/config/security-check"

# Validate encryption setup
curl -X POST "http://localhost:8000/api/v1/config/validate-encryption"
```

## Future Enhancements

1. **Configuration Drift Detection**: Monitor configuration changes over time
2. **Automated Key Rotation**: Integrate with key management systems
3. **Configuration Versioning**: Track configuration changes
4. **Advanced Security Scanning**: Integration with security scanning tools
5. **Configuration Templates**: Pre-built templates for common deployment scenarios