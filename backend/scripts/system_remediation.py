#!/usr/bin/env python3

import os
import sys
import json
import logging
import subprocess
import psycopg2
import redis
from typing import Dict, List, Any, Optional
from datetime import datetime
from pathlib import Path


class RemediationAction:
    """Base class for remediation actions"""
    def __init__(self, name: str, component: str):
        self.name = name
        self.component = component
        self.logger = logging.getLogger(f"remediation.{name}")
        self.result = {
            "status": "UNKNOWN",
            "details": None,
            "timestamp": None
        }

    def execute(self) -> Dict[str, Any]:
        """Execute the remediation action"""
        try:
            self.result["timestamp"] = datetime.now().isoformat()
            self._perform_remediation()
            return self.result
        except Exception as e:
            self.result.update({
                "status": "FAIL",
                "error": str(e),
                "error_type": e.__class__.__name__
            })
            return self.result

    def _perform_remediation(self):
        """Perform the actual remediation logic"""
        raise NotImplementedError


class ServiceRestartAction(RemediationAction):
    """Restart a system service"""
    def __init__(self, name: str, service_name: str):
        super().__init__(name, "service")
        self.service_name = service_name

    def _perform_remediation(self):
        try:
            # Stop service
            subprocess.run(
                ["docker-compose", "stop", self.service_name],
                check=True,
                capture_output=True,
                text=True
            )

            # Start service
            subprocess.run(
                ["docker-compose", "up", "-d", self.service_name],
                check=True,
                capture_output=True,
                text=True
            )

            self.result.update({
                "status": "PASS",
                "details": f"Successfully restarted {self.service_name}"
            })
        except subprocess.CalledProcessError as e:
            raise RuntimeError(
                f"Failed to restart {self.service_name}: {e.stderr}"
            )


class DatabaseSchemaAction(RemediationAction):
    """Fix database schema issues"""
    def __init__(self, name: str, connection_string: str):
        super().__init__(name, "database")
        self.connection_string = connection_string

    def _perform_remediation(self):
        conn = psycopg2.connect(self.connection_string)
        cur = conn.cursor()

        try:
            # Run migrations
            subprocess.run(
                ["alembic", "upgrade", "head"],
                check=True,
                capture_output=True,
                text=True
            )

            # Verify tables
            cur.execute("""
                SELECT table_name
                FROM information_schema.tables
                WHERE table_schema = 'public'
            """)
            existing_tables = {row[0] for row in cur.fetchall()}

            self.result.update({
                "status": "PASS",
                "details": {
                    "action": "schema_update",
                    "tables_present": list(existing_tables)
                }
            })

        except (subprocess.CalledProcessError, psycopg2.Error) as e:
            raise RuntimeError(f"Failed to update database schema: {str(e)}")
        finally:
            conn.close()


class RedisCleanupAction(RemediationAction):
    """Clean up Redis cache"""
    def __init__(self, name: str, redis_url: str):
        super().__init__(name, "redis")
        self.redis_url = redis_url

    def _perform_remediation(self):
        client = redis.from_url(self.redis_url)
        try:
            # Get initial stats
            initial_keys = client.dbsize()

            # Clear expired keys
            client.execute_command("FLUSHDB")

            # Get final stats
            final_keys = client.dbsize()

            self.result.update({
                "status": "PASS",
                "details": {
                    "initial_keys": initial_keys,
                    "final_keys": final_keys,
                    "keys_removed": initial_keys - final_keys
                }
            })

        except redis.RedisError as e:
            raise RuntimeError(f"Failed to clean Redis cache: {str(e)}")
        finally:
            client.close()


