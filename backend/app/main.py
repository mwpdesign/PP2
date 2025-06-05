"""Main FastAPI application."""

import logging
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from app.api.v1.api import api_router
from app.core.database import init_db
from app.core.config import get_settings
from app.core.middleware import add_security_middleware


# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


# Get settings
settings = get_settings()

app = FastAPI(
    title="Healthcare IVR Platform",
    description="HIPAA-compliant Interactive Voice Response system for "
                "healthcare providers",
    version="1.0.0",
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
)


# Security middleware - add trusted host middleware for production
if not settings.DEBUG:
    app.add_middleware(
        TrustedHostMiddleware,
        allowed_hosts=["localhost", "127.0.0.1", "*.healthcare-ivr.com"]
    )

# Compression middleware
app.add_middleware(GZipMiddleware, minimum_size=1000)

# Add security middleware for HIPAA compliance
add_security_middleware(app)


# Configure CORS based on environment
IS_DEVELOPMENT = os.getenv("ENVIRONMENT", "development") == "development"

if IS_DEVELOPMENT:
    # Development CORS settings - more permissive but still controlled
    dev_origins_env = os.getenv("DEV_CORS_ORIGINS", "")
    dev_origins = dev_origins_env.split(",") if dev_origins_env else []
    if not dev_origins:
        # Fallback to default development origins
        dev_origins = [
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            "http://localhost:3001",
            "http://127.0.0.1:3001",
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "http://localhost:8000",
            "http://127.0.0.1:8000",
        ]

    logger.info(f"Development CORS enabled for origins: {dev_origins}")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=dev_origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
        allow_headers=[
            "Authorization",
            "Content-Type",
            "X-Requested-With",
            "Accept",
            "Origin",
            "Access-Control-Request-Method",
            "Access-Control-Request-Headers",
        ],
        expose_headers=["Content-Range", "X-Total-Count"],
        max_age=3600,
    )
else:
    # Production CORS settings - restrictive for healthcare compliance
    backend_cors_env = os.getenv("BACKEND_CORS_ORIGINS", "")
    backend_cors_origins = (backend_cors_env.split(",")
                            if backend_cors_env else [])
    if not backend_cors_origins:
        # Fallback to single frontend URL
        frontend_url = os.getenv("FRONTEND_URL",
                                 "https://app.healthcare-ivr.com")
        backend_cors_origins = [frontend_url]

    logger.info(f"Production CORS enabled for origins: "
                f"{backend_cors_origins}")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=backend_cors_origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH"],
        allow_headers=[
            "Authorization",
            "Content-Type",
            "X-Requested-With",
            "Accept",
        ],
        expose_headers=["Content-Range", "X-Total-Count"],
        max_age=86400,  # 24 hours for production
    )


@app.get("/health")
async def health_check():
    """Health check endpoint for load balancers and monitoring."""
    return {
        "status": "healthy",
        "service": "Healthcare IVR Platform API",
        "version": "1.0.0",
        "environment": os.getenv("ENVIRONMENT", "development")
    }


@app.get("/test")
async def test_endpoint():
    """Test endpoint to verify API is working."""
    return {"status": "success", "message": "API is working"}


@app.get("/cors-test")
async def cors_test():
    """Test endpoint to verify CORS is working."""
    return {
        "status": "success",
        "message": "CORS is working",
        "environment": os.getenv("ENVIRONMENT", "development"),
        "cors_enabled": True,
        "security_headers": ("enabled" if not settings.DEBUG
                             else "development_mode")
    }


@app.on_event("startup")
async def startup_event():
    """Initialize application on startup."""
    logger.info("Starting Healthcare IVR Platform API")

    # Initialize database
    try:
        db_success = await init_db()
        if not db_success:
            logger.error("Failed to initialize database connection")
            raise RuntimeError("Database initialization failed")
        logger.info("Database initialized successfully")
    except Exception as e:
        logger.error(f"Database initialization error: {str(e)}")
        raise

    # Include API routes
    try:
        app.include_router(api_router, prefix="/api/v1")
        logger.info("API v1 routers loaded successfully")
    except Exception as e:
        logger.error(f"Failed to load API v1 routers: {str(e)}")
        raise


# Comment out all startup events for now
# @app.on_event("startup")
# async def startup_event():
#     """Initialize application on startup."""
#     await init_db()
