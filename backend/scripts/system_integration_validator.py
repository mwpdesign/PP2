#!/usr/bin/env python3
"""Enhanced System Integration Validator for Healthcare IVR Platform.
Validates all system components and their integration with improved error
handling and configuration, with special focus on HIPAA compliance."""

import json
import logging
import os
import socket
import ssl
import sys
from datetime import datetime, UTC
from enum import Enum
from pathlib import Path
from typing import Dict, Any, Optional, List, Tuple, Callable
from dataclasses import dataclass, field


def import_with_fallback(module_name: str) -> Tuple[Any, Optional[str]]:
    """Import a module with fallback handling."""
    try:
        return __import__(module_name), None
    except ImportError as e:
        return None, str(e)


# Core external dependencies
yaml, yaml_error = import_with_fallback("yaml")
requests, requests_error = import_with_fallback("requests")
redis, redis_error = import_with_fallback("redis")
boto3, boto3_error = import_with_fallback("boto3")


def import_validator(module_path: str, class_name: str) -> Any:
    """Import a validator class with fallback to a minimal implementation."""
    try:
        module = __import__(module_path, fromlist=[class_name])
        return getattr(module, class_name)
    except (ImportError, AttributeError):
        return type(
            class_name,
            (),
            {
                "__init__": lambda self, *args, **kwargs: None,
                "validate": lambda self: {
                    "status": "SKIP",
                    "message": f"{class_name} not available",
                },
            },
        )


# Import validators with fallbacks
SecurityConfigValidator = import_validator(
    "scripts.security_validator", "SecurityConfigValidator"
)
BackupValidator = import_validator("scripts.backup_validator", "BackupValidator")
HIPAAComplianceChecker = import_validator(
    "scripts.compliance_checker", "HIPAAComplianceChecker"
)
DocumentationValidator = import_validator(
    "scripts.documentation_validator", "DocumentationValidator"
)
SystemVerifier = import_validator("scripts.verify_system", "SystemVerifier")


class ServiceStatus(Enum):
    """Service validation status."""

    PASS = "PASS"
    FAIL = "FAIL"
    SKIP = "SKIP"
    WARN = "WARN"
    ERROR = "ERROR"

    def __str__(self) -> str:
        return self.value

    def __repr__(self) -> str:
        return self.value


@dataclass
class ValidationResult:
    """Validation result with detailed information."""

    status: ServiceStatus
    message: str
    details: Dict[str, Any] = field(default_factory=dict)
    recommendations: List[str] = field(default_factory=list)
    timestamp: str = field(default_factory=lambda: (datetime.now(UTC).isoformat()))

    def to_dict(self) -> Dict[str, Any]:
        """Convert validation result to dictionary."""
        return {
            "status": str(self.status),
            "message": self.message,
            "details": self.details,
            "recommendations": self.recommendations,
            "timestamp": self.timestamp,
        }


class ComplianceStatus(Enum):
    """HIPAA compliance validation status."""

    COMPLIANT = "COMPLIANT"
    NON_COMPLIANT = "NON_COMPLIANT"
    PARTIAL = "PARTIAL"
    UNKNOWN = "UNKNOWN"
    ERROR = "ERROR"

    def __str__(self) -> str:
        return self.value

    def __repr__(self) -> str:
        return self.value


@dataclass
class ComplianceResult:
    """HIPAA compliance validation result."""

    status: ComplianceStatus
    message: str
    details: Dict[str, Any] = field(default_factory=dict)
    risks: List[str] = field(default_factory=list)
    recommendations: List[str] = field(default_factory=list)
    timestamp: str = field(default_factory=lambda: datetime.now(UTC).isoformat())

    def to_dict(self) -> Dict[str, Any]:
        """Convert compliance result to dictionary."""
        return {
            "status": str(self.status),
            "message": self.message,
            "details": self.details,
            "risks": self.risks,
            "recommendations": self.recommendations,
            "timestamp": self.timestamp,
        }


