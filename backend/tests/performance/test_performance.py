"""Performance testing framework for Healthcare IVR Platform."""
import time
import statistics
from typing import Dict, List, Optional
from concurrent.futures import ThreadPoolExecutor
import pytest
from locust import HttpUser, task, between
import requests
from sqlalchemy.orm import Session

from app.models.user import User
from app.models.organization import Organization
from app.models.rbac import Role
from app.core.security import get_password_hash, create_access_token


class PerformanceMetrics:
    """Performance metrics collector and analyzer."""

    def __init__(self):
        """Initialize metrics collector."""
        self.response_times: List[float] = []
        self.error_counts: Dict[int, int] = {}
        self.success_count: int = 0
        self.failure_count: int = 0

    def record_response(self, response_time: float, status_code: int, success: bool):
        """Record a response metric."""
        self.response_times.append(response_time)
        self.error_counts[status_code] = self.error_counts.get(status_code, 0) + 1
        if success:
            self.success_count += 1
        else:
            self.failure_count += 1

    def get_statistics(self) -> Dict:
        """Calculate performance statistics."""
        if not self.response_times:
            return {
                "total_requests": 0,
                "successful_requests": 0,
                "failed_requests": 0,
                "error_distribution": {}
            }

        return {
            "total_requests": len(self.response_times),
            "successful_requests": self.success_count,
            "failed_requests": self.failure_count,
            "avg_response_time": statistics.mean(self.response_times),
            "median_response_time": statistics.median(self.response_times),
            "p95_response_time": statistics.quantiles(self.response_times, n=20)[18],
            "min_response_time": min(self.response_times),
            "max_response_time": max(self.response_times),
            "error_distribution": self.error_counts
        }


class EndpointPerformanceTester:
    """Base class for endpoint performance testing."""

    def __init__(self, base_url: str, auth_token: Optional[str] = None):
        """Initialize endpoint tester."""
        self.base_url = base_url
        self.auth_token = auth_token
        self.metrics = PerformanceMetrics()

    def measure_response_time(
        self,
        endpoint: str,
        method: str = "get",
        payload: Optional[Dict] = None,
        expected_status: int = 200
    ) -> Dict:
        """Measure response time for an endpoint."""
        headers = {
            "Authorization": f"Bearer {self.auth_token}"
        } if self.auth_token else {}

        start_time = time.time()
        try:
            if method.lower() == "get":
                response = requests.get(
                    f"{self.base_url}{endpoint}",
                    headers=headers
                )
            elif method.lower() == "post":
                response = requests.post(
                    f"{self.base_url}{endpoint}",
                    json=payload,
                    headers=headers
                )
            elif method.lower() == "put":
                response = requests.put(
                    f"{self.base_url}{endpoint}",
                    json=payload,
                    headers=headers
                )
            else:
                raise ValueError(f"Unsupported HTTP method: {method}")

            response_time = (time.time() - start_time) * 1000  # Convert to ms
            success = response.status_code == expected_status

            self.metrics.record_response(
                response_time,
                response.status_code,
                success
            )

            return {
                "status_code": response.status_code,
                "response_time": response_time,
                "success": success,
                "response_data": response.json() if success else None
            }

        except Exception as e:
            response_time = (time.time() - start_time) * 1000
            self.metrics.record_response(response_time, 500, False)
            return {
                "status_code": 500,
                "response_time": response_time,
                "success": False,
                "error": str(e)
            }


class UserEndpointTester(EndpointPerformanceTester):
    """Performance tests for user management endpoints."""

    def test_user_creation_performance(
        self,
        num_users: int = 100,
        concurrent_requests: int = 10
    ) -> Dict:
        """Test user creation performance under load."""
        def create_user(i: int) -> Dict:
            payload = {
                "username": f"perf_user_{i}",
                "email": f"perf_user_{i}@example.com",
                "password": "StrongPassword123!",
                "organization_id": str(self.org_id),
                "role_id": str(self.role_id),
                "first_name": "Performance",
                "last_name": "Test",
                "mfa_enabled": False
            }
            return self.measure_response_time(
                "/api/v1/users/",
                method="post",
                payload=payload,
                expected_status=201
            )

        with ThreadPoolExecutor(max_workers=concurrent_requests) as executor:
            results = list(executor.map(create_user, range(num_users)))

        return self.metrics.get_statistics()

    def test_user_login_performance(
        self,
        num_requests: int = 100,
        concurrent_requests: int = 10
    ) -> Dict:
        """Test login endpoint performance under load."""
        def login_user(i: int) -> Dict:
            payload = {
                "username": f"perf_user_{i % 10}",  # Reuse 10 test users
                "password": "StrongPassword123!"
            }
            return self.measure_response_time(
                "/api/v1/users/login",
                method="post",
                payload=payload
            )

        with ThreadPoolExecutor(max_workers=concurrent_requests) as executor:
            results = list(executor.map(login_user, range(num_requests)))

        return self.metrics.get_statistics()


class OrganizationEndpointTester(EndpointPerformanceTester):
    """Performance tests for organization management endpoints."""

    def test_organization_creation_performance(
        self,
        num_orgs: int = 50,
        concurrent_requests: int = 5
    ) -> Dict:
        """Test organization creation performance under load."""
        def create_organization(i: int) -> Dict:
            payload = {
                "name": f"Performance Org {i}",
                "description": "Organization for performance testing",
                "settings": {"performance_test": True},
                "security_policy": {"mfa_required": True}
            }
            return self.measure_response_time(
                "/api/v1/organizations/",
                method="post",
                payload=payload,
                expected_status=201
            )

        with ThreadPoolExecutor(max_workers=concurrent_requests) as executor:
            results = list(executor.map(create_organization, range(num_orgs)))

        return self.metrics.get_statistics()


