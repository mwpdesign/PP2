"""
Mock services server for local development.
Provides mock implementations of external services like UPS and Twilio.
"""

from datetime import datetime
from typing import Dict, Any, Optional

import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel


app = FastAPI(title="Healthcare IVR Mock Services")


# Enable CORS for mock services - restrict to local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept"],
)


# Mock delay in milliseconds
MOCK_DELAY_MS = int(os.getenv("MOCK_DELAY_MS", "100"))


# Mock UPS credentials
UPS_CREDS = {
    "api_key": os.getenv("MOCK_UPS_API_KEY", "test_ups_api_key"),
    "username": os.getenv("MOCK_UPS_USERNAME", "test_ups_username"),
    "password": os.getenv("MOCK_UPS_PASSWORD", "test_ups_password"),
    "account": os.getenv("MOCK_UPS_ACCOUNT", "test_ups_account"),
}


# Mock Twilio credentials
TWILIO_CREDS = {
    "account_sid": os.getenv("MOCK_TWILIO_ACCOUNT_SID", "test_twilio_sid"),
    "auth_token": os.getenv("MOCK_TWILIO_AUTH_TOKEN", "test_twilio_token"),
    "phone": os.getenv("MOCK_TWILIO_PHONE", "+15555555555"),
}


class ShipmentRequest(BaseModel):
    """Shipment request model."""

    from_address: Dict[str, str]
    to_address: Dict[str, str]
    weight: float
    service_type: str


class CallRequest(BaseModel):
    """IVR call request model."""

    to_number: str
    message: str
    callback_url: Optional[str] = None


@app.get("/health")
async def health_check() -> Dict[str, str]:
    """Health check endpoint."""
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}


@app.get("/dashboard")
async def dashboard() -> Dict[str, Any]:
    """Mock services dashboard."""
    return {
        "services": {
            "ups": {
                "status": "active",
                "credentials": UPS_CREDS,
                "endpoints": [
                    "/ups/rates",
                    "/ups/ship",
                    "/ups/track/{tracking_number}",
                ],
            },
            "twilio": {
                "status": "active",
                "credentials": TWILIO_CREDS,
                "endpoints": ["/twilio/call", "/twilio/status/{call_sid}"],
            },
        },
        "mock_delay_ms": MOCK_DELAY_MS,
        "uptime": "0h 0m 0s",  # TODO: Implement actual uptime
    }


@app.post("/ups/rates")
async def get_ups_rates(request: ShipmentRequest) -> Dict[str, Any]:
    """Mock UPS rate calculation."""
    # Validate credentials
    if not all(UPS_CREDS.values()):
        raise HTTPException(status_code=401, detail="Invalid UPS credentials")

    # Calculate mock rate based on weight
    base_rate = 10.00
    rate_per_pound = 0.50
    total = base_rate + (request.weight * rate_per_pound)

    return {
        "service_type": request.service_type,
        "total_charges": round(total, 2),
        "currency": "USD",
        "delivery_date": (
            datetime.utcnow()
            .replace(hour=17, minute=0, second=0, microsecond=0)
            .isoformat()
        ),
        "guaranteed": True,
    }


@app.post("/ups/ship")
async def create_shipment(request: ShipmentRequest) -> Dict[str, Any]:
    """Mock UPS shipment creation."""
    # Generate mock tracking number
    tracking_number = f"1Z999{datetime.utcnow().strftime('%Y%m%d%H%M%S')}"

    return {
        "tracking_number": tracking_number,
        "label_url": f"http://localhost:8001/labels/{tracking_number}.pdf",
        "rate": await get_ups_rates(request),
    }


@app.get("/ups/track/{tracking_number}")
async def track_shipment(tracking_number: str) -> Dict[str, Any]:
    """Mock UPS tracking."""
    return {
        "tracking_number": tracking_number,
        "status": "In Transit",
        "estimated_delivery": (
            datetime.utcnow()
            .replace(hour=17, minute=0, second=0, microsecond=0)
            .isoformat()
        ),
        "current_location": "Local Facility",
        "events": [
            {
                "timestamp": datetime.utcnow().isoformat(),
                "location": "Local Facility",
                "description": "Package is out for delivery",
            }
        ],
    }


@app.post("/twilio/call")
async def initiate_call(request: CallRequest) -> Dict[str, Any]:
    """Mock Twilio call initiation."""
    # Generate mock call SID
    call_sid = f"CA{datetime.utcnow().strftime('%Y%m%d%H%M%S')}"

    return {
        "sid": call_sid,
        "to": request.to_number,
        "from": TWILIO_CREDS["phone"],
        "status": "queued",
        "direction": "outbound-api",
        "callback_url": request.callback_url,
    }


@app.get("/twilio/status/{call_sid}")
async def get_call_status(call_sid: str) -> Dict[str, Any]:
    """Mock Twilio call status."""
    return {
        "sid": call_sid,
        "status": "completed",
        "duration": "60",
        "direction": "outbound-api",
        "answered_by": "human",
        "caller_name": "HEALTHCARE IVR",
    }


if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("PORT", "8001"))
    uvicorn.run(app, host="0.0.0.0", port=port)