class HIPAAComplianceValidator:
    """HIPAA compliance validation with comprehensive checks."""

    def __init__(self, config: Dict[str, Any]):
        """Initialize HIPAA compliance validator."""
        self.config = config
        self.logger = logging.getLogger("hipaa_compliance_validator")

    def _check_encryption_at_rest(self) -> ComplianceResult:
        """Validate data encryption at rest."""
        try:
            kms_config = self.config.get("encryption", {}).get("kms", {})
            if not kms_config.get("key_id"):
                return ComplianceResult(
                    status=ComplianceStatus.NON_COMPLIANT,
                    message="KMS key not configured",
                    risks=[
                        "PHI data may not be properly encrypted at rest",
                        "Non-compliance with HIPAA encryption requirements",
                    ],
                    recommendations=[
                        "Configure AWS KMS key for data encryption",
                        "Enable automatic key rotation",
                        "Implement encryption policy",
                    ],
                )

            encryption_settings = {
                "algorithm": kms_config.get("algorithm", ""),
                "key_rotation": kms_config.get("key_rotation_enabled", False),
                "monitoring": kms_config.get("monitoring_enabled", False),
            }

            if not all(encryption_settings.values()):
                return ComplianceResult(
                    status=ComplianceStatus.PARTIAL,
                    message="Encryption configuration incomplete",
                    details=encryption_settings,
                    risks=[
                        "Incomplete encryption configuration",
                        "Potential security vulnerabilities",
                    ],
                    recommendations=[
                        "Enable key rotation",
                        "Configure encryption monitoring",
                        "Use approved encryption algorithms",
                    ],
                )

            return ComplianceResult(
                status=ComplianceStatus.COMPLIANT,
                message="Encryption at rest properly configured",
                details=encryption_settings,
            )

        except Exception as e:
            return ComplianceResult(
                status=ComplianceStatus.ERROR,
                message=f"Encryption validation failed: {str(e)}",
                risks=["Unable to verify encryption configuration"],
                recommendations=[
                    "Check KMS service access",
                    "Verify encryption configuration",
                    "Review error logs",
                ],
            )

    def _check_access_controls(self) -> ComplianceResult:
        """Validate access control mechanisms."""
        try:
            auth_config = self.config.get("security", {}).get("auth", {})
            auth_settings = {
                "mfa_enabled": auth_config.get("mfa_required", False),
                "password_policy": auth_config.get("password_policy", {}),
                "session_timeout": auth_config.get("session_timeout", 0),
            }

            password_policy = auth_settings["password_policy"]
            policy_compliant = all(
                [
                    password_policy.get("min_length", 0) >= 12,
                    password_policy.get("require_numbers", False),
                    password_policy.get("require_symbols", False),
                    password_policy.get("require_uppercase", False),
                    password_policy.get("require_lowercase", False),
                    password_policy.get("max_age_days", 0) <= 90,
                ]
            )

            if not policy_compliant:
                return ComplianceResult(
                    status=ComplianceStatus.NON_COMPLIANT,
                    message="Password policy does not meet requirements",
                    details=auth_settings,
                    risks=[
                        "Weak password requirements",
                        "Increased risk of unauthorized access",
                    ],
                    recommendations=[
                        "Enforce strong password requirements",
                        "Enable password expiration",
                        "Require MFA for all users",
                    ],
                )

            if auth_settings["session_timeout"] > 15:
                return ComplianceResult(
                    status=ComplianceStatus.PARTIAL,
                    message="Session timeout too long",
                    details=auth_settings,
                    risks=["Extended session duration increases risk"],
                    recommendations=[
                        "Reduce session timeout to 15 minutes or less",
                        "Implement automatic session termination",
                    ],
                )

            return ComplianceResult(
                status=ComplianceStatus.COMPLIANT,
                message="Access controls properly configured",
                details=auth_settings,
            )

        except Exception as e:
            return ComplianceResult(
                status=ComplianceStatus.ERROR,
                message=f"Access control validation failed: {str(e)}",
                risks=["Unable to verify access controls"],
                recommendations=[
                    "Check authentication configuration",
                    "Verify access control settings",
                    "Review error logs",
                ],
            )

    def _check_audit_logging(self) -> ComplianceResult:
        """Validate audit logging capabilities."""
        try:
            log_config = self.config.get("logging", {})
            log_settings = {
                "phi_access_logging": log_config.get("phi_access_logging", False),
                "retention_days": log_config.get("retention_days", 0),
                "encryption_enabled": log_config.get("encryption_enabled", False),
                "monitoring_enabled": log_config.get("monitoring_enabled", False),
            }

            risks = []
            recommendations = []

            if log_settings["retention_days"] < 365:
                risks.append("Log retention period too short")
                recommendations.append("Increase log retention to minimum 365 days")

            if not log_settings["phi_access_logging"]:
                risks.append("PHI access logging not enabled")
                recommendations.append("Enable comprehensive PHI access logging")

            if not log_settings["encryption_enabled"]:
                risks.append("Log encryption not enabled")
                recommendations.append("Enable encryption for audit logs")

            if not log_settings["monitoring_enabled"]:
                risks.append("Log monitoring not configured")
                recommendations.append("Enable real-time log monitoring")

            if risks:
                status = (
                    ComplianceStatus.PARTIAL
                    if len(risks) < 3
                    else ComplianceStatus.NON_COMPLIANT
                )
                return ComplianceResult(
                    status=status,
                    message="Audit logging requirements not fully met",
                    details=log_settings,
                    risks=risks,
                    recommendations=recommendations,
                )

            return ComplianceResult(
                status=ComplianceStatus.COMPLIANT,
                message="Audit logging properly configured",
                details=log_settings,
            )

        except Exception as e:
            return ComplianceResult(
                status=ComplianceStatus.ERROR,
                message=f"Audit logging validation failed: {str(e)}",
                risks=["Unable to verify audit logging"],
                recommendations=[
                    "Check logging configuration",
                    "Verify log settings",
                    "Review error logs",
                ],
            )

    def _check_data_transmission(self) -> ComplianceResult:
        """Validate secure data transmission."""
        try:
            ssl_context = ssl.create_default_context()
            tls_settings = {
                "protocol": ssl_context.protocol,
                "verify_mode": ssl_context.verify_mode,
                "check_hostname": ssl_context.check_hostname,
                "minimum_version": ssl_context.minimum_version,
            }

            if tls_settings["minimum_version"] < ssl.TLSVersion.TLSv1_2:
                return ComplianceResult(
                    status=ComplianceStatus.NON_COMPLIANT,
                    message="TLS version below minimum requirement",
                    details=tls_settings,
                    risks=[
                        "Outdated TLS version",
                        "Potential security vulnerabilities",
                    ],
                    recommendations=[
                        "Upgrade to TLS 1.2 or higher",
                        "Enable strict SSL/TLS verification",
                        "Implement certificate validation",
                    ],
                )

            if not all(
                [
                    tls_settings["verify_mode"] == ssl.CERT_REQUIRED,
                    tls_settings["check_hostname"],
                ]
            ):
                return ComplianceResult(
                    status=ComplianceStatus.PARTIAL,
                    message="Certificate verification incomplete",
                    details=tls_settings,
                    risks=[
                        "Incomplete certificate validation",
                        "Man-in-the-middle attack risk",
                    ],
                    recommendations=[
                        "Enable strict certificate verification",
                        "Implement hostname validation",
                        "Use trusted certificates only",
                    ],
                )

            return ComplianceResult(
                status=ComplianceStatus.COMPLIANT,
                message="Data transmission security properly configured",
                details=tls_settings,
            )

        except Exception as e:
            return ComplianceResult(
                status=ComplianceStatus.ERROR,
                message=f"Data transmission validation failed: {str(e)}",
                risks=["Unable to verify transmission security"],
                recommendations=[
                    "Check SSL/TLS configuration",
                    "Verify certificate settings",
                    "Review error logs",
                ],
            )

    def validate_compliance(self) -> Dict[str, Any]:
        """Run comprehensive HIPAA compliance validation."""
        self.logger.info("Starting HIPAA compliance validation...")

        results = {
            "encryption": self._check_encryption_at_rest(),
            "access_controls": self._check_access_controls(),
            "audit_logging": self._check_audit_logging(),
            "data_transmission": self._check_data_transmission(),
        }

        report = {
            "timestamp": datetime.now(UTC).isoformat(),
            "overall_status": ComplianceStatus.COMPLIANT,
            "results": {name: result.to_dict() for name, result in results.items()},
        }

        non_compliant = [
            name
            for name, result in results.items()
            if result.status in [ComplianceStatus.NON_COMPLIANT, ComplianceStatus.ERROR]
        ]
        partial_compliant = [
            name
            for name, result in results.items()
            if result.status == ComplianceStatus.PARTIAL
        ]

        if non_compliant:
            report["overall_status"] = ComplianceStatus.NON_COMPLIANT
        elif partial_compliant:
            report["overall_status"] = ComplianceStatus.PARTIAL

        report["summary"] = {
            "total_checks": len(results),
            "compliant": len(
                [r for r in results.values() if r.status == ComplianceStatus.COMPLIANT]
            ),
            "non_compliant": len(non_compliant),
            "partial": len(partial_compliant),
            "errors": len(
                [r for r in results.values() if r.status == ComplianceStatus.ERROR]
            ),
        }

        if non_compliant or partial_compliant:
            report["risks"] = []
            report["recommendations"] = []
            for result in results.values():
                report["risks"].extend(result.risks)
                report["recommendations"].extend(result.recommendations)

        return report


