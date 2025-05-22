"""Order models."""

from sqlalchemy import Column, Integer, String
from app.core.database import Base


class Product(Base):
    """Product model."""

    __tablename__ = "products"

    id = Column(Integer, primary_key=True)
    name = Column(String(255), nullable=False)
