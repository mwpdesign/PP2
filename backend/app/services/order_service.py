"""
Order management service with HIPAA-compliant processing.
"""
from datetime import datetime
from typing import List, Dict, Optional, Any
from uuid import UUID, uuid4
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from fastapi import HTTPException

from app.api.orders.models import (
    Order, OrderItem, OrderStatus, OrderApproval
)
from app.api.orders.schemas import (
    OrderCreate, OrderUpdate, OrderItemCreate, OrderItemUpdate,
    OrderStatusCreate, OrderApprovalCreate, OrderApprovalUpdate,
    OrderSearchParams
)
from app.services.insurance_verification import InsuranceVerificationService
from app.services.inventory_service import InventoryService
from app.services.shipping_service import ShippingService, Package, Address
from app.services.ivr_service import IVRService
from app.core.security import verify_territory_access
from app.core.exceptions import (
    NotFoundException, ValidationError, UnauthorizedError
)


class OrderService:
    """Service for managing orders with HIPAA compliance."""

    def __init__(self, db: Session, current_user: Dict[str, Any]):
        """Initialize order service with dependencies."""
        self.db = db
        self.current_user = current_user
        self.insurance_service = InsuranceVerificationService()
        self.inventory_service = InventoryService(db)
        self.shipping_service = ShippingService()
        self.ivr_service = IVRService(db)

    async def create_order_from_ivr(self, ivr_session_id: UUID) -> Order:
        """Create a new order from an approved IVR session."""
        # Validate IVR session
        ivr_session = await self.ivr_service.get_session(ivr_session_id)
        if not ivr_session:
            raise NotFoundException("IVR session not found")
        
        if ivr_session.status != 'approved':
            raise ValidationError(
                "Cannot create order from unapproved IVR session"
            )

        # Create order data from IVR session
        order_data = OrderCreate(
            patient_id=ivr_session.patient_id,
            provider_id=ivr_session.provider_id,
            territory_id=ivr_session.territory_id,
            ivr_session_id=ivr_session_id,
            notes=f"Order created from IVR session {ivr_session_id}",
            insurance_data=ivr_session.insurance_data,
            items=[
                OrderItemCreate(
                    product_id=item.product_id,
                    quantity=item.quantity,
                    notes=item.notes,
                    insurance_coverage=item.insurance_coverage
                ) for item in ivr_session.items
            ]
        )

        # Create the order
        return await self.create_order(order_data)

    async def create_order(self, order_data: OrderCreate) -> Order:
        """Create a new order with items."""
        # Verify territory access
        if not verify_territory_access(
            self.current_user,
            order_data.territory_id
        ):
            raise UnauthorizedError(
                "No access to specified territory"
            )

        # Generate unique order number
        order_number = (
            f"ORD-{datetime.utcnow().strftime('%Y%m%d')}-"
            f"{uuid4().hex[:8]}"
        )

        # Create order
        order = Order(
            order_number=order_number,
            patient_id=order_data.patient_id,
            provider_id=order_data.provider_id,
            territory_id=order_data.territory_id,
            ivr_session_id=order_data.ivr_session_id,
            notes=order_data.notes,
            insurance_data=order_data.insurance_data,
            payment_info=order_data.payment_info,
            delivery_info=order_data.delivery_info
        )
        self.db.add(order)

        # Create order items
        total_amount = 0.0
        for item_data in order_data.items:
            # Verify product availability
            if not await self.inventory_service.check_availability(
                item_data.product_id,
                order_data.territory_id,
                item_data.quantity
            ):
                raise ValidationError(
                    f"Product {item_data.product_id} not available "
                    f"in requested quantity"
                )

            # Get product pricing
            product_price = await self.inventory_service.get_product_price(
                item_data.product_id,
                order_data.territory_id
            )

            # Create order item
            item = OrderItem(
                order=order,
                product_id=item_data.product_id,
                quantity=item_data.quantity,
                unit_price=product_price,
                total_price=product_price * item_data.quantity,
                insurance_coverage=item_data.insurance_coverage,
                notes=item_data.notes
            )
            self.db.add(item)
            total_amount += item.total_price

        # Update order total
        order.total_amount = total_amount

        # Create initial status
        status = OrderStatus(
            order=order,
            status='pending',
            changed_by=self.current_user['id'],
            reason="Order created",
            metadata={'created_by': self.current_user['id']}
        )
        self.db.add(status)

        # Create required approvals
        approvals = [
            OrderApproval(
                order=order,
                approver_id=order_data.provider_id,
                approval_type='provider'
            ),
            OrderApproval(
                order=order,
                approver_id=self.current_user['id'],
                approval_type='pharmacy'
            )
        ]
        self.db.add_all(approvals)

        # Commit transaction
        try:
            self.db.commit()
            self.db.refresh(order)
            return order
        except Exception as e:
            self.db.rollback()
            raise HTTPException(
                status_code=500,
                detail=f"Failed to create order: {str(e)}"
            )

    async def update_order(
        self,
        order_id: UUID,
        order_data: OrderUpdate
    ) -> Order:
        """Update an existing order."""
        # Get order
        order = self.db.query(Order).filter(Order.id == order_id).first()
        if not order:
            raise NotFoundException("Order not found")

        # Verify territory access
        if not verify_territory_access(
            self.current_user,
            order.territory_id
        ):
            raise UnauthorizedError("No access to order's territory")

        # Update fields
        if order_data.notes is not None:
            order.notes = order_data.notes
        if order_data.insurance_data is not None:
            order.insurance_data = order_data.insurance_data
        if order_data.payment_info is not None:
            order.payment_info = order_data.payment_info
        if order_data.delivery_info is not None:
            order.delivery_info = order_data.delivery_info

        # Update status if provided
        if order_data.status:
            await self.update_order_status(
                order_id,
                OrderStatusCreate(
                    status=order_data.status,
                    reason="Status updated via order update"
                )
            )

        # Commit changes
        try:
            self.db.commit()
            self.db.refresh(order)
            return order
        except Exception as e:
            self.db.rollback()
            raise HTTPException(
                status_code=500,
                detail=f"Failed to update order: {str(e)}"
            )

    async def update_order_status(
        self,
        order_id: UUID,
        status_data: OrderStatusCreate
    ) -> OrderStatus:
        """Update order status with audit trail."""
        # Get order
        order = self.db.query(Order).filter(Order.id == order_id).first()
        if not order:
            raise NotFoundException("Order not found")

        # Verify territory access
        if not verify_territory_access(
            self.current_user,
            order.territory_id
        ):
            raise UnauthorizedError("No access to order's territory")

        # Validate status transition
        await self._validate_status_transition(order, status_data.status)

        # Create status history entry
        status = OrderStatus(
            order=order,
            status=status_data.status,
            changed_by=self.current_user['id'],
            reason=status_data.reason,
            metadata=status_data.metadata
        )
        self.db.add(status)

        # Update order status
        order.status = status_data.status

        # Handle status-specific actions
        await self._handle_status_change(order, status_data.status)

        # Commit changes
        try:
            self.db.commit()
            self.db.refresh(status)
            return status
        except Exception as e:
            self.db.rollback()
            raise HTTPException(
                status_code=500,
                detail=f"Failed to update order status: {str(e)}"
            )

    async def update_order_approval(
        self,
        order_id: UUID,
        approval_id: UUID,
        approval_data: OrderApprovalUpdate
    ) -> OrderApproval:
        """Update order approval status."""
        # Get approval
        approval = self.db.query(OrderApproval).filter(
            and_(
                OrderApproval.id == approval_id,
                OrderApproval.order_id == order_id
            )
        ).first()
        if not approval:
            raise NotFoundException("Approval not found")

        # Verify territory access
        order = approval.order
        if not verify_territory_access(
            self.current_user,
            order.territory_id
        ):
            raise UnauthorizedError(
                "No access to order's territory"
            )

        # Verify approver
        if approval.approver_id != self.current_user['id']:
            raise UnauthorizedError(
                "Not authorized to approve/reject"
            )

        # Update approval
        approval.status = approval_data.status
        approval.notes = approval_data.notes
        approval.metadata = approval_data.metadata

        # Check if all approvals are complete
        if approval_data.status == 'approved':
            await self._check_all_approvals(order)

        # Commit changes
        try:
            self.db.commit()
            self.db.refresh(approval)
            return approval
        except Exception as e:
            self.db.rollback()
            raise HTTPException(
                status_code=500,
                detail=f"Failed to update approval: {str(e)}"
            )

    async def search_orders(
        self,
        search_params: OrderSearchParams
    ) -> Dict[str, Any]:
        """Search orders with filtering and pagination."""
        # Base query
        query = self.db.query(Order)

        # Apply territory access filter
        if search_params.territory_id:
            if not verify_territory_access(
                self.current_user,
                search_params.territory_id
            ):
                raise UnauthorizedError("No access to specified territory")
            query = query.filter(Order.territory_id == search_params.territory_id)

        # Apply other filters
        if search_params.patient_id:
            query = query.filter(Order.patient_id == search_params.patient_id)
        if search_params.provider_id:
            query = query.filter(Order.provider_id == search_params.provider_id)
        if search_params.status:
            query = query.filter(Order.status == search_params.status)
        if search_params.order_number:
            query = query.filter(
                Order.order_number.ilike(f"%{search_params.order_number}%")
            )
        if search_params.date_from:
            query = query.filter(Order.order_date >= search_params.date_from)
        if search_params.date_to:
            query = query.filter(Order.order_date <= search_params.date_to)

        # Get total count
        total = query.count()

        # Apply sorting
        if search_params.sort_order == 'desc':
            query = query.order_by(
                getattr(Order, search_params.sort_by).desc()
            )
        else:
            query = query.order_by(
                getattr(Order, search_params.sort_by).asc()
            )

        # Apply pagination
        query = query.offset(search_params.skip).limit(search_params.limit)

        # Execute query
        orders = query.all()

        return {
            'items': orders,
            'total': total,
            'skip': search_params.skip,
            'limit': search_params.limit
        }

    async def _validate_status_transition(
        self,
        order: Order,
        new_status: str
    ) -> None:
        """Validate if status transition is allowed."""
        valid_transitions = {
            'pending': ['verified', 'cancelled'],
            'verified': ['approved', 'cancelled'],
            'approved': ['processing', 'cancelled'],
            'processing': ['completed', 'cancelled'],
            'completed': [],
            'cancelled': []
        }

        if new_status not in valid_transitions.get(order.status, []):
            raise ValidationError(
                f"Invalid status transition from {order.status} to {new_status}"
            )

    async def _handle_status_change(
        self,
        order: Order,
        new_status: str
    ) -> None:
        """Handle side effects of status changes."""
        if new_status == 'verified':
            # Verify insurance coverage
            await self._verify_insurance(order)
        elif new_status == 'approved':
            # Reserve inventory and create shipping label
            await self._reserve_inventory(order)
            await self._create_shipping_label(order)
        elif new_status == 'completed':
            # Update inventory and mark completion
            await self._complete_order(order)
        elif new_status == 'cancelled':
            # Release inventory and handle cancellation
            await self._cancel_order(order)

    async def _verify_insurance(self, order: Order) -> None:
        """Verify insurance coverage for order."""
        if not order.insurance_data:
            return

        # Verify insurance for each item
        for item in order.items:
            verification = await self.insurance_service.verify_coverage(
                order.insurance_data,
                item.product_id,
                item.quantity,
                self.current_user['id'],
                order.territory_id
            )

            if verification['status'] != 'verified':
                error_msg = verification.get('error', 'Unknown error')
                raise ValidationError(
                    f"Insurance verification failed for item "
                    f"{item.product_id}: {error_msg}"
                )

            # Update item with coverage details
            item.insurance_coverage = verification['coverage']

    async def _reserve_inventory(self, order: Order) -> None:
        """Reserve inventory for order items."""
        for item in order.items:
            success = await self.inventory_service.reserve_inventory(
                item.product_id,
                order.territory_id,
                item.quantity,
                order.id
            )
            if not success:
                raise ValidationError(
                    f"Failed to reserve inventory for product {item.product_id}"
                )

    async def _complete_order(self, order: Order) -> None:
        """Handle order completion."""
        # Update inventory
        for item in order.items:
            await self.inventory_service.complete_reservation(
                item.product_id,
                order.territory_id,
                item.quantity,
                order.id
            )

        # Set completion date
        order.completion_date = datetime.utcnow()

    async def _cancel_order(self, order: Order) -> None:
        """Handle order cancellation."""
        # Release reserved inventory
        for item in order.items:
            await self.inventory_service.release_reservation(
                item.product_id,
                order.territory_id,
                item.quantity,
                order.id
            )

    async def _check_all_approvals(self, order: Order) -> None:
        """Check if all approvals are complete and update order status."""
        pending_approvals = [
            a for a in order.approvals if a.status == 'pending'
        ]

        if not pending_approvals:
            # All approvals complete, move to processing
            await self.update_order_status(
                order.id,
                OrderStatusCreate(
                    status='processing',
                    reason="All approvals completed"
                )
            )

    async def _create_shipping_label(self, order: Order) -> None:
        """Create shipping label for order."""
        if not order.delivery_info:
            raise ValidationError("Delivery information required")

        try:
            # Create package information
            package = Package(
                type='box',
                # Estimated weight
                weight=sum(item.quantity * 0.5 for item in order.items),
                requires_signature=True,
                is_temperature_controlled=any(
                    item.product.requires_temperature_control 
                    for item in order.items
                )
            )

            # Get shipping rates
            rates = await self.shipping_service.get_rates(
                from_address=Address(
                    **order.delivery_info['from_address']
                ),
                to_address=Address(
                    **order.delivery_info['to_address']
                ),
                package=package
            )

            # Select best rate
            best_rate = min(rates, key=lambda x: x.rate)

            # Create shipping label
            label = await self.shipping_service.create_label(
                from_address=Address(
                    **order.delivery_info['from_address']
                ),
                to_address=Address(
                    **order.delivery_info['to_address']
                ),
                package=package,
                service_type=best_rate.service_type,
                carrier=best_rate.carrier,
                reference=order.order_number
            )

            # Update order with shipping information
            order.shipping_info = {
                'carrier': label.carrier,
                'tracking_number': label.tracking_number,
                'label_url': label.label_url,
                'rate': best_rate.rate,
                'service_type': best_rate.service_type
            }

        except Exception as e:
            raise ValidationError(
                f"Failed to create shipping label: {str(e)}"
            ) 