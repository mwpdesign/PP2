"""Association tables for models."""

from sqlalchemy import Column, ForeignKey, Table, String
from sqlalchemy.dialects.postgresql import UUID

from app.core.database import Base
