#!/usr/bin/env python3

import os
import sys
import json
import subprocess
import logging
import boto3
import psycopg2
import redis
import requests
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime
from pathlib import Path


class HealthCheck:
    """Base class for health checks"""
    def __init__(self, name: str, check_type: str):
        self.name = name
        self.type = check_type
        self.result = {"status": "UNKNOWN", "details": None, "timestamp": None}

    def run(self) -> Dict[str, Any]:
        """Run the health check"""
        try:
            self.result["timestamp"] = datetime.now().isoformat()
            self._execute_check()
        except Exception as e:
            self.result.update({
                "status": "FAIL",
                "details": str(e),
                "error_type": e.__class__.__name__
            })
        return self.result

    def _execute_check(self):
        """Execute the actual health check logic"""
        raise NotImplementedError


class HTTPHealthCheck(HealthCheck):
    """Health check for HTTP services"""
    def __init__(self, name: str, url: str, expected_status: List[int] = None):
        super().__init__(name, "http")
        self.url = url
        self.expected_status = expected_status or [200]

    def _execute_check(self):
        response = requests.get(self.url, timeout=10)
        is_healthy = response.status_code in self.expected_status
        self.result.update({
            "status": "PASS" if is_healthy else "FAIL",
            "details": {
                "status_code": response.status_code,
                "response_time": response.elapsed.total_seconds()
            }
        })


class DatabaseHealthCheck(HealthCheck):
    """Health check for database services"""
    def __init__(self, name: str, connection_string: str):
        super().__init__(name, "database")
        self.connection_string = connection_string

    def _execute_check(self):
        conn = psycopg2.connect(self.connection_string)
        cur = conn.cursor()

        # Check connection
        cur.execute("SELECT version();")
        version = cur.fetchone()[0]

        # Check required tables
        required_tables = [
            "users", "organizations", "roles", "permissions",
            "facilities", "doctors", "patients", "ivr_requests",
            "orders", "audit_logs", "territories"
        ]

        cur.execute("""
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
        """)
        existing_tables = {row[0] for row in cur.fetchall()}
        missing_tables = set(required_tables) - existing_tables

        # Check table row counts
        table_stats = {}
        for table in existing_tables & set(required_tables):
            cur.execute(f"SELECT COUNT(*) FROM {table}")
            table_stats[table] = cur.fetchone()[0]

        conn.close()

        self.result.update({
            "status": "PASS" if not missing_tables else "FAIL",
            "details": {
                "version": version,
                "missing_tables": list(missing_tables),
                "table_stats": table_stats
            }
        })


class RedisHealthCheck(HealthCheck):
    """Health check for Redis services"""
    def __init__(self, name: str, url: str):
        super().__init__(name, "redis")
        self.url = url

    def _execute_check(self):
        client = redis.from_url(self.url)
        info = client.info()
        client.close()

        self.result.update({
            "status": "PASS",
            "details": {
                "version": info["redis_version"],
                "used_memory": info["used_memory_human"],
                "connected_clients": info["connected_clients"]
            }
        })


class AWSServiceHealthCheck(HealthCheck):
    """Health check for AWS services"""
    def __init__(self, name: str, service: str):
        super().__init__(name, "aws")
        self.service = service

    def _execute_check(self):
        client = boto3.client(self.service)
        service_checks = {
            "cognito-idp": self._check_cognito,
            "s3": self._check_s3,
            "kms": self._check_kms,
            "ses": self._check_ses,
            "cloudtrail": self._check_cloudtrail
        }

        check_func = service_checks.get(self.service)
        if not check_func:
            raise ValueError(f"Unsupported AWS service: {self.service}")

        details = check_func(client)
        self.result.update({
            "status": "PASS",
            "details": details
        })

    def _check_cognito(self, client) -> Dict:
        response = client.list_user_pools(MaxResults=10)
        return {
            "user_pools": len(response["UserPools"]),
            "pools": [pool["Name"] for pool in response["UserPools"]]
        }

    def _check_s3(self, client) -> Dict:
        response = client.list_buckets()
        return {
            "bucket_count": len(response["Buckets"]),
            "buckets": [bucket["Name"] for bucket in response["Buckets"]]
        }

    def _check_kms(self, client) -> Dict:
        response = client.list_keys()
        return {
            "key_count": len(response["Keys"]),
            "keys": [key["KeyId"] for key in response["Keys"]]
        }

    def _check_ses(self, client) -> Dict:
        response = client.get_send_quota()
        return {
            "max_24_hour_send": response["Max24HourSend"],
            "sent_last_24_hours": response["SentLast24Hours"]
        }

    def _check_cloudtrail(self, client) -> Dict:
        response = client.list_trails()
        return {
            "trail_count": len(response["Trails"]),
            "trails": [trail["Name"] for trail in response["Trails"]]
        }


