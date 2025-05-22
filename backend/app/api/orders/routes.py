"""
Order management API endpoints.
"""
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from uuid import UUID

from app.core.database import get_db
from app.core.security import get_current_user, verify_territory_access
from app.core.audit import audit_product_change
from .inventory_service import InventoryService
from .models import Product, ProductCategory
from .schemas import (
    ProductCreate,
    ProductUpdate,
    ProductResponse,
    ProductCategoryCreate,
    ProductCategoryResponse,
    ProductSearchParams,
    InventoryUpdateParams,
    InventoryReservationParams,
    ProductInventoryResponse,
    ProductComplianceResponse,
    OrderCreate, OrderUpdate, OrderResponse,
    OrderStatusCreate, OrderStatusResponse,
    OrderApprovalUpdate, OrderApprovalResponse,
    OrderSearchParams, OrderSearchResponse
)
from app.services.order_service import OrderService

router = APIRouter(prefix="/orders", tags=["orders"])

@router.get("/products", response_model=List[ProductResponse])
async def list_products(
    territory_id: str,
    category_id: Optional[str] = None,
    compliance_status: Optional[str] = None,
    in_stock_only: bool = False,
    query: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """List products with filtering options."""
    await verify_territory_access(current_user, territory_id)
    
    inventory_service = InventoryService(db)
    search_params = ProductSearchParams(
        query=query,
        territory_id=territory_id,
        category_id=category_id,
        compliance_status=compliance_status,
        in_stock_only=in_stock_only
    )
    
    return await inventory_service.search_products(**search_params.dict())

@router.get("/products/{product_id}", response_model=ProductResponse)
async def get_product(
    product_id: str,
    territory_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get detailed product information."""
    await verify_territory_access(current_user, territory_id)
    
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    return product

@router.post("/products", response_model=ProductResponse)
async def create_product(
    product: ProductCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Create a new product (admin only)."""
    if not current_user.get("is_admin"):
        raise HTTPException(
            status_code=403,
            detail="Only administrators can create products"
        )
    
    db_product = Product(**product.dict(exclude={"category_ids"}))
    
    # Add categories
    if product.category_ids:
        categories = db.query(ProductCategory).filter(
            ProductCategory.id.in_(product.category_ids)
        ).all()
        db_product.categories = categories
    
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    
    await audit_product_change(
        db,
        "create",
        db_product.id,
        current_user["id"]
    )
    
    return db_product

@router.put("/products/{product_id}", response_model=ProductResponse)
async def update_product(
    product_id: str,
    product: ProductUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Update product information (admin only)."""
    if not current_user.get("is_admin"):
        raise HTTPException(
            status_code=403,
            detail="Only administrators can update products"
        )
    
    db_product = db.query(Product).filter(Product.id == product_id).first()
    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Update fields
    for field, value in product.dict(exclude_unset=True).items():
        if field == "category_ids" and value is not None:
            categories = db.query(ProductCategory).filter(
                ProductCategory.id.in_(value)
            ).all()
            db_product.categories = categories
        else:
            setattr(db_product, field, value)
    
    db.commit()
    db.refresh(db_product)
    
    await audit_product_change(
        db,
        "update",
        product_id,
        current_user["id"]
    )
    
    return db_product

@router.get("/products/{product_id}/inventory", response_model=List[ProductInventoryResponse])
async def get_product_inventory(
    product_id: str,
    territory_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get product inventory levels."""
    await verify_territory_access(current_user, territory_id)
    
    inventory_service = InventoryService(db)
    available, message = await inventory_service.get_product_availability(
        product_id,
        territory_id
    )
    
    if not available:
        raise HTTPException(status_code=404, detail=message)
    
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    return product.inventory

@router.post("/products/{product_id}/inventory", response_model=ProductInventoryResponse)
async def update_inventory(
    product_id: str,
    params: InventoryUpdateParams,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Update product inventory levels (admin only)."""
    if not current_user.get("is_admin"):
        raise HTTPException(
            status_code=403,
            detail="Only administrators can update inventory"
        )
    
    inventory_service = InventoryService(db)
    try:
        return await inventory_service.update_stock_level(
            product_id=params.product_id,
            territory_id=params.territory_id,
            quantity=params.quantity,
            operation=params.operation
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/products/{product_id}/reserve", response_model=bool)
async def reserve_inventory(
    product_id: str,
    params: InventoryReservationParams,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Reserve product inventory for an order."""
    await verify_territory_access(current_user, params.territory_id)
    
    inventory_service = InventoryService(db)
    try:
        return await inventory_service.reserve_inventory(
            product_id=params.product_id,
            territory_id=params.territory_id,
            quantity=params.quantity,
            order_id=params.order_id
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/products/{product_id}/compliance", response_model=List[ProductComplianceResponse])
async def get_product_compliance(
    product_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get product compliance information."""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    return product.compliance

@router.get("/products/categories", response_model=List[ProductCategoryResponse])
async def list_categories(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """List all product categories."""
    return db.query(ProductCategory).filter(
        ProductCategory.parent_id.is_(None)
    ).all()

@router.post("/products/categories", response_model=ProductCategoryResponse)
async def create_category(
    category: ProductCategoryCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Create a new product category (admin only)."""
    if not current_user.get("is_admin"):
        raise HTTPException(
            status_code=403,
            detail="Only administrators can create categories"
        )
    
    db_category = ProductCategory(**category.dict())
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    
    return db_category

@router.post(
    "",
    response_model=OrderResponse,
    status_code=status.HTTP_201_CREATED
)
async def create_order(
    order_data: OrderCreate,
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> OrderResponse:
    """Create a new order."""
    order_service = OrderService(db, current_user)
    return await order_service.create_order(order_data)

@router.get(
    "/{order_id}",
    response_model=OrderResponse
)
async def get_order(
    order_id: UUID,
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> OrderResponse:
    """Get order details by ID."""
    order_service = OrderService(db, current_user)
    order = await order_service.get_order(order_id)
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
    order_data: OrderUpdate,
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> OrderResponse:
    """Update an existing order."""
    order_service = OrderService(db, current_user)
    return await order_service.update_order(order_id, order_data)

@router.post(
    "/{order_id}/status",
    response_model=OrderStatusResponse
)
async def update_order_status(
    order_id: UUID,
    status_data: OrderStatusCreate,
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> OrderStatusResponse:
    """Update order status."""
    order_service = OrderService(db, current_user)
    return await order_service.update_order_status(
        order_id,
        status_data
    )

@router.put(
    "/{order_id}/approvals/{approval_id}",
    response_model=OrderApprovalResponse
)
async def update_order_approval(
    order_id: UUID,
    approval_id: UUID,
    approval_data: OrderApprovalUpdate,
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> OrderApprovalResponse:
    """Update order approval status."""
    order_service = OrderService(db, current_user)
    return await order_service.update_order_approval(
        order_id,
        approval_id,
        approval_data
    )

@router.get(
    "",
    response_model=OrderSearchResponse
)
async def search_orders(
    search_params: OrderSearchParams = Depends(),
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> OrderSearchResponse:
    """Search orders with filtering and pagination."""
    order_service = OrderService(db, current_user)
    return await order_service.search_orders(search_params)

@router.post(
    "/from-ivr/{ivr_session_id}",
    response_model=OrderResponse,
    status_code=status.HTTP_201_CREATED
)
async def create_order_from_ivr(
    ivr_session_id: UUID,
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> OrderResponse:
    """Create a new order from an approved IVR session."""
    order_service = OrderService(db, current_user)
    return await order_service.create_order_from_ivr(ivr_session_id) 