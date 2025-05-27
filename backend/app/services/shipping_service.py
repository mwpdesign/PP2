"""
Shipping service for multi-carrier integration.
Implements HIPAA-compliant shipping operations.
"""
from typing import Dict, List, Optional
from datetime import datetime
from fastapi import HTTPException

from app.core.config import settings
from app.core.exceptions import ValidationError
from app.services.carriers.ups import UPSCarrier
from app.services.carriers.usps import USPSCarrier
from app.services.fedex_provider import FedExProvider


class ShippingService:
    def __init__(self):
        self.carriers = {
            "ups": UPSCarrier(
                api_key=settings.UPS_API_KEY,
                account_number=settings.UPS_ACCOUNT_NUMBER
            ),
            "fedex": FedExProvider(
                api_key=settings.FEDEX_API_KEY,
                test_mode=settings.shipping_test_mode
            ),
            "usps": USPSCarrier(
                api_key=settings.USPS_API_KEY,
                account_number=settings.USPS_ACCOUNT_NUMBER
            )
        }

    async def get_shipping_rates(
        self,
        package_info: Dict,
        destination: Dict,
        preferred_carrier: Optional[str] = None
    ) -> List[Dict]:
        """Get shipping rates from available carriers."""
        try:
            rates = []
            carriers = (
                [self.carriers[preferred_carrier]]
                if preferred_carrier
                else self.carriers.values()
            )

            for carrier in carriers:
                try:
                    carrier_rates = await carrier.get_rates(
                        package_info,
                        destination
                    )
                    rates.extend(carrier_rates)
                except Exception as e:
                    # Log carrier-specific error but continue with others
                    print(f"Error getting rates from {carrier}: {str(e)}")

            if not rates:
                raise ValidationError("No shipping rates available")

            return sorted(rates, key=lambda x: x["total_cost"])

        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to get shipping rates: {str(e)}"
            )

    async def create_shipping_label(
        self,
        carrier: str,
        shipment_info: Dict
    ) -> Dict:
        """Create shipping label with selected carrier."""
        try:
            if carrier not in self.carriers:
                raise ValidationError(f"Invalid carrier: {carrier}")

            carrier_service = self.carriers[carrier]
            label = await carrier_service.create_label(shipment_info)

            return {
                "tracking_number": label["tracking_number"],
                "label_url": label["label_url"],
                "carrier": carrier,
                "created_at": datetime.utcnow()
            }

        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to create shipping label: {str(e)}"
            )

    async def track_shipment(
        self,
        carrier: str,
        tracking_number: str
    ) -> Dict:
        """Track shipment status."""
        try:
            if carrier not in self.carriers:
                raise ValidationError(f"Invalid carrier: {carrier}")

            carrier_service = self.carriers[carrier]
            tracking_info = await carrier_service.track_shipment(
                tracking_number
            )

            return {
                "status": tracking_info["status"],
                "location": tracking_info.get("location"),
                "estimated_delivery": tracking_info.get("estimated_delivery"),
                "history": tracking_info.get("history", []),
                "last_updated": datetime.utcnow()
            }

        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to track shipment: {str(e)}"
            )

    async def validate_address(
        self,
        address: Dict,
        carrier: Optional[str] = None
    ) -> Dict:
        """Validate shipping address."""
        try:
            validation_results = []
            carriers = (
                [self.carriers[carrier]]
                if carrier
                else self.carriers.values()
            )

            for carrier_service in carriers:
                try:
                    result = await carrier_service.validate_address(address)
                    validation_results.append({
                        "carrier": carrier_service.name,
                        "is_valid": result["is_valid"],
                        "suggested_address": result.get("suggested_address"),
                        "errors": result.get("errors", [])
                    })
                except Exception as e:
                    print(
                        "Error validating address with "
                        f"{carrier_service}: {str(e)}"
                    )

            if not validation_results:
                raise ValidationError("Address validation failed")

            return {
                "is_valid": any(r["is_valid"] for r in validation_results),
                "results": validation_results,
                "validated_at": datetime.utcnow()
            }

        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to validate address: {str(e)}"
            )

    async def estimate_delivery_date(
        self,
        carrier: str,
        service_type: str,
        origin: Dict,
        destination: Dict
    ) -> Dict:
        """Estimate delivery date for shipment."""
        try:
            if carrier not in self.carriers:
                raise ValidationError(f"Invalid carrier: {carrier}")

            carrier_service = self.carriers[carrier]
            estimate = await carrier_service.estimate_delivery(
                service_type,
                origin,
                destination
            )

            return {
                "estimated_date": estimate["delivery_date"],
                "service_type": service_type,
                "carrier": carrier,
                "confidence_level": estimate.get("confidence_level"),
                "estimated_at": datetime.utcnow()
            }

        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to estimate delivery date: {str(e)}"
            )