"""
Product Catalog API endpoints for the Healthcare IVR Platform.

This module provides comprehensive product management functionality including:
- Product CRUD operations with role-based access control
- Advanced search and filtering capabilities
- Category-based organization
- Real-time inventory integration
- Regulatory compliance support
- Multi-size product variant management
"""

from typing import List, Optional
from uuid import UUID
from fastapi import (
    APIRouter, Depends, HTTPException, Query, status
)
from sqlalchemy import select, func, or_, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.products import (
    Product, ProductCategory, ProductSize, Inventory
)
from app.schemas.products import (
    ProductResponse, ProductDetailResponse, ProductCreate, ProductUpdate,
    ProductSearchResponse, ProductCategoryResponse, InventoryResponse
)
from app.schemas.token import TokenData
from app.services.inventory_service import InventoryService

router = APIRouter()


def check_admin_access(current_user: TokenData) -> bool:
    """Check if user has admin access for write operations."""
    # Check if user has admin role or product management permissions
    if hasattr(current_user, 'role') and current_user.role:
        role_name = getattr(current_user.role, 'name', '').lower()
        return role_name in ['admin', 'super_admin', 'product_manager']
    return False


@router.get("", response_model=ProductSearchResponse)
async def list_products(
    db: AsyncSession = Depends(get_db),
    current_user: TokenData = Depends(get_current_user),
    query: Optional[str] = Query(None, description="Search query"),
    category_id: Optional[UUID] = Query(None, description="Category filter"),
    manufacturer: Optional[str] = Query(
        None, description="Manufacturer filter"
    ),
    is_active: Optional[bool] = Query(
        None, description="Active status filter"
    ),
    requires_prescription: Optional[bool] = Query(
        None, description="Prescription requirement filter"
    ),
    min_price: Optional[float] = Query(
        None, ge=0, description="Minimum price"
    ),
    max_price: Optional[float] = Query(
        None, ge=0, description="Maximum price"
    ),
    in_stock_only: Optional[bool] = Query(
        None, description="Show only in-stock items"
    ),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Page size"),
    sort_by: Optional[str] = Query(
        None, description="Sort field (name, price, created_at)"
    ),
    sort_order: Optional[str] = Query(
        "asc", description="Sort order (asc, desc)"
    ),
) -> ProductSearchResponse:
    """
    List products with advanced search and filtering.

    Supports:
    - Text search across name, description, SKU, manufacturer
    - Category filtering
    - Price range filtering
    - Stock availability filtering
    - Regulatory compliance filtering
    - Pagination and sorting
    """
    try:
        # Build base query with relationships
        base_query = (
            select(Product)
            .options(
                selectinload(Product.category),
                selectinload(Product.sizes).selectinload(ProductSize.inventory_records)
            )
            .where(Product.organization_id == current_user.organization_id)
        )

        # Apply filters
        filters = []

        # Text search
        if query:
            search_filter = or_(
                Product.name.ilike(f"%{query}%"),
                Product.description.ilike(f"%{query}%"),
                Product.sku.ilike(f"%{query}%"),
                Product.manufacturer.ilike(f"%{query}%"),
                Product.hcpcs_code.ilike(f"%{query}%")
            )
            filters.append(search_filter)

        # Category filter
        if category_id:
            filters.append(Product.category_id == category_id)

        # Manufacturer filter
        if manufacturer:
            filters.append(Product.manufacturer.ilike(f"%{manufacturer}%"))

        # Active status filter
        if is_active is not None:
            filters.append(Product.is_active == is_active)

        # Prescription requirement filter
        if requires_prescription is not None:
            filters.append(Product.requires_prescription == requires_prescription)

        # Price range filters
        if min_price is not None:
            filters.append(Product.base_price >= min_price)
        if max_price is not None:
            filters.append(Product.base_price <= max_price)

        # Apply all filters
        if filters:
            base_query = base_query.where(and_(*filters))

        # Handle stock filtering (requires subquery)
        if in_stock_only:
            # Subquery to find products with available inventory
            stock_subquery = (
                select(ProductSize.product_id)
                .join(Inventory)
                .where(Inventory.quantity_available > 0)
                .where(Inventory.is_active)
                .distinct()
            )
            base_query = base_query.where(
                Product.id.in_(stock_subquery)
            )

        # Get total count
        count_query = select(func.count()).select_from(
            base_query.subquery()
        )
        total_result = await db.execute(count_query)
        total_count = total_result.scalar() or 0

        # Apply sorting
        if sort_by:
            sort_column = getattr(Product, sort_by, None)
            if sort_column:
                if sort_order.lower() == "desc":
                    base_query = base_query.order_by(sort_column.desc())
                else:
                    base_query = base_query.order_by(sort_column.asc())
        else:
            # Default sort by name
            base_query = base_query.order_by(Product.name.asc())

        # Apply pagination
        offset = (page - 1) * page_size
        base_query = base_query.offset(offset).limit(page_size)

        # Execute query
        result = await db.execute(base_query)
        products = result.scalars().all()

        # Calculate total pages
        total_pages = (total_count + page_size - 1) // page_size

        return ProductSearchResponse(
            products=[ProductResponse.from_orm(product) for product in products],
            total_count=total_count,
            page=page,
            page_size=page_size,
            total_pages=total_pages
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to search products: {str(e)}"
        )


