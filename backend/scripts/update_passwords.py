#!/usr/bin/env python3

import os
import sys
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from passlib.context import CryptContext

# Add the backend directory to the Python path
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(backend_dir)

from app.models.user import User  # noqa: E402

# Initialize password context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def update_user_passwords(session):
    """Update passwords for demo users"""
    users = [
        {"email": "admin@example.com", "password": "admin123"},
        {"email": "provider@example.com", "password": "provider123"},
        {"email": "staff@example.com", "password": "staff123"},
    ]

    for user_data in users:
        user = session.query(User).filter_by(email=user_data["email"]).first()
        if user:
            # Hash password using passlib
            hashed_password = pwd_context.hash(user_data["password"])
            user.encrypted_password = hashed_password
            print(f"Updated password for {user_data['email']}")

    session.commit()


def main():
    """Main function to update passwords"""
    # Get database URL from environment or use default
    database_url = os.getenv(
        "DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/healthcare_ivr"
    )

    # Create database engine and session
    engine = create_engine(database_url)
    Session = sessionmaker(bind=engine)
    session = Session()

    try:
        print("Updating user passwords...")
        update_user_passwords(session)
        print("Passwords updated successfully!")

    except Exception as e:
        print(f"Error updating passwords: {e}")
        session.rollback()
        raise
    finally:
        session.close()


if __name__ == "__main__":
    main()
