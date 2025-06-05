# CORS and Middleware Configuration

## Overview

This document describes the CORS (Cross-Origin Resource Sharing) and middleware configuration for the Healthcare IVR Platform, designed to ensure secure, HIPAA-compliant communication between frontend and backend services.

## CORS Configuration

### Environment-Based CORS Settings

The application uses different CORS configurations based on the environment:

#### Development Environment
- **Trigger**: `ENVIRONMENT=development`
- **Configuration**: More permissive for local development
- **Origins**: Configurable via `DEV_CORS_ORIGINS` environment variable
- **Default Origins**:
  - `http://localhost:3000` (React development server)
  - `http://127.0.0.1:3000` (Alternative localhost)
  - `http://localhost:3001` (Alternative React port)
  - `http://127.0.0.1:3001` (Alternative localhost)
  - `http://localhost:5173` (Vite development server)
  - `http://127.0.0.1:5173` (Alternative localhost)
  - `http://localhost:8000` (Backend server)
  - `http://127.0.0.1:8000` (Alternative localhost)

#### Production Environment
- **Trigger**: `ENVIRONMENT=production` or any non-development value
- **Configuration**: Restrictive for healthcare compliance
- **Origins**: Configurable via `BACKEND_CORS_ORIGINS` environment variable
- **Fallback**: `FRONTEND_URL` environment variable
- **Default**: `https://app.healthcare-ivr.com`

### CORS Headers Configuration

#### Development Headers
```python
allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"]
allow_headers=[
    "Authorization",
    "Content-Type",
    "X-Requested-With",
    "Accept",
    "Origin",
    "Access-Control-Request-Method",
    "Access-Control-Request-Headers",
]
expose_headers=["Content-Range", "X-Total-Count"]
max_age=3600  # 1 hour
```

#### Production Headers
```python
allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH"]
allow_headers=[
    "Authorization",
    "Content-Type",
    "X-Requested-With",
    "Accept",
]
expose_headers=["Content-Range", "X-Total-Count"]
max_age=86400  # 24 hours
```

## Security Middleware

### SecurityHeadersMiddleware

Adds HIPAA-compliant security headers to all responses:

- **X-Content-Type-Options**: `nosniff`
- **X-Frame-Options**: `DENY`
- **X-XSS-Protection**: `1; mode=block`
- **Referrer-Policy**: `strict-origin-when-cross-origin`
- **Permissions-Policy**: Restricts geolocation, microphone, camera
- **Strict-Transport-Security**: HSTS for HTTPS (production only)
- **Content-Security-Policy**: Comprehensive CSP for healthcare applications

### RequestLoggingMiddleware

Provides audit trail functionality:

- Generates unique request IDs for tracking
- Logs request start and completion
- Measures processing time
- Adds `X-Request-ID` header to responses
- Logs client IP addresses for security monitoring

### PHIProtectionMiddleware

Monitors and protects PHI (Protected Health Information):

- Adds `X-PHI-Protection: active` header
- Framework for PHI pattern detection (extensible)
- Designed for future implementation of PHI redaction

### RateLimitingMiddleware

Provides API protection against abuse:

- Default: 100 requests per minute per IP
- Configurable rate limits
- Automatic cleanup of old request records
- Rate limit headers in responses:
  - `X-RateLimit-Limit`
  - `X-RateLimit-Remaining`
  - `X-RateLimit-Reset`

## Environment Variables

### Required for Production

```bash
# Production CORS origins (comma-separated)
BACKEND_CORS_ORIGINS=https://app.healthcare-ivr.com,https://admin.healthcare-ivr.com

# Fallback frontend URL
FRONTEND_URL=https://app.healthcare-ivr.com

# Environment setting
ENVIRONMENT=production
```

### Optional for Development

```bash
# Development CORS origins (comma-separated)
DEV_CORS_ORIGINS=http://localhost:3000,http://localhost:5173,http://localhost:8000

# Environment setting
ENVIRONMENT=development
```

## Additional Security Features

### TrustedHostMiddleware (Production Only)

- Validates Host headers to prevent Host header injection
- Allowed hosts: `localhost`, `127.0.0.1`, `*.healthcare-ivr.com`
- Only active when `DEBUG=False`

### GZipMiddleware

- Compresses responses larger than 1000 bytes
- Improves performance for API responses
- Reduces bandwidth usage

## Mock Services CORS

The mock services server (`/backend/app/api/mock_services/server.py`) has its own CORS configuration restricted to local development origins only:

```python
allow_origins=[
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
]
```

## Health Endpoints

### Main API Health Check
- **Endpoint**: `GET /health`
- **Purpose**: Load balancer and monitoring health checks
- **Response**: Service status, version, environment

### CORS Test Endpoint
- **Endpoint**: `GET /cors-test`
- **Purpose**: Verify CORS configuration is working
- **Response**: CORS status and security headers information

## HIPAA Compliance Features

1. **Restrictive Production CORS**: Prevents unauthorized cross-origin requests
2. **Security Headers**: Comprehensive security headers for healthcare applications
3. **Request Logging**: Audit trail for compliance requirements
4. **PHI Protection**: Framework for protecting sensitive health information
5. **Rate Limiting**: Prevents abuse and ensures service availability
6. **HTTPS Enforcement**: HSTS headers for secure communication

## Configuration Best Practices

1. **Never use wildcard origins** (`*`) in production
2. **Always specify exact origins** for CORS configuration
3. **Use environment variables** for all origin configuration
4. **Enable all security middleware** in production
5. **Monitor rate limiting logs** for potential abuse
6. **Regularly review CORS origins** for security

## Troubleshooting

### Common CORS Issues

1. **Frontend can't connect to backend**:
   - Check `DEV_CORS_ORIGINS` includes your frontend URL
   - Verify `ENVIRONMENT` is set to `development`
   - Check browser console for CORS errors

2. **Production CORS errors**:
   - Verify `BACKEND_CORS_ORIGINS` includes your production frontend URL
   - Ensure HTTPS is used in production
   - Check that origins match exactly (including protocol and port)

3. **Rate limiting issues**:
   - Check `X-RateLimit-*` headers in responses
   - Adjust rate limits if needed for legitimate traffic
   - Monitor logs for rate limit violations

### Debugging Commands

```bash
# Test CORS configuration
curl -H "Origin: http://localhost:3000" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: Authorization" \
     -X OPTIONS http://localhost:8000/cors-test

# Check health endpoint
curl http://localhost:8000/health

# Test with specific origin
curl -H "Origin: https://app.healthcare-ivr.com" \
     http://localhost:8000/cors-test
```

## Security Considerations

1. **Origin Validation**: All origins are explicitly validated
2. **Header Restrictions**: Only necessary headers are allowed
3. **Method Limitations**: Production restricts to essential HTTP methods
4. **Credential Handling**: Credentials are allowed but origins are strictly controlled
5. **Security Headers**: Comprehensive security headers protect against common attacks
6. **Audit Logging**: All requests are logged for security monitoring

This configuration ensures secure, compliant communication while maintaining development flexibility.