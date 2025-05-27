"""
API router configuration.
"""
from fastapi import APIRouter

from app.api.v1.endpoints import (
    patients,
    ivr,
    auth,
    users,
    providers,
    orders,
    shipping,
    organizations,
    rbac
)

api_router = APIRouter()

# Include routers
api_router.include_router(
    auth.router,
    prefix="/auth",
    tags=["Authentication"]
)

api_router.include_router(
    users.router,
    prefix="/users",
    tags=["Users"]
)

api_router.include_router(
    patients.router,
    prefix="/patients",
    tags=["Patients"]
)

api_router.include_router(
    providers.router,
    prefix="/providers",
    tags=["Providers"]
)

api_router.include_router(
    orders.router,
    prefix="/orders",
    tags=["Orders"]
)

api_router.include_router(
    shipping.router,
    prefix="/shipping",
    tags=["Shipping"]
)

api_router.include_router(
    organizations.router,
    prefix="/organizations",
    tags=["Organizations"]
)

api_router.include_router(
    rbac.router,
    prefix="/rbac",
    tags=["RBAC"]
)

api_router.include_router(
    ivr.router,
    prefix="/ivr",
    tags=["IVR"]
)