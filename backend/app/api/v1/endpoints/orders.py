from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from app.api.deps import get_db
from app.core.security import get_current_active_user
from app.schemas.user import UserInDB
from app.schemas.order import OrderCreate, OrderUpdate, OrderInDB
from app.services.order_service import OrderService

router = APIRouter()


@router.get("/", response_model=List[OrderInDB])
async def get_orders(
    db: AsyncSession = Depends(get_db),
    current_user: UserInDB = Depends(get_current_active_user),
    skip: int = 0,
    limit: int = 100
):
    """
    Retrieve orders.
    """
    orders = await OrderService(db).get_orders(skip=skip, limit=limit)
    return orders


@router.post("/", response_model=OrderInDB)
async def create_order(
    *,
    db: AsyncSession = Depends(get_db),
    order_in: OrderCreate,
    current_user: UserInDB = Depends(get_current_active_user)
):
    """
    Create new order.
    """
    order = await OrderService(db).create_order(order_in)
    return order


@router.put("/{order_id}", response_model=OrderInDB)
async def update_order(
    *,
    db: AsyncSession = Depends(get_db),
    order_id: str,
    order_in: OrderUpdate,
    current_user: UserInDB = Depends(get_current_active_user)
):
    """
    Update an order.
    """
    order = await OrderService(db).update_order(order_id, order_in)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order


@router.get("/{order_id}", response_model=OrderInDB)
async def get_order(
    order_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: UserInDB = Depends(get_current_active_user)
):
    """
    Get order by ID.
    """
    order = await OrderService(db).get_order(order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order 