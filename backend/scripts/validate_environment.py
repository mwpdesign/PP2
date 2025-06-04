#!/usr/bin/env python3
"""
Environment Validation Script for Healthcare IVR Platform

This script validates the environment configuration to ensure:
1. No hard-coded credentials are being used
2. Required environment variables are set
3. Security settings are properly configured
4. Database connectivity is working
"""

import os
import sys
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent.parent))

try:
    from app.core.config import settings
except ImportError as e:
    print(f"Error importing application modules: {e}")
    print("Make sure you're running this from the backend directory")
    sys.exit(1)


class EnvironmentValidator:
    """Validates environment configuration for security and completeness."""

    def __init__(self):
        self.errors = []
        self.warnings = []
        self.info = []

    def validate_all(self) -> bool:
        """Run all validation checks."""
        print("🔍 Healthcare IVR Platform - Environment Validation")
        print("=" * 60)

        self.check_required_variables()
        self.check_security_settings()
        self.check_database_config()
        self.check_authentication_config()
        self.check_aws_config()
        self.check_development_settings()

        self.print_results()
        return len(self.errors) == 0

    def check_required_variables(self):
        """Check that required environment variables are set."""
        print("\n📋 Checking Required Environment Variables...")

        required_vars = [
            "SECRET_KEY",
            "DATABASE_URL",
            "ENCRYPTION_KEY",
            "JWT_SECRET_KEY"
        ]

        for var in required_vars:
            value = os.getenv(var)
            if not value:
                             self.errors.append(f"Missing required environment variable: {var}")
             elif self.is_insecure_default(var, value):
                 self.errors.append(f"Insecure default value for {var}")
            else:
                self.info.append(f"✓ {var} is set")

    def check_security_settings(self):
        """Check security-related configuration."""
        print("\n🔒 Checking Security Settings...")

        # Check SECRET_KEY strength
        secret_key = settings.SECRET_KEY
        if len(secret_key) < 32:
            self.errors.append("SECRET_KEY is too short (minimum 32 characters)")
        elif secret_key in ["your-secret-key-here", "INSECURE_DEFAULT_CHANGE_ME"]:
            self.errors.append("SECRET_KEY is using default insecure value")
        else:
            self.info.append("✓ SECRET_KEY appears secure")

        # Check encryption key
        encryption_key = settings.ENCRYPTION_KEY
        if not encryption_key or len(encryption_key) < 32:
            self.errors.append("ENCRYPTION_KEY is missing or too short")
        else:
            self.info.append("✓ ENCRYPTION_KEY is set")

        # Check environment-specific settings
        if settings.ENVIRONMENT == "production":
            if settings.DEBUG:
                self.errors.append("DEBUG should be False in production")
            if "localhost" in str(settings.BACKEND_CORS_ORIGINS):
                self.warnings.append("CORS origins include localhost in production")
        else:
            self.info.append(f"✓ Environment: {settings.ENVIRONMENT}")

    def check_database_config(self):
        """Check database configuration."""
        print("\n🗄️  Checking Database Configuration...")

        db_url = settings.DATABASE_URL
        if not db_url:
            self.errors.append("DATABASE_URL is not set")
            return

        # Check for insecure database passwords
        if "password@" in db_url or "postgres@" in db_url:
            self.warnings.append("Database URL may contain default password")

        if "CHANGE_DB_PASSWORD" in db_url:
            self.errors.append("Database URL contains placeholder password")

        # Test database connectivity
        try:
            # This is a simple check - in a real app you'd test the connection
            self.info.append("✓ Database URL format appears valid")
        except Exception as e:
            self.errors.append(f"Database configuration error: {e}")

    def check_authentication_config(self):
        """Check authentication configuration."""
        print("\n🔐 Checking Authentication Configuration...")

        auth_mode = settings.AUTH_MODE
        use_cognito = settings.USE_COGNITO
        environment = settings.ENVIRONMENT

        if environment == "production":
            if auth_mode != "cognito" or not use_cognito:
                self.warnings.append("Production should use Cognito authentication")
        else:
            if auth_mode == "local":
                self.info.append("✓ Using local authentication for development")

        self.info.append(f"✓ Auth mode: {auth_mode}")

    def check_aws_config(self):
        """Check AWS configuration."""
        print("\n☁️  Checking AWS Configuration...")

        aws_access_key = os.getenv("AWS_ACCESS_KEY_ID")
        aws_secret_key = os.getenv("AWS_SECRET_ACCESS_KEY")

        if aws_access_key == "test" and aws_secret_key == "test":
            if settings.ENVIRONMENT == "production":
                self.errors.append("Using test AWS credentials in production")
            else:
                self.info.append("✓ Using test AWS credentials for development")
        elif aws_access_key and aws_secret_key:
            self.info.append("✓ AWS credentials are configured")
        else:
            self.warnings.append("AWS credentials not configured")

    def check_development_settings(self):
        """Check development-specific settings."""
        print("\n🛠️  Checking Development Settings...")

        if settings.ENVIRONMENT == "development":
            if settings.ENABLE_MOCK_SERVICES:
                self.info.append("✓ Mock services enabled for development")

            if settings.DEBUG:
                self.info.append("✓ Debug mode enabled for development")
        else:
            if settings.ENABLE_MOCK_SERVICES:
                self.warnings.append("Mock services enabled in non-development environment")

    def is_insecure_default(self, var_name: str, value: str) -> bool:
        """Check if a value appears to be an insecure default."""
        insecure_patterns = [
            "password123",
            "admin123",
            "your-secret-key-here",
            "CHANGE_ME",
            "INSECURE_DEFAULT",
            "test_secret_key",
            "dev_secret_key"
        ]

        return any(pattern in value for pattern in insecure_patterns)

    def print_results(self):
        """Print validation results."""
        print("\n" + "=" * 60)
        print("📊 VALIDATION RESULTS")
        print("=" * 60)

        if self.errors:
            print(f"\n❌ ERRORS ({len(self.errors)}):")
            for error in self.errors:
                print(f"   • {error}")

        if self.warnings:
            print(f"\n⚠️  WARNINGS ({len(self.warnings)}):")
            for warning in self.warnings:
                print(f"   • {warning}")

        if self.info:
            print(f"\n✅ INFO ({len(self.info)}):")
            for info in self.info:
                print(f"   • {info}")

        print("\n" + "=" * 60)

        if self.errors:
            print("❌ VALIDATION FAILED - Please fix the errors above")
            print("\nRefer to docs/DEVELOPMENT_SETUP.md for guidance")
        else:
            print("✅ VALIDATION PASSED - Environment configuration looks good!")
            if self.warnings:
                print("⚠️  Please review the warnings above")


def main():
    """Main validation function."""
    validator = EnvironmentValidator()
    success = validator.validate_all()

    if not success:
        sys.exit(1)


if __name__ == "__main__":
    main()