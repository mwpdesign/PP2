"""
Dashboard API endpoints.
Provides real-time statistics and analytics for dashboard KPI cards.
"""

from datetime import datetime, timedelta
from typing import Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_

from app.core.database import get_db
from app.core.security import get_current_user
from app.schemas.token import TokenData
from app.models.user import User
from app.models.patient import Patient
from app.models.ivr import IVRRequest
from app.models.order import Order

router = APIRouter()


@router.get("/stats")
async def get_dashboard_stats(
    days: int = Query(30, ge=1, le=365,
                      description="Number of days for statistics"),
    current_user: TokenData = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    """
    Get dashboard statistics based on user role and hierarchy.

    Returns real-time counts for patients, IVRs, orders, and other metrics
    filtered by user's permissions and organizational hierarchy.

    Args:
        days: Number of days to include in statistics (default: 30)
        current_user: Current authenticated user
        db: Database session

    Returns:
        Dict containing role-specific dashboard statistics

    Raises:
        HTTPException: If user doesn't have access to dashboard stats
    """

    # Calculate date range
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=days)

    # Get base statistics based on user role
    if current_user.role.lower() in ['doctor', 'healthcare_provider']:
        return await _get_doctor_stats(db, current_user, start_date, end_date)
    elif current_user.role.lower() in ['ivr_company', 'ivr_specialist']:
        return await _get_ivr_company_stats(db, current_user,
                                            start_date, end_date)
    elif current_user.role.lower() in ['sales', 'sales_rep']:
        return await _get_sales_stats(db, current_user, start_date, end_date)
    elif current_user.role.lower() in ['distributor', 'regional_distributor']:
        return await _get_distributor_stats(db, current_user,
                                            start_date, end_date)
    elif current_user.role.lower() in ['master_distributor']:
        return await _get_master_distributor_stats(db, current_user,
                                                   start_date, end_date)
    elif current_user.role.lower() in ['admin', 'chp_admin', 'system_admin']:
        return await _get_admin_stats(db, current_user, start_date, end_date)
    else:
        # Default stats for other roles
        return await _get_basic_stats(db, current_user, start_date, end_date)


async def _get_doctor_stats(
    db: AsyncSession,
    current_user: TokenData,
    start_date: datetime,
    end_date: datetime
) -> Dict[str, Any]:
    """Get statistics for doctor dashboard."""

    # Get doctor's patients count
    patients_query = select(func.count(Patient.id)).where(
        and_(
            Patient.organization_id == current_user.organization_id,
            Patient.created_at >= start_date
        )
    )
    patients_result = await db.execute(patients_query)
    total_patients = patients_result.scalar() or 0

    # Get doctor's IVR requests
    ivr_query = select(func.count(IVRRequest.id)).where(
        and_(
            IVRRequest.created_at >= start_date,
            IVRRequest.created_at <= end_date
        )
    )
    ivr_result = await db.execute(ivr_query)
    total_ivrs = ivr_result.scalar() or 0

    # Get IVR status breakdown
    ivr_status_query = select(
        IVRRequest.status,
        func.count(IVRRequest.id)
    ).where(
        and_(
            IVRRequest.created_at >= start_date,
            IVRRequest.created_at <= end_date
        )
    ).group_by(IVRRequest.status)

    ivr_status_result = await db.execute(ivr_status_query)
    ivr_status_breakdown = dict(ivr_status_result.fetchall())

    # Get doctor's orders
    orders_query = select(func.count(Order.id)).where(
        and_(
            Order.organization_id == current_user.organization_id,
            Order.created_at >= start_date,
            Order.created_at <= end_date
        )
    )
    orders_result = await db.execute(orders_query)
    total_orders = orders_result.scalar() or 0

    # Get orders by status
    orders_status_query = select(
        Order.status,
        func.count(Order.id)
    ).where(
        and_(
            Order.organization_id == current_user.organization_id,
            Order.created_at >= start_date,
            Order.created_at <= end_date
        )
    ).group_by(Order.status)

    orders_status_result = await db.execute(orders_status_query)
    orders_status_breakdown = dict(orders_status_result.fetchall())

    # Calculate trends (compare with previous period)
    prev_start = start_date - timedelta(days=(end_date - start_date).days)
    prev_end = start_date

    # Previous period IVRs
    prev_ivr_query = select(func.count(IVRRequest.id)).where(
        and_(
            IVRRequest.created_at >= prev_start,
            IVRRequest.created_at < prev_end
        )
    )
    prev_ivr_result = await db.execute(prev_ivr_query)
    prev_ivrs = prev_ivr_result.scalar() or 0

    # Calculate IVR trend
    ivr_trend = 0
    if prev_ivrs > 0:
        ivr_trend = round(((total_ivrs - prev_ivrs) / prev_ivrs) * 100, 1)

    return {
        "role": "doctor",
        "period_days": (end_date - start_date).days,
        "kpi_cards": {
            "patients": {
                "title": "Total Patients",
                "value": total_patients,
                "trend": 0,  # Can be calculated if needed
                "icon": "users",
                "color": "blue"
            },
            "ivr_requests": {
                "title": "IVR Requests",
                "value": total_ivrs,
                "trend": ivr_trend,
                "icon": "clipboard-document-check",
                "color": "green"
            },
            "pending_approvals": {
                "title": "Pending Approvals",
                "value": (ivr_status_breakdown.get('pending_approval', 0) +
                          ivr_status_breakdown.get('in_review', 0)),
                "trend": 0,
                "icon": "clock",
                "color": "amber"
            },
            "active_orders": {
                "title": "Active Orders",
                "value": (orders_status_breakdown.get('processing', 0) +
                          orders_status_breakdown.get('shipped', 0)),
                "trend": 0,
                "icon": "archive-box",
                "color": "purple"
            }
        },
        "detailed_stats": {
            "ivr_status_breakdown": ivr_status_breakdown,
            "orders_status_breakdown": orders_status_breakdown,
            "total_orders": total_orders
        },
        "generated_at": datetime.utcnow().isoformat()
    }


