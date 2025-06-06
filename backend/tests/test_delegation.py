"""Tests for Delegation Permissions Framework API endpoints."""

import pytest
from httpx import AsyncClient
from datetime import datetime, timedelta

from app.services.delegation_service import DelegationService


class TestDelegationAPI:
    """Test Delegation Permissions API endpoints."""

    @pytest.mark.asyncio
    async def test_create_delegation(self, async_client: AsyncClient):
        """Test delegation creation endpoint."""
        delegation_data = {
            "delegatedTo": "nurse@example.com",
            "permissions": ["read_patients"],
            "expiresAt": (datetime.now() + timedelta(days=30)).isoformat(),
            "scope": {"territory": "northeast", "department": "wound_care"}
        }

        response = await async_client.post(
            "/api/v1/delegation/create",
            json=delegation_data
        )

        assert response.status_code == 201
        data = response.json()

        assert "delegationId" in data
        assert "status" in data
        assert data["status"] == "active"
        assert data["delegatedTo"] == "nurse@example.com"

    @pytest.mark.asyncio
    async def test_list_delegations(self, async_client: AsyncClient):
        """Test listing user delegations."""
        response = await async_client.get("/api/v1/delegation/list")

        assert response.status_code == 200
        data = response.json()

        assert "delegations" in data
        assert isinstance(data["delegations"], list)

    @pytest.mark.asyncio
    async def test_revoke_delegation(self, async_client: AsyncClient):
        """Test delegation revocation."""
        delegation_id = "del-123"

        response = await async_client.delete(
            f"/api/v1/delegation/{delegation_id}"
        )

        assert response.status_code == 200
        data = response.json()

        assert "status" in data
        assert data["status"] == "revoked"

    @pytest.mark.asyncio
    async def test_validate_delegation_permissions(
        self, async_client: AsyncClient
    ):
        """Test delegation permission validation."""
        validation_data = {
            "userPermissions": ["read_patients", "write_ivr"],
            "requestedPermissions": ["read_patients", "admin_access"]
        }

        response = await async_client.post(
            "/api/v1/delegation/validate",
            json=validation_data
        )

        assert response.status_code == 200
        data = response.json()

        assert "canDelegate" in data
        assert "invalidPermissions" in data
        assert data["canDelegate"] is False
        assert "admin_access" in data["invalidPermissions"]


class TestDelegationService:
    """Test Delegation Service logic."""

    def test_create_delegation_service(self):
        """Test delegation creation service method."""
        service = DelegationService()

        delegation_data = {
            "delegatedTo": "nurse@example.com",
            "permissions": ["read_patients"],
            "expiresAt": datetime.now() + timedelta(days=30)
        }

        result = service.create_delegation("user123", delegation_data)

        assert "delegationId" in result
        assert result["status"] == "active"

    def test_validate_permissions(self):
        """Test permission validation logic."""
        service = DelegationService()

        user_permissions = ["read_patients", "write_ivr"]
        requested_permissions = ["read_patients", "admin_access"]

        result = service.validate_delegation_permissions(
            user_permissions, requested_permissions
        )

        assert result["canDelegate"] is False
        assert "admin_access" in result["invalidPermissions"]

    def test_check_delegation_expiry(self):
        """Test delegation expiry checking."""
        service = DelegationService()

        # Test expired delegation
        expired_delegation = {
            "id": "del1",
            "expiresAt": datetime.now() - timedelta(days=1),
            "status": "active"
        }

        is_expired = service.is_delegation_expired(expired_delegation)
        assert is_expired is True

    def test_prevent_circular_delegation(self):
        """Test circular delegation prevention."""
        service = DelegationService()

        # Create delegation chain: A -> B -> C -> A (circular)
        delegations = [
            {"from": "userA", "to": "userB"},
            {"from": "userB", "to": "userC"},
            {"from": "userC", "to": "userA"}
        ]

        has_circular = service.detect_circular_delegation(delegations)
        assert has_circular is True


class TestDelegationSecurity:
    """Test security aspects of delegation system."""

    @pytest.mark.asyncio
    async def test_prevent_privilege_escalation(
        self, async_client: AsyncClient
    ):
        """Test prevention of privilege escalation."""
        # Nurse trying to delegate admin permissions
        delegation_data = {
            "delegatedTo": "staff@example.com",
            "permissions": ["admin_access"],  # Nurse shouldn't have this
            "expiresAt": (datetime.now() + timedelta(days=1)).isoformat()
        }

        response = await async_client.post(
            "/api/v1/delegation/create",
            json=delegation_data,
            headers={"X-User-Role": "nurse"}
        )

        assert response.status_code == 403
        data = response.json()
        assert "error" in data
        assert "insufficient permissions" in data["error"].lower()

    @pytest.mark.asyncio
    async def test_delegation_scope_validation(
        self, async_client: AsyncClient
    ):
        """Test delegation scope restrictions."""
        delegation_data = {
            "delegatedTo": "nurse@example.com",
            "permissions": ["read_patients"],
            "scope": {"territory": "northeast"},
            "expiresAt": (datetime.now() + timedelta(days=1)).isoformat()
        }

        response = await async_client.post(
            "/api/v1/delegation/create",
            json=delegation_data
        )

        assert response.status_code == 201
        data = response.json()

        assert "scope" in data
        assert data["scope"]["territory"] == "northeast"

    @pytest.mark.asyncio
    async def test_audit_trail_logging(self, async_client: AsyncClient):
        """Test that delegation actions are logged."""
        delegation_data = {
            "delegatedTo": "nurse@example.com",
            "permissions": ["read_patients"],
            "expiresAt": (datetime.now() + timedelta(days=1)).isoformat()
        }

        response = await async_client.post(
            "/api/v1/delegation/create",
            json=delegation_data
        )

        assert response.status_code == 201

        # Check audit log
        audit_response = await async_client.get(
            "/api/v1/delegation/audit/recent"
        )
        assert audit_response.status_code == 200

        audit_data = audit_response.json()
        assert len(audit_data["entries"]) > 0


