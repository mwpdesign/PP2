"""Integration tests for user management endpoints."""
import pytest
from uuid import uuid4
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.user import User
from app.models.organization import Organization
from app.models.rbac import Role, Permission
from app.core.security import get_password_hash, create_access_token


@pytest.fixture
def test_organization(db: Session) -> Organization:
    """Create a test organization."""
    org = Organization(
        name="Test Organization",
        description="Test organization for integration tests",
        settings={},
        security_policy={}
    )
    db.add(org)
    db.commit()
    db.refresh(org)
    return org


@pytest.fixture
def test_role(db: Session, test_organization: Organization) -> Role:
    """Create a test role with basic permissions."""
    # Create basic permissions
    view_users = Permission(
        name="view_users",
        description="Can view users",
        resource_type="user",
        action="read"
    )
    create_users = Permission(
        name="create_users",
        description="Can create users",
        resource_type="user",
        action="create"
    )
    db.add_all([view_users, create_users])
    db.commit()

    # Create role with permissions
    role = Role(
        name="TEST_ROLE",
        description="Test role for integration tests",
        organization_id=test_organization.id,
        permissions={
            "view_users": True,
            "create_users": True
        }
    )
    role.assigned_permissions.extend([view_users, create_users])
    db.add(role)
    db.commit()
    db.refresh(role)
    return role


@pytest.fixture
def admin_user(db: Session, test_organization: Organization) -> User:
    """Create an admin user."""
    # Create admin role with all permissions
    admin_role = Role(
        name="ADMIN",
        description="Administrator role",
        organization_id=test_organization.id,
        permissions={
            "create_users": True,
            "update_users": True,
            "view_users": True,
            "create_organizations": True,
            "update_organizations": True,
            "view_all_organizations": True,
            "create_roles": True,
            "update_roles": True,
            "view_all_roles": True,
            "manage_all_organizations": True
        }
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
        last_name="User"
    )
    db.add(admin)
    db.commit()
    db.refresh(admin)
    return admin


@pytest.fixture
def admin_token(admin_user: User) -> str:
    """Generate an admin access token."""
    return create_access_token(data={"sub": str(admin_user.id)})


def test_create_user(
    client: TestClient,
    db: Session,
    admin_token: str,
    test_organization: Organization,
    test_role: Role
):
    """Test user creation endpoint."""
    response = client.post(
        "/api/v1/users/",
        json={
            "username": "test_user",
            "email": "test@example.com",
            "password": "StrongPassword123!",
            "organization_id": str(test_organization.id),
            "role_id": str(test_role.id),
            "first_name": "Test",
            "last_name": "User",
            "mfa_enabled": False
        },
        headers={"Authorization": f"Bearer {admin_token}"}
    )

    assert response.status_code == 201
    data = response.json()
    assert data["username"] == "test_user"
    assert data["email"] == "test@example.com"
    assert data["organization_id"] == str(test_organization.id)
    assert data["role_id"] == str(test_role.id)
    assert "encrypted_password" not in data


def test_user_login(
    client: TestClient,
    db: Session,
    test_organization: Organization,
    test_role: Role
):
    """Test user login endpoint."""
    # Create test user
    password = "LoginPassword123!"
    test_user = User(
        username="login_test",
        email="login@example.com",
        encrypted_password=get_password_hash(password),
        organization_id=test_organization.id,
        role_id=test_role.id,
        is_active=True
    )
    db.add(test_user)
    db.commit()

    # Test login
    response = client.post(
        "/api/v1/users/login",
        json={
            "username": "login_test",
            "password": password
        }
    )

    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert "expires_in" in data
    assert "refresh_token" in data
    assert "user_id" in data


def test_update_user(
    client: TestClient,
    db: Session,
    admin_token: str,
    test_organization: Organization,
    test_role: Role
):
    """Test user update endpoint."""
    # Create test user
    test_user = User(
        username="update_test",
        email="update@example.com",
        encrypted_password=get_password_hash("UpdatePassword123!"),
        organization_id=test_organization.id,
        role_id=test_role.id,
        is_active=True
    )
    db.add(test_user)
    db.commit()
    db.refresh(test_user)

    # Test update
    response = client.put(
        f"/api/v1/users/{test_user.id}",
        json={
            "email": "updated@example.com",
            "first_name": "Updated",
            "last_name": "User"
        },
        headers={"Authorization": f"Bearer {admin_token}"}
    )

    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "updated@example.com"
    assert data["first_name"] == "Updated"
    assert data["last_name"] == "User"


