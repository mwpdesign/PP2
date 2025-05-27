"""Order models."""

from datetime import datetime
from uuid import UUID as PyUUID, uuid4
from sqlalchemy import String, DateTime, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship, Mapped, mapped_column
from app.core.database import Base


class Product(Base):
    """Product model."""

    __tablename__ = "products"

    id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid4
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)


class OrderStatusHistory(Base):
    """Order status history model."""

    __tablename__ = "order_status_history"

    id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
        index=True
    )
    order_id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("orders.id"),
        nullable=False
    )
    previous_status: Mapped[str] = mapped_column(String(50), nullable=False)
    new_status: Mapped[str] = mapped_column(String(50), nullable=False)
    changed_by: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=False
    )
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    territory_id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("territories.id"),
        nullable=False
    )
    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=datetime.utcnow
    )

    # Relationships
    order = relationship("Order", back_populates="status_history")
    user = relationship("User")
    territory = relationship("Territory")
