"""
Sales Dashboard API endpoints.
Provides statistics and analytics for sales representatives.
"""

from datetime import datetime, timedelta
from typing import Dict, Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user
from app.schemas.token import TokenData

router = APIRouter()


@router.get("/dashboard-stats")
async def get_sales_dashboard_stats(
    current_user: TokenData = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    """
    Get sales dashboard statistics.

    Returns mock data for now, will be replaced with real database queries
    based on user's sales hierarchy and territory access.

    Args:
        current_user: Current authenticated user (must be sales role)
        db: Database session

    Returns:
        Dict containing dashboard statistics

    Raises:
        HTTPException: If user doesn't have sales role access
    """

    # Check if user has sales role access
    allowed_roles = ["Sales", "sales", "sales_rep"]
    if current_user.role not in allowed_roles:
        raise HTTPException(
            status_code=403,
            detail=(
                f"Access denied. Required roles: {allowed_roles}. "
                f"User role: {current_user.role}"
            )
        )

    # Mock data structure - will be replaced with real database queries
    mock_stats = {
        "doctors": {
            "total": 12,
            "active": 8,
            "inactive": 4,
            "new_this_month": 2,
            "change_from_last_month": 20
        },
        "ivrs": {
            "total_this_month": 45,
            "approved": 38,
            "pending": 5,
            "denied": 2,
            "change_from_last_month": 15
        },
        "orders": {
            "total_this_month": 35,
            "delivered": 28,
            "in_transit": 5,
            "processing": 2,
            "change_from_last_month": -5
        },
        "recent_activity": [
            {
                "type": "ivr_approved",
                "description": "IVR Approved - Dr. Johnson",
                "timestamp": "2 hours ago"
            },
            {
                "type": "order_shipped",
                "description": "Order Shipped - Dr. Martinez",
                "timestamp": "4 hours ago"
            },
            {
                "type": "doctor_added",
                "description": "New Doctor Added - Dr. Williams",
                "timestamp": "1 day ago"
            },
            {
                "type": "ivr_submitted",
                "description": "New IVR Request - Dr. Chen",
                "timestamp": "1 day ago"
            },
            {
                "type": "order_delivered",
                "description": "Order Delivered - Dr. Smith",
                "timestamp": "2 days ago"
            }
        ],
        "user_info": {
            "id": str(current_user.id),
            "email": current_user.email,
            "role": current_user.role,
            "organization_id": str(current_user.organization_id)
        },
        "generated_at": datetime.utcnow().isoformat()
    }

    return mock_stats


@router.get("/recent-activity")
async def get_recent_activity(
    limit: int = 10,
    current_user: TokenData = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> List[Dict[str, Any]]:
    """
    Get recent activity for sales dashboard.

    Args:
        limit: Maximum number of activities to return
        current_user: Current authenticated user
        db: Database session

    Returns:
        List of recent activities
    """

    # Check if user has sales role access
    allowed_roles = ["Sales", "sales", "sales_rep"]
    if current_user.role not in allowed_roles:
        raise HTTPException(
            status_code=403,
            detail=(
                f"Access denied. Required roles: {allowed_roles}. "
                f"User role: {current_user.role}"
            )
        )

    # Mock recent activities - will be replaced with real database queries
    mock_activities = [
        {
            "id": 1,
            "type": "ivr_approved",
            "description": "IVR Approved - Dr. Johnson",
            "timestamp": (datetime.utcnow() - timedelta(hours=2)).isoformat(),
            "details": {
                "doctor_name": "Dr. Johnson",
                "ivr_id": "IVR-2024-001",
                "amount": "$1,250.00"
            }
        },
        {
            "id": 2,
            "type": "order_shipped",
            "description": "Order Shipped - Dr. Martinez",
            "timestamp": (datetime.utcnow() - timedelta(hours=4)).isoformat(),
            "details": {
                "doctor_name": "Dr. Martinez",
                "order_id": "ORD-2024-001",
                "tracking": "1Z999AA1234567890"
            }
        },
        {
            "id": 3,
            "type": "doctor_added",
            "description": "New Doctor Added - Dr. Williams",
            "timestamp": (datetime.utcnow() - timedelta(days=1)).isoformat(),
            "details": {
                "doctor_name": "Dr. Williams",
                "specialty": "Wound Care",
                "facility": "Metro Medical Center"
            }
        },
        {
            "id": 4,
            "type": "ivr_submitted",
            "description": "New IVR Request - Dr. Chen",
            "timestamp": (
                datetime.utcnow() - timedelta(days=1, hours=2)
            ).isoformat(),
            "details": {
                "doctor_name": "Dr. Chen",
                "ivr_id": "IVR-2024-002",
                "patient": "Patient #12345"
            }
        },
        {
            "id": 5,
            "type": "order_delivered",
            "description": "Order Delivered - Dr. Smith",
            "timestamp": (datetime.utcnow() - timedelta(days=2)).isoformat(),
            "details": {
                "doctor_name": "Dr. Smith",
                "order_id": "ORD-2024-002",
                "amount": "$850.00"
            }
        }
    ]

    # Apply limit
    return mock_activities[:limit]


@router.get("/performance-metrics")
async def get_performance_metrics(
    # Time period options: month, quarter, year
    period: str = "month",
    current_user: TokenData = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    """
    Get sales performance metrics.

    Args:
        period: Time period for metrics (month, quarter, year)
        current_user: Current authenticated user
        db: Database session

    Returns:
        Dict containing performance metrics
    """

    # Check if user has sales role access
    allowed_roles = ["Sales", "sales", "sales_rep"]
    if current_user.role not in allowed_roles:
        raise HTTPException(
            status_code=403,
            detail=(
                f"Access denied. Required roles: {allowed_roles}. "
                f"User role: {current_user.role}"
            )
        )

    # Mock performance data - will be replaced with real calculations
    mock_metrics = {
        "period": period,
        "revenue": {
            "current": 45200.00,
            "target": 50000.00,
            "previous": 38500.00,
            "growth_percentage": 17.4
        },
        "doctors": {
            "new_acquisitions": 2,
            "target": 3,
            "retention_rate": 95.5
        },
        "ivrs": {
            "approval_rate": 84.4,
            "average_processing_time": "2.3 days",
            "total_processed": 45
        },
        "orders": {
            "fulfillment_rate": 97.1,
            "average_delivery_time": "3.2 days",
            "total_orders": 35
        },
        "rankings": {
            "regional_rank": 3,
            "total_reps": 15,
            "percentile": 80
        }
    }

    return mock_metrics
