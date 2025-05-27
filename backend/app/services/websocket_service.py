"""WebSocket service for real-time HIPAA-compliant notifications."""

import asyncio
import json
import logging
from typing import Dict, Set, Optional
from datetime import datetime
from fastapi import WebSocket, WebSocketDisconnect
from starlette.websockets import WebSocketState

from app.core.config import settings
from app.services.encryption import EncryptionService
from app.services.aws_kms import KMSService

logger = logging.getLogger(__name__)


class ConnectionManager:
    """Manage WebSocket connections."""

    def __init__(self):
        """Initialize connection manager."""
        self.active_connections: Dict[str, Set[WebSocket]] = {}
        self.connection_health: Dict[str, datetime] = {}
        self.encryption_service = EncryptionService()
        self.kms_service = KMSService()

        # Start health check task
        asyncio.create_task(self._health_check_loop())

    async def connect(self, websocket: WebSocket, user_id: str):
        """Accept connection and store it."""
        try:
            await websocket.accept()

            if user_id not in self.active_connections:
                self.active_connections[user_id] = set()
            self.active_connections[user_id].add(websocket)

            # Record connection time for health checks
            self.connection_health[websocket.__hash__()] = datetime.utcnow()

            # Send connection acknowledgment
            await self._send_ack(websocket, "connected")

            logger.info(f"WebSocket connection established for user {user_id}")

        except Exception as e:
            logger.error(f"Failed to establish WebSocket connection: {str(e)}")
            raise

    async def disconnect(self, websocket: WebSocket, user_id: str):
        """Remove connection."""
        try:
            if user_id in self.active_connections:
                self.active_connections[user_id].remove(websocket)
                if not self.active_connections[user_id]:
                    del self.active_connections[user_id]

            # Clean up health check record
            socket_hash = websocket.__hash__()
            if socket_hash in self.connection_health:
                del self.connection_health[socket_hash]

            logger.info(f"WebSocket connection closed for user {user_id}")

        except Exception as e:
            logger.error(f"Error during WebSocket disconnect: {str(e)}")

    async def send_personal_message(
        self,
        message: dict,
        user_id: str,
        require_ack: bool = True
    ):
        """Send message to specific user."""
        if user_id not in self.active_connections:
            logger.warning(f"No active connections for user {user_id}")
            return False

        success = False
        for websocket in self.active_connections[user_id].copy():
            try:
                # Encrypt sensitive data
                if "data" in message:
                    message["data"] = self.encryption_service.encrypt(
                        json.dumps(message["data"])
                    )

                # Add message ID for acknowledgment
                if require_ack:
                    message["message_id"] = self._generate_message_id()

                # Send message
                await websocket.send_json(message)
                success = True

                if require_ack:
                    # Wait for acknowledgment
                    try:
                        ack = await asyncio.wait_for(
                            self._wait_for_ack(websocket, message["message_id"]),
                            timeout=settings.WEBSOCKET_ACK_TIMEOUT
                        )
                        if not ack:
                            success = False
                    except asyncio.TimeoutError:
                        success = False
                        logger.warning(
                            f"Acknowledgment timeout for message {message['message_id']}"
                        )

            except WebSocketDisconnect:
                await self.disconnect(websocket, user_id)
            except Exception as e:
                logger.error(f"Error sending message to {user_id}: {str(e)}")
                success = False

        return success

    async def broadcast(self, message: dict, territory: Optional[str] = None):
        """Broadcast message to all connected clients in territory."""
        disconnected = []

        for user_id, connections in self.active_connections.items():
            # Check territory restrictions if specified
            if territory and not await self._check_territory_access(user_id, territory):
                continue

            for websocket in connections:
                try:
                    await websocket.send_json(message)
                except WebSocketDisconnect:
                    disconnected.append((websocket, user_id))
                except Exception as e:
                    logger.error(f"Error broadcasting to {user_id}: {str(e)}")

        # Clean up disconnected clients
        for websocket, user_id in disconnected:
            await self.disconnect(websocket, user_id)

    async def _health_check_loop(self):
        """Periodic health check of connections."""
        while True:
            try:
                await asyncio.sleep(settings.WEBSOCKET_HEALTH_CHECK_INTERVAL)
                await self._check_connections()
            except Exception as e:
                logger.error(f"Error in health check loop: {str(e)}")

    async def _check_connections(self):
        """Check connection health and clean up dead connections."""
        now = datetime.utcnow()
        disconnected = []

        for user_id, connections in self.active_connections.items():
            for websocket in connections:
                socket_hash = websocket.__hash__()

                # Check connection age
                if socket_hash in self.connection_health:
                    age = (now - self.connection_health[socket_hash]).total_seconds()
                    if age > settings.WEBSOCKET_MAX_AGE:
                        disconnected.append((websocket, user_id))
                        continue

                # Check connection state
                if websocket.client_state == WebSocketState.DISCONNECTED:
                    disconnected.append((websocket, user_id))
                    continue

                # Send ping
                try:
                    await websocket.send_json({"type": "ping"})
                    pong = await asyncio.wait_for(
                        websocket.receive_json(),
                        timeout=settings.WEBSOCKET_PING_TIMEOUT
                    )
                    if pong.get("type") != "pong":
                        disconnected.append((websocket, user_id))
                except Exception:
                    disconnected.append((websocket, user_id))

        # Clean up disconnected clients
        for websocket, user_id in disconnected:
            await self.disconnect(websocket, user_id)

    async def _send_ack(self, websocket: WebSocket, message_id: str):
        """Send acknowledgment message."""
        try:
            await websocket.send_json({
                "type": "ack",
                "message_id": message_id
            })
        except Exception as e:
            logger.error(f"Failed to send ack: {str(e)}")

    async def _wait_for_ack(self, websocket: WebSocket, message_id: str) -> bool:
        """Wait for message acknowledgment."""
        try:
            response = await websocket.receive_json()
            return (
                response.get("type") == "ack" and
                response.get("message_id") == message_id
            )
        except Exception as e:
            logger.error(f"Error waiting for ack: {str(e)}")
            return False

    def _generate_message_id(self) -> str:
        """Generate unique message ID."""
        from uuid import uuid4
        return str(uuid4())

    async def _check_territory_access(self, user_id: str, territory: str) -> bool:
        """Check if user has access to territory."""
        # TODO: Implement territory access check
        return True  # Placeholder