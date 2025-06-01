from typing import Dict, Any, List
import numpy as np
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler

from app.core.config import settings
from app.models.audit_log import AuditLog
from app.services.audit_service import AuditService


class MLValidator:
    """Machine learning-based validation service"""

    def __init__(self):
        """Initialize ML validator with required services"""
        self.audit_service = AuditService()
        self.scaler = StandardScaler()

        # Initialize anomaly detection model
        self.anomaly_detector = IsolationForest(
            n_estimators=100, contamination=0.1, random_state=42
        )

    async def analyze_compliance(
        self, aspect: str, validation_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Analyze compliance patterns using ML techniques

        Args:
            aspect: The compliance aspect being analyzed
            validation_data: Data from compliance validation

        Returns:
            Dictionary containing ML insights and recommendations
        """
        # Get historical audit data for this aspect
        audit_logs = await self._get_relevant_audit_logs(aspect)

        # Extract features for analysis
        features = self._extract_features(audit_logs, validation_data)

        # Detect anomalies
        anomalies = await self._detect_anomalies(features)

        # Generate risk assessment
        risk_assessment = await self._assess_compliance_risk(
            aspect, features, anomalies
        )

        # Generate recommendations
        recommendations = await self._generate_recommendations(aspect, risk_assessment)

        return {
            "risk_assessment": risk_assessment,
            "recommendations": recommendations,
            "anomalies_detected": len(anomalies),
        }

    async def _get_relevant_audit_logs(
        self, aspect: str, limit: int = 1000
    ) -> List[AuditLog]:
        """Retrieve relevant historical audit logs"""
        return await self.audit_service.get_logs_by_aspect(aspect=aspect, limit=limit)

    def _extract_features(
        self, audit_logs: List[AuditLog], current_data: Dict[str, Any]
    ) -> np.ndarray:
        """Extract numerical features for ML analysis"""
        features = []

        for log in audit_logs:
            feature_vector = [
                log.access_count,
                log.error_count,
                log.response_time,
                log.data_volume,
                self._calculate_risk_score(log),
            ]
            features.append(feature_vector)

        # Add current validation data
        current_vector = [
            current_data.get("access_count", 0),
            current_data.get("error_count", 0),
            current_data.get("response_time", 0),
            current_data.get("data_volume", 0),
            self._calculate_risk_score(current_data),
        ]
        features.append(current_vector)

        # Scale features
        return self.scaler.fit_transform(features)

    async def _detect_anomalies(self, features: np.ndarray) -> List[int]:
        """Detect anomalies in the feature set"""
        # Train and predict
        predictions = self.anomaly_detector.fit_predict(features)

        # Find anomaly indices (where prediction is -1)
        return [i for i, pred in enumerate(predictions) if pred == -1]

    async def _assess_compliance_risk(
        self, aspect: str, features: np.ndarray, anomalies: List[int]
    ) -> Dict[str, Any]:
        """Assess compliance risk based on ML analysis"""
        # Calculate base risk score
        base_risk = len(anomalies) / len(features)

        # Adjust risk based on aspect sensitivity
        sensitivity_multiplier = settings.ASPECT_SENSITIVITY.get(aspect, 1.0)
        adjusted_risk = base_risk * sensitivity_multiplier

        # Calculate confidence score
        confidence = self._calculate_confidence_score(features, anomalies)

        # Determine risk level
        risk_level = self._determine_risk_level(adjusted_risk)

        return {
            "risk_level": risk_level,
            "base_risk": base_risk,
            "adjusted_risk": adjusted_risk,
            "confidence": confidence,
            "sensitivity": sensitivity_multiplier,
        }

    async def _generate_recommendations(
        self, aspect: str, risk_assessment: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """Generate ML-based recommendations"""
        recommendations = []

        # Add recommendations based on risk level
        if risk_assessment["risk_level"] == "high":
            recommendations.extend(
                [
                    {
                        "priority": "high",
                        "category": "immediate_action",
                        "description": "Significant compliance anomalies detected",
                        "actions": [
                            "Review all recent transactions",
                            "Increase monitoring frequency",
                            "Update access controls",
                        ],
                    }
                ]
            )
        elif risk_assessment["risk_level"] == "medium":
            recommendations.extend(
                [
                    {
                        "priority": "medium",
                        "category": "monitoring",
                        "description": "Potential compliance concerns identified",
                        "actions": [
                            "Review affected transactions",
                            "Update validation rules",
                            "Enhance logging",
                        ],
                    }
                ]
            )
        else:
            recommendations.extend(
                [
                    {
                        "priority": "low",
                        "category": "maintenance",
                        "description": "Minor optimization opportunities",
                        "actions": ["Regular monitoring", "Periodic rule updates"],
                    }
                ]
            )

        return recommendations

    def _calculate_risk_score(self, data: Dict[str, Any]) -> float:
        """Calculate risk score from data points"""
        weights = settings.RISK_SCORE_WEIGHTS

        score = (
            weights["access"] * data.get("access_count", 0)
            + weights["error"] * data.get("error_count", 0)
            + weights["time"] * data.get("response_time", 0)
            + weights["volume"] * data.get("data_volume", 0)
        )

        return min(score / 100.0, 1.0)  # Normalize to [0,1]

    def _calculate_confidence_score(
        self, features: np.ndarray, anomalies: List[int]
    ) -> float:
        """Calculate confidence score for predictions"""
        if len(features) < 2:
            return 0.5  # Default confidence for insufficient data

        # Calculate based on data volume and anomaly ratio
        data_factor = min(len(features) / 1000.0, 1.0)
        anomaly_factor = 1.0 - (len(anomalies) / len(features))

        return (data_factor + anomaly_factor) / 2.0

    def _determine_risk_level(self, risk_score: float) -> str:
        """Determine risk level from risk score"""
        if risk_score >= settings.RISK_THRESHOLDS["high"]:
            return "high"
        elif risk_score >= settings.RISK_THRESHOLDS["medium"]:
            return "medium"
        return "low"

    def _calculate_compliance_score(
        self, risk_assessment: Dict[str, Any], anomalies: List[int]
    ) -> float:
        """Calculate overall compliance score"""
        base_score = 1.0 - risk_assessment["adjusted_risk"]
        confidence = risk_assessment["confidence"]

        # Adjust score based on anomalies and confidence
        adjusted_score = base_score * (
            1.0 - (len(anomalies) * settings.ANOMALY_PENALTY)
        )

        # Weight with confidence
        final_score = (adjusted_score * confidence) + (base_score * (1.0 - confidence))

        return max(0.0, min(1.0, final_score))  # Ensure [0,1] range
