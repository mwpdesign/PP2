#!/usr/bin/env python3
"""
Configuration validation CLI script for Healthcare IVR Platform.

This script provides command-line interface for validating environment
configuration, generating templates, and checking configuration status.
"""

import os
import sys
import argparse
from pathlib import Path

# Add the backend directory to the Python path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from app.core.config_validator import (
    ConfigValidator,
    generate_env_template
)


def validate_config(environment: str = None) -> int:
    """Validate configuration and return exit code."""
    print("Healthcare IVR Platform - Configuration Validation")
    print("=" * 60)

    try:
        validator = ConfigValidator(environment)
        report = validator.generate_report()
        print(report)

        if validator.is_valid():
            print("\n✅ Configuration validation PASSED")
            return 0
        else:
            print("\n❌ Configuration validation FAILED")
            return 1

    except Exception as e:
        print(f"\n💥 Validation error: {str(e)}")
        return 1


def generate_template(environment: str, output_file: str = None) -> int:
    """Generate configuration template."""
    try:
        template = generate_env_template(environment)

        if output_file:
            if os.path.exists(output_file):
                print(f"❌ File {output_file} already exists")
                return 1

            with open(output_file, 'w') as f:
                f.write(template)
            print(f"✅ Template generated: {output_file}")
        else:
            print(template)

        return 0

    except Exception as e:
        print(f"💥 Template generation error: {str(e)}")
        return 1


def check_missing_vars(environment: str = None) -> int:
    """Check for missing required variables."""
    try:
        validator = ConfigValidator(environment)
        missing = validator.get_missing_required_vars()

        if missing:
            print("❌ Missing required environment variables:")
            for var in missing:
                print(f"  - {var}")
            return 1
        else:
            print("✅ All required environment variables are present")
            return 0

    except Exception as e:
        print(f"💥 Check error: {str(e)}")
        return 1


def main():
    """Main CLI function."""
    parser = argparse.ArgumentParser(
        description="Healthcare IVR Platform Configuration Validator"
    )

    subparsers = parser.add_subparsers(dest='command', help='Commands')

    # Validate command
    validate_parser = subparsers.add_parser(
        'validate',
        help='Validate configuration'
    )
    validate_parser.add_argument(
        '--environment', '-e',
        choices=['development', 'staging', 'production'],
        help='Target environment'
    )

    # Generate template command
    template_parser = subparsers.add_parser(
        'template',
        help='Generate configuration template'
    )
    template_parser.add_argument(
        'environment',
        choices=['development', 'staging', 'production'],
        help='Target environment'
    )
    template_parser.add_argument(
        '--output', '-o',
        help='Output file path'
    )

    # Check missing variables command
    missing_parser = subparsers.add_parser(
        'check-missing',
        help='Check for missing required variables'
    )
    missing_parser.add_argument(
        '--environment', '-e',
        choices=['development', 'staging', 'production'],
        help='Target environment'
    )

    args = parser.parse_args()

    if not args.command:
        parser.print_help()
        return 1

    if args.command == 'validate':
        return validate_config(args.environment)
    elif args.command == 'template':
        return generate_template(args.environment, args.output)
    elif args.command == 'check-missing':
        return check_missing_vars(args.environment)
    else:
        parser.print_help()
        return 1


if __name__ == "__main__":
    sys.exit(main())