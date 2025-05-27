#!/usr/bin/env python3

import os
import sys
import json
import logging
import subprocess
import psycopg2
import redis
import requests
import boto3
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime
from pathlib import Path
from urllib.parse import urlparse


class ComprehensiveVerifier:
    """Comprehensive system verification engine"""
    def __init__(self, environment: str = "production"):
        self.environment = environment
        self.logger = logging.getLogger("comprehensive_verification")
        self.results: Dict[str, Any] = {
            "timestamp": datetime.now().isoformat(),
            "environment": environment,
            "overall_status": "UNKNOWN",
            "categories": {}
        }

        # Configure logging
        self._setup_logging()

    def _setup_logging(self):
        """Configure logging for the verification engine"""
        log_dir = Path("verification_reports/logs")
        log_dir.mkdir(parents=True, exist_ok=True)

        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        log_file = log_dir / f"comprehensive_{timestamp}.log"

        file_handler = logging.FileHandler(log_file)
        file_handler.setFormatter(
            logging.Formatter(
                "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
            )
        )

        self.logger.addHandler(file_handler)
        self.logger.setLevel(logging.INFO)

    def verify_docker_services(self) -> Dict[str, Any]:
        """Verify all Docker services are running"""
        try:
            result = subprocess.run(
                ["docker-compose", "ps", "--format", "json"],
                capture_output=True,
                text=True,
                check=True
            )
            services = json.loads(result.stdout)

            service_status = {}
            for service in services:
                is_running = "running" in service["State"].lower()
                service_status[service["Service"]] = {
                    "status": "PASS" if is_running else "FAIL",
                    "state": service["State"],
                    "ports": service.get("Ports", "")
                }

            all_passing = all(
                s["status"] == "PASS"
                for s in service_status.values()
            )
            return {
                "status": "PASS" if all_passing else "FAIL",
                "details": service_status
            }
        except Exception as e:
            return {
                "status": "FAIL",
                "error": str(e)
            }

    def verify_frontend(self) -> Dict[str, Any]:
        """Verify frontend functionality"""
        try:
            # Check frontend server
            base_url = "http://localhost:3000"
            response = requests.get(base_url, timeout=10)

            # Check critical frontend endpoints
            endpoints = [
                "/",
                "/login",
                "/dashboard",
                "/patients",
                "/orders"
            ]

            endpoint_status = {}
            for endpoint in endpoints:
                try:
                    url = f"{base_url}{endpoint}"
                    resp = requests.get(url, timeout=10)
                    endpoint_status[endpoint] = {
                        "status": "PASS" if resp.status_code == 200 else "FAIL",
                        "code": resp.status_code
                    }
                except Exception as e:
                    endpoint_status[endpoint] = {
                        "status": "FAIL",
                        "error": str(e)
                    }

            return {
                "status": "PASS" if response.status_code == 200 else "FAIL",
                "details": {
                    "main_status": response.status_code,
                    "endpoints": endpoint_status
                }
            }
        except Exception as e:
            return {
                "status": "FAIL",
                "error": str(e)
            }

    def verify_backend_api(self) -> Dict[str, Any]:
        """Verify backend API functionality"""
        try:
            # Check health endpoint
            base_url = "http://localhost:8000"
            health_response = requests.get(f"{base_url}/health", timeout=10)

            # Check critical API endpoints
            endpoints = [
                "/api/v1/users",
                "/api/v1/patients",
                "/api/v1/orders",
                "/api/v1/providers",
                "/api/v1/analytics"
            ]

            endpoint_status = {}
            for endpoint in endpoints:
                try:
                    url = f"{base_url}{endpoint}"
                    resp = requests.get(url, timeout=10)
                    valid_codes = [200, 401, 403]
                    endpoint_status[endpoint] = {
                        "status": "PASS" if resp.status_code in valid_codes else "FAIL",
                        "code": resp.status_code
                    }
                except Exception as e:
                    endpoint_status[endpoint] = {
                        "status": "FAIL",
                        "error": str(e)
                    }

            return {
                "status": "PASS" if health_response.status_code == 200 else "FAIL",
                "details": {
                    "health_status": health_response.status_code,
                    "endpoints": endpoint_status
                }
            }
        except Exception as e:
            return {
                "status": "FAIL",
                "error": str(e)
            }

    def verify_database(self) -> Dict[str, Any]:
        """Verify database functionality and schema"""
        try:
            conn = psycopg2.connect("postgresql://localhost:5432/healthcare_ivr")
            cur = conn.cursor()

            # Check connection
            cur.execute("SELECT version();")
            version = cur.fetchone()[0]

            # Check required tables
            required_tables = [
                "users",
                "organizations",
                "roles",
                "permissions",
                "facilities",
                "doctors",
                "patients",
                "ivr_requests",
                "orders",
                "audit_logs",
                "territories"
            ]

            cur.execute("""
                SELECT table_name
                FROM information_schema.tables
                WHERE table_schema = 'public'
            """)
            existing_tables = {row[0] for row in cur.fetchall()}
            missing_tables = set(required_tables) - existing_tables

            # Check table schemas
            schema_status = {}
            for table in existing_tables & set(required_tables):
                cur.execute(f"""
                    SELECT column_name, data_type
                    FROM information_schema.columns
                    WHERE table_name = '{table}'
                """)
                schema_status[table] = {
                    "columns": {row[0]: row[1] for row in cur.fetchall()},
                    "row_count": self._get_table_count(cur, table)
                }

            conn.close()

            return {
                "status": "PASS" if not missing_tables else "FAIL",
                "details": {
                    "version": version,
                    "missing_tables": list(missing_tables),
                    "schema_status": schema_status
                }
            }
        except Exception as e:
            return {
                "status": "FAIL",
                "error": str(e)
            }

    def _get_table_count(self, cursor, table: str) -> int:
        """Get row count for a table"""
        cursor.execute(f"SELECT COUNT(*) FROM {table}")
        return cursor.fetchone()[0]

    def verify_aws_services(self) -> Dict[str, Any]:
        """Verify AWS service configurations"""
        services = {
            "cognito-idp": self._verify_cognito,
            "s3": self._verify_s3,
            "kms": self._verify_kms,
            "ses": self._verify_ses,
            "cloudtrail": self._verify_cloudtrail
        }

        results = {}
        for service, verify_func in services.items():
            try:
                client = boto3.client(service)
                results[service] = verify_func(client)
            except Exception as e:
                results[service] = {
                    "status": "FAIL",
                    "error": str(e)
                }

        return {
            "status": "PASS" if all(r["status"] == "PASS" for r in results.values()) else "FAIL",
            "details": results
        }

    def _verify_cognito(self, client) -> Dict[str, Any]:
        """Verify Cognito configuration"""
        response = client.list_user_pools(MaxResults=10)
        return {
            "status": "PASS",
            "details": {
                "user_pools": len(response["UserPools"]),
                "pools": [pool["Name"] for pool in response["UserPools"]]
            }
        }

    def _verify_s3(self, client) -> Dict[str, Any]:
        """Verify S3 configuration"""
        response = client.list_buckets()
        return {
            "status": "PASS",
            "details": {
                "bucket_count": len(response["Buckets"]),
                "buckets": [bucket["Name"] for bucket in response["Buckets"]]
            }
        }

    def _verify_kms(self, client) -> Dict[str, Any]:
        """Verify KMS configuration"""
        response = client.list_keys()
        return {
            "status": "PASS",
            "details": {
                "key_count": len(response["Keys"]),
                "keys": [key["KeyId"] for key in response["Keys"]]
            }
        }

    def _verify_ses(self, client) -> Dict[str, Any]:
        """Verify SES configuration"""
        response = client.get_send_quota()
        return {
            "status": "PASS",
            "details": {
                "max_24_hour_send": response["Max24HourSend"],
                "sent_last_24_hours": response["SentLast24Hours"]
            }
        }

    def _verify_cloudtrail(self, client) -> Dict[str, Any]:
        """Verify CloudTrail configuration"""
        response = client.list_trails()
        return {
            "status": "PASS",
            "details": {
                "trail_count": len(response["Trails"]),
                "trails": [trail["Name"] for trail in response["Trails"]]
            }
        }

    def verify_security(self) -> Dict[str, Any]:
        """Verify security configurations"""
        security_checks = {
            "ssl_config": self._verify_ssl_config(),
            "auth_config": self._verify_auth_config(),
            "encryption_config": self._verify_encryption_config(),
            "audit_logging": self._verify_audit_logging()
        }

        return {
            "status": "PASS" if all(c["status"] == "PASS" for c in security_checks.values()) else "FAIL",
            "details": security_checks
        }

    def _verify_ssl_config(self) -> Dict[str, Any]:
        """Verify SSL configuration"""
        try:
            response = requests.get("https://localhost:443", verify=True)
            return {
                "status": "PASS",
                "details": {
                    "ssl_enabled": True,
                    "certificate_valid": True
                }
            }
        except requests.exceptions.SSLError:
            return {
                "status": "FAIL",
                "error": "SSL certificate validation failed"
            }
        except Exception as e:
            return {
                "status": "FAIL",
                "error": str(e)
            }

    def _verify_auth_config(self) -> Dict[str, Any]:
        """Verify authentication configuration"""
        required_env_vars = [
            "COGNITO_USER_POOL_ID",
            "COGNITO_CLIENT_ID",
            "JWT_SECRET"
        ]

        missing_vars = [var for var in required_env_vars if not os.getenv(var)]

        return {
            "status": "PASS" if not missing_vars else "FAIL",
            "details": {
                "missing_env_vars": missing_vars,
                "auth_configured": len(missing_vars) == 0
            }
        }

    def _verify_encryption_config(self) -> Dict[str, Any]:
        """Verify encryption configuration"""
        required_env_vars = [
            "KMS_KEY_ID",
            "ENCRYPTION_KEY"
        ]

        missing_vars = [var for var in required_env_vars if not os.getenv(var)]

        return {
            "status": "PASS" if not missing_vars else "FAIL",
            "details": {
                "missing_env_vars": missing_vars,
                "encryption_configured": len(missing_vars) == 0
            }
        }

    def _verify_audit_logging(self) -> Dict[str, Any]:
        """Verify audit logging configuration"""
        try:
            conn = psycopg2.connect("postgresql://localhost:5432/healthcare_ivr")
            cur = conn.cursor()

            # Check audit_logs table
            cur.execute("""
                SELECT EXISTS (
                    SELECT FROM information_schema.tables
                    WHERE table_name = 'audit_logs'
                )
            """)
            table_exists = cur.fetchone()[0]

            if table_exists:
                cur.execute("SELECT COUNT(*) FROM audit_logs")
                log_count = cur.fetchone()[0]
            else:
                log_count = 0

            conn.close()

            return {
                "status": "PASS" if table_exists else "FAIL",
                "details": {
                    "table_exists": table_exists,
                    "log_count": log_count
                }
            }
        except Exception as e:
            return {
                "status": "FAIL",
                "error": str(e)
            }

    def verify_documentation(self) -> Dict[str, Any]:
        """Verify documentation completeness"""
        required_docs = [
            "README.md",
            "docs/api.md",
            "docs/database.md",
            "docs/deployment.md",
            "docs/security.md",
            "docs/compliance.md",
            "docs/troubleshooting.md",
            "docs/user_manual.md"
        ]

        doc_status = {}
        for doc in required_docs:
            doc_path = Path(doc)
            exists = doc_path.exists()
            if exists:
                content = doc_path.read_text()
                doc_status[doc] = {
                    "exists": True,
                    "size": len(content),
                    "last_modified": datetime.fromtimestamp(doc_path.stat().st_mtime).isoformat()
                }
            else:
                doc_status[doc] = {
                    "exists": False
                }

        return {
            "status": "PASS" if all(d["exists"] for d in doc_status.values()) else "FAIL",
            "details": doc_status
        }

    def run_verification(self) -> Tuple[bool, Dict[str, Any]]:
        """Run all verification checks"""
        try:
            self.logger.info("Starting comprehensive system verification")

            # Run all verifications
            verifications = {
                "docker_services": self.verify_docker_services,
                "frontend": self.verify_frontend,
                "backend_api": self.verify_backend_api,
                "database": self.verify_database,
                "aws_services": self.verify_aws_services,
                "security": self.verify_security,
                "documentation": self.verify_documentation
            }

            for category, verify_func in verifications.items():
                self.logger.info(f"Verifying {category}")
                self.results["categories"][category] = verify_func()

            # Determine overall status
            has_failures = any(
                category["status"] == "FAIL"
                for category in self.results["categories"].values()
            )
            self.results["overall_status"] = "FAIL" if has_failures else "PASS"

            # Save report
            self._save_report()

            return not has_failures, self.results

        except Exception as e:
            self.logger.error(f"Verification failed: {str(e)}", exc_info=True)
            self.results["overall_status"] = "ERROR"
            self.results["error"] = str(e)
            return False, self.results

    def _save_report(self):
        """Save verification results to a JSON file"""
        report_dir = Path("verification_reports")
        report_dir.mkdir(exist_ok=True)

        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        report_file = report_dir / f"comprehensive_report_{timestamp}.json"

        with open(report_file, "w") as f:
            json.dump(self.results, f, indent=2)

        self.logger.info(f"Verification report saved: {report_file}")


def main():
    """Main entry point for the comprehensive verification script"""
    try:
        verifier = ComprehensiveVerifier()
        success, results = verifier.run_verification()

        # Print results to console
        print("\n=== Comprehensive System Verification Report ===")
        print(f"Timestamp: {results['timestamp']}")
        print(f"Environment: {results['environment']}")
        print(f"Overall Status: {results['overall_status']}")
        print("\nCategory Status:")

        for category, details in results["categories"].items():
            status = details["status"]
            status_color = "\033[92m" if status == "PASS" else "\033[91m"
            print(f"{category}: {status_color}{status}\033[0m")

        sys.exit(0 if success else 1)

    except Exception as e:
        print(f"Error running verification: {str(e)}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()