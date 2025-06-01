#!/usr/bin/env python3
"""
Backup Validation Script for Healthcare IVR Platform.
Validates backup integrity and compliance with HIPAA requirements.
"""

import argparse
import boto3
import json
import logging
import sys
from datetime import datetime, timedelta
from typing import Dict, Any
from botocore.exceptions import ClientError

# Configure logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("backup_validation")


class BackupValidator:
    """Validates AWS backup jobs and ensures HIPAA compliance."""

    def __init__(self):
        """Initialize AWS clients and configuration."""
        self.backup = boto3.client("backup")
        self.rds = boto3.client("rds")
        self.s3 = boto3.client("s3")
        self.sns = boto3.client("sns")
        self.cloudwatch = boto3.client("cloudwatch")

        # Configuration
        self.backup_vault = "healthcare-ivr-backup-vault"
        self.test_restore_db = "backup-validation-db"
        self.sns_topic = "arn:aws:sns:us-east-1:123456789012:backup-validation"
        self.required_tags = ["PHI", "Environment", "BackupRetention"]

        # Validation thresholds
        self.thresholds = {
            "max_backup_age": 24,  # hours
            "min_success_rate": 95,  # percentage
            "min_backup_size": 1024,  # bytes
            "retention_period": 7,  # days
        }

    def validate_latest_backup(self) -> Dict[str, Any]:
        """Validate the most recent backup job."""
        try:
            # Get latest backup job
            max_age = self.thresholds["max_backup_age"]
            created_after = datetime.utcnow() - timedelta(hours=max_age)

            response = self.backup.list_backup_jobs(
                ByState="COMPLETED",
                ByCreatedBefore=datetime.utcnow(),
                ByCreatedAfter=created_after,
                MaxResults=1,
            )

            if not response["BackupJobs"]:
                raise ValueError("No recent backup jobs found")

            latest_job = response["BackupJobs"][0]

            # Validate backup
            validation_results = {
                "job_id": latest_job["BackupJobId"],
                "resource_type": latest_job["ResourceType"],
                "creation_date": latest_job["CreationDate"].isoformat(),
                "status": latest_job["State"],
                "validations": {},
            }

            # Perform validation checks
            validation_results["validations"].update(
                self._validate_backup_metadata(latest_job)
            )
            validation_results["validations"].update(
                self._validate_backup_size(latest_job)
            )
            validation_results["validations"].update(
                self._validate_encryption(latest_job)
            )
            validation_results["validations"].update(
                self._validate_retention(latest_job)
            )

            # Test restore if all validations pass
            if all(validation_results["validations"].values()):
                validation_results["validations"]["restore_test"] = self._test_restore(
                    latest_job
                )

            # Send validation metrics
            self._publish_metrics(validation_results)

            # Send notifications if any validations failed
            if not all(validation_results["validations"].values()):
                self._send_alert(validation_results)

            return validation_results

        except Exception as e:
            logger.error(f"Backup validation failed: {str(e)}")
            self._send_alert(
                {"error": str(e), "timestamp": datetime.utcnow().isoformat()}
            )
            raise

    def _validate_backup_metadata(self, backup_job: Dict) -> Dict[str, bool]:
        """Validate backup metadata and tags."""
        try:
            # Get recovery point
            recovery_point = self.backup.describe_recovery_point(
                BackupVaultName=self.backup_vault,
                RecoveryPointArn=backup_job["RecoveryPointArn"],
            )

            # Check required tags
            tags = recovery_point.get("Tags", {})
            has_required_tags = all(tag in tags for tag in self.required_tags)

            # Validate metadata
            metadata = recovery_point.get("Metadata", {})
            has_valid_metadata = all(
                [
                    metadata.get("DatabaseName"),
                    metadata.get("EngineVersion"),
                    metadata.get("BackupMethod"),
                ]
            )

            return {
                "metadata_validation": has_valid_metadata,
                "tags_validation": has_required_tags,
            }

        except ClientError as e:
            logger.error(f"Metadata validation failed: {str(e)}")
            return {"metadata_validation": False, "tags_validation": False}

    def _validate_backup_size(self, backup_job: Dict) -> Dict[str, bool]:
        """Validate backup size meets minimum requirements."""
        try:
            recovery_point = self.backup.describe_recovery_point(
                BackupVaultName=self.backup_vault,
                RecoveryPointArn=backup_job["RecoveryPointArn"],
            )

            backup_size = recovery_point.get("BackupSizeInBytes", 0)
            is_valid_size = backup_size >= self.thresholds["min_backup_size"]

            return {"size_validation": is_valid_size}

        except ClientError as e:
            logger.error(f"Size validation failed: {str(e)}")
            return {"size_validation": False}

    def _validate_encryption(self, backup_job: Dict) -> Dict[str, bool]:
        """Validate backup encryption settings."""
        try:
            recovery_point = self.backup.describe_recovery_point(
                BackupVaultName=self.backup_vault,
                RecoveryPointArn=backup_job["RecoveryPointArn"],
            )

            is_encrypted = recovery_point.get("EncryptionKeyArn") is not None

            return {"encryption_validation": is_encrypted}

        except ClientError as e:
            logger.error(f"Encryption validation failed: {str(e)}")
            return {"encryption_validation": False}

    def _validate_retention(self, backup_job: Dict) -> Dict[str, bool]:
        """Validate backup retention settings."""
        try:
            recovery_point = self.backup.describe_recovery_point(
                BackupVaultName=self.backup_vault,
                RecoveryPointArn=backup_job["RecoveryPointArn"],
            )

            retention = recovery_point.get("Lifecycle", {})
            retention_days = retention.get("DeleteAfterDays", 0)
            is_valid = retention_days >= self.thresholds["retention_period"]

            return {"retention_validation": is_valid}

        except ClientError as e:
            logger.error(f"Retention validation failed: {str(e)}")
            return {"retention_validation": False}

    def _test_restore(self, backup_job: Dict) -> bool:
        """Test restore backup to validation environment."""
        try:
            # Start restore job
            restore_job = self.backup.start_restore_job(
                RecoveryPointArn=backup_job["RecoveryPointArn"],
                Metadata={
                    "RestoreTime": datetime.utcnow().isoformat(),
                    "TargetDatabase": self.test_restore_db,
                },
                IamRoleArn=backup_job["IamRoleArn"],
                ResourceType=backup_job["ResourceType"],
            )

            # Wait for restore to complete
            waiter = self.backup.get_waiter("restore_job_completed")
            waiter.wait(
                RestoreJobId=restore_job["RestoreJobId"],
                WaiterConfig={"Delay": 30, "MaxAttempts": 40},
            )

            return True

        except ClientError as e:
            logger.error(f"Restore test failed: {str(e)}")
            return False

    def _publish_metrics(self, validation_results: Dict) -> None:
        """Publish validation metrics to CloudWatch."""
        try:
            metric_data = []

            # Add validation metrics
            for validation, result in validation_results["validations"].items():
                metric_data.append(
                    {
                        "MetricName": (f"BackupValidation_{validation}"),
                        "Value": 1 if result else 0,
                        "Unit": "Count",
                        "Timestamp": datetime.utcnow(),
                    }
                )

            self.cloudwatch.put_metric_data(
                Namespace="BackupValidation", MetricData=metric_data
            )

        except ClientError as e:
            logger.error(f"Failed to publish metrics: {str(e)}")

    def _send_alert(self, validation_results: Dict) -> None:
        """Send SNS alert for failed validations."""
        try:
            message = {
                "validation_results": validation_results,
                "timestamp": datetime.utcnow().isoformat(),
                "environment": "production",
            }

            self.sns.publish(
                TopicArn=self.sns_topic,
                Message=json.dumps(message, indent=2),
                Subject="Backup Validation Alert",
            )

        except ClientError as e:
            logger.error(f"Failed to send alert: {str(e)}")


def main():
    """Main entry point for backup validation script."""
    parser = argparse.ArgumentParser(description="Validate AWS backups")
    parser.add_argument(
        "--latest", action="store_true", help="Validate latest backup only"
    )
    args = parser.parse_args()

    validator = BackupValidator()

    try:
        if args.latest:
            results = validator.validate_latest_backup()
            print(json.dumps(results, indent=2))
            sys.exit(0 if all(results["validations"].values()) else 1)
    except Exception as e:
        logger.error(f"Validation failed: {str(e)}")
        sys.exit(1)


if __name__ == "__main__":
    main()