def test_get_current_user(
    client: TestClient,
    db: Session,
    admin_user: User,
    admin_token: str
):
    """Test get current user endpoint."""
    response = client.get(
        "/api/v1/users/me",
        headers={"Authorization": f"Bearer {admin_token}"}
    )

    assert response.status_code == 200
    data = response.json()
    assert data["id"] == str(admin_user.id)
    assert data["username"] == admin_user.username
    assert data["email"] == admin_user.email


def test_get_user_by_id(
    client: TestClient,
    db: Session,
    admin_token: str,
    test_organization: Organization,
    test_role: Role
):
    """Test get user by ID endpoint."""
    # Create test user
    test_user = User(
        username="get_test",
        email="get@example.com",
        encrypted_password=get_password_hash("GetPassword123!"),
        organization_id=test_organization.id,
        role_id=test_role.id,
        is_active=True
    )
    db.add(test_user)
    db.commit()
    db.refresh(test_user)

    # Test get user
    response = client.get(
        f"/api/v1/users/{test_user.id}",
        headers={"Authorization": f"Bearer {admin_token}"}
    )

    assert response.status_code == 200
    data = response.json()
    assert data["id"] == str(test_user.id)
    assert data["username"] == test_user.username
    assert data["email"] == test_user.email


def test_unauthorized_access(
    client: TestClient,
    db: Session,
    test_organization: Organization,
    test_role: Role
):
    """Test unauthorized access to protected endpoints."""
    # Try to create user without token
    response = client.post(
        "/api/v1/users/",
        json={
            "username": "unauthorized_test",
            "email": "unauthorized@example.com",
            "password": "Password123!",
            "organization_id": str(test_organization.id),
            "role_id": str(test_role.id)
        }
    )
    assert response.status_code == 401

    # Create regular user with limited permissions
    regular_role = Role(
        name="REGULAR",
        description="Regular user role",
        organization_id=test_organization.id,
        permissions={"view_users": True}
    )
    db.add(regular_role)
    db.commit()

    regular_user = User(
        username="regular_test",
        email="regular@example.com",
        encrypted_password=get_password_hash("RegularPassword123!"),
        organization_id=test_organization.id,
        role_id=regular_role.id,
        is_active=True
    )
    db.add(regular_user)
    db.commit()

    # Generate token for regular user
    regular_token = create_access_token(data={"sub": str(regular_user.id)})

    # Try to create user with regular user token
    response = client.post(
        "/api/v1/users/",
        json={
            "username": "unauthorized_test",
            "email": "unauthorized@example.com",
            "password": "Password123!",
            "organization_id": str(test_organization.id),
            "role_id": str(test_role.id)
        },
        headers={"Authorization": f"Bearer {regular_token}"}
    )
    assert response.status_code == 403


def test_invalid_input(
    client: TestClient,
    admin_token: str,
    test_organization: Organization,
    test_role: Role
):
    """Test input validation."""
    # Test invalid email
    response = client.post(
        "/api/v1/users/",
        json={
            "username": "invalid_test",
            "email": "not_an_email",
            "password": "Password123!",
            "organization_id": str(test_organization.id),
            "role_id": str(test_role.id)
        },
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert response.status_code == 422

    # Test weak password
    response = client.post(
        "/api/v1/users/",
        json={
            "username": "invalid_test",
            "email": "invalid@example.com",
            "password": "weak",
            "organization_id": str(test_organization.id),
            "role_id": str(test_role.id)
        },
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert response.status_code == 400

    # Test invalid UUID
    response = client.post(
        "/api/v1/users/",
        json={
            "username": "invalid_test",
            "email": "invalid@example.com",
            "password": "Password123!",
            "organization_id": "not-a-uuid",
            "role_id": str(test_role.id)
        },
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert response.status_code == 422