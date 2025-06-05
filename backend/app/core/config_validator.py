"""
Configuration validation system for Healthcare IVR Platform.

This module provides comprehensive validation for environment variables,
configuration consistency checks, and development environment standardization.
"""

import os
import re
import json
import logging
from typing import Dict, List, Optional, Tuple, Any, Union
from enum import Enum
from dataclasses import dataclass
from pathlib import Path
import base64
from urllib.parse import urlparse

logger = logging.getLogger(__name__)


class ValidationLevel(Enum):
    """Validation severity levels."""
    ERROR = "error"
    WARNING = "warning"
    INFO = "info"


class Environment(Enum):
    """Supported environments."""
    DEVELOPMENT = "development"
    STAGING = "staging"
    PRODUCTION = "production"


@dataclass
class ValidationResult:
    """Result of a configuration validation check."""
    level: ValidationLevel
    message: str
    key: Optional[str] = None
    value: Optional[str] = None
    suggestion: Optional[str] = None


@dataclass
class ConfigRequirement:
    """Configuration requirement definition."""
    key: str
    required: bool = True
    data_type: type = str
    pattern: Optional[str] = None
    min_length: Optional[int] = None
    max_length: Optional[int] = None
    allowed_values: Optional[List[str]] = None
    environment_specific: Optional[List[Environment]] = None
    description: str = ""
    default_value: Optional[Any] = None
    security_sensitive: bool = False


