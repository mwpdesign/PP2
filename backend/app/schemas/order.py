from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel


class OrderBase(BaseModel):
    """Base order schema."""
    patient_id: UUID
    provider_id: UUID
    status: str
    description: str


class OrderCreate(OrderBase):
    """Order creation schema."""
    pass


class OrderUpdate(OrderBase):
    """Order update schema."""
    status: Optional[str] = None
    description: Optional[str] = None


class OrderInDB(OrderBase):
    """Order in DB schema."""
    id: UUID
    created_by_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class Order(OrderInDB):
    """Order schema (response model)."""
    pass 