#!/usr/bin/env python3
"""
Predictive System Optimizer for Healthcare IVR Platform.
Uses machine learning to predict and optimize system performance.
"""

import os
import sys
import json
import logging
import psutil
import numpy as np
import pandas as pd
from typing import Dict, Any, List
from datetime import datetime
from pathlib import Path
from sklearn.ensemble import RandomForestRegressor, IsolationForest
from sklearn.preprocessing import StandardScaler
from prometheus_client import CollectorRegistry, Gauge, push_to_gateway


class PredictiveSystemOptimizer:
    """Intelligent system optimization using ML-based predictions."""

    def __init__(self, system_integration_report: Dict):
        """Initialize the optimizer with system integration report."""
        self.integration_report = system_integration_report
        self.setup_logging()

        # Initialize ML models
        self.performance_model = RandomForestRegressor(
            n_estimators=100, random_state=42
        )
        self.anomaly_detector = IsolationForest(contamination=0.1, random_state=42)
        self.scaler = StandardScaler()

        # Initialize metrics registry
        self.registry = CollectorRegistry()
        self.metrics = self._setup_metrics()

        # Initialize results
        self.optimization_results = {
            "timestamp": datetime.utcnow().isoformat(),
            "overall_status": "PENDING",
            "predictions": {},
            "optimizations": {},
            "risks": {},
            "recommendations": [],
        }

    def setup_logging(self):
        """Configure logging for the optimizer."""
        self.logger = logging.getLogger("predictive_system_optimizer")
        self.logger.setLevel(logging.INFO)

        # Create logs directory
        log_dir = Path("optimization_reports/logs")
        log_dir.mkdir(parents=True, exist_ok=True)

        # Add file handler
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        log_file = log_dir / f"optimization_{timestamp}.log"

        handler = logging.FileHandler(log_file)
        handler.setFormatter(
            logging.Formatter("%(asctime)s - %(name)s - %(levelname)s - %(message)s")
        )

        self.logger.addHandler(handler)

    def _setup_metrics(self) -> Dict[str, Gauge]:
        """Setup Prometheus metrics."""
        return {
            "cpu_usage": Gauge(
                "system_cpu_usage",
                "Current CPU usage percentage",
                registry=self.registry,
            ),
            "memory_usage": Gauge(
                "system_memory_usage",
                "Current memory usage percentage",
                registry=self.registry,
            ),
            "disk_usage": Gauge(
                "system_disk_usage",
                "Current disk usage percentage",
                registry=self.registry,
            ),
            "network_latency": Gauge(
                "system_network_latency",
                "Current network latency in ms",
                registry=self.registry,
            ),
            "error_rate": Gauge(
                "system_error_rate",
                "Current error rate percentage",
                registry=self.registry,
            ),
        }

    def collect_system_metrics(self) -> Dict[str, float]:
        """Collect current system performance metrics."""
        metrics = {
            "cpu_usage": psutil.cpu_percent(interval=1),
            "memory_usage": psutil.virtual_memory().percent,
            "disk_usage": psutil.disk_usage("/").percent,
            "network_latency": self._measure_network_latency(),
            "error_rate": self._calculate_error_rate(),
        }

        # Update Prometheus metrics
        for metric_name, value in metrics.items():
            self.metrics[metric_name].set(value)

        try:
            # Push to Prometheus if configured
            push_to_gateway("localhost:9091", "healthcare_ivr_optimizer", self.registry)
        except Exception as e:
            self.logger.warning(f"Failed to push metrics: {e}")

        return metrics

    def _measure_network_latency(self) -> float:
        """Measure network latency to key endpoints."""
        endpoints = [
            "http://localhost:8000/health",
            "http://localhost:8000/api/v1/status",
        ]

        latencies = []
        import requests

        for endpoint in endpoints:
            try:
                start_time = datetime.now()
                requests.get(endpoint, timeout=5, verify=False)
                latency = (datetime.now() - start_time).total_seconds() * 1000
                latencies.append(latency)
            except Exception as e:
                self.logger.warning(f"Failed to measure latency for {endpoint}: {e}")

        return np.mean(latencies) if latencies else 0.0

    def _calculate_error_rate(self) -> float:
        """Calculate system error rate from logs."""
        try:
            # Read recent error logs
            error_count = 0
            total_requests = 0

            log_file = "backend/logs/app.log"
            if os.path.exists(log_file):
                with open(log_file, "r") as f:
                    for line in f:
                        if "ERROR" in line:
                            error_count += 1
                        if "REQUEST" in line:
                            total_requests += 1

            return (error_count / total_requests * 100) if total_requests > 0 else 0

        except Exception as e:
            self.logger.warning(f"Failed to calculate error rate: {e}")
            return 0.0

    def predict_performance(self) -> Dict[str, Any]:
        """Predict future system performance."""
        self.logger.info("Predicting system performance")

        try:
            # Collect historical metrics
            metrics_history = self._load_metrics_history()
            if not metrics_history.empty:
                # Prepare features
                features = [
                    "cpu_usage",
                    "memory_usage",
                    "disk_usage",
                    "network_latency",
                ]
                X = metrics_history[features]
                y = metrics_history["response_time"]

                # Scale features
                X_scaled = self.scaler.fit_transform(X)

                # Train model
                self.performance_model.fit(X_scaled, y)

                # Make predictions
                current_metrics = self.collect_system_metrics()
                current_features = np.array(
                    [
                        [
                            current_metrics["cpu_usage"],
                            current_metrics["memory_usage"],
                            current_metrics["disk_usage"],
                            current_metrics["network_latency"],
                        ]
                    ]
                )
                current_scaled = self.scaler.transform(current_features)
                prediction = self.performance_model.predict(current_scaled)[0]

                return {
                    "status": "PASS",
                    "predicted_response_time": prediction,
                    "confidence_score": (self.performance_model.score(X_scaled, y)),
                    "current_metrics": current_metrics,
                }
            else:
                return {"status": "FAIL", "error": "Insufficient historical data"}

        except Exception as e:
            self.logger.error(f"Performance prediction failed: {e}")
            return {"status": "FAIL", "error": str(e)}

    def detect_anomalies(self) -> Dict[str, Any]:
        """Detect system anomalies using Isolation Forest."""
        self.logger.info("Detecting system anomalies")

        try:
            # Collect metrics
            metrics = self.collect_system_metrics()
            metrics_df = pd.DataFrame([metrics])

            # Scale features
            scaled_data = self.scaler.fit_transform(metrics_df)

            # Detect anomalies
            anomaly_scores = self.anomaly_detector.fit_predict(scaled_data)

            # Analyze results
            anomalies = {}
            for metric, value in metrics.items():
                if value > 90:  # Direct threshold check
                    anomalies[metric] = {"value": value, "severity": "HIGH"}
                elif value > 75:
                    anomalies[metric] = {"value": value, "severity": "MEDIUM"}

            return {
                "status": "PASS",
                "anomaly_score": float(anomaly_scores[0]),
                "anomalies": anomalies,
            }

        except Exception as e:
            self.logger.error(f"Anomaly detection failed: {e}")
            return {"status": "FAIL", "error": str(e)}

    def optimize_resources(self) -> Dict[str, Any]:
        """Optimize system resource allocation."""
        self.logger.info("Optimizing system resources")

        try:
            current_metrics = self.collect_system_metrics()
            optimizations = []

            # CPU Optimization
            if current_metrics["cpu_usage"] > 80:
                optimizations.append(
                    {
                        "resource": "CPU",
                        "current_usage": current_metrics["cpu_usage"],
                        "recommendation": "Scale up CPU resources or optimize workload",
                        "actions": [
                            "Identify CPU-intensive processes",
                            "Consider horizontal scaling",
                            "Optimize database queries",
                        ],
                    }
                )

            # Memory Optimization
            if current_metrics["memory_usage"] > 85:
                optimizations.append(
                    {
                        "resource": "Memory",
                        "current_usage": current_metrics["memory_usage"],
                        "recommendation": "Optimize memory usage",
                        "actions": [
                            "Implement caching",
                            "Review memory leaks",
                            "Adjust JVM settings",
                        ],
                    }
                )

            # Disk Optimization
            if current_metrics["disk_usage"] > 90:
                optimizations.append(
                    {
                        "resource": "Disk",
                        "current_usage": current_metrics["disk_usage"],
                        "recommendation": "Manage disk space",
                        "actions": [
                            "Implement log rotation",
                            "Archive old data",
                            "Clean temporary files",
                        ],
                    }
                )

            return {
                "status": "PASS",
                "current_metrics": current_metrics,
                "optimizations": optimizations,
            }

        except Exception as e:
            self.logger.error(f"Resource optimization failed: {e}")
            return {"status": "FAIL", "error": str(e)}

    def analyze_security_risks(self) -> Dict[str, Any]:
        """Analyze potential security risks."""
        self.logger.info("Analyzing security risks")

        try:
            # Check security components from integration report
            security_status = self.integration_report.get("components", {}).get(
                "security", {}
            )

            risks = []

            # Analyze security findings
            if security_status.get("status") == "FAIL":
                risks.extend(
                    self._analyze_security_findings(security_status.get("findings", []))
                )

            # Check compliance status
            compliance_status = self.integration_report.get("components", {}).get(
                "compliance", {}
            )

            if compliance_status.get("status") == "FAIL":
                risks.extend(
                    self._analyze_compliance_risks(
                        compliance_status.get("violations", [])
                    )
                )

            # Calculate risk scores
            risk_scores = {risk["category"]: risk["severity"] for risk in risks}

            return {
                "status": "PASS",
                "risk_scores": risk_scores,
                "identified_risks": risks,
                "overall_risk_level": max(
                    (risk["severity"] for risk in risks), default=0
                ),
            }

        except Exception as e:
            self.logger.error(f"Security risk analysis failed: {e}")
            return {"status": "FAIL", "error": str(e)}

    def _analyze_security_findings(self, findings: List[Dict]) -> List[Dict]:
        """Analyze security findings and calculate risk levels."""
        risks = []

        for finding in findings:
            severity = finding.get("severity", "LOW")
            category = finding.get("category", "Unknown")

            risks.append(
                {
                    "category": category,
                    "severity": self._calculate_severity_score(severity),
                    "finding": finding.get("description", ""),
                    "mitigation": self._get_mitigation_strategy(category),
                }
            )

        return risks

    def _analyze_compliance_risks(self, violations: List[Dict]) -> List[Dict]:
        """Analyze compliance violations and assess risks."""
        risks = []

        for violation in violations:
            category = violation.get("requirement", "Unknown")
            severity = violation.get("impact", "LOW")

            risks.append(
                {
                    "category": f"Compliance - {category}",
                    "severity": self._calculate_severity_score(severity),
                    "finding": violation.get("description", ""),
                    "mitigation": self._get_compliance_recommendation(category),
                }
            )

        return risks

    def _calculate_severity_score(self, severity: str) -> int:
        """Calculate numerical severity score."""
        severity_map = {"CRITICAL": 9, "HIGH": 7, "MEDIUM": 5, "LOW": 3, "INFO": 1}
        return severity_map.get(severity.upper(), 1)

    def _get_mitigation_strategy(self, category: str) -> List[str]:
        """Get mitigation strategies for security risks."""
        strategies = {
            "Authentication": [
                "Implement MFA",
                "Review password policies",
                "Audit access controls",
            ],
            "Authorization": [
                "Review role permissions",
                "Implement least privilege",
                "Audit access logs",
            ],
            "Encryption": [
                "Update encryption algorithms",
                "Review key management",
                "Implement data-at-rest encryption",
            ],
            "Network": [
                "Review firewall rules",
                "Implement IDS/IPS",
                "Monitor network traffic",
            ],
        }
        return strategies.get(category, ["Review security policies"])

    def _get_compliance_recommendation(self, requirement: str) -> List[str]:
        """Get recommendations for compliance violations."""
        recommendations = {
            "HIPAA": [
                "Review PHI handling",
                "Update audit logging",
                "Enhance access controls",
            ],
            "Data Protection": [
                "Review data encryption",
                "Update data retention policies",
                "Implement data masking",
            ],
            "Access Control": [
                "Review access policies",
                "Implement role-based access",
                "Enhance authentication",
            ],
        }
        return recommendations.get(requirement, ["Review compliance requirements"])

    def _load_metrics_history(self) -> pd.DataFrame:
        """Load historical metrics data."""
        try:
            history_file = "optimization_reports/metrics_history.csv"
            if os.path.exists(history_file):
                return pd.read_csv(history_file)
            return pd.DataFrame()
        except Exception as e:
            self.logger.warning(f"Failed to load metrics history: {e}")
            return pd.DataFrame()

    def generate_optimization_report(self) -> str:
        """Generate and save optimization report."""
        self.logger.info("Generating optimization report")

        try:
            # Run all optimizations
            self.optimization_results["predictions"] = self.predict_performance()
            self.optimization_results["anomalies"] = self.detect_anomalies()
            self.optimization_results["optimizations"] = self.optimize_resources()
            self.optimization_results["risks"] = self.analyze_security_risks()

            # Generate recommendations
            self.optimization_results["recommendations"] = (
                self._generate_recommendations()
            )

            # Determine overall status
            components = [
                self.optimization_results["predictions"],
                self.optimization_results["anomalies"],
                self.optimization_results["optimizations"],
                self.optimization_results["risks"],
            ]

            self.optimization_results["overall_status"] = (
                "PASS"
                if all(comp.get("status") == "PASS" for comp in components)
                else "FAIL"
            )

            # Save report
            report_dir = Path("optimization_reports")
            report_dir.mkdir(exist_ok=True)

            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            report_file = report_dir / f"optimization_{timestamp}.json"

            with open(report_file, "w") as f:
                json.dump(self.optimization_results, f, indent=2)

            self.logger.info(f"Optimization report saved: {report_file}")
            return str(report_file)

        except Exception as e:
            self.logger.error(f"Failed to generate optimization report: {e}")
            raise

    def _generate_recommendations(self) -> List[Dict]:
        """Generate comprehensive optimization recommendations."""
        recommendations = []

        # Performance recommendations
        if (
            self.optimization_results["predictions"].get("status") == "PASS"
            and self.optimization_results["predictions"].get(
                "predicted_response_time", 0
            )
            > 1000
        ):
            recommendations.append(
                {
                    "category": "Performance",
                    "severity": "HIGH",
                    "description": "High response times predicted",
                    "actions": [
                        "Optimize database queries",
                        "Implement caching",
                        "Consider scaling resources",
                    ],
                }
            )

        # Resource optimization recommendations
        resource_opts = self.optimization_results["optimizations"]
        if resource_opts.get("status") == "PASS":
            for opt in resource_opts.get("optimizations", []):
                recommendations.append(
                    {
                        "category": "Resource",
                        "severity": "MEDIUM",
                        "description": opt["recommendation"],
                        "actions": opt["actions"],
                    }
                )

        # Security recommendations
        risks = self.optimization_results["risks"]
        if risks.get("status") == "PASS":
            for risk in risks.get("identified_risks", []):
                if risk["severity"] >= 7:
                    recommendations.append(
                        {
                            "category": "Security",
                            "severity": "HIGH",
                            "description": f"High security risk: {risk['finding']}",
                            "actions": risk["mitigation"],
                        }
                    )

        return recommendations


