from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID

from app.models.verification import Verification
from app.schemas.verification import (
    VerificationCreate,
    VerificationUpdate,
    Verification as VerificationSchema
)


class VerificationService:
    """Service for insurance verification operations."""
    
    def __init__(self, db: AsyncSession):
        """Initialize service with database session."""
        self.db = db

    async def create_verification_request(
        self,
        request_data: VerificationCreate,
        created_by_id: UUID
    ) -> VerificationSchema:
        """Create a new verification request."""
        db_verification = Verification(
            patient_id=request_data.patient_id,
            provider_id=request_data.provider_id,
            insurance_id=request_data.insurance_id,
            insurance_group=request_data.insurance_group,
            status="PENDING",
            notes=request_data.notes,
            created_by_id=created_by_id
        )
        
        self.db.add(db_verification)
        await self.db.commit()
        await self.db.refresh(db_verification)
        
        return VerificationSchema.model_validate(db_verification)

    async def get_verification(
        self,
        verification_id: UUID
    ) -> Optional[VerificationSchema]:
        """Get verification by ID."""
        query = select(Verification).where(Verification.id == verification_id)
        result = await self.db.execute(query)
        verification = result.scalar_one_or_none()
        
        if verification:
            return VerificationSchema.model_validate(verification)
        return None

    async def update_verification(
        self,
        verification_id: UUID,
        update_data: VerificationUpdate
    ) -> Optional[VerificationSchema]:
        """Update verification request."""
        verification = await self.get_verification(verification_id)
        if not verification:
            return None

        query = select(Verification).where(Verification.id == verification_id)
        result = await self.db.execute(query)
        db_verification = result.scalar_one_or_none()
        
        if not db_verification:
            return None

        update_dict = update_data.model_dump(exclude_unset=True)
        for field, value in update_dict.items():
            setattr(db_verification, field, value)

        await self.db.commit()
        await self.db.refresh(db_verification)
        
        return VerificationSchema.model_validate(db_verification)

    async def list_verifications(
        self,
        skip: int = 0,
        limit: int = 100
    ) -> List[VerificationSchema]:
        """List all verifications with pagination."""
        query = select(Verification).offset(skip).limit(limit)
        result = await self.db.execute(query)
        verifications = result.scalars().all()
        
        return [VerificationSchema.model_validate(v) for v in verifications]

    async def delete_verification(self, verification_id: UUID) -> bool:
        """Delete a verification request."""
        query = select(Verification).where(Verification.id == verification_id)
        result = await self.db.execute(query)
        verification = result.scalar_one_or_none()
        
        if not verification:
            return False
            
        await self.db.delete(verification)
        await self.db.commit()
        
        return True 