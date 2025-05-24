#!/usr/bin/env python3
"""
Automated Remediation Engine for Healthcare IVR Platform.
Implements automated fixes for security and compliance findings.
"""

import boto3
import json
import logging
import argparse
from typing import Dict, List, Any
from datetime import datetime

class RemediationEngine:
    """Implements automated remediation for security and compliance findings."""

    def __init__(self, environment: str):
        """Initialize remediation engine."""
        self.environment = environment
        self.logger = logging.getLogger('remediation_engine')
        
        # Initialize AWS clients
        self.clients = {
            'ec2': boto3.client('ec2'),
            'rds': boto3.client('rds'),
            'iam': boto3.client('iam'),
            'security_hub': boto3.client('securityhub'),
            'config': boto3.client('config'),
            'kms': boto3.client('kms'),
            'waf': boto3.client('wafv2')
        }
        
        # Define remediation thresholds
        self.thresholds = {
            'max_security_group_rules': 50,
            'max_open_ports': 5,
            'min_password_length': 14,
            'password_reuse_prevention': 24
        }

    def remediate_findings(self, findings: List[Dict]) -> Dict:
        """Process and remediate security and compliance findings."""
        remediation_results = {
            'timestamp': datetime.utcnow().isoformat(),
            'environment': self.environment,
            'total_findings': len(findings),
            'remediated': 0,
            'failed_remediation': 0,
            'skipped': 0,
            'actions': [],
            'recommendations': []
        }

        for finding in findings:
            try:
                remediation_method = self._get_remediation_method(finding)
                if remediation_method:
                    self.logger.info(f"Attempting remediation for {finding['type']}")
                    result = remediation_method(finding)
                    
                    if result['status'] == 'SUCCESS':
                        remediation_results['remediated'] += 1
                        remediation_results['actions'].append(result)
                    else:
                        remediation_results['failed_remediation'] += 1
                        remediation_results['recommendations'].append({
                            'type': finding['type'],
                            'error': result['error'],
                            'manual_steps': self._get_manual_steps(finding)
                        })
                else:
                    remediation_results['skipped'] += 1
                    remediation_results['recommendations'].append({
                        'type': 'MANUAL_REVIEW',
                        'finding_type': finding['type'],
                        'description': f"No automated remediation available for: {finding['type']}"
                    })
            except Exception as e:
                self.logger.error(f"Remediation error for {finding['type']}: {e}")
                remediation_results['failed_remediation'] += 1
                remediation_results['recommendations'].append({
                    'type': finding['type'],
                    'error': str(e),
                    'manual_steps': self._get_manual_steps(finding)
                })

        return remediation_results

    def _get_remediation_method(self, finding: Dict):
        """Map findings to specific remediation methods."""
        remediation_map = {
            'SECURITY_GROUP_OPEN': self._remediate_security_group,
            'IAM_POLICY_OVERPRIVILEGED': self._remediate_iam_policy,
            'RDS_ENCRYPTION_DISABLED': self._enable_rds_encryption,
            'UNENCRYPTED_EBS_VOLUME': self._encrypt_ebs_volume,
            'WEAK_PASSWORD_POLICY': self._strengthen_password_policy,
            'WAF_MISCONFIGURATION': self._remediate_waf_config,
            'KMS_KEY_ROTATION_DISABLED': self._enable_kms_rotation
        }
        
        return remediation_map.get(finding['type'])

    def _remediate_security_group(self, finding: Dict) -> Dict:
        """Automatically restrict overly permissive security groups."""
        try:
            security_group_id = finding['resourceId']
            
            # Get current security group rules
            security_group = self.clients['ec2'].describe_security_groups(
                GroupIds=[security_group_id]
            )['SecurityGroups'][0]
            
            # Identify overly permissive rules
            open_rules = [
                rule for rule in security_group['IpPermissions']
                if any(ip['CidrIp'] == '0.0.0.0/0' for ip in rule.get('IpRanges', []))
            ]
            
            if open_rules:
                # Remove overly permissive rules
                self.clients['ec2'].revoke_security_group_ingress(
                    GroupId=security_group_id,
                    IpPermissions=open_rules
                )
                
                return {
                    'status': 'SUCCESS',
                    'type': 'SECURITY_GROUP',
                    'action': 'Restricted overly permissive security group rules',
                    'resourceId': security_group_id,
                    'details': f"Removed {len(open_rules)} open rules"
                }
            
            return {
                'status': 'SUCCESS',
                'type': 'SECURITY_GROUP',
                'action': 'No overly permissive rules found',
                'resourceId': security_group_id
            }
            
        except Exception as e:
            return {
                'status': 'FAILED',
                'type': 'SECURITY_GROUP',
                'error': str(e),
                'resourceId': security_group_id
            }

    def _remediate_iam_policy(self, finding: Dict) -> Dict:
        """Restrict overly permissive IAM policies."""
        try:
            policy_arn = finding['resourceId']
            
            # Get current policy
            current_policy = self.clients['iam'].get_policy_version(
                PolicyArn=policy_arn,
                VersionId=finding['policyVersionId']
            )['PolicyVersion']
            
            # Create more restrictive policy
            restricted_policy = self._create_restricted_policy(
                current_policy['Document']
            )
            
            # Create new policy version
            self.clients['iam'].create_policy_version(
                PolicyArn=policy_arn,
                PolicyDocument=json.dumps(restricted_policy),
                SetAsDefault=True
            )
            
            return {
                'status': 'SUCCESS',
                'type': 'IAM_POLICY',
                'action': 'Created restricted IAM policy version',
                'resourceId': policy_arn
            }
            
        except Exception as e:
            return {
                'status': 'FAILED',
                'type': 'IAM_POLICY',
                'error': str(e),
                'resourceId': policy_arn
            }

    def _enable_rds_encryption(self, finding: Dict) -> Dict:
        """Enable encryption for RDS instances."""
        try:
            instance_id = finding['resourceId']
            
            # Create encrypted snapshot
            snapshot = self.clients['rds'].create_db_snapshot(
                DBSnapshotIdentifier=f"{instance_id}-encrypted-{int(datetime.now().timestamp())}",
                DBInstanceIdentifier=instance_id
            )
            
            # Wait for snapshot completion
            self.clients['rds'].get_waiter('db_snapshot_available').wait(
                DBSnapshotIdentifier=snapshot['DBSnapshot']['DBSnapshotIdentifier']
            )
            
            # Create encrypted instance from snapshot
            self.clients['rds'].restore_db_instance_from_db_snapshot(
                DBInstanceIdentifier=f"{instance_id}-encrypted",
                DBSnapshotIdentifier=snapshot['DBSnapshot']['DBSnapshotIdentifier'],
                StorageEncrypted=True
            )
            
            return {
                'status': 'SUCCESS',
                'type': 'RDS_ENCRYPTION',
                'action': 'Created encrypted RDS instance from snapshot',
                'resourceId': instance_id
            }
            
        except Exception as e:
            return {
                'status': 'FAILED',
                'type': 'RDS_ENCRYPTION',
                'error': str(e),
                'resourceId': instance_id
            }

    def _encrypt_ebs_volume(self, finding: Dict) -> Dict:
        """Encrypt EBS volumes."""
        try:
            volume_id = finding['resourceId']
            
            # Create encrypted snapshot
            snapshot = self.clients['ec2'].create_snapshot(
                VolumeId=volume_id,
                Description='Encrypted volume snapshot'
            )
            
            # Wait for snapshot completion
            self.clients['ec2'].get_waiter('snapshot_completed').wait(
                SnapshotIds=[snapshot['SnapshotId']]
            )
            
            # Create encrypted volume
            encrypted_volume = self.clients['ec2'].create_volume(
                AvailabilityZone=finding['availabilityZone'],
                SnapshotId=snapshot['SnapshotId'],
                Encrypted=True
            )
            
            return {
                'status': 'SUCCESS',
                'type': 'EBS_ENCRYPTION',
                'action': 'Created encrypted volume from snapshot',
                'resourceId': encrypted_volume['VolumeId']
            }
            
        except Exception as e:
            return {
                'status': 'FAILED',
                'type': 'EBS_ENCRYPTION',
                'error': str(e),
                'resourceId': volume_id
            }

    def _strengthen_password_policy(self, finding: Dict) -> Dict:
        """Strengthen IAM password policy."""
        try:
            # Update password policy
            self.clients['iam'].update_account_password_policy(
                MinimumPasswordLength=self.thresholds['min_password_length'],
                RequireSymbols=True,
                RequireNumbers=True,
                RequireUppercaseCharacters=True,
                RequireLowercaseCharacters=True,
                AllowUsersToChangePassword=True,
                MaxPasswordAge=90,
                PasswordReusePrevention=self.thresholds['password_reuse_prevention']
            )
            
            return {
                'status': 'SUCCESS',
                'type': 'PASSWORD_POLICY',
                'action': 'Strengthened IAM password policy'
            }
            
        except Exception as e:
            return {
                'status': 'FAILED',
                'type': 'PASSWORD_POLICY',
                'error': str(e)
            }

    def _get_manual_steps(self, finding: Dict) -> List[str]:
        """Generate manual remediation steps."""
        manual_steps_map = {
            'SECURITY_GROUP_OPEN': [
                "Review security group rules manually",
                "Remove unnecessary 0.0.0.0/0 ingress rules",
                "Implement least-privilege access"
            ],
            'IAM_POLICY_OVERPRIVILEGED': [
                "Review IAM policy permissions",
                "Remove unnecessary administrative access",
                "Implement role-based access control"
            ],
            'RDS_ENCRYPTION_DISABLED': [
                "Take database backup before encryption",
                "Plan maintenance window for encryption",
                "Update application connection strings"
            ]
        }
        
        return manual_steps_map.get(finding['type'], ["Review finding and implement appropriate controls"])

