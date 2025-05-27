"""
Base carrier service implementation.
Defines common functionality for all carrier services.
"""
from abc import ABC, abstractmethod
from typing import Dict, List


class BaseCarrier(ABC):
    """Base carrier service implementation."""

    def __init__(self, name: str):
        """Initialize base carrier service."""
        self.name = name

    @abstractmethod
    async def get_rates(
        self,
        package_info: Dict,
        destination: Dict
    ) -> List[Dict]:
        """Get shipping rates from carrier."""
        pass

    @abstractmethod
    async def create_label(
        self,
        shipment_info: Dict
    ) -> Dict:
        """Create shipping label with carrier."""
        pass

    @abstractmethod
    async def track_shipment(
        self,
        tracking_number: str
    ) -> Dict:
        """Track shipment with carrier."""
        pass

    @abstractmethod
    async def validate_address(
        self,
        address: Dict
    ) -> Dict:
        """Validate address with carrier."""
        pass