"""Analytics API endpoints for admin dashboard."""

from datetime import datetime, timedelta
from typing import Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_admin_user
from app.services.redis_cache import RedisCache

router = APIRouter()
cache = RedisCache()


@router.get("/admin/dashboard/overview")
async def get_admin_dashboard_overview(
    start_date: datetime = Query(
        default_factory=lambda: datetime.now() - timedelta(days=30)
    ),
    end_date: datetime = Query(
        default_factory=lambda: datetime.now()
    ),
    territory_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: Dict = Depends(get_current_admin_user)
) -> Dict:
    """Get overview metrics for admin dashboard."""
    cache_key = (
        f"dashboard:admin:overview:{current_user['id']}:"
        f"{start_date.date()}:{end_date.date()}"
    )
    
    # Try to get from cache first
    if cached_data := cache.get(cache_key):
        return cached_data
    
    # Calculate metrics from database
    metrics_query = """
        SELECT
            COUNT(DISTINCT c.call_id) as total_calls,
            AVG(c.duration_seconds) as avg_call_duration,
            COUNT(DISTINCT o.order_id) as total_orders,
            SUM(o.total_amount) as total_revenue,
            AVG(CASE WHEN c.approval_status = 'approved' 
                THEN 1 ELSE 0 END) as approval_rate,
            COUNT(DISTINCT n.notification_id) as total_notifications,
            AVG(CASE WHEN n.status = 'delivered' 
                THEN 1 ELSE 0 END) as notification_success_rate
        FROM fact_calls c
        LEFT JOIN fact_orders o 
            ON c.organization_id = o.organization_id 
            AND DATE(c.partition_date) = DATE(o.partition_date)
        LEFT JOIN fact_notifications n 
            ON c.organization_id = n.organization_id 
            AND DATE(c.partition_date) = DATE(n.partition_date)
        WHERE DATE(c.partition_date) BETWEEN :start_date AND :end_date
    """
    
    if territory_id:
        metrics_query += " AND c.territory_id = :territory_id"
    
    result = db.execute(
        metrics_query,
        {
            "start_date": start_date.date(),
            "end_date": end_date.date(),
            "territory_id": territory_id
        }
    ).first()
    
    metrics = {
        "total_calls": result.total_calls,
        "avg_call_duration": float(result.avg_call_duration),
        "total_orders": result.total_orders,
        "total_revenue": float(result.total_revenue),
        "approval_rate": float(result.approval_rate),
        "total_notifications": result.total_notifications,
        "notification_success_rate": float(result.notification_success_rate),
        "time_range": {
            "start": start_date.isoformat(),
            "end": end_date.isoformat()
        }
    }
    
    # Cache the results
    cache.set(cache_key, metrics, ttl=300)  # 5 minutes TTL
    return metrics


@router.get("/admin/dashboard/territory-metrics")
async def get_territory_metrics(
    start_date: datetime = Query(
        default_factory=lambda: datetime.now() - timedelta(days=30)
    ),
    end_date: datetime = Query(
        default_factory=lambda: datetime.now()
    ),
    db: Session = Depends(get_db),
    current_user: Dict = Depends(get_current_admin_user)
) -> List[Dict]:
    """Get metrics breakdown by territory."""
    cache_key = (
        f"dashboard:admin:territory:{current_user['id']}:"
        f"{start_date.date()}:{end_date.date()}"
    )
    
    if cached_data := cache.get(cache_key):
        return cached_data
    
    metrics_query = """
        SELECT
            g.territory_id,
            g.state,
            g.region,
            COUNT(DISTINCT c.call_id) as total_calls,
            AVG(c.duration_seconds) as avg_call_duration,
            COUNT(DISTINCT o.order_id) as total_orders,
            SUM(o.total_amount) as total_revenue,
            AVG(CASE WHEN c.approval_status = 'approved' 
                THEN 1 ELSE 0 END) as approval_rate
        FROM fact_calls c
        JOIN dim_geography g ON c.geography_id = g.id
        LEFT JOIN fact_orders o 
            ON c.organization_id = o.organization_id 
            AND DATE(c.partition_date) = DATE(o.partition_date)
        WHERE DATE(c.partition_date) BETWEEN :start_date AND :end_date
        GROUP BY g.territory_id, g.state, g.region
        ORDER BY total_calls DESC
    """
    
    results = db.execute(
        metrics_query,
        {
            "start_date": start_date.date(),
            "end_date": end_date.date()
        }
    ).fetchall()
    
    territory_metrics = [
        {
            "territory_id": row.territory_id,
            "state": row.state,
            "region": row.region,
            "total_calls": row.total_calls,
            "avg_call_duration": float(row.avg_call_duration),
            "total_orders": row.total_orders,
            "total_revenue": float(row.total_revenue),
            "approval_rate": float(row.approval_rate)
        }
        for row in results
    ]
    
    # Cache the results
    cache.set(cache_key, territory_metrics, ttl=300)  # 5 minutes TTL
    return territory_metrics