class ConfigValidator:
    """Comprehensive configuration validation system."""

    def __init__(self, environment: Optional[str] = None):
        """Initialize the configuration validator."""
        self.environment = Environment(environment or os.getenv("ENVIRONMENT", "development"))
        self.results: List[ValidationResult] = []
        self.config_requirements = self._define_requirements()

    def _define_requirements(self) -> Dict[str, ConfigRequirement]:
        """Define all configuration requirements."""
        return {
            # Core Application Settings
            "PROJECT_NAME": ConfigRequirement(
                key="PROJECT_NAME",
                required=True,
                default_value="Healthcare IVR Platform",
                description="Application name"
            ),
            "VERSION": ConfigRequirement(
                key="VERSION",
                required=False,
                pattern=r"^\d+\.\d+\.\d+$",
                description="Application version in semver format"
            ),
            "API_V1_STR": ConfigRequirement(
                key="API_V1_STR",
                required=True,
                default_value="/api/v1",
                pattern=r"^/api/v\d+$",
                description="API version prefix"
            ),
            "DEBUG": ConfigRequirement(
                key="DEBUG",
                required=True,
                data_type=bool,
                default_value=True,
                description="Debug mode flag"
            ),
            "ENVIRONMENT": ConfigRequirement(
                key="ENVIRONMENT",
                required=True,
                allowed_values=["development", "staging", "production"],
                default_value="development",
                description="Application environment"
            ),

            # Security Configuration
            "SECRET_KEY": ConfigRequirement(
                key="SECRET_KEY",
                required=True,
                min_length=32,
                security_sensitive=True,
                description="JWT secret key for token signing"
            ),
            "ALGORITHM": ConfigRequirement(
                key="ALGORITHM",
                required=True,
                allowed_values=["HS256", "HS384", "HS512", "RS256"],
                default_value="HS256",
                description="JWT signing algorithm"
            ),
            "ACCESS_TOKEN_EXPIRE_MINUTES": ConfigRequirement(
                key="ACCESS_TOKEN_EXPIRE_MINUTES",
                required=True,
                data_type=int,
                default_value=480,
                description="JWT token expiration time in minutes"
            ),
            "ENCRYPTION_KEY": ConfigRequirement(
                key="ENCRYPTION_KEY",
                required=True,
                min_length=32,
                security_sensitive=True,
                description="Fernet encryption key for PHI data"
            ),
            "ENCRYPTION_SALT": ConfigRequirement(
                key="ENCRYPTION_SALT",
                required=False,
                min_length=16,
                security_sensitive=True,
                description="Salt for encryption operations"
            ),
            "ENABLE_LOCAL_ENCRYPTION": ConfigRequirement(
                key="ENABLE_LOCAL_ENCRYPTION",
                required=True,
                data_type=bool,
                default_value=True,
                description="Enable local encryption service"
            ),

            # Database Configuration
            "DATABASE_URL": ConfigRequirement(
                key="DATABASE_URL",
                required=True,
                pattern=r"^postgresql(\+asyncpg)?://.*",
                description="PostgreSQL database connection URL"
            ),
            "DB_HOST": ConfigRequirement(
                key="DB_HOST",
                required=False,
                description="Database host (alternative to DATABASE_URL)"
            ),
            "DB_PORT": ConfigRequirement(
                key="DB_PORT",
                required=False,
                data_type=int,
                description="Database port (alternative to DATABASE_URL)"
            ),
            "DB_NAME": ConfigRequirement(
                key="DB_NAME",
                required=False,
                description="Database name (alternative to DATABASE_URL)"
            ),
            "DB_USER": ConfigRequirement(
                key="DB_USER",
                required=False,
                description="Database user (alternative to DATABASE_URL)"
            ),
            "DB_PASSWORD": ConfigRequirement(
                key="DB_PASSWORD",
                required=False,
                security_sensitive=True,
                description="Database password (alternative to DATABASE_URL)"
            ),

            # Authentication Configuration
            "AUTH_MODE": ConfigRequirement(
                key="AUTH_MODE",
                required=True,
                allowed_values=["local", "cognito"],
                default_value="local",
                description="Authentication mode"
            ),
            "USE_COGNITO": ConfigRequirement(
                key="USE_COGNITO",
                required=True,
                data_type=bool,
                default_value=False,
                description="Enable AWS Cognito authentication"
            ),

            # AWS Cognito Settings
            "AWS_COGNITO_USER_POOL_ID": ConfigRequirement(
                key="AWS_COGNITO_USER_POOL_ID",
                required=False,
                environment_specific=[Environment.STAGING, Environment.PRODUCTION],
                description="AWS Cognito User Pool ID"
            ),
            "AWS_COGNITO_CLIENT_ID": ConfigRequirement(
                key="AWS_COGNITO_CLIENT_ID",
                required=False,
                environment_specific=[Environment.STAGING, Environment.PRODUCTION],
                description="AWS Cognito Client ID"
            ),
            "COGNITO_CLIENT_SECRET": ConfigRequirement(
                key="COGNITO_CLIENT_SECRET",
                required=False,
                security_sensitive=True,
                environment_specific=[Environment.STAGING, Environment.PRODUCTION],
                description="AWS Cognito Client Secret"
            ),

            # AWS Configuration
            "AWS_ACCESS_KEY_ID": ConfigRequirement(
                key="AWS_ACCESS_KEY_ID",
                required=False,
                security_sensitive=True,
                environment_specific=[Environment.STAGING, Environment.PRODUCTION],
                description="AWS Access Key ID"
            ),
            "AWS_SECRET_ACCESS_KEY": ConfigRequirement(
                key="AWS_SECRET_ACCESS_KEY",
                required=False,
                security_sensitive=True,
                environment_specific=[Environment.STAGING, Environment.PRODUCTION],
                description="AWS Secret Access Key"
            ),
            "AWS_REGION": ConfigRequirement(
                key="AWS_REGION",
                required=False,
                pattern=r"^[a-z]{2}-[a-z]+-\d+$",
                default_value="us-east-1",
                description="AWS Region"
            ),

            # CORS Configuration
            "BACKEND_CORS_ORIGINS": ConfigRequirement(
                key="BACKEND_CORS_ORIGINS",
                required=True,
                description="Allowed CORS origins (JSON array format)"
            ),

            # Feature Flags
            "ENABLE_MOCK_SERVICES": ConfigRequirement(
                key="ENABLE_MOCK_SERVICES",
                required=False,
                data_type=bool,
                default_value=False,
                description="Enable mock external services"
            ),
            "ENABLE_DEMO_MODE": ConfigRequirement(
                key="ENABLE_DEMO_MODE",
                required=False,
                data_type=bool,
                default_value=False,
                description="Enable demo mode with sample data"
            ),

            # Development Settings
            "DEV_CORS_ORIGINS": ConfigRequirement(
                key="DEV_CORS_ORIGINS",
                required=False,
                environment_specific=[Environment.DEVELOPMENT],
                description="Development CORS origins"
            ),
            "DEV_DATABASE_URL": ConfigRequirement(
                key="DEV_DATABASE_URL",
                required=False,
                environment_specific=[Environment.DEVELOPMENT],
                pattern=r"^postgresql(\+asyncpg)?://.*",
                description="Development database URL"
            ),
            "LOCALSTACK_ENDPOINT": ConfigRequirement(
                key="LOCALSTACK_ENDPOINT",
                required=False,
                environment_specific=[Environment.DEVELOPMENT],
                pattern=r"^https?://.*",
                description="LocalStack endpoint for local AWS testing"
            ),

            # Demo Configuration
            "DEMO_USER_PASSWORD": ConfigRequirement(
                key="DEMO_USER_PASSWORD",
                required=False,
                min_length=8,
                security_sensitive=True,
                description="Password for demo users"
            ),
        }

    def validate_all(self) -> List[ValidationResult]:
        """Run all validation checks."""
        self.results = []

        # Basic validation checks
        self._validate_required_variables()
        self._validate_data_types()
        self._validate_patterns()
        self._validate_security_requirements()
        self._validate_environment_consistency()
        self._validate_database_configuration()
        self._validate_authentication_configuration()
        self._validate_cors_configuration()
        self._validate_aws_configuration()

        return self.results

    def _validate_required_variables(self) -> None:
        """Validate that all required environment variables are present."""
        for req in self.config_requirements.values():
            if not req.required:
                continue

            # Check environment-specific requirements
            if req.environment_specific and self.environment not in req.environment_specific:
                continue

            value = os.getenv(req.key)
            if value is None or value.strip() == "":
                self.results.append(ValidationResult(
                    level=ValidationLevel.ERROR,
                    message=f"Required environment variable '{req.key}' is missing",
                    key=req.key,
                    suggestion=f"Set {req.key} in your .env file. {req.description}"
                ))

    def _validate_data_types(self) -> None:
        """Validate data types of environment variables."""
        for req in self.config_requirements.values():
            value = os.getenv(req.key)
            if value is None:
                continue

            if req.data_type == bool:
                if value.lower() not in ["true", "false", "1", "0", "yes", "no"]:
                    self.results.append(ValidationResult(
                        level=ValidationLevel.ERROR,
                        message=f"'{req.key}' must be a boolean value",
                        key=req.key,
                        value=value,
                        suggestion="Use 'true', 'false', '1', '0', 'yes', or 'no'"
                    ))
            elif req.data_type == int:
                try:
                    int(value)
                except ValueError:
                    self.results.append(ValidationResult(
                        level=ValidationLevel.ERROR,
                        message=f"'{req.key}' must be an integer",
                        key=req.key,
                        value=value,
                        suggestion="Provide a valid integer value"
                    ))

    def _validate_patterns(self) -> None:
        """Validate environment variables against regex patterns."""
        for req in self.config_requirements.values():
            if not req.pattern:
                continue

            value = os.getenv(req.key)
            if value is None:
                continue

            if not re.match(req.pattern, value):
                self.results.append(ValidationResult(
                    level=ValidationLevel.ERROR,
                    message=f"'{req.key}' does not match required pattern",
                    key=req.key,
                    value=value,
                    suggestion=f"Value must match pattern: {req.pattern}"
                ))

    def _validate_security_requirements(self) -> None:
        """Validate security-related configuration."""
        # Check for insecure default values
        insecure_defaults = [
            "CHANGE_ME",
            "INSECURE_DEFAULT",
            "your_secret_key",
            "password",
            "admin",
            "test",
        ]

        for req in self.config_requirements.values():
            if not req.security_sensitive:
                continue

            value = os.getenv(req.key)
            if value is None:
                continue

            # Check for insecure defaults
            for insecure in insecure_defaults:
                if insecure.lower() in value.lower():
                    self.results.append(ValidationResult(
                        level=ValidationLevel.ERROR,
                        message=f"'{req.key}' contains insecure default value",
                        key=req.key,
                        suggestion="Generate a strong, unique value for this security-sensitive setting"
                    ))
                    break

            # Check minimum length for security-sensitive keys
            if req.min_length and len(value) < req.min_length:
                self.results.append(ValidationResult(
                    level=ValidationLevel.ERROR,
                    message=f"'{req.key}' is too short for security requirements",
                    key=req.key,
                    suggestion=f"Must be at least {req.min_length} characters long"
                ))

    def _validate_environment_consistency(self) -> None:
        """Validate configuration consistency for the current environment."""
        env = self.environment

        if env == Environment.PRODUCTION:
            # Production-specific validations
            debug = os.getenv("DEBUG", "").lower()
            if debug in ["true", "1", "yes"]:
                self.results.append(ValidationResult(
                    level=ValidationLevel.WARNING,
                    message="DEBUG mode is enabled in production environment",
                    key="DEBUG",
                    suggestion="Set DEBUG=false for production"
                ))

        elif env == Environment.DEVELOPMENT:
            # Development-specific validations
            secret_key = os.getenv("SECRET_KEY", "")
            if "production" in secret_key.lower():
                self.results.append(ValidationResult(
                    level=ValidationLevel.WARNING,
                    message="Using production-like secret key in development",
                    key="SECRET_KEY",
                    suggestion="Use a development-specific secret key"
                ))

    def _validate_database_configuration(self) -> None:
        """Validate database configuration."""
        database_url = os.getenv("DATABASE_URL")

        if database_url:
            # Validate database URL format
            try:
                parsed = urlparse(database_url)
                if not parsed.scheme.startswith("postgresql"):
                    self.results.append(ValidationResult(
                        level=ValidationLevel.ERROR,
                        message="DATABASE_URL must use PostgreSQL scheme",
                        key="DATABASE_URL",
                        suggestion="Use postgresql:// or postgresql+asyncpg:// scheme"
                    ))

                if not parsed.hostname:
                    self.results.append(ValidationResult(
                        level=ValidationLevel.ERROR,
                        message="DATABASE_URL missing hostname",
                        key="DATABASE_URL"
                    ))

                if not parsed.path or parsed.path == "/":
                    self.results.append(ValidationResult(
                        level=ValidationLevel.ERROR,
                        message="DATABASE_URL missing database name",
                        key="DATABASE_URL"
                    ))

            except Exception as e:
                self.results.append(ValidationResult(
                    level=ValidationLevel.ERROR,
                    message=f"Invalid DATABASE_URL format: {str(e)}",
                    key="DATABASE_URL"
                ))
        else:
            # Check if individual DB components are provided
            db_components = ["DB_HOST", "DB_PORT", "DB_NAME", "DB_USER", "DB_PASSWORD"]
            missing_components = [comp for comp in db_components if not os.getenv(comp)]

            if missing_components:
                self.results.append(ValidationResult(
                    level=ValidationLevel.ERROR,
                    message="Either DATABASE_URL or all DB_* components must be provided",
                    suggestion=f"Missing: {', '.join(missing_components)}"
                ))

    def _validate_authentication_configuration(self) -> None:
        """Validate authentication configuration."""
        auth_mode = os.getenv("AUTH_MODE", "local")
        use_cognito = os.getenv("USE_COGNITO", "false").lower() in ["true", "1", "yes"]

        if auth_mode == "cognito" or use_cognito:
            # Validate Cognito configuration
            cognito_vars = ["AWS_COGNITO_USER_POOL_ID", "AWS_COGNITO_CLIENT_ID"]
            for var in cognito_vars:
                if not os.getenv(var):
                    self.results.append(ValidationResult(
                        level=ValidationLevel.ERROR,
                        message=f"'{var}' is required when using Cognito authentication",
                        key=var,
                        suggestion="Configure AWS Cognito settings or switch to local auth mode"
                    ))

        # Validate consistency
        if auth_mode == "local" and use_cognito:
            self.results.append(ValidationResult(
                level=ValidationLevel.WARNING,
                message="AUTH_MODE is 'local' but USE_COGNITO is enabled",
                suggestion="Ensure AUTH_MODE and USE_COGNITO settings are consistent"
            ))

    def _validate_cors_configuration(self) -> None:
        """Validate CORS configuration."""
        cors_origins = os.getenv("BACKEND_CORS_ORIGINS")

        if cors_origins:
            try:
                origins = json.loads(cors_origins)
                if not isinstance(origins, list):
                    self.results.append(ValidationResult(
                        level=ValidationLevel.ERROR,
                        message="BACKEND_CORS_ORIGINS must be a JSON array",
                        key="BACKEND_CORS_ORIGINS",
                        suggestion='Use format: ["http://localhost:3000","https://yourdomain.com"]'
                    ))
                else:
                    # Validate each origin
                    for origin in origins:
                        if not isinstance(origin, str) or not origin.startswith(("http://", "https://")):
                            self.results.append(ValidationResult(
                                level=ValidationLevel.WARNING,
                                message=f"Invalid CORS origin format: {origin}",
                                key="BACKEND_CORS_ORIGINS",
                                suggestion="Origins should start with http:// or https://"
                            ))
            except json.JSONDecodeError:
                self.results.append(ValidationResult(
                    level=ValidationLevel.ERROR,
                    message="BACKEND_CORS_ORIGINS is not valid JSON",
                    key="BACKEND_CORS_ORIGINS",
                    suggestion='Use format: ["http://localhost:3000","https://yourdomain.com"]'
                ))

    def _validate_aws_configuration(self) -> None:
        """Validate AWS configuration."""
        if self.environment in [Environment.STAGING, Environment.PRODUCTION]:
            aws_vars = ["AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY", "AWS_REGION"]
            missing_aws = [var for var in aws_vars if not os.getenv(var)]

            if missing_aws:
                self.results.append(ValidationResult(
                    level=ValidationLevel.WARNING,
                    message=f"AWS configuration incomplete: {', '.join(missing_aws)}",
                    suggestion="Configure AWS credentials for production deployment"
                ))

    def validate_encryption_key(self, key: str) -> bool:
        """Validate that an encryption key is properly formatted for Fernet."""
        try:
            # Try to decode the key
            decoded = base64.urlsafe_b64decode(key.encode())
            # Fernet keys must be exactly 32 bytes
            return len(decoded) == 32
        except Exception:
            return False

    def generate_report(self) -> str:
        """Generate a comprehensive validation report."""
        if not self.results:
            self.validate_all()

        report = []
        report.append("=" * 80)
        report.append("HEALTHCARE IVR PLATFORM - CONFIGURATION VALIDATION REPORT")
        report.append("=" * 80)
        report.append(f"Environment: {self.environment.value}")
        report.append(f"Timestamp: {os.popen('date').read().strip()}")
        report.append("")

        # Summary
        errors = [r for r in self.results if r.level == ValidationLevel.ERROR]
        warnings = [r for r in self.results if r.level == ValidationLevel.WARNING]
        info = [r for r in self.results if r.level == ValidationLevel.INFO]

        report.append("SUMMARY:")
        report.append(f"  Errors: {len(errors)}")
        report.append(f"  Warnings: {len(warnings)}")
        report.append(f"  Info: {len(info)}")
        report.append("")

        # Detailed results
        for level in [ValidationLevel.ERROR, ValidationLevel.WARNING, ValidationLevel.INFO]:
            level_results = [r for r in self.results if r.level == level]
            if not level_results:
                continue

            report.append(f"{level.value.upper()} ISSUES:")
            report.append("-" * 40)

            for result in level_results:
                report.append(f"• {result.message}")
                if result.key:
                    report.append(f"  Key: {result.key}")
                if result.value:
                    report.append(f"  Value: {result.value}")
                if result.suggestion:
                    report.append(f"  Suggestion: {result.suggestion}")
                report.append("")

        # Configuration checklist
        report.append("CONFIGURATION CHECKLIST:")
        report.append("-" * 40)

        for req in self.config_requirements.values():
            if req.environment_specific and self.environment not in req.environment_specific:
                continue

            value = os.getenv(req.key)
            status = "✓" if value else "✗"
            required_text = "REQUIRED" if req.required else "OPTIONAL"

            report.append(f"{status} {req.key} ({required_text})")
            if req.description:
                report.append(f"    {req.description}")
            if not value and req.default_value is not None:
                report.append(f"    Default: {req.default_value}")
            report.append("")

        report.append("=" * 80)

        return "\n".join(report)

    def is_valid(self) -> bool:
        """Check if configuration is valid (no errors)."""
        if not self.results:
            self.validate_all()
        return not any(r.level == ValidationLevel.ERROR for r in self.results)

    def get_missing_required_vars(self) -> List[str]:
        """Get list of missing required environment variables."""
        missing = []
        for req in self.config_requirements.values():
            if not req.required:
                continue
            if req.environment_specific and self.environment not in req.environment_specific:
                continue
            if not os.getenv(req.key):
                missing.append(req.key)
        return missing


