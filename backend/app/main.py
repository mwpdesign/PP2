"""Main FastAPI application."""
import logging
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.api import api_router
from app.core.database import init_db, db_settings


# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


app = FastAPI(title="Healthcare IVR Platform")


# Configure CORS based on environment
IS_DEVELOPMENT = os.getenv('ENVIRONMENT', 'development') == 'development'

if IS_DEVELOPMENT:
    # Development CORS settings - more permissive
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            "http://localhost:3000",  # React development server
            "http://127.0.0.1:3000",
            "http://localhost:8000",  # FastAPI development server
            "http://127.0.0.1:8000",
        ],
        allow_credentials=True,
        allow_methods=["*"],  # Allow all methods
        allow_headers=["*"],  # Allow all headers
        expose_headers=["*"],  # Expose all headers
        max_age=3600,  # Cache preflight requests for 1 hour
    )
else:
    # Production CORS settings - more restrictive
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            os.getenv('FRONTEND_URL', 'http://localhost:3000')
        ],
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH"],
        allow_headers=["Authorization", "Content-Type"],
        expose_headers=["Content-Range", "X-Total-Count"],
    )


@app.get("/test")
async def test_endpoint():
    """Test endpoint to verify API is working."""
    return {"status": "success", "message": "API is working"}


@app.on_event("startup")
async def startup_event():
    """Initialize application on startup."""
    logger.info("Starting Healthcare IVR Platform API")
    
    # Initialize database if required
    db_success = await init_db()
    
    if db_settings.database_required and not db_success:
        logger.error("Failed to initialize required database connection")
    else:
        status = "available" if db_success else "disabled"
        logger.info(f"Application started successfully. Database {status}")
    
    # Import routers after database initialization
    try:
        from app.test_endpoint import router as test_router
        app.include_router(test_router)
        logger.info("Test router loaded successfully")
    except Exception as e:
        logger.error(f"Failed to load test router: {str(e)}")
    
    try:
        from .api.auth.routes import router as auth_router
        app.include_router(auth_router)
        logger.info("Auth router loaded successfully")
    except Exception as e:
        logger.error(f"Failed to load auth router: {str(e)}")
        logger.info("Continuing without authentication routes")
    
    try:
        # Include all v1 API routes
        app.include_router(api_router, prefix="/api/v1")
        logger.info("API v1 routers loaded successfully")
    except Exception as e:
        logger.error(f"Failed to load API v1 routers: {str(e)}")
        logger.info("Continuing without API v1 routes")


# Comment out all startup events for now
# @app.on_event("startup")
# async def startup_event():
#     """Initialize application on startup."""
#     await init_db() 