"""
API router configuration.
"""

from fastapi import APIRouter
from app.api.v1.endpoints import (
    users,
    orders,
    patients,
    providers,
    config,
    performance,
    templates,
    auto_population,
    voice,
    ivr,
    products,
    permissions,
    team,
    practice,
    doctors,
    sales_dashboard,
)
from app.api.auth.routes import router as auth_router

api_router = APIRouter()

# Include auth router - handles both local and Cognito auth
# Router already has its own prefix
api_router.include_router(auth_router)

# Always include core v1 endpoints
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(orders.router, prefix="/orders", tags=["orders"])
api_router.include_router(
    patients.router, prefix="/patients", tags=["patients"])
api_router.include_router(
    providers.router,
    prefix="/providers",
    tags=["providers"]
)
api_router.include_router(
    config.router,
    prefix="/config",
    tags=["configuration"]
)
api_router.include_router(
    performance.router,
    prefix="/performance",
    tags=["performance"]
)
api_router.include_router(
    templates.router,
    prefix="/templates",
    tags=["templates"]
)
api_router.include_router(
    auto_population.router,
    prefix="/auto-population",
    tags=["auto-population"]
)
api_router.include_router(
    voice.router,
    prefix="/voice",
    tags=["voice-transcription"]
)
api_router.include_router(
    ivr.router,
    prefix="/ivr",
    tags=["ivr"]
)
api_router.include_router(
    products.router,
    prefix="/products",
    tags=["products"]
)
api_router.include_router(
    permissions.router,
    prefix="/permissions",
    tags=["permissions"]
)
api_router.include_router(
    team.router,
    prefix="/team",
    tags=["team"]
)
api_router.include_router(
    practice.router,
    prefix="/practice",
    tags=["practice"]
)
api_router.include_router(
    doctors.router,
    prefix="/doctors",
    tags=["doctors"]
)
api_router.include_router(
    sales_dashboard.router,
    prefix="/sales-dashboard",
    tags=["sales-dashboard"]
)
