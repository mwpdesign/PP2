"""Main FastAPI application."""
import logging
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.api import api_router
from app.core.database import init_db


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