"""UPS shipping provider implementation."""
from typing import Dict, Any, Optional, List
import requests
from datetime import datetime

from app.core.config import settings
from app.core.exceptions import ShippingException
from app.core.audit import audit_shipping_operation
from app.services.shipping_types import (
    ShippingProvider, Address, Package, ShippingRate,
    ShippingLabel, TrackingInfo, ShippingServiceType,
    TrackingStatus, TrackingEvent
)


class UPSProvider(ShippingProvider):
    """UPS shipping provider."""

    SERVICE_MAPPING = {
        ShippingServiceType.GROUND: "03",  # UPS Ground
        ShippingServiceType.EXPRESS: "02",  # UPS 2nd Day Air
        ShippingServiceType.OVERNIGHT: "01",  # UPS Next Day Air
        ShippingServiceType.PRIORITY: "13",  # UPS Next Day Air Saver
        ShippingServiceType.ECONOMY: "11"  # UPS Standard
    }

    def __init__(self, api_key: str, test_mode: bool = False):
        """Initialize UPS provider."""
        super().__init__(api_key, test_mode)
        self.user_id = settings.ups_user_id
        self.password = settings.ups_password
        self.account_number = settings.ups_account_number
        self.base_url = (
            "https://wwwcie.ups.com/api"
            if test_mode
            else "https://onlinetools.ups.com/api"
        )

    async def validate_address(self, address: Address) -> Dict:
        """Validate shipping address."""
        raise NotImplementedError()

    async def get_rates(
        self,
        from_address: Address,
        to_address: Address,
        package: Package,
        service_type: Optional[ShippingServiceType] = None
    ) -> List[ShippingRate]:
        """Get shipping rates."""
        raise NotImplementedError()

    async def create_label(
        self,
        from_address: Address,
        to_address: Address,
        package: Package,
        service_type: ShippingServiceType,
        reference: Optional[str] = None
    ) -> ShippingLabel:
        """Create shipping label."""
        try:
            # Log shipment creation attempt
            audit_shipping_operation(
                operation="create_label",
                carrier="UPS",
                details={
                    "service_type": service_type,
                    "reference": reference
                }
            )

            # Mock response for test mode
            if self.test_mode:
                return self._mock_label_response(service_type)

            raise NotImplementedError("UPS label creation not implemented")
        except Exception as e:
            # Log failed label creation
            audit_shipping_operation(
                operation="create_label",
                carrier="UPS",
                status="error",
                details={"error": str(e)}
            )
            raise ShippingException(f"UPS label error: {str(e)}")

    async def track_shipment(self, tracking_number: str) -> TrackingInfo:
        """Track a UPS shipment."""
        try:
            # Log tracking attempt
            audit_shipping_operation(
                operation="track_shipment",
                carrier="UPS",
                details={"tracking_number": tracking_number}
            )

            # Mock response for test mode
            if self.test_mode:
                return self._mock_tracking_response(tracking_number)

            # Prepare tracking request
            endpoint = f"{self.base_url}/track/v1/details/{tracking_number}"
            headers = self._get_auth_headers()

            # Make API request
            response = requests.get(
                endpoint,
                headers=headers
            )

            if response.status_code != 200:
                raise ShippingException(
                    f"UPS API error: {response.text}"
                )

            result = response.json()

            # Log successful tracking
            audit_shipping_operation(
                operation="track_shipment",
                carrier="UPS",
                status="success",
                details=result
            )

            return self._parse_tracking_response(result)
        except Exception as e:
            # Log failed tracking
            audit_shipping_operation(
                operation="track_shipment",
                carrier="UPS",
                status="error",
                details={"error": str(e)}
            )
            raise ShippingException(f"UPS tracking error: {str(e)}")

    def _get_auth_headers(self) -> Dict[str, str]:
        """Get UPS API authentication headers."""
        return {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "transId": datetime.utcnow().strftime("%Y%m%d%H%M%S"),
            "transactionSrc": "testing" if self.test_mode else "production"
        }

    def _mock_label_response(
        self,
        service_type: ShippingServiceType
    ) -> ShippingLabel:
        """Generate mock label response for test mode."""
        return ShippingLabel(
            carrier="UPS",
            tracking_number="1Z999999999999999",
            label_url="https://example.com/test-label.pdf",
            service=service_type,
            rate=10.99,
            created_at=datetime.utcnow()
        )

    def _mock_tracking_response(
        self,
        tracking_number: str
    ) -> TrackingInfo:
        """Generate mock tracking response for test mode."""
        current_time = datetime.utcnow()
        return TrackingInfo(
            carrier="UPS",
            tracking_number=tracking_number,
            status=TrackingStatus.IN_TRANSIT,
            location="Test Location",
            estimated_delivery=current_time.replace(
                hour=17, minute=0, second=0
            ),
            history=[
                TrackingEvent(
                    status=TrackingStatus.IN_TRANSIT,
                    timestamp=current_time,
                    location="Test Location",
                    description="Package in transit"
                )
            ]
        )

    def _parse_tracking_response(
        self,
        response: Dict[str, Any]
    ) -> TrackingInfo:
        """Parse UPS tracking response into TrackingInfo."""
        raise NotImplementedError()