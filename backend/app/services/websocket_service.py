"""WebSocket service for real-time updates."""
import logging
from typing import Dict, List, Optional
from uuid import UUID

from fastapi import WebSocket
from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger(__name__)


class WebSocketManager:
    """WebSocket connection manager."""

    def __init__(self):
        """Initialize WebSocket manager."""
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(
        self,
        websocket: WebSocket,
        user_id: UUID,
        organization_id: UUID,
    ) -> None:
        """Connect a new WebSocket client."""
        await websocket.accept()
        if str(organization_id) not in self.active_connections:
            self.active_connections[str(organization_id)] = []
        self.active_connections[str(organization_id)].append(websocket)
        logger.info(
            "WebSocket client connected: user_id=%s, organization_id=%s",
            user_id,
            organization_id,
        )

    async def disconnect(
        self,
        websocket: WebSocket,
        organization_id: UUID,
    ) -> None:
        """Disconnect a WebSocket client."""
        if str(organization_id) in self.active_connections:
            self.active_connections[str(organization_id)].remove(websocket)
            if not self.active_connections[str(organization_id)]:
                del self.active_connections[str(organization_id)]
            logger.info(
                "WebSocket client disconnected: organization_id=%s",
                organization_id,
            )

    async def broadcast_to_organization(
        self,
        organization_id: UUID,
        message: Dict,
    ) -> None:
        """Broadcast message to all connected clients in an organization."""
        if str(organization_id) not in self.active_connections:
            return

        disconnected = []
        for websocket in self.active_connections[str(organization_id)]:
            try:
                await websocket.send_json(message)
            except Exception as e:
                logger.error(
                    "Failed to send WebSocket message: %s",
                    str(e),
                )
                disconnected.append(websocket)

        # Clean up disconnected clients
        for websocket in disconnected:
            await self.disconnect(websocket, organization_id)

    async def send_to_client(
        self,
        websocket: WebSocket,
        message: Dict,
    ) -> None:
        """Send message to a specific client."""
        try:
            await websocket.send_json(message)
        except Exception as e:
            logger.error(
                "Failed to send WebSocket message: %s",
                str(e),
            )