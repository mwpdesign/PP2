"""
Shipping API endpoints.
"""

from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.core.exceptions import ShippingException
from app.services.multi_carrier_shipping import MultiCarrierShippingService, CarrierType
from app.services.shipping_types import (
    Address,
    Package,
    ShippingRate,
    TrackingInfo,
    ShippingServiceType,
)
from app.schemas.shipping import (
    ShippingAddressCreate,
    ShippingAddressUpdate,
    ShippingAddressResponse,
    ShipmentCreate,
    ShipmentUpdate,
    ShipmentResponse,
    ShipmentTrackingResponse,
)
from app.models.shipping import (
    ShippingAddress,
    Shipment,
    ShipmentPackage,
    ShipmentTracking,
)

router = APIRouter()


def get_shipping_service() -> MultiCarrierShippingService:
    """Get shipping service instance."""
    return MultiCarrierShippingService()


@router.post(
    "/addresses",
    response_model=ShippingAddressResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_shipping_address(
    address: ShippingAddressCreate,
    order_id: UUID,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
    shipping_service: MultiCarrierShippingService = Depends(get_shipping_service),
):
    """Create a new shipping address."""
    # Create address model
    db_address = ShippingAddress(
        order_id=order_id,
        address_type=address.address_type,
        street1=address.street1,
        street2=address.street2,
        city=address.city,
        state=address.state,
        postal_code=address.postal_code,
        country=address.country,
        is_residential=address.is_residential,
        phone=address.phone,
        email=address.email,
    )

    # Validate address with shipping carriers
    addr = Address(
        street1=address.street1,
        street2=address.street2,
        city=address.city,
        state=address.state,
        postal_code=address.postal_code,
        country=address.country,
        is_residential=address.is_residential,
        phone=address.phone,
        email=address.email,
    )

    validation_results = await shipping_service.validate_address(addr)

    # Check if at least one carrier validates the address
    if not any(result.get("valid", False) for result in validation_results.values()):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid shipping address"
        )

    db.add(db_address)
    db.commit()
    db.refresh(db_address)
    return db_address


@router.get("/addresses/{address_id}", response_model=ShippingAddressResponse)
async def get_shipping_address(
    address_id: UUID,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Get a shipping address by ID."""
    address = db.query(ShippingAddress).filter(ShippingAddress.id == address_id).first()
    if not address:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Shipping address not found"
        )
    return address


@router.put("/addresses/{address_id}", response_model=ShippingAddressResponse)
async def update_shipping_address(
    address_id: UUID,
    address: ShippingAddressUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Update a shipping address."""
    db_address = (
        db.query(ShippingAddress).filter(ShippingAddress.id == address_id).first()
    )
    if not db_address:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Shipping address not found"
        )

    for field, value in address.dict(exclude_unset=True).items():
        setattr(db_address, field, value)

    db.commit()
    db.refresh(db_address)
    return db_address


