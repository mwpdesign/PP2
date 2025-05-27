"""
System bootstrap script for Healthcare IVR Platform.
Initializes database schema, creates initial roles, and sets up admin user.
"""

import sys
import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.exc import SQLAlchemyError

from app.core.config import get_settings
from app.core.security import get_password_hash
from app.models.base import Base
from app.models.user import User, Role, Organization
from app.models.audit import AuditLog
from app.models.ivr import IVRFlow, IVRNode

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def create_initial_roles(session) -> dict:
    """Create initial system roles."""
    logger.info("Creating initial roles...")

    roles = {
        "ADMIN": "System Administrator",
        "PROVIDER": "Healthcare Provider",
        "IVR_OPERATOR": "IVR System Operator",
        "PATIENT": "Patient User",
        "SUPPORT": "Support Staff"
    }

    role_objects = {}
    for role_name, description in roles.items():
        role = session.query(Role).filter_by(name=role_name).first()
        if not role:
            role = Role(name=role_name, description=description)
            session.add(role)
            logger.info(f"Created role: {role_name}")
        role_objects[role_name] = role

    return role_objects

def create_initial_organization(session) -> Organization:
    """Create the initial healthcare organization."""
    logger.info("Creating initial organization...")

    org = session.query(Organization).first()
    if not org:
        org = Organization(
            name="Healthcare IVR Platform",
            description="Primary Healthcare Organization",
            status="ACTIVE",
            contact_email="admin@healthcare-ivr.com",
            contact_phone="+1-555-0123",
            address="123 Healthcare Ave, Medical District, MD 12345"
        )
        session.add(org)
        logger.info("Created initial organization")

    return org

def create_admin_user(session, org: Organization, admin_role: Role):
    """Create the initial admin user."""
    logger.info("Creating admin user...")

    admin_email = "admin@healthcare-ivr.com"
    admin = session.query(User).filter_by(email=admin_email).first()
    if not admin:
        admin = User(
            email=admin_email,
            hashed_password=get_password_hash("admin123"),  # Change on first login
            first_name="System",
            last_name="Administrator",
            is_active=True,
            is_superuser=True,
            organization_id=org.id
        )
        admin.roles.append(admin_role)
        session.add(admin)
        logger.info("Created admin user")

        # Create audit log for admin user creation
        audit = AuditLog(
            user_id=None,  # System action
            action="CREATE_USER",
            resource_type="USER",
            resource_id=admin.id,
            details="Created initial admin user during system bootstrap"
        )
        session.add(audit)

def create_sample_ivr_flow(session):
    """Create a sample IVR flow for testing."""
    logger.info("Creating sample IVR flow...")

    flow = session.query(IVRFlow).filter_by(name="Sample Flow").first()
    if not flow:
        flow = IVRFlow(
            name="Sample Flow",
            description="Sample patient intake flow",
            status="ACTIVE",
            version=1
        )
        session.add(flow)

        # Create sample nodes
        welcome = IVRNode(
            flow=flow,
            node_type="WELCOME",
            content="Welcome to the Healthcare IVR System",
            order=1
        )
        menu = IVRNode(
            flow=flow,
            node_type="MENU",
            content=(
                "Press 1 for appointments, 2 for prescriptions, "
                "3 for urgent care"
            ),
            order=2
        )
        session.add_all([welcome, menu])
        logger.info("Created sample IVR flow")

def bootstrap_system():
    """Bootstrap the system with initial configuration."""
    logger.info("Starting system bootstrap...")

    # Load settings
    settings = get_settings()

    try:
        # Create database engine
        engine = create_engine(settings.get_database_url())

        # Create all tables
        Base.metadata.create_all(engine)
        logger.info("Created database schema")

        # Create session
        Session = sessionmaker(bind=engine)
        session = Session()

        try:
            # Create initial data
            roles = create_initial_roles(session)
            org = create_initial_organization(session)
            create_admin_user(session, org, roles["ADMIN"])
            create_sample_ivr_flow(session)

            # Commit all changes
            session.commit()
            logger.info("System bootstrap completed successfully!")

        except SQLAlchemyError as e:
            session.rollback()
            logger.error(f"Database error during bootstrap: {e}")
            sys.exit(1)
        finally:
            session.close()

    except Exception as e:
        logger.error(f"Error during system bootstrap: {e}")
        sys.exit(1)

if __name__ == "__main__":
    bootstrap_system()