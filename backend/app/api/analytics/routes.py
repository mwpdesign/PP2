"""Analytics routes."""
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.analytics.models import (
    DailyMetrics,
    GeographicMetrics,
    HourlyMetrics,
    OrganizationMetrics,
)
from app.core.database import get_session
from app.core.security import get_current_user

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/metrics/geographic")
async def get_geographic_metrics(
    session: AsyncSession = Depends(get_session),
    current_user: Dict = Depends(get_current_user),
) -> List[Dict]:
    """Get geographic metrics."""
    try:
        query = select(GeographicMetrics).where(
            GeographicMetrics.organization_id == current_user["organization_id"]
        )
        result = await session.execute(query)
        metrics = result.scalars().all()

        return [
            {
                "state": metric.state,
                "region": metric.region,
                "total_orders": metric.total_orders,
                "total_patients": metric.total_patients,
                "total_providers": metric.total_providers,
                "metadata": metric.metadata,
            }
            for metric in metrics
        ]
    except Exception as e:
        logger.error("Failed to get geographic metrics: %s", str(e))
        raise


@router.get("/metrics/organization")
async def get_organization_metrics(
    session: AsyncSession = Depends(get_session),
    current_user: Dict = Depends(get_current_user),
) -> Dict:
    """Get organization metrics."""
    try:
        query = select(OrganizationMetrics).where(
            OrganizationMetrics.organization_id == current_user["organization_id"]
        )
        result = await session.execute(query)
        metric = result.scalar_one_or_none()

        if not metric:
            return {}

        return {
            "total_orders": metric.total_orders,
            "total_patients": metric.total_patients,
            "total_providers": metric.total_providers,
            "total_facilities": metric.total_facilities,
            "total_users": metric.total_users,
            "metadata": metric.metadata,
        }
    except Exception as e:
        logger.error("Failed to get organization metrics: %s", str(e))
        raise


@router.get("/metrics/daily")
async def get_daily_metrics(
    start_date: datetime = Query(default=None),
    end_date: datetime = Query(default=None),
    session: AsyncSession = Depends(get_session),
    current_user: Dict = Depends(get_current_user),
) -> List[Dict]:
    """Get daily metrics."""
    try:
        query = select(DailyMetrics).where(
            DailyMetrics.organization_id == current_user["organization_id"]
        )

        if start_date:
            query = query.where(DailyMetrics.date >= start_date)
        if end_date:
            query = query.where(DailyMetrics.date <= end_date)

        result = await session.execute(query)
        metrics = result.scalars().all()

        return [
            {
                "date": metric.date,
                "total_orders": metric.total_orders,
                "total_patients": metric.total_patients,
                "total_providers": metric.total_providers,
                "total_facilities": metric.total_facilities,
                "total_users": metric.total_users,
                "active_users": metric.active_users,
                "new_orders": metric.new_orders,
                "completed_orders": metric.completed_orders,
                "cancelled_orders": metric.cancelled_orders,
                "new_patients": metric.new_patients,
                "new_providers": metric.new_providers,
                "provider_metrics": metric.provider_metrics,
                "patient_metrics": metric.patient_metrics,
                "order_metrics": metric.order_metrics,
                "metadata": metric.metadata,
            }
            for metric in metrics
        ]
    except Exception as e:
        logger.error("Failed to get daily metrics: %s", str(e))
        raise


@router.get("/metrics/hourly")
async def get_hourly_metrics(
    start_time: datetime = Query(default=None),
    end_time: datetime = Query(default=None),
    session: AsyncSession = Depends(get_session),
    current_user: Dict = Depends(get_current_user),
) -> List[Dict]:
    """Get hourly metrics."""
    try:
        query = select(HourlyMetrics).where(
            HourlyMetrics.organization_id == current_user["organization_id"]
        )

        if start_time:
            query = query.where(HourlyMetrics.timestamp >= start_time)
        if end_time:
            query = query.where(HourlyMetrics.timestamp <= end_time)

        result = await session.execute(query)
        metrics = result.scalars().all()

        return [
            {
                "timestamp": metric.timestamp,
                "total_orders": metric.total_orders,
                "total_patients": metric.total_patients,
                "total_providers": metric.total_providers,
                "total_facilities": metric.total_facilities,
                "total_users": metric.total_users,
                "active_users": metric.active_users,
                "new_orders": metric.new_orders,
                "completed_orders": metric.completed_orders,
                "cancelled_orders": metric.cancelled_orders,
                "new_patients": metric.new_patients,
                "new_providers": metric.new_providers,
                "provider_metrics": metric.provider_metrics,
                "patient_metrics": metric.patient_metrics,
                "order_metrics": metric.order_metrics,
                "metadata": metric.metadata,
            }
            for metric in metrics
        ]
    except Exception as e:
        logger.error("Failed to get hourly metrics: %s", str(e))
        raise
