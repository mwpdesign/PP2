"""
UPS carrier service implementation.
Implements HIPAA-compliant shipping operations for UPS.
"""

from typing import Dict, List
from datetime import datetime
import httpx
from fastapi import HTTPException

from app.core.config import settings
from app.services.carriers.base import BaseCarrier


class UPSCarrier(BaseCarrier):
    """UPS carrier service implementation."""

    def __init__(self, api_key: str, account_number: str):
        """Initialize UPS carrier service."""
        super().__init__("UPS")
        self.api_key = api_key
        self.account_number = account_number
        self.base_url = (
            "https://wwwcie.ups.com/api"
            if settings.test_mode
            else "https://onlinetools.ups.com/api"
        )
        self.client = httpx.AsyncClient()

    async def get_rates(
        self,
        package_info: Dict,
        destination: Dict
    ) -> List[Dict]:
        """Get shipping rates from UPS."""
        try:
            response = await self.client.post(
                f"{self.base_url}/rating/v1/rate",
                json={
                    "RateRequest": {
                        "Request": {
                            "TransactionReference": {"CustomerContext": "Rate Request"}
                        },
                        "Shipment": {
                            "Package": {
                                "PackagingType": {"Code": "02"},
                                "Dimensions": {
                                    "UnitOfMeasurement": {"Code": "IN"},
                                    "Length": str(package_info["length"]),
                                    "Width": str(package_info["width"]),
                                    "Height": str(package_info["height"]),
                                },
                                "PackageWeight": {
                                    "UnitOfMeasurement": {"Code": "LBS"},
                                    "Weight": str(package_info["weight"]),
                                },
                            },
                            "ShipTo": {
                                "Address": {
                                    "AddressLine": destination["street"],
                                    "City": destination["city"],
                                    "StateProvinceCode": destination["state"],
                                    "PostalCode": destination["postal_code"],
                                    "CountryCode": destination["country"],
                                }
                            },
                        },
                    }
                },
                headers=self._get_headers(),
            )
            response.raise_for_status()
            data = response.json()

            return [
                {
                    "service": rate["Service"]["Code"],
                    "carrier": "UPS",
                    "total_cost": float(rate["TotalCharges"]["MonetaryValue"]),
                    "currency": rate["TotalCharges"]["CurrencyCode"],
                    "delivery_days": rate.get("GuaranteedDaysToDelivery"),
                    "service_name": self._get_service_name(rate["Service"]["Code"]),
                }
                for rate in data["RateResponse"]["RatedShipment"]
            ]

        except Exception as e:
            raise HTTPException(
                status_code=500, detail=f"Failed to get UPS rates: {str(e)}"
            )

    async def create_label(self, shipment_info: Dict) -> Dict:
        """Create shipping label with UPS."""
        try:
            response = await self.client.post(
                f"{self.base_url}/shipping/v1/ship",
                json={
                    "ShipmentRequest": {
                        "Request": {
                            "TransactionReference": {"CustomerContext": "Label Request"}
                        },
                        "Shipment": {
                            "Description": shipment_info.get(
                                "description", "Medical Supplies"
                            ),
                            "Package": {
                                "PackagingType": {"Code": "02"},
                                "Dimensions": {
                                    "UnitOfMeasurement": {"Code": "IN"},
                                    "Length": str(shipment_info["length"]),
                                    "Width": str(shipment_info["width"]),
                                    "Height": str(shipment_info["height"]),
                                },
                                "PackageWeight": {
                                    "UnitOfMeasurement": {"Code": "LBS"},
                                    "Weight": str(shipment_info["weight"]),
                                },
                            },
                            "ShipTo": {
                                "Address": self._format_address(
                                    shipment_info["to_address"]
                                )
                            },
                            "ShipFrom": {
                                "Address": self._format_address(
                                    shipment_info["from_address"]
                                )
                            },
                            "Service": {"Code": shipment_info["service_code"]},
                            "PaymentInformation": {
                                "ShipmentCharge": {
                                    "Type": "01",
                                    "BillShipper": {
                                        "AccountNumber": self.account_number
                                    },
                                }
                            },
                        },
                        "LabelSpecification": {"LabelImageFormat": {"Code": "GIF"}},
                    }
                },
                headers=self._get_headers(),
            )
            response.raise_for_status()
            data = response.json()

            shipment_results = data["ShipmentResponse"]["ShipmentResults"]
            tracking_number = shipment_results["TrackingNumber"]
            label_image = shipment_results["PackageResults"]["ShippingLabel"][
                "GraphicImage"
            ]

            return {
                "tracking_number": tracking_number,
                "label_url": self._store_label(label_image),
                "carrier": "UPS",
                "service": shipment_info["service_code"],
                "created_at": datetime.utcnow(),
            }

        except Exception as e:
            raise HTTPException(
                status_code=500, detail=f"Failed to create UPS label: {str(e)}"
            )

    async def track_shipment(self, tracking_number: str) -> Dict:
        """Track UPS shipment."""
        try:
            response = await self.client.post(
                f"{self.base_url}/track/v1/details",
                json={
                    "TrackRequest": {
                        "Request": {
                            "TransactionReference": {"CustomerContext": "Track Request"}
                        },
                        "InquiryNumber": tracking_number,
                    }
                },
                headers=self._get_headers(),
            )
            response.raise_for_status()
            data = response.json()

            package = data["TrackResponse"]["Shipment"][0]["Package"][0]
            current_status = package["Activity"][0]

            return {
                "status": self._get_status_description(
                    current_status["Status"]["Code"]
                ),
                "location": (
                    current_status.get(
                        "Location",
                        {}).get("Address",
                        {}).get("City"
                    )
                ),
                "estimated_delivery": (
                    data["TrackResponse"]["Shipment"][0].get("ScheduledDeliveryDate")
                ),
                "history": [
                    {
                        "timestamp": f"{activity['Date']}T{activity['Time']}",
                        "status": self._get_status_description(
                            activity["Status"]["Code"]
                        ),
                        "location": (
                            activity.get(
                                "Location",
                                {}).get("Address",
                                {}).get("City"
                            )
                        ),
                        "description": activity["Status"]["Description"],
                    }
                    for activity in package["Activity"]
                ],
                "carrier": "UPS",
                "tracking_number": tracking_number,
                "last_updated": datetime.utcnow(),
            }

        except Exception as e:
            raise HTTPException(
                status_code=500, detail=f"Failed to track UPS shipment: {str(e)}"
            )

    async def validate_address(self, address: Dict) -> Dict:
        """Validate address with UPS."""
        try:
            response = await self.client.post(
                f"{self.base_url}/addressvalidation/v1/validation",
                json={
                    "XAVRequest": {
                        "AddressKeyFormat": {
                            "AddressLine": [address["street"]],
                            "PoliticalDivision2": address["city"],
                            "PoliticalDivision1": address["state"],
                            "PostcodePrimaryLow": address["postal_code"],
                            "CountryCode": address["country"],
                        }
                    }
                },
                headers=self._get_headers(),
            )
            response.raise_for_status()
            data = response.json()

            is_valid = bool(data["XAVResponse"].get("ValidAddressIndicator"))
            suggested = (
                data["XAVResponse"]
                .get("CandidateAddressList", [{}])[0]
                .get("AddressKeyFormat", {})
            )

            return {
                "is_valid": is_valid,
                "suggested_address": (
                    {
                        "street": suggested.get("AddressLine", [None])[0],
                        "city": suggested.get("PoliticalDivision2"),
                        "state": suggested.get("PoliticalDivision1"),
                        "postal_code": suggested.get("PostcodePrimaryLow"),
                        "country": suggested.get("CountryCode"),
                    }
                    if suggested
                    else None
                ),
                "errors": [] if is_valid else ["Invalid address"],
            }

        except Exception as e:
            raise HTTPException(
                status_code=500, detail=f"Failed to validate UPS address: {str(e)}"
            )

    def _get_headers(self) -> Dict:
        """Get UPS API headers."""
        return {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

    def _get_service_name(self, code: str) -> str:
        """Get service name from UPS service code."""
        service_map = {
            "01": "Next Day Air",
            "02": "2nd Day Air",
            "03": "Ground",
            "12": "3 Day Select",
            "13": "Next Day Air Saver",
            "14": "UPS Next Day Air Early",
            "59": "2nd Day Air A.M.",
        }
        return service_map.get(code, "Unknown")

    def _get_status_description(self, code: str) -> str:
        """Get status description from UPS status code."""
        status_map = {
            "I": "In Transit",
            "D": "Delivered",
            "X": "Exception",
            "P": "Pickup",
            "O": "Out for Delivery",
            "M": "Manifest Pickup",
            "R": "Return to Sender",
        }
        return status_map.get(code, "Unknown")

    def _store_label(self, label_data: str) -> str:
        """Store shipping label and return URL."""
        # TODO: Implement label storage (S3, etc.)
        return f"https://example.com/labels/{label_data[:10]}.gif"

    def _format_address(self, address: Dict) -> Dict:
        """Format address for UPS API."""
        return {
            "AddressLine": [address["street"]],
            "City": address["city"],
            "StateProvinceCode": address["state"],
            "PostalCode": address["postal_code"],
            "CountryCode": address["country"],
        }
