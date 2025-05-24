"""Main FastAPI application."""
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
# from app.core.config import settings
# from app.api.v1.api import api_router
# from app.core.database import init_db

# Import only the test endpoint
from .core.database import init_db, db_settings

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = FastAPI(title="Healthcare IVR Platform")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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

# Comment out all startup events for now
# @app.on_event("startup")
# async def startup_event():
#     """Initialize application on startup."""
#     await init_db() 