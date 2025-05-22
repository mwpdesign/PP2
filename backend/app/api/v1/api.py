from fastapi import APIRouter

from app.api.v1.endpoints import (
    auth,
    users,
    patients,
    providers,
    orders,
    verification,
)

api_router = APIRouter()

# Include all endpoint routers
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
    tags=["Healthcare Providers"]
)
api_router.include_router(
    orders.router,
    prefix="/orders",
    tags=["Orders"]
)
api_router.include_router(
    verification.router,
    prefix="/verification",
    tags=["Insurance Verification"]
) 