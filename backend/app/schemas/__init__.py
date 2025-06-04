"""
Pydantic schemas for request/response models.
"""

# Explicit imports to avoid linter issues with star imports
try:
    from .auth import (
        LoginRequest,
        TokenResponse,
        UserRegistration,
        PasswordReset,
        PasswordResetConfirm,
        UserProfile,
    )
except ImportError:
    pass

try:
    from .user import (
        UserCreate,
        UserUpdate,
        UserResponse,
        UserPreferences,
    )
except ImportError:
    pass

try:
    from .patient import (
        Patient,
        PatientUpdate,
        PatientSearchResults,
        PatientDocument,
        PatientRegistration,
    )
except ImportError:
    pass

try:
    from .provider import (
        ProviderCreate,
        ProviderUpdate,
        ProviderSearchResults,
        ProviderResponse,
    )
except ImportError:
    pass

try:
    from .orders import (
        OrderCreate,
        OrderUpdate,
        OrderResponse,
        OrderSearchResults,
    )
except ImportError:
    pass

try:
    from .organization import (
        OrganizationCreate,
        OrganizationUpdate,
        OrganizationResponse,
    )
except ImportError:
    pass

try:
    from .token import (
        Token,
        TokenData,
        RefreshToken,
    )
except ImportError:
    pass

try:
    from .notification import (
        NotificationCreate,
        NotificationUpdate,
        NotificationResponse,
    )
except ImportError:
    pass

try:
    from .rbac import (
        RoleCreate,
        RoleUpdate,
        RoleResponse,
        PermissionResponse,
    )
except ImportError:
    pass

try:
    from .ivr import (
        IVRRequestCreate,
        IVRRequestUpdate,
        IVRRequestResponse,
        IVRResponseCreate,
    )
except ImportError:
    pass

try:
    from .shipping import (
        ShippingAddressCreate,
        ShippingAddressUpdate,
        ShipmentCreate,
        ShipmentUpdate,
    )
except ImportError:
    pass

try:
    from .compliance import (
        AuditLogResponse,
        ComplianceReportCreate,
        ComplianceReportResponse,
    )
except ImportError:
    pass

__all__ = [
    # Auth schemas
    "LoginRequest",
    "TokenResponse",
    "UserRegistration",
    "PasswordReset",
    "PasswordResetConfirm",
    "UserProfile",

    # User schemas
    "UserCreate",
    "UserUpdate",
    "UserResponse",
    "UserPreferences",

    # Patient schemas
    "Patient",
    "PatientUpdate",
    "PatientSearchResults",
    "PatientDocument",
    "PatientRegistration",

    # Provider schemas
    "ProviderCreate",
    "ProviderUpdate",
    "ProviderSearchResults",
    "ProviderResponse",

    # Order schemas
    "OrderCreate",
    "OrderUpdate",
    "OrderResponse",
    "OrderSearchResults",

    # Organization schemas
    "OrganizationCreate",
    "OrganizationUpdate",
    "OrganizationResponse",

    # Token schemas
    "Token",
    "TokenData",
    "RefreshToken",

    # Notification schemas
    "NotificationCreate",
    "NotificationUpdate",
    "NotificationResponse",

    # RBAC schemas
    "RoleCreate",
    "RoleUpdate",
    "RoleResponse",
    "PermissionResponse",

    # IVR schemas
    "IVRRequestCreate",
    "IVRRequestUpdate",
    "IVRRequestResponse",
    "IVRResponseCreate",

    # Shipping schemas
    "ShippingAddressCreate",
    "ShippingAddressUpdate",
    "ShipmentCreate",
    "ShipmentUpdate",

    # Compliance schemas
    "AuditLogResponse",
    "ComplianceReportCreate",
    "ComplianceReportResponse",
]
