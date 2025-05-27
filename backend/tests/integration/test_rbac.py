"""Integration tests for Role-Based Access Control endpoints."""
import pytest
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
def test_permissions(db: Session) -> list[Permission]:
    """Create test permissions."""
    permissions = [
        Permission(
            name="view_users",
            description="Can view users",
            resource_type="user",
            action="read"
        ),
        Permission(
            name="create_users",
            description="Can create users",
            resource_type="user",
            action="create"
        ),
        Permission(
            name="update_users",
            description="Can update users",
            resource_type="user",
            action="update"
        ),
        Permission(
            name="delete_users",
            description="Can delete users",
            resource_type="user",
            action="delete"
        )
    ]
    db.add_all(permissions)
    db.commit()
    for permission in permissions:
        db.refresh(permission)
    return permissions


@pytest.fixture
def admin_user(db: Session, test_organization: Organization) -> User:
    """Create an admin user."""
    # Create admin role with all permissions
    admin_role = Role(
        name="ADMIN",
        description="Administrator role",
        organization_id=test_organization.id,
        permissions={
            "create_roles": True,
            "update_roles": True,
            "view_all_roles": True,
            "create_permissions": True,
            "update_permissions": True,
            "view_permissions": True
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


def test_create_role(
    client: TestClient,
    db: Session,
    admin_token: str,
    test_organization: Organization,
    test_permissions: list[Permission]
):
    """Test role creation endpoint."""
    response = client.post(
        "/api/v1/rbac/roles/",
        json={
            "name": "TEST_ROLE",
            "description": "Test role",
            "organization_id": str(test_organization.id),
            "permissions": {
                "view_users": True,
                "create_users": True
            },
            "permission_ids": [str(p.id) for p in test_permissions[:2]]
        },
        headers={"Authorization": f"Bearer {admin_token}"}
    )

    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "TEST_ROLE"
    assert data["description"] == "Test role"
    assert data["organization_id"] == str(test_organization.id)
    assert data["permissions"]["view_users"] is True
    assert data["permissions"]["create_users"] is True
    assert len(data["assigned_permissions"]) == 2


def test_get_role(
    client: TestClient,
    db: Session,
    admin_token: str,
    test_organization: Organization,
    test_permissions: list[Permission]
):
    """Test get role endpoint."""
    # Create test role
    role = Role(
        name="GET_TEST_ROLE",
        description="Role for get test",
        organization_id=test_organization.id,
        permissions={"view_users": True}
    )
    role.assigned_permissions.append(test_permissions[0])
    db.add(role)
    db.commit()
    db.refresh(role)

    response = client.get(
        f"/api/v1/rbac/roles/{role.id}",
        headers={"Authorization": f"Bearer {admin_token}"}
    )

    assert response.status_code == 200
    data = response.json()
    assert data["id"] == str(role.id)
    assert data["name"] == "GET_TEST_ROLE"
    assert data["permissions"]["view_users"] is True
    assert len(data["assigned_permissions"]) == 1


def test_list_roles(
    client: TestClient,
    db: Session,
    admin_token: str,
    test_organization: Organization
):
    """Test list roles endpoint."""
    # Create additional roles
    roles = [
        Role(
            name=f"TEST_ROLE_{i}",
            description=f"Test role {i}",
            organization_id=test_organization.id,
            permissions={}
        )
        for i in range(3)
    ]
    db.add_all(roles)
    db.commit()

    response = client.get(
        "/api/v1/rbac/roles/",
        headers={"Authorization": f"Bearer {admin_token}"}
    )

    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 3
    role_names = [role["name"] for role in data]
    assert all(f"TEST_ROLE_{i}" in role_names for i in range(3))


def test_update_role(
    client: TestClient,
    db: Session,
    admin_token: str,
    test_organization: Organization,
    test_permissions: list[Permission]
):
    """Test role update endpoint."""
    # Create test role
    role = Role(
        name="UPDATE_TEST_ROLE",
        description="Role for update test",
        organization_id=test_organization.id,
        permissions={"view_users": True}
    )
    role.assigned_permissions.append(test_permissions[0])
    db.add(role)
    db.commit()
    db.refresh(role)

    response = client.put(
        f"/api/v1/rbac/roles/{role.id}",
        json={
            "name": "UPDATED_ROLE",
            "description": "Updated description",
            "permissions": {
                "view_users": True,
                "create_users": True
            },
            "permission_ids": [str(p.id) for p in test_permissions[:2]]
        },
        headers={"Authorization": f"Bearer {admin_token}"}
    )

    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "UPDATED_ROLE"
    assert data["description"] == "Updated description"
    assert data["permissions"]["view_users"] is True
    assert data["permissions"]["create_users"] is True
    assert len(data["assigned_permissions"]) == 2


def test_create_permission(
    client: TestClient,
    db: Session,
    admin_token: str
):
    """Test permission creation endpoint."""
    response = client.post(
        "/api/v1/rbac/permissions/",
        json={
            "name": "custom_permission",
            "description": "Custom test permission",
            "resource_type": "custom",
            "action": "execute",
            "conditions": {"require_mfa": True}
        },
        headers={"Authorization": f"Bearer {admin_token}"}
    )

    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "custom_permission"
    assert data["resource_type"] == "custom"
    assert data["action"] == "execute"
    assert data["conditions"] == {"require_mfa": True}


def test_get_permission(
    client: TestClient,
    db: Session,
    admin_token: str,
    test_permissions: list[Permission]
):
    """Test get permission endpoint."""
    permission = test_permissions[0]
    response = client.get(
        f"/api/v1/rbac/permissions/{permission.id}",
        headers={"Authorization": f"Bearer {admin_token}"}
    )

    assert response.status_code == 200
    data = response.json()
    assert data["id"] == str(permission.id)
    assert data["name"] == permission.name
    assert data["resource_type"] == permission.resource_type
    assert data["action"] == permission.action


def test_list_permissions(
    client: TestClient,
    db: Session,
    admin_token: str,
    test_permissions: list[Permission]
):
    """Test list permissions endpoint."""
    response = client.get(
        "/api/v1/rbac/permissions/",
        headers={"Authorization": f"Bearer {admin_token}"}
    )

    assert response.status_code == 200
    data = response.json()
    assert len(data) >= len(test_permissions)
    permission_names = [p["name"] for p in data]
    assert all(p.name in permission_names for p in test_permissions)


def test_update_permission(
    client: TestClient,
    db: Session,
    admin_token: str,
    test_permissions: list[Permission]
):
    """Test permission update endpoint."""
    permission = test_permissions[0]
    response = client.put(
        f"/api/v1/rbac/permissions/{permission.id}",
        json={
            "description": "Updated description",
            "conditions": {"new_condition": True}
        },
        headers={"Authorization": f"Bearer {admin_token}"}
    )

    assert response.status_code == 200
    data = response.json()
    assert data["id"] == str(permission.id)
    assert data["description"] == "Updated description"
    assert data["conditions"] == {"new_condition": True}


def test_unauthorized_access(
    client: TestClient,
    db: Session,
    test_organization: Organization
):
    """Test unauthorized access to RBAC endpoints."""
    # Create regular user with no permissions
    regular_role = Role(
        name="REGULAR",
        description="Regular user role",
        organization_id=test_organization.id,
        permissions={}
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

    # Try to create role
    response = client.post(
        "/api/v1/rbac/roles/",
        json={
            "name": "UNAUTHORIZED_ROLE",
            "description": "Should not be created",
            "organization_id": str(test_organization.id),
            "permissions": {}
        },
        headers={"Authorization": f"Bearer {regular_token}"}
    )
    assert response.status_code == 403

    # Try to create permission
    response = client.post(
        "/api/v1/rbac/permissions/",
        json={
            "name": "unauthorized_permission",
            "resource_type": "test",
            "action": "test"
        },
        headers={"Authorization": f"Bearer {regular_token}"}
    )
    assert response.status_code == 403


def test_invalid_input(
    client: TestClient,
    admin_token: str,
    test_organization: Organization
):
    """Test input validation for RBAC endpoints."""
    # Test invalid role name
    response = client.post(
        "/api/v1/rbac/roles/",
        json={
            "name": "",
            "description": "Invalid role",
            "organization_id": str(test_organization.id),
            "permissions": {}
        },
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert response.status_code == 422

    # Test invalid permission name
    response = client.post(
        "/api/v1/rbac/permissions/",
        json={
            "name": "",
            "resource_type": "",
            "action": ""
        },
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert response.status_code == 422

    # Test invalid UUID
    response = client.get(
        "/api/v1/rbac/roles/not-a-uuid",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert response.status_code == 422