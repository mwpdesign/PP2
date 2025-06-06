#!/usr/bin/env python3
"""
Comprehensive Mock Data Seeding Script for Healthcare IVR Platform

This script populates the database with realistic mock data for all 8 user
roles:
- Patients with medical histories and insurance information
- IVR submissions with various statuses and conditions
- Users with detailed profiles and role hierarchies
- Organizations, facilities, and providers
- Orders and fulfillment data
- Audit trails for HIPAA compliance

Usage:
    python scripts/seed_mock_data.py
"""

import asyncio
import json
import logging
import sys
from datetime import datetime, timezone, timedelta
from pathlib import Path
from typing import Dict, List, Any
from uuid import UUID, uuid4

from sqlalchemy import select

# Add backend directory to Python path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from app.core.database import AsyncSessionLocal, engine
from app.models.user import User
from app.models.organization import Organization
from app.models.rbac import Role
from app.models.patient import Patient
from app.models.facility import Facility
from app.models.provider import Provider
from app.models.ivr import IVRRequest, IVRStatusHistory
from app.models.audit import AuditLog
from app.models.sensitive_data import SensitiveData
from app.models.product import Product

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class MockDataSeeder:
    """Comprehensive mock data seeding for Healthcare IVR Platform."""

    def __init__(self):
        self.data_dir = backend_dir / "data"
        self.mock_org_id = UUID("2276e0c1-6a32-470e-b7e7-dcdbb286d76b")
        self.created_entities = {
            'organizations': [],
            'roles': [],
            'users': [],
            'facilities': [],
            'providers': [],
            'patients': [],
            'products': [],
            'ivr_requests': [],
            'orders': [],
            'audit_logs': []
        }

    def load_json_data(self, filename: str) -> List[Dict[str, Any]]:
        """Load JSON data from file."""
        file_path = self.data_dir / filename
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            logger.info(f"Loaded {len(data)} records from {filename}")
            return data
        except FileNotFoundError:
            logger.error(f"Data file not found: {file_path}")
            return []
        except json.JSONDecodeError as e:
            logger.error(f"Invalid JSON in {filename}: {e}")
            return []

    async def create_organization(self, session) -> Organization:
        """Create or get the mock organization."""
        # Check if organization exists
        result = await session.execute(
            select(Organization).where(Organization.id == self.mock_org_id)
        )
        org = result.scalar_one_or_none()

        if not org:
            logger.info("Creating mock organization")
            org = Organization(
                id=self.mock_org_id,
                name="Clear Health Pass - Healthcare Network",
                description="Mock organization for comprehensive healthcare IVR platform testing",
                is_active=True,
                status="active",
                settings={
                    "timezone": "America/New_York",
                    "business_hours": "8:00-17:00",
                    "emergency_contact": "1-800-HEALTH"
                },
                security_policy={
                    "password_policy": "strong",
                    "mfa_required": False,
                    "session_timeout": 30
                }
            )
            session.add(org)
            await session.flush()
            self.created_entities['organizations'].append(org.id)
        else:
            logger.info(f"Organization already exists: {org.name}")

        return org

    async def create_roles(self, session, org: Organization) -> Dict[str, Role]:
        """Create all required roles for the 8 user types."""
        role_definitions = [
            {
                "name": "Admin",
                "description": "System Administrator with full access",
                "permissions": ["*"]
            },
            {
                "name": "Doctor",
                "description": "Healthcare Provider with patient care access",
                "permissions": ["patient:*", "ivr:submit", "order:create"]
            },
            {
                "name": "IVR",
                "description": "Insurance Verification Specialist",
                "permissions": ["ivr:*", "patient:read", "insurance:verify"]
            },
            {
                "name": "Master Distributor",
                "description": "Regional Distribution Manager",
                "permissions": ["order:*", "inventory:*", "distributor:manage"]
            },
            {
                "name": "CHP Admin",
                "description": "Community Health Program Administrator",
                "permissions": ["program:*", "patient:read", "analytics:view"]
            },
            {
                "name": "Distributor",
                "description": "Local Distribution Coordinator",
                "permissions": ["order:read", "order:update", "inventory:read"]
            },
            {
                "name": "Sales",
                "description": "Sales Representative",
                "permissions": ["customer:*", "order:read", "analytics:view"]
            },
            {
                "name": "Shipping and Logistics",
                "description": "Logistics Coordinator",
                "permissions": ["shipping:*", "order:read", "order:update"]
            }
        ]

        roles = {}
        for role_def in role_definitions:
            # Check if role exists
            result = await session.execute(
                select(Role).where(
                    Role.name == role_def["name"],
                    Role.organization_id == org.id
                )
            )
            role = result.scalar_one_or_none()

            if not role:
                logger.info(f"Creating role: {role_def['name']}")
                role = Role(
                    name=role_def["name"],
                    description=role_def["description"],
                    organization_id=org.id,
                    permissions={"actions": role_def["permissions"]}
                )
                session.add(role)
                await session.flush()
                self.created_entities['roles'].append(role.id)

            roles[role_def["name"]] = role

        return roles

    async def create_facilities(self, session, org: Organization) -> List[Facility]:
        """Create mock healthcare facilities."""
        facilities_data = [
            {
                "id": "550e8400-e29b-41d4-a716-446655440101",
                "name": "Boston Wound Care Center",
                "facility_type": "specialty_clinic",
                "npi": "1234567801",
                "address_line1": "123 Medical Plaza",
                "city": "Boston",
                "state": "MA",
                "zip_code": "02115",
                "phone": "617-555-0100",
                "email": "info@bostonwoundcare.com"
            },
            {
                "id": "550e8400-e29b-41d4-a716-446655440102",
                "name": "Phoenix Regional Medical Center",
                "facility_type": "hospital",
                "npi": "0987654302",
                "address_line1": "456 Health Parkway",
                "city": "Phoenix",
                "state": "AZ",
                "zip_code": "85001",
                "phone": "602-555-0200",
                "email": "info@phoenixregional.com"
            },
            {
                "id": "550e8400-e29b-41d4-a716-446655440103",
                "name": "Seattle Burn Treatment Center",
                "facility_type": "specialty_clinic",
                "npi": "1122334403",
                "address_line1": "789 Recovery Drive",
                "city": "Seattle",
                "state": "WA",
                "zip_code": "98101",
                "phone": "206-555-0300",
                "email": "info@seattleburn.com"
            }
        ]

        facilities = []
        for facility_data in facilities_data:
            # Check if facility exists
            facility_id = UUID(facility_data["id"])
            result = await session.execute(
                select(Facility).where(Facility.id == facility_id)
            )
            facility = result.scalar_one_or_none()

            if not facility:
                logger.info(f"Creating facility: {facility_data['name']}")
                facility = Facility(
                    id=facility_id,
                    name=facility_data["name"],
                    facility_type=facility_data["facility_type"],
                    npi=facility_data["npi"],
                    address_line1=facility_data["address_line1"],
                    address_line2=facility_data.get("address_line2", ""),
                    city=facility_data["city"],
                    state=facility_data["state"],
                    zip_code=facility_data["zip_code"],
                    phone=facility_data["phone"],
                    fax=facility_data.get("fax", ""),
                    email=facility_data["email"],
                    organization_id=org.id,
                    is_active=True
                )
                session.add(facility)
                await session.flush()
                self.created_entities['facilities'].append(facility.id)

            facilities.append(facility)

        return facilities

    async def create_providers(self, session, org: Organization, facilities: List[Facility], users: Dict[str, User]) -> List[Provider]:
        """Create mock healthcare providers."""
        providers_data = [
            {
                "id": "550e8400-e29b-41d4-a716-446655440201",
                "name": "Dr. John Smith Wound Care Practice",
                "npi": "1234567804",
                "tax_id": "12-3456789",
                "email": "jsmith@bostonwoundcare.com",
                "phone": "617-555-0101",
                "address_line1": "123 Medical Plaza, Suite 200",
                "city": "Boston",
                "state": "MA",
                "zip_code": "02115",
                "specialty": "Wound Care"
            },
            {
                "id": "550e8400-e29b-41d4-a716-446655440202",
                "name": "Phoenix Surgical Associates",
                "npi": "0987654305",
                "tax_id": "98-7654321",
                "email": "info@phoenixsurgical.com",
                "phone": "602-555-0201",
                "address_line1": "456 Health Parkway, Floor 3",
                "city": "Phoenix",
                "state": "AZ",
                "zip_code": "85001",
                "specialty": "General Surgery"
            }
        ]

        providers = []
        admin_user = users.get("Admin")
        if not admin_user:
            logger.error("Admin user not found for provider creation")
            return providers

        for provider_data in providers_data:
            # Check if provider exists
            provider_id = UUID(provider_data["id"])
            result = await session.execute(
                select(Provider).where(Provider.id == provider_id)
            )
            provider = result.scalar_one_or_none()

            if not provider:
                logger.info(f"Creating provider: {provider_data['name']}")

                provider = Provider(
                    id=provider_id,
                    organization_id=org.id,
                    name=provider_data["name"],
                    npi=provider_data["npi"],
                    tax_id=provider_data["tax_id"],
                    email=provider_data["email"],
                    phone=provider_data["phone"],
                    address_line1=provider_data["address_line1"],
                    address_line2=provider_data.get("address_line2", ""),
                    city=provider_data["city"],
                    state=provider_data["state"],
                    zip_code=provider_data["zip_code"],
                    specialty=provider_data["specialty"],
                    is_active=True,
                    created_by_id=admin_user.id
                )
                session.add(provider)
                await session.flush()
                self.created_entities['providers'].append(provider.id)

            providers.append(provider)

        return providers

    async def create_users(self, session, org: Organization, roles: Dict[str, Role]) -> Dict[str, User]:
        """Create all mock users with detailed profiles."""
        users_data = self.load_json_data("mock_users.json")
        users = {}

        for user_data in users_data:
            user_id = UUID(user_data["id"])

            # Check if user exists
            result = await session.execute(
                select(User).where(User.id == user_id)
            )
            user = result.scalar_one_or_none()

            if not user:
                logger.info(f"Creating user: {user_data['email']}")

                # Get the role
                role = roles.get(user_data["role_id"])
                if not role:
                    logger.error(f"Role not found: {user_data['role_id']}")
                    continue

                user = User(
                    id=user_id,
                    username=user_data["username"],
                    email=user_data["email"],
                    first_name=user_data["first_name"],
                    last_name=user_data["last_name"],
                    role_id=role.id,
                    organization_id=org.id,
                    is_active=user_data["is_active"],
                    is_superuser=user_data["is_superuser"],
                    mfa_enabled=user_data["mfa_enabled"]
                )

                # Set password
                user.set_password(user_data["password"])

                session.add(user)
                await session.flush()
                self.created_entities['users'].append(user.id)

                # Create sensitive data profile if profile exists
                if "profile" in user_data:
                    sensitive_data = SensitiveData(
                        user_id=user.id,
                        data_type="user_profile",
                        encrypted_data=json.dumps(user_data["profile"]),
                        organization_id=org.id
                    )
                    session.add(sensitive_data)

            users[user_data["role_id"]] = user

        return users

    async def create_patients(self, session, org: Organization, users: Dict[str, User],
                            facilities: List[Facility], providers: List[Provider]) -> List[Patient]:
        """Create mock patients with medical histories."""
        patients_data = self.load_json_data("mock_patients.json")
        patients = []

        doctor_user = users.get("Doctor")
        if not doctor_user:
            logger.error("Doctor user not found for patient creation")
            return patients

        for patient_data in patients_data:
            patient_id = UUID(patient_data["id"])

            # Check if patient exists
            result = await session.execute(
                select(Patient).where(Patient.id == patient_id)
            )
            patient = result.scalar_one_or_none()

            if not patient:
                logger.info(f"Creating patient: {patient_data['first_name']} {patient_data['last_name']}")

                patient = Patient(
                    id=patient_id,
                    external_id=patient_data["external_id"],
                    first_name=patient_data["first_name"],
                    last_name=patient_data["last_name"],
                    date_of_birth=patient_data["date_of_birth"],
                    ssn=patient_data.get("ssn"),
                    phone=patient_data.get("phone"),
                    email=patient_data.get("email"),
                    address=patient_data.get("address"),
                    status=patient_data["status"],
                    notes=patient_data.get("notes"),
                    patient_metadata=patient_data.get("patient_metadata", {}),
                    tags=patient_data.get("tags", []),
                    organization_id=org.id,
                    facility_id=facilities[0].id,  # Assign to first facility
                    provider_id=providers[0].id,   # Assign to first provider
                    created_by_id=doctor_user.id
                )

                session.add(patient)
                await session.flush()
                self.created_entities['patients'].append(patient.id)

            patients.append(patient)

        return patients

    async def create_ivr_requests(self, session, patients: List[Patient], users: Dict[str, User], providers: List[Provider], facilities: List[Facility]) -> List[IVRRequest]:
        """Create mock IVR requests with various statuses."""
        ivr_data = self.load_json_data("mock_ivrs.json")
        ivr_requests = []

        doctor_user = users.get("Doctor")
        ivr_user = users.get("IVR")

        if not doctor_user or not ivr_user:
            logger.error("Required users not found for IVR creation")
            return ivr_requests

        for ivr_item in ivr_data:
            ivr_id = UUID(ivr_item["id"])

            # Check if IVR request exists
            result = await session.execute(
                select(IVRRequest).where(IVRRequest.id == ivr_id)
            )
            ivr_request = result.scalar_one_or_none()

            if not ivr_request:
                logger.info(f"Creating IVR request: {ivr_item['medical_condition']}")

                # Find the patient
                patient = next((p for p in patients if str(p.id) == ivr_item["patient_id"]), None)
                if not patient:
                    logger.error(f"Patient not found for IVR: {ivr_item['patient_id']}")
                    continue

                ivr_request = IVRRequest(
                    id=ivr_id,
                    patient_id=patient.id,
                    provider_id=providers[0].id,  # Use first provider
                    facility_id=facilities[0].id,  # Use first facility
                    current_reviewer_id=ivr_user.id if ivr_item.get("current_reviewer_id") else None,
                    status=ivr_item["status"],
                    priority=ivr_item["priority"],
                    service_type=ivr_item.get("submission_type", "wound_care"),
                    request_metadata=ivr_item.get("submission_metadata", {}),
                    notes=ivr_item.get("medical_condition", "")
                )

                session.add(ivr_request)
                await session.flush()
                self.created_entities['ivr_requests'].append(ivr_request.id)

                # Create status history
                for history_item in ivr_item.get("workflow_history", []):
                    status_history = IVRStatusHistory(
                        ivr_request_id=ivr_request.id,
                        to_status=history_item["status"],
                        changed_by_id=doctor_user.id,  # Simplified for mock data
                        reason=history_item.get("notes", "Mock data status change")
                    )
                    session.add(status_history)

            ivr_requests.append(ivr_request)

        return ivr_requests

    async def create_products(self, session) -> List[Product]:
        """Create Q code wound care products."""
        products_data = self.load_json_data("mock_products.json")
        products = []

        for product_data in products_data:
            product_id = UUID(product_data["id"])

            # Check if product exists
            result = await session.execute(
                select(Product).where(Product.id == product_id)
            )
            product = result.scalar_one_or_none()

            if not product:
                logger.info(f"Creating product: {product_data['name']}")

                product = Product(
                    id=product_id,
                    name=product_data["name"],
                    description=product_data["description"],
                    sku=product_data["sku"],
                    hcpcs_code=product_data.get("hcpcs_code"),
                    category=product_data["category"],
                    unit_price=product_data["unit_price"],
                    is_active=product_data["is_active"],
                    product_metadata=product_data.get("product_metadata", {})
                )

                session.add(product)
                await session.flush()
                self.created_entities['products'].append(product.id)

            products.append(product)

        return products

    async def create_audit_logs(self, session, org: Organization, users: Dict[str, User]) -> None:
        """Create sample audit logs for HIPAA compliance demonstration."""
        admin_user = users.get("Admin")
        doctor_user = users.get("Doctor")
        ivr_user = users.get("IVR")

        if not all([admin_user, doctor_user, ivr_user]):
            logger.error("Required users not found for audit log creation")
            return

        audit_entries = [
            {
                "action": "patient_access",
                "resource_type": "patient",
                "user_id": doctor_user.id,
                "description": "Accessed patient record for wound assessment",
                "ip_address": "192.168.1.100",
                "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
            },
            {
                "action": "ivr_submission",
                "resource_type": "ivr_request",
                "user_id": doctor_user.id,
                "description": "Submitted IVR request for diabetic foot ulcer treatment",
                "ip_address": "192.168.1.100",
                "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
            },
            {
                "action": "ivr_review",
                "resource_type": "ivr_request",
                "user_id": ivr_user.id,
                "description": "Reviewed and approved IVR request",
                "ip_address": "192.168.1.200",
                "user_agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"
            },
            {
                "action": "user_login",
                "resource_type": "authentication",
                "user_id": admin_user.id,
                "description": "Administrator login to system",
                "ip_address": "192.168.1.50",
                "user_agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36"
            }
        ]

        for i, entry in enumerate(audit_entries):
            audit_log = AuditLog(
                action=entry["action"],
                resource_type=entry["resource_type"],
                resource_id=uuid4(),  # Mock resource ID
                user_id=entry["user_id"],
                organization_id=org.id,
                details={
                    "description": entry["description"],
                    "ip_address": entry["ip_address"],
                    "user_agent": entry["user_agent"]
                },
                created_by_id=entry["user_id"]
            )
            session.add(audit_log)
            self.created_entities['audit_logs'].append(audit_log.id)

    async def seed_all_data(self) -> None:
        """Main method to seed all mock data."""
        logger.info("Starting comprehensive mock data seeding...")

        async with AsyncSessionLocal() as session:
            try:
                async with session.begin():
                    # 1. Create organization
                    org = await self.create_organization(session)

                    # 2. Create roles
                    roles = await self.create_roles(session, org)

                    # 3. Create facilities
                    facilities = await self.create_facilities(session, org)

                    # 4. Create users (moved before providers)
                    users = await self.create_users(session, org, roles)

                    # 5. Create providers (now after users)
                    providers = await self.create_providers(session, org, facilities, users)

                    # 6. Create patients
                    patients = await self.create_patients(session, org, users, facilities, providers)

                    # 7. Create products
                    products = await self.create_products(session)

                    # 8. Create IVR requests
                    ivr_requests = await self.create_ivr_requests(session, patients, users, providers, facilities)

                    # 9. Create audit logs
                    await self.create_audit_logs(session, org, users)

                    logger.info("All mock data seeded successfully!")

                    # Print summary
                    self.print_summary()

            except Exception as e:
                logger.error(f"Error during seeding: {e}")
                await session.rollback()
                raise

    def print_summary(self) -> None:
        """Print summary of created entities."""
        logger.info("=== MOCK DATA SEEDING SUMMARY ===")
        for entity_type, entity_list in self.created_entities.items():
            logger.info(f"{entity_type.replace('_', ' ').title()}: {len(entity_list)} created")

        logger.info("\n=== AVAILABLE TEST CREDENTIALS ===")
        test_users = [
            ("admin@healthcare.local", "admin123", "System Administrator"),
            ("doctor@healthcare.local", "doctor123", "Healthcare Provider"),
            ("ivr@healthcare.local", "ivr123", "IVR Specialist"),
            ("distributor@healthcare.local", "distributor123", "Master Distributor"),
            ("chp@healthcare.local", "chp123", "CHP Administrator"),
            ("distributor2@healthcare.local", "distributor123", "Regional Distributor"),
            ("sales@healthcare.local", "sales123", "Sales Representative"),
            ("logistics@healthcare.local", "logistics123", "Logistics Coordinator")
        ]

        for email, password, role in test_users:
            logger.info(f"  {email} / {password} ({role})")


async def main():
    """Main function to run the seeding process."""
    try:
        seeder = MockDataSeeder()
        await seeder.seed_all_data()
        logger.info("Mock data seeding completed successfully!")
    except Exception as e:
        logger.error(f"Mock data seeding failed: {e}")
        sys.exit(1)
    finally:
        await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())