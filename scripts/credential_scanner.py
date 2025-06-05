#!/usr/bin/env python3
"""
Healthcare IVR Platform - Credential Scanner
Comprehensive security scanning script to detect hard-coded credentials.
"""

import os
import re
import json
import argparse
from pathlib import Path
from typing import List, Dict
from datetime import datetime
import hashlib


class CredentialScanner:
    """Comprehensive credential and sensitive information scanner."""

    def __init__(self, project_root: str = None):
        self.project_root = Path(project_root) if project_root else Path.cwd()
        self.findings = []
        self.stats = {
            'files_scanned': 0,
            'total_findings': 0,
            'high_risk': 0,
            'medium_risk': 0,
            'low_risk': 0
        }

        # Define patterns for different types of credentials and sensitive data
        self.patterns = {
            'api_keys': {
                'risk': 'HIGH',
                'patterns': [
                    r'(?i)(api[_-]?key|apikey)\s*[=:]\s*["\']?'
                    r'([a-zA-Z0-9_\-]{20,})["\']?',
                    r'(?i)(secret[_-]?key|secretkey)\s*[=:]\s*["\']?'
                    r'([a-zA-Z0-9_\-]{20,})["\']?',
                    r'(?i)(access[_-]?key|accesskey)\s*[=:]\s*["\']?'
                    r'([a-zA-Z0-9_\-]{20,})["\']?',
                    r'(?i)(private[_-]?key|privatekey)\s*[=:]\s*["\']?'
                    r'([a-zA-Z0-9_\-]{20,})["\']?',
                    r'(?i)(client[_-]?secret|clientsecret)\s*[=:]\s*["\']?'
                    r'([a-zA-Z0-9_\-]{20,})["\']?',
                ]
            },
            'aws_credentials': {
                'risk': 'HIGH',
                'patterns': [
                    r'AKIA[0-9A-Z]{16}',  # AWS Access Key ID
                    r'(?i)(aws[_-]?access[_-]?key[_-]?id)\s*[=:]\s*["\']?'
                    r'([A-Z0-9]{20})["\']?',
                    r'(?i)(aws[_-]?secret[_-]?access[_-]?key)\s*[=:]\s*["\']?'
                    r'([A-Za-z0-9/+=]{40})["\']?',
                    r'(?i)(aws[_-]?session[_-]?token)\s*[=:]\s*["\']?'
                    r'([A-Za-z0-9/+=]{100,})["\']?',
                ]
            },
            'database_urls': {
                'risk': 'HIGH',
                'patterns': [
                    r'(?i)(database[_-]?url|db[_-]?url)\s*[=:]\s*["\']?(postgresql://[^"\'\s]+)["\']?',
                    r'(?i)(database[_-]?url|db[_-]?url)\s*[=:]\s*["\']?(mysql://[^"\'\s]+)["\']?',
                    r'(?i)(database[_-]?url|db[_-]?url)\s*[=:]\s*["\']?(mongodb://[^"\'\s]+)["\']?',
                    r'(?i)(connection[_-]?string)\s*[=:]\s*["\']?([^"\'\s]*://[^"\'\s]+)["\']?',
                ]
            },
            'passwords': {
                'risk': 'HIGH',
                'patterns': [
                    r'(?i)(password|passwd|pwd)\s*[=:]\s*["\']([^"\'\s]{6,})["\']',
                    r'(?i)(db[_-]?password|database[_-]?password)\s*[=:]\s*["\']([^"\'\s]+)["\']',
                    r'(?i)(admin[_-]?password)\s*[=:]\s*["\']([^"\'\s]+)["\']',
                ]
            },
            'jwt_secrets': {
                'risk': 'HIGH',
                'patterns': [
                    r'(?i)(jwt[_-]?secret|jwt[_-]?key)\s*[=:]\s*["\']?([a-zA-Z0-9_\-]{20,})["\']?',
                    r'(?i)(token[_-]?secret|token[_-]?key)\s*[=:]\s*["\']?([a-zA-Z0-9_\-]{20,})["\']?',
                ]
            },
            'encryption_keys': {
                'risk': 'HIGH',
                'patterns': [
                    r'(?i)(encryption[_-]?key|encrypt[_-]?key)\s*[=:]\s*["\']?([a-zA-Z0-9_\-/+=]{20,})["\']?',
                    r'(?i)(cipher[_-]?key|cipherkey)\s*[=:]\s*["\']?([a-zA-Z0-9_\-/+=]{20,})["\']?',
                ]
            },
            'email_credentials': {
                'risk': 'MEDIUM',
                'patterns': [
                    r'(?i)(smtp[_-]?password|email[_-]?password)\s*[=:]\s*["\']([^"\'\s]+)["\']',
                    r'(?i)(mail[_-]?password|mailgun[_-]?key)\s*[=:]\s*["\']([^"\'\s]+)["\']',
                ]
            },
            'third_party_keys': {
                'risk': 'MEDIUM',
                'patterns': [
                    r'(?i)(stripe[_-]?key|stripe[_-]?secret)\s*[=:]\s*["\']?([a-zA-Z0-9_\-]{20,})["\']?',
                    r'(?i)(twilio[_-]?sid|twilio[_-]?token)\s*[=:]\s*["\']?([a-zA-Z0-9_\-]{20,})["\']?',
                    r'(?i)(github[_-]?token|gh[_-]?token)\s*[=:]\s*["\']?([a-zA-Z0-9_\-]{20,})["\']?',
                    r'(?i)(slack[_-]?token|slack[_-]?webhook)\s*[=:]\s*["\']?([a-zA-Z0-9_\-/]{20,})["\']?',
                ]
            },
            'ip_addresses': {
                'risk': 'LOW',
                'patterns': [
                    r'\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b',
                ]
            },
            'email_addresses': {
                'risk': 'LOW',
                'patterns': [
                    r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b',
                ]
            },
            'urls_with_credentials': {
                'risk': 'HIGH',
                'patterns': [
                    r'https?://[^:\s]+:[^@\s]+@[^\s]+',  # URLs with username:password
                ]
            }
        }

        # Files and directories to exclude from scanning
        self.exclude_patterns = {
            'directories': [
                '.git', '__pycache__', 'node_modules', '.venv', 'venv',
                'dist', 'build', '.pytest_cache', 'htmlcov', 'logs',
                'key_backups', 'test-results', 'verification_reports'
            ],
            'files': [
                '*.pyc', '*.pyo', '*.log', '*.tmp', '*.cache',
                '*.min.js', '*.min.css', '*.map', '*.lock',
                'package-lock.json', 'yarn.lock', '*.egg-info'
            ],
            'extensions': [
                '.jpg', '.jpeg', '.png', '.gif', '.svg', '.ico',
                '.pdf', '.doc', '.docx', '.zip', '.tar', '.gz'
            ]
        }

        # Whitelist patterns (known safe values)
        self.whitelist_patterns = [
            r'password.*placeholder',
            r'password.*example',
            r'password.*\*+',
            r'password.*xxx+',
            r'localhost',
            r'127\.0\.0\.1',
            r'0\.0\.0\.0',
            r'example\.com',
            r'test@example\.com',
            r'user@example\.com',
            r'fonts\.googleapis\.com',
            r'fonts\.gstatic\.com',
            r'googleapis\.com',
            r'your_.*_password',
            r'your_.*_key',
            r'your_.*_secret',
        ]

    def should_exclude_file(self, file_path: Path) -> bool:
        """Check if file should be excluded from scanning."""
        # Check directory exclusions
        for part in file_path.parts:
            if part in self.exclude_patterns['directories']:
                return True

        # Check file extension exclusions
        if file_path.suffix.lower() in self.exclude_patterns['extensions']:
            return True

        # Check file pattern exclusions
        for pattern in self.exclude_patterns['files']:
            if file_path.match(pattern):
                return True

        return False

    def is_whitelisted(self, content: str, match: str) -> bool:
        """Check if the match is in the whitelist (known safe values)."""
        for pattern in self.whitelist_patterns:
            if re.search(pattern, content, re.IGNORECASE):
                return True
        return False

    def scan_file(self, file_path: Path) -> List[Dict]:
        """Scan a single file for credentials and sensitive information."""
        findings = []

        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
                lines = content.split('\n')

                for category, config in self.patterns.items():
                    for pattern in config['patterns']:
                        matches = re.finditer(pattern, content, re.MULTILINE | re.IGNORECASE)

                        for match in matches:
                            # Skip if whitelisted
                            if self.is_whitelisted(content, match.group(0)):
                                continue

                            # Find line number
                            line_num = content[:match.start()].count('\n') + 1
                            line_content = lines[line_num - 1].strip() if line_num <= len(lines) else ""

                            # Extract the sensitive value
                            sensitive_value = match.group(2) if match.groups() and len(match.groups()) >= 2 else match.group(0)

                            finding = {
                                'file': str(file_path.relative_to(self.project_root)),
                                'line': line_num,
                                'category': category,
                                'risk': config['risk'],
                                'pattern': pattern,
                                'match': match.group(0),
                                'sensitive_value': sensitive_value,
                                'line_content': line_content,
                                'hash': hashlib.md5(match.group(0).encode()).hexdigest()[:8]
                            }

                            findings.append(finding)

        except Exception as e:
            print(f"Error scanning {file_path}: {e}")

        return findings

    def scan_project(self) -> None:
        """Scan the entire project for credentials and sensitive information."""
        print(f"🔍 Scanning project: {self.project_root}")
        print(f"📁 Starting comprehensive credential scan...")

        # Get all files to scan
        all_files = []
        for root, dirs, files in os.walk(self.project_root):
            # Remove excluded directories from dirs list to prevent walking into them
            dirs[:] = [d for d in dirs if d not in self.exclude_patterns['directories']]

            for file in files:
                file_path = Path(root) / file
                if not self.should_exclude_file(file_path):
                    all_files.append(file_path)

        print(f"📊 Found {len(all_files)} files to scan")

        # Scan each file
        for file_path in all_files:
            self.stats['files_scanned'] += 1
            file_findings = self.scan_file(file_path)
            self.findings.extend(file_findings)

            if file_findings:
                print(f"⚠️  Found {len(file_findings)} issues in {file_path.relative_to(self.project_root)}")

        # Update statistics
        self.stats['total_findings'] = len(self.findings)
        for finding in self.findings:
            if finding['risk'] == 'HIGH':
                self.stats['high_risk'] += 1
            elif finding['risk'] == 'MEDIUM':
                self.stats['medium_risk'] += 1
            else:
                self.stats['low_risk'] += 1

    def generate_report(self, output_file: str = None) -> str:
        """Generate a comprehensive security report."""
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        report = f"""
# Healthcare IVR Platform - Credential Security Scan Report
Generated: {timestamp}
Project Root: {self.project_root}

## Executive Summary
- **Files Scanned**: {self.stats['files_scanned']}
- **Total Findings**: {self.stats['total_findings']}
- **High Risk**: {self.stats['high_risk']} 🔴
- **Medium Risk**: {self.stats['medium_risk']} 🟡
- **Low Risk**: {self.stats['low_risk']} 🟢

## Risk Assessment
"""

        if self.stats['high_risk'] > 0:
            report += "🚨 **CRITICAL**: High-risk credentials found! Immediate action required.\n"
        elif self.stats['medium_risk'] > 0:
            report += "⚠️ **WARNING**: Medium-risk items found. Review recommended.\n"
        elif self.stats['low_risk'] > 0:
            report += "ℹ️ **INFO**: Low-risk items found. Consider review.\n"
        else:
            report += "✅ **CLEAN**: No credential issues detected.\n"

        report += "\n## Detailed Findings\n"

        if not self.findings:
            report += "No security issues detected. ✅\n"
        else:
            # Group findings by risk level
            risk_groups = {'HIGH': [], 'MEDIUM': [], 'LOW': []}
            for finding in self.findings:
                risk_groups[finding['risk']].append(finding)

            for risk_level in ['HIGH', 'MEDIUM', 'LOW']:
                if risk_groups[risk_level]:
                    risk_emoji = {'HIGH': '🔴', 'MEDIUM': '🟡', 'LOW': '🟢'}[risk_level]
                    report += f"\n### {risk_emoji} {risk_level} Risk Issues ({len(risk_groups[risk_level])})\n"

                    for i, finding in enumerate(risk_groups[risk_level], 1):
                        report += f"""
#### {i}. {finding['category'].replace('_', ' ').title()}
- **File**: `{finding['file']}`
- **Line**: {finding['line']}
- **Pattern**: {finding['category']}
- **Match**: `{finding['match'][:100]}{'...' if len(finding['match']) > 100 else ''}`
- **Context**: `{finding['line_content'][:100]}{'...' if len(finding['line_content']) > 100 else ''}`
- **Hash**: {finding['hash']}
"""

        report += f"""
## Recommendations

### Immediate Actions (High Risk)
1. **Move all hard-coded credentials to environment variables**
2. **Update .env.example with placeholder values**
3. **Ensure .env files are in .gitignore**
4. **Rotate any exposed credentials**

### Security Best Practices
1. **Use environment variables for all sensitive configuration**
2. **Implement proper secret management (AWS Secrets Manager, etc.)**
3. **Regular credential rotation**
4. **Code review processes to catch credentials**
5. **Pre-commit hooks to prevent credential commits**

### Environment Variable Migration
For each finding, create corresponding environment variables:

```bash
# Example .env structure
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
JWT_SECRET=your-jwt-secret-here
API_KEY=your-api-key-here
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
```

### Code Updates Required
Replace hard-coded values with environment variable lookups:

```python
# Before (INSECURE)
password = "hardcoded_password"

# After (SECURE)
import os
password = os.getenv('DATABASE_PASSWORD')
```

## Scan Configuration
- **Patterns Checked**: {len([p for patterns in self.patterns.values() for p in patterns['patterns']])}
- **Excluded Directories**: {', '.join(self.exclude_patterns['directories'])}
- **Excluded Extensions**: {', '.join(self.exclude_patterns['extensions'])}

---
*This report was generated by the Healthcare IVR Platform Credential Scanner*
*For questions or issues, contact the security team*
"""

        # Save report if output file specified
        if output_file:
            with open(output_file, 'w') as f:
                f.write(report)
            print(f"📄 Report saved to: {output_file}")

        return report

    def generate_json_report(self, output_file: str) -> None:
        """Generate a JSON report for programmatic processing."""
        report_data = {
            'timestamp': datetime.now().isoformat(),
            'project_root': str(self.project_root),
            'statistics': self.stats,
            'findings': self.findings,
            'scan_config': {
                'patterns_count': len([p for patterns in self.patterns.values() for p in patterns['patterns']]),
                'excluded_directories': self.exclude_patterns['directories'],
                'excluded_extensions': self.exclude_patterns['extensions']
            }
        }

        with open(output_file, 'w') as f:
            json.dump(report_data, f, indent=2)

        print(f"📊 JSON report saved to: {output_file}")

