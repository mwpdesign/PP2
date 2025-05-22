"""
Shipping service for carrier integrations and operations.
Implements HIPAA-compliant shipping with carrier support.
"""
from abc import ABC, abstractmethod
from datetime import datetime, timedelta
from enum import Enum
from typing import Dict, List, Optional
import json
import asyncio
import httpx
from pydantic import BaseModel

from app.core.config import get_settings
from app.core.exceptions import ShippingException
from app.core.audit import audit_shipping_operation
from app.core.security import decrypt_field, encrypt_field


class ShippingServiceType(str, Enum):
    """Supported shipping service types."""
    GROUND = 'ground'
    EXPRESS = 'express'
    OVERNIGHT = 'overnight'
    PRIORITY = 'priority'
    ECONOMY = 'economy'


class PackageType(str, Enum):
    """Supported package types."""
    CUSTOM = 'custom'
    ENVELOPE = 'envelope'
    SMALL_BOX = 'small_box'
    MEDIUM_BOX = 'medium_box'
    LARGE_BOX = 'large_box'
    MEDICAL_CONTAINER = 'medical_container'


class Address(BaseModel):
    """Shipping address model."""
    street1: str
    street2: Optional[str]
    city: str
    state: str
    postal_code: str
    country: str = 'US'
    is_residential: bool = True
    phone: Optional[str]
    email: Optional[str]


class Package(BaseModel):
    """Package information model."""
    type: PackageType
    weight: float
    length: Optional[float]
    width: Optional[float]
    height: Optional[float]
    value: Optional[float]
    reference: Optional[str]
    requires_signature: bool = True
    is_temperature_controlled: bool = False
    temperature_range: Optional[Dict[str, float]]


class ShippingRate(BaseModel):
    """Shipping rate information."""
    carrier: str
    service_type: ShippingServiceType
    rate: float
    currency: str = 'USD'
    delivery_days: Optional[int]
    guaranteed_delivery: bool = False
    tracking_included: bool = True


class ShippingLabel(BaseModel):
    """Shipping label information."""
    carrier: str
    tracking_number: str
    label_url: str
    label_data: Optional[str]
    expires_at: Optional[datetime]


class TrackingStatus(str, Enum):
    """Package tracking statuses."""
    PENDING = 'pending'
    IN_TRANSIT = 'in_transit'
    OUT_FOR_DELIVERY = 'out_for_delivery'
    DELIVERED = 'delivered'
    EXCEPTION = 'exception'
    RETURNED = 'returned'


class TrackingEvent(BaseModel):
    """Package tracking event."""
    timestamp: datetime
    status: TrackingStatus
    location: Optional[str]
    description: str
    details: Optional[Dict]


class TrackingInfo(BaseModel):
    """Package tracking information."""
    carrier: str
    tracking_number: str
    current_status: TrackingStatus
    estimated_delivery: Optional[datetime]
    events: List[TrackingEvent]
    last_updated: datetime


