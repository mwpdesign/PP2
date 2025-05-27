-- Drop the existing alembic_version table
DROP TABLE IF EXISTS alembic_version;

-- Create a new alembic_version table with the correct column length
CREATE TABLE alembic_version (
    version_num VARCHAR(255) NOT NULL,
    CONSTRAINT alembic_version_pkc PRIMARY KEY (version_num)
); 