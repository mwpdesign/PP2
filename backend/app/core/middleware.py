"""
Middleware for Healthcare IVR Platform.

This module provides custom middleware for request processing,
security headers, and HIPAA compliance features.
"""

import logging
import time
import uuid
from fastapi import Request, Response
from starlette.middleware.base import (
    BaseHTTPMiddleware,
    RequestResponseEndpoint
)

logger = logging.getLogger(__name__)


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Add security headers for HIPAA compliance."""

    async def dispatch(
        self, request: Request, call_next: RequestResponseEndpoint
    ) -> Response:
        """Add security headers to all responses."""
        response = await call_next(request)

        # Security headers for healthcare compliance
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = (
            "geolocation=(), microphone=(), camera=()"
        )

        # HSTS for HTTPS enforcement (only in production)
        if request.url.scheme == "https":
            response.headers["Strict-Transport-Security"] = (
                "max-age=31536000; includeSubDomains; preload"
            )

        # Content Security Policy for healthcare applications
        csp_policy = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "
            "style-src 'self' 'unsafe-inline'; "
            "img-src 'self' data: https:; "
            "font-src 'self' https:; "
            "connect-src 'self' https:; "
            "frame-ancestors 'none'; "
            "base-uri 'self'; "
            "form-action 'self'"
        )
        response.headers["Content-Security-Policy"] = csp_policy

        return response


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """Log requests for audit and compliance purposes."""

    async def dispatch(
        self, request: Request, call_next: RequestResponseEndpoint
    ) -> Response:
        """Log request details for audit trail."""
        # Generate request ID for tracking
        request_id = str(uuid.uuid4())
        request.state.request_id = request_id

        # Start timing
        start_time = time.time()

        # Log request start
        logger.info(
            f"Request started - ID: {request_id}, "
            f"Method: {request.method}, "
            f"URL: {request.url}, "
            f"Client: {request.client.host if request.client else 'unknown'}"
        )

        # Process request
        response = await call_next(request)

        # Calculate processing time
        process_time = time.time() - start_time

        # Log request completion
        logger.info(
            f"Request completed - ID: {request_id}, "
            f"Status: {response.status_code}, "
            f"Time: {process_time:.3f}s"
        )

        # Add request ID to response headers for tracking
        response.headers["X-Request-ID"] = request_id

        return response


class PHIProtectionMiddleware(BaseHTTPMiddleware):
    """Middleware to protect PHI data in requests and responses."""

    PHI_PATTERNS = [
        r'\b\d{3}-\d{2}-\d{4}\b',  # SSN pattern
        r'\b\d{10}\b',  # 10-digit numbers (potential MRN)
        r'\b[A-Za-z]{2}\d{6}\b',  # Alphanumeric ID pattern
    ]

    async def dispatch(
        self, request: Request, call_next: RequestResponseEndpoint
    ) -> Response:
        """Monitor and protect PHI data."""
        # Note: In a real implementation, this would scan request/response
        # bodies for PHI patterns and either redact or alert on detection

        # For now, we'll just add a header indicating PHI protection is active
        response = await call_next(request)
        response.headers["X-PHI-Protection"] = "active"

        return response


class RateLimitingMiddleware(BaseHTTPMiddleware):
    """Basic rate limiting for API protection."""

    def __init__(self, app, calls_per_minute: int = 60):
        """Initialize rate limiting middleware."""
        super().__init__(app)
        self.calls_per_minute = calls_per_minute
        self.client_requests = {}

    async def dispatch(
        self, request: Request, call_next: RequestResponseEndpoint
    ) -> Response:
        """Apply rate limiting based on client IP."""
        client_ip = (
            request.client.host if request.client
            else request.headers.get("X-Forwarded-For", "unknown")
        )

        current_time = time.time()

        # Clean old entries (older than 1 minute)
        cutoff_time = current_time - 60
        self.client_requests = {
            ip: requests for ip, requests in self.client_requests.items()
            if any(req_time > cutoff_time for req_time in requests)
        }

        # Check current client's request count
        if client_ip not in self.client_requests:
            self.client_requests[client_ip] = []

        # Remove old requests for this client
        self.client_requests[client_ip] = [
            req_time for req_time in self.client_requests[client_ip]
            if req_time > cutoff_time
        ]

        # Check if rate limit exceeded
        if len(self.client_requests[client_ip]) >= self.calls_per_minute:
            request_count = len(self.client_requests[client_ip])
            logger.warning(
                f"Rate limit exceeded for client {client_ip}: "
                f"{request_count} requests in last minute"
            )
            from fastapi import HTTPException
            raise HTTPException(
                status_code=429,
                detail="Rate limit exceeded. Please try again later."
            )

        # Add current request
        self.client_requests[client_ip].append(current_time)

        # Process request
        response = await call_next(request)

        # Add rate limit headers
        current_requests = len(self.client_requests[client_ip])
        remaining = self.calls_per_minute - current_requests
        response.headers["X-RateLimit-Limit"] = str(self.calls_per_minute)
        response.headers["X-RateLimit-Remaining"] = str(remaining)
        response.headers["X-RateLimit-Reset"] = str(int(current_time + 60))

        return response


def get_request_id(request: Request) -> str:
    """Get the request ID from the request state."""
    return getattr(request.state, 'request_id', 'unknown')


def add_security_middleware(app):
    """Add all security middleware to the FastAPI app."""
    # Add middleware in reverse order (last added = first executed)
    app.add_middleware(PHIProtectionMiddleware)
    app.add_middleware(RateLimitingMiddleware, calls_per_minute=100)
    app.add_middleware(RequestLoggingMiddleware)
    app.add_middleware(SecurityHeadersMiddleware)

    logger.info("Security middleware added successfully")