@router.post(
    "/shipments", response_model=ShipmentResponse, status_code=status.HTTP_201_CREATED
)
async def create_shipment(
    shipment: ShipmentCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
    shipping_service: MultiCarrierShippingService = Depends(get_shipping_service),
):
    """Create a new shipment."""
    # Get addresses from database
    from_addr = db.query(ShippingAddress).get(shipment.from_address_id)
    to_addr = db.query(ShippingAddress).get(shipment.to_address_id)

    if not from_addr or not to_addr:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Address not found"
        )

    # Convert to shipping service models
    from_address = Address(
        street1=from_addr.street1,
        street2=from_addr.street2,
        city=from_addr.city,
        state=from_addr.state,
        postal_code=from_addr.postal_code,
        country=from_addr.country,
        is_residential=from_addr.is_residential,
        phone=from_addr.phone,
        email=from_addr.email,
    )

    to_address = Address(
        street1=to_addr.street1,
        street2=to_addr.street2,
        city=to_addr.city,
        state=to_addr.state,
        postal_code=to_addr.postal_code,
        country=to_addr.country,
        is_residential=to_addr.is_residential,
        phone=to_addr.phone,
        email=to_addr.email,
    )

    try:
        # Create shipment record
        db_shipment = Shipment(
            order_id=shipment.order_id,
            carrier=shipment.carrier.value,
            service_type=shipment.service_type,
            status="pending",
        )
        db.add(db_shipment)

        # Create package records
        for pkg in shipment.packages:
            db_package = ShipmentPackage(
                shipment=db_shipment,
                package_type=pkg.package_type,
                weight=pkg.weight,
                length=pkg.length,
                width=pkg.width,
                height=pkg.height,
                value=pkg.value,
                reference=pkg.reference,
                requires_signature=True,  # Medical supplies require signature
                is_temperature_controlled=pkg.is_temperature_controlled,
                temperature_range=pkg.temperature_range,
            )
            db.add(db_package)

            # Create shipping label
            package = Package(
                weight=pkg.weight,
                length=pkg.length,
                width=pkg.width,
                height=pkg.height,
                value=pkg.value,
                requires_signature=True,
                is_temperature_controlled=pkg.is_temperature_controlled,
                temperature_range=pkg.temperature_range,
            )

            label = await shipping_service.create_label(
                from_address,
                to_address,
                package,
                shipment.service_type,
                shipment.carrier,
                pkg.reference,
            )

            # Update shipment with label info
            db_shipment.tracking_number = label.tracking_number
            db_shipment.label_url = label.label_url
            db_shipment.status = "label_created"

        db.commit()
        db.refresh(db_shipment)
        return db_shipment

    except ShippingException as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create shipment",
        )


@router.get("/shipments/{shipment_id}", response_model=ShipmentResponse)
async def get_shipment(
    shipment_id: UUID,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Get a shipment by ID."""
    shipment = db.query(Shipment).filter(Shipment.id == shipment_id).first()
    if not shipment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Shipment not found"
        )
    return shipment


@router.put("/shipments/{shipment_id}", response_model=ShipmentResponse)
async def update_shipment(
    shipment_id: UUID,
    shipment: ShipmentUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Update a shipment."""
    db_shipment = db.query(Shipment).filter(Shipment.id == shipment_id).first()
    if not db_shipment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Shipment not found"
        )

    for field, value in shipment.dict(exclude_unset=True).items():
        setattr(db_shipment, field, value)

    db.commit()
    db.refresh(db_shipment)
    return db_shipment


@router.get(
    "/shipments/{shipment_id}/tracking", response_model=List[ShipmentTrackingResponse]
)
async def get_shipment_tracking(
    shipment_id: UUID,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Get tracking events for a shipment."""
    tracking_events = (
        db.query(ShipmentTracking)
        .filter(ShipmentTracking.shipment_id == shipment_id)
        .order_by(ShipmentTracking.timestamp.desc())
        .all()
    )
    return tracking_events


@router.post("/shipments/{shipment_id}/validate", response_model=dict)
async def validate_shipment(
    shipment_id: UUID,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Validate shipment details with carrier."""
    shipping_service = get_shipping_service()
    shipment = db.query(Shipment).filter(Shipment.id == shipment_id).first()
    if not shipment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Shipment not found"
        )

    try:
        # Get addresses
        addresses = (
            db.query(ShippingAddress)
            .filter(ShippingAddress.order_id == shipment.order_id)
            .all()
        )
        from_address = next((a for a in addresses if a.address_type == "from"), None)
        to_address = next((a for a in addresses if a.address_type == "to"), None)

        if not from_address or not to_address:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Missing shipping addresses",
            )

        # Validate addresses with carrier
        validation_results = {
            "from_address": await shipping_service.validate_address(
                from_address, shipment.carrier
            ),
            "to_address": await shipping_service.validate_address(
                to_address, shipment.carrier
            ),
        }

        return validation_results
    except ShippingException as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/shipments/{shipment_id}/rates", response_model=List[dict])
