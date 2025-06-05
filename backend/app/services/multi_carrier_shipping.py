"""
Multi-carrier shipping service that manages UPS, FedEx, and USPS providers.
"""

from typing import Dict, List, Optional
from enum import Enum

from app.core.config import get_settings
from app.core.exceptions import ShippingException
from app.services.shipping_types import (
    ShippingProvider,
    Address,
    Package,
    ShippingRate,
    ShippingLabel,
    TrackingInfo,
    ShippingServiceType,
)
from app.services.ups_provider import UPSProvider
from app.services.fedex_provider import FedExProvider
from app.services.usps_provider import USPSProvider


class CarrierType(str, Enum):
    """Supported shipping carriers."""

    UPS = "UPS"
    FEDEX = "FEDEX"
    USPS = "USPS"


class MultiCarrierShippingService:
    """Service for managing multiple shipping carriers."""

    def __init__(self):
        """Initialize shipping service with carrier providers."""
        settings = get_settings()
        self.providers: Dict[CarrierType, ShippingProvider] = {}

        # Initialize UPS provider if configured
        if settings.ups_api_key:
            self.providers[CarrierType.UPS] = UPSProvider(
                api_key=settings.ups_api_key, test_mode=settings.shipping_test_mode
            )

        # Initialize FedEx provider if configured
        if settings.fedex_api_key:
            self.providers[CarrierType.FEDEX] = FedExProvider(
                api_key=settings.fedex_api_key, test_mode=settings.shipping_test_mode
            )

        # Initialize USPS provider if configured
        if settings.usps_api_key:
            self.providers[CarrierType.USPS] = USPSProvider(
                api_key=settings.usps_api_key, test_mode=settings.shipping_test_mode
            )

    def _get_provider(
        self, carrier: Optional[CarrierType] = None) -> ShippingProvider:
        """Get shipping provider by carrier type."""
        if carrier and carrier not in self.providers:
            raise ShippingException(f"Carrier {carrier} not configured")

        if not carrier:
            # Return first available provider if none specified
            if not self.providers:
                raise ShippingException("No shipping carriers configured")
            return next(iter(self.providers.values()))

        return self.providers[carrier]

    async def validate_address(
        self, address: Address, carrier: Optional[CarrierType] = None
    ) -> Dict:
        """
        Validate shipping address with specified carrier.
        If no carrier specified, validates with all available carriers.
        """
        if carrier:
            return await self._get_provider(carrier).validate_address(address)

        results = {}
        for carrier_type, provider in self.providers.items():
            try:
                results[carrier_type] = await provider.validate_address(address)
            except Exception as e:
                results[carrier_type] = {"valid": False, "error": str(e)}

        return results

    async def get_rates(
        self,
        from_address: Address,
        to_address: Address,
        package: Package,
        service_type: Optional[ShippingServiceType] = None,
        carrier: Optional[CarrierType] = None,
    ) -> List[ShippingRate]:
        """
        Get shipping rates from specified carrier.
        If no carrier specified, gets rates from all available carriers.
        """
        if carrier:
            return await self._get_provider(carrier).get_rates(
                from_address, to_address, package, service_type
            )

        rates = []
        for provider in self.providers.values():
            try:
                carrier_rates = await provider.get_rates(
                    from_address, to_address, package, service_type
                )
                rates.extend(carrier_rates)
            except Exception:
                # Skip failed carrier and continue with others
                continue

        return sorted(rates, key=lambda x: x.rate)

    async def create_label(
        self,
        from_address: Address,
        to_address: Address,
        package: Package,
        service_type: ShippingServiceType,
        carrier: CarrierType,
        reference: Optional[str] = None,
    ) -> ShippingLabel:
        """Create shipping label with specified carrier."""
        return await self._get_provider(carrier).create_label(
            from_address, to_address, package, service_type, reference
        )

    async def track_shipment(
        self, tracking_number: str, carrier: CarrierType
    ) -> TrackingInfo:
        """Track shipment with specified carrier."""
        return await self._get_provider(carrier).track_shipment(tracking_number)

    async def get_best_rate(
        self,
        from_address: Address,
        to_address: Address,
        package: Package,
        service_type: Optional[ShippingServiceType] = None,
        preferred_carrier: Optional[CarrierType] = None,
    ) -> Optional[ShippingRate]:
        """
        Get best available rate across all carriers.
        Optionally filter by service type and preferred carrier.
        """
        rates = await self.get_rates(
            from_address, to_address, package, service_type, preferred_carrier
        )

        if not rates:
            return None

        # Sort by rate and return cheapest option
        return min(rates, key=lambda x: x.rate)

    async def create_optimal_label(
        self,
        from_address: Address,
        to_address: Address,
        package: Package,
        service_type: Optional[ShippingServiceType] = None,
        preferred_carrier: Optional[CarrierType] = None,
        reference: Optional[str] = None,
    ) -> Optional[ShippingLabel]:
        """
        Create shipping label using the best available rate.
        Optionally filter by service type and preferred carrier.
        """
        best_rate = await self.get_best_rate(
            from_address, to_address, package, service_type, preferred_carrier
        )

        if not best_rate:
            return None

        return await self.create_label(
            from_address,
            to_address,
            package,
            best_rate.service_type,
            CarrierType(best_rate.carrier),
            reference,
        )
