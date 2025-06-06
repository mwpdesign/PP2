"""Template models for wound care IVR forms."""

from datetime import datetime
from typing import Dict, Any
from sqlalchemy import (
    Column, Integer, String, Text, DateTime, JSON, Float, Boolean, ForeignKey
)
from sqlalchemy.orm import relationship

from app.core.database import Base


class WoundCareTemplate(Base):
    """Model for wound care IVR templates."""

    __tablename__ = "wound_care_templates"

    id = Column(String, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    category = Column(String(50), nullable=False, index=True)  # acute, chronic, surgical, diabetic, pressure, venous
    priority = Column(String(20), nullable=False, index=True)  # urgent, high, medium, routine
    estimated_time = Column(String(50), nullable=False)  # "2-3 minutes"

    # Template fields as JSON
    fields = Column(JSON, nullable=False)  # Contains wound_type, location, size, etc.
    icd10_codes = Column(JSON, nullable=False)  # List of ICD-10 codes
    common_supplies = Column(JSON, nullable=False)  # List of common supplies

    # Metadata
    description = Column(Text)
    is_active = Column(Boolean, default=True, nullable=False)
    is_system_template = Column(Boolean, default=True, nullable=False)  # System vs custom templates

    # Usage statistics
    usage_count = Column(Integer, default=0, nullable=False)
    last_used = Column(DateTime)
    average_completion_time = Column(Float)  # in seconds
    success_rate = Column(Float, default=1.0)  # 0.0 to 1.0

    # Audit fields
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    created_by = Column(String, nullable=True)  # User ID who created custom template
    updated_by = Column(String, nullable=True)

    # Relationships
    usage_logs = relationship("TemplateUsageLog", back_populates="template", cascade="all, delete-orphan")

    def to_dict(self) -> Dict[str, Any]:
        """Convert template to dictionary."""
        return {
            "id": self.id,
            "name": self.name,
            "category": self.category,
            "priority": self.priority,
            "estimatedTime": self.estimated_time,
            "fields": self.fields,
            "icd10Codes": self.icd10_codes,
            "commonSupplies": self.common_supplies,
            "description": self.description,
            "isActive": self.is_active,
            "isSystemTemplate": self.is_system_template,
            "usageCount": self.usage_count,
            "lastUsed": self.last_used.isoformat() if self.last_used else None,
            "averageCompletionTime": self.average_completion_time,
            "successRate": self.success_rate,
            "createdAt": self.created_at.isoformat(),
            "updatedAt": self.updated_at.isoformat(),
            "createdBy": self.created_by,
            "updatedBy": self.updated_by
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "WoundCareTemplate":
        """Create template from dictionary."""
        return cls(
            id=data["id"],
            name=data["name"],
            category=data["category"],
            priority=data["priority"],
            estimated_time=data["estimatedTime"],
            fields=data["fields"],
            icd10_codes=data["icd10Codes"],
            common_supplies=data["commonSupplies"],
            description=data.get("description"),
            is_active=data.get("isActive", True),
            is_system_template=data.get("isSystemTemplate", False),
            created_by=data.get("createdBy"),
            updated_by=data.get("updatedBy")
        )


class TemplateUsageLog(Base):
    """Model for tracking template usage analytics."""

    __tablename__ = "template_usage_logs"

    id = Column(Integer, primary_key=True, index=True)
    template_id = Column(String, ForeignKey("wound_care_templates.id"), nullable=False, index=True)

    # Usage context
    user_id = Column(String, nullable=False, index=True)
    patient_id = Column(String, nullable=True, index=True)
    ivr_request_id = Column(String, nullable=True, index=True)
    facility_id = Column(String, nullable=True, index=True)

    # Performance metrics
    completion_time = Column(Float, nullable=True)  # Time to complete form in seconds
    was_successful = Column(Boolean, default=True, nullable=False)
    error_message = Column(Text, nullable=True)

    # Form completion data
    fields_populated = Column(JSON, nullable=True)  # Which fields were populated from template
    fields_modified = Column(JSON, nullable=True)  # Which fields were modified after template application
    final_form_data = Column(JSON, nullable=True)  # Final form state (for analytics)

    # Metadata
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    session_id = Column(String, nullable=True)  # For tracking user sessions
    user_agent = Column(String, nullable=True)
    ip_address = Column(String, nullable=True)

    # Relationships
    template = relationship("WoundCareTemplate", back_populates="usage_logs")

    def to_dict(self) -> Dict[str, Any]:
        """Convert usage log to dictionary."""
        return {
            "id": self.id,
            "templateId": self.template_id,
            "userId": self.user_id,
            "patientId": self.patient_id,
            "ivrRequestId": self.ivr_request_id,
            "facilityId": self.facility_id,
            "completionTime": self.completion_time,
            "wasSuccessful": self.was_successful,
            "errorMessage": self.error_message,
            "fieldsPopulated": self.fields_populated,
            "fieldsModified": self.fields_modified,
            "timestamp": self.timestamp.isoformat(),
            "sessionId": self.session_id
        }


class TemplateCategory(Base):
    """Model for template categories with metadata."""

    __tablename__ = "template_categories"

    id = Column(String, primary_key=True)  # acute, chronic, surgical, etc.
    name = Column(String(100), nullable=False)
    description = Column(Text)
    icon = Column(String(50))  # Icon name for UI
    color = Column(String(20))  # Color code for UI
    sort_order = Column(Integer, default=0)
    is_active = Column(Boolean, default=True, nullable=False)

    # Audit fields
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    def to_dict(self) -> Dict[str, Any]:
        """Convert category to dictionary."""
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "icon": self.icon,
            "color": self.color,
            "sortOrder": self.sort_order,
            "isActive": self.is_active,
            "createdAt": self.created_at.isoformat(),
            "updatedAt": self.updated_at.isoformat()
        }


class TemplateField(Base):
    """Model for template field definitions and validation rules."""

    __tablename__ = "template_fields"

    id = Column(String, primary_key=True)  # field identifier
    name = Column(String(100), nullable=False)
    label = Column(String(200), nullable=False)
    field_type = Column(String(50), nullable=False)  # text, textarea, select, number, etc.
    category = Column(String(50), nullable=False)  # wound_info, treatment, supplies, etc.

    # Validation rules
    is_required = Column(Boolean, default=False)
    min_length = Column(Integer, nullable=True)
    max_length = Column(Integer, nullable=True)
    pattern = Column(String(500), nullable=True)  # Regex pattern
    options = Column(JSON, nullable=True)  # For select fields

    # UI properties
    placeholder = Column(String(200), nullable=True)
    help_text = Column(Text, nullable=True)
    sort_order = Column(Integer, default=0)
    is_active = Column(Boolean, default=True, nullable=False)

    # Audit fields
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    def to_dict(self) -> Dict[str, Any]:
        """Convert field to dictionary."""
        return {
            "id": self.id,
            "name": self.name,
            "label": self.label,
            "fieldType": self.field_type,
            "category": self.category,
            "isRequired": self.is_required,
            "minLength": self.min_length,
            "maxLength": self.max_length,
            "pattern": self.pattern,
            "options": self.options,
            "placeholder": self.placeholder,
            "helpText": self.help_text,
            "sortOrder": self.sort_order,
            "isActive": self.is_active,
            "createdAt": self.created_at.isoformat(),
            "updatedAt": self.updated_at.isoformat()
        }


# Default template data for seeding
DEFAULT_WOUND_CARE_TEMPLATES = [
    {
        "id": "diabetic-foot-ulcer",
        "name": "Diabetic Foot Ulcer",
        "category": "diabetic",
        "priority": "high",
        "estimatedTime": "2-3 minutes",
        "fields": {
            "woundType": "Diabetic foot ulcer",
            "location": "Plantar surface, great toe",
            "size": "2.5cm x 1.8cm",
            "depth": "Partial thickness",
            "drainage": "Minimal serous",
            "painLevel": "4/10",
            "treatment": "Debridement, antimicrobial dressing",
            "frequency": "Every 3 days",
            "supplies": ["Antimicrobial foam dressing", "Gauze", "Medical tape", "Saline solution"],
            "notes": "Patient has diabetes mellitus type 2. Wound present for 3 weeks. No signs of infection currently."
        },
        "icd10Codes": ["E11.621", "L97.519"],
        "commonSupplies": ["Antimicrobial foam dressing", "Alginate dressing", "Hydrogel", "Offloading device"],
        "description": "Template for diabetic foot ulcers with standard treatment protocols",
        "isSystemTemplate": True
    },
    {
        "id": "pressure-ulcer-stage2",
        "name": "Pressure Ulcer - Stage 2",
        "category": "pressure",
        "priority": "high",
        "estimatedTime": "2 minutes",
        "fields": {
            "woundType": "Pressure ulcer, stage 2",
            "location": "Sacral area",
            "size": "3.0cm x 2.5cm",
            "depth": "Partial thickness",
            "drainage": "Moderate serous",
            "painLevel": "6/10",
            "treatment": "Hydrocolloid dressing, pressure redistribution",
            "frequency": "Every 5-7 days",
            "supplies": ["Hydrocolloid dressing", "Foam padding", "Barrier cream"],
            "notes": "Patient bedbound. Requires pressure redistribution mattress and frequent repositioning."
        },
        "icd10Codes": ["L89.152"],
        "commonSupplies": ["Hydrocolloid dressing", "Foam dressing", "Pressure redistribution cushion"],
        "description": "Template for stage 2 pressure ulcers with pressure redistribution protocols",
        "isSystemTemplate": True
    },
    {
        "id": "venous-leg-ulcer",
        "name": "Venous Leg Ulcer",
        "category": "venous",
        "priority": "medium",
        "estimatedTime": "2-3 minutes",
        "fields": {
            "woundType": "Venous stasis ulcer",
            "location": "Medial malleolus, left leg",
            "size": "4.2cm x 3.1cm",
            "depth": "Shallow, partial thickness",
            "drainage": "Heavy serous",
            "painLevel": "5/10",
            "treatment": "Compression therapy, absorbent dressing",
            "frequency": "Every 3-4 days",
            "supplies": ["Absorbent foam dressing", "Compression bandage system", "Skin protectant"],
            "notes": "Chronic venous insufficiency. Requires compression therapy and leg elevation."
        },
        "icd10Codes": ["I87.2", "L97.229"],
        "commonSupplies": ["Compression bandages", "Absorbent foam", "Zinc oxide paste"],
        "description": "Template for venous leg ulcers with compression therapy protocols",
        "isSystemTemplate": True
    },
    {
        "id": "surgical-dehiscence",
        "name": "Surgical Wound Dehiscence",
        "category": "surgical",
        "priority": "urgent",
        "estimatedTime": "1-2 minutes",
        "fields": {
            "woundType": "Post-surgical dehiscence",
            "location": "Abdominal incision",
            "size": "8.0cm x 1.5cm",
            "depth": "Full thickness",
            "drainage": "Minimal serosanguinous",
            "painLevel": "7/10",
            "treatment": "Negative pressure wound therapy",
            "frequency": "Every 3 days",
            "supplies": ["NPWT system", "Foam dressing", "Transparent film"],
            "notes": "Post-operative day 5. Partial dehiscence of surgical site. No signs of infection."
        },
        "icd10Codes": ["T81.31XA", "T81.89XA"],
        "commonSupplies": ["NPWT system", "Black foam", "Transparent adhesive film"],
        "description": "Template for surgical wound dehiscence with NPWT protocols",
        "isSystemTemplate": True
    },
    {
        "id": "acute-laceration",
        "name": "Acute Laceration",
        "category": "acute",
        "priority": "high",
        "estimatedTime": "1-2 minutes",
        "fields": {
            "woundType": "Traumatic laceration",
            "location": "Forearm, dorsal surface",
            "size": "5.0cm x 0.8cm",
            "depth": "Partial thickness",
            "drainage": "Minimal bloody",
            "painLevel": "6/10",
            "treatment": "Primary closure, antibiotic ointment",
            "frequency": "Daily dressing change",
            "supplies": ["Non-adherent dressing", "Gauze", "Medical tape", "Antibiotic ointment"],
            "notes": "Fresh laceration from fall. Cleaned and irrigated. No foreign bodies present."
        },
        "icd10Codes": ["S51.819A"],
        "commonSupplies": ["Non-adherent pad", "Gauze rolls", "Paper tape", "Saline solution"],
        "description": "Template for acute traumatic lacerations with primary closure",
        "isSystemTemplate": True
    },
    {
        "id": "chronic-wound-maintenance",
        "name": "Chronic Wound Maintenance",
        "category": "chronic",
        "priority": "routine",
        "estimatedTime": "2 minutes",
        "fields": {
            "woundType": "Chronic non-healing wound",
            "location": "Lower extremity",
            "size": "3.5cm x 2.8cm",
            "depth": "Partial thickness",
            "drainage": "Moderate serous",
            "painLevel": "4/10",
            "treatment": "Moisture-retentive dressing, debridement PRN",
            "frequency": "Twice weekly",
            "supplies": ["Hydrogel dressing", "Secondary dressing", "Gauze"],
            "notes": "Chronic wound present for 6+ months. Slow healing progress. Regular debridement needed."
        },
        "icd10Codes": ["L98.499"],
        "commonSupplies": ["Hydrogel sheets", "Foam secondary dressing", "Gauze pads"],
        "description": "Template for chronic wound maintenance with moisture-retentive protocols",
        "isSystemTemplate": True
    }
]

DEFAULT_TEMPLATE_CATEGORIES = [
    {
        "id": "acute",
        "name": "Acute Wounds",
        "description": "Fresh traumatic wounds requiring immediate care",
        "icon": "zap",
        "color": "#ef4444",
        "sortOrder": 1
    },
    {
        "id": "chronic",
        "name": "Chronic Wounds",
        "description": "Long-term wounds requiring ongoing management",
        "icon": "clock",
        "color": "#f97316",
        "sortOrder": 2
    },
    {
        "id": "surgical",
        "name": "Surgical Wounds",
        "description": "Post-operative wounds and complications",
        "icon": "file-text",
        "color": "#3b82f6",
        "sortOrder": 3
    },
    {
        "id": "diabetic",
        "name": "Diabetic Wounds",
        "description": "Diabetic ulcers and related complications",
        "icon": "activity",
        "color": "#8b5cf6",
        "sortOrder": 4
    },
    {
        "id": "pressure",
        "name": "Pressure Ulcers",
        "description": "Pressure-related skin breakdown",
        "icon": "star",
        "color": "#eab308",
        "sortOrder": 5
    },
    {
        "id": "venous",
        "name": "Venous Ulcers",
        "description": "Venous insufficiency related wounds",
        "icon": "activity",
        "color": "#22c55e",
        "sortOrder": 6
    }
]