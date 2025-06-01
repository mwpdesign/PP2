#!/usr/bin/env python3

import os
import sys
from datetime import datetime, timedelta
import bcrypt
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Add the backend directory to the Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import models after adding backend to Python path
from app.models.ivr_call import IVRCall
from app.models.order import Order
from app.models.patient import Patient
from app.models.provider import Provider
from app.models.user import User


def create_demo_users(session):
    """Create demo users with different roles"""
    users = [
        {
            "email": "admin@example.com",
            "password": "admin123",
            "role": "admin",
            "first_name": "Admin",
            "last_name": "User",
        },
        {
            "email": "provider@example.com",
            "password": "provider123",
            "role": "provider",
            "first_name": "Doctor",
            "last_name": "Smith",
        },
        {
            "email": "patient@example.com",
            "password": "patient123",
            "role": "patient",
            "first_name": "John",
            "last_name": "Doe",
        },
    ]

    created_users = {}
    for user_data in users:
        # Hash password
        salt = bcrypt.gensalt()
        hashed_password = bcrypt.hashpw(user_data["password"].encode(), salt)

        user = User(
            email=user_data["email"],
            password_hash=hashed_password.decode(),
            role=user_data["role"],
            first_name=user_data["first_name"],
            last_name=user_data["last_name"],
            is_active=True,
        )
        session.add(user)
        session.flush()
        created_users[user_data["role"]] = user

    return created_users


def create_demo_provider(session, provider_user):
    """Create a demo provider"""
    provider = Provider(
        user_id=provider_user.id,
        license_number="MD123456",
        specialty="Family Medicine",
        practice_name="HealthCare Demo Clinic",
        address="123 Medical Center Dr",
        city="San Francisco",
        state="CA",
        zip_code="94143",
        phone="(415) 555-0123",
    )
    session.add(provider)
    return provider


def create_demo_patient(session, patient_user, provider):
    """Create a demo patient"""
    patient = Patient(
        user_id=patient_user.id,
        provider_id=provider.id,
        date_of_birth=datetime(1980, 1, 15),
        insurance_provider="Demo Health Insurance",
        insurance_id="INS123456789",
        address="456 Patient St",
        city="San Francisco",
        state="CA",
        zip_code="94110",
        phone="(415) 555-0456",
        emergency_contact="Jane Doe",
        emergency_phone="(415) 555-0789",
    )
    session.add(patient)
    return patient


def create_demo_orders(session, patient, provider):
    """Create demo orders"""
    statuses = ["pending", "confirmed", "processing", "completed"]
    orders = []

    for i, status in enumerate(statuses):
        order_date = datetime.now() - timedelta(days=i * 2)
        order = Order(
            patient_id=patient.id,
            provider_id=provider.id,
            status=status,
            prescription_details=f"Demo Prescription #{i+1}",
            created_at=order_date,
            updated_at=order_date,
        )
        session.add(order)
        orders.append(order)

    return orders


def create_demo_ivr_calls(session, patient, orders):
    """Create demo IVR calls"""
    for i, order in enumerate(orders):
        call_date = order.created_at + timedelta(hours=1)
        call = IVRCall(
            patient_id=patient.id,
            order_id=order.id,
            call_sid=f"DEMO_CALL_{i+1}",
            status="completed",
            duration=120,
            recording_url=f"https://demo-recordings.example.com/call_{i+1}.mp3",
            created_at=call_date,
            updated_at=call_date,
        )
        session.add(call)


def main():
    """Main function to seed demo data"""
    # Get database URL from environment or use default
    database_url = os.getenv(
        "DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/healthcare_ivr"
    )

    # Create database engine and session
    engine = create_engine(database_url)
    Session = sessionmaker(bind=engine)
    session = Session()

    try:
        print("Creating demo users...")
        users = create_demo_users(session)

        print("Creating demo provider...")
        provider = create_demo_provider(session, users["provider"])

        print("Creating demo patient...")
        patient = create_demo_patient(session, users["patient"], provider)

        print("Creating demo orders...")
        orders = create_demo_orders(session, patient, provider)

        print("Creating demo IVR calls...")
        create_demo_ivr_calls(session, patient, orders)

        session.commit()
        print("Demo data seeded successfully!")

    except Exception as e:
        print(f"Error seeding demo data: {e}")
        session.rollback()
        raise
    finally:
        session.close()


if __name__ == "__main__":
    main()
