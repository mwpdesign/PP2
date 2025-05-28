"""Order models."""

from datetime import datetime
from typing import List, Optional
from uuid import UUID, uuid4

from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import ARRAY, JSON, UUID as PyUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.core.database import Base


class Product(Base):
    """Product model."""

    __tablename__ = "products"

    id: Mapped[PyUUID] = mapped_column(
        PyUUID(as_uuid=True),
        primary_key=True,
        default=uuid4
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)


class OrderStatusHistory(Base):
    """Order status history model."""

    __tablename__ = "order_status_history"

    id: Mapped[PyUUID] = mapped_column(
        PyUUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
        index=True
    )
    order_id: Mapped[PyUUID] = mapped_column(
        PyUUID(as_uuid=True),
        ForeignKey("orders.id"),
        nullable=False
    )
    previous_status: Mapped[str] = mapped_column(String(50), nullable=False)
    new_status: Mapped[str] = mapped_column(String(50), nullable=False)
    changed_by: Mapped[PyUUID] = mapped_column(
        PyUUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=False
    )
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=datetime.utcnow
    )

    # Relationships
    order = relationship("Order", back_populates="status_history")
    user = relationship("User")


class Order(Base):
    """Order model."""

    __tablename__ = "orders"

    id: Mapped[UUID] = mapped_column(
        PyUUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
    )
    organization_id: Mapped[UUID] = mapped_column(
        PyUUID(as_uuid=True),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
    )
    patient_id: Mapped[UUID] = mapped_column(
        PyUUID(as_uuid=True),
        ForeignKey("patients.id", ondelete="CASCADE"),
        nullable=False,
    )
    provider_id: Mapped[Optional[UUID]] = mapped_column(
        PyUUID(as_uuid=True),
        ForeignKey("providers.id", ondelete="SET NULL"),
        nullable=True,
    )
    status: Mapped[str] = mapped_column(String(50))
    order_type: Mapped[str] = mapped_column(String(50))
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    order_metadata: Mapped[dict] = mapped_column(JSON, default=dict)
    tags: Mapped[List[str]] = mapped_column(ARRAY(String), default=list)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )

    # Relationships
    organization = relationship("Organization", back_populates="orders")
    patient = relationship("Patient", back_populates="orders")
    provider = relationship("Provider", back_populates="orders")
    audit_logs = relationship("AuditLog", back_populates="order")
