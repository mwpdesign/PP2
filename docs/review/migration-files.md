# Migration Files

## File Structure

```plaintext
backend/migrations/
├── versions/
│   ├── 001_initial_schema.sql
│   ├── 002_users_and_roles.sql
│   └── [other migration files]
├── alembic.ini
```

## Description
- **001_initial_schema.sql**: Sets up the initial database schema, including core tables and constraints.
- **002_users_and_roles.sql**: Adds user and role tables, relationships, and possibly initial data.
- **[other migration files]**: Incremental changes to the schema as the project evolves.
- **alembic.ini**: Configuration for Alembic migrations.

## Review Context
Migration files show how the schema has changed over time. Review for:
- Consistency with models (are all model fields present in the schema?)
- Data integrity (constraints, foreign keys, indexes)
- Upgrade/downgrade safety
- Naming conventions and clarity 