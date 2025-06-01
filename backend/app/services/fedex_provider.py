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
    ShippingProvider,
    Address,
    Package,
    ShippingRate,
    ShippingLabel,
    TrackingInfo,
    ShippingServiceType,
    TrackingEvent,
)


class FedExProvider(ShippingProvider):
    """FedEx shipping provider implementation."""

    SERVICE_MAPPING = {
        ShippingServiceType.GROUND: "FEDEX_GROUND",
        ShippingServiceType.EXPRESS: "FEDEX_EXPRESS_SAVER",
        ShippingServiceType.OVERNIGHT: "FEDEX_PRIORITY_OVERNIGHT",
        ShippingServiceType.PRIORITY: "FEDEX_2_DAY",
        ShippingServiceType.ECONOMY: "FEDEX_GROUND_HOME_DELIVERY",
    }

    def __init__(self, api_key: str, test_mode: bool = False):
        """Initialize FedEx provider with credentials."""
        super().__init__(api_key, test_mode)
        self.base_url = (
            "https://apis-sandbox.fedex.com" if test_mode else "https://apis.fedex.com"
        )
        self._token = None
        self._token_expires = None
        self._rate_limit = httpx.Limits(max_keepalive_connections=5, max_connections=10)
        self.client = httpx.AsyncClient(limits=self._rate_limit)

    async def _get_token(self) -> str:
        """Get OAuth token for FedEx API access."""
        settings = get_settings()
        auth_url = f"{self.base_url}/oauth/token"

        if (
            self._token
            and self._token_expires
            and self._token_expires > datetime.utcnow()
        ):
            return self._token

        try:
            auth_data = {
                "grant_type": "client_credentials",
                "client_id": settings.fedex_client_id,
                "client_secret": settings.fedex_client_secret,
            }
            response = await self.client.post(
                auth_url,
                data=auth_data,
                headers={"Content-Type": "application/x-www-form-urlencoded"},
            )
            response.raise_for_status()
            data = response.json()

            self._token = data["access_token"]
            expires_in = data["expires_in"]
            self._token_expires = datetime.utcnow() + timedelta(seconds=expires_in)

            audit_shipping_operation(
                operation="fedex_auth",
                status="success",
                metadata={"expires_in": expires_in},
            )

            return self._token
        except Exception as e:
            audit_shipping_operation(
                operation="fedex_auth", status="error", error=str(e)
            )
            error_msg = f"FedEx authentication failed: {str(e)}"
            raise ShippingException(error_msg)

    async def _make_request(
        self,
        method: str,
        endpoint: str,
        data: Optional[Dict] = None,
        retry_count: int = 0,
    ) -> Dict:
        """Make authenticated request to FedEx API with retry logic."""
        if retry_count >= 3:
            msg = "Max retries exceeded for FedEx API request"
            raise ShippingException(msg)

        token = await self._get_token()
        url = f"{self.base_url}/v1/{endpoint}"

        try:
            response = await self.client.request(
                method,
                url,
                json=data,
                headers={
                    "Authorization": f"Bearer {token}",
                    "Content-Type": "application/json",
                },
            )

            if response.status_code == 401 and retry_count < 3:
                self._token = None  # Force token refresh
                return await self._make_request(method, endpoint, data, retry_count + 1)

            response.raise_for_status()
            return response.json()
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 429:  # Rate limit exceeded
                await asyncio.sleep(2**retry_count)  # Exponential backoff
                return await self._make_request(method, endpoint, data, retry_count + 1)
            msg = f"FedEx API request failed: {str(e)}"
            raise ShippingException(msg)
        except Exception as e:
            msg = f"FedEx API request failed: {str(e)}"
            raise ShippingException(msg)

    def _format_address(self, address: Address) -> Dict:
        """Format address for FedEx API."""
        street_lines = (
            [address.street1, address.street2] if address.street2 else [address.street1]
        )
        return {
            "streetLines": street_lines,
            "city": address.city,
            "stateOrProvinceCode": address.state,
            "postalCode": address.postal_code,
            "countryCode": address.country,
            "residential": address.is_residential,
            "phoneNumber": address.phone,
            "emailAddress": address.email,
        }

    def _format_package(self, package: Package) -> Dict:
        """Format package for FedEx API."""
        sign_opt = (
            "DIRECT_SIGNATURE"
            if package.requires_signature
            else "NO_SIGNATURE_REQUIRED"
        )

        package_data = {
            "weight": {"value": package.weight, "units": "LB"},
            "packageSpecialServices": {"signatureOption": sign_opt},
        }

        if all([package.length, package.width, package.height]):
            package_data["dimensions"] = {
                "length": package.length,
                "width": package.width,
                "height": package.height,
                "units": "IN",
            }

        if package.value:
            package_data["declaredValue"] = {"amount": package.value, "currency": "USD"}

        if package.is_temperature_controlled:
            temp_range = package.temperature_range or {}
            temp_control = {
                "minimum": temp_range.get("min"),
                "maximum": temp_range.get("max"),
                "units": "FAHRENHEIT",
            }
            package_data["specialHandling"] = {"temperatureControl": temp_control}

        return package_data

    async def validate_address(self, address: Address) -> Dict:
        """Validate shipping address through FedEx API."""
        try:
            data = {"addressesToValidate": [{"address": self._format_address(address)}]}

            result = await self._make_request("POST", "addresses/validation", data)

            validation_result = result["output"][0]
            is_valid = validation_result["resolved"] == "YES"
            normalized = validation_result.get("normalizedAddress", {})

            audit_shipping_operation(
                operation="fedex_address_validation",
                status="success",
                metadata={"address_id": str(address.id), "validation_result": is_valid},
            )

            return {
                "valid": is_valid,
                "normalized_address": normalized,
                "validation_details": validation_result,
            }
        except Exception as e:
            audit_shipping_operation(
                operation="fedex_address_validation",
                status="error",
                error=str(e),
                metadata={"address_id": str(address.id)},
            )
            raise

    async def get_rates(
        self,
        from_address: Address,
        to_address: Address,
        package: Package,
        service_type: Optional[ShippingServiceType] = None,
    ) -> List[ShippingRate]:
        """Get shipping rates for a package."""
        try:
            data = {
                "accountNumber": {"value": get_settings().fedex_account_number},
                "requestedShipment": {
                    "shipper": {"address": self._format_address(from_address)},
                    "recipient": {"address": self._format_address(to_address)},
                    "pickupType": "DROPOFF_AT_FEDEX_LOCATION",
                    "serviceType": (
                        self.SERVICE_MAPPING[service_type] if service_type else None
                    ),
                    "rateRequestType": ["ACCOUNT", "LIST"],
                    "requestedPackageLineItems": [self._format_package(package)],
                },
            }

            result = await self._make_request("POST", "rate", data)

            rates = []
            rate_details = result["output"]["rateReplyDetails"]
            for rate_detail in rate_details:
                service = rate_detail["serviceType"]
                mapping = self.SERVICE_MAPPING.items()
                service_type = next((k for k, v in mapping if v == service), None)
                if service_type:
                    total_charge = rate_detail["ratedShipmentDetails"][0]
                    total_charge = total_charge["totalNetCharge"]
                    transit = rate_detail.get("transitTime", {})
                    guaranteed = rate_detail.get("guaranteedDelivery", False)

                    rates.append(
                        ShippingRate(
                            carrier="FEDEX",
                            service_type=service_type,
                            rate=float(total_charge),
                            currency=rate_detail["currency"],
                            delivery_days=transit.get("days"),
                            guaranteed_delivery=guaranteed,
                            tracking_included=True,
                        )
                    )

            audit_shipping_operation(
                operation="fedex_rate_request",
                status="success",
                metadata={
                    "from_address": str(from_address.id),
                    "to_address": str(to_address.id),
                    "rates_count": len(rates),
                },
            )

            return rates
        except Exception as e:
            audit_shipping_operation(
                operation="fedex_rate_request",
                status="error",
                error=str(e),
                metadata={
                    "from_address": str(from_address.id),
                    "to_address": str(to_address.id),
                },
            )
            raise

    async def create_label(
        self,
        from_address: Address,
        to_address: Address,
        package: Package,
        service_type: ShippingServiceType,
        reference: Optional[str] = None,
    ) -> ShippingLabel:
        """Create shipping label through FedEx API."""
        try:
            data = {
                "accountNumber": {"value": get_settings().fedex_account_number},
                "requestedShipment": {
                    "shipper": {"address": self._format_address(from_address)},
                    "recipient": {"address": self._format_address(to_address)},
                    "serviceType": self.SERVICE_MAPPING[service_type],
                    "labelSpecification": {
                        "imageType": "PDF",
                        "labelStockType": "PAPER_4X6",
                    },
                    "requestedPackageLineItems": [self._format_package(package)],
                },
            }

            if reference:
                data["requestedShipment"]["customerReferences"] = [
                    {"customerReferenceType": "CUSTOMER_REFERENCE", "value": reference}
                ]

            result = await self._make_request("POST", "ship", data)

            # Extract tracking and label data
            shipment = result["output"]["transactionShipments"][0]
            tracking_number = shipment["masterTrackingNumber"]
            piece_response = shipment["pieceResponses"][0]
            label_data = piece_response["labelDocuments"][0]["encodedLabel"]

            # Store label in S3 and get URL
            label_url = await self._store_label(label_data, tracking_number)

            audit_shipping_operation(
                operation="fedex_label_creation",
                status="success",
                metadata={
                    "tracking_number": tracking_number,
                    "from_address": str(from_address.id),
                    "to_address": str(to_address.id),
                },
            )

            return ShippingLabel(
                carrier="FEDEX",
                tracking_number=tracking_number,
                label_url=label_url,
                label_data=label_data,
                expires_at=datetime.utcnow() + timedelta(days=7),
            )
        except Exception as e:
            audit_shipping_operation(
                operation="fedex_label_creation",
                status="error",
                error=str(e),
                metadata={
                    "from_address": str(from_address.id),
                    "to_address": str(to_address.id),
                },
            )
            raise

    async def track_shipment(self, tracking_number: str) -> TrackingInfo:
        """Track shipment using FedEx API."""
        try:
            tracking_info = {"trackingNumberInfo": {"trackingNumber": tracking_number}}
            data = {"trackingInfo": [tracking_info]}

            result = await self._make_request("POST", "track/v1/trackingnumbers", data)

            if not result.get("output", {}).get("completeTrackResults", []):
                raise ShippingException("No tracking data found")

            track_results = result["output"]["completeTrackResults"][0]
            tracking_details = track_results["trackResults"][0]
            scan_events = tracking_details.get("scanEvents", [])

            events = []
            for scan in scan_events:
                # Parse scan data
                timestamp = scan["date"].replace("Z", "+00:00")
                location = scan.get("scanLocation", "")
                description = scan.get("eventDescription", "")
                status = scan.get("derivedStatus", "")

                # Create tracking event
                event = TrackingEvent(
                    timestamp=datetime.fromisoformat(timestamp),
                    location=location,
                    description=description,
                    status=self._map_tracking_status(status),
                )
                events.append(event)

            # Get final status
            status_detail = tracking_details.get("latestStatusDetail", {})
            derived_status = status_detail.get("derivedStatus", "")

            return TrackingInfo(
                tracking_number=tracking_number,
                status=self._map_tracking_status(derived_status),
                events=events,
            )

        except Exception as e:
            error_msg = f"Failed to track shipment: {str(e)}"
            raise ShippingException(error_msg)
