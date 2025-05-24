# Order Management API

## Endpoints

### Create Order
```http
POST /api/v1/orders
Content-Type: application/json
Authorization: Bearer {token}
Territory-Id: {territory_id}

{
  "patient_id": "string",
  "provider_id": "string",
  "insurance_info": {
    "carrier": "string",
    "policy_number": "string",
    "group_number": "string"
  },
  "service_type": "string",
  "priority": "normal|urgent|emergency"
}
```

#### Response
```json
{
  "status": "success",
  "data": {
    "order_id": "uuid",
    "status": "pending_verification",
    "created_at": "ISO-8601",
    "tracking_id": "string"
  }
}
```

### Update Order Status
```http
PUT /api/v1/orders/{order_id}/status
Content-Type: application/json
Authorization: Bearer {token}
Territory-Id: {territory_id}

{
  "status": "verified|rejected|completed",
  "notes": "string",
  "verification_data": {
    "verified_by": "string",
    "verification_method": "string",
    "coverage_details": {}
  }
}
```

#### Response
```json
{
  "status": "success",
  "data": {
    "order_id": "uuid",
    "status": "string",
    "updated_at": "ISO-8601",
    "audit_id": "uuid"
  }
}
```

## Status Workflow

### Valid Status Transitions
```typescript
const STATUS_TRANSITIONS = {
  'pending_verification': ['verified', 'rejected'],
  'verified': ['completed', 'cancelled'],
  'rejected': ['pending_verification', 'cancelled'],
  'completed': [],
  'cancelled': []
};
```

### Status Validation
```python
async def validate_status_transition(
    order_id: str,
    new_status: str,
    context: dict
) -> bool:
    current = await get_order_status(order_id)
    if new_status not in STATUS_TRANSITIONS[current]:
        raise InvalidTransitionError(
            f"Cannot transition from {current} to {new_status}"
        )
    await audit_log.record_status_change(order_id, context)
    return True
```

## Real-time Updates

### WebSocket Connection
```typescript
// Client-side implementation
const orderSocket = new WebSocket(
  `${WS_URL}/orders?territory=${territory_id}`
);

orderSocket.onmessage = (event) => {
  const update = JSON.parse(event.data);
  if (update.type === 'status_change') {
    updateOrderStatus(update.order_id, update.status);
  }
};
```

### Server Events
```python
async def broadcast_status_change(
    order_id: str,
    status: str,
    territory_id: str
):
    event = {
        "type": "status_change",
        "order_id": order_id,
        "status": status,
        "timestamp": datetime.utcnow().isoformat()
    }
    await websocket_manager.broadcast_to_territory(
        territory_id,
        event
    )
```

## Error Handling

### Common Errors
```json
{
  "status": "error",
  "error": {
    "code": "ORDER_NOT_FOUND",
    "message": "Order not found",
    "details": {
      "order_id": "uuid"
    }
  }
}
```

### Error Codes
- `ORDER_NOT_FOUND`: Order does not exist
- `INVALID_STATUS`: Invalid status transition
- `TERRITORY_MISMATCH`: Order not in user's territory
- `PERMISSION_DENIED`: Insufficient permissions
- `VALIDATION_ERROR`: Invalid request data

## Rate Limits
- Create: 100 requests per minute per territory
- Update: 200 requests per minute per territory
- Query: 500 requests per minute per territory
- WebSocket: 1000 messages per minute per territory 