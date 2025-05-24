"""
Order management endpoints.
"""
from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.schemas.orders import (
    OrderCreate, OrderUpdate, OrderResponse
)
from app.models.order import Order

router = APIRouter()


@router.post(
    "/",
    response_model=OrderResponse,
    status_code=status.HTTP_201_CREATED
)
async def create_order(
    order: OrderCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Create a new order."""
    # Create order model
    db_order = Order(
        patient_id=order.patient_id,
        provider_id=order.provider_id,
        status="pending",
        order_type=order.order_type,
        priority=order.priority,
        notes=order.notes
    )

    db.add(db_order)
    db.commit()
    db.refresh(db_order)
    return db_order


@router.get(
    "/{order_id}",
    response_model=OrderResponse
)
async def get_order(
    order_id: UUID,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get an order by ID."""
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    return order


@router.put(
    "/{order_id}",
    response_model=OrderResponse
)
async def update_order(
    order_id: UUID,
    order: OrderUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Update an order."""
    db_order = db.query(Order).filter(Order.id == order_id).first()
    if not db_order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )

    for field, value in order.dict(exclude_unset=True).items():
        setattr(db_order, field, value)

    db.commit()
    db.refresh(db_order)
    return db_order


@router.get(
    "/",
    response_model=List[OrderResponse]
)
async def list_orders(
    patient_id: Optional[UUID] = None,
    provider_id: Optional[UUID] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """List orders with optional filters."""
    query = db.query(Order)

    if patient_id:
        query = query.filter(Order.patient_id == patient_id)
    if provider_id:
        query = query.filter(Order.provider_id == provider_id)
    if status:
        query = query.filter(Order.status == status)

    return query.all()


@router.delete(
    "/{order_id}",
    status_code=status.HTTP_204_NO_CONTENT
)
async def delete_order(
    order_id: UUID,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Delete an order."""
    db_order = db.query(Order).filter(Order.id == order_id).first()
    if not db_order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )

    db.delete(db_order)
    db.commit()
    return None 