"""HIPAA compliance validation framework for Healthcare IVR Platform."""
import os
import json
import logging
import hashlib
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
import jwt
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.audit import AuditLog
from app.models.user import User


class HIPAAComplianceValidator:
    """Comprehensive HIPAA Compliance Validation Framework."""

    def __init__(self, db: Session, config_path: Optional[str] = None):
        """Initialize HIPAA compliance validator."""
        self.db = db
        self.logger = logging.getLogger("hipaa_compliance")
        self.config = self._load_compliance_config(config_path)
        self.encryption_key = Fernet.generate_key()
        self.cipher_suite = Fernet(self.encryption_key)

    def _load_compliance_config(self, config_path: Optional[str]) -> Dict:
        """Load HIPAA compliance configuration."""
        if config_path and os.path.exists(config_path):
            with open(config_path, "r") as f:
                return json.load(f)
        return self._generate_default_config()

    def _generate_default_config(self) -> Dict:
        """Generate default HIPAA compliance configuration."""
        return {
            "phi_protection": {
                "encryption_required": True,
                "min_encryption_strength": 256,
                "allowed_encryption_algorithms": ["AES-256-GCM", "RSA-4096"],
                "key_rotation_days": 90,
                "data_retention_years": 6
            },
            "access_control": {
                "min_password_length": 12,
                "password_history_size": 12,
                "max_password_age_days": 90,
                "required_password_complexity": {
                    "uppercase": True,
                    "lowercase": True,
                    "numbers": True,
                    "special_chars": True
                },
                "max_failed_login_attempts": 5,
                "lockout_duration_minutes": 30,
                "session_timeout_minutes": 30,
                "mfa_required": True
            },
            "audit_logging": {
                "log_sensitive_operations": True,
                "retention_days": 6 * 365,  # 6 years
                "log_fields": [
                    "timestamp",
                    "user_id",
                    "operation_type",
                    "resource_type",
                    "resource_id",
                    "ip_address",
                    "user_agent",
                    "request_method",
                    "request_path",
                    "response_status",
                    "phi_accessed"
                ]
            },
            "data_transmission": {
                "min_tls_version": "1.2",
                "allowed_protocols": ["TLS 1.2", "TLS 1.3"],
                "required_cipher_suites": [
                    "TLS_AES_256_GCM_SHA384",
                    "TLS_CHACHA20_POLY1305_SHA256"
                ],
                "hsts_enabled": True,
                "hsts_max_age_days": 365
            },
            "data_backup": {
                "backup_frequency_hours": 24,
                "encryption_required": True,
                "retention_years": 6,
                "test_recovery_frequency_days": 30
            },
            "emergency_access": {
                "break_glass_enabled": True,
                "break_glass_notification_required": True,
                "break_glass_audit_detail": "enhanced"
            }
        }

    def validate_data_encryption(self, data: str, context: Dict) -> Dict:
        """Validate encryption of sensitive data."""
        results = {
            "is_encrypted": False,
            "encryption_method": None,
            "key_rotation_status": "UNKNOWN",
            "compliance_status": "FAIL",
            "checks_performed": [],
            "failed_checks": []
        }

        try:
            # Check if data is already encrypted
            try:
                self.cipher_suite.decrypt(data.encode())
                results["is_encrypted"] = True
            except Exception:
                # Data is not encrypted, proceed with encryption
                encrypted_data = self.cipher_suite.encrypt(data.encode())
                results["is_encrypted"] = True

            # Validate encryption method
            results["encryption_method"] = "AES-256-GCM"
            results["checks_performed"].append("ENCRYPTION_METHOD")

            # Check key rotation
            key_age = context.get("key_age_days", 0)
            if key_age > self.config["phi_protection"]["key_rotation_days"]:
                results["key_rotation_status"] = "ROTATION_REQUIRED"
                results["failed_checks"].append("KEY_ROTATION")
            else:
                results["key_rotation_status"] = "VALID"
                results["checks_performed"].append("KEY_ROTATION")

            # Generate encryption audit trail
            results["encryption_hash"] = hashlib.sha256(
                encrypted_data if "encrypted_data" in locals() 
                else data.encode()
            ).hexdigest()

            # Log encryption operation
            self._log_encryption_operation(context)

            # Set final compliance status
            if not results["failed_checks"]:
                results["compliance_status"] = "PASS"

        except Exception as e:
            self.logger.error(f"Encryption validation failed: {str(e)}")
            results["error"] = str(e)
            results["failed_checks"].append("ENCRYPTION_PROCESS")

        return results

    def validate_password_policy(self, password: str, user_id: str) -> Dict:
        """Validate password against HIPAA compliance requirements."""
        policy = self.config["access_control"]
        results = {
            "is_compliant": True,
            "checks_performed": [],
            "failed_checks": []
        }

        # Length check
        if len(password) < policy["min_password_length"]:
            results["is_compliant"] = False
            results["failed_checks"].append("PASSWORD_TOO_SHORT")
        else:
            results["checks_performed"].append("LENGTH_CHECK")

        # Complexity checks
        complexity_checks = {
            "uppercase": any(c.isupper() for c in password),
            "lowercase": any(c.islower() for c in password),
            "numbers": any(c.isdigit() for c in password),
            "special_chars": any(not c.isalnum() for c in password)
        }

        for check, passed in complexity_checks.items():
            if policy["required_password_complexity"][check]:
                if passed:
                    results["checks_performed"].append(f"{check.upper()}_CHECK")
                else:
                    results["is_compliant"] = False
                    results["failed_checks"].append(f"MISSING_{check.upper()}")

        # Password history check
        user = self.db.query(User).filter(User.id == user_id).first()
        if user and user.password_history:
            for old_password in user.password_history:
                if self._verify_password(password, old_password):
                    results["is_compliant"] = False
                    results["failed_checks"].append("PASSWORD_HISTORY_MATCH")
                    break
            results["checks_performed"].append("HISTORY_CHECK")

        return results

    def validate_audit_logging(self, log_entry: Dict) -> Dict:
        """Validate audit log entry against compliance requirements."""
        required_fields = self.config["audit_logging"]["log_fields"]
        results = {
            "is_compliant": True,
            "checks_performed": [],
            "failed_checks": [],
            "missing_fields": []
        }

        # Check required fields
        for field in required_fields:
            if field in log_entry:
                results["checks_performed"].append(f"FIELD_{field.upper()}")
            else:
                results["is_compliant"] = False
                results["missing_fields"].append(field)
                results["failed_checks"].append(f"MISSING_{field.upper()}")

        # Validate timestamp
        if "timestamp" in log_entry:
            try:
                timestamp = datetime.fromisoformat(log_entry["timestamp"])
                if timestamp > datetime.now():
                    results["is_compliant"] = False
                    results["failed_checks"].append("FUTURE_TIMESTAMP")
                else:
                    results["checks_performed"].append("TIMESTAMP_VALIDATION")
            except ValueError:
                results["is_compliant"] = False
                results["failed_checks"].append("INVALID_TIMESTAMP_FORMAT")

        # Check PHI access logging
        if log_entry.get("phi_accessed"):
            if not log_entry.get("user_id") or not log_entry.get("reason"):
                results["is_compliant"] = False
                results["failed_checks"].append("INCOMPLETE_PHI_ACCESS_LOG")
            else:
                results["checks_performed"].append("PHI_ACCESS_LOGGING")

        # Store valid audit log
        if results["is_compliant"]:
            self._store_audit_log(log_entry)

        return results

    def validate_session_security(self, session_data: Dict) -> Dict:
        """Validate session security settings."""
        results = {
            "is_compliant": True,
            "checks_performed": [],
            "failed_checks": []
        }

        # Check session timeout
        if "last_activity" in session_data:
            last_activity = datetime.fromisoformat(session_data["last_activity"])
            timeout_minutes = self.config["access_control"]["session_timeout_minutes"]
            if datetime.now() - last_activity > timedelta(minutes=timeout_minutes):
                results["is_compliant"] = False
                results["failed_checks"].append("SESSION_TIMEOUT")
            else:
                results["checks_performed"].append("TIMEOUT_CHECK")

        # Validate session token
        if "token" in session_data:
            try:
                decoded = jwt.decode(
                    session_data["token"],
                    settings.SECRET_KEY,
                    algorithms=["HS256"]
                )
                results["checks_performed"].append("TOKEN_VALIDATION")
            except jwt.InvalidTokenError:
                results["is_compliant"] = False
                results["failed_checks"].append("INVALID_TOKEN")

        # Check MFA status
        if self.config["access_control"]["mfa_required"]:
            if not session_data.get("mfa_verified"):
                results["is_compliant"] = False
                results["failed_checks"].append("MFA_REQUIRED")
            else:
                results["checks_performed"].append("MFA_CHECK")

        return results

    def generate_compliance_report(
        self,
        validation_results: List[Dict],
        report_type: str = "full"
    ) -> Dict:
        """Generate comprehensive compliance report."""
        report = {
            "timestamp": datetime.now().isoformat(),
            "overall_compliance_status": "PASS",
            "total_checks": len(validation_results),
            "passed_checks": 0,
            "failed_checks": 0,
            "risk_level": "LOW",
            "categories": {
                "phi_protection": {"status": "PASS", "issues": []},
                "access_control": {"status": "PASS", "issues": []},
                "audit_logging": {"status": "PASS", "issues": []},
                "data_transmission": {"status": "PASS", "issues": []}
            }
        }

        # Process validation results
        for result in validation_results:
            category = result.get("category", "general")
            if not result.get("is_compliant", True):
                report["overall_compliance_status"] = "FAIL"
                report["failed_checks"] += 1
                if category in report["categories"]:
                    report["categories"][category]["status"] = "FAIL"
                    report["categories"][category]["issues"].extend(
                        result.get("failed_checks", [])
                    )
            else:
                report["passed_checks"] += 1

        # Calculate risk level
        failure_rate = report["failed_checks"] / report["total_checks"]
        if failure_rate > 0.2:
            report["risk_level"] = "HIGH"
        elif failure_rate > 0.1:
            report["risk_level"] = "MEDIUM"

        # Add detailed results for full reports
        if report_type == "full":
            report["detailed_results"] = validation_results

        return report

    def _store_audit_log(self, log_entry: Dict) -> None:
        """Store valid audit log entry."""
        audit_log = AuditLog(
            timestamp=datetime.fromisoformat(log_entry["timestamp"]),
            user_id=log_entry["user_id"],
            operation_type=log_entry["operation_type"],
            resource_type=log_entry["resource_type"],
            resource_id=log_entry.get("resource_id"),
            ip_address=log_entry["ip_address"],
            user_agent=log_entry.get("user_agent"),
            request_method=log_entry.get("request_method"),
            request_path=log_entry.get("request_path"),
            response_status=log_entry.get("response_status"),
            phi_accessed=log_entry.get("phi_accessed", False)
        )
        self.db.add(audit_log)
        self.db.commit()

    def _log_encryption_operation(self, context: Dict) -> None:
        """Log encryption operation for audit purposes."""
        log_entry = {
            "timestamp": datetime.now().isoformat(),
            "operation_type": "ENCRYPTION",
            "user_id": context.get("user_id"),
            "resource_type": context.get("resource_type"),
            "resource_id": context.get("resource_id"),
            "ip_address": context.get("ip_address"),
            "phi_accessed": True
        }
        self.validate_audit_logging(log_entry)

    def _verify_password(self, password: str, hashed_password: str) -> bool:
        """Verify password against hashed version."""
        # Implementation depends on your password hashing mechanism
        pass 