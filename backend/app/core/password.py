"""Password hashing and verification utilities."""

import bcrypt


def get_password_hash(password: str) -> str:
    """Hash a password for storing."""
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt(12)).decode()


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a stored password against a provided password."""
    try:
        return bcrypt.checkpw(
            plain_password.encode(),
            hashed_password.encode()
        )
    except Exception as e:
        print(f"Password verification error: {str(e)}")
        return False