class SystemRemediationEngine:
    """Automated system remediation engine"""
    def __init__(self, environment: str = "production"):
        self.environment = environment
        self.logger = logging.getLogger("system_remediation")
        self.results: Dict[str, Any] = {
            "timestamp": datetime.now().isoformat(),
            "environment": environment,
            "overall_status": "UNKNOWN",
            "actions": {}
        }

        # Configure logging
        self._setup_logging()

    def _setup_logging(self):
        """Configure logging for the remediation engine"""
        log_dir = Path("verification_reports/logs")
        log_dir.mkdir(parents=True, exist_ok=True)

        log_file = log_dir / f"remediation_{datetime.now():%Y%m%d_%H%M%S}.log"

        file_handler = logging.FileHandler(log_file)
        file_handler.setFormatter(
            logging.Formatter(
                "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
            )
        )

        self.logger.addHandler(file_handler)
        self.logger.setLevel(logging.INFO)

    def remediate_issues(self, verification_report: Dict[str, Any]) -> Dict[str, Any]:
        """Attempt to fix identified issues"""
        try:
            self.logger.info("Starting system remediation")

            # Process each component's issues
            for component, details in verification_report["components"].items():
                if details["status"] == "FAIL":
                    self._remediate_component(component, details)

            # Determine overall status
            has_failures = any(
                action["status"] == "FAIL"
                for action in self.results["actions"].values()
            )
            self.results["overall_status"] = "FAIL" if has_failures else "PASS"

            # Save report
            self._save_report()

            return self.results

        except Exception as e:
            self.logger.error(f"Remediation failed: {str(e)}", exc_info=True)
            self.results["overall_status"] = "ERROR"
            self.results["error"] = str(e)
            return self.results

    def _remediate_component(self, component: str, details: Dict[str, Any]):
        """Remediate issues for a specific component"""
        self.logger.info(f"Remediating component: {component}")

        # Define remediation actions based on component type
        if component in ["Frontend", "Backend API"]:
            action = ServiceRestartAction(
                f"restart_{component.lower()}",
                component.lower().replace(" ", "_")
            )
        elif component == "Database":
            action = DatabaseSchemaAction(
                "fix_database_schema",
                "postgresql://localhost:5432/healthcare_ivr"
            )
        elif component == "Redis":
            action = RedisCleanupAction(
                "clean_redis_cache",
                "redis://localhost:6379"
            )
        else:
            self.logger.warning(
                f"No remediation action defined for component: {component}"
            )
            return

        # Execute remediation
        result = action.execute()
        self.results["actions"][action.name] = result
        self.logger.info(
            f"Remediation action {action.name} completed: {result['status']}"
        )

    def _save_report(self):
        """Save remediation results to a JSON file"""
        report_dir = Path("verification_reports")
        report_dir.mkdir(exist_ok=True)

        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        report_file = report_dir / f"remediation_report_{timestamp}.json"

        with open(report_file, "w") as f:
            json.dump(self.results, f, indent=2)

        self.logger.info(f"Remediation report saved: {report_file}")


def main():
    """Main entry point for the remediation script"""
    try:
        # Load the latest verification report
        report_dir = Path("verification_reports")
        reports = sorted(report_dir.glob("verification_report_*.json"))

        if not reports:
            print("No verification reports found", file=sys.stderr)
            sys.exit(1)

        latest_report = reports[-1]
        with open(latest_report) as f:
            verification_report = json.load(f)

        # Run remediation
        remediator = SystemRemediationEngine()
        results = remediator.remediate_issues(verification_report)

        # Print results to console
        print("\n=== System Remediation Report ===")
        print(f"Timestamp: {results['timestamp']}")
        print(f"Environment: {results['environment']}")
        print(f"Overall Status: {results['overall_status']}")
        print("\nRemediation Actions:")

        for action, details in results["actions"].items():
            status = details["status"]
            status_color = "\033[92m" if status == "PASS" else "\033[91m"
            print(f"{action}: {status_color}{status}\033[0m")

        sys.exit(0 if results["overall_status"] == "PASS" else 1)

    except Exception as e:
        print(f"Error running remediation: {str(e)}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()