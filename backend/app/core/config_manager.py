"""
Configuration manager for Healthcare IVR Platform.

This module provides configuration management functionality including
validation, environment setup, and configuration consistency checks.
"""

import os
import logging
from typing import Dict, List, Optional, Any

from app.core.config_validator import (
    ConfigValidator,
    ValidationLevel,
    ValidationResult,
    validate_configuration,
    generate_env_template
)
from app.core.config import get_settings

logger = logging.getLogger(__name__)


class ConfigManager:
    """Configuration management system."""

    def __init__(self):
        """Initialize the configuration manager."""
        self.validator = ConfigValidator()
        self.settings = get_settings()
        self._validation_results: Optional[List[ValidationResult]] = None

    def validate_startup_config(self) -> bool:
        """
        Validate configuration at application startup.

        Returns:
            True if configuration is valid, False otherwise
        """
        try:
            is_valid, results = validate_configuration()
            self._validation_results = results

            if not is_valid:
                logger.error("Configuration validation failed at startup")
                self._log_validation_errors(results)
                return False

            # Log warnings but don't fail startup
            warnings = [r for r in results
                        if r.level == ValidationLevel.WARNING]
            if warnings:
                logger.warning(
                    f"Configuration has {len(warnings)} warnings")
                for warning in warnings:
                    logger.warning(f"Config warning: {warning.message}")

            logger.info("Configuration validation passed")
            return True

        except Exception as e:
            logger.error(f"Configuration validation error: {str(e)}")
            return False

    def _log_validation_errors(self, results: List[ValidationResult]) -> None:
        """Log validation errors."""
        errors = [r for r in results if r.level == ValidationLevel.ERROR]
        for error in errors:
            logger.error(f"Config error: {error.message}")
            if error.suggestion:
                logger.error(f"  Suggestion: {error.suggestion}")

    def get_validation_report(self) -> str:
        """Get the full validation report."""
        return self.validator.generate_report()

    def check_required_env_vars(self) -> List[str]:
        """Get list of missing required environment variables."""
        return self.validator.get_missing_required_vars()

    def validate_encryption_setup(self) -> bool:
        """Validate encryption configuration."""
        encryption_key = os.getenv("ENCRYPTION_KEY")
        if not encryption_key:
            logger.error("ENCRYPTION_KEY not found in environment")
            return False

        if not self.validator.validate_encryption_key(encryption_key):
            logger.error("ENCRYPTION_KEY is not a valid Fernet key")
            return False

        logger.info("Encryption configuration validated successfully")
        return True

    def validate_database_config(self) -> bool:
        """Validate database configuration."""
        database_url = os.getenv("DATABASE_URL")
        if not database_url:
            logger.error("DATABASE_URL not found in environment")
            return False

        # Additional database validation can be added here
        logger.info("Database configuration validated successfully")
        return True

    def setup_development_environment(self) -> bool:
        """Set up development environment with proper configuration."""
        try:
            # Check if we're in development mode
            if os.getenv("ENVIRONMENT") != "development":
                logger.warning(
                    "setup_development_environment called in "
                    "non-development environment")
                return False

            # Validate development-specific configuration
            is_valid, results = validate_configuration("development")

            if not is_valid:
                logger.error("Development configuration validation failed")
                self._log_validation_errors(results)
                return False

            logger.info("Development environment setup completed successfully")
            return True

        except Exception as e:
            logger.error(f"Failed to setup development environment: {str(e)}")
            return False

    def generate_config_template(self, environment: str = "development") -> str:
        """Generate configuration template for specified environment."""
        return generate_env_template(environment)

    def check_security_configuration(self) -> Dict[str, Any]:
        """Check security-related configuration."""
        security_check = {
            "encryption_key_valid": False,
            "secret_key_secure": False,
            "debug_mode_appropriate": False,
            "cors_configured": False,
            "issues": []
        }

        # Check encryption key
        encryption_key = os.getenv("ENCRYPTION_KEY")
        if encryption_key and self.validator.validate_encryption_key(encryption_key):
            security_check["encryption_key_valid"] = True
        else:
            security_check["issues"].append("Invalid or missing encryption key")

        # Check secret key
        secret_key = os.getenv("SECRET_KEY", "")
        if len(secret_key) >= 32 and "CHANGE_ME" not in secret_key:
            security_check["secret_key_secure"] = True
        else:
            security_check["issues"].append("Weak or default secret key")

        # Check debug mode
        debug = os.getenv("DEBUG", "").lower()
        environment = os.getenv("ENVIRONMENT", "development")
        if environment == "production" and debug not in ["true", "1", "yes"]:
            security_check["debug_mode_appropriate"] = True
        elif environment != "production":
            security_check["debug_mode_appropriate"] = True
        else:
            security_check["issues"].append("Debug mode enabled in production")

        # Check CORS configuration
        cors_origins = os.getenv("BACKEND_CORS_ORIGINS")
        if cors_origins:
            security_check["cors_configured"] = True
        else:
            security_check["issues"].append("CORS origins not configured")

        return security_check

    def get_environment_info(self) -> Dict[str, Any]:
        """Get comprehensive environment information."""
        return {
            "environment": os.getenv("ENVIRONMENT", "development"),
            "debug_mode": os.getenv("DEBUG", "false").lower() in ["true", "1", "yes"],
            "auth_mode": os.getenv("AUTH_MODE", "local"),
            "use_cognito": os.getenv("USE_COGNITO", "false").lower() in ["true", "1", "yes"],
            "database_url_configured": bool(os.getenv("DATABASE_URL")),
            "encryption_enabled": bool(os.getenv("ENCRYPTION_KEY")),
            "cors_origins_count": len(os.getenv("BACKEND_CORS_ORIGINS", "").split(",")) if os.getenv("BACKEND_CORS_ORIGINS") else 0,
            "validation_status": "valid" if self.validator.is_valid() else "invalid"
        }

    def create_env_file_from_template(self, environment: str = "development", output_path: str = ".env") -> bool:
        """Create a .env file from template."""
        try:
            template_content = self.generate_config_template(environment)

            # Check if file already exists
            if os.path.exists(output_path):
                logger.warning(f"Environment file {output_path} already exists")
                return False

            with open(output_path, 'w') as f:
                f.write(template_content)

            logger.info(f"Created environment file: {output_path}")
            return True

        except Exception as e:
            logger.error(f"Failed to create environment file: {str(e)}")
            return False

    def backup_current_config(self, backup_path: Optional[str] = None) -> bool:
        """Backup current configuration."""
        try:
            if backup_path is None:
                backup_path = f".env.backup.{os.popen('date +%Y%m%d_%H%M%S').read().strip()}"

            env_file = ".env"
            if not os.path.exists(env_file):
                logger.warning("No .env file found to backup")
                return False

            import shutil
            shutil.copy2(env_file, backup_path)

            logger.info(f"Configuration backed up to: {backup_path}")
            return True

        except Exception as e:
            logger.error(f"Failed to backup configuration: {str(e)}")
            return False


# Global configuration manager instance
config_manager = ConfigManager()


def get_config_manager() -> ConfigManager:
    """Get the global configuration manager instance."""
    return config_manager


def validate_startup_configuration() -> bool:
    """Validate configuration at application startup."""
    return config_manager.validate_startup_config()


def get_configuration_status() -> Dict[str, Any]:
    """Get current configuration status."""
    return {
        "environment_info": config_manager.get_environment_info(),
        "security_check": config_manager.check_security_configuration(),
        "missing_required_vars": config_manager.check_required_env_vars(),
        "validation_passed": config_manager.validator.is_valid()
    }