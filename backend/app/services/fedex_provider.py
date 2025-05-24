"""
FedEx shipping provider implementation with HIPAA compliance.
"""
from datetime import datetime, timedelta
from typing import Dict, List, Optional
import asyncio
import httpx

from app.core.config import get_settings
from app.core.exceptions import ShippingException
from app.core.audit import audit_shipping_operation
from app.services.shipping_types import (
    ShippingProvider, Address, Package, ShippingRate,
    ShippingLabel, TrackingInfo, ShippingServiceType,
    TrackingStatus, TrackingEvent
)


class FedExProvider(ShippingProvider):
    """FedEx shipping provider implementation."""

    SERVICE_MAPPING = {
        ShippingServiceType.GROUND: "FEDEX_GROUND",
        ShippingServiceType.EXPRESS: "FEDEX_EXPRESS_SAVER",
        ShippingServiceType.OVERNIGHT: "FEDEX_PRIORITY_OVERNIGHT",
        ShippingServiceType.PRIORITY: "FEDEX_2_DAY",
        ShippingServiceType.ECONOMY: "FEDEX_GROUND_HOME_DELIVERY"
    }

    def __init__(self, api_key: str, test_mode: bool = False):
        """Initialize FedEx provider with credentials."""
        super().__init__(api_key, test_mode)
        self.base_url = (
            "https://apis-sandbox.fedex.com"
            if test_mode
            else "https://apis.fedex.com"
        )
        self._token = None
        self._token_expires = None
        self._rate_limit = httpx.Limits(
            max_keepalive_connections=5,
            max_connections=10
        )
        self.client = httpx.AsyncClient(limits=self._rate_limit)

    async def _get_token(self) -> str:
        """Get OAuth token for FedEx API access."""
        if (self._token and self._token_expires and
                self._token_expires > datetime.utcnow()):
            return self._token

        settings = get_settings()
        auth_url = f"{self.base_url}/oauth/token"
        
        try:
            response = await self.client.post(
                auth_url,
                data={
                    "grant_type": "client_credentials",
                    "client_id": settings.fedex_client_id,
                    "client_secret": settings.fedex_client_secret
                },
                headers={
                    "Content-Type": "application/x-www-form-urlencoded"
                }
            )
            response.raise_for_status()
            data = response.json()
            
            self._token = data["access_token"]
            expires_in = data["expires_in"]
            self._token_expires = datetime.utcnow() + timedelta(seconds=expires_in)
            
            audit_shipping_operation(
                operation="fedex_auth",
                status="success",
                metadata={"expires_in": expires_in}
            )
            
            return self._token
        except Exception as e:
            audit_shipping_operation(
                operation="fedex_auth",
                status="error",
                error=str(e)
            )
            raise ShippingException(f"FedEx authentication failed: {str(e)}")

    async def _make_request(
        self,
        method: str,
        endpoint: str,
        data: Optional[Dict] = None,
        retry_count: int = 0
    ) -> Dict:
        """Make authenticated request to FedEx API with retry logic."""
        if retry_count >= 3:
            raise ShippingException("Max retries exceeded for FedEx API request")

        token = await self._get_token()
        url = f"{self.base_url}/v1/{endpoint}"
        
        try:
            response = await self.client.request(
                method,
                url,
                json=data,
                headers={
                    "Authorization": f"Bearer {token}",
                    "Content-Type": "application/json"
                }
            )
            
            if response.status_code == 401 and retry_count < 3:
                self._token = None  # Force token refresh
                return await self._make_request(
                    method, endpoint, data, retry_count + 1
                )
                
            response.raise_for_status()
            return response.json()
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 429:  # Rate limit exceeded
                await asyncio.sleep(2 ** retry_count)  # Exponential backoff
                return await self._make_request(
                    method, endpoint, data, retry_count + 1
                )
            raise ShippingException(f"FedEx API request failed: {str(e)}")
        except Exception as e:
            raise ShippingException(f"FedEx API request failed: {str(e)}")

    def _format_address(self, address: Address) -> Dict:
        """Format address for FedEx API."""
        return {
            "streetLines": [
                address.street1,
                address.street2
            ] if address.street2 else [address.street1],
            "city": address.city,
            "stateOrProvinceCode": address.state,
            "postalCode": address.postal_code,
            "countryCode": address.country,
            "residential": address.is_residential,
            "phoneNumber": address.phone,
            "emailAddress": address.email
        }

    def _format_package(self, package: Package) -> Dict:
        """Format package for FedEx API."""
        package_data = {
            "weight": {
                "value": package.weight,
                "units": "LB"
            },
            "packageSpecialServices": {
                "signatureOption": (
                    "DIRECT_SIGNATURE"
                    if package.requires_signature
                    else "NO_SIGNATURE_REQUIRED"
                )
            }
        }

        if all([package.length, package.width, package.height]):
            package_data["dimensions"] = {
                "length": package.length,
                "width": package.width,
                "height": package.height,
                "units": "IN"
            }

        if package.value:
            package_data["declaredValue"] = {
                "amount": package.value,
                "currency": "USD"
            }

        if package.is_temperature_controlled and package.temperature_range:
            package_data["specialHandling"] = {
                "temperatureControl": {
                    "minimum": package.temperature_range.get("min"),
                    "maximum": package.temperature_range.get("max"),
                    "units": "FAHRENHEIT"
                }
            }

        return package_data

    async def validate_address(self, address: Address) -> Dict:
        """Validate shipping address through FedEx API."""
        try:
            data = {
                "addressesToValidate": [{
                    "address": self._format_address(address)
                }]
            }

            result = await self._make_request(
                "POST",
                "addresses/validation",
                data
            )

            validation_result = result["output"][0]
            is_valid = validation_result["resolved"] == "YES"

            audit_shipping_operation(
                operation="fedex_address_validation",
                status="success",
                metadata={
                    "address_id": str(address.id),
                    "validation_result": is_valid
                }
            )

            return {
                "valid": is_valid,
                "normalized_address": validation_result.get("normalizedAddress", {}),
                "validation_details": validation_result
            }
        except Exception as e:
            audit_shipping_operation(
                operation="fedex_address_validation",
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
        """Get FedEx shipping rates."""
        try:
            data = {
                "rateRequestControlParameters": {
                    "returnTransitTimes": True,
                    "servicesNeeded": [
                        self.SERVICE_MAPPING[service_type]
                    ] if service_type else None
                },
                "requestedShipment": {
                    "shipper": self._format_address(from_address),
                    "recipient": self._format_address(to_address),
                    "requestedPackageLineItems": [
                        self._format_package(package)
                    ],
                    "pickupType": "DROPOFF_AT_FEDEX_LOCATION",
                    "shippingChargesPayment": {
                        "paymentType": "SENDER"
                    }
                }
            }

            result = await self._make_request(
                "POST",
                "rate",
                data
            )

            rates = []
            for rate_detail in result["output"]["rateReplyDetails"]:
                service_type = next(
                    (k for k, v in self.SERVICE_MAPPING.items()
                     if v == rate_detail["serviceType"]),
                    None
                )
                if service_type:
                    rates.append(ShippingRate(
                        carrier="FEDEX",
                        service_type=service_type,
                        rate=float(
                            rate_detail["ratedShipmentDetails"][0]["totalNetCharge"]
                        ),
                        currency=rate_detail["currency"],
                        delivery_days=rate_detail.get("transitTime", {}).get("days"),
                        guaranteed_delivery=rate_detail.get(
                            "guaranteedDelivery",
                            False
                        ),
                        tracking_included=True
                    ))

            audit_shipping_operation(
                operation="fedex_rate_request",
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
                operation="fedex_rate_request",
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
        """Create FedEx shipping label."""
        try:
            data = {
                "requestedShipment": {
                    "shipper": self._format_address(from_address),
                    "recipient": self._format_address(to_address),
                    "serviceType": self.SERVICE_MAPPING[service_type],
                    "packagingType": "YOUR_PACKAGING",
                    "requestedPackageLineItems": [
                        self._format_package(package)
                    ],
                    "labelSpecification": {
                        "imageType": "PDF",
                        "labelStockType": "PAPER_4X6"
                    },
                    "shippingChargesPayment": {
                        "paymentType": "SENDER",
                        "payor": {
                            "responsibleParty": {
                                "accountNumber": get_settings().fedex_account_number
                            }
                        }
                    },
                    "customerReferences": [
                        {
                            "customerReferenceType": "CUSTOMER_REFERENCE",
                            "value": reference or "Medical Supplies"
                        }
                    ] if reference else None
                }
            }

            result = await self._make_request(
                "POST",
                "ship",
                data
            )

            tracking_number = result["output"]["transactionShipments"][0]["masterTrackingNumber"]
            label_data = result["output"]["transactionShipments"][0]["pieceResponses"][0]["labelDocuments"][0]["encodedLabel"]

            # Store label in S3 and get URL
            label_url = await self._store_label(label_data, tracking_number)

            audit_shipping_operation(
                operation="fedex_label_creation",
                status="success",
                metadata={
                    "tracking_number": tracking_number,
                    "from_address": str(from_address.id),
                    "to_address": str(to_address.id)
                }
            )

            return ShippingLabel(
                carrier="FEDEX",
                tracking_number=tracking_number,
                label_url=label_url,
                label_data=label_data,
                expires_at=datetime.utcnow() + timedelta(days=7)
            )
        except Exception as e:
            audit_shipping_operation(
                operation="fedex_label_creation",
                status="error",
                error=str(e),
                metadata={
                    "from_address": str(from_address.id),
                    "to_address": str(to_address.id)
                }
            )
            raise

    async def track_shipment(self, tracking_number: str) -> TrackingInfo:
        """Track FedEx shipment."""
        try:
            data = {
                "trackingInfo": [{
                    "trackingNumberInfo": {
                        "trackingNumber": tracking_number
                    }
                }]
            }

            result = await self._make_request(
                "POST",
                "track",
                data
            )

            track_detail = result["output"]["completeTrackResults"][0]["trackResults"][0]
            
            status_mapping = {
                "IN_TRANSIT": TrackingStatus.IN_TRANSIT,
                "DELIVERED": TrackingStatus.DELIVERED,
                "EXCEPTION": TrackingStatus.EXCEPTION,
                "PENDING": TrackingStatus.PENDING
            }

            events = []
            for scan in track_detail.get("scanEvents", []):
                events.append(TrackingEvent(
                    timestamp=datetime.fromisoformat(scan["date"]),
                    status=status_mapping.get(
                        scan["eventType"],
                        TrackingStatus.IN_TRANSIT
                    ),
                    location=scan.get("scanLocation", {}).get("city"),
                    description=scan.get("eventDescription", ""),
                    details=scan
                ))

            audit_shipping_operation(
                operation="fedex_tracking",
                status="success",
                metadata={
                    "tracking_number": tracking_number,
                    "current_status": track_detail["latestStatusDetail"]["code"]
                }
            )

            return TrackingInfo(
                carrier="FEDEX",
                tracking_number=tracking_number,
                current_status=status_mapping.get(
                    track_detail["latestStatusDetail"]["code"],
                    TrackingStatus.IN_TRANSIT
                ),
                estimated_delivery=datetime.fromisoformat(
                    track_detail["estimatedDeliveryTimeWindow"]["window"]["ends"]
                ) if "estimatedDeliveryTimeWindow" in track_detail else None,
                events=events,
                last_updated=datetime.utcnow()
            )
        except Exception as e:
            audit_shipping_operation(
                operation="fedex_tracking",
                status="error",
                error=str(e),
                metadata={"tracking_number": tracking_number}
            )
            raise 