def main():
    """Main entry point for remediation engine."""
    parser = argparse.ArgumentParser(
        description='Automated Remediation Engine'
    )
    parser.add_argument(
        '--environment',
        choices=['dev', 'staging', 'prod'],
        default='dev',
        help='Environment to remediate'
    )
    parser.add_argument(
        '--input',
        required=True,
        help='Input findings file'
    )
    parser.add_argument(
        '--output',
        help='Output remediation results file'
    )
    args = parser.parse_args()
    
    # Configure logging
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    # Initialize remediation engine
    engine = RemediationEngine(args.environment)
    
    try:
        # Load findings
        with open(args.input, 'r') as f:
            findings = json.load(f)
        
        # Run remediation
        results = engine.remediate_findings(findings)
        
        # Save results
        if args.output:
            with open(args.output, 'w') as f:
                json.dump(results, f, indent=2)
        else:
            print(json.dumps(results, indent=2))
        
        # Print summary
        print(f"\nRemediation Summary:")
        print(f"Environment: {results['environment']}")
        print(f"Total Findings: {results['total_findings']}")
        print(f"Successfully Remediated: {results['remediated']}")
        print(f"Failed Remediation: {results['failed_remediation']}")
        print(f"Skipped (Manual Review): {results['skipped']}")
        
        # Exit with appropriate status code
        sys.exit(0 if results['failed_remediation'] == 0 else 1)
        
    except Exception as e:
        logging.error(f"Remediation failed: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main() 