class TestDelegationPerformance:
    """Test performance aspects of delegation system."""

    @pytest.mark.asyncio
    async def test_delegation_lookup_performance(
        self, async_client: AsyncClient
    ):
        """Test delegation lookup performance."""
        import time

        start_time = time.time()

        response = await async_client.get("/api/v1/delegation/list")

        end_time = time.time()
        response_time = (end_time - start_time) * 1000

        assert response.status_code == 200
        assert response_time < 100  # Should be under 100ms

    def test_large_delegation_list_handling(self):
        """Test handling of large delegation lists."""
        service = DelegationService()

        # Create many delegations
        delegations = []
        for i in range(1000):
            delegation = {
                "id": f"del{i}",
                "delegatedTo": f"user{i}@example.com",
                "permissions": ["read_patients"],
                "status": "active"
            }
            delegations.append(delegation)

        # Should handle large lists efficiently
        filtered = service.filter_active_delegations(delegations)
        assert len(filtered) == 1000


class TestDelegationErrorHandling:
    """Test error handling for delegation operations."""

    @pytest.mark.asyncio
    async def test_invalid_delegation_data(self, async_client: AsyncClient):
        """Test handling of invalid delegation data."""
        invalid_data = {
            "delegatedTo": "invalid-email",  # Invalid email
            "permissions": [],  # Empty permissions
            "expiresAt": "invalid-date"  # Invalid date
        }

        response = await async_client.post(
            "/api/v1/delegation/create",
            json=invalid_data
        )

        assert response.status_code == 422
        data = response.json()
        assert "error" in data

    @pytest.mark.asyncio
    async def test_nonexistent_delegation_revocation(
        self, async_client: AsyncClient
    ):
        """Test revoking non-existent delegation."""
        response = await async_client.delete(
            "/api/v1/delegation/nonexistent-id"
        )

        assert response.status_code == 404
        data = response.json()
        assert "error" in data
        assert "not found" in data["error"].lower()

    @pytest.mark.asyncio
    async def test_expired_delegation_usage(self, async_client: AsyncClient):
        """Test using expired delegation."""
        # Try to use an expired delegation
        response = await async_client.get(
            "/api/v1/patients/list",
            headers={"X-Delegation-Id": "expired-delegation-id"}
        )

        assert response.status_code == 403
        data = response.json()
        assert "delegation expired" in data["error"].lower()


class TestDelegationIntegration:
    """Test delegation integration with other systems."""

    @pytest.mark.asyncio
    async def test_delegation_with_rbac(self, async_client: AsyncClient):
        """Test delegation integration with RBAC system."""
        # Create delegation with specific role permissions
        delegation_data = {
            "delegatedTo": "nurse@example.com",
            "permissions": ["read_patients"],
            "roleContext": "wound_care_specialist",
            "expiresAt": (datetime.now() + timedelta(days=1)).isoformat()
        }

        response = await async_client.post(
            "/api/v1/delegation/create",
            json=delegation_data
        )

        assert response.status_code == 201
        data = response.json()

        assert "roleContext" in data
        assert data["roleContext"] == "wound_care_specialist"

    @pytest.mark.asyncio
    async def test_delegation_territory_isolation(
        self, async_client: AsyncClient
    ):
        """Test delegation respects territory isolation."""
        delegation_data = {
            "delegatedTo": "nurse@example.com",
            "permissions": ["read_patients"],
            "scope": {"territory": "northeast"},
            "expiresAt": (datetime.now() + timedelta(days=1)).isoformat()
        }

        response = await async_client.post(
            "/api/v1/delegation/create",
            json=delegation_data
        )

        assert response.status_code == 201

        # Try to access patients from different territory
        patient_response = await async_client.get(
            "/api/v1/patients/list",
            headers={
                "X-Delegation-Id": response.json()["delegationId"],
                "X-Territory": "southwest"  # Different territory
            }
        )

        assert patient_response.status_code == 403


class TestDelegationCompliance:
    """Test HIPAA compliance for delegation system."""

    @pytest.mark.asyncio
    async def test_delegation_audit_completeness(
        self, async_client: AsyncClient
    ):
        """Test that all delegation actions are audited."""
        # Create delegation
        delegation_data = {
            "delegatedTo": "nurse@example.com",
            "permissions": ["read_patients"],
            "expiresAt": (datetime.now() + timedelta(days=1)).isoformat()
        }

        create_response = await async_client.post(
            "/api/v1/delegation/create",
            json=delegation_data
        )

        delegation_id = create_response.json()["delegationId"]

        # Revoke delegation
        await async_client.delete(f"/api/v1/delegation/{delegation_id}")

        # Check audit trail includes both actions
        audit_response = await async_client.get(
            "/api/v1/delegation/audit/recent"
        )

        audit_data = audit_response.json()
        actions = [entry["action"] for entry in audit_data["entries"]]

        assert "delegation_created" in actions
        assert "delegation_revoked" in actions

    @pytest.mark.asyncio
    async def test_delegation_data_minimization(
        self, async_client: AsyncClient
    ):
        """Test that delegations only include necessary data."""
        response = await async_client.get("/api/v1/delegation/list")

        assert response.status_code == 200
        data = response.json()

        for delegation in data["delegations"]:
            # Should not include sensitive user data
            assert "password" not in delegation
            assert "ssn" not in delegation
            assert "personalInfo" not in delegation