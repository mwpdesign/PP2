from typing import Dict
from datetime import datetime
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.core.security import encrypt_phi, decrypt_phi
from app.core.config import get_settings
from app.services.audit_service import log_phi_access
from app.api.patients.models import Patient
from app.api.orders.models import Order

settings = get_settings()


class InsuranceVerificationService:
    def __init__(self, db: Session):
        self.db = db

    async def verify_insurance_coverage(
        self,
        order_id: int,
        patient_id: int,
        insurance_data: Dict,
        user_id: int,
        territory_id: int,
    ) -> Dict:
        """
        Verify insurance coverage for an order

        Args:
            order_id: ID of the order being verified
            patient_id: ID of the patient
            insurance_data: Insurance information to verify
            user_id: ID of user performing verification
            territory_id: Territory ID for access control

        Returns:
            Dict containing verification results
        """
        try:
            # Log PHI access
            await log_phi_access(
                user_id=user_id,
                patient_id=patient_id,
                action="insurance_verification",
                territory_id=territory_id,
            )

            # Get and validate patient
            patient = self.db.query(Patient).filter(Patient.id == patient_id).first()
            if not patient:
                raise HTTPException(status_code=404, detail="Patient not found")

            # Verify territory access
            if patient.territory_id != territory_id:
                raise HTTPException(
                    status_code=403, detail="Not authorized for this territory"
                )

            # Perform verification logic here
            # TODO: Integrate with actual insurance provider APIs
            verification_result = {
                "verified": True,  # Placeholder
                "coverage_percent": 80,
                "patient_responsibility": 20,
                "authorization_code": "AUTH123",
                "verification_timestamp": datetime.utcnow().isoformat(),
                "verified_by": user_id,
            }

            # Update order with verification result
            order = self.db.query(Order).filter(Order.id == order_id).first()
            if not order:
                raise HTTPException(status_code=404, detail="Order not found")

            # Encrypt verification result before storing
            order.insurance_verification = encrypt_phi(verification_result)
            order.verification_status = "VERIFIED"
            order.last_verified_at = datetime.utcnow()
            order.verified_by = user_id

            self.db.commit()

            return verification_result

        except Exception:
            # Log error without exposing PHI
            self.db.rollback()
            raise HTTPException(
                status_code=500, detail="Error during insurance verification"
            )

    async def get_verification_status(
        self, order_id: int, user_id: int, territory_id: int
    ) -> Dict:
        """Get the current insurance verification status for an order"""
        try:
            order = self.db.query(Order).filter(Order.id == order_id).first()
            if not order:
                raise HTTPException(status_code=404, detail="Order not found")

            # Verify territory access
            if order.territory_id != territory_id:
                raise HTTPException(
                    status_code=403, detail="Not authorized for this territory"
                )

            # Log PHI access
            await log_phi_access(
                user_id=user_id,
                patient_id=order.patient_id,
                action="view_verification_status",
                territory_id=territory_id,
            )

            if not order.insurance_verification:
                return {
                    "status": "PENDING",
                    "message": "Insurance verification not yet performed",
                }

            # Decrypt verification data
            verification_data = decrypt_phi(order.insurance_verification)

            return {
                "status": order.verification_status,
                "last_verified_at": order.last_verified_at,
                "verified_by": order.verified_by,
                "verification_data": verification_data,
            }

        except Exception:
            raise HTTPException(
                status_code=500, detail="Error retrieving verification status"
            )