class ShippingProvider(ABC):
    """Abstract base class for shipping carrier integrations."""

    def __init__(self, api_key: str, test_mode: bool = False):
        """Initialize shipping provider with credentials."""
        self.api_key = api_key
        self.test_mode = test_mode
        self.client = httpx.AsyncClient()

    @abstractmethod
    async def validate_address(self, address: Address) -> Dict:
        """Validate shipping address."""
        pass

    @abstractmethod
    async def get_rates(
        self,
        from_address: Address,
        to_address: Address,
        package: Package,
        service_type: Optional[ShippingServiceType] = None
    ) -> List[ShippingRate]:
        """Get shipping rates for package."""
        pass

    @abstractmethod
    async def create_label(
        self,
        from_address: Address,
        to_address: Address,
        package: Package,
        service_type: ShippingServiceType,
        reference: Optional[str] = None
    ) -> ShippingLabel:
        """Create shipping label."""
        pass

    @abstractmethod
    async def track_shipment(
        self,
        tracking_number: str
    ) -> TrackingInfo:
        """Track shipment status."""
        pass

    async def __aenter__(self):
        """Async context manager entry."""
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit."""
        await self.client.aclose()


class UPSProvider(ShippingProvider):
    """UPS shipping provider implementation."""

    def __init__(self, api_key: str, test_mode: bool = False):
        """Initialize UPS provider with credentials."""
        super().__init__(api_key, test_mode)
        self.base_url = (
            "https://wwwcie.ups.com/api"
            if test_mode
            else "https://onlinetools.ups.com/api"
        )
        self._token = None
        self._token_expires = None
        self._rate_limit = httpx.Limits(max_keepalive_connections=5, max_connections=10)
        self.client = httpx.AsyncClient(limits=self._rate_limit)

    async def _get_token(self) -> str:
        """Get OAuth token for UPS API access."""
        if self._token and self._token_expires and self._token_expires > datetime.utcnow():
            return self._token

        settings = get_settings()
        auth_url = f"{self.base_url}/security/v1/oauth/token"
        
        try:
            response = await self.client.post(
                auth_url,
                data={
                    "grant_type": "client_credentials",
                },
                headers={
                    "Content-Type": "application/x-www-form-urlencoded",
                    "x-merchant-id": settings.ups_user_id,
                },
                auth=(settings.ups_api_key, settings.ups_password)
            )
            response.raise_for_status()
            data = response.json()
            
            self._token = data["access_token"]
            self._token_expires = datetime.utcnow() + timedelta(seconds=data["expires_in"])
            
            audit_shipping_operation(
                operation="ups_auth",
                status="success",
                metadata={"expires_in": data["expires_in"]}
            )
            
            return self._token
        except Exception as e:
            audit_shipping_operation(
                operation="ups_auth",
                status="error",
                error=str(e)
            )
            raise ShippingException(f"UPS authentication failed: {str(e)}")

    async def _make_request(
        self,
        method: str,
        endpoint: str,
        data: Optional[Dict] = None,
        retry_count: int = 0
    ) -> Dict:
        """Make authenticated request to UPS API with retry logic."""
        if retry_count >= 3:
            raise ShippingException("Max retries exceeded for UPS API request")

        token = await self._get_token()
        url = f"{self.base_url}/{endpoint}"
        
        try:
            response = await self.client.request(
                method,
                url,
                json=data,
                headers={
                    "Authorization": f"Bearer {token}",
                    "Content-Type": "application/json",
                }
            )
            
            if response.status_code == 401 and retry_count < 3:
                self._token = None  # Force token refresh
                return await self._make_request(method, endpoint, data, retry_count + 1)
                
            response.raise_for_status()
            return response.json()
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 429:  # Rate limit exceeded
                await asyncio.sleep(2 ** retry_count)  # Exponential backoff
                return await self._make_request(method, endpoint, data, retry_count + 1)
            raise ShippingException(f"UPS API request failed: {str(e)}")
        except Exception as e:
            raise ShippingException(f"UPS API request failed: {str(e)}")

    async def validate_address(self, address: Address) -> Dict:
        """Validate shipping address through UPS API."""
        try:
            data = {
                "XAVRequest": {
                    "AddressKeyFormat": {
                        "AddressLine": [address.street1],
                        "PoliticalDivision2": address.city,
                        "PoliticalDivision1": address.state,
                        "PostcodePrimaryLow": address.postal_code,
                        "CountryCode": address.country
                    }
                }
            }
            if address.street2:
                data["XAVRequest"]["AddressKeyFormat"]["AddressLine"].append(
                    address.street2
                )

            result = await self._make_request(
                "POST",
                "addressvalidation/v1/validation",
                data
            )

            audit_shipping_operation(
                operation="ups_address_validation",
                status="success",
                metadata={
                    "address_id": str(address.id),
                    "validation_result": result["XAVResponse"]["ValidAddressIndicator"]
                }
            )

            return {
                "valid": bool(result["XAVResponse"].get("ValidAddressIndicator")),
                "normalized_address": self._parse_normalized_address(
                    result["XAVResponse"].get("CandidateAddressList", [{}])[0]
                ),
                "validation_details": result["XAVResponse"]
            }
        except Exception as e:
            audit_shipping_operation(
                operation="ups_address_validation",
                status="error",
                error=str(e),
                metadata={"address_id": str(address.id)}
            )
            raise

    async def get_rates(
        self,
        from_address: Address,
        to_address: Address,
        package: Package,
        service_type: Optional[ShippingServiceType] = None
    ) -> List[ShippingRate]:
        """Get UPS shipping rates."""
        try:
            data = {
                "RateRequest": {
                    "Request": {
                        "TransactionReference": {
                            "CustomerContext": "Rate Request",
                        }
                    },
                    "Shipment": {
                        "Shipper": self._format_address(from_address),
                        "ShipTo": self._format_address(to_address),
                        "Package": self._format_package(package),
                        "Service": {
                            "Code": self._get_service_code(service_type)
                        } if service_type else None
                    }
                }
            }

            result = await self._make_request(
                "POST",
                "rating/v1/rate",
                data
            )

            rates = []
            for rate_info in result["RateResponse"]["RatedShipment"]:
                service_code = rate_info["Service"]["Code"]
                rates.append(ShippingRate(
                    carrier="UPS",
                    service_type=self._parse_service_type(service_code),
                    rate=float(rate_info["TotalCharges"]["MonetaryValue"]),
                    currency=rate_info["TotalCharges"]["CurrencyCode"],
                    delivery_days=rate_info.get("GuaranteedDaysToDelivery"),
                    guaranteed_delivery=bool(rate_info.get("GuaranteedDelivery")),
                    tracking_included=True
                ))

            audit_shipping_operation(
                operation="ups_rate_request",
                status="success",
                metadata={
                    "from_address": str(from_address.id),
                    "to_address": str(to_address.id),
                    "rates_count": len(rates)
                }
            )

            return rates
        except Exception as e:
            audit_shipping_operation(
                operation="ups_rate_request",
                status="error",
                error=str(e),
                metadata={
                    "from_address": str(from_address.id),
                    "to_address": str(to_address.id)
                }
            )
            raise

    async def create_label(
        self,
        from_address: Address,
        to_address: Address,
        package: Package,
        service_type: ShippingServiceType,
        reference: Optional[str] = None
    ) -> ShippingLabel:
        """Create UPS shipping label."""
        try:
            data = {
                "ShipmentRequest": {
                    "Request": {
                        "TransactionReference": {
                            "CustomerContext": reference or "Shipping Request"
                        }
                    },
                    "Shipment": {
                        "Description": "Medical Supplies",
                        "Shipper": self._format_address(from_address),
                        "ShipTo": self._format_address(to_address),
                        "PaymentInformation": {
                            "ShipmentCharge": {
                                "Type": "01",
                                "BillShipper": {
                                    "AccountNumber": get_settings().ups_account_number
                                }
                            }
                        },
                        "Service": {
                            "Code": self._get_service_code(service_type)
                        },
                        "Package": self._format_package(package),
                        "LabelSpecification": {
                            "LabelImageFormat": {
                                "Code": "GIF"
                            },
                            "HTTPUserAgent": "Mozilla/4.5"
                        }
                    }
                }
            }

            result = await self._make_request(
                "POST",
                "shipping/v1/ship",
                data
            )

            tracking_number = result["ShipmentResponse"]["ShipmentResults"]["TrackingNumber"]
            label_data = result["ShipmentResponse"]["ShipmentResults"]["PackageResults"]["ShippingLabel"]["GraphicImage"]

            # Store label in S3 and get URL
            label_url = await self._store_label(label_data, tracking_number)

            audit_shipping_operation(
                operation="ups_label_creation",
                status="success",
                metadata={
                    "tracking_number": tracking_number,
                    "from_address": str(from_address.id),
                    "to_address": str(to_address.id)
                }
            )

            return ShippingLabel(
                carrier="UPS",
                tracking_number=tracking_number,
                label_url=label_url,
                label_data=label_data,
                expires_at=datetime.utcnow() + timedelta(days=30)
            )
        except Exception as e:
            audit_shipping_operation(
                operation="ups_label_creation",
                status="error",
                error=str(e),
                metadata={
                    "from_address": str(from_address.id),
                    "to_address": str(to_address.id)
                }
            )
            raise

    async def track_shipment(self, tracking_number: str) -> TrackingInfo:
        """Track UPS shipment."""
        try:
            data = {
                "TrackRequest": {
                    "Request": {
                        "TransactionReference": {
                            "CustomerContext": "Track Request"
                        }
                    },
                    "InquiryNumber": tracking_number
                }
            }

            result = await self._make_request(
                "POST",
                "track/v1/details",
                data
            )

            shipment = result["TrackResponse"]["Shipment"][0]
            package = shipment["Package"][0]
            
            events = []
            for activity in package["Activity"]:
                events.append(TrackingEvent(
                    timestamp=datetime.fromisoformat(activity["Date"] + "T" + activity["Time"]),
                    status=self._parse_tracking_status(activity["Status"]["Code"]),
                    location=activity.get("Location", {}).get("Address", {}).get("City"),
                    description=activity["Status"]["Description"],
                    details=activity
                ))

            audit_shipping_operation(
                operation="ups_tracking",
                status="success",
                metadata={
                    "tracking_number": tracking_number,
                    "events_count": len(events)
                }
            )

            return TrackingInfo(
                carrier="UPS",
                tracking_number=tracking_number,
                current_status=events[0].status if events else TrackingStatus.PENDING,
                estimated_delivery=datetime.fromisoformat(
                    shipment["DeliveryDetail"]["Date"] + "T" + 
                    shipment["DeliveryDetail"]["Time"]
                ) if "DeliveryDetail" in shipment else None,
                events=events,
                last_updated=datetime.utcnow()
            )
        except Exception as e:
            audit_shipping_operation(
                operation="ups_tracking",
                status="error",
                error=str(e),
                metadata={"tracking_number": tracking_number}
            )
            raise

    def _format_address(self, address: Address) -> Dict:
        """Format address for UPS API."""
        return {
            "Name": "",  # Required by UPS but we don't store it
            "AttentionName": "",
            "Phone": {
                "Number": address.phone or ""
            },
            "Address": {
                "AddressLine": [
                    address.street1,
                    address.street2
                ] if address.street2 else [address.street1],
                "City": address.city,
                "StateProvinceCode": address.state,
                "PostalCode": address.postal_code,
                "CountryCode": address.country,
                "ResidentialAddressIndicator": address.is_residential
            }
        }

    def _format_package(self, package: Package) -> Dict:
        """Format package for UPS API."""
        data = {
            "PackagingType": {
                "Code": self._get_package_type_code(package.type)
            },
            "Dimensions": {
                "UnitOfMeasurement": {
                    "Code": "IN"
                },
                "Length": str(package.length),
                "Width": str(package.width),
                "Height": str(package.height)
            } if all([package.length, package.width, package.height]) else None,
            "PackageWeight": {
                "UnitOfMeasurement": {
                    "Code": "LBS"
                },
                "Weight": str(package.weight)
            }
        }

        if package.requires_signature:
            data["DeliveryConfirmation"] = {
                "DCISType": "2"  # Signature Required
            }

        if package.is_temperature_controlled:
            data["AdditionalHandling"] = True
            data["SpecialServicesIndicator"] = True

        return data

    def _get_service_code(self, service_type: ShippingServiceType) -> str:
        """Map service type to UPS service code."""
        service_map = {
            ShippingServiceType.GROUND: "03",    # Ground
            ShippingServiceType.EXPRESS: "02",    # 2nd Day Air
            ShippingServiceType.OVERNIGHT: "01",  # Next Day Air
            ShippingServiceType.PRIORITY: "13",   # Next Day Air Saver
            ShippingServiceType.ECONOMY: "11",    # Standard
        }
        return service_map.get(service_type, "03")  # Default to Ground

    def _parse_service_type(self, code: str) -> ShippingServiceType:
        """Map UPS service code to service type."""
        service_map = {
            "01": ShippingServiceType.OVERNIGHT,  # Next Day Air
            "02": ShippingServiceType.EXPRESS,    # 2nd Day Air
            "03": ShippingServiceType.GROUND,     # Ground
            "11": ShippingServiceType.ECONOMY,    # Standard
            "13": ShippingServiceType.PRIORITY,   # Next Day Air Saver
        }
        return service_map.get(code, ShippingServiceType.GROUND)

    def _get_package_type_code(self, package_type: PackageType) -> str:
        """Map package type to UPS package type code."""
        type_map = {
            PackageType.CUSTOM: "02",          # Customer Supplied
            PackageType.ENVELOPE: "01",        # UPS Letter
            PackageType.SMALL_BOX: "21",       # UPS Express Box - Small
            PackageType.MEDIUM_BOX: "22",      # UPS Express Box - Medium
            PackageType.LARGE_BOX: "23",       # UPS Express Box - Large
            PackageType.MEDICAL_CONTAINER: "02" # Custom for medical supplies
        }
        return type_map.get(package_type, "02")

    def _parse_tracking_status(self, code: str) -> TrackingStatus:
        """Map UPS tracking code to tracking status."""
        status_map = {
            "I": TrackingStatus.IN_TRANSIT,
            "D": TrackingStatus.DELIVERED,
            "X": TrackingStatus.EXCEPTION,
            "P": TrackingStatus.PENDING,
            "O": TrackingStatus.OUT_FOR_DELIVERY,
            "RS": TrackingStatus.RETURNED
        }
        return status_map.get(code, TrackingStatus.PENDING)

    async def _store_label(self, label_data: str, tracking_number: str) -> str:
        """Store shipping label in S3 and return URL."""
        from app.services.s3_service import upload_file
        
        try:
            key = f"shipping/labels/ups/{tracking_number}.gif"
            url = await upload_file(
                data=label_data.encode(),
                key=key,
                content_type="image/gif"
            )
            return url
        except Exception as e:
            raise ShippingException(f"Failed to store shipping label: {str(e)}")

    def _parse_normalized_address(self, candidate: Dict) -> Dict:
        """Parse normalized address from UPS validation response."""
        address = candidate.get("AddressKeyFormat", {})
        return {
            "street1": address.get("AddressLine", [""])[0],
            "street2": address.get("AddressLine", ["", ""])[1] if len(address.get("AddressLine", [])) > 1 else None,
            "city": address.get("PoliticalDivision2"),
            "state": address.get("PoliticalDivision1"),
            "postal_code": address.get("PostcodePrimaryLow"),
            "country": address.get("CountryCode")
        }


class FedExProvider(ShippingProvider):
    """FedEx shipping provider implementation."""

    def __init__(self, api_key: str, test_mode: bool = False):
        super().__init__(api_key, test_mode)
        self.base_url = (
            "https://apis-sandbox.fedex.com"
            if test_mode
            else "https://apis.fedex.com"
        )

    async def validate_address(self, address: Address) -> Dict:
        """Validate address through FedEx API."""
        # Implementation for FedEx address validation
        pass

    async def get_rates(
        self,
        from_address: Address,
        to_address: Address,
        package: Package,
        service_type: Optional[ShippingServiceType] = None
    ) -> List[ShippingRate]:
        """Get FedEx shipping rates."""
        # Implementation for FedEx rate calculation
        pass

    async def create_label(
        self,
        from_address: Address,
        to_address: Address,
        package: Package,
        service_type: ShippingServiceType,
        reference: Optional[str] = None
    ) -> ShippingLabel:
        """Create FedEx shipping label."""
        # Implementation for FedEx label creation
        pass

    async def track_shipment(
        self,
        tracking_number: str
    ) -> TrackingInfo:
        """Track FedEx shipment."""
        # Implementation for FedEx tracking
        pass


class USPSProvider(ShippingProvider):
    """USPS shipping provider implementation."""

    def __init__(self, api_key: str, test_mode: bool = False):
        super().__init__(api_key, test_mode)
        self.base_url = (
            "https://stg-secure.shippingapis.com/ShippingAPI.dll"
            if test_mode
            else "https://secure.shippingapis.com/ShippingAPI.dll"
        )

    async def validate_address(self, address: Address) -> Dict:
        """Validate address through USPS API."""
        # Implementation for USPS address validation
        pass

    async def get_rates(
        self,
        from_address: Address,
        to_address: Address,
        package: Package,
        service_type: Optional[ShippingServiceType] = None
    ) -> List[ShippingRate]:
        """Get USPS shipping rates."""
        # Implementation for USPS rate calculation
        pass

    async def create_label(
        self,
        from_address: Address,
        to_address: Address,
        package: Package,
        service_type: ShippingServiceType,
        reference: Optional[str] = None
    ) -> ShippingLabel:
        """Create USPS shipping label."""
        # Implementation for USPS label creation
        pass

    async def track_shipment(
        self,
        tracking_number: str
    ) -> TrackingInfo:
        """Track USPS shipment."""
        # Implementation for USPS tracking
        pass


class ShippingService:
    """Main shipping service for managing carrier operations."""

    def __init__(self):
        """Initialize shipping service."""
        settings = get_settings()
        self.providers = {
            'ups': UPSProvider(
                api_key=settings.ups_api_key,
                test_mode=settings.test_mode
            ),
            'fedex': FedExProvider(
                api_key=settings.fedex_api_key,
                test_mode=settings.test_mode
            ),
            'usps': USPSProvider(
                api_key=settings.usps_api_key,
                test_mode=settings.test_mode
            )
        }

    async def validate_address(
        self,
        address: Address,
        carrier: Optional[str] = None
    ) -> Dict:
        """Validate shipping address with specified carrier."""
        if carrier:
            if carrier not in self.providers:
                raise ShippingException(f"Unsupported carrier: {carrier}")
            return await self.providers[carrier].validate_address(address)

        # Try all carriers until one succeeds
        errors = {}
        for name, provider in self.providers.items():
            try:
                result = await provider.validate_address(address)
                return result
            except Exception as e:
                errors[name] = str(e)

        raise ShippingException(
            f"Address validation failed with all carriers: {errors}"
        )

    async def get_rates(
        self,
        from_address: Address,
        to_address: Address,
        package: Package,
        service_type: Optional[ShippingServiceType] = None,
        carrier: Optional[str] = None
    ) -> List[ShippingRate]:
        """Get shipping rates from all or specified carrier."""
        rates = []
        providers = (
            {carrier: self.providers[carrier]}
            if carrier
            else self.providers
        )

        for name, provider in providers.items():
            try:
                carrier_rates = await provider.get_rates(
                    from_address,
                    to_address,
                    package,
                    service_type
                )
                rates.extend(carrier_rates)
            except Exception as e:
                audit_shipping_operation(
                    operation='get_rates',
                    carrier=name,
                    error=str(e)
                )

        if not rates:
            raise ShippingException("No shipping rates available")

        return sorted(rates, key=lambda x: x.rate)

    async def create_label(
        self,
        from_address: Address,
        to_address: Address,
        package: Package,
        service_type: ShippingServiceType,
        carrier: str,
        reference: Optional[str] = None
    ) -> ShippingLabel:
        """Create shipping label with specified carrier."""
        if carrier not in self.providers:
            raise ShippingException(f"Unsupported carrier: {carrier}")

        try:
            label = await self.providers[carrier].create_label(
                from_address,
                to_address,
                package,
                service_type,
                reference
            )
            audit_shipping_operation(
                operation='create_label',
                carrier=carrier,
                tracking_number=label.tracking_number
            )
            return label
        except Exception as e:
            audit_shipping_operation(
                operation='create_label',
                carrier=carrier,
                error=str(e)
            )
            raise

    async def track_shipment(
        self,
        tracking_number: str,
        carrier: Optional[str] = None
    ) -> TrackingInfo:
        """Track shipment with specified or detected carrier."""
        if carrier:
            if carrier not in self.providers:
                raise ShippingException(f"Unsupported carrier: {carrier}")
            return await self.providers[carrier].track_shipment(tracking_number)

        # Try to detect carrier from tracking number format
        for name, provider in self.providers.items():
            try:
                return await provider.track_shipment(tracking_number)
            except Exception:
                continue

        raise ShippingException(
            "Could not track shipment with number: "
            f"{tracking_number}"
        ) 