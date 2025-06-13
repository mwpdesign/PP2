"""
Treatment Service for managing treatment record business logic.

This service handles the creation, retrieval, and management of treatment
records with proper validation, permissions, and inventory calculations.
"""

import logging
from datetime import date, datetime
from typing import List, Optional, Dict, Any
from uuid import UUID
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import desc, func, and_

from app.api.treatments.models import TreatmentRecord
from app.models.patient import Patient
from app.models.order import Order
from app.models.user import User
from app.core.exceptions import (
    NotFoundException, ValidationError, AuthorizationError
)

logger = logging.getLogger(__name__)


class TreatmentService:
    """Service class for managing treatment records with business logic."""

    def __init__(self, db: Session):
        """Initialize the treatment service with database session."""
        self.db = db

    def create_treatment_record(
        self,
        user_id: UUID,
        patient_id: UUID,
        order_id: UUID,
        treatment_data: Dict[str, Any]
    ) -> TreatmentRecord:
        """
        Create a new treatment record with validation.

        Args:
            user_id: ID of the user recording the treatment
            patient_id: ID of the patient receiving treatment
            order_id: ID of the order containing the products used
            treatment_data: Dictionary containing treatment information

        Returns:
            TreatmentRecord: The created treatment record

        Raises:
            NotFoundException: If patient, order, or user not found
            ValidationError: If order doesn't belong to patient or validation
                fails
            AuthorizationError: If user doesn't have permission to record
                treatments
        """
        # Verify user exists and has permission
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            raise NotFoundException(f"User with ID {user_id} not found")

        # Check if user has permission to record treatments
        if not self._user_can_record_treatments(user):
            raise AuthorizationError(
                f"User {user.username} does not have permission to record "
                f"treatments"
            )

        # Verify patient exists
        patient = self.db.query(Patient).filter(Patient.id == patient_id).first()
        if not patient:
            raise NotFoundException(f"Patient with ID {patient_id} not found")

        # Verify order exists and belongs to the patient
        order = self.db.query(Order).filter(
            and_(Order.id == order_id, Order.patient_id == patient_id)
        ).first()
        if not order:
            raise NotFoundException(
                f"Order with ID {order_id} not found for patient "
                f"{patient_id}"
            )

        # Validate order status allows treatment recording
        if order.status not in ["received", "completed"]:
            raise ValidationError(
                f"Cannot record treatment for order with status '{order.status}'. "
                "Order must be 'received' or 'completed'"
            )

        # Validate required treatment data
        required_fields = ["product_id", "product_name", "quantity_used", "date_applied"]
        for field in required_fields:
            if field not in treatment_data or not treatment_data[field]:
                raise ValidationError(f"Required field '{field}' is missing or empty")

        # Validate quantity_used is positive
        quantity_used = treatment_data.get("quantity_used")
        if not isinstance(quantity_used, int) or quantity_used <= 0:
            raise ValidationError("Quantity used must be a positive integer")

        # Validate date_applied is not in the future
        date_applied = treatment_data.get("date_applied")
        if isinstance(date_applied, str):
            try:
                date_applied = datetime.fromisoformat(date_applied).date()
            except ValueError:
                raise ValidationError("Invalid date format for date_applied")

        if isinstance(date_applied, date) and date_applied > date.today():
            raise ValidationError("Treatment date cannot be in the future")

        # Check if sufficient inventory is available (if order has product data)
        self._validate_inventory_availability(order, treatment_data)

        # Create treatment record
        treatment_record = TreatmentRecord(
            patient_id=patient_id,
            order_id=order_id,
            recorded_by=user_id,
            product_id=treatment_data["product_id"],
            product_name=treatment_data["product_name"],
            quantity_used=quantity_used,
            date_applied=date_applied,
            diagnosis=treatment_data.get("diagnosis"),
            procedure_performed=treatment_data.get("procedure_performed"),
            wound_location=treatment_data.get("wound_location"),
            doctor_notes=treatment_data.get("doctor_notes")
        )

        self.db.add(treatment_record)
        # Note: Not committing here - let the route handler manage transactions

        logger.info(
            f"Treatment record created for patient {patient_id}, "
            f"product {treatment_data['product_id']}, "
            f"quantity {quantity_used}"
        )

        return treatment_record

    def get_treatments_by_patient(
        self,
        patient_id: UUID,
        limit: Optional[int] = None,
        offset: Optional[int] = 0
    ) -> List[TreatmentRecord]:
        """
        Get all treatment records for a specific patient.

        Args:
            patient_id: ID of the patient
            limit: Maximum number of records to return
            offset: Number of records to skip

        Returns:
            List[TreatmentRecord]: List of treatment records sorted by date (most recent first)

        Raises:
            NotFoundException: If patient not found
        """
        # Verify patient exists
        patient = self.db.query(Patient).filter(Patient.id == patient_id).first()
        if not patient:
            raise NotFoundException(f"Patient with ID {patient_id} not found")

        # Build query with eager loading
        query = self.db.query(TreatmentRecord).options(
            joinedload(TreatmentRecord.order),
            joinedload(TreatmentRecord.recorded_by_user)
        ).filter(TreatmentRecord.patient_id == patient_id)

        # Sort by date applied (most recent first), then by created_at
        query = query.order_by(
            desc(TreatmentRecord.date_applied),
            desc(TreatmentRecord.created_at)
        )

        # Apply pagination
        if offset:
            query = query.offset(offset)
        if limit:
            query = query.limit(limit)

        treatments = query.all()

        logger.info(f"Retrieved {len(treatments)} treatment records for patient {patient_id}")
        return treatments

    def get_treatments_by_order(
        self,
        order_id: UUID,
        limit: Optional[int] = None,
        offset: Optional[int] = 0
    ) -> List[TreatmentRecord]:
        """
        Get all treatment records for a specific order.

        Args:
            order_id: ID of the order
            limit: Maximum number of records to return
            offset: Number of records to skip

        Returns:
            List[TreatmentRecord]: List of treatment records sorted by date (most recent first)

        Raises:
            NotFoundException: If order not found
        """
        # Verify order exists
        order = self.db.query(Order).filter(Order.id == order_id).first()
        if not order:
            raise NotFoundException(f"Order with ID {order_id} not found")

        # Build query with eager loading
        query = self.db.query(TreatmentRecord).options(
            joinedload(TreatmentRecord.patient),
            joinedload(TreatmentRecord.recorded_by_user)
        ).filter(TreatmentRecord.order_id == order_id)

        # Sort by date applied (most recent first), then by created_at
        query = query.order_by(
            desc(TreatmentRecord.date_applied),
            desc(TreatmentRecord.created_at)
        )

        # Apply pagination
        if offset:
            query = query.offset(offset)
        if limit:
            query = query.limit(limit)

        treatments = query.all()

        logger.info(f"Retrieved {len(treatments)} treatment records for order {order_id}")
        return treatments

    def get_patient_inventory_summary(self, patient_id: UUID) -> Dict[str, Any]:
        """
        Get inventory summary for a patient showing products on hand.

        Args:
            patient_id: ID of the patient

        Returns:
            Dict[str, Any]: Inventory summary with products and remaining quantities

        Raises:
            NotFoundException: If patient not found
        """
        # Verify patient exists
        patient = self.db.query(Patient).filter(Patient.id == patient_id).first()
        if not patient:
            raise NotFoundException(f"Patient with ID {patient_id} not found")

        # Get all orders for this patient that have been received/completed
        orders = self.db.query(Order).filter(
            and_(
                Order.patient_id == patient_id,
                Order.status.in_(["received", "completed"])
            )
        ).all()

        # Get all treatments for this patient
        treatments = self.db.query(TreatmentRecord).filter(
            TreatmentRecord.patient_id == patient_id
        ).all()

        # Calculate inventory by product
        inventory_summary = {}

        # Add ordered quantities
        for order in orders:
            if order.products and isinstance(order.products, dict):
                items = order.products.get("items", [])
                for item in items:
                    product_id = item.get("q_code") or item.get("product_name", "unknown")
                    product_name = item.get("product_name", "Unknown Product")
                    total_quantity = item.get("total_quantity", 0)

                    if product_id not in inventory_summary:
                        inventory_summary[product_id] = {
                            "product_id": product_id,
                            "product_name": product_name,
                            "ordered_quantity": 0,
                            "used_quantity": 0,
                            "remaining_quantity": 0,
                            "orders": [],
                            "treatments": []
                        }

                    inventory_summary[product_id]["ordered_quantity"] += total_quantity
                    inventory_summary[product_id]["orders"].append({
                        "order_id": str(order.id),
                        "order_number": order.order_number,
                        "quantity": total_quantity,
                        "received_at": order.received_at.isoformat() if order.received_at else None
                    })

        # Subtract used quantities
        for treatment in treatments:
            product_id = treatment.product_id

            if product_id not in inventory_summary:
                # Treatment for product not in orders (edge case)
                inventory_summary[product_id] = {
                    "product_id": product_id,
                    "product_name": treatment.product_name,
                    "ordered_quantity": 0,
                    "used_quantity": 0,
                    "remaining_quantity": 0,
                    "orders": [],
                    "treatments": []
                }

            inventory_summary[product_id]["used_quantity"] += treatment.quantity_used
            inventory_summary[product_id]["treatments"].append({
                "treatment_id": str(treatment.id),
                "quantity_used": treatment.quantity_used,
                "date_applied": treatment.date_applied.isoformat(),
                "recorded_by": treatment.recorded_by_user.full_name if hasattr(treatment, 'recorded_by_user') and treatment.recorded_by_user else "Unknown"
            })

        # Calculate remaining quantities
        for product_data in inventory_summary.values():
            product_data["remaining_quantity"] = max(
                0,
                product_data["ordered_quantity"] - product_data["used_quantity"]
            )

        # Convert to list and sort by product name
        inventory_list = list(inventory_summary.values())
        inventory_list.sort(key=lambda x: x["product_name"])

        summary = {
            "patient_id": str(patient_id),
            "patient_name": f"{patient.first_name} {patient.last_name}",
            "total_products": len(inventory_list),
            "products_with_remaining_inventory": len([p for p in inventory_list if p["remaining_quantity"] > 0]),
            "products": inventory_list,
            "generated_at": datetime.utcnow().isoformat()
        }

        logger.info(f"Generated inventory summary for patient {patient_id}: {len(inventory_list)} products")
        return summary

    def get_treatment_by_id(self, treatment_id: UUID) -> TreatmentRecord:
        """
        Get a specific treatment record by ID.

        Args:
            treatment_id: ID of the treatment record

        Returns:
            TreatmentRecord: The treatment record with related data

        Raises:
            NotFoundException: If treatment record not found
        """
        treatment = self.db.query(TreatmentRecord).options(
            joinedload(TreatmentRecord.patient),
            joinedload(TreatmentRecord.order),
            joinedload(TreatmentRecord.recorded_by_user)
        ).filter(TreatmentRecord.id == treatment_id).first()

        if not treatment:
            raise NotFoundException(f"Treatment record with ID {treatment_id} not found")

        logger.info(f"Retrieved treatment record {treatment_id}")
        return treatment

    def _user_can_record_treatments(self, user: User) -> bool:
        """
        Check if user has permission to record treatments.

        Args:
            user: User object to check permissions for

        Returns:
            bool: True if user can record treatments, False otherwise
        """
        # Check user role - doctors, medical staff, and office admins can record treatments
        if hasattr(user, 'role') and user.role:
            allowed_roles = ["doctor", "medical_staff", "office_admin", "healthcare_provider"]
            if user.role.name.lower() in allowed_roles:
                return True

        # Check if user is active
        if not user.is_active:
            return False

        # Additional permission checks can be added here
        # For now, allow active users with appropriate roles
        return True

    def _validate_inventory_availability(
        self,
        order: Order,
        treatment_data: Dict[str, Any]
    ) -> None:
        """
        Validate that sufficient inventory is available for the treatment.

        Args:
            order: Order containing the products
            treatment_data: Treatment data including product_id and quantity_used

        Raises:
            ValidationError: If insufficient inventory is available
        """
        product_id = treatment_data["product_id"]
        quantity_needed = treatment_data["quantity_used"]

        # Check if order has product data
        if not order.products or not isinstance(order.products, dict):
            logger.warning(f"Order {order.id} has no product data for inventory validation")
            return

        # Find the product in the order
        items = order.products.get("items", [])
        product_found = False

        for item in items:
            item_product_id = item.get("q_code") or item.get("product_name")
            if item_product_id == product_id:
                product_found = True
                ordered_quantity = item.get("total_quantity", 0)

                # Get total already used for this product from this order
                used_query = self.db.query(func.sum(TreatmentRecord.quantity_used)).filter(
                    and_(
                        TreatmentRecord.order_id == order.id,
                        TreatmentRecord.product_id == product_id
                    )
                )
                total_used = used_query.scalar() or 0

                remaining = ordered_quantity - total_used

                if quantity_needed > remaining:
                    raise ValidationError(
                        f"Insufficient inventory for product {product_id}. "
                        f"Ordered: {ordered_quantity}, Used: {total_used}, "
                        f"Remaining: {remaining}, Requested: {quantity_needed}"
                    )
                break

        if not product_found:
            raise ValidationError(
                f"Product {product_id} not found in order {order.order_number}"
            )