def validate_configuration(environment: Optional[str] = None) -> Tuple[bool, List[ValidationResult]]:
    """
    Validate the current configuration.

    Args:
        environment: Target environment (development, staging, production)

    Returns:
        Tuple of (is_valid, validation_results)
    """
    validator = ConfigValidator(environment)
    results = validator.validate_all()
    is_valid = validator.is_valid()

    return is_valid, results


def generate_env_template(environment: str = "development") -> str:
    """Generate a .env template file for the specified environment."""
    validator = ConfigValidator(environment)

    template = []
    template.append(f"# Healthcare IVR Platform - {environment.title()} Environment Configuration")
    template.append("# Generated configuration template")
    template.append("")

    # Group requirements by category
    categories = {
        "Core Application": ["PROJECT_NAME", "VERSION", "API_V1_STR", "DEBUG", "ENVIRONMENT"],
        "Security": ["SECRET_KEY", "ALGORITHM", "ACCESS_TOKEN_EXPIRE_MINUTES", "ENCRYPTION_KEY", "ENCRYPTION_SALT"],
        "Database": ["DATABASE_URL", "DB_HOST", "DB_PORT", "DB_NAME", "DB_USER", "DB_PASSWORD"],
        "Authentication": ["AUTH_MODE", "USE_COGNITO", "AWS_COGNITO_USER_POOL_ID", "AWS_COGNITO_CLIENT_ID"],
        "AWS": ["AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY", "AWS_REGION"],
        "CORS": ["BACKEND_CORS_ORIGINS", "DEV_CORS_ORIGINS"],
        "Features": ["ENABLE_MOCK_SERVICES", "ENABLE_DEMO_MODE"],
        "Development": ["DEV_DATABASE_URL", "LOCALSTACK_ENDPOINT", "DEMO_USER_PASSWORD"],
    }

    for category, keys in categories.items():
        template.append(f"# {category}")
        template.append("-" * (len(category) + 2))

        for key in keys:
            req = validator.config_requirements.get(key)
            if not req:
                continue

            # Skip environment-specific vars for other environments
            if req.environment_specific and Environment(environment) not in req.environment_specific:
                continue

            # Add description as comment
            if req.description:
                template.append(f"# {req.description}")

            # Add requirement info
            req_text = "REQUIRED" if req.required else "OPTIONAL"
            template.append(f"# {req_text}")

            # Add default value or placeholder
            if req.default_value is not None:
                template.append(f"{key}={req.default_value}")
            elif req.security_sensitive:
                template.append(f"{key}=CHANGE_ME_TO_SECURE_VALUE")
            else:
                template.append(f"{key}=")

            template.append("")

    return "\n".join(template)


if __name__ == "__main__":
    # CLI interface for configuration validation
    import sys

    if len(sys.argv) > 1:
        env = sys.argv[1]
    else:
        env = os.getenv("ENVIRONMENT", "development")

    validator = ConfigValidator(env)
    print(validator.generate_report())

    if not validator.is_valid():
        sys.exit(1)
