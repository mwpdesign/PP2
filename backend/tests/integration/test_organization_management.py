"""Integration tests for organization management endpoints."""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.user import User
from app.models.organization import Organization
from app.models.rbac import Role
from app.core.security import get_password_hash, create_access_token


@pytest.fixture
def test_organization(db: Session) -> Organization:
    """Create a test organization."""
    org = Organization(
        name="Test Organization",
        description="Test organization for integration tests",
        settings={},
        security_policy={},
    )
    db.add(org)
    db.commit()
    db.refresh(org)
    return org


@pytest.fixture
def admin_user(db: Session, test_organization: Organization) -> User:
    """Create an admin user."""
    # Create admin role with all permissions
    admin_role = Role(
        name="ADMIN",
        description="Administrator role",
        organization_id=test_organization.id,
        permissions={
            "create_organizations": True,
            "update_organizations": True,
            "view_all_organizations": True,
            "manage_all_organizations": True,
        },
    )
    db.add(admin_role)
    db.commit()

    # Create admin user
    admin = User(
        username="admin_test",
        email="admin@example.com",
        encrypted_password=get_password_hash("SecurePassword123!"),
        organization_id=test_organization.id,
        role_id=admin_role.id,
        is_active=True,
        first_name="Admin",
        last_name="User",
    )
    db.add(admin)
    db.commit()
    db.refresh(admin)
    return admin


@pytest.fixture
def admin_token(admin_user: User) -> str:
    """Generate an admin access token."""
    return create_access_token(data={"sub": str(admin_user.id)})


def test_create_organization(client: TestClient, db: Session, admin_token: str):
    """Test organization creation endpoint."""
    response = client.post(
        "/api/v1/organizations/",
        json={
            "name": "New Organization",
            "description": "A new test organization",
            "settings": {"key": "value"},
            "security_policy": {"mfa_required": True},
        },
        headers={"Authorization": f"Bearer {admin_token}"},
    )

    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "New Organization"
    assert data["description"] == "A new test organization"
    assert data["settings"] == {"key": "value"}
    assert data["security_policy"] == {"mfa_required": True}
    assert data["is_active"] is True


def test_get_organization(
    client: TestClient, db: Session, admin_token: str, test_organization: Organization
):
    """Test get organization endpoint."""
    response = client.get(
        f"/api/v1/organizations/{test_organization.id}",
        headers={"Authorization": f"Bearer {admin_token}"},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["id"] == str(test_organization.id)
    assert data["name"] == test_organization.name
    assert data["description"] == test_organization.description


def test_list_organizations(
    client: TestClient, db: Session, admin_token: str, test_organization: Organization
):
    """Test list organizations endpoint."""
    # Create additional organization
    new_org = Organization(
        name="Another Organization",
        description="Another test organization",
        settings={},
        security_policy={},
    )
    db.add(new_org)
    db.commit()

    response = client.get(
        "/api/v1/organizations/", headers={"Authorization": f"Bearer {admin_token}"}
    )

    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 2
    assert any(org["name"] == "Test Organization" for org in data)
    assert any(org["name"] == "Another Organization" for org in data)


def test_update_organization(
    client: TestClient, db: Session, admin_token: str, test_organization: Organization
):
    """Test organization update endpoint."""
    response = client.put(
        f"/api/v1/organizations/{test_organization.id}",
        json={
            "name": "Updated Organization",
            "description": "Updated description",
            "settings": {"updated": True},
            "security_policy": {"mfa_required": False},
        },
        headers={"Authorization": f"Bearer {admin_token}"},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Updated Organization"
    assert data["description"] == "Updated description"
    assert data["settings"] == {"updated": True}
    assert data["security_policy"] == {"mfa_required": False}


def test_unauthorized_access(
    client: TestClient, db: Session, test_organization: Organization
):
    """Test unauthorized access to organization endpoints."""
    # Create regular user with limited permissions
    regular_role = Role(
        name="REGULAR",
        description="Regular user role",
        organization_id=test_organization.id,
        permissions={},
    )
    db.add(regular_role)
    db.commit()

    regular_user = User(
        username="regular_test",
        email="regular@example.com",
        encrypted_password=get_password_hash("RegularPassword123!"),
        organization_id=test_organization.id,
        role_id=regular_role.id,
        is_active=True,
    )
    db.add(regular_user)
    db.commit()

    # Generate token for regular user
    regular_token = create_access_token(data={"sub": str(regular_user.id)})

    # Try to create organization
    response = client.post(
        "/api/v1/organizations/",
        json={"name": "Unauthorized Org", "description": "Should not be created"},
        headers={"Authorization": f"Bearer {regular_token}"},
    )
    assert response.status_code == 403

    # Try to update organization
    response = client.put(
        f"/api/v1/organizations/{test_organization.id}",
        json={"name": "Unauthorized Update"},
        headers={"Authorization": f"Bearer {regular_token}"},
    )
    assert response.status_code == 403


def test_invalid_input(client: TestClient, admin_token: str):
    """Test input validation for organization endpoints."""
    # Test empty name
    response = client.post(
        "/api/v1/organizations/",
        json={"name": "", "description": "Invalid organization"},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 422

    # Test name too long
    response = client.post(
        "/api/v1/organizations/",
        json={"name": "x" * 256, "description": "Invalid organization"},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 422

    # Test invalid UUID format
    response = client.get(
        "/api/v1/organizations/not-a-uuid",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 422


def test_duplicate_organization_name(
    client: TestClient, db: Session, admin_token: str, test_organization: Organization
):
    """Test creating organization with duplicate name."""
    response = client.post(
        "/api/v1/organizations/",
        json={
            "name": test_organization.name,
            "description": "Duplicate organization name",
        },
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 400
    assert "already exists" in response.json()["detail"].lower()
