#!/usr/bin/env python3

import os
import sys
import json
import logging
import subprocess
import requests
import psycopg2
import boto3
from typing import Dict, Any, Tuple
from datetime import datetime
from pathlib import Path


class FinalSystemVerificationEngine:
    """Comprehensive system verification engine for Healthcare IVR Platform"""

    def __init__(self, project_root: str = None):
        self.project_root = Path(project_root or os.getcwd())
        self.logger = self._setup_logging()
        self.verification_results = {
            'timestamp': datetime.now().isoformat(),
            'overall_status': 'UNKNOWN',
            'components': {}
        }

    def _setup_logging(self) -> logging.Logger:
        """Configure logging for the verification engine"""
        logger = logging.getLogger('final_verification')
        logger.setLevel(logging.INFO)

        # Create logs directory
        log_dir = self.project_root / "verification_reports/logs"
        log_dir.mkdir(parents=True, exist_ok=True)

        # Create file handler
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        log_file = log_dir / f"final_verification_{timestamp}.log"

        handler = logging.FileHandler(log_file)
        fmt = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
        handler.setFormatter(logging.Formatter(fmt))

        logger.addHandler(handler)
        return logger

    def verify_project_structure(self) -> Dict[str, Any]:
        """Verify project directory structure and core files"""
        self.logger.info("Verifying project structure")

        required_dirs = {
            'frontend': [
                'src/components',
                'src/services',
                'src/hooks',
                'src/utils',
                'public'
            ],
            'backend': [
                'app/api',
                'app/core',
                'app/models',
                'app/services',
                'tests'
            ],
            'infrastructure': [
                'modules/vpc',
                'modules/monitoring',
                'modules/backup'
            ],
            'docs': [
                'runbooks',
                'api',
                'deployment'
            ],
            'scripts': []
        }

        required_files = {
            '.env.example': {'required': True},
            'docker-compose.yml': {'required': True},
            'README.md': {'required': True},
            'requirements.txt': {'required': True},
            'package.json': {'required': True},
            '.gitignore': {'required': True},
            'frontend/package.json': {'required': True},
            'backend/requirements.txt': {'required': True},
            'infrastructure/main.tf': {'required': True}
        }

        results = {
            'directories': {},
            'files': {},
            'status': 'PASS'
        }

        # Check directories
        for base_dir, subdirs in required_dirs.items():
            base_path = self.project_root / base_dir
            results['directories'][base_dir] = {
                'exists': base_path.exists(),
                'is_directory': (
                    base_path.is_dir() if base_path.exists() else False
                ),
                'subdirectories': {}
            }

            if not base_path.exists() or not base_path.is_dir():
                results['status'] = 'FAIL'
                continue

            for subdir in subdirs:
                subdir_path = base_path / subdir
                subdir_exists = subdir_path.exists()
                subdir_is_dir = subdir_path.is_dir() if subdir_exists else False

                # Get base directory info
                base_dir_info = results['directories'][base_dir]
                base_subdirs = base_dir_info['subdirectories']
                # Add subdir info
                # Create subdir status dict
                subdir_status = {
                    'exists': subdir_exists,
                    'is_directory': subdir_is_dir
                }
                base_subdirs[subdir] = subdir_status
                if not subdir_exists or not subdir_is_dir:
                    results['status'] = 'FAIL'

        # Check files
        for file_path, requirements in required_files.items():
            path = self.project_dir / file_path
            # Check if file exists and is valid
            file_exists = path.exists()
            is_file = path.is_file() if file_exists else False
            required = requirements.get('required', False)

            results['files'][file_path] = {
                'exists': file_exists,
                'is_file': is_file,
                'required': required
            }

            if required and (not file_exists or not is_file):
                results['status'] = 'FAIL'

        return {'project_structure': results}

    def verify_development_environment(self) -> Dict[str, Any]:
        """Verify development environment setup and dependencies"""
        self.logger.info("Verifying development environment")

        required_tools = [
            ('docker', '--version'),
            ('docker-compose', '--version'),
            ('python3', '--version'),
            ('npm', '--version'),
            ('node', '--version'),
            ('terraform', '--version'),
            ('aws', '--version'),
            ('git', '--version')
        ]

        results = {
            'tools': {},
            'status': 'PASS'
        }

        for tool, version_flag in required_tools:
            try:
                result = subprocess.run(
                    [tool, version_flag],
                    capture_output=True,
                    text=True
                )

                if result.returncode == 0:
                    # Get tool info
                    version = result.stdout.strip()
                    path_result = subprocess.run(
                        ['which', tool],
                        capture_output=True,
                        text=True
                    )
                    tool_path = (
                        path_result.stdout.strip()
                        if path_result.returncode == 0
                        else None
                    )

                    results['tools'][tool] = {
                        'installed': True,
                        'version': version,
                        'path': tool_path
                    }
                else:
                    results['tools'][tool] = {
                        'installed': False,
                        'error': result.stderr.strip()
                    }
                    results['status'] = 'FAIL'
            except Exception as e:
                results['tools'][tool] = {
                    'installed': False,
                    'error': str(e)
                }
                results['status'] = 'FAIL'

        return {'development_environment': results}

    def verify_docker_services(self) -> Dict[str, Any]:
        """Verify Docker services status"""
        self.logger.info("Verifying Docker services")

        try:
            result = subprocess.run(
                ['docker-compose', 'ps', '--format', 'json'],
                capture_output=True,
                text=True,
                check=True
            )

            services = json.loads(result.stdout)
            results = {
                'services': {},
                'status': 'PASS'
            }

            required_services = {
                'frontend': 3000,
                'backend': 8000,
                'postgres': 5432,
                'redis': 6379
            }

            for service_name, expected_port in required_services.items():
                service_found = False
                for service in services:
                    if service['Service'] == service_name:
                        service_found = True
                        is_running = 'running' in service['State'].lower()
                        results['services'][service_name] = {
                            'running': is_running,
                            'state': service['State'],
                            'ports': service.get('Ports', ''),
                            'status': 'PASS' if is_running else 'FAIL'
                        }
                        if not is_running:
                            results['status'] = 'FAIL'
                        break

                if not service_found:
                    results['services'][service_name] = {
                        'running': False,
                        'state': 'not found',
                        'status': 'FAIL'
                    }
                    results['status'] = 'FAIL'

            return {'docker_services': results}

        except Exception as e:
            return {
                'docker_services': {
                    'status': 'FAIL',
                    'error': str(e)
                }
            }

    def verify_api_endpoints(self) -> Dict[str, Any]:
        """Verify API endpoints functionality"""
        self.logger.info("Verifying API endpoints")

        endpoints = [
            ('/health', 'GET'),
            ('/api/v1/users', 'GET'),
            ('/api/v1/patients', 'GET'),
            ('/api/v1/orders', 'GET'),
            ('/api/v1/providers', 'GET'),
            ('/api/v1/analytics', 'GET')
        ]

        results = {
            'endpoints': {},
            'status': 'PASS'
        }

        base_url = 'http://localhost:8000'

        for endpoint, method in endpoints:
            try:
                response = requests.request(
                    method,
                    f"{base_url}{endpoint}",
                    timeout=5
                )

                # Consider 401/403 as successful for protected endpoints
                is_success = response.status_code in [200, 401, 403]

                results['endpoints'][endpoint] = {
                    'method': method,
                    'status_code': response.status_code,
                    'response_time': response.elapsed.total_seconds(),
                    'status': 'PASS' if is_success else 'FAIL'
                }

                if not is_success:
                    results['status'] = 'FAIL'

            except requests.exceptions.RequestException as e:
                results['endpoints'][endpoint] = {
                    'method': method,
                    'error': str(e),
                    'status': 'FAIL'
                }
                results['status'] = 'FAIL'

        return {'api_endpoints': results}

    def verify_database(self) -> Dict[str, Any]:
        """Verify database setup and schema"""
        self.logger.info("Verifying database")

        required_tables = [
            'users',
            'organizations',
            'roles',
            'permissions',
            'facilities',
            'doctors',
            'patients',
            'ivr_requests',
            'orders',
            'audit_logs',
            'territories'
        ]

        results = {
            'connection': {},
            'tables': {},
            'status': 'PASS'
        }

        try:
            conn = psycopg2.connect(
                "postgresql://localhost:5432/healthcare_ivr"
            )
            cur = conn.cursor()

            # Check connection
            cur.execute("SELECT version();")
            version = cur.fetchone()[0]
            results['connection'] = {
                'connected': True,
                'version': version
            }

            # Check tables
            cur.execute("""
                SELECT table_name
                FROM information_schema.tables
                WHERE table_schema = 'public'
            """)
            existing_tables = {row[0] for row in cur.fetchall()}

            for table in required_tables:
                exists = table in existing_tables
                if exists:
                    cur.execute(f"SELECT COUNT(*) FROM {table}")
                    count = cur.fetchone()[0]
                    results['tables'][table] = {
                        'exists': True,
                        'row_count': count,
                        'status': 'PASS'
                    }
                else:
                    results['tables'][table] = {
                        'exists': False,
                        'status': 'FAIL'
                    }
                    results['status'] = 'FAIL'

            conn.close()

        except Exception as e:
            results['connection'] = {
                'connected': False,
                'error': str(e)
            }
            results['status'] = 'FAIL'

        return {'database': results}

    def verify_aws_services(self) -> Dict[str, Any]:
        """Verify AWS service configurations"""
        self.logger.info("Verifying AWS services")

        required_services = {
            'cognito-idp': self._verify_cognito,
            's3': self._verify_s3,
            'kms': self._verify_kms,
            'ses': self._verify_ses,
            'cloudtrail': self._verify_cloudtrail
        }

        results = {
            'services': {},
            'status': 'PASS'
        }

        for service_name, verify_func in required_services.items():
            try:
                client = boto3.client(service_name)
                service_results = verify_func(client)
                results['services'][service_name] = service_results

                if service_results.get('status') == 'FAIL':
                    results['status'] = 'FAIL'

            except Exception as e:
                results['services'][service_name] = {
                    'status': 'FAIL',
                    'error': str(e)
                }
                results['status'] = 'FAIL'

        return {'aws_services': results}

    def _verify_cognito(self, client) -> Dict[str, Any]:
        """Verify Cognito configuration"""
        response = client.list_user_pools(MaxResults=10)
        return {
            'status': 'PASS',
            'user_pools': len(response['UserPools']),
            'details': [pool['Name'] for pool in response['UserPools']]
        }

    def _verify_s3(self, client) -> Dict[str, Any]:
        """Verify S3 configuration"""
        response = client.list_buckets()
        return {
            'status': 'PASS',
            'buckets': len(response['Buckets']),
            'details': [bucket['Name'] for bucket in response['Buckets']]
        }

    def _verify_kms(self, client) -> Dict[str, Any]:
        """Verify KMS configuration"""
        response = client.list_keys()
        return {
            'status': 'PASS',
            'keys': len(response['Keys']),
            'details': [key['KeyId'] for key in response['Keys']]
        }

    def _verify_ses(self, client) -> Dict[str, Any]:
        """Verify SES configuration"""
        response = client.get_send_quota()
        return {
            'status': 'PASS',
            'quota': response['Max24HourSend'],
            'sent_last_24h': response['SentLast24Hours']
        }

    def _verify_cloudtrail(self, client) -> Dict[str, Any]:
        """Verify CloudTrail configuration"""
        response = client.list_trails()
        return {
            'status': 'PASS',
            'trails': len(response['Trails']),
            'details': [trail['Name'] for trail in response['Trails']]
        }

    def verify_security_compliance(self) -> Dict[str, Any]:
        """Verify security and compliance configurations"""
        self.logger.info("Verifying security and compliance")

        checks = {
            'ssl_config': self._verify_ssl_config(),
            'auth_config': self._verify_auth_config(),
            'encryption_config': self._verify_encryption_config(),
            'audit_logging': self._verify_audit_logging()
        }

        all_passed = all(c['status'] == 'PASS' for c in checks.values())
        results = {
            'checks': checks,
            'status': 'PASS' if all_passed else 'FAIL'
        }

        return {'security_compliance': results}

    def _verify_ssl_config(self) -> Dict[str, Any]:
        """Verify SSL configuration"""
        try:
            requests.get(
                'https://localhost:443',
                verify=True,
                timeout=5
            )
            return {
                'status': 'PASS',
                'details': {
                    'ssl_enabled': True,
                    'certificate_valid': True
                }
            }
        except requests.exceptions.SSLError:
            return {
                'status': 'FAIL',
                'error': 'SSL certificate validation failed'
            }
        except Exception as e:
            return {
                'status': 'FAIL',
                'error': str(e)
            }

    def _verify_auth_config(self) -> Dict[str, Any]:
        """Verify authentication configuration"""
        required_vars = [
            'COGNITO_USER_POOL_ID',
            'COGNITO_CLIENT_ID',
            'JWT_SECRET'
        ]

        missing_vars = [var for var in required_vars if not os.getenv(var)]

        return {
            'status': 'PASS' if not missing_vars else 'FAIL',
            'details': {
                'missing_env_vars': missing_vars,
                'auth_configured': len(missing_vars) == 0
            }
        }

    def _verify_encryption_config(self) -> Dict[str, Any]:
        """Verify encryption configuration"""
        required_vars = [
            'KMS_KEY_ID',
            'ENCRYPTION_KEY'
        ]

        missing_vars = [var for var in required_vars if not os.getenv(var)]

        return {
            'status': 'PASS' if not missing_vars else 'FAIL',
            'details': {
                'missing_env_vars': missing_vars,
                'encryption_configured': len(missing_vars) == 0
            }
        }

    def _verify_audit_logging(self) -> Dict[str, Any]:
        """Verify audit logging configuration"""
        try:
            conn = psycopg2.connect(
                "postgresql://localhost:5432/healthcare_ivr"
            )
            cur = conn.cursor()

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
                'status': 'PASS' if table_exists else 'FAIL',
                'details': {
                    'table_exists': table_exists,
                    'log_count': log_count
                }
            }
        except Exception as e:
            return {
                'status': 'FAIL',
                'error': str(e)
            }

    def run_verification(self) -> Tuple[bool, Dict[str, Any]]:
        """Run all verification checks"""
        self.logger.info("Starting system verification")

        verifications = [
            self.verify_project_structure,
            self.verify_development_environment,
            self.verify_docker_services,
            self.verify_api_endpoints,
            self.verify_database,
            self.verify_aws_services,
            self.verify_security_compliance
        ]

        for verify_func in verifications:
            try:
                self.logger.info(f"Running {verify_func.__name__}")
                results = verify_func()
                self.verification_results['components'].update(results)
            except Exception as e:
                err_msg = f"Verification failed: {verify_func.__name__}"
                self.logger.error(err_msg, exc_info=True)
                components = self.verification_results['components']
                components[verify_func.__name__] = {
                    'status': 'FAIL',
                    'error': str(e)
                }

        # Determine overall status
        has_failures = any(
            component.get('status') == 'FAIL'
            for component in self.verification_results['components'].values()
        )

        status = 'FAIL' if has_failures else 'PASS'
        self.verification_results['overall_status'] = status

        return not has_failures, self.verification_results

    def generate_report(self) -> str:
        """Generate and save verification report"""
        self.logger.info("Generating verification report")

        success, results = self.run_verification()

        # Save report
        report_dir = self.project_root / "verification_reports"
        report_dir.mkdir(parents=True, exist_ok=True)

        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        report_file = report_dir / f"final_verification_{timestamp}.json"

        try:
            with open(report_file, "w") as f:
                json.dump(results, f, indent=2)

            self.logger.info(f"Verification report saved: {report_file}")
            return str(report_file)
        except Exception as e:
            # Log error with details
            error_msg = "Failed to generate verification report: {}"
            self.logger.error(error_msg.format(str(e)))
            return "Error generating verification report"


def main():
    """Main entry point for final system verification"""
    try:
        verifier = FinalSystemVerificationEngine()
        report_path = verifier.generate_report()

        # Print summary to console
        print("\n=== Final System Verification Report ===")
        print(f"Report saved to: {report_path}")
        status = verifier.verification_results['overall_status']
        print(f"Overall Status: {status}")
        print("\nComponent Status:")

        components = verifier.verification_results['components']
        for component, details in components.items():
            status = details.get('status', 'UNKNOWN')
            color = "\033[92m" if status == 'PASS' else "\033[91m"
            print(f"{component}: {color}{status}\033[0m")

        exit_code = 0 if status == 'PASS' else 1
        sys.exit(exit_code)

    except Exception as e:
        print(f"Error during verification: {str(e)}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
