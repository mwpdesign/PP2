#!/usr/bin/env python3

import os
import sys
import json
import logging
import subprocess
import boto3
import psycopg2
from typing import Dict, Any, List
from datetime import datetime
from pathlib import Path
from cryptography.fernet import Fernet


class IntelligentRemediationEngine:
    """Intelligent remediation engine for Healthcare IVR Platform"""

    def __init__(self, verification_report: Dict[str, Any]):
        self.verification_report = verification_report
        self.project_root = Path(os.getcwd())
        self.logger = self._setup_logging()
        self.remediation_results = {
            "timestamp": datetime.now().isoformat(),
            "overall_status": "PENDING",
            "actions_taken": [],
        }

    def _setup_logging(self) -> logging.Logger:
        """Configure logging for the remediation engine"""
        logger = logging.getLogger("intelligent_remediation")
        logger.setLevel(logging.INFO)

        # Create logs directory
        log_dir = self.project_root / "remediation_reports/logs"
        log_dir.mkdir(parents=True, exist_ok=True)

        # Create file handler
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        log_file = log_dir / f"remediation_{timestamp}.log"

        handler = logging.FileHandler(log_file)
        fmt = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
        handler.setFormatter(logging.Formatter(fmt))

        logger.addHandler(handler)
        return logger

    def remediate_project_structure(
        self, issues: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """Remediate project structure issues"""
        self.logger.info("Remediating project structure issues")
        actions = []

        # Create missing directories
        for dir_name, details in issues.get("directories", {}).items():
            if not details.get("exists", True):
                try:
                    dir_path = self.project_root / dir_name
                    dir_path.mkdir(parents=True, exist_ok=True)
                    actions.append(
                        {"action": f"Created directory {dir_name}", "status": "SUCCESS"}
                    )
                except Exception as e:
                    actions.append(
                        {
                            "action": f"Failed to create directory {dir_name}",
                            "status": "FAIL",
                            "error": str(e),
                        }
                    )

        # Create missing files with templates
        templates = {
            "README.md": self._get_readme_template(),
            ".env.example": self._get_env_template(),
            "docker-compose.yml": self._get_docker_compose_template(),
            "requirements.txt": self._get_requirements_template(),
            "package.json": self._get_package_json_template(),
        }

        for file_name, details in issues.get("files", {}).items():
            if not details.get("exists", True):
                try:
                    file_path = self.project_root / file_name
                    file_path.parent.mkdir(parents=True, exist_ok=True)

                    template = templates.get(file_name, "# Generated file\n")
                    file_path.write_text(template)

                    actions.append(
                        {"action": f"Created file {file_name}", "status": "SUCCESS"}
                    )
                except Exception as e:
                    actions.append(
                        {
                            "action": f"Failed to create file {file_name}",
                            "status": "FAIL",
                            "error": str(e),
                        }
                    )

        return actions

    def remediate_development_environment(
        self, issues: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """Remediate development environment issues"""
        self.logger.info("Remediating development environment issues")
        actions = []

        # Install missing tools
        package_managers = {
            "python": "pip install",
            "node": "npm install -g",
            "docker": "brew install",
            "terraform": "brew install",
        }

        for tool, details in issues.get("tools", {}).items():
            if not details.get("installed", True):
                try:
                    manager = next(
                        (m for t, m in package_managers.items() if t in tool), None
                    )
                    if manager:
                        cmd = f"{manager} {tool}"
                        subprocess.run(
                            cmd.split(), check=True, capture_output=True, text=True
                        )
                        actions.append(
                            {"action": f"Installed {tool}", "status": "SUCCESS"}
                        )
                except Exception as e:
                    actions.append(
                        {
                            "action": f"Failed to install {tool}",
                            "status": "FAIL",
                            "error": str(e),
                        }
                    )

        return actions

    def remediate_docker_services(self, issues: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Remediate Docker service issues"""
        self.logger.info("Remediating Docker service issues")
        actions = []

        for service, details in issues.get("services", {}).items():
            if not details.get("running", True):
                try:
                    # Try to start the service
                    subprocess.run(
                        ["docker-compose", "up", "-d", service],
                        check=True,
                        capture_output=True,
                        text=True,
                    )

                    # Verify service started
                    result = subprocess.run(
                        ["docker-compose", "ps", service, "--format", "json"],
                        check=True,
                        capture_output=True,
                        text=True,
                    )
                    service_status = json.loads(result.stdout)

                    if "running" in service_status.get("State", "").lower():
                        actions.append(
                            {
                                "action": f"Started Docker service {service}",
                                "status": "SUCCESS",
                            }
                        )
                    else:
                        actions.append(
                            {
                                "action": f"Failed to start Docker service {service}",
                                "status": "FAIL",
                                "error": "Service not running after start attempt",
                            }
                        )
                except Exception as e:
                    actions.append(
                        {
                            "action": f"Failed to start Docker service {service}",
                            "status": "FAIL",
                            "error": str(e),
                        }
                    )

        return actions

    def remediate_database(self, issues: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Remediate database issues"""
        self.logger.info("Remediating database issues")
        actions = []

        if not issues.get("connection", {}).get("connected", True):
            try:
                # Try to start database service
                subprocess.run(
                    ["docker-compose", "up", "-d", "postgres"],
                    check=True,
                    capture_output=True,
                    text=True,
                )
                actions.append(
                    {"action": "Started database service", "status": "SUCCESS"}
                )
            except Exception as e:
                actions.append(
                    {
                        "action": "Failed to start database service",
                        "status": "FAIL",
                        "error": str(e),
                    }
                )
                return actions

        # Create missing tables
        try:
            db_url = "postgresql://localhost:5432/healthcare_ivr"
            conn = psycopg2.connect(db_url)
            cur = conn.cursor()

            for table, details in issues.get("tables", {}).items():
                if not details.get("exists", True):
                    try:
                        # Get table schema from migrations
                        schema_file = (
                            self.project_root
                            / "backend/migrations/schemas"
                            / f"{table}.sql"
                        )
                        if schema_file.exists():
                            schema = schema_file.read_text()
                            cur.execute(schema)
                            conn.commit()
                            actions.append(
                                {
                                    "action": f"Created table {table}",
                                    "status": "SUCCESS",
                                }
                            )
                        else:
                            actions.append(
                                {
                                    "action": f"Missing schema for table {table}",
                                    "status": "FAIL",
                                    "error": "Schema file not found",
                                }
                            )
                    except Exception as e:
                        actions.append(
                            {
                                "action": f"Failed to create table {table}",
                                "status": "FAIL",
                                "error": str(e),
                            }
                        )

            conn.close()

        except Exception as e:
            actions.append(
                {
                    "action": "Failed to connect to database",
                    "status": "FAIL",
                    "error": str(e),
                }
            )

        return actions

    def remediate_aws_services(self, issues: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Remediate AWS service issues"""
        self.logger.info("Remediating AWS service issues")
        actions = []

        for service, details in issues.get("services", {}).items():
            if details.get("status") == "FAIL":
                try:
                    if service == "cognito-idp":
                        actions.extend(self._remediate_cognito(details))
                    elif service == "s3":
                        actions.extend(self._remediate_s3(details))
                    elif service == "kms":
                        actions.extend(self._remediate_kms(details))
                    elif service == "ses":
                        actions.extend(self._remediate_ses(details))
                    elif service == "cloudtrail":
                        actions.extend(self._remediate_cloudtrail(details))
                except Exception as e:
                    actions.append(
                        {
                            "action": f"Failed to remediate {service}",
                            "status": "FAIL",
                            "error": str(e),
                        }
                    )

        return actions

    def _remediate_cognito(self, issues: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Remediate Cognito issues"""
        actions = []
        client = boto3.client("cognito-idp")

        try:
            # Create user pool if none exists
            if not issues.get("user_pools", 0):
                response = client.create_user_pool(
                    PoolName="HealthcareIVRUserPool",
                    AutoVerifiedAttributes=["email"],
                    MfaConfiguration="OFF",
                    PasswordPolicy={
                        "MinimumLength": 12,
                        "RequireUppercase": True,
                        "RequireLowercase": True,
                        "RequireNumbers": True,
                        "RequireSymbols": True,
                    },
                )
                actions.append(
                    {
                        "action": "Created Cognito user pool",
                        "status": "SUCCESS",
                        "details": response["UserPool"]["Id"],
                    }
                )
        except Exception as e:
            actions.append(
                {
                    "action": "Failed to create Cognito user pool",
                    "status": "FAIL",
                    "error": str(e),
                }
            )

        return actions

    def _remediate_s3(self, issues: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Remediate S3 issues"""
        actions = []
        client = boto3.client("s3")

        required_buckets = [
            "healthcare-ivr-documents",
            "healthcare-ivr-backups",
            "healthcare-ivr-audit-logs",
        ]

        for bucket in required_buckets:
            try:
                if bucket not in issues.get("details", []):
                    client.create_bucket(
                        Bucket=bucket,
                        CreateBucketConfiguration={"LocationConstraint": "us-west-2"},
                    )
                    # Enable encryption
                    client.put_bucket_encryption(
                        Bucket=bucket,
                        ServerSideEncryptionConfiguration={
                            "Rules": [
                                {
                                    "ApplyServerSideEncryptionByDefault": {
                                        "SSEAlgorithm": "AES256"
                                    }
                                }
                            ]
                        },
                    )
                    actions.append(
                        {
                            "action": f"Created and configured S3 bucket {bucket}",
                            "status": "SUCCESS",
                        }
                    )
            except Exception as e:
                actions.append(
                    {
                        "action": f"Failed to create S3 bucket {bucket}",
                        "status": "FAIL",
                        "error": str(e),
                    }
                )

        return actions

    def _remediate_kms(self, issues: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Remediate KMS issues"""
        actions = []
        client = boto3.client("kms")

        try:
            if not issues.get("keys", 0):
                response = client.create_key(
                    Description="Healthcare IVR Encryption Key",
                    KeyUsage="ENCRYPT_DECRYPT",
                    Origin="AWS_KMS",
                    Tags=[{"TagKey": "Project", "TagValue": "HealthcareIVR"}],
                )
                actions.append(
                    {
                        "action": "Created KMS key",
                        "status": "SUCCESS",
                        "details": response["KeyMetadata"]["KeyId"],
                    }
                )
        except Exception as e:
            actions.append(
                {
                    "action": "Failed to create KMS key",
                    "status": "FAIL",
                    "error": str(e),
                }
            )

        return actions

    def _remediate_ses(self, issues: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Remediate SES issues"""
        actions = []
        client = boto3.client("ses")

        try:
            # Verify email identity if needed
            if issues.get("quota", 0) == 0:
                email = os.getenv("SYSTEM_EMAIL", "admin@healthcare-ivr.com")
                client.verify_email_identity(EmailAddress=email)
                actions.append(
                    {
                        "action": f"Initiated email verification for {email}",
                        "status": "SUCCESS",
                    }
                )
        except Exception as e:
            actions.append(
                {
                    "action": "Failed to verify email identity",
                    "status": "FAIL",
                    "error": str(e),
                }
            )

        return actions

    def _remediate_cloudtrail(self, issues: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Remediate CloudTrail issues"""
        actions = []
        client = boto3.client("cloudtrail")

        try:
            if not issues.get("trails", 0):
                response = client.create_trail(
                    Name="HealthcareIVRAuditTrail",
                    S3BucketName="healthcare-ivr-audit-logs",
                    IsMultiRegionTrail=True,
                    EnableLogFileValidation=True,
                )
                client.start_logging(Name=response["TrailARN"])
                actions.append(
                    {
                        "action": "Created and started CloudTrail",
                        "status": "SUCCESS",
                        "details": response["TrailARN"],
                    }
                )
        except Exception as e:
            actions.append(
                {
                    "action": "Failed to create CloudTrail",
                    "status": "FAIL",
                    "error": str(e),
                }
            )

        return actions

    def remediate_security_compliance(
        self, issues: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """Remediate security and compliance issues"""
        self.logger.info("Remediating security and compliance issues")
        actions = []

        for check, details in issues.get("checks", {}).items():
            if details.get("status") == "FAIL":
                try:
                    if check == "ssl_config":
                        actions.extend(self._remediate_ssl_config(details))
                    elif check == "auth_config":
                        actions.extend(self._remediate_auth_config(details))
                    elif check == "encryption_config":
                        actions.extend(self._remediate_encryption_config(details))
                    elif check == "audit_logging":
                        actions.extend(self._remediate_audit_logging(details))
                except Exception as e:
                    actions.append(
                        {
                            "action": f"Failed to remediate {check}",
                            "status": "FAIL",
                            "error": str(e),
                        }
                    )

        return actions

    def _remediate_ssl_config(self, issues: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Remediate SSL configuration issues"""
        actions = []

        try:
            # Generate self-signed certificate for development
            subprocess.run(
                [
                    "openssl",
                    "req",
                    "-x509",
                    "-nodes",
                    "-days",
                    "365",
                    "-newkey",
                    "rsa:2048",
                    "-keyout",
                    "ssl/private.key",
                    "-out",
                    "ssl/certificate.crt",
                    "-subj",
                    "/CN=localhost",
                ],
                check=True,
                capture_output=True,
                text=True,
            )
            actions.append({"action": "Generated SSL certificate", "status": "SUCCESS"})
        except Exception as e:
            actions.append(
                {
                    "action": "Failed to generate SSL certificate",
                    "status": "FAIL",
                    "error": str(e),
                }
            )

        return actions

    def _remediate_auth_config(self, issues: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Remediate authentication configuration issues"""
        actions = []

        try:
            # Generate JWT secret if missing
            if "JWT_SECRET" in issues.get("missing_env_vars", []):
                secret = Fernet.generate_key().decode()
                self._update_env_file("JWT_SECRET", secret)
                actions.append({"action": "Generated JWT secret", "status": "SUCCESS"})
        except Exception as e:
            actions.append(
                {
                    "action": "Failed to generate JWT secret",
                    "status": "FAIL",
                    "error": str(e),
                }
            )

        return actions

    def _remediate_encryption_config(
        self, issues: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """Remediate encryption configuration issues"""
        actions = []

        try:
            # Generate encryption key if missing
            if "ENCRYPTION_KEY" in issues.get("missing_env_vars", []):
                key = Fernet.generate_key().decode()
                self._update_env_file("ENCRYPTION_KEY", key)
                actions.append(
                    {"action": "Generated encryption key", "status": "SUCCESS"}
                )
        except Exception as e:
            actions.append(
                {
                    "action": "Failed to generate encryption key",
                    "status": "FAIL",
                    "error": str(e),
                }
            )

        return actions

    def _remediate_audit_logging(self, issues: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Remediate audit logging issues"""
        actions = []

        try:
            if not issues.get("table_exists", True):
                conn = psycopg2.connect("postgresql://localhost:5432/healthcare_ivr")
                cur = conn.cursor()

                # Create audit_logs table
                cur.execute(
                    """
                    CREATE TABLE IF NOT EXISTS audit_logs (
                        id SERIAL PRIMARY KEY,
                        timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                        user_id VARCHAR(255),
                        action VARCHAR(255) NOT NULL,
                        resource_type VARCHAR(255),
                        resource_id VARCHAR(255),
                        details JSONB,
                        ip_address INET,
                        user_agent TEXT
                    )
                """
                )
                conn.commit()
                conn.close()

                actions.append(
                    {"action": "Created audit_logs table", "status": "SUCCESS"}
                )
        except Exception as e:
            actions.append(
                {
                    "action": "Failed to create audit_logs table",
                    "status": "FAIL",
                    "error": str(e),
                }
            )

        return actions

    def _update_env_file(self, key: str, value: str) -> None:
        """Update .env file with new key-value pair"""
        env_file = self.project_root / ".env"

        if not env_file.exists():
            env_file.write_text(f"{key}={value}\n")
            return

        lines = env_file.read_text().splitlines()
        key_exists = False

        for i, line in enumerate(lines):
            if line.startswith(f"{key}="):
                lines[i] = f"{key}={value}"
                key_exists = True
                break

        if not key_exists:
            lines.append(f"{key}={value}")

        env_file.write_text("\n".join(lines) + "\n")

    def _get_readme_template(self) -> str:
        """Get README.md template"""
        return """# Healthcare IVR Platform

## Overview
A HIPAA-compliant Interactive Voice Response (IVR) system for healthcare providers.

## Features
- Automated patient interactions
- Secure data handling
- Real-time analytics
- HIPAA compliance

## Setup
1. Clone the repository
2. Install dependencies
3. Configure environment variables
4. Start the services

## Development
[Development instructions]

## Testing
[Testing instructions]

## Deployment
[Deployment instructions]

## Security
[Security information]

## License
[License information]
"""

    def _get_env_template(self) -> str:
        """Get .env.example template"""
        return """# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=healthcare_ivr
DB_USER=postgres
DB_PASSWORD=postgres

# AWS Configuration
AWS_REGION=us-west-2
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key

# Security
JWT_SECRET=your_jwt_secret
ENCRYPTION_KEY=your_encryption_key

# Service Configuration
API_PORT=8000
FRONTEND_PORT=3000
"""

    def _get_docker_compose_template(self) -> str:
        """Get docker-compose.yml template"""
        return """version: '3.8'

services:
  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
    volumes:
      - ./frontend:/app
      - /app/node_modules

  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      - PYTHONUNBUFFERED=1
    volumes:
      - ./backend:/app
    depends_on:
      - postgres
      - redis

  postgres:
    image: postgres:13
    ports:
      - "5432:5432"
    environment:
      - POSTGRES_DB=healthcare_ivr
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:6
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
"""

    def _get_requirements_template(self) -> str:
        """Get requirements.txt template"""
        return """# Core
fastapi>=0.68.0
uvicorn>=0.15.0
sqlalchemy>=1.4.23
psycopg2-binary>=2.9.1
redis>=4.0.0
boto3>=1.18.0

# Security
python-jose>=3.3.0
passlib>=1.7.4
python-multipart>=0.0.5
cryptography>=3.4.7

# Testing
pytest>=6.2.5
pytest-cov>=2.12.1
pytest-asyncio>=0.15.1

# Utilities
python-dotenv>=0.19.0
pydantic>=1.8.2
requests>=2.26.0
"""

    def _get_package_json_template(self) -> str:
        """Get package.json template"""
        return """{
  "name": "healthcare-ivr-platform",
  "version": "1.0.0",
  "private": true,
  "dependencies": {
    "@material-ui/core": "^4.12.3",
    "@material-ui/icons": "^4.11.2",
    "axios": "^0.21.1",
    "react": "^17.0.2",
    "react-dom": "^17.0.2",
    "react-router-dom": "^5.2.0",
    "react-scripts": "4.0.3",
    "typescript": "^4.3.5"
  },
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject"
  },
  "eslintConfig": {
    "extends": [
      "react-app",
      "react-app/jest"
    ]
  },
  "browserslist": {
    "production": [
      ">0.2%",
      "not dead",
      "not op_mini all"
    ],
    "development": [
      "last 1 chrome version",
      "last 1 firefox version",
      "last 1 safari version"
    ]
  }
}
"""

    def perform_remediation(self) -> Dict[str, Any]:
        """Perform comprehensive system remediation"""
        self.logger.info("Starting comprehensive system remediation")

        components = self.verification_report.get("components", {})
        for component, issues in components.items():
            if issues.get("status") == "FAIL":
                try:
                    remediation_method = getattr(self, f"remediate_{component}", None)
                    if remediation_method:
                        actions = remediation_method(issues)
                        self.remediation_results["actions_taken"].extend(actions)
                except Exception as e:
                    self.logger.error(f"Remediation failed for {component}: {e}")
                    self.remediation_results["actions_taken"].append(
                        {"component": component, "status": "FAIL", "error": str(e)}
                    )

        # Determine overall remediation status
        has_failures = any(
            action.get("status") == "FAIL"
            for action in self.remediation_results["actions_taken"]
        )

        self.remediation_results["overall_status"] = "FAIL" if has_failures else "PASS"

        return self.remediation_results

    def generate_report(self) -> str:
        """Generate and save remediation report"""
        self.logger.info("Generating remediation report")

        # Perform remediation
        self.perform_remediation()

        # Save report
        report_dir = self.project_root / "remediation_reports"
        report_dir.mkdir(parents=True, exist_ok=True)

        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        report_file = report_dir / f"remediation_{timestamp}.json"

        with open(report_file, "w") as f:
            json.dump(self.remediation_results, f, indent=2)

        self.logger.info(f"Remediation report saved: {report_file}")
        return str(report_file)


def main():
    """Main entry point for intelligent remediation"""
    try:
        # Load latest verification report
        report_dir = Path("verification_reports")
        if not report_dir.exists():
            print("No verification reports found", file=sys.stderr)
            sys.exit(1)

        reports = sorted(report_dir.glob("final_verification_*.json"))
        if not reports:
            print("No verification reports found", file=sys.stderr)
            sys.exit(1)

        latest_report = reports[-1]
        with open(latest_report) as f:
            verification_report = json.load(f)

        # Initialize and run remediation
        remediation = IntelligentRemediationEngine(verification_report)
        report_path = remediation.generate_report()

        # Print summary
        print("\n=== Intelligent Remediation Report ===")
        print(f"Report saved to: {report_path}")
        status = remediation.remediation_results["overall_status"]
        print(f"Overall Status: {status}")
        print("\nActions Taken:")

        for action in remediation.remediation_results["actions_taken"]:
            status = action.get("status", "UNKNOWN")
            color = "\033[92m" if status == "SUCCESS" else "\033[91m"
            print(f"- {action['action']}: {color}{status}\033[0m")
            if status == "FAIL":
                error = action.get("error", "Unknown error")
                print(f"  Error: {error}")

        exit_code = (
            0 if remediation.remediation_results["overall_status"] == "PASS" else 1
        )
        sys.exit(exit_code)

    except Exception as e:
        print(f"Error during remediation: {str(e)}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
