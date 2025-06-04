"""
SQLAlchemy database models.
"""

# Import all models for easier access and to ensure they're registered
from .user import User
from .organization import Organization
from .rbac import Role, Permission, RolePermission

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
    from .orders import Order, OrderItem
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
    from .ivr import IVRRequest, IVRResponse
except ImportError:
    pass

try:
    from .compliance import AuditLog, ComplianceReport
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
    "Patient",
    "PatientDocument",
    "Provider",
    "Order",
    "OrderItem",
    "Notification",
    "ShippingAddress",
    "Shipment",
    "ShipmentPackage",
    "ShipmentTracking",
    "IVRRequest",
    "IVRResponse",
    "AuditLog",
    "ComplianceReport",
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
