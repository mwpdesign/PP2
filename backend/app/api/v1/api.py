"""
API router configuration.
"""
from fastapi import APIRouter

from app.api.v1.endpoints import (
    users,
    patients,
    providers,
    orders,
    analytics,
    compliance,
    settings,
)
from app.api.auth.routes import router as auth_router

api_router = APIRouter()

# Include auth router - handles both local and Cognito auth
# Router already has its own prefix
api_router.include_router(auth_router, prefix="/auth", tags=["auth"])

# Always include core v1 endpoints
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(
    patients.router,
    prefix="/patients",
    tags=["patients"]
)
api_router.include_router(
    providers.router,
    prefix="/providers",
    tags=["providers"]
)
api_router.include_router(orders.router, prefix="/orders", tags=["orders"])
api_router.include_router(
    analytics.router,
    prefix="/analytics",
    tags=["analytics"]
)
api_router.include_router(
    compliance.router,
    prefix="/compliance",
    tags=["compliance"]
)
api_router.include_router(
    settings.router,
    prefix="/settings",
    tags=["settings"]
)