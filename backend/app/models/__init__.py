"""
SQLAlchemy database models.
"""

# Import all models for easier access and to ensure they're registered
from .user import User
from .organization import Organization
from .rbac import Role, Permission, RolePermission
from .sensitive_data import SensitiveData

# Import other models that exist
try:
    from .patient import Patient, PatientDocument
except ImportError:
    pass

try:
    from .provider import Provider
except ImportError:
    pass

try:
    from .facility import Facility
except ImportError:
    pass

try:
    from .product import Product
except ImportError:
    pass

try:
    from .order import Order, OrderStatusHistory
except ImportError:
    pass

try:
    from .notification import Notification
except ImportError:
    pass

try:
    from .shipping import (
        ShippingAddress,
        Shipment,
        ShipmentPackage,
        ShipmentTracking,
    )
except ImportError:
    pass

try:
    from .ivr import (
        IVRRequest,
        IVRStatusHistory,
        IVRApproval,
        IVREscalation,
        IVRReview,
        IVRDocument,
        IVRSession,
        IVRSessionItem,
    )
except ImportError:
    pass

try:
    from .compliance import AuditLog, ComplianceReport
except ImportError:
    pass

try:
    from .insurance import SecondaryInsurance
except ImportError:
    pass

try:
    from .logistics import (
        Item,
        FulfillmentOrder,
        PickingList,
        QualityCheck,
        WarehouseLocation,
        InventoryTransaction,
        StockLevel,
        ReturnAuthorization,
        ReturnInspection,
    )
except ImportError:
    pass

__all__ = [
    "User",
    "Organization",
    "Role",
    "Permission",
    "RolePermission",
    "SensitiveData",
    "Patient",
    "PatientDocument",
    "Provider",
    "Facility",
    "Product",
    "Order",
    "OrderStatusHistory",
    "Notification",
    "ShippingAddress",
    "Shipment",
    "ShipmentPackage",
    "ShipmentTracking",
    "IVRRequest",
    "IVRStatusHistory",
    "IVRApproval",
    "IVREscalation",
    "IVRReview",
    "IVRDocument",
    "IVRSession",
    "IVRSessionItem",
    "AuditLog",
    "ComplianceReport",
    "SecondaryInsurance",
    "Item",
    "FulfillmentOrder",
    "PickingList",
    "QualityCheck",
    "WarehouseLocation",
    "InventoryTransaction",
    "StockLevel",
    "ReturnAuthorization",
    "ReturnInspection",
]