def main():
    """Main function to run the credential scanner."""
    parser = argparse.ArgumentParser(description='Healthcare IVR Platform Credential Scanner')
    parser.add_argument('--project-root', '-p', default='.',
                       help='Project root directory to scan (default: current directory)')
    parser.add_argument('--output', '-o', default='credential_scan_report.md',
                       help='Output file for the report (default: credential_scan_report.md)')
    parser.add_argument('--json', '-j',
                       help='Also generate JSON report at specified path')
    parser.add_argument('--quiet', '-q', action='store_true',
                       help='Suppress progress output')

    args = parser.parse_args()

    # Initialize scanner
    scanner = CredentialScanner(args.project_root)

    if not args.quiet:
        print("🔐 Healthcare IVR Platform - Credential Scanner")
        print("=" * 50)

    # Run scan
    scanner.scan_project()

    # Generate reports
    report = scanner.generate_report(args.output)

    if args.json:
        scanner.generate_json_report(args.json)

    # Print summary
    if not args.quiet:
        print("\n" + "=" * 50)
        print("📋 SCAN COMPLETE")
        print(f"Files Scanned: {scanner.stats['files_scanned']}")
        print(f"Total Findings: {scanner.stats['total_findings']}")
        print(f"High Risk: {scanner.stats['high_risk']} 🔴")
        print(f"Medium Risk: {scanner.stats['medium_risk']} 🟡")
        print(f"Low Risk: {scanner.stats['low_risk']} 🟢")

        if scanner.stats['high_risk'] > 0:
            print("\n🚨 CRITICAL: High-risk credentials detected!")
            print("   Immediate action required to secure your application.")
        elif scanner.stats['total_findings'] > 0:
            print("\n⚠️  Security issues detected. Please review the report.")
        else:
            print("\n✅ No credential security issues detected!")

    # Return exit code based on findings
    return 1 if scanner.stats['high_risk'] > 0 else 0

if __name__ == '__main__':
    exit(main())