@router.get("/{product_id}", response_model=ProductDetailResponse)
async def get_product(
    product_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: TokenData = Depends(get_current_user),
) -> ProductDetailResponse:
    """Get detailed product information including sizes and inventory."""
    try:
        # Query product with all relationships
        query = (
            select(Product)
            .options(
                selectinload(Product.category),
                selectinload(Product.sizes).selectinload(ProductSize.inventory_records),
                selectinload(Product.sizes).selectinload(ProductSize.pricing_records)
            )
            .where(Product.id == product_id)
            .where(Product.organization_id == current_user.organization_id)
        )

        result = await db.execute(query)
        product = result.scalar_one_or_none()

        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Product not found"
            )

        return ProductDetailResponse.from_orm(product)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get product: {str(e)}"
        )


@router.post("", response_model=ProductResponse)
async def create_product(
    product_data: ProductCreate,
    db: AsyncSession = Depends(get_db),
    current_user: TokenData = Depends(get_current_user),
) -> ProductResponse:
    """Create a new product (admin only)."""
    try:
        # Check admin access
        if not check_admin_access(current_user):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Admin access required to create products"
            )

        # Verify category exists
        category = await db.get(ProductCategory, product_data.category_id)
        if not category:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid category ID"
            )

        # Check SKU uniqueness
        existing_sku = await db.execute(
            select(Product).where(Product.sku == product_data.sku)
        )
        if existing_sku.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="SKU already exists"
            )

        # Create product
        product = Product(
            **product_data.dict(),
            organization_id=current_user.organization_id
        )

        db.add(product)
        await db.commit()
        await db.refresh(product)

        return ProductResponse.from_orm(product)

    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create product: {str(e)}"
        )


@router.put("/{product_id}", response_model=ProductResponse)
async def update_product(
    product_id: UUID,
    product_data: ProductUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: TokenData = Depends(get_current_user),
) -> ProductResponse:
    """Update an existing product (admin only)."""
    try:
        # Check admin access
        if not check_admin_access(current_user):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Admin access required to update products"
            )

        # Get existing product
        product = await db.get(Product, product_id)
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Product not found"
            )

        # Check organization access
        if product.organization_id != current_user.organization_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to update this product"
            )

        # Update fields
        update_data = product_data.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(product, field, value)

        await db.commit()
        await db.refresh(product)

        return ProductResponse.from_orm(product)

    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update product: {str(e)}"
        )


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_product(
    product_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: TokenData = Depends(get_current_user),
):
    """Soft delete a product (admin only)."""
    try:
        # Check admin access
        if not check_admin_access(current_user):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Admin access required to delete products"
            )

        # Get existing product
        product = await db.get(Product, product_id)
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Product not found"
            )

        # Check organization access
        if product.organization_id != current_user.organization_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to delete this product"
            )

        # Soft delete (mark as inactive)
        product.is_active = False
        product.is_discontinued = True

        await db.commit()

    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete product: {str(e)}"
        )


@router.get("/{product_id}/inventory", response_model=List[InventoryResponse])
async def get_product_inventory(
    product_id: UUID,
    warehouse_location: Optional[str] = Query(
        None, description="Filter by warehouse location"
    ),
    db: AsyncSession = Depends(get_db),
    current_user: TokenData = Depends(get_current_user),
) -> List[InventoryResponse]:
    """Get real-time inventory levels for all sizes of a product."""
    try:
        # Verify product exists and user has access
        product = await db.get(Product, product_id)
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Product not found"
            )

        if product.organization_id != current_user.organization_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to view this product's inventory"
            )

        # Get inventory using service
        inventory_service = InventoryService(db)
        inventory_records = await inventory_service.get_product_inventory(
            product_id, warehouse_location
        )

        return inventory_records

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get product inventory: {str(e)}"
        )


@router.get("/categories/", response_model=List[ProductCategoryResponse])
async def list_categories(
    db: AsyncSession = Depends(get_db),
    current_user: TokenData = Depends(get_current_user),
    parent_id: Optional[UUID] = Query(
        None, description="Filter by parent category"
    ),
    include_inactive: bool = Query(
        False, description="Include inactive categories"
    ),
) -> List[ProductCategoryResponse]:
    """List product categories with hierarchical structure."""
    try:
        # Build query
        query = (
            select(ProductCategory)
            .options(selectinload(ProductCategory.subcategories))
            .where(ProductCategory.organization_id == current_user.organization_id)
        )

        # Filter by parent
        if parent_id:
            query = query.where(ProductCategory.parent_category_id == parent_id)
        else:
            # Root categories only
            query = query.where(ProductCategory.parent_category_id.is_(None))

        # Filter by active status
        if not include_inactive:
            query = query.where(ProductCategory.is_active)

        # Order by display order and name
        query = query.order_by(
            ProductCategory.display_order.asc(),
            ProductCategory.name.asc()
        )

        result = await db.execute(query)
        categories = result.scalars().all()

        return [ProductCategoryResponse.from_orm(cat) for cat in categories]

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list categories: {str(e)}"
        )


@router.get("/low-stock/", response_model=List[InventoryResponse])
async def get_low_stock_products(
    db: AsyncSession = Depends(get_db),
    current_user: TokenData = Depends(get_current_user),
    warehouse_location: Optional[str] = Query(
        None, description="Filter by warehouse location"
    ),
) -> List[InventoryResponse]:
    """Get products with low stock levels."""
    try:
        # Get low stock items using service
        inventory_service = InventoryService(db)
        low_stock_items = await inventory_service.get_low_stock_items(
            warehouse_location
        )

        # Filter by organization (through product relationship)
        # This would need to be implemented in the service
        # For now, return all low stock items
        return low_stock_items

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get low stock products: {str(e)}"
        )