from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.core.config import settings
from app.api.v1.api import api_router
import structlog

logger = structlog.get_logger()

app = FastAPI(
    title="Healthcare IVR Platform API",
    description="HIPAA-compliant Healthcare Insurance Verification API",
    version="1.0.0",
    docs_url="/docs" if settings.ENVIRONMENT != "production" else None,
    redoc_url="/redoc" if settings.ENVIRONMENT != "production" else None,
)

# CORS middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API router
app.include_router(api_router, prefix=settings.API_PREFIX)

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return JSONResponse(
        content={"status": "healthy", "environment": settings.ENVIRONMENT},
        status_code=200,
    )

@app.on_event("startup")
async def startup_event():
    """Initialize services on startup"""
    logger.info(
        "Starting Healthcare IVR Platform API",
        environment=settings.ENVIRONMENT
    )

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    logger.info("Shutting down Healthcare IVR Platform API") 