class RBACEndpointTester(EndpointPerformanceTester):
    """Performance tests for RBAC endpoints."""

    def test_role_assignment_performance(
        self,
        num_assignments: int = 100,
        concurrent_requests: int = 10
    ) -> Dict:
        """Test role assignment performance under load."""
        def assign_role(i: int) -> Dict:
            payload = {
                "name": f"PERF_ROLE_{i}",
                "description": "Performance test role",
                "organization_id": str(self.org_id),
                "permissions": {
                    "view_users": True,
                    "create_users": True
                }
            }
            return self.measure_response_time(
                "/api/v1/rbac/roles/",
                method="post",
                payload=payload,
                expected_status=201
            )

        with ThreadPoolExecutor(max_workers=concurrent_requests) as executor:
            results = list(executor.map(assign_role, range(num_assignments)))

        return self.metrics.get_statistics()


class HealthcareIVRLoadTest(HttpUser):
    """Locust load testing class for Healthcare IVR Platform."""

    wait_time = between(1, 3)  # Wait 1-3 seconds between tasks

    def on_start(self):
        """Set up test user and login."""
        self.login()

    def login(self):
        """Perform user login."""
        response = self.client.post("/api/v1/users/login", json={
            "username": "test_user",
            "password": "TestPassword123!"
        })
        if response.status_code == 200:
            self.token = response.json()["access_token"]
            self.headers = {"Authorization": f"Bearer {self.token}"}
        else:
            self.token = None
            self.headers = {}

    @task(3)
    def view_profile(self):
        """Simulate viewing user profile."""
        self.client.get(
            "/api/v1/users/me",
            headers=self.headers
        )

    @task(2)
    def list_organizations(self):
        """Simulate listing organizations."""
        self.client.get(
            "/api/v1/organizations/",
            headers=self.headers
        )

    @task(1)
    def create_user(self):
        """Simulate user creation."""
        self.client.post(
            "/api/v1/users/",
            headers=self.headers,
            json={
                "username": f"loadtest_user_{int(time.time())}",
                "email": f"loadtest_{int(time.time())}@example.com",
                "password": "LoadTest123!",
                "organization_id": "test_org_id",
                "role_id": "test_role_id",
                "mfa_enabled": False
            }
        )


@pytest.fixture
def performance_test_org(db: Session) -> Organization:
    """Create an organization for performance testing."""
    org = Organization(
        name="Performance Test Org",
        description="Organization for performance testing",
        settings={},
        security_policy={}
    )
    db.add(org)
    db.commit()
    db.refresh(org)
    return org


@pytest.fixture
def performance_test_role(
    db: Session,
    performance_test_org: Organization
) -> Role:
    """Create a role for performance testing."""
    role = Role(
        name="PERF_TEST_ROLE",
        description="Role for performance testing",
        organization_id=performance_test_org.id,
        permissions={
            "create_users": True,
            "update_users": True,
            "view_users": True
        }
    )
    db.add(role)
    db.commit()
    db.refresh(role)
    return role


@pytest.fixture
def performance_test_user(
    db: Session,
    performance_test_org: Organization,
    performance_test_role: Role
) -> User:
    """Create a user for performance testing."""
    user = User(
        username="perf_test_user",
        email="perf_test@example.com",
        encrypted_password=get_password_hash("PerfTest123!"),
        organization_id=performance_test_org.id,
        role_id=performance_test_role.id,
        is_active=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture
def performance_test_token(performance_test_user: User) -> str:
    """Generate a token for performance testing."""
    return create_access_token(data={"sub": str(performance_test_user.id)})


def test_user_endpoint_performance(
    performance_test_org: Organization,
    performance_test_role: Role,
    performance_test_token: str
):
    """Run performance tests for user endpoints."""
    tester = UserEndpointTester(
        base_url="http://localhost:8000",
        auth_token=performance_test_token
    )
    tester.org_id = performance_test_org.id
    tester.role_id = performance_test_role.id

    # Test user creation performance
    creation_stats = tester.test_user_creation_performance(
        num_users=50,
        concurrent_requests=5
    )
    print("\nUser Creation Performance:")
    print(f"Average response time: {creation_stats['avg_response_time']:.2f}ms")
    print(f"95th percentile: {creation_stats['p95_response_time']:.2f}ms")
    print(f"Success rate: {(creation_stats['successful_requests'] / creation_stats['total_requests']) * 100:.2f}%")

    # Test login performance
    login_stats = tester.test_user_login_performance(
        num_requests=100,
        concurrent_requests=10
    )
    print("\nLogin Performance:")
    print(f"Average response time: {login_stats['avg_response_time']:.2f}ms")
    print(f"95th percentile: {login_stats['p95_response_time']:.2f}ms")
    print(f"Success rate: {(login_stats['successful_requests'] / login_stats['total_requests']) * 100:.2f}%")


def test_organization_endpoint_performance(performance_test_token: str):
    """Run performance tests for organization endpoints."""
    tester = OrganizationEndpointTester(
        base_url="http://localhost:8000",
        auth_token=performance_test_token
    )

    stats = tester.test_organization_creation_performance(
        num_orgs=25,
        concurrent_requests=5
    )
    print("\nOrganization Creation Performance:")
    print(f"Average response time: {stats['avg_response_time']:.2f}ms")
    print(f"95th percentile: {stats['p95_response_time']:.2f}ms")
    print(f"Success rate: {(stats['successful_requests'] / stats['total_requests']) * 100:.2f}%")