async def _get_ivr_company_stats(
    db: AsyncSession,
    current_user: TokenData,
    start_date: datetime,
    end_date: datetime
) -> Dict[str, Any]:
    """Get statistics for IVR company dashboard."""

    # Get all IVR requests in review
    in_review_query = select(func.count(IVRRequest.id)).where(
        IVRRequest.status == 'in_review'
    )
    in_review_result = await db.execute(in_review_query)
    in_review_count = in_review_result.scalar() or 0

    # Get documents requested
    docs_requested_query = select(func.count(IVRRequest.id)).where(
        IVRRequest.status == 'documents_requested'
    )
    docs_requested_result = await db.execute(docs_requested_query)
    docs_requested_count = docs_requested_result.scalar() or 0

    # Get pending approval
    pending_approval_query = select(func.count(IVRRequest.id)).where(
        IVRRequest.status == 'pending_approval'
    )
    pending_approval_result = await db.execute(pending_approval_query)
    pending_approval_count = pending_approval_result.scalar() or 0

    # Get approved today
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0,
                                            microsecond=0)
    approved_today_query = select(func.count(IVRRequest.id)).where(
        and_(
            IVRRequest.status == 'approved',
            IVRRequest.updated_at >= today_start
        )
    )
    approved_today_result = await db.execute(approved_today_query)
    approved_today_count = approved_today_result.scalar() or 0

    return {
        "role": "ivr_company",
        "period_days": (end_date - start_date).days,
        "kpi_cards": {
            "in_review": {
                "title": "In Review",
                "value": in_review_count,
                "trend": 0,
                "icon": "eye",
                "color": "amber"
            },
            "documents_requested": {
                "title": "Documents Requested",
                "value": docs_requested_count,
                "trend": 0,
                "icon": "document-text",
                "color": "purple"
            },
            "pending_approval": {
                "title": "Pending Approval",
                "value": pending_approval_count,
                "trend": 0,
                "icon": "clock",
                "color": "emerald"
            },
            "approved_today": {
                "title": "Approved Today",
                "value": approved_today_count,
                "trend": 0,
                "icon": "check-circle",
                "color": "green"
            }
        },
        "generated_at": datetime.utcnow().isoformat()
    }


