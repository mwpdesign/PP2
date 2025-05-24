"""
FedEx carrier service implementation.
Implements HIPAA-compliant shipping operations for FedEx.
"""
from typing import Dict, List
from datetime import datetime
import httpx
from fastapi import HTTPException

from app.core.config import settings
from app.services.carriers.base import BaseCarrier


class FedExCarrier(BaseCarrier):
    """FedEx carrier service implementation."""
    
    def __init__(self, api_key: str, account_number: str):
        """Initialize FedEx carrier service."""
        super().__init__("FedEx")
        self.api_key = api_key
        self.account_number = account_number
        self.base_url = (
            "https://apis-sandbox.fedex.com"
            if settings.test_mode
            else "https://apis.fedex.com"
        )
        self.client = httpx.AsyncClient()

    async def get_rates(
        self,
        package_info: Dict,
        destination: Dict
    ) -> List[Dict]:
        """Get shipping rates from FedEx."""
        try:
            response = await self.client.post(
                f"{self.base_url}/rate/v1/rates/quotes",
                json={
                    "accountNumber": {
                        "value": self.account_number
                    },
                    "requestedShipment": {
                        "shipper": {
                            "address": {
                                "streetLines": [""],
                                "city": "",
                                "stateOrProvinceCode": "",
                                "postalCode": "",
                                "countryCode": "US"
                            }
                        },
                        "recipient": {
                            "address": {
                                "streetLines": [destination["street"]],
                                "city": destination["city"],
                                "stateOrProvinceCode": destination["state"],
                                "postalCode": destination["postal_code"],
                                "countryCode": destination["country"]
                            }
                        },
                        "requestedPackageLineItems": [{
                            "weight": {
                                "units": "LB",
                                "value": package_info["weight"]
                            },
                            "dimensions": {
                                "length": package_info["length"],
                                "width": package_info["width"],
                                "height": package_info["height"],
                                "units": "IN"
                            }
                        }]
                    }
                },
                headers=self._get_headers()
            )
            response.raise_for_status()
            data = response.json()
            
            return [{
                "service": rate["serviceType"],
                "carrier": "FedEx",
                "total_cost": float(rate["rateDetails"][0]["totalNetCharge"]),
                "currency": rate["rateDetails"][0]["currency"],
                "delivery_days": rate.get("transitTime"),
                "service_name": self._get_service_name(rate["serviceType"])
            } for rate in data["output"]["rateReplyDetails"]]
            
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to get FedEx rates: {str(e)}"
            )

    async def create_label(self, shipment_info: Dict) -> Dict:
        """Create shipping label with FedEx."""
        try:
            response = await self.client.post(
                f"{self.base_url}/ship/v1/shipments",
                json={
                    "requestedShipment": {
                        "shipper": {
                            "address": self._format_address(
                                shipment_info["from_address"]
                            )
                        },
                        "recipient": {
                            "address": self._format_address(
                                shipment_info["to_address"]
                            )
                        },
                        "serviceType": shipment_info["service_code"],
                        "packagingType": "YOUR_PACKAGING",
                        "requestedPackageLineItems": [{
                            "weight": {
                                "units": "LB",
                                "value": shipment_info["weight"]
                            },
                            "dimensions": {
                                "length": shipment_info["length"],
                                "width": shipment_info["width"],
                                "height": shipment_info["height"],
                                "units": "IN"
                            }
                        }],
                        "labelSpecification": {
                            "imageType": "PDF",
                            "labelStockType": "PAPER_4X6"
                        }
                    },
                    "accountNumber": {
                        "value": self.account_number
                    }
                },
                headers=self._get_headers()
            )
            response.raise_for_status()
            data = response.json()
            
            completed_shipment = data["output"]["completedShipmentDetail"]
            tracking_number = (
                completed_shipment["masterTrackingId"]["trackingNumber"]
            )
            label_details = completed_shipment["shipmentDocuments"][0]
            
            return {
                "tracking_number": tracking_number,
                "label_url": self._store_label(label_details["url"]),
                "carrier": "FedEx",
                "service": shipment_info["service_code"],
                "created_at": datetime.utcnow()
            }
            
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to create FedEx label: {str(e)}"
            )

    async def track_shipment(self, tracking_number: str) -> Dict:
        """Track FedEx shipment."""
        try:
            response = await self.client.post(
                f"{self.base_url}/track/v1/trackingnumbers",
                json={
                    "trackingInfo": [{
                        "trackingNumberInfo": {
                            "trackingNumber": tracking_number
                        }
                    }]
                },
                headers=self._get_headers()
            )
            response.raise_for_status()
            data = response.json()
            
            track_details = (
                data["output"]["completeTrackResults"][0]
                ["trackResults"][0]
            )
            latest_status = track_details["latestStatusDetail"]
            
            return {
                "status": self._get_status_description(
                    latest_status["code"]
                ),
                "location": (
                    latest_status.get("scanLocation", "")
                    .split(",")[0]
                    .strip()
                ),
                "estimated_delivery": track_details.get(
                    "estimatedDeliveryTimestamp"
                ),
                "history": [{
                    "timestamp": event["date"],
                    "status": self._get_status_description(
                        event["eventType"]
                    ),
                    "location": (
                        event.get("scanLocation", "")
                        .split(",")[0]
                        .strip()
                    ),
                    "description": event["description"]
                } for event in track_details["scanEvents"]],
                "carrier": "FedEx",
                "tracking_number": tracking_number,
                "last_updated": datetime.utcnow()
            }
            
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to track FedEx shipment: {str(e)}"
            )

    async def validate_address(self, address: Dict) -> Dict:
        """Validate address with FedEx."""
        try:
            response = await self.client.post(
                f"{self.base_url}/address/v1/addresses/validation",
                json={
                    "addressesToValidate": [{
                        "address": {
                            "streetLines": [address["street"]],
                            "city": address["city"],
                            "stateOrProvinceCode": address["state"],
                            "postalCode": address["postal_code"],
                            "countryCode": address["country"]
                        }
                    }]
                },
                headers=self._get_headers()
            )
            response.raise_for_status()
            data = response.json()
            
            result = data["output"]["resolvedAddresses"][0]
            is_valid = result["deliveryPoint"] == "CONFIRMED"
            
            return {
                "is_valid": is_valid,
                "suggested_address": {
                    "street": result["streetLines"][0],
                    "city": result["city"],
                    "state": result["stateOrProvinceCode"],
                    "postal_code": result["postalCode"],
                    "country": result["countryCode"]
                } if is_valid else None,
                "errors": [] if is_valid else ["Invalid address"]
            }
            
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to validate FedEx address: {str(e)}"
            )

    def _get_headers(self) -> Dict:
        """Get FedEx API headers."""
        return {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }

    def _get_service_name(self, code: str) -> str:
        """Get service name from FedEx service code."""
        service_map = {
            "FIRST_OVERNIGHT": "First Overnight",
            "PRIORITY_OVERNIGHT": "Priority Overnight",
            "STANDARD_OVERNIGHT": "Standard Overnight",
            "FEDEX_2_DAY": "2Day",
            "FEDEX_EXPRESS_SAVER": "Express Saver",
            "FEDEX_GROUND": "Ground",
            "GROUND_HOME_DELIVERY": "Home Delivery"
        }
        return service_map.get(code, "Unknown")

    def _get_status_description(self, code: str) -> str:
        """Get status description from FedEx status code."""
        status_map = {
            "PU": "Picked Up",
            "OC": "In Transit",
            "DL": "Delivered",
            "DE": "Exception",
            "IT": "In Transit",
            "AR": "Arrival Scan",
            "OD": "Out for Delivery"
        }
        return status_map.get(code, "Unknown")

    def _format_address(self, address: Dict) -> Dict:
        """Format address for FedEx API."""
        return {
            "streetLines": [address["street"]],
            "city": address["city"],
            "stateOrProvinceCode": address["state"],
            "postalCode": address["postal_code"],
            "countryCode": address["country"]
        }

    def _store_label(self, label_url: str) -> str:
        """Store shipping label and return URL."""
        # TODO: Implement label storage (S3, etc.)
        return label_url 