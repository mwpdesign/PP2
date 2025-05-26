"""Demo users for development environment."""
from typing import Dict, Any
from uuid import uuid4

# Role constants
ROLE_ADMIN = "Admin"
ROLE_DOCTOR = "Doctor"
ROLE_IVR_COMPANY = "IVRCompany"
ROLE_LOGISTICS = "Logistics"
ROLE_SALES_REP = "SalesRep"

# Demo organization and territory IDs
DEMO_ORG_ID = str(uuid4())
DEMO_TERRITORY_ID = str(uuid4())

# Demo users for development
DEMO_USERS: Dict[str, Dict[str, Any]] = {
    "doctor@test.com": {
        "id": str(uuid4()),
        "password": "demo123",
        "role": ROLE_DOCTOR,
        "name": "Dr. Smith",
        "username": "dr.smith",
        "first_name": "John",
        "last_name": "Smith",
        "is_active": True,
        "is_superuser": False,
        "organization_id": DEMO_ORG_ID,
        "primary_territory_id": DEMO_TERRITORY_ID,
        "mfa_enabled": False
    },
    "admin@test.com": {
        "id": str(uuid4()),
        "password": "demo123",
        "role": ROLE_ADMIN,
        "name": "Admin User",
        "username": "admin",
        "first_name": "Admin",
        "last_name": "User",
        "is_active": True,
        "is_superuser": True,
        "organization_id": DEMO_ORG_ID,
        "primary_territory_id": DEMO_TERRITORY_ID,
        "mfa_enabled": False
    },
    "ivr@test.com": {
        "id": str(uuid4()),
        "password": "demo123",
        "role": ROLE_IVR_COMPANY,
        "name": "IVR Rep",
        "username": "ivr.rep",
        "first_name": "IVR",
        "last_name": "Representative",
        "is_active": True,
        "is_superuser": False,
        "organization_id": DEMO_ORG_ID,
        "primary_territory_id": DEMO_TERRITORY_ID,
        "mfa_enabled": False
    },
    "logistics@test.com": {
        "id": str(uuid4()),
        "password": "demo123",
        "role": ROLE_LOGISTICS,
        "name": "Logistics Manager",
        "username": "logistics",
        "first_name": "Logistics",
        "last_name": "Manager",
        "is_active": True,
        "is_superuser": False,
        "organization_id": DEMO_ORG_ID,
        "primary_territory_id": DEMO_TERRITORY_ID,
        "mfa_enabled": False
    },
    "sales@test.com": {
        "id": str(uuid4()),
        "password": "demo123",
        "role": ROLE_SALES_REP,
        "name": "Sales Rep",
        "username": "sales.rep",
        "first_name": "Sales",
        "last_name": "Representative",
        "is_active": True,
        "is_superuser": False,
        "organization_id": DEMO_ORG_ID,
        "primary_territory_id": DEMO_TERRITORY_ID,
        "mfa_enabled": False
    }
}

# Role permissions mapping
ROLE_PERMISSIONS = {
    ROLE_ADMIN: [
        "all:*",  # Full access to everything
    ],
    ROLE_DOCTOR: [
        "patients:read",
        "patients:write",
        "orders:read",
        "orders:write",
        "ivr:read",
        "ivr:write"
    ],
    ROLE_IVR_COMPANY: [
        "ivr:read",
        "ivr:write",
        "patients:read"
    ],
    ROLE_LOGISTICS: [
        "orders:read",
        "orders:write",
        "shipping:read",
        "shipping:write"
    ],
    ROLE_SALES_REP: [
        "patients:read",
        "orders:read",
        "analytics:read"
    ]
} 