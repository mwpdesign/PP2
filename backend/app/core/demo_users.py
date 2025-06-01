"""Demo user data for development and testing."""

from uuid import uuid4

# Demo organization ID
DEMO_ORG_ID = str(uuid4())

# Demo user data
DEMO_USERS = [
    {
        "id": str(uuid4()),
        "email": "admin@example.com",
        "password": "admin123",
        "first_name": "Admin",
        "last_name": "User",
        "is_active": True,
        "is_superuser": True,
        "organization_id": DEMO_ORG_ID,
        "metadata": {"role": "admin"},
    },
    {
        "id": str(uuid4()),
        "email": "provider@example.com",
        "password": "provider123",
        "first_name": "Provider",
        "last_name": "User",
        "is_active": True,
        "is_superuser": False,
        "organization_id": DEMO_ORG_ID,
        "metadata": {"role": "provider"},
    },
    {
        "id": str(uuid4()),
        "email": "staff@example.com",
        "password": "staff123",
        "first_name": "Staff",
        "last_name": "User",
        "is_active": True,
        "is_superuser": False,
        "organization_id": DEMO_ORG_ID,
        "metadata": {"role": "staff"},
    },
    {
        "id": str(uuid4()),
        "email": "nurse@example.com",
        "password": "nurse123",
        "first_name": "Nurse",
        "last_name": "User",
        "is_active": True,
        "is_superuser": False,
        "organization_id": DEMO_ORG_ID,
        "metadata": {"role": "nurse"},
    },
    {
        "id": str(uuid4()),
        "email": "support@example.com",
        "password": "support123",
        "first_name": "Support",
        "last_name": "User",
        "is_active": True,
        "is_superuser": False,
        "organization_id": DEMO_ORG_ID,
        "metadata": {"role": "support"},
    },
]