@router.get("/admin/dashboard/provider-performance")
async def get_provider_performance(
    start_date: datetime = Query(
        default_factory=lambda: datetime.now() - timedelta(days=30)
    ),
    end_date: datetime = Query(
        default_factory=lambda: datetime.now()
    ),
    db: Session = Depends(get_db),
    current_user: Dict = Depends(get_current_admin_user)
) -> List[Dict]:
    """Get performance metrics by insurance provider."""
    cache_key = (
        f"dashboard:admin:providers:{current_user['id']}:"
        f"{start_date.date()}:{end_date.date()}"
    )
    
    if cached_data := cache.get(cache_key):
        return cached_data
    
    metrics_query = """
        SELECT
            i.provider_id,
            i.name as provider_name,
            i.type as provider_type,
            COUNT(c.call_id) as total_verifications,
            AVG(c.verification_time_seconds) as avg_verification_time,
            AVG(CASE WHEN c.approval_status = 'approved' 
                THEN 1 ELSE 0 END) as approval_rate,
            AVG(CASE WHEN c.verification_time_seconds <= i.response_sla 
                THEN 1 ELSE 0 END) as sla_compliance
        FROM fact_calls c
        JOIN dim_insurance_provider i ON c.insurance_provider_id = i.id
        WHERE DATE(c.partition_date) BETWEEN :start_date AND :end_date
        GROUP BY i.provider_id, i.name, i.type
        ORDER BY total_verifications DESC
    """
    
    results = db.execute(
        metrics_query,
        {
            "start_date": start_date.date(),
            "end_date": end_date.date()
        }
    ).fetchall()
    
    provider_metrics = [
        {
            "provider_id": row.provider_id,
            "name": row.provider_name,
            "type": row.provider_type,
            "total_verifications": row.total_verifications,
            "avg_verification_time": float(row.avg_verification_time),
            "approval_rate": float(row.approval_rate),
            "sla_compliance": float(row.sla_compliance)
        }
        for row in results
    ]
    
    # Cache the results
    cache.set(cache_key, provider_metrics, ttl=300)  # 5 minutes TTL
    return provider_metrics


@router.get("/admin/dashboard/trend-analysis")
async def get_trend_analysis(
    metric: str = Query(
        ..., description="Metric to analyze: calls, orders, approvals"
    ),
    interval: str = Query(
        "daily", description="Interval: hourly, daily, weekly"
    ),
    start_date: datetime = Query(
        default_factory=lambda: datetime.now() - timedelta(days=30)
    ),
    end_date: datetime = Query(
        default_factory=lambda: datetime.now()
    ),
    db: Session = Depends(get_db),
    current_user: Dict = Depends(get_current_admin_user)
) -> List[Dict]:
    """Get trend analysis for specified metric."""
    cache_key = (
        f"dashboard:admin:trends:{current_user['id']}:{metric}:{interval}:"
        f"{start_date.date()}:{end_date.date()}"
    )
    
    if cached_data := cache.get(cache_key):
        return cached_data
    
    # Define time grouping based on interval
    time_group = {
        "hourly": "DATE_TRUNC('hour', t.date)",
        "daily": "DATE_TRUNC('day', t.date)",
        "weekly": "DATE_TRUNC('week', t.date)"
    }.get(interval)
    
    if not time_group:
        raise HTTPException(status_code=400, detail="Invalid interval")
    
    # Define metric calculation based on metric type
    metric_calc = {
        "calls": "COUNT(DISTINCT c.call_id)",
        "orders": "COUNT(DISTINCT o.order_id)",
        "approvals": (
            "SUM(CASE WHEN c.approval_status = 'approved' THEN 1 ELSE 0 END)"
        )
    }.get(metric)
    
    if not metric_calc:
        raise HTTPException(status_code=400, detail="Invalid metric")
    
    trend_query = f"""
        SELECT
            {time_group} as time_period,
            {metric_calc} as metric_value
        FROM fact_calls c
        JOIN dim_time t ON c.time_id = t.id
        LEFT JOIN fact_orders o 
            ON c.organization_id = o.organization_id 
            AND DATE(c.partition_date) = DATE(o.partition_date)
        WHERE t.date BETWEEN :start_date AND :end_date
        GROUP BY time_period
        ORDER BY time_period
    """
    
    results = db.execute(
        trend_query,
        {
            "start_date": start_date,
            "end_date": end_date
        }
    ).fetchall()
    
    trends = [
        {
            "time_period": row.time_period.isoformat(),
            "value": float(row.metric_value)
        }
        for row in results
    ]
    
    # Cache the results
    cache.set(cache_key, trends, ttl=300)  # 5 minutes TTL
    return trends 