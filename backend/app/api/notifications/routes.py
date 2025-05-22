"""API endpoints for notification management."""

from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.auth import get_current_user
from app.services.notification_service import (
    NotificationService,
    NotificationChannel,
    NotificationPriority
)
from app.schemas.notification import (
    NotificationCreate,
    NotificationResponse,
    NotificationStatus
)

router = APIRouter()


@router.post(
    "/notifications/",
    response_model=NotificationResponse,
    status_code=201,
    summary="Send a notification"
)
async def send_notification(
    notification: NotificationCreate,
    channel: NotificationChannel,
    priority: NotificationPriority = NotificationPriority.MEDIUM,
    recipient_id: Optional[str] = None,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Send a notification through specified channel."""
    notification_service = NotificationService(db)
    
    try:
        result = await notification_service.send_notification(
            notification=notification,
            channel=channel,
            priority=priority,
            recipient_id=recipient_id or current_user.id
        )
        return result
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to send notification: {str(e)}"
        )


@router.get(
    "/notifications/",
    response_model=List[NotificationResponse],
    summary="Get notification history"
)
async def get_notifications(
    recipient_id: Optional[str] = None,
    channel: Optional[NotificationChannel] = None,
    status: Optional[NotificationStatus] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    limit: int = Query(default=50, le=100),
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get notification history for a recipient."""
    notification_service = NotificationService(db)
    
    try:
        notifications = await notification_service.get_notification_history(
            recipient_id=recipient_id or current_user.id,
            channel=channel,
            start_date=start_date,
            end_date=end_date,
            status=status
        )
        return notifications[:limit]
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get notifications: {str(e)}"
        )


@router.get(
    "/notifications/{notification_id}",
    response_model=NotificationResponse,
    summary="Get notification details"
)
async def get_notification(
    notification_id: str,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get details of a specific notification."""
    notification_service = NotificationService(db)
    
    try:
        notification = await notification_service.get_notification_status(
            notification_id
        )
        if not notification:
            raise HTTPException(
                status_code=404,
                detail="Notification not found"
            )
        return notification
        
    except ValueError as e:
        raise HTTPException(
            status_code=404,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get notification: {str(e)}"
        )


@router.post(
    "/notifications/bulk",
    response_model=List[NotificationResponse],
    status_code=201,
    summary="Send bulk notifications"
)
async def send_bulk_notifications(
    notifications: List[NotificationCreate],
    channel: NotificationChannel,
    priority: NotificationPriority = NotificationPriority.MEDIUM,
    recipient_ids: List[str] = None,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Send notifications to multiple recipients."""
    notification_service = NotificationService(db)
    results = []
    
    try:
        for i, notification in enumerate(notifications):
            recipient_id = (
                recipient_ids[i] if recipient_ids and i < len(recipient_ids)
                else current_user.id
            )
            
            result = await notification_service.send_notification(
                notification=notification,
                channel=channel,
                priority=priority,
                recipient_id=recipient_id
            )
            results.append(result)
            
        return results
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to send bulk notifications: {str(e)}"
        ) 