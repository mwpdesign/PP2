# Database Models (Most Important)

## File Structure

```plaintext
backend/app/models/
├── user.py (or users.py)
├── patient.py (or patients.py)
├── order.py (or orders.py)
├── __init__.py
├── base.py (if you have a base model)
```

## Description
- **user.py / users.py**: Defines the User model, including authentication, roles, and territory association.
- **patient.py / patients.py**: Contains the Patient model, with PHI fields, territory linkage, and user ownership.
- **order.py / orders.py**: Manages the Order model, including status, patient/provider linkage, and encrypted data.
- **base.py**: (If present) Provides a shared base class for all models, typically with common fields and SQLAlchemy setup.
- **__init__.py**: Makes the directory a Python package.

## Review Context
These models are the foundation of the data layer. Review for:
- Field completeness (all required business data present?)
- Security (PHI encryption, territory isolation)
- Relationships (foreign keys, ownership, audit fields)
- Extensibility (easy to add new fields or models?) 