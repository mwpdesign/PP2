#!/usr/bin/env python3

import os
import sys
import json
from typing import List, Dict

REQUIRED_FILES = [
    'projectbrief.md',
    'productContext.md',
    'systemPatterns.md',
    'techContext.md',
    'activeContext.md',
    'progress.md'
]

REQUIRED_SECTIONS = {
    'projectbrief.md': [
        '# Healthcare IVR Platform - Project Brief',
        '## Project Overview',
        '## Core Requirements',
        '## Project Goals',
        '## Success Metrics'
    ],
    'productContext.md': [
        '# Healthcare IVR Platform - Product Context',
        '## Problem Statement',
        '## Solution',
        '## User Experience Goals',
        '## Key Benefits'
    ],
    'systemPatterns.md': [
        '# Healthcare IVR Platform - System Patterns',
        '## Architecture Overview',
        '## Key Technical Patterns',
        '## Design Decisions'
    ],
    'techContext.md': [
        '# Healthcare IVR Platform - Technical Context',
        '## Technology Stack',
        '## Development Setup',
        '## Technical Constraints',
        '## Dependencies'
    ],
    'activeContext.md': [
        '# Healthcare IVR Platform - Active Context',
        '## Current Phase',
        '## Recent Changes',
        '## Active Decisions',
        '## Next Steps'
    ],
    'progress.md': [
        '# Healthcare IVR Platform - Progress Tracking',
        '## Completed Features',
        '## In Progress Features',
        '## Pending Features',
        '## Known Issues'
    ]
}

def check_file_exists(file_path: str) -> bool:
    """Check if a required file exists."""
    return os.path.exists(file_path)

def check_file_sections(file_path: str, required_sections: List[str]) -> List[str]:
    """Check if a file contains all required sections."""
    missing_sections = []
    try:
        with open(file_path, 'r') as f:
            content = f.read()
            for section in required_sections:
                if section not in content:
                    missing_sections.append(section)
    except Exception as e:
        print(f"Error reading file {file_path}: {e}")
        missing_sections = required_sections
    return missing_sections

def validate_memory_bank() -> Dict:
    """Validate the Memory Bank structure and content."""
    issues = {
        'missing_files': [],
        'missing_sections': {},
        'recommendations': []
    }
    
    # Check memory-bank directory exists
    if not os.path.exists('memory-bank'):
        print("Error: memory-bank directory not found")
        sys.exit(1)
    
    # Check required files
    for file_name in REQUIRED_FILES:
        file_path = os.path.join('memory-bank', file_name)
        if not check_file_exists(file_path):
            issues['missing_files'].append(file_name)
        else:
            missing_sections = check_file_sections(
                file_path,
                REQUIRED_SECTIONS[file_name]
            )
            if missing_sections:
                issues['missing_sections'][file_name] = missing_sections
    
    # Check additional context directories
    additional_dirs = ['api', 'testing', 'workflows', 'security']
    docs_dir = os.path.join('memory-bank', 'docs')
    if not os.path.exists(docs_dir):
        issues['recommendations'].append(
            "Create 'docs' directory for additional context"
        )
    else:
        for dir_name in additional_dirs:
            dir_path = os.path.join(docs_dir, dir_name)
            if not os.path.exists(dir_path):
                issues['recommendations'].append(
                    f"Consider adding '{dir_name}' documentation"
                )
    
    return issues

def generate_report(issues: Dict) -> None:
    """Generate a JSON report of validation issues."""
    with open('docs-report.json', 'w') as f:
        json.dump(issues, f, indent=2)

def main():
    print("Validating Memory Bank structure...")
    issues = validate_memory_bank()
    
    # Generate report
    generate_report(issues)
    
    # Check for critical issues
    if issues['missing_files'] or issues['missing_sections']:
        print("\nValidation failed!")
        if issues['missing_files']:
            print("\nMissing files:")
            for file_name in issues['missing_files']:
                print(f"- {file_name}")
        
        if issues['missing_sections']:
            print("\nMissing sections:")
            for file_name, sections in issues['missing_sections'].items():
                print(f"\n{file_name}:")
                for section in sections:
                    print(f"- {section}")
        
        sys.exit(1)
    else:
        print("\nValidation successful!")
        if issues['recommendations']:
            print("\nRecommendations:")
            for rec in issues['recommendations']:
                print(f"- {rec}")
        sys.exit(0)

if __name__ == '__main__':
    main() 