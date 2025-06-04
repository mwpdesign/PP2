import bcrypt
import sys
import os

# Configuration - same as your backend
password_to_hash = os.getenv("PASSWORD_TO_HASH")
rounds = 12  # Matches your backend's bcrypt.gensalt(12)

if not password_to_hash:
    print("Error: PASSWORD_TO_HASH environment variable is required.")
    print("Usage: PASSWORD_TO_HASH=your_password python hash_password.py")
    sys.exit(1)

# Generate hash exactly like your backend does
password_bytes = password_to_hash.encode('utf-8')
salt = bcrypt.gensalt(rounds)
hashed_password_bytes = bcrypt.hashpw(password_bytes, salt)
hashed_password_str = hashed_password_bytes.decode('utf-8')

print(f"Password: {password_to_hash}")
print(f"Hash: {hashed_password_str}")
