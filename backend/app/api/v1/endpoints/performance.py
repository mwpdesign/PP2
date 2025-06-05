"""
Performance Monitoring API Endpoints for Healthcare IVR Platform

Provides endpoints for monitoring encryption performance, cache metrics,
and system health with proper authentication and HIPAA compliance.
"""

from typing import Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.security import HTTPBearer

from app.core.security import get_current_user
from app.schemas.token import TokenData
from app.core.performance import get_performance_monitor, PerformanceMetricType
from app.services.encryption_cache import get_encryption_cache

router = APIRouter()
security = HTTPBearer()


@router.get("/health")
async def performance_health_check(
    current_user: TokenData = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Get health status of performance monitoring and caching systems.

    Requires authentication. Available to all authenticated users.
    """
    try:
        # Get performance monitor health
        performance_monitor = get_performance_monitor()
        performance_health = performance_monitor.health_check()

        # Get cache health
        cache = get_encryption_cache()
        cache_health = cache.health_check()

        return {
            "status": "healthy" if (
                performance_health.get("status") == "healthy" and
                cache_health.get("status") == "healthy"
            ) else "degraded",
            "performance_monitoring": performance_health,
            "encryption_cache": cache_health,
            "user": {
                "id": str(current_user.id),
                "role": current_user.role,
                "organization_id": str(current_user.organization_id)
            }
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get performance health status: {str(e)}"
        )


@router.get("/metrics")
async def get_performance_metrics(
    current_user: TokenData = Depends(get_current_user),
    metric_type: Optional[str] = Query(None, description="Filter by metric type"),
    time_window_minutes: Optional[int] = Query(
        None, description="Time window in minutes"
    )
) -> Dict[str, Any]:
    """
    Get performance metrics summary.

    Requires authentication. Admin and Master Distributor roles get full access,
    other roles get limited metrics.
    """
    try:
        performance_monitor = get_performance_monitor()

        # Parse metric type if provided
        parsed_metric_type = None
        if metric_type:
            try:
                parsed_metric_type = PerformanceMetricType(metric_type)
            except ValueError:
                raise HTTPException(
                    status_code=400,
                    detail=f"Invalid metric type: {metric_type}"
                )

        # Get metrics summary
        metrics = performance_monitor.get_metrics_summary(
            metric_type=parsed_metric_type,
            time_window_minutes=time_window_minutes
        )

        # Filter sensitive information based on user role
        if current_user.role not in ["Admin", "Master Distributor"]:
            # Remove detailed system metrics for non-admin users
            if "metrics_by_type" in metrics:
                filtered_metrics = {}
                allowed_metrics = [
                    "encryption_time",
                    "decryption_time",
                    "cache_hit_ratio"
                ]
                for key, value in metrics["metrics_by_type"].items():
                    if key in allowed_metrics:
                        filtered_metrics[key] = value
                metrics["metrics_by_type"] = filtered_metrics

        return {
            "metrics": metrics,
            "user_context": {
                "role": current_user.role,
                "organization_id": str(current_user.organization_id),
                "access_level": (
                    "full" if current_user.role in ["Admin", "Master Distributor"]
                    else "limited"
                )
            }
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get performance metrics: {str(e)}"
        )


@router.get("/cache/metrics")
async def get_cache_metrics(
    current_user: TokenData = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Get encryption cache performance metrics.

    Requires authentication. Available to all authenticated users.
    """
    try:
        cache = get_encryption_cache()
        cache_metrics = cache.get_cache_metrics()

        return {
            "cache_metrics": cache_metrics,
            "user_context": {
                "role": current_user.role,
                "organization_id": str(current_user.organization_id)
            }
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get cache metrics: {str(e)}"
        )


@router.post("/cache/invalidate")
async def invalidate_cache(
    current_user: TokenData = Depends(get_current_user),
    resource_id: Optional[str] = Query(None, description="Resource ID to invalidate"),
    resource_type: Optional[str] = Query(None, description="Resource type"),
    user_cache_only: bool = Query(
        False, description="Invalidate only current user's cache"
    )
) -> Dict[str, Any]:
    """
    Invalidate encryption cache entries.

    Requires authentication. Users can invalidate their own cache,
    Admin and Master Distributor can invalidate any cache.
    """
    try:
        cache = get_encryption_cache()

        user_context = {
            "user_id": str(current_user.id),
            "organization_id": str(current_user.organization_id)
        }

        if user_cache_only or current_user.role not in ["Admin", "Master Distributor"]:
            # Invalidate only current user's cache
            invalidated_count = cache.invalidate_user_cache(
                user_id=str(current_user.id),
                organization_id=str(current_user.organization_id)
            )
            operation = "user_cache_invalidation"
        else:
            # Invalidate specific resource cache (admin only)
            if not resource_id:
                raise HTTPException(
                    status_code=400,
                    detail="resource_id is required for resource cache invalidation"
                )

            invalidated_count = cache.invalidate_cache(
                resource_id=resource_id,
                resource_type=resource_type,
                user_context=user_context
            )
            operation = "resource_cache_invalidation"

        return {
            "success": True,
            "operation": operation,
            "invalidated_entries": invalidated_count,
            "user_context": {
                "role": current_user.role,
                "organization_id": str(current_user.organization_id)
            }
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to invalidate cache: {str(e)}"
        )


@router.get("/report")
async def get_performance_report(
    current_user: TokenData = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Get comprehensive performance report with recommendations.

    Requires Admin or Master Distributor role.
    """
    if current_user.role not in ["Admin", "Master Distributor"]:
        raise HTTPException(
            status_code=403,
            detail="Access denied. Admin or Master Distributor role required."
        )

    try:
        performance_monitor = get_performance_monitor()
        report = performance_monitor.get_performance_report()

        return {
            "report": report,
            "generated_by": {
                "user_id": str(current_user.id),
                "role": current_user.role,
                "organization_id": str(current_user.organization_id)
            }
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate performance report: {str(e)}"
        )


@router.post("/monitoring/start")
async def start_background_monitoring(
    current_user: TokenData = Depends(get_current_user),
    interval_seconds: int = Query(60, description="Monitoring interval in seconds")
) -> Dict[str, Any]:
    """
    Start background performance monitoring.

    Requires Admin role.
    """
    if current_user.role != "Admin":
        raise HTTPException(
            status_code=403,
            detail="Access denied. Admin role required."
        )

    try:
        performance_monitor = get_performance_monitor()
        performance_monitor.start_background_monitoring(interval_seconds)

        return {
            "success": True,
            "message": f"Background monitoring started with {interval_seconds}s interval",
            "started_by": {
                "user_id": str(current_user.id),
                "role": current_user.role
            }
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to start background monitoring: {str(e)}"
        )


@router.post("/monitoring/stop")
async def stop_background_monitoring(
    current_user: TokenData = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Stop background performance monitoring.

    Requires Admin role.
    """
    if current_user.role != "Admin":
        raise HTTPException(
            status_code=403,
            detail="Access denied. Admin role required."
        )

    try:
        performance_monitor = get_performance_monitor()
        performance_monitor.stop_background_monitoring()

        return {
            "success": True,
            "message": "Background monitoring stopped",
            "stopped_by": {
                "user_id": str(current_user.id),
                "role": current_user.role
            }
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to stop background monitoring: {str(e)}"
        )