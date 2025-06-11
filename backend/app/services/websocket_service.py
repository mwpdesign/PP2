"""WebSocket service for real-time updates."""

import logging
from typing import Dict, List, Optional, Set
from uuid import UUID
from datetime import datetime

from fastapi import WebSocket
from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger(__name__)


class WebSocketManager:
    """WebSocket connection manager with enhanced IVR support."""

    def __init__(self):
        """Initialize WebSocket manager."""
        # Organization-based connections: {org_id: [websockets]}
        self.active_connections: Dict[str, List[WebSocket]] = {}
        # User-specific connections: {user_id: websocket}
        self.user_connections: Dict[str, WebSocket] = {}
        # User to organization mapping: {user_id: org_id}
        self.user_organizations: Dict[str, str] = {}
        # IVR-specific subscriptions: {ivr_id: [user_ids]}
        self.ivr_subscriptions: Dict[str, Set[str]] = {}

    async def connect(
        self,
        websocket: WebSocket,
        user_id: UUID,
        organization_id: UUID,
    ) -> None:
        """Connect a new WebSocket client."""
        await websocket.accept()

        user_id_str = str(user_id)
        org_id_str = str(organization_id)

        # Store organization-based connection
        if org_id_str not in self.active_connections:
            self.active_connections[org_id_str] = []
        self.active_connections[org_id_str].append(websocket)

        # Store user-specific connection
        self.user_connections[user_id_str] = websocket
        self.user_organizations[user_id_str] = org_id_str

        logger.info(
            "WebSocket client connected: user_id=%s, organization_id=%s",
            user_id,
            organization_id,
        )

    async def disconnect(
        self,
        websocket: WebSocket,
        organization_id: UUID,
        user_id: Optional[UUID] = None,
    ) -> None:
        """Disconnect a WebSocket client."""
        org_id_str = str(organization_id)

        # Remove from organization connections
        if org_id_str in self.active_connections:
            if websocket in self.active_connections[org_id_str]:
                self.active_connections[org_id_str].remove(websocket)
            if not self.active_connections[org_id_str]:
                del self.active_connections[org_id_str]

        # Remove user-specific connection if provided
        if user_id:
            user_id_str = str(user_id)
            if user_id_str in self.user_connections:
                del self.user_connections[user_id_str]
            if user_id_str in self.user_organizations:
                del self.user_organizations[user_id_str]

            # Clean up IVR subscriptions
            for ivr_id, subscribers in self.ivr_subscriptions.items():
                subscribers.discard(user_id_str)
            # Remove empty subscription sets
            self.ivr_subscriptions = {
                ivr_id: subs for ivr_id, subs in self.ivr_subscriptions.items()
                if subs
            }

        logger.info(
            "WebSocket client disconnected: organization_id=%s, user_id=%s",
            organization_id,
            user_id,
        )

    async def broadcast_to_organization(
        self,
        organization_id: UUID,
        message: Dict,
    ) -> None:
        """Broadcast message to all connected clients in an organization."""
        org_id_str = str(organization_id)
        if org_id_str not in self.active_connections:
            return

        disconnected = []
        for websocket in self.active_connections[org_id_str]:
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

    async def send_to_user(
        self,
        user_id: UUID,
        message: Dict,
    ) -> bool:
        """Send message to a specific user."""
        user_id_str = str(user_id)
        if user_id_str not in self.user_connections:
            return False

        websocket = self.user_connections[user_id_str]
        try:
            await websocket.send_json(message)
            return True
        except Exception as e:
            logger.error(
                "Failed to send WebSocket message to user %s: %s",
                user_id,
                str(e),
            )
            # Clean up disconnected user
            org_id = self.user_organizations.get(user_id_str)
            if org_id:
                await self.disconnect(websocket, UUID(org_id), user_id)
            return False

    async def subscribe_to_ivr(
        self,
        user_id: UUID,
        ivr_id: str,
    ) -> None:
        """Subscribe a user to IVR status updates."""
        user_id_str = str(user_id)
        if ivr_id not in self.ivr_subscriptions:
            self.ivr_subscriptions[ivr_id] = set()
        self.ivr_subscriptions[ivr_id].add(user_id_str)

        logger.info(
            "User %s subscribed to IVR %s updates",
            user_id,
            ivr_id,
        )

    async def unsubscribe_from_ivr(
        self,
        user_id: UUID,
        ivr_id: str,
    ) -> None:
        """Unsubscribe a user from IVR status updates."""
        user_id_str = str(user_id)
        if ivr_id in self.ivr_subscriptions:
            self.ivr_subscriptions[ivr_id].discard(user_id_str)
            if not self.ivr_subscriptions[ivr_id]:
                del self.ivr_subscriptions[ivr_id]

        logger.info(
            "User %s unsubscribed from IVR %s updates",
            user_id,
            ivr_id,
        )

    async def broadcast_ivr_status_update(
        self,
        ivr_id: str,
        status: str,
        organization_id: UUID,
        metadata: Optional[Dict] = None,
    ) -> None:
        """Broadcast IVR status update to subscribed users and organization."""
        message = {
            "type": "ivr_status_update",
            "data": {
                "ivr_id": ivr_id,
                "status": status,
                "timestamp": datetime.utcnow().isoformat(),
                "metadata": metadata or {}
            }
        }

        # Send to specifically subscribed users
        if ivr_id in self.ivr_subscriptions:
            for user_id_str in self.ivr_subscriptions[ivr_id]:
                try:
                    await self.send_to_user(UUID(user_id_str), message)
                except ValueError:
                    # Invalid UUID, clean up
                    self.ivr_subscriptions[ivr_id].discard(user_id_str)

        # Also broadcast to entire organization for dashboard updates
        await self.broadcast_to_organization(organization_id, message)

        logger.info(
            "Broadcasted IVR status update: ivr_id=%s, status=%s, org_id=%s",
            ivr_id,
            status,
            organization_id,
        )

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

    def get_connection_stats(self) -> Dict:
        """Get connection statistics for monitoring."""
        total_connections = sum(
            len(conns) for conns in self.active_connections.values()
        )
        active_ivr_subs = sum(
            len(subs) for subs in self.ivr_subscriptions.values()
        )
        return {
            "total_organizations": len(self.active_connections),
            "total_connections": total_connections,
            "total_users": len(self.user_connections),
            "total_ivr_subscriptions": len(self.ivr_subscriptions),
            "active_ivr_subscriptions": active_ivr_subs,
        }


# Global WebSocket manager instance
websocket_manager = WebSocketManager()