def main():
    """Main entry point for predictive system optimizer."""
    import argparse

    parser = argparse.ArgumentParser(description="Predictive System Optimizer")
    parser.add_argument(
        "--report",
        help="Path to system integration report",
        default="verification_reports/latest_report.json",
    )
    args = parser.parse_args()

    # Configure logging
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    )

    try:
        # Load integration report
        with open(args.report) as f:
            integration_report = json.load(f)

        # Run optimization
        optimizer = PredictiveSystemOptimizer(integration_report)
        report_path = optimizer.generate_optimization_report()

        print(f"\nOptimization Report Generated: {report_path}")
        print(
            "\nOptimization Status:", optimizer.optimization_results["overall_status"]
        )

        if optimizer.optimization_results["recommendations"]:
            print("\nKey Recommendations:")
            for rec in optimizer.optimization_results["recommendations"]:
                print(f"\n- {rec['category']} ({rec['severity']}):")
                print(f"  {rec['description']}")
                print("  Actions:")
                for action in rec["actions"]:
                    print(f"    * {action}")

        sys.exit(0 if optimizer.optimization_results["overall_status"] == "PASS" else 1)

    except Exception as e:
        logging.error(f"Optimization failed: {str(e)}", exc_info=True)
        sys.exit(1)


if __name__ == "__main__":
    main()
