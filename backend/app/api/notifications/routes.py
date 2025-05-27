"""Notification endpoints for the API."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from uuid import UUID

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.notification import Notification
from app.schemas.notification import (
    NotificationCreate,
    NotificationUpdate,
    NotificationResponse
)
from app.services.notifications import NotificationService

router = APIRouter()


@router.post("", response_model=NotificationResponse)
async def create_notification(
    *,
    db: AsyncSession = Depends(get_db),
    notification_in: NotificationCreate,
    current_user: dict = Depends(get_current_user),
    recipient_id: Optional[UUID] = None
) -> NotificationResponse:
    """Create a new notification."""
    notification_service = NotificationService(db)

    # Use recipient_id if provided, otherwise use current user's ID
    recipient = recipient_id or current_user["id"]

    notification = await notification_service.create_notification(
        notification_in,
        recipient
    )
    return notification


@router.get("", response_model=List[NotificationResponse])
async def get_notifications(
    *,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
    recipient_id: Optional[UUID] = None,
    unread_only: bool = False,
    skip: int = 0,
    limit: int = 100
) -> List[NotificationResponse]:
    """Get notifications for a user."""
    notification_service = NotificationService(db)

    # Use recipient_id if provided, otherwise use current user's ID
    recipient = recipient_id or current_user["id"]

    notifications = await notification_service.get_notifications(
        recipient_id=recipient,
        unread_only=unread_only,
        skip=skip,
        limit=limit
    )
    return notifications


@router.put("/{notification_id}", response_model=NotificationResponse)
async def update_notification(
    *,
    db: AsyncSession = Depends(get_db),
    notification_id: UUID,
    notification_in: NotificationUpdate,
    current_user: dict = Depends(get_current_user)
) -> NotificationResponse:
    """Update a notification."""
    notification_service = NotificationService(db)

    # Get existing notification
    notification = await notification_service.get_notification(notification_id)
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )

    # Check if user has permission to update
    if notification.recipient_id != current_user["id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )

    notification = await notification_service.update_notification(
        notification_id,
        notification_in
    )
    return notification


@router.delete("/{notification_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_notification(
    *,
    db: AsyncSession = Depends(get_db),
    notification_id: UUID,
    current_user: dict = Depends(get_current_user)
):
    """Delete a notification."""
    notification_service = NotificationService(db)

    # Get existing notification
    notification = await notification_service.get_notification(notification_id)
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )

    # Check if user has permission to delete
    if notification.recipient_id != current_user["id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )

    await notification_service.delete_notification(notification_id)


@router.post("/{notification_id}/mark-read")
async def mark_notification_read(
    *,
    db: AsyncSession = Depends(get_db),
    notification_id: UUID,
    current_user: dict = Depends(get_current_user)
):
    """Mark a notification as read."""
    notification_service = NotificationService(db)

    # Get existing notification
    notification = await notification_service.get_notification(notification_id)
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )

    # Check if user has permission to update
    if notification.recipient_id != current_user["id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )

    await notification_service.mark_notification_read(notification_id)
    return {"message": "Notification marked as read"}