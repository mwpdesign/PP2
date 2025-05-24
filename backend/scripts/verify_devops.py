#!/usr/bin/env python3
"""
DevOps Verification Script for Healthcare IVR Platform.
Tests infrastructure, monitoring, and operational components.
"""

import argparse
import boto3
import json
import logging
import subprocess
import sys
from datetime import datetime, timedelta
from typing import Dict, List, Any
from botocore.exceptions import ClientError

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('devops_verification')


class DevOpsVerifier:
    """Verifies all DevOps components of the Healthcare IVR Platform."""

    def __init__(self, environment: str):
        """Initialize verification components."""
        self.environment = environment
        self.results = {
            'cicd': {},
            'infrastructure': {},
            'backup': {},
            'monitoring': {},
            'security': {},
            'compliance': {}
        }
        
        # Initialize AWS clients
        self.ecs = boto3.client('ecs')
        self.rds = boto3.client('rds')
        self.backup = boto3.client('backup')
        self.cloudwatch = boto3.client('cloudwatch')
        self.cloudtrail = boto3.client('cloudtrail')
        self.securityhub = boto3.client('securityhub')
        self.sns = boto3.client('sns')
        
        # Configuration
        self.cluster_name = f'healthcare-ivr-cluster-{environment}'
        self.backup_vault = f'healthcare-ivr-backup-vault-{environment}'
        self.dashboard_name = f'{environment}-comprehensive-dashboard'

    def verify_cicd(self) -> Dict[str, Any]:
        """Verify CI/CD pipeline components."""
        try:
            logger.info("Verifying CI/CD pipeline...")
            
            # Check GitHub Actions workflows
            workflow_status = self._check_github_workflows()
            
            # Verify deployment configurations
            deployment_config = self._verify_deployment_config()
            
            # Check security scanning integration
            security_scan = self._verify_security_scanning()
            
            return {
                'workflow_status': workflow_status,
                'deployment_config': deployment_config,
                'security_scan': security_scan,
                'timestamp': datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"CI/CD verification failed: {str(e)}")
            return {'error': str(e)}

    def verify_infrastructure(self) -> Dict[str, Any]:
        """Verify infrastructure components."""
        try:
            logger.info("Verifying infrastructure...")
            
            # Check ECS services
            ecs_status = self._verify_ecs_services()
            
            # Verify RDS instances
            rds_status = self._verify_rds_instances()
            
            # Check security groups
            security_groups = self._verify_security_groups()
            
            # Verify network configuration
            network_config = self._verify_network_config()
            
            return {
                'ecs_status': ecs_status,
                'rds_status': rds_status,
                'security_groups': security_groups,
                'network_config': network_config,
                'timestamp': datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Infrastructure verification failed: {str(e)}")
            return {'error': str(e)}

    def verify_backup_system(self) -> Dict[str, Any]:
        """Verify backup and recovery system."""
        try:
            logger.info("Verifying backup system...")
            
            # Check recent backups
            backup_jobs = self.backup.list_backup_jobs(
                ByCreatedAfter=datetime.utcnow() - timedelta(hours=24)
            )
            
            # Verify backup vault
            vault_info = self.backup.describe_backup_vault(
                BackupVaultName=self.backup_vault
            )
            
            # Check recovery points
            recovery_points = (
                self.backup.list_recovery_points_by_backup_vault(
                    BackupVaultName=self.backup_vault,
                    ByCreatedAfter=datetime.utcnow() - timedelta(days=7)
                )
            )
            
            # Run backup validation
            validation_result = self._run_backup_validation()
            
            return {
                'recent_backups': len(backup_jobs.get('BackupJobs', [])),
                'vault_status': vault_info.get('BackupVaultStatus'),
                'recovery_points': len(
                    recovery_points.get('RecoveryPoints', [])
                ),
                'validation_result': validation_result,
                'timestamp': datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Backup system verification failed: {str(e)}")
            return {'error': str(e)}

    def verify_monitoring(self) -> Dict[str, Any]:
        """Verify monitoring and alerting system."""
        try:
            logger.info("Verifying monitoring system...")
            
            # Check CloudWatch dashboards
            dashboard = self.cloudwatch.get_dashboard(
                DashboardName=self.dashboard_name
            )
            
            # Verify alarms
            alarms = self.cloudwatch.describe_alarms()
            
            # Check metric filters
            log_metrics = self._verify_log_metrics()
            
            # Test SNS notifications
            sns_status = self._test_sns_notifications()
            
            return {
                'dashboard_status': 'active' if dashboard else 'missing',
                'active_alarms': len(alarms.get('MetricAlarms', [])),
                'log_metrics': log_metrics,
                'sns_status': sns_status,
                'timestamp': datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Monitoring verification failed: {str(e)}")
            return {'error': str(e)}

    def verify_security(self) -> Dict[str, Any]:
        """Verify security configurations."""
        try:
            logger.info("Verifying security components...")
            
            # Check SecurityHub findings
            findings = self.securityhub.get_findings(
                Filters={
                    'RecordState': [
                        {'Value': 'ACTIVE', 'Comparison': 'EQUALS'}
                    ]
                }
            )
            
            # Verify CloudTrail
            trail_name = (
                f'healthcare-ivr-audit-trail-{self.environment}'
            )
            trail_status = self.cloudtrail.get_trail_status(
                Name=trail_name
            )
            
            # Check WAF rules
            waf_status = self._verify_waf_rules()
            
            # Verify encryption settings
            encryption_status = self._verify_encryption()
            
            return {
                'active_findings': len(findings.get('Findings', [])),
                'cloudtrail_status': trail_status.get('IsLogging'),
                'waf_status': waf_status,
                'encryption_status': encryption_status,
                'timestamp': datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Security verification failed: {str(e)}")
            return {'error': str(e)}

    def verify_compliance(self) -> Dict[str, Any]:
        """Verify HIPAA compliance requirements."""
        try:
            logger.info("Verifying compliance requirements...")
            
            # Check audit logging
            audit_status = self._verify_audit_logging()
            
            # Verify PHI access controls
            phi_controls = self._verify_phi_controls()
            
            # Check encryption compliance
            encryption_compliance = self._verify_encryption_compliance()
            
            # Verify backup retention
            retention_compliance = self._verify_backup_retention()
            
            return {
                'audit_status': audit_status,
                'phi_controls': phi_controls,
                'encryption_compliance': encryption_compliance,
                'retention_compliance': retention_compliance,
                'timestamp': datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Compliance verification failed: {str(e)}")
            return {'error': str(e)}

    def _check_github_workflows(self) -> Dict[str, Any]:
        """Check GitHub Actions workflow status."""
        try:
            # Use GitHub CLI to check workflow status
            result = subprocess.run(
                ['gh', 'workflow', 'list'],
                capture_output=True,
                text=True
            )
            return {'status': 'active', 'output': result.stdout}
        except Exception as e:
            return {'status': 'error', 'message': str(e)}

    def _verify_deployment_config(self) -> Dict[str, Any]:
        """Verify deployment configuration."""
        try:
            # Check ECS task definitions
            task_defs = self.ecs.list_task_definitions(
                familyPrefix=f'healthcare-ivr-{self.environment}'
            )
            return {
                'task_definitions': len(task_defs.get('taskDefinitionArns', [])),
                'status': 'verified'
            }
        except Exception as e:
            return {'status': 'error', 'message': str(e)}

    def _verify_security_scanning(self) -> Dict[str, Any]:
        """Verify security scanning integration."""
        try:
            # Check CodeQL scan results
            result = subprocess.run(
                ['gh', 'code-scanning', 'list'],
                capture_output=True,
                text=True
            )
            return {'status': 'active', 'output': result.stdout}
        except Exception as e:
            return {'status': 'error', 'message': str(e)}

    def _verify_ecs_services(self) -> Dict[str, Any]:
        """Verify ECS services."""
        try:
            services = self.ecs.list_services(cluster=self.cluster_name)
            service_details = self.ecs.describe_services(
                cluster=self.cluster_name,
                services=services['serviceArns']
            )
            return {
                'service_count': len(services['serviceArns']),
                'healthy_count': sum(
                    1 for s in service_details['services']
                    if s['status'] == 'ACTIVE'
                )
            }
        except Exception as e:
            return {'status': 'error', 'message': str(e)}

    def _run_backup_validation(self) -> Dict[str, Any]:
        """Run backup validation script."""
        try:
            result = subprocess.run(
                ['python', 'backend/scripts/validate_backup.py', '--latest'],
                capture_output=True,
                text=True
            )
            return json.loads(result.stdout)
        except Exception as e:
            return {'status': 'error', 'message': str(e)}

    def _verify_log_metrics(self) -> Dict[str, Any]:
        """Verify CloudWatch log metrics."""
        try:
            metrics = self.cloudwatch.list_metrics(
                Namespace=f'{self.environment}/BackupMetrics'
            )
            return {
                'metric_count': len(metrics.get('Metrics', [])),
                'status': 'active'
            }
        except Exception as e:
            return {'status': 'error', 'message': str(e)}

    def _test_sns_notifications(self) -> Dict[str, Any]:
        """Test SNS notification delivery."""
        try:
            # Send test notification
            topic_arn = (
                f'arn:aws:sns:us-east-1:123456789012:'
                f'{self.environment}-monitoring-alerts'
            )
            response = self.sns.publish(
                TopicArn=topic_arn,
                Message='DevOps verification test notification',
                Subject='Test Notification'
            )
            return {'status': 'sent', 'message_id': response['MessageId']}
        except Exception as e:
            return {'status': 'error', 'message': str(e)}

    def run_verification(self) -> Dict[str, Any]:
        """Run all verification checks."""
        logger.info(f"Starting comprehensive verification for {self.environment}")
        
        self.results['cicd'] = self.verify_cicd()
        self.results['infrastructure'] = self.verify_infrastructure()
        self.results['backup'] = self.verify_backup_system()
        self.results['monitoring'] = self.verify_monitoring()
        self.results['security'] = self.verify_security()
        self.results['compliance'] = self.verify_compliance()
        
        # Generate summary
        self.results['summary'] = {
            'environment': self.environment,
            'timestamp': datetime.utcnow().isoformat(),
            'status': all(
                'error' not in component
                for component in self.results.values()
            ),
            'components_verified': len(self.results) - 1  # Exclude summary
        }
        
        return self.results


def main():
    """Main entry point for DevOps verification."""
    parser = argparse.ArgumentParser(
        description='Verify DevOps implementation'
    )
    parser.add_argument(
        '--environment',
        choices=['dev', 'staging', 'prod'],
        default='dev',
        help='Environment to verify'
    )
    parser.add_argument(
        '--output',
        help='Output file for verification results'
    )
    args = parser.parse_args()
    
    verifier = DevOpsVerifier(args.environment)
    
    try:
        results = verifier.run_verification()
        
        if args.output:
            with open(args.output, 'w') as f:
                json.dump(results, f, indent=2)
        else:
            print(json.dumps(results, indent=2))
            
        # Exit with status code based on verification results
        sys.exit(0 if results['summary']['status'] else 1)
        
    except Exception as e:
        logger.error(f"Verification failed: {str(e)}")
        sys.exit(1)


if __name__ == '__main__':
    main() 