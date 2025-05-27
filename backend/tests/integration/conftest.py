"""Test fixtures for integration tests."""
import pytest
import asyncio
from datetime import datetime
from uuid import uuid4
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    create_async_engine,
    async_sessionmaker
)

from app.core.config import settings
from app.core.database import Base
from app.main import app
from app.models.user import User
from app.models.organization import Organization
from app.models.territory import Territory
from app.models.facility import Facility
from app.models.provider import Provider
from app.models.patient import Patient


# Test database URL
TEST_DATABASE_URL = settings.DATABASE_URL + "_test"


@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for each test case."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="session")
async def async_engine():
    """Create a new async engine for testing."""
    engine = create_async_engine(
        TEST_DATABASE_URL,
        echo=True,
        pool_pre_ping=True
    )

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)

    yield engine

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()


@pytest.fixture(scope="session")
def async_session_maker(async_engine):
    """Create a session maker for async sessions."""
    return async_sessionmaker(
        async_engine,
        class_=AsyncSession,
        expire_on_commit=False,
        autocommit=False,
        autoflush=False
    )


@pytest.fixture
async def async_session(async_session_maker) -> AsyncSession:
    """Create a new async session for testing."""
    async with async_session_maker() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


@pytest.fixture
async def async_client(async_session_maker):
    """Create an async client for testing."""
    async with AsyncClient(
        app=app,
        base_url="http://test"
    ) as client:
        app.state.session_maker = async_session_maker
        yield client


@pytest.fixture
async def test_user(async_session: AsyncSession) -> User:
    """Create a test user."""
    user = User(
        username="testuser",
        email="test@example.com",
        encrypted_password="hashedpassword",
        first_name="Test",
        last_name="User",
        organization_id=uuid4(),
        role_id=uuid4()
    )
    async_session.add(user)
    await async_session.flush()
    return user


@pytest.fixture
async def test_organization(async_session: AsyncSession) -> Organization:
    """Create a test organization."""
    org = Organization(
        name="Test Healthcare Org",
        description="Test Organization",
        settings={},
        security_policy={}
    )
    async_session.add(org)
    await async_session.flush()
    return org


@pytest.fixture
async def test_territory(
    async_session: AsyncSession,
    test_organization: Organization
) -> Territory:
    """Create a test territory."""
    territory = Territory(
        name="Test Territory",
        code="TEST",
        organization_id=test_organization.id,
        type="region",
        territory_metadata={},
        security_policy={}
    )
    async_session.add(territory)
    await async_session.flush()
    return territory


@pytest.fixture
async def test_facility(
    async_session: AsyncSession,
    test_organization: Organization,
    test_territory: Territory
) -> Facility:
    """Create a test facility."""
    facility = Facility(
        name="Test Facility",
        facility_type="hospital",
        npi="1234567890",
        address_line1="123 Test St",
        city="Test City",
        state="CA",
        zip_code="90210",
        phone="555-123-4567",
        organization_id=test_organization.id,
        territory_id=test_territory.id
    )
    async_session.add(facility)
    await async_session.flush()
    return facility


@pytest.fixture
async def test_provider(
    async_session: AsyncSession,
    test_user: User
) -> Provider:
    """Create a test provider."""
    provider = Provider(
        name="Test Provider",
        npi="0987654321",
        tax_id="123456789",
        email="provider@test.com",
        phone="555-987-6543",
        address_line1="456 Provider St",
        city="Test City",
        state="CA",
        zip_code="90210",
        created_by_id=test_user.id
    )
    async_session.add(provider)
    await async_session.flush()
    return provider


@pytest.fixture
async def test_patient(
    async_session: AsyncSession,
    test_user: User,
    test_provider: Provider,
    test_facility: Facility,
    test_territory: Territory,
    test_organization: Organization
) -> Patient:
    """Create a test patient."""
    patient = Patient(
        first_name="Test",
        last_name="Patient",
        date_of_birth=datetime(1990, 1, 1).date(),
        gender="M",
        ssn="123-45-6789",
        phone="555-555-5555",
        address_line1="789 Patient St",
        city="Test City",
        state="CA",
        zip_code="90210",
        insurance_provider="Test Insurance",
        insurance_id="INS123456",
        created_by_id=test_user.id,
        provider_id=test_provider.id,
        facility_id=test_facility.id,
        territory_id=test_territory.id,
        organization_id=test_organization.id
    )
    async_session.add(patient)
    await async_session.flush()
    return patient