async def get_shipment_rates(
    shipment_id: UUID,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Get shipping rates for a shipment."""
    shipping_service = get_shipping_service()
    shipment = db.query(Shipment).filter(Shipment.id == shipment_id).first()
    if not shipment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Shipment not found"
        )

    try:
        # Get addresses
        addresses = (
            db.query(ShippingAddress)
            .filter(ShippingAddress.order_id == shipment.order_id)
            .all()
        )
        from_address = next((a for a in addresses if a.address_type == "from"), None)
        to_address = next((a for a in addresses if a.address_type == "to"), None)

        if not from_address or not to_address:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Missing shipping addresses",
            )

        # Get rates from carrier
        rates = await shipping_service.get_rates(
            from_address=from_address,
            to_address=to_address,
            package=shipment.packages[0],  # TODO: Handle multiple packages
            carrier=shipment.carrier,
        )

        return rates
    except ShippingException as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/shipments/{shipment_id}/label", response_model=dict)
async def create_shipping_label(
    shipment_id: UUID,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Create shipping label for a shipment."""
    shipping_service = get_shipping_service()
    shipment = db.query(Shipment).filter(Shipment.id == shipment_id).first()
    if not shipment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Shipment not found"
        )

    try:
        # Get addresses
        addresses = (
            db.query(ShippingAddress)
            .filter(ShippingAddress.order_id == shipment.order_id)
            .all()
        )
        from_address = next((a for a in addresses if a.address_type == "from"), None)
        to_address = next((a for a in addresses if a.address_type == "to"), None)

        if not from_address or not to_address:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Missing shipping addresses",
            )

        # Create label with carrier
        label = await shipping_service.create_label(
            from_address=from_address,
            to_address=to_address,
            package=shipment.packages[0],  # TODO: Handle multiple packages
            service_type=shipment.service_type,
            carrier=shipment.carrier,
        )

        # Update shipment with label info
        shipment.tracking_number = label.tracking_number
        shipment.label_url = label.label_url
        shipment.status = "label_created"
        db.commit()

        return {"tracking_number": label.tracking_number, "label_url": label.label_url}
    except ShippingException as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/rates", response_model=List[ShippingRate])
async def get_shipping_rates(
    from_address_id: UUID,
    to_address_id: UUID,
    weight: float,
    length: Optional[float] = None,
    width: Optional[float] = None,
    height: Optional[float] = None,
    value: Optional[float] = None,
    service_type: Optional[ShippingServiceType] = None,
    carrier: Optional[CarrierType] = None,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
    shipping_service: MultiCarrierShippingService = Depends(get_shipping_service),
):
    """Get shipping rates for a package."""
    # Get addresses from database
    from_addr = db.query(ShippingAddress).get(from_address_id)
    to_addr = db.query(ShippingAddress).get(to_address_id)

    if not from_addr or not to_addr:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Address not found"
        )

    # Convert to shipping service models
    from_address = Address(
        street1=from_addr.street1,
        street2=from_addr.street2,
        city=from_addr.city,
        state=from_addr.state,
        postal_code=from_addr.postal_code,
        country=from_addr.country,
        is_residential=from_addr.is_residential,
        phone=from_addr.phone,
        email=from_addr.email,
    )

    to_address = Address(
        street1=to_addr.street1,
        street2=to_addr.street2,
        city=to_addr.city,
        state=to_addr.state,
        postal_code=to_addr.postal_code,
        country=to_addr.country,
        is_residential=to_addr.is_residential,
        phone=to_addr.phone,
        email=to_addr.email,
    )

    package = Package(
        weight=weight,
        length=length,
        width=width,
        height=height,
        value=value,
        requires_signature=True,  # Medical supplies require signature
        is_temperature_controlled=False,
    )

    try:
        return await shipping_service.get_rates(
            from_address, to_address, package, service_type, carrier
        )
    except ShippingException as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/shipments/{shipment_id}/track", response_model=TrackingInfo)
async def track_shipment(
    shipment_id: UUID,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
    shipping_service: MultiCarrierShippingService = Depends(get_shipping_service),
):
    """Track a shipment."""
    shipment = db.query(Shipment).get(shipment_id)
    if not shipment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Shipment not found"
        )

    try:
        tracking_info = await shipping_service.track_shipment(
            shipment.tracking_number, CarrierType(shipment.carrier)
        )

        # Update shipment status
        shipment.status = tracking_info.current_status.value
        if tracking_info.current_status == "delivered":
            shipment.actual_delivery = tracking_info.events[-1].timestamp
        db.commit()

        return tracking_info
    except ShippingException as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
