from typing import Optional
from sqlalchemy.orm import Session

from app.models.order import Order
from app.schemas.order import OrderCreate, OrderUpdate


class OrderService:
    """Order service."""

    @staticmethod
    def get(db: Session, order_id: int) -> Optional[Order]:
        """Get order by ID."""
        return db.query(Order).filter(Order.id == order_id).first()

    @staticmethod
    def create(db: Session, obj_in: OrderCreate, created_by_id: str) -> Order:
        """Create new order."""
        db_obj = Order(
            **obj_in.dict(),
            created_by_id=created_by_id
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    @staticmethod
    def update(
        db: Session, db_obj: Order, obj_in: OrderUpdate
    ) -> Order:
        """Update order."""
        update_data = obj_in.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_obj, field, value)
        
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    @staticmethod
    def delete(db: Session, order_id: int) -> None:
        """Delete order."""
        db_obj = OrderService.get(db, order_id)
        if db_obj:
            db.delete(db_obj)
            db.commit() 