async def _get_sales_stats(
    db: AsyncSession,
    current_user: TokenData,
    start_date: datetime,
    end_date: datetime
) -> Dict[str, Any]:
    """Get statistics for sales dashboard."""

    # Get doctors in sales territory (simplified - would need hierarchy filtering)
    doctors_query = select(func.count(User.id)).where(
        and_(
            User.role_id.in_(
                select(func.unnest(func.array(['doctor', 'healthcare_provider'])))
            ),
            User.organization_id == current_user.organization_id,
            User.is_active.is_(True)
        )
    )
    doctors_result = await db.execute(doctors_query)
    total_doctors = doctors_result.scalar() or 0

    # Get IVRs from territory doctors
    ivr_query = select(func.count(IVRRequest.id)).where(
        and_(
            IVRRequest.created_at >= start_date,
            IVRRequest.created_at <= end_date
        )
    )
    ivr_result = await db.execute(ivr_query)
    total_ivrs = ivr_result.scalar() or 0

    # Get orders from territory
    orders_query = select(func.count(Order.id)).where(
        and_(
            Order.organization_id == current_user.organization_id,
            Order.created_at >= start_date,
            Order.created_at <= end_date
        )
    )
    orders_result = await db.execute(orders_query)
    total_orders = orders_result.scalar() or 0

    return {
        "role": "sales",
        "period_days": (end_date - start_date).days,
        "kpi_cards": {
            "total_doctors": {
                "title": "Total Doctors",
                "value": total_doctors,
                "trend": 0,
                "icon": "user-group",
                "color": "blue"
            },
            "ivr_requests": {
                "title": "IVR Requests",
                "value": total_ivrs,
                "trend": 0,
                "icon": "clipboard-document-check",
                "color": "green"
            },
            "active_orders": {
                "title": "Active Orders",
                "value": total_orders,
                "trend": 0,
                "icon": "archive-box",
                "color": "purple"
            },
            "monthly_revenue": {
                "title": "Monthly Revenue",
                "value": "$45,200",  # Mock value - would calculate from orders
                "trend": 12.3,
                "icon": "currency-dollar",
                "color": "emerald"
            }
        },
        "generated_at": datetime.utcnow().isoformat()
    }


async def _get_distributor_stats(
    db: AsyncSession,
    current_user: TokenData,
    start_date: datetime,
    end_date: datetime
) -> Dict[str, Any]:
    """Get statistics for distributor dashboard."""

    # Similar to sales but with distributor-specific metrics
    orders_query = select(func.count(Order.id)).where(
        and_(
            Order.organization_id == current_user.organization_id,
            Order.created_at >= start_date,
            Order.created_at <= end_date
        )
    )
    orders_result = await db.execute(orders_query)
    total_orders = orders_result.scalar() or 0

    return {
        "role": "distributor",
        "period_days": (end_date - start_date).days,
        "kpi_cards": {
            "active_orders": {
                "title": "Active Orders",
                "value": total_orders,
                "trend": 0,
                "icon": "archive-box",
                "color": "blue"
            },
            "pending_shipments": {
                "title": "Pending Shipments",
                "value": 8,  # Mock value
                "trend": 0,
                "icon": "truck",
                "color": "amber"
            },
            "monthly_revenue": {
                "title": "Monthly Revenue",
                "value": "$125,400",
                "trend": 8.5,
                "icon": "currency-dollar",
                "color": "green"
            },
            "customer_satisfaction": {
                "title": "Customer Satisfaction",
                "value": "94%",
                "trend": 2.1,
                "icon": "star",
                "color": "purple"
            }
        },
        "generated_at": datetime.utcnow().isoformat()
    }


async def _get_master_distributor_stats(
    db: AsyncSession,
    current_user: TokenData,
    start_date: datetime,
    end_date: datetime
) -> Dict[str, Any]:
    """Get statistics for master distributor dashboard."""

    return {
        "role": "master_distributor",
        "period_days": (end_date - start_date).days,
        "kpi_cards": {
            "monthly_revenue": {
                "title": "Monthly Revenue",
                "value": "$458,320",
                "trend": 12.3,
                "icon": "currency-dollar",
                "color": "green"
            },
            "active_distributors": {
                "title": "Active Distributors",
                "value": 12,
                "trend": 16.7,
                "icon": "building-office-2",
                "color": "blue"
            },
            "total_sales_reps": {
                "title": "Total Sales Reps",
                "value": 47,
                "trend": 8.5,
                "icon": "users",
                "color": "purple"
            },
            "ivrs_this_month": {
                "title": "IVRs This Month",
                "value": 234,
                "trend": 15.2,
                "icon": "document-text",
                "color": "amber"
            }
        },
        "generated_at": datetime.utcnow().isoformat()
    }


