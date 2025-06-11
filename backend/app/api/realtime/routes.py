"""Real-time WebSocket API endpoints."""

from typing import Optional, Dict, Any
from fastapi import (
    APIRouter,
    WebSocket,
    WebSocketDisconnect,
    Depends,
    HTTPException,
    Query,
)
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
import logging

from app.core.database import get_db
from app.core.security import get_current_user, verify_websocket_token
from app.services.websocket_service import websocket_manager

router = APIRouter()
logger = logging.getLogger(__name__)


@router.websocket("/ws")
async def websocket_endpoint(
    websocket: WebSocket,
    token: str = Query(..., description="Authentication token"),
    db: AsyncSession = Depends(get_db)
):
    """Enhanced WebSocket connection endpoint with IVR support."""
    try:
        # Verify token and get user
        user_data = await verify_websocket_token(token, db)
        if not user_data:
            await websocket.close(code=4001, reason="Authentication failed")
            return

        user_id = user_data["id"]
        organization_id = user_data["organization_id"]

        # Connect to WebSocket manager
        await websocket_manager.connect(
            websocket,
            UUID(user_id),
            UUID(organization_id)
        )

        logger.info(
            "WebSocket connected: user_id=%s, org_id=%s",
            user_id,
            organization_id
        )

        try:
            while True:
                # Receive message from client
                data = await websocket.receive_json()
                await handle_websocket_message(
                    data,
                    UUID(user_id),
                    UUID(organization_id),
                    websocket
                )

        except WebSocketDisconnect:
            logger.info("WebSocket disconnected: user_id=%s", user_id)
            await websocket_manager.disconnect(
                websocket,
                UUID(organization_id),
                UUID(user_id)
            )

    except Exception as e:
        logger.error("WebSocket error: %s", str(e), exc_info=True)
        await websocket.close(code=4000, reason="Internal server error")


async def handle_websocket_message(
    data: dict,
    user_id: UUID,
    organization_id: UUID,
    websocket: WebSocket
):
    """Handle incoming WebSocket messages with IVR support."""
    try:
        message_type = data.get("type")
        content = data.get("content", {})

        if message_type == "ping":
            await websocket.send_json({"type": "pong"})

        elif message_type == "subscribe_ivr":
            # Subscribe to specific IVR updates
            ivr_id = content.get("ivr_id")
            if ivr_id:
                await websocket_manager.subscribe_to_ivr(user_id, ivr_id)
                await websocket.send_json({
                    "type": "ivr_subscribed",
                    "ivr_id": ivr_id
                })

        elif message_type == "unsubscribe_ivr":
            # Unsubscribe from specific IVR updates
            ivr_id = content.get("ivr_id")
            if ivr_id:
                await websocket_manager.unsubscribe_from_ivr(user_id, ivr_id)
                await websocket.send_json({
                    "type": "ivr_unsubscribed",
                    "ivr_id": ivr_id
                })

        elif message_type == "get_connection_stats":
            # Return connection statistics (admin only)
            stats = websocket_manager.get_connection_stats()
            await websocket.send_json({
                "type": "connection_stats",
                "data": stats
            })

        else:
            await websocket.send_json({
                "type": "error",
                "message": f"Unknown message type: {message_type}"
            })

    except Exception as e:
        logger.error("Error handling WebSocket message: %s", str(e))
        await websocket.send_json({
            "type": "error",
            "message": "Failed to process message"
        })


@router.post("/notify/ivr/{ivr_id}")
async def notify_ivr_update(
    ivr_id: str,
    notification_data: Dict[str, Any],
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Send IVR-specific notification to subscribed users."""
    try:
        # Get organization ID from current user
        organization_id = UUID(current_user.get("organization_id"))

        # Extract notification details
        status = notification_data.get("status", "unknown")
        metadata = notification_data.get("metadata", {})

        # Broadcast IVR update
        await websocket_manager.broadcast_ivr_status_update(
            ivr_id=ivr_id,
            status=status,
            organization_id=organization_id,
            metadata=metadata
        )

        return {
            "success": True,
            "message": "IVR notification sent",
            "ivr_id": ivr_id,
            "recipients": len(
                websocket_manager.ivr_subscriptions.get(ivr_id, set())
            )
        }

    except Exception as e:
        logger.error("Failed to send IVR notification: %s", str(e))
        raise HTTPException(
            status_code=500,
            detail=f"Failed to send notification: {str(e)}"
        )


@router.post("/notify/user/{user_id}")
async def send_user_notification(
    user_id: str,
    message: dict,
    current_user: dict = Depends(get_current_user)
):
    """Send real-time notification to specific user."""
    try:
        success = await websocket_manager.send_to_user(
            UUID(user_id),
            message
        )

        return {
            "status": "delivered" if success else "user_not_connected",
            "user_id": user_id
        }

    except Exception as e:
        logger.error("Failed to send user notification: %s", str(e))
        return {"status": "error", "message": str(e)}


@router.post("/broadcast/organization")
async def broadcast_to_organization(
    message: dict,
    organization_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
) -> Dict[str, Any]:
    """Broadcast message to all users in organization."""
    try:
        # Use current user's organization if not specified
        target_org_id = organization_id or current_user.get("organization_id")
        if not target_org_id:
            raise HTTPException(
                status_code=400,
                detail="Organization ID required"
            )

        await websocket_manager.broadcast_to_organization(
            UUID(target_org_id),
            message
        )

        return {
            "success": True,
            "message": "Broadcast sent",
            "organization_id": target_org_id
        }

    except Exception as e:
        logger.error("Failed to broadcast message: %s", str(e))
        raise HTTPException(
            status_code=500,
            detail=f"Failed to broadcast: {str(e)}"
        )


@router.get("/stats")
async def get_websocket_stats(
    current_user: dict = Depends(get_current_user)
):
    """Get WebSocket connection statistics."""
    try:
        stats = websocket_manager.get_connection_stats()
        return {
            "success": True,
            "stats": stats,
            "timestamp": "2024-03-16T10:30:00Z"
        }
    except Exception as e:
        logger.error("Failed to get WebSocket stats: %s", str(e))
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get stats: {str(e)}"
        )
