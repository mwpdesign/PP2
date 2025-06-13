"""
Treatment tracking API module.

This module provides the treatment tracking functionality including:
- TreatmentRecord model for storing treatment data
- TreatmentService for business logic
- API routes for treatment management (to be added in Step 4)
"""

from .models import TreatmentRecord
from .service import TreatmentService
from .routes import router

__all__ = [
    "TreatmentRecord",
    "TreatmentService",
    "router",
]