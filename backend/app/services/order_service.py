"""
Comprehensive Order Management Service with IVR Integration and
HIPAA Compliance.
"""

import logging
from datetime import datetime
from typing import Optional
from uuid import UUID, uuid4
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import desc
from fastapi import HTTPException, status

from app.models.order import Order, OrderStatusHistory, OrderDocument
from app.models.ivr import IVRRequest, IVRProduct
from app.models.facility import Facility
from app.models.user import User
from app.schemas.orders import (
    OrderCreate, OrderUpdate, OrderResponse, OrderStatusUpdate,
    OrderDocumentCreate, OrderDocumentResponse, OrderListResponse,
    OrderFromIVRCreate, ReorderCreate
)
from app.services.audit_service import EncryptionAuditService, AuditContext, DataClassification
from app.core.security import TokenData
from app.core.exceptions import (
    NotFoundException, ValidationError, UnauthorizedError
)

logger = logging.getLogger(__name__)


class OrderService:
    """Comprehensive order management service with IVR integration."""

    def __init__(self, db: Session):
        """Initialize order service with dependencies."""
        self.db = db
        self.audit_service = EncryptionAuditService()

    async def create_order_from_ivr(
        self,
        ivr_id: UUID,
        current_user: TokenData
    ) -> OrderResponse:
        """Create order from approved IVR request."""
        try:
            # Get IVR request with all related data
            ivr_request = self.db.query(IVRRequest).options(
                joinedload(IVRRequest.patient),
                joinedload(IVRRequest.provider),
                joinedload(IVRRequest.facility),
                joinedload(IVRRequest.products).joinedload(IVRProduct.sizes)
            ).filter(IVRRequest.id == ivr_id).first()

            if not ivr_request:
                raise NotFoundException("IVR request not found")

            # Validate IVR is approved
            if ivr_request.status.value != "approved":
                raise ValidationError(
                    "Cannot create order from non-approved IVR request"
                )

            # Check if order already exists for this IVR
            existing_order = self.db.query(Order).filter(
                Order.ivr_request_id == ivr_id
            ).first()
            if existing_order:
                raise ValidationError(
                    f"Order already exists for IVR {ivr_id}: "
                    f"{existing_order.order_number}"
                )

            # Generate unique order number
            order_number = self._generate_order_number()

            # Prepare shipping address (facility address)
            shipping_address = {
                "facility_name": ivr_request.facility.name,
                "address_line_1": ivr_request.facility.address_line1,
                "address_line_2": ivr_request.facility.address_line2,
                "city": ivr_request.facility.city,
                "state": ivr_request.facility.state,
                "zip_code": ivr_request.facility.zip_code,
                "phone": ivr_request.facility.phone,
                "contact_person": ivr_request.provider.name,
                "special_instructions": None
            }

            # Prepare products data from IVR
            products_data = []
            total_cost = 0.0

            for ivr_product in ivr_request.products:
                product_info = {
                    "product_name": ivr_product.product_name,
                    "q_code": ivr_product.q_code,
                    "total_quantity": ivr_product.total_quantity,
                    "total_cost": float(ivr_product.total_cost),
                    "sizes": []
                }

                for size in ivr_product.sizes:
                    size_info = {
                        "size": size.size,
                        "dimensions": size.dimensions,
                        "unit_price": float(size.unit_price),
                        "quantity": size.quantity,
                        "total": float(size.total)
                    }
                    product_info["sizes"].append(size_info)

                products_data.append(product_info)
                total_cost += float(ivr_product.total_cost)

            # Map IVR priority to order priority
            priority_mapping = {
                "high": "urgent",
                "medium": "routine",
                "low": "routine"
            }
            order_priority = priority_mapping.get(
                ivr_request.priority.value, "routine"
            )

            # Create order
            order = Order(
                id=uuid4(),
                organization_id=current_user.organization_id,
                order_number=f"ORD-{datetime.utcnow().strftime('%Y%m%d')}-{uuid4().hex[:8].upper()}",
                patient_id=ivr_request.patient_id,
                provider_id=ivr_request.provider_id,
                created_by_id=current_user.id,
                ivr_request_id=ivr_id,
                ivr_session_id="legacy",  # Legacy field, using ivr_request_id instead
                shipping_address=shipping_address,
                products={"items": products_data, "total_cost": total_cost},
                status="pending",
                order_type="medical_equipment",
                priority=order_priority,
                notes=f"Order created from approved IVR request {ivr_id}",
                total_amount=total_cost,
                insurance_data={},  # Default empty insurance data
                payment_info={},    # Default empty payment info
                delivery_info={},   # Default empty delivery info
                completion_date=datetime.utcnow()  # Set completion date
            )

            self.db.add(order)

            # Create initial status history
            status_history = OrderStatusHistory(
                order=order,
                from_status=None,
                to_status="pending",
                changed_by_id=current_user.id,
                reason="Order created from approved IVR request"
            )
            self.db.add(status_history)

            # Commit transaction
            self.db.commit()
            self.db.refresh(order)

            # Audit log
            self.audit_service.log_phi_access(
                access_type="create",
                resource_type="order",
                resource_id=str(order.id),
                reason=f"Order created from approved IVR request {ivr_id}",
                details={
                    "order_number": order.order_number,
                    "ivr_request_id": str(ivr_id),
                    "patient_id": str(order.patient_id),
                    "total_cost": total_cost
                }
            )

            return await self._build_order_response(order)

        except Exception as e:
            self.db.rollback()
            logger.error(f"Failed to create order from IVR {ivr_id}: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to create order: {str(e)}"
            )

    async def get_order(
        self,
        order_id: UUID,
        current_user: TokenData
    ) -> OrderResponse:
        """Get order details with related data."""
        order = self.db.query(Order).options(
            joinedload(Order.patient),
            joinedload(Order.provider),
            joinedload(Order.ivr_request),
            joinedload(Order.status_history),
            joinedload(Order.documents),
            joinedload(Order.created_by),
            joinedload(Order.received_by_user)
        ).filter(Order.id == order_id).first()

        if not order:
            raise NotFoundException("Order not found")

        # Check access permissions
        await self._check_order_access(order, current_user)

        # Audit log
        self.audit_service.log_phi_access(
            access_type="view",
            resource_type="order",
            resource_id=str(order.id),
            reason="Order details viewed",
            details={"order_number": order.order_number}
        )

        return await self._build_order_response(order)

    async def list_orders(
        self,
        current_user: TokenData,
        status_filter: Optional[str] = None,
        patient_id: Optional[UUID] = None,
        provider_id: Optional[UUID] = None,
        facility_id: Optional[UUID] = None,
        date_from: Optional[datetime] = None,
        date_to: Optional[datetime] = None,
        limit: int = 50,
        offset: int = 0
    ) -> OrderListResponse:
        """List orders with filtering and pagination."""
        query = self.db.query(Order).options(
            joinedload(Order.patient),
            joinedload(Order.provider),
            joinedload(Order.ivr_request)
        )

        # Apply organization filter
        query = query.filter(Order.organization_id == current_user.organization_id)

        # Apply role-based filtering
        if current_user.role in ["doctor", "office_admin", "medical_staff"]:
            # Doctors and their staff see only their orders
            query = query.filter(Order.provider_id == current_user.id)

        # Apply filters
        if status_filter:
            query = query.filter(Order.status == status_filter)
        if patient_id:
            query = query.filter(Order.patient_id == patient_id)
        if provider_id:
            query = query.filter(Order.provider_id == provider_id)
        if date_from:
            query = query.filter(Order.created_at >= date_from)
        if date_to:
            query = query.filter(Order.created_at <= date_to)

        # Get total count
        total = query.count()

        # Apply pagination and ordering
        orders = query.order_by(desc(Order.created_at)).offset(offset).limit(limit).all()

        # Build response
        order_responses = []
        for order in orders:
            order_responses.append(await self._build_order_response(order))

        return OrderListResponse(
            items=order_responses,
            total=total,
            limit=limit,
            offset=offset
        )

    async def update_order_status(
        self,
        order_id: UUID,
        status_update: OrderStatusUpdate,
        current_user: TokenData
    ) -> OrderResponse:
        """Update order status with validation and audit trail."""
        order = self.db.query(Order).filter(Order.id == order_id).first()
        if not order:
            raise NotFoundException("Order not found")

        # Check access permissions
        await self._check_order_access(order, current_user)

        # Validate status transition
        await self._validate_status_transition(order.status, status_update.status)

        old_status = order.status

        # Update order status and timestamps
        order.status = status_update.status
        if status_update.status == "processing":
            order.processed_at = datetime.utcnow()
        elif status_update.status == "shipped":
            order.shipped_at = datetime.utcnow()
        elif status_update.status == "received":
            order.received_at = datetime.utcnow()
            order.received_by = current_user.id
        elif status_update.status == "completed":
            order.completion_date = datetime.utcnow()

        # Create status history
        status_history = OrderStatusHistory(
            order=order,
            from_status=old_status,
            to_status=status_update.status,
            changed_by_id=current_user.id,
            reason=status_update.reason or f"Status updated to {status_update.status}"
        )
        self.db.add(status_history)

        self.db.commit()
        self.db.refresh(order)

        # Audit log
        self.audit_service.log_phi_access(
            access_type="update",
            resource_type="order",
            resource_id=str(order.id),
            reason=f"Order status updated from {old_status} to {status_update.status}",
            details={
                "order_number": order.order_number,
                "from_status": old_status,
                "to_status": status_update.status,
                "reason": status_update.reason
            }
        )

        return await self._build_order_response(order)

    async def upload_document(
        self,
        order_id: UUID,
        document_data: OrderDocumentCreate,
        current_user: TokenData
    ) -> OrderDocumentResponse:
        """Upload document for order (shipping label, tracking, POD, etc.)."""
        order = self.db.query(Order).filter(Order.id == order_id).first()
        if not order:
            raise NotFoundException("Order not found")

        # Check access permissions
        await self._check_order_access(order, current_user)

        # Create document record
        document = OrderDocument(
            order_id=order_id,
            document_type=document_data.document_type,
            document_key=document_data.document_key,
            original_filename=document_data.original_filename,
            uploaded_by_id=current_user.id,
            status="pending"
        )
        self.db.add(document)
        self.db.commit()
        self.db.refresh(document)

        # Audit log
        self.audit_service.log_phi_access(
            access_type="create",
            resource_type="order_document",
            resource_id=str(document.id),
            reason=f"Document uploaded for order {order.order_number}",
            details={
                "order_id": str(order_id),
                "order_number": order.order_number,
                "document_type": document_data.document_type,
                "filename": document_data.original_filename
            }
        )

        return OrderDocumentResponse(
            id=document.id,
            order_id=document.order_id,
            document_type=document.document_type,
            document_key=document.document_key,
            original_filename=document.original_filename,
            uploaded_by_id=document.uploaded_by_id,
            status=document.status,
            created_at=document.created_at,
            updated_at=document.updated_at
        )

    async def create_reorder(
        self,
        order_id: UUID,
        reorder_data: ReorderCreate,
        current_user: TokenData
    ) -> OrderResponse:
        """Create re-order (only if original never received)."""
        original_order = self.db.query(Order).filter(Order.id == order_id).first()
        if not original_order:
            raise NotFoundException("Original order not found")

        # Check access permissions
        await self._check_order_access(original_order, current_user)

        # Validate re-order conditions
        if original_order.status == "received":
            raise ValidationError(
                "Cannot re-order: original order was already received"
            )

        if original_order.status not in ["shipped", "cancelled"]:
            raise ValidationError(
                "Can only re-order shipped or cancelled orders that were never received"
            )

        # Generate new order number
        order_number = self._generate_order_number()

        # Create re-order
        reorder = Order(
            order_number=order_number,
            organization_id=original_order.organization_id,
            patient_id=original_order.patient_id,
            provider_id=original_order.provider_id,
            created_by_id=current_user.id,
            ivr_request_id=original_order.ivr_request_id,
            shipping_address=reorder_data.shipping_address or original_order.shipping_address,
            products=original_order.products,
            status="pending",
            order_type=original_order.order_type,
            priority=original_order.priority,
            processed_at=datetime.utcnow(),
            notes=f"Re-order of {original_order.order_number}. Reason: {reorder_data.reason}"
        )
        reorder.total_amount = original_order.total_amount

        self.db.add(reorder)

        # Create initial status history
        status_history = OrderStatusHistory(
            order=reorder,
            from_status=None,
            to_status="pending",
            changed_by_id=current_user.id,
            reason=f"Re-order created. Original order: {original_order.order_number}"
        )
        self.db.add(status_history)

        self.db.commit()
        self.db.refresh(reorder)

        # Audit log
        self.audit_service.log_phi_access(
            access_type="create",
            resource_type="order",
            resource_id=str(reorder.id),
            reason=f"Re-order created from {original_order.order_number}",
            details={
                "new_order_number": reorder.order_number,
                "original_order_id": str(order_id),
                "original_order_number": original_order.order_number,
                "reason": reorder_data.reason
            }
        )

        return await self._build_order_response(reorder)

    async def _build_order_response(self, order: Order) -> OrderResponse:
        """Build comprehensive order response."""
        # Get related data if not already loaded
        if not hasattr(order, 'patient') or order.patient is None:
            order = self.db.query(Order).options(
                joinedload(Order.patient),
                joinedload(Order.provider),
                joinedload(Order.ivr_request),
                joinedload(Order.status_history),
                joinedload(Order.documents),
                joinedload(Order.created_by),
                joinedload(Order.received_by_user)
            ).filter(Order.id == order.id).first()

        return OrderResponse(
            id=order.id,
            order_number=order.order_number,
            organization_id=order.organization_id,
            patient_id=order.patient_id,
            patient_name=f"{order.patient.first_name} {order.patient.last_name}",
            provider_id=order.provider_id,
            provider_name=order.provider.name,
            ivr_request_id=order.ivr_request_id,
            status=order.status,
            order_type=order.order_type,
            priority=order.priority,
            shipping_address=order.shipping_address,
            products=order.products,
            total_amount=order.total_amount,
            notes=order.notes,
            processed_at=order.processed_at,
            shipped_at=order.shipped_at,
            received_at=order.received_at,
            received_by=order.received_by,
            completion_date=order.completion_date,
            created_at=order.created_at,
            updated_at=order.updated_at,
            status_history=[
                {
                    "from_status": h.from_status,
                    "to_status": h.to_status,
                    "changed_by_id": h.changed_by_id,
                    "reason": h.reason,
                    "created_at": h.created_at
                }
                for h in order.status_history
            ],
            documents=[
                OrderDocumentResponse(
                    id=doc.id,
                    order_id=doc.order_id,
                    document_type=doc.document_type,
                    document_key=doc.document_key,
                    original_filename=doc.original_filename,
                    uploaded_by_id=doc.uploaded_by_id,
                    status=doc.status,
                    created_at=doc.created_at,
                    updated_at=doc.updated_at
                )
                for doc in order.documents
            ]
        )

    async def _check_order_access(self, order: Order, current_user: TokenData):
        """Check if user has access to order."""
        # Organization check
        if order.organization_id != current_user.organization_id:
            raise UnauthorizedError("Access denied: different organization")

        # Role-based access
        if current_user.role in ["doctor", "office_admin", "medical_staff"]:
            if order.provider_id != current_user.id:
                raise UnauthorizedError("Access denied: not your order")

        # System admins and logistics can access all orders
        if current_user.role in ["system_admin", "chp_admin", "shipping_logistics"]:
            return

    async def _validate_status_transition(self, current_status: str, new_status: str):
        """Validate order status transitions."""
        valid_transitions = {
            "pending": ["processing", "cancelled"],
            "processing": ["shipped", "cancelled"],
            "shipped": ["received", "cancelled"],
            "received": ["completed"],
            "completed": [],
            "cancelled": []
        }

        if new_status not in valid_transitions.get(current_status, []):
            raise ValidationError(
                f"Invalid status transition from {current_status} to {new_status}"
            )

    def _generate_order_number(self) -> str:
        """Generate unique order number."""
        timestamp = datetime.utcnow().strftime("%Y%m%d")
        unique_id = str(uuid4()).replace("-", "")[:8].upper()
        return f"ORD-{timestamp}-{unique_id}"