class SystemIntegrationValidator:
    """Enhanced system integration validator with HIPAA compliance focus."""

    def __init__(self, config_path: Optional[str] = None):
        """Initialize validator with configuration."""
        self._check_dependencies()
        self.config = self._load_config(config_path)
        self.logger = self._setup_logging()
        self.results: Dict[str, ValidationResult] = {}
        env = self.config.get("environment", "dev")
        self.security_validator = SecurityConfigValidator(env)
        self.backup_validator = BackupValidator()
        self.compliance_checker = HIPAAComplianceChecker(env)
        self.doc_validator = DocumentationValidator()
        self.system_verifier = SystemVerifier()
        self.hipaa_validator = HIPAAComplianceValidator(self.config)
        self._init_validation_checks()

    def _check_dependencies(self) -> None:
        """Check core dependencies and raise informative errors."""
        missing_deps = []
        if yaml_error:
            missing_deps.append(f"pyyaml: {yaml_error}")
        if requests_error:
            missing_deps.append(f"requests: {requests_error}")
        if redis_error:
            missing_deps.append(f"redis: {redis_error}")
        if boto3_error:
            missing_deps.append(f"boto3: {boto3_error}")

        if missing_deps:
            print("Missing required dependencies:", file=sys.stderr)
            for dep in missing_deps:
                print(f"  - {dep}", file=sys.stderr)
            print("\nPlease install missing dependencies:", file=sys.stderr)
            print(
                "pip install -r backend/scripts/requirements-verify.txt",
                file=sys.stderr,
            )
            sys.exit(1)

    def _load_config(self, config_path: Optional[str] = None) -> Dict[str, Any]:
        """Load validation configuration from YAML file."""
        default_config = Path("backend/config/validation_config.yaml")
        config_file = Path(config_path) if config_path else default_config

        try:
            if not yaml:
                return {
                    "environment": "dev",
                    "validation": {"save_reports": False},
                }
            with open(config_file, "r") as f:
                return yaml.safe_load(f)
        except Exception as e:
            self.logger.error(f"Failed to load config: {e}")
            return {
                "environment": "dev",
                "validation": {
                    "save_reports": False,
                    "detailed_logging": True,
                },
            }

    def _init_validation_checks(self) -> None:
        """Initialize validation check registry."""
        self.validation_checks: Dict[str, Callable[[], ValidationResult]] = {
            "network": self._validate_network,
            "critical_services": self._validate_critical_services,
            "config_integrity": self._validate_config,
            "security": self._validate_security,
            "api_health": self._validate_api_health,
            "hipaa_compliance": self._validate_hipaa_compliance,
        }

    def _validate_network(self) -> ValidationResult:
        """Perform lightweight network connectivity check."""
        try:
            socket.create_connection(("8.8.8.8", 53), timeout=3)
            return ValidationResult(
                status=ServiceStatus.PASS,
                message="Network connectivity verified",
                details={"dns_check": "passed"},
            )
        except (socket.error, socket.timeout) as e:
            return ValidationResult(
                status=ServiceStatus.FAIL,
                message="Network connectivity issues detected",
                details={"error": str(e)},
                recommendations=[
                    "Check network connection",
                    "Verify DNS resolution",
                    "Check firewall settings",
                ],
            )

    def _validate_critical_services(self) -> ValidationResult:
        """Check critical local services."""
        critical_ports = {"backend": 8000, "database": 5432, "redis": 6379}
        results = {}
        for service, port in critical_ports.items():
            try:
                sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                sock.settimeout(2)
                result = sock.connect_ex(("localhost", port))
                sock.close()
                status = ServiceStatus.PASS if result == 0 else ServiceStatus.FAIL
                results[service] = {
                    "status": status.value,
                    "port": port,
                    "accessible": result == 0,
                }
            except Exception as e:
                results[service] = {
                    "status": ServiceStatus.ERROR.value,
                    "port": port,
                    "error": str(e),
                }

        if all(r["status"] == ServiceStatus.PASS.value for r in results.values()):
            status = ServiceStatus.PASS
            message = "All critical services are running"
        else:
            status = ServiceStatus.FAIL
            message = "Some critical services are not accessible"

        return ValidationResult(
            status=status,
            message=message,
            details=results,
            recommendations=[
                f"Check {svc} service on port {info['port']}"
                for svc, info in results.items()
                if info["status"] != ServiceStatus.PASS.value
            ],
        )

    def _validate_config(self) -> ValidationResult:
        """Validate configuration integrity."""
        required_env = {
            "AWS_ACCESS_KEY_ID": "AWS credentials",
            "AWS_SECRET_ACCESS_KEY": "AWS credentials",
            "DATABASE_URL": "Database connection",
            "REDIS_URL": "Redis connection",
        }

        config_files = [
            "backend/config/app_config.yaml",
            "backend/config/validation_config.yaml",
            ".env",
        ]

        missing_env = []
        for var, purpose in required_env.items():
            if not os.getenv(var):
                missing_env.append(f"{var} ({purpose})")

        missing_files = []
        for config_file in config_files:
            if not Path(config_file).exists():
                missing_files.append(config_file)

        if not missing_env and not missing_files:
            return ValidationResult(
                status=ServiceStatus.PASS,
                message="All configuration requirements met",
                details={
                    "env_vars_checked": len(required_env),
                    "config_files_checked": len(config_files),
                },
            )

        return ValidationResult(
            status=ServiceStatus.FAIL,
            message="Configuration validation failed",
            details={
                "missing_env_vars": missing_env,
                "missing_config_files": missing_files,
            },
            recommendations=[
                "Set required environment variables",
                "Ensure all configuration files exist",
                "Check configuration file permissions",
            ],
        )

    def _validate_security(self) -> ValidationResult:
        """Perform basic security validation."""
        try:
            security_result = self.security_validator.validate()
            return ValidationResult(
                status=(
                    ServiceStatus.PASS
                    if security_result["status"] == "PASS"
                    else ServiceStatus.FAIL
                ),
                message=security_result.get("message", "Security validation complete"),
                details=security_result,
            )
        except Exception as e:
            return ValidationResult(
                status=ServiceStatus.ERROR,
                message=f"Security validation failed: {str(e)}",
                recommendations=[
                    "Check security validator configuration",
                    "Verify security service availability",
                    "Review security logs",
                ],
            )

    def _validate_api_health(self) -> ValidationResult:
        """Check API health endpoints."""
        if not requests:
            return ValidationResult(
                status=ServiceStatus.SKIP,
                message="API health check skipped - requests not available",
            )

        endpoints = ["/health", "/api/v1/status", "/api/v1/metrics"]
        results = {}
        base_url = "http://localhost:8000"

        for endpoint in endpoints:
            try:
                response = requests.get(f"{base_url}{endpoint}", timeout=5)
                results[endpoint] = {
                    "status": response.status_code,
                    "response_time": response.elapsed.total_seconds(),
                }
            except requests.exceptions.RequestException as e:
                results[endpoint] = {"status": "error", "error": str(e)}

        healthy_endpoints = sum(
            1
            for r in results.values()
            if isinstance(r.get("status"), int) and r["status"] < 400
        )

        if healthy_endpoints == len(endpoints):
            status = ServiceStatus.PASS
            message = "All API endpoints are healthy"
        elif healthy_endpoints > 0:
            status = ServiceStatus.WARN
            message = "Some API endpoints are not responding"
        else:
            status = ServiceStatus.FAIL
            message = "No API endpoints are accessible"

        return ValidationResult(
            status=status,
            message=message,
            details={
                "endpoints_checked": len(endpoints),
                "healthy_endpoints": healthy_endpoints,
                "results": results,
            },
            recommendations=(
                [
                    "Check API service status",
                    "Verify endpoint configurations",
                    "Review API logs for errors",
                ]
                if status != ServiceStatus.PASS
                else []
            ),
        )

    def _validate_hipaa_compliance(self) -> ValidationResult:
        """Run HIPAA compliance validation."""
        try:
            compliance_report = self.hipaa_validator.validate_compliance()
            status = ServiceStatus.PASS
            if compliance_report["overall_status"] == ComplianceStatus.NON_COMPLIANT:
                status = ServiceStatus.FAIL
            elif compliance_report["overall_status"] == ComplianceStatus.PARTIAL:
                status = ServiceStatus.WARN

            return ValidationResult(
                status=status,
                message=(
                    f"HIPAA Compliance Status: "
                    f"{compliance_report['overall_status']}"
                ),
                details=compliance_report,
                recommendations=compliance_report.get("recommendations", []),
            )
        except Exception as e:
            return ValidationResult(
                status=ServiceStatus.ERROR,
                message=f"HIPAA compliance validation failed: {str(e)}",
                details={"error": str(e)},
                recommendations=[
                    "Check compliance validator configuration",
                    "Verify access to required services",
                    "Review error logs for details",
                ],
            )

    def run_validation(self) -> Dict[str, Any]:
        """Run all validation checks and generate report."""
        validation_results = {}

        for check_name, check_func in self.validation_checks.items():
            try:
                result = check_func()
                validation_results[check_name] = result.to_dict()
            except Exception as e:
                validation_results[check_name] = ValidationResult(
                    status=ServiceStatus.ERROR,
                    message=f"Validation failed: {str(e)}",
                    details={"error": str(e)},
                    recommendations=[
                        "Check validator configuration",
                        "Review error logs",
                        "Verify service dependencies",
                    ],
                ).to_dict()

        failed_checks = [
            name
            for name, result in validation_results.items()
            if result["status"] in [ServiceStatus.FAIL.value, ServiceStatus.ERROR.value]
        ]

        report = {
            "timestamp": datetime.now(UTC).isoformat(),
            "overall_status": (
                ServiceStatus.FAIL.value if failed_checks else ServiceStatus.PASS.value
            ),
            "results": validation_results,
            "summary": {
                "total_checks": len(self.validation_checks),
                "passed": len(
                    [
                        r
                        for r in validation_results.values()
                        if r["status"] == ServiceStatus.PASS.value
                    ]
                ),
                "failed": len(failed_checks),
                "skipped": len(
                    [
                        r
                        for r in validation_results.values()
                        if r["status"] == ServiceStatus.SKIP.value
                    ]
                ),
            },
        }

        if failed_checks:
            report["failed_checks"] = failed_checks
            report["action_required"] = True

        return report


def main():
    """Main entry point for system integration validator."""
    import argparse

    parser = argparse.ArgumentParser(
        description="Enhanced System Integration Validator"
    )
    parser.add_argument("--config", help="Path to validation configuration file")
    args = parser.parse_args()
    validator = SystemIntegrationValidator(args.config)
    try:
        report = validator.run_validation()
        print(json.dumps(report, indent=2))
        sys.exit(0 if report["overall_status"] == "PASS" else 1)
    except Exception as e:
        logging.error(f"Validation failed: {str(e)}", exc_info=True)
        sys.exit(1)


if __name__ == "__main__":
    main()
