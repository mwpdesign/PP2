"""SQLAlchemy models for treatment tracking."""

from datetime import date, datetime
from typing import Optional
from uuid import UUID, uuid4

from sqlalchemy import (
    Column,
    String,
    Integer,
    Date,
    Text,
    DateTime,
    ForeignKey,
    CheckConstraint,
)
from sqlalchemy.dialects.postgresql import UUID as PostgreSQLUUID
from sqlalchemy.orm import relationship, validates
from sqlalchemy.sql import func

from app.core.database import Base


class TreatmentRecord(Base):
    """Model for tracking when products from orders are used on patients."""

    __tablename__ = "treatment_records"

    # Primary key
    id = Column(
        PostgreSQLUUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
        index=True
    )

    # Foreign key relationships
    patient_id = Column(
        PostgreSQLUUID(as_uuid=True),
        ForeignKey("patients.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    order_id = Column(
        PostgreSQLUUID(as_uuid=True),
        ForeignKey("orders.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    recorded_by = Column(
        PostgreSQLUUID(as_uuid=True),
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
        index=True
    )

    # Product information
    product_id = Column(String(100), nullable=False, index=True)
    product_name = Column(String(255), nullable=False)
    quantity_used = Column(Integer, nullable=False)

    # Clinical information
    date_applied = Column(Date, nullable=False, index=True)
    diagnosis = Column(Text, nullable=True)
    procedure_performed = Column(Text, nullable=True)
    wound_location = Column(String(255), nullable=True)
    doctor_notes = Column(Text, nullable=True)

    # Audit timestamps
    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False
    )

    # Relationships
    patient = relationship(
        "Patient",
        back_populates="treatment_records",
        lazy="select"
    )

    order = relationship(
        "Order",
        back_populates="treatment_records",
        lazy="select"
    )

    recorded_by_user = relationship(
        "User",
        back_populates="recorded_treatments",
        lazy="select",
        foreign_keys=[recorded_by]
    )

    # Constraints
    __table_args__ = (
        CheckConstraint(
            "quantity_used > 0",
            name="treatment_records_quantity_used_check"
        ),
    )

    def __repr__(self) -> str:
        """String representation of TreatmentRecord."""
        return (
            f"<TreatmentRecord(id={self.id}, "
            f"patient_id={self.patient_id}, "
            f"product_name='{self.product_name}', "
            f"quantity_used={self.quantity_used}, "
            f"date_applied={self.date_applied})>"
        )

    def __str__(self) -> str:
        """Human-readable string representation."""
        return (
            f"Treatment: {self.product_name} "
            f"({self.quantity_used} units) "
            f"applied on {self.date_applied}"
        )

    @validates("quantity_used")
    def validate_quantity_used(self, key: str, value: int) -> int:
        """Validate that quantity_used is positive."""
        if value <= 0:
            raise ValueError("Quantity used must be greater than 0")
        return value

    @validates("date_applied")
    def validate_date_applied(self, key: str, value: date) -> date:
        """Validate that date_applied is not in the future."""
        if isinstance(value, date) and value > date.today():
            raise ValueError("Treatment date cannot be in the future")
        return value

    @validates("product_id")
    def validate_product_id(self, key: str, value: str) -> str:
        """Validate product_id format."""
        if not value or not value.strip():
            raise ValueError("Product ID cannot be empty")
        return value.strip()

    @validates("product_name")
    def validate_product_name(self, key: str, value: str) -> str:
        """Validate product_name format."""
        if not value or not value.strip():
            raise ValueError("Product name cannot be empty")
        return value.strip()

    @property
    def age_in_days(self) -> int:
        """Calculate how many days ago this treatment was applied."""
        if self.date_applied:
            return (date.today() - self.date_applied).days
        return 0

    @property
    def is_recent(self) -> bool:
        """Check if treatment was applied within the last 7 days."""
        return self.age_in_days <= 7

    def get_remaining_inventory(self, session) -> Optional[int]:
        """
        Calculate remaining inventory for this product.

        This method will be enhanced in future steps when inventory
        tracking is fully implemented. For now, it provides a placeholder
        that can be used by services.

        Args:
            session: SQLAlchemy session for database queries

        Returns:
            Optional[int]: Remaining inventory count, or None if unknown
        """
        # TODO: Implement actual inventory calculation
        # This will require:
        # 1. Query total ordered quantity for this product
        # 2. Query total used quantity across all treatments
        # 3. Calculate remaining = ordered - used

        # Placeholder implementation
        try:
            from sqlalchemy import func

            # Get total used for this product across all treatments
            total_used = session.query(
                func.sum(TreatmentRecord.quantity_used)
            ).filter(
                TreatmentRecord.product_id == self.product_id
            ).scalar() or 0

            # TODO: Get total ordered quantity from orders/inventory system
            # For now, return a placeholder calculation
            # This should be replaced with actual inventory logic

            return max(0, 100 - total_used)  # Placeholder: assume 100 initial

        except Exception:
            # Return None if calculation fails
            return None

    def to_dict(self) -> dict:
        """Convert TreatmentRecord to dictionary representation."""
        return {
            "id": str(self.id),
            "patient_id": str(self.patient_id),
            "order_id": str(self.order_id),
            "product_id": self.product_id,
            "product_name": self.product_name,
            "quantity_used": self.quantity_used,
            "date_applied": (self.date_applied.isoformat()
                           if self.date_applied else None),
            "diagnosis": self.diagnosis,
            "procedure_performed": self.procedure_performed,
            "wound_location": self.wound_location,
            "doctor_notes": self.doctor_notes,
            "recorded_by": str(self.recorded_by),
            "created_at": (self.created_at.isoformat()
                         if self.created_at else None),
            "updated_at": (self.updated_at.isoformat()
                         if self.updated_at else None),
            "age_in_days": self.age_in_days,
            "is_recent": self.is_recent,
        }

    @classmethod
    def create_from_dict(cls, data: dict) -> "TreatmentRecord":
        """Create TreatmentRecord instance from dictionary data."""
        # Convert string UUIDs to UUID objects if needed
        if isinstance(data.get("patient_id"), str):
            data["patient_id"] = UUID(data["patient_id"])
        if isinstance(data.get("order_id"), str):
            data["order_id"] = UUID(data["order_id"])
        if isinstance(data.get("recorded_by"), str):
            data["recorded_by"] = UUID(data["recorded_by"])

                # Convert date string to date object if needed
        if isinstance(data.get("date_applied"), str):
            date_str = data["date_applied"]
            data["date_applied"] = datetime.fromisoformat(date_str).date()

        # Filter out fields that aren't part of the model
        model_fields = {
            "patient_id", "order_id", "product_id", "product_name",
            "quantity_used", "date_applied", "diagnosis",
            "procedure_performed", "wound_location", "doctor_notes",
            "recorded_by"
        }

        filtered_data = {k: v for k, v in data.items() if k in model_fields}

        return cls(**filtered_data)