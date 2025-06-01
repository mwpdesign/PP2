# Configuration Files

## File Structure

```plaintext
backend/app/core/
├── database.py
├── config.py
├── security.py
```

## Description
- **database.py**: Sets up the database connection, ORM configuration, and session management.
- **config.py**: Centralizes application settings, environment variables, and feature flags.
- **security.py**: Handles authentication, password hashing, JWT setup, and security utilities.

## Review Context
Config files show how the system is wired together. Review for:
- Security (secrets management, environment separation)
- Flexibility (easy to change settings per environment?)
- Clarity and maintainability
- Proper separation of concerns 