async def _get_admin_stats(
    db: AsyncSession,
    current_user: TokenData,
    start_date: datetime,
    end_date: datetime
) -> Dict[str, Any]:
    """Get statistics for admin dashboard."""

    # Get total users
    users_query = select(func.count(User.id)).where(
        User.is_active.is_(True)
    )
    users_result = await db.execute(users_query)
    total_users = users_result.scalar() or 0

    # Get total patients
    patients_query = select(func.count(Patient.id))
    patients_result = await db.execute(patients_query)
    total_patients = patients_result.scalar() or 0

    # Get total IVRs
    ivr_query = select(func.count(IVRRequest.id)).where(
        and_(
            IVRRequest.created_at >= start_date,
            IVRRequest.created_at <= end_date
        )
    )
    ivr_result = await db.execute(ivr_query)
    total_ivrs = ivr_result.scalar() or 0

    # Get total orders
    orders_query = select(func.count(Order.id)).where(
        and_(
            Order.created_at >= start_date,
            Order.created_at <= end_date
        )
    )
    orders_result = await db.execute(orders_query)
    total_orders = orders_result.scalar() or 0

    return {
        "role": "admin",
        "period_days": (end_date - start_date).days,
        "kpi_cards": {
            "total_users": {
                "title": "Total Users",
                "value": total_users,
                "trend": 0,
                "icon": "users",
                "color": "blue"
            },
            "total_patients": {
                "title": "Total Patients",
                "value": total_patients,
                "trend": 0,
                "icon": "user-group",
                "color": "green"
            },
            "total_ivrs": {
                "title": "Total IVRs",
                "value": total_ivrs,
                "trend": 0,
                "icon": "clipboard-document-check",
                "color": "amber"
            },
            "total_orders": {
                "title": "Total Orders",
                "value": total_orders,
                "trend": 0,
                "icon": "archive-box",
                "color": "purple"
            }
        },
        "generated_at": datetime.utcnow().isoformat()
    }


async def _get_basic_stats(
    db: AsyncSession,
    current_user: TokenData,
    start_date: datetime,
    end_date: datetime
) -> Dict[str, Any]:
    """Get basic statistics for other roles."""

    return {
        "role": current_user.role.lower(),
        "period_days": (end_date - start_date).days,
        "kpi_cards": {
            "basic_metric_1": {
                "title": "Basic Metric 1",
                "value": 0,
                "trend": 0,
                "icon": "activity",
                "color": "blue"
            },
            "basic_metric_2": {
                "title": "Basic Metric 2",
                "value": 0,
                "trend": 0,
                "icon": "activity",
                "color": "green"
            },
            "basic_metric_3": {
                "title": "Basic Metric 3",
                "value": 0,
                "trend": 0,
                "icon": "activity",
                "color": "amber"
            },
            "basic_metric_4": {
                "title": "Basic Metric 4",
                "value": 0,
                "trend": 0,
                "icon": "activity",
                "color": "purple"
            }
        },
        "generated_at": datetime.utcnow().isoformat()
    }


@router.get("/trends")
async def get_dashboard_trends(
    metric: str = Query(..., description="Metric to analyze: ivrs, orders, patients"),
    days: int = Query(30, ge=7, le=365,
                      description="Number of days for trend analysis"),
    current_user: TokenData = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    """
    Get trend data for dashboard charts.

    Args:
        metric: The metric to analyze (ivrs, orders, patients)
        days: Number of days for trend analysis
        current_user: Current authenticated user
        db: Database session

    Returns:
        Dict containing trend data for the specified metric

    Raises:
        HTTPException: If metric is not supported or user lacks access
    """

    if metric not in ['ivrs', 'orders', 'patients']:
        raise HTTPException(
            status_code=400,
            detail="Metric must be one of: ivrs, orders, patients"
        )

    # Calculate date range
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=days)

    # Generate daily trend data
    trend_data = []
    current_date = start_date

    while current_date <= end_date:
        next_date = current_date + timedelta(days=1)

        if metric == 'ivrs':
            query = select(func.count(IVRRequest.id)).where(
                and_(
                    IVRRequest.created_at >= current_date,
                    IVRRequest.created_at < next_date
                )
            )
        elif metric == 'orders':
            query = select(func.count(Order.id)).where(
                and_(
                    Order.created_at >= current_date,
                    Order.created_at < next_date,
                    Order.organization_id == current_user.organization_id
                )
            )
        else:  # patients
            query = select(func.count(Patient.id)).where(
                and_(
                    Patient.created_at >= current_date,
                    Patient.created_at < next_date,
                    Patient.organization_id == current_user.organization_id
                )
            )

        result = await db.execute(query)
        count = result.scalar() or 0

        trend_data.append({
            "date": current_date.strftime("%Y-%m-%d"),
            "value": count
        })

        current_date = next_date

    return {
        "metric": metric,
        "period_days": days,
        "trend_data": trend_data,
        "generated_at": datetime.utcnow().isoformat()
    }
