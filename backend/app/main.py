"""Main FastAPI application."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from app.core.config import settings
from app.api.v1.api import api_router
from app.core.database import init_db, AsyncSessionLocal
import structlog
from sqlalchemy import text


logger = structlog.get_logger()


def create_application() -> FastAPI:
    """Create and configure FastAPI application."""
    app = FastAPI(
        title=settings.PROJECT_NAME,
        version=settings.VERSION,
        openapi_url=f"{settings.API_V1_STR}/openapi.json"
    )

    # Set CORS middleware with explicit origins
    origins = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]
    
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
        expose_headers=["*"]
    )

    # Add trusted host middleware
    app.add_middleware(
        TrustedHostMiddleware,
        allowed_hosts=["*"]  # Configure based on environment
    )

    # Include API router
    app.include_router(api_router, prefix=settings.API_V1_STR)

    return app


app = create_application()


@app.get("/health")
async def health_check():
    """Health check endpoint with database connectivity check"""
    try:
        # Test database connection
        async with AsyncSessionLocal() as db:
            try:
                # Execute a simple query
                result = await db.execute(text("SELECT 1"))
                await result.scalar()
                db_status = "connected"
            except Exception as e:
                logger.error("Database health check failed", error=str(e))
                db_status = "error"
    except Exception as e:
        logger.error("Database session creation failed", error=str(e))
        db_status = "error"

    return JSONResponse(
        content={
            "status": "healthy" if db_status == "connected" else "unhealthy",
            "database": db_status,
            "environment": settings.ENVIRONMENT,
            "version": settings.VERSION
        },
        status_code=200 if db_status == "connected" else 503,
    )


@app.on_event("startup")
async def startup_event():
    """Initialize application on startup."""
    await init_db()
    logger.info(
        "Starting Healthcare IVR Platform API",
        environment=settings.ENVIRONMENT
    )


@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    logger.info("Shutting down Healthcare IVR Platform API") 