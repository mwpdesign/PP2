#!/usr/bin/env python3

import os
import re
import json
from typing import List, Dict, Tuple

SENSITIVE_PATTERNS = [
    # PHI patterns
    r'\b\d{3}-\d{2}-\d{4}\b',  # SSN
    r'\b\d{9}\b',  # 9-digit numbers
    r'\b[A-Z]{2}\d{6}\b',  # Medical record numbers
    
    # API keys and secrets
    r'\b[A-Za-z0-9/+]{40}\b',  # AWS access keys
    r'\b[A-Za-z0-9/+=]{40,}\b',  # Base64 encoded secrets
    r'(?i)(api[_-]?key|secret)[_-]?[a-z0-9]{16,}',  # Generic API keys
    
    # Credentials
    r'(?i)(password|passwd|pwd)[\s]*[=:]\s*\S+',  # Passwords
    r'(?i)(username|user|uid)[\s]*[=:]\s*\S+',  # Usernames
    
    # Infrastructure
    r'\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b',  # IP addresses
    r'\b[A-Za-z0-9-]+\.(prod|staging|dev)\.[A-Za-z0-9-]+\.[a-z]+\b',  # Internal domains
]

EXCLUDED_PATTERNS = [
    r'example\.com',
    r'localhost',
    r'127\.0\.0\.1',
    r'0\.0\.0\.0',
]

def is_excluded(text: str) -> bool:
    """Check if the text matches any excluded patterns."""
    return any(re.search(pattern, text) for pattern in EXCLUDED_PATTERNS)

def check_file_content(
    file_path: str,
    patterns: List[str]
) -> List[Tuple[int, str, str]]:
    """Check file content for sensitive data patterns."""
    issues = []
    try:
        with open(file_path, 'r') as f:
            for i, line in enumerate(f, 1):
                for pattern in patterns:
                    matches = re.finditer(pattern, line)
                    for match in matches:
                        if not is_excluded(match.group()):
                            issues.append((
                                i,
                                pattern,
                                match.group()
                            ))
    except Exception as e:
        print(f"Error reading file {file_path}: {e}")
    return issues

def scan_directory(
    directory: str,
    patterns: List[str]
) -> Dict[str, List[Tuple[int, str, str]]]:
    """Recursively scan directory for sensitive data."""
    results = {}
    
    for root, _, files in os.walk(directory):
        for file in files:
            if file.endswith(('.md', '.txt')):
                file_path = os.path.join(root, file)
                issues = check_file_content(file_path, patterns)
                if issues:
                    results[file_path] = issues
    
    return results

def generate_report(results: Dict[str, List[Tuple[int, str, str]]]) -> None:
    """Generate a JSON report of sensitive data findings."""
    report = {
        'timestamp': os.environ.get('GITHUB_SHA', ''),
        'issues': []
    }
    
    for file_path, issues in results.items():
        for line_num, pattern, match in issues:
            report['issues'].append({
                'file': file_path,
                'line': line_num,
                'pattern_type': pattern,
                'sanitized_match': re.sub(r'\S', '*', match)
            })
    
    with open('sensitive-data-report.json', 'w') as f:
        json.dump(report, f, indent=2)

def main():
    print("Checking for sensitive data in documentation...")
    
    # Scan memory-bank and docs directories
    directories = ['memory-bank', 'docs']
    all_results = {}
    
    for directory in directories:
        if os.path.exists(directory):
            results = scan_directory(directory, SENSITIVE_PATTERNS)
            all_results.update(results)
    
    # Generate report
    generate_report(all_results)
    
    # Check for issues
    if all_results:
        print("\nSensitive data found!")
        for file_path, issues in all_results.items():
            print(f"\n{file_path}:")
            for line_num, pattern, _ in issues:
                print(f"- Line {line_num}: Matches pattern {pattern}")
        sys.exit(1)
    else:
        print("\nNo sensitive data found.")
        sys.exit(0)

if __name__ == '__main__':
    main() 