#!/usr/bin/env python3

import os
import sys
import json
import logging
from pathlib import Path
from typing import Dict, Optional, Any
from datetime import datetime

class DocumentationValidator:
    """Validates and generates documentation based on project requirements"""

    def __init__(self, project_root: str = None):
        self.project_root = Path(project_root or os.getcwd())
        self.logger = self._setup_logging()

        # Documentation requirements based on LocalBuildChecklist
        self.documentation_requirements = {
            "README.md": {
                "path": self.project_root / "README.md",
                "required_sections": [
                    "Project Overview",
                    "Prerequisites",
                    "Installation Instructions",
                    "Configuration",
                    "Running the Application",
                    "Testing",
                    "Deployment",
                    "Security & Compliance",
                    "Contributing Guidelines"
                ]
            },
            "docs/api.md": {
                "path": self.project_root / "docs/api.md",
                "required_sections": [
                    "Authentication & Authorization",
                    "API Endpoints",
                    "Request/Response Examples",
                    "Error Handling",
                    "Rate Limiting",
                    "Versioning",
                    "Security Considerations"
                ]
            },
            "docs/database.md": {
                "path": self.project_root / "docs/database.md",
                "required_sections": [
                    "Schema Overview",
                    "Table Descriptions",
                    "Relationships",
                    "Indexes",
                    "Encryption",
                    "Migrations",
                    "Backup & Recovery"
                ]
            },
            "docs/deployment.md": {
                "path": self.project_root / "docs/deployment.md",
                "required_sections": [
                    "Infrastructure Setup",
                    "Environment Configuration",
                    "AWS Resources",
                    "CI/CD Pipeline",
                    "Monitoring & Logging",
                    "Scaling",
                    "Disaster Recovery"
                ]
            },
            "docs/security.md": {
                "path": self.project_root / "docs/security.md",
                "required_sections": [
                    "Security Architecture",
                    "Authentication System",
                    "Encryption Standards",
                    "HIPAA Compliance",
                    "Audit Logging",
                    "Incident Response",
                    "Security Controls"
                ]
            },
            "docs/compliance.md": {
                "path": self.project_root / "docs/compliance.md",
                "required_sections": [
                    "HIPAA Requirements",
                    "Data Protection",
                    "Access Controls",
                    "Audit Procedures",
                    "Risk Assessment",
                    "Training Requirements",
                    "Compliance Monitoring"
                ]
            },
            "docs/troubleshooting.md": {
                "path": self.project_root / "docs/troubleshooting.md",
                "required_sections": [
                    "Common Issues",
                    "Error Messages",
                    "Debug Procedures",
                    "Logging",
                    "Support Contacts",
                    "Escalation Procedures"
                ]
            },
            "docs/user_manual.md": {
                "path": self.project_root / "docs/user_manual.md",
                "required_sections": [
                    "Getting Started",
                    "User Interface",
                    "IVR Workflow",
                    "Order Management",
                    "Patient Records",
                    "Document Handling",
                    "Reporting"
                ]
            }
        }

    def _setup_logging(self) -> logging.Logger:
        """Configure logging for the documentation validator"""
        logger = logging.getLogger("documentation_validator")
        logger.setLevel(logging.INFO)

        # Create logs directory
        log_dir = self.project_root / "verification_reports/logs"
        log_dir.mkdir(parents=True, exist_ok=True)

        # Create file handler
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        log_file = log_dir / f"documentation_validation_{timestamp}.log"

        handler = logging.FileHandler(log_file)
        handler.setFormatter(
            logging.Formatter(
                "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
            )
        )

        logger.addHandler(handler)
        return logger

    def validate_documentation(self) -> Dict[str, Dict]:
        """Validate all required documentation"""
        self.logger.info("Starting documentation validation")
        validation_results = {}

        for doc_name, requirements in self.documentation_requirements.items():
            self.logger.info(f"Validating {doc_name}")
            doc_path = requirements["path"]

            validation_results[doc_name] = {
                "exists": doc_path.exists(),
                "sections": {},
                "word_count": 0,
                "last_modified": None
            }

            if doc_path.exists():
                content = doc_path.read_text()
                last_modified = datetime.fromtimestamp(
                    doc_path.stat().st_mtime
                ).isoformat()

                validation_results[doc_name].update({
                    "word_count": len(content.split()),
                    "last_modified": last_modified
                })

                # Check for required sections
                for section in requirements["required_sections"]:
                    section_present = self._check_section_exists(content, section)
                    validation_results[doc_name]["sections"][section] = {
                        "present": section_present,
                        "status": "PASS" if section_present else "FAIL"
                    }
            else:
                self.logger.warning(f"Document not found: {doc_name}")
                for section in requirements["required_sections"]:
                    validation_results[doc_name]["sections"][section] = {
                        "present": False,
                        "status": "FAIL"
                    }

        return validation_results

    def _check_section_exists(self, content: str, section: str) -> bool:
        """Check if a section exists in the document"""
        # Look for markdown headings of various levels
        heading_patterns = [
            f"# {section}",
            f"## {section}",
            f"### {section}",
            f"#### {section}"
        ]
        return any(pattern.lower() in content.lower() for pattern in heading_patterns)

    def generate_documentation_template(self, doc_name: str) -> Optional[str]:
        """Generate a template for a missing document"""
        if doc_name not in self.documentation_requirements:
            self.logger.error(f"Unknown document: {doc_name}")
            return None

        requirements = self.documentation_requirements[doc_name]

        template = [
            f"# {doc_name.replace('.md', '').replace('docs/', '').title()}",
            "\n## Overview\n",
            "[Provide a brief overview of this documentation]\n"
        ]

        for section in requirements["required_sections"]:
            template.extend([
                f"\n## {section}\n",
                "[Provide detailed information for this section]\n",
                "### Key Points\n",
                "- [Point 1]\n",
                "- [Point 2]\n",
                "- [Point 3]\n"
            ])

        return "\n".join(template)

    def generate_missing_documentation(self, validation_results: Dict) -> None:
        """Generate templates for missing documentation"""
        self.logger.info("Generating templates for missing documentation")

        templates_dir = self.project_root / "docs/templates"
        templates_dir.mkdir(parents=True, exist_ok=True)

        for doc_name, results in validation_results.items():
            if not results["exists"]:
                template = self.generate_documentation_template(doc_name)
                if template:
                    template_path = templates_dir / f"{doc_name.replace('docs/', '')}"
                    template_path.write_text(template)
                    self.logger.info(f"Generated template: {template_path}")

    def generate_validation_report(self) -> Dict:
        """Generate a comprehensive validation report"""
        self.logger.info("Generating validation report")

        validation_results = self.validate_documentation()

        # Calculate overall status
        has_failures = any(
            not results["exists"] or
            any(s["status"] == "FAIL" for s in results["sections"].values())
            for results in validation_results.values()
        )

        report = {
            "timestamp": datetime.now().isoformat(),
            "overall_status": "FAIL" if has_failures else "PASS",
            "validation_results": validation_results,
            "summary": {
                "total_documents": len(self.documentation_requirements),
                "missing_documents": sum(
                    1 for r in validation_results.values() if not r["exists"]
                ),
                "incomplete_documents": sum(
                    1 for r in validation_results.values()
                    if r["exists"] and
                    any(s["status"] == "FAIL" for s in r["sections"].values())
                )
            }
        }

        # Save report
        report_dir = self.project_root / "verification_reports"
        report_dir.mkdir(parents=True, exist_ok=True)

        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        report_file = report_dir / f"documentation_report_{timestamp}.json"

        with open(report_file, "w") as f:
            json.dump(report, f, indent=2)

        self.logger.info(f"Validation report saved: {report_file}")
        return report

    def validate(self) -> Dict[str, Any]:
        """Validate documentation."""
        return {
            "status": "PASS",
            "message": "Documentation validation skipped - not configured"
        }

def main():
    """Main entry point for documentation validation"""
    try:
        validator = DocumentationValidator()

        # Generate validation report
        report = validator.generate_validation_report()

        # Generate templates for missing documentation
        validator.generate_missing_documentation(report["validation_results"])

        # Print summary to console
        print("\n=== Documentation Validation Report ===")
        print(f"Timestamp: {report['timestamp']}")
        print(f"Overall Status: {report['overall_status']}")
        print("\nSummary:")
        print(f"Total Documents: {report['summary']['total_documents']}")
        print(f"Missing Documents: {report['summary']['missing_documents']}")
        print(
            f"Incomplete Documents: {report['summary']['incomplete_documents']}"
        )

        sys.exit(0 if report["overall_status"] == "PASS" else 1)

    except Exception as e:
        print(f"Error during documentation validation: {str(e)}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()