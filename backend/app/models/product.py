"""Product model for managing medical supplies and equipment."""
from datetime import datetime
from uuid import UUID as PyUUID, uuid4
from sqlalchemy import String, DateTime, Boolean, Float, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Product(Base):
    """Product model for medical supplies and equipment."""
    __tablename__ = "products"

    id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid4
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(String(1000))
    sku: Mapped[str] = mapped_column(String(50), unique=True)
    hcpcs_code: Mapped[str] = mapped_column(String(20), nullable=True)
    category: Mapped[str] = mapped_column(String(100))
    unit_price: Mapped[float] = mapped_column(Float, nullable=False)
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True
    )
    product_metadata: Mapped[dict] = mapped_column(
        JSON,
        nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=datetime.utcnow
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        onupdate=datetime.utcnow
    )

    # Relationships
    ivr_session_items = relationship(
        "IVRSessionItem",
        back_populates="product"
    )

    def __repr__(self):
        """String representation of the product."""
        return f"<Product(name='{self.name}', sku='{self.sku}')>" 