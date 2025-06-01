"""Real-time WebSocket API endpoints."""

from typing import Optional, Dict, Any
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.auth import get_current_user, verify_token
from app.services.websocket_service import ConnectionManager
from app.services.queue_service import QueueService

router = APIRouter()
manager = ConnectionManager()
queue_service = QueueService()


@router.websocket("/ws")
async def websocket_endpoint(
    websocket: WebSocket, token: str, db: Session = Depends(get_db)
):
    """WebSocket connection endpoint."""
    try:
        # Verify token and get user
        user = await verify_token(token, db)
        if not user:
            await websocket.close(code=4001)
            return

        # Accept connection
        await manager.connect(websocket, user.id)

        try:
            while True:
                # Receive message
                data = await websocket.receive_json()

                # Handle message types
                message_type = data.get("type")

                if message_type == "ping":
                    await websocket.send_json({"type": "pong"})

                elif message_type == "ack":
                    # Handle message acknowledgment
                    message_id = data.get("message_id")
                    if message_id:
                        await queue_service.delete_message(message_id)

                else:
                    # Handle other message types
                    await handle_websocket_message(data, user.id, websocket)

        except WebSocketDisconnect:
            await manager.disconnect(websocket, user.id)

    except Exception as e:
        await websocket.close(code=4000)


async def handle_websocket_message(data: dict, user_id: str, websocket: WebSocket):
    """Handle incoming WebSocket messages."""
    try:
        message_type = data.get("type")
        content = data.get("content")

        if message_type == "subscribe":
            # Handle subscription requests
            channels = content.get("channels", [])
            for channel in channels:
                await manager.subscribe(user_id, channel)
            await websocket.send_json({"type": "subscribed", "channels": channels})

        elif message_type == "unsubscribe":
            # Handle unsubscribe requests
            channels = content.get("channels", [])
            for channel in channels:
                await manager.unsubscribe(user_id, channel)
            await websocket.send_json({"type": "unsubscribed", "channels": channels})

        elif message_type == "status":
            # Handle status update requests
            status = content.get("status")
            if status:
                await manager.update_user_status(user_id, status)
                await websocket.send_json({"type": "status_updated", "status": status})

    except Exception as e:
        await websocket.send_json({"type": "error", "message": str(e)})


@router.post("/notify/{user_id}")
async def send_notification(
    user_id: str, message: dict, current_user=Depends(get_current_user)
):
    """Send real-time notification to user."""
    try:
        # Queue message for delivery
        await queue_service.send_message(message=message, user_id=user_id)

        # Attempt immediate delivery if user is connected
        success = await manager.send_personal_message(message=message, user_id=user_id)

        return {"status": "delivered" if success else "queued", "user_id": user_id}

    except Exception as e:
        return {"status": "error", "message": str(e)}


@router.post("/broadcast")
async def broadcast_message(
    message: str,
    organization_id: Optional[str] = None,
    current_user=Depends(get_current_user),
) -> Dict[str, Any]:
    """Broadcast message to all users in organization."""
    if not message:
        raise HTTPException(status_code=400, detail="Message is required")

    await manager.broadcast(message, organization_id=organization_id)

    return {"message": message, "organization_id": organization_id}
