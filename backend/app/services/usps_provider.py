"""
USPS shipping provider implementation with HIPAA compliance.
"""

from datetime import datetime, timedelta
from typing import Dict, List, Optional
import asyncio
import xml.etree.ElementTree as ET
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
    TrackingStatus,
    TrackingEvent,
)


class USPSProvider(ShippingProvider):
    """USPS shipping provider implementation."""

    SERVICE_MAPPING = {
        ShippingServiceType.GROUND: "USPS Ground",
        ShippingServiceType.EXPRESS: "Priority Mail Express",
        ShippingServiceType.OVERNIGHT: "Priority Mail Express",
        ShippingServiceType.PRIORITY: "Priority Mail",
        ShippingServiceType.ECONOMY: "USPS Ground",
    }

    def __init__(self, api_key: str, test_mode: bool = False):
        """Initialize USPS provider with credentials."""
        super().__init__(api_key, test_mode)
        base_api = (
            "secure.shippingapis.com"
            if not test_mode
            else "stg-secure.shippingapis.com"
        )
        self.base_url = f"https://{base_api}/ShippingAPI.dll"
        self.client = httpx.AsyncClient()

    def _build_xml_request(self, api: str, data: Dict) -> str:
        """Build XML request for USPS API."""
        root = ET.Element("{}Request".format(api))
        root.set("USERID", get_settings().usps_user_id)

        for key, value in data.items():
            if isinstance(value, dict):
                child = ET.SubElement(root, key)
                for k, v in value.items():
                    subchild = ET.SubElement(child, k)
                    subchild.text = str(v)
            else:
                child = ET.SubElement(root, key)
                child.text = str(value)

        return ET.tostring(root, encoding="unicode")

    async def _make_request(self, api: str, data: Dict, retry_count: int = 0) -> Dict:
        """Make request to USPS API with retry logic."""
        if retry_count >= 3:
            raise ShippingException("Max retries exceeded for USPS API request")

        xml_data = self._build_xml_request(api, data)

        try:
            response = await self.client.get(
                self.base_url, params={"API": api, "XML": xml_data}
            )
            response.raise_for_status()

            # Parse XML response
            root = ET.fromstring(response.text)
            error = root.find(".//Error")
            if error is not None:
                error_msg = error.find("Description").text
                raise ShippingException(f"USPS API error: {error_msg}")

            return self._parse_xml_response(root)
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 429:  # Rate limit exceeded
                await asyncio.sleep(2**retry_count)
                return await self._make_request(api, data, retry_count + 1)
            raise ShippingException(f"USPS API request failed: {str(e)}")
        except Exception as e:
            raise ShippingException(f"USPS API request failed: {str(e)}")

    def _parse_xml_response(self, root: ET.Element) -> Dict:
        """Parse XML response to dictionary."""
        result = {}
        for child in root:
            if len(child) > 0:
                result[child.tag] = self._parse_xml_response(child)
            else:
                result[child.tag] = child.text
        return result

    def _format_address(self, address: Address) -> Dict:
        """Format address for USPS API."""
        addr_lines = [address.street1]
        if address.street2:
            addr_lines.append(address.street2)

        return {
            "Address": {
                "Address1": addr_lines[0],
                "Address2": addr_lines[1] if len(addr_lines) > 1 else "",
                "City": address.city,
                "State": address.state,
                "Zip5": address.postal_code[:5],
                "Zip4": address.postal_code[6:] if len(address.postal_code) > 5 else "",
            }
        }

    async def validate_address(self, address: Address) -> Dict:
        """Validate shipping address through USPS API."""
        try:
            data = self._format_address(address)
            result = await self._make_request("Verify", data)

            is_valid = "Error" not in result
            normalized = result.get("Address", {})

            audit_shipping_operation(
                operation="usps_address_validation",
                status="success",
                metadata={"address_id": str(address.id), "validation_result": is_valid},
            )

            return {
                "valid": is_valid,
                "normalized_address": normalized,
                "validation_details": result,
            }
        except Exception as e:
            audit_shipping_operation(
                operation="usps_address_validation",
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
        """Get USPS shipping rates."""
        try:
            data = {
                "RateV4Request": {
                    "Package": {
                        "Service": (
                            self.SERVICE_MAPPING[service_type]
                            if service_type
                            else "ALL"
                        ),
                        "FirstClassMailType": "PACKAGE",
                        "ZipOrigination": from_address.postal_code[:5],
                        "ZipDestination": to_address.postal_code[:5],
                        "Pounds": str(int(package.weight)),
                        "Ounces": str(round((package.weight % 1) * 16)),
                        "Container": "",
                        "Size": "REGULAR",
                        "Machinable": "true",
                    }
                }
            }

            if all([package.length, package.width, package.height]):
                data["RateV4Request"]["Package"].update(
                    {
                        "Container": "RECTANGULAR",
                        "Size": "LARGE",
                        "Length": str(package.length),
                        "Width": str(package.width),
                        "Height": str(package.height),
                        "Girth": str(2 * (package.width + package.height)),
                    }
                )

            result = await self._make_request("RateV4", data)

            rates = []
            for rate in result.get("Package", {}).get("Postage", []):
                service_name = rate.get("MailService", "")
                service_type = next(
                    (k for k, v in self.SERVICE_MAPPING.items() if v in service_name),
                    None,
                )
                if service_type:
                    rates.append(
                        ShippingRate(
                            carrier="USPS",
                            service_type=service_type,
                            rate=float(rate["Rate"]),
                            currency="USD",
                            delivery_days=self._parse_delivery_days(service_name),
                            guaranteed_delivery="Express" in service_name,
                            tracking_included=True,
                        )
                    )

            audit_shipping_operation(
                operation="usps_rate_request",
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
                operation="usps_rate_request",
                status="error",
                error=str(e),
                metadata={
                    "from_address": str(from_address.id),
                    "to_address": str(to_address.id),
                },
            )
            raise

    def _parse_delivery_days(self, service_name: str) -> Optional[int]:
        """Parse delivery days from service name."""
        if "Express" in service_name:
            return 1
        elif "Priority" in service_name:
            return 2
        elif "Ground" in service_name:
            return 5
        return None

    async def create_label(
        self,
        from_address: Address,
        to_address: Address,
        package: Package,
        service_type: ShippingServiceType,
        reference: Optional[str] = None,
    ) -> ShippingLabel:
        """Create USPS shipping label."""
        try:
            data = {
                "LabelRequest": {
                    "FromAddress": self._format_address(from_address)["Address"],
                    "ToAddress": self._format_address(to_address)["Address"],
                    "WeightInOunces": str(round(package.weight * 16)),
                    "ServiceType": self.SERVICE_MAPPING[service_type],
                    "ImageType": "PDF",
                    "LabelType": "Default",
                    "CustomerRefNo": reference or "Medical Supplies",
                }
            }

            if all([package.length, package.width, package.height]):
                data["LabelRequest"].update(
                    {
                        "Container": "RECTANGULAR",
                        "Size": "LARGE",
                        "Length": str(package.length),
                        "Width": str(package.width),
                        "Height": str(package.height),
                        "Girth": str(2 * (package.width + package.height)),
                    }
                )

            result = await self._make_request("DelivLabel", data)

            tracking_number = result["TrackingNumber"]
            label_data = result["LabelImage"]

            # Store label in S3 and get URL
            label_url = await self._store_label(label_data, tracking_number)

            audit_shipping_operation(
                operation="usps_label_creation",
                status="success",
                metadata={
                    "tracking_number": tracking_number,
                    "from_address": str(from_address.id),
                    "to_address": str(to_address.id),
                },
            )

            return ShippingLabel(
                carrier="USPS",
                tracking_number=tracking_number,
                label_url=label_url,
                label_data=label_data,
                expires_at=datetime.utcnow() + timedelta(days=7),
            )
        except Exception as e:
            audit_shipping_operation(
                operation="usps_label_creation",
                status="error",
                error=str(e),
                metadata={
                    "from_address": str(from_address.id),
                    "to_address": str(to_address.id),
                },
            )
            raise

    async def track_shipment(self, tracking_number: str) -> TrackingInfo:
        """Track USPS shipment."""
        try:
            data = {"TrackFieldRequest": {"TrackID": {"ID": tracking_number}}}

            result = await self._make_request("TrackV2", data)
            track_info = result["TrackInfo"]

            status_mapping = {
                "Delivered": TrackingStatus.DELIVERED,
                "In Transit": TrackingStatus.IN_TRANSIT,
                "Out for Delivery": TrackingStatus.OUT_FOR_DELIVERY,
                "Exception": TrackingStatus.EXCEPTION,
                "Return to Sender": TrackingStatus.RETURNED,
            }

            events = []
            for event in track_info.get("TrackDetail", []):
                status = next(
                    (k for k, v in status_mapping.items() if k in event),
                    TrackingStatus.IN_TRANSIT,
                )
                events.append(
                    TrackingEvent(
                        timestamp=datetime.strptime(
                            event["EventDate"] + " " + event["EventTime"],
                            "%B %d, %Y %I:%M %p",
                        ),
                        status=status,
                        location=event.get("EventCity", ""),
                        description=event["Event"],
                        details=event,
                    )
                )

            audit_shipping_operation(
                operation="usps_tracking",
                status="success",
                metadata={
                    "tracking_number": tracking_number,
                    "current_status": track_info["Status"],
                },
            )

            return TrackingInfo(
                carrier="USPS",
                tracking_number=tracking_number,
                current_status=status_mapping.get(
                    track_info["Status"], TrackingStatus.IN_TRANSIT
                ),
                estimated_delivery=(
                    datetime.strptime(track_info["ExpectedDeliveryDate"], "%B %d, %Y")
                    if "ExpectedDeliveryDate" in track_info
                    else None
                ),
                events=events,
                last_updated=datetime.utcnow(),
            )
        except Exception as e:
            audit_shipping_operation(
                operation="usps_tracking",
                status="error",
                error=str(e),
                metadata={"tracking_number": tracking_number},
            )
            raise