class SystemVerificationEngine:
    """Advanced system verification engine"""
    def __init__(self, environment: str = "production"):
        self.environment = environment
        self.logger = logging.getLogger("system_verification")
        self.results: Dict[str, Any] = {
            "timestamp": datetime.now().isoformat(),
            "environment": environment,
            "overall_status": "UNKNOWN",
            "components": {}
        }

        # Configure logging
        self._setup_logging()

    def _setup_logging(self):
        """Configure logging for the verification engine"""
        log_dir = Path("verification_reports/logs")
        log_dir.mkdir(parents=True, exist_ok=True)

        log_file = log_dir / f"verification_{datetime.now():%Y%m%d_%H%M%S}.log"

        file_handler = logging.FileHandler(log_file)
        file_handler.setFormatter(
            logging.Formatter(
                "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
            )
        )

        self.logger.addHandler(file_handler)
        self.logger.setLevel(logging.INFO)

    def run_verification(self) -> Tuple[bool, Dict[str, Any]]:
        """Run all verification checks"""
        try:
            self.logger.info("Starting system verification")

            # Define health checks
            health_checks = [
                HTTPHealthCheck(
                    "Frontend",
                    "http://localhost:3000",
                    [200]
                ),
                HTTPHealthCheck(
                    "Backend API",
                    "http://localhost:8000/health",
                    [200]
                ),
                DatabaseHealthCheck(
                    "Database",
                    "postgresql://localhost:5432/healthcare_ivr"
                ),
                RedisHealthCheck(
                    "Redis",
                    "redis://localhost:6379"
                ),
                AWSServiceHealthCheck("Cognito", "cognito-idp"),
                AWSServiceHealthCheck("S3", "s3"),
                AWSServiceHealthCheck("KMS", "kms"),
                AWSServiceHealthCheck("SES", "ses"),
                AWSServiceHealthCheck("CloudTrail", "cloudtrail")
            ]

            # Run all health checks
            for check in health_checks:
                self.logger.info(f"Running health check: {check.name}")
                result = check.run()
                self.results["components"][check.name] = result
                self.logger.info(
                    f"Health check {check.name} completed: {result['status']}"
                )

            # Determine overall status
            has_failures = any(
                component["status"] == "FAIL"
                for component in self.results["components"].values()
            )
            self.results["overall_status"] = "FAIL" if has_failures else "PASS"

            # Generate report
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
        report_file = report_dir / f"verification_report_{timestamp}.json"

        with open(report_file, "w") as f:
            json.dump(self.results, f, indent=2)

        self.logger.info(f"Verification report saved: {report_file}")


def main():
    """Main entry point for the verification script"""
    try:
        verifier = SystemVerificationEngine()
        success, results = verifier.run_verification()

        # Print results to console
        print("\n=== System Verification Report ===")
        print(f"Timestamp: {results['timestamp']}")
        print(f"Environment: {results['environment']}")
        print(f"Overall Status: {results['overall_status']}")
        print("\nComponent Status:")

        for component, details in results["components"].items():
            status = details["status"]
            status_color = "\033[92m" if status == "PASS" else "\033[91m"
            print(f"{component}: {status_color}{status}\033[0m")

        sys.exit(0 if success else 1)

    except Exception as e:
        print(f"Error running verification: {str(e)}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()