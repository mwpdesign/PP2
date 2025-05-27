#!/usr/bin/env python3
"""
Enhanced Compliance Reporting System for Healthcare IVR Platform.
Generates comprehensive compliance and security reports.
"""

import json
import logging
from datetime import datetime
from typing import Dict, List, Any

logger = logging.getLogger('compliance_reporting')


class ComplianceReportGenerator:
    """Generates comprehensive compliance and security reports."""

    def __init__(self, verification_results: Dict, remediation_results: Dict):
        """Initialize report generator."""
        self.verification_results = verification_results
        self.remediation_results = remediation_results
        self.timestamp = datetime.utcnow().isoformat()

    def generate_comprehensive_report(self) -> Dict:
        """Create detailed compliance and security report."""
        try:
            report = {
                'timestamp': self.timestamp,
                'overall_status': self._determine_overall_status(),
                'summary': self._generate_summary(),
                'compliance_details': self._analyze_compliance(),
                'security_posture': self._analyze_security(),
                'remediation_status': self._analyze_remediation(),
                'risk_assessment': self._assess_risk(),
                'recommendations': self._generate_recommendations()
            }

            return report

        except Exception as e:
            logger.error(f"Report generation failed: {str(e)}")
            return {
                'error': str(e),
                'timestamp': self.timestamp
            }

    def _determine_overall_status(self) -> str:
        """Calculate overall compliance status."""
        critical_findings = sum(
            1 for finding in self.verification_results.get('findings', [])
            if finding.get('severity') == 'HIGH'
        )

        if critical_findings > 0:
            return 'CRITICAL'
        elif self.verification_results.get('failed_checks', 0) > 0:
            return 'NON-COMPLIANT'
        else:
            return 'COMPLIANT'

    def _generate_summary(self) -> Dict:
        """Generate executive summary of findings."""
        return {
            'verification': {
                'total_checks': self.verification_results.get('total_checks', 0),
                'passed_checks': self.verification_results.get('passed_checks', 0),
                'failed_checks': self.verification_results.get('failed_checks', 0)
            },
            'remediation': {
                'total_findings': self.remediation_results.get('total_findings', 0),
                'remediated': self.remediation_results.get('remediated', 0),
                'failed': self.remediation_results.get('failed_remediation', 0),
                'pending': self.remediation_results.get('skipped', 0)
            },
            'risk_level': self._calculate_risk_level()
        }

    def _analyze_compliance(self) -> Dict:
        """Analyze compliance status across different domains."""
        domains = {
            'hipaa_compliance': self._check_hipaa_compliance(),
            'security_controls': self._check_security_controls(),
            'access_management': self._check_access_management(),
            'data_protection': self._check_data_protection()
        }

        return {
            'domains': domains,
            'compliant_domains': sum(1 for d in domains.values() if d['status'] == 'COMPLIANT'),
            'non_compliant_domains': sum(1 for d in domains.values() if d['status'] != 'COMPLIANT')
        }

    def _check_hipaa_compliance(self) -> Dict:
        """Check HIPAA compliance requirements."""
        findings = self.verification_results.get('findings', [])
        hipaa_findings = [f for f in findings if f.get('category') == 'HIPAA']

        return {
            'status': 'COMPLIANT' if not hipaa_findings else 'NON-COMPLIANT',
            'findings': len(hipaa_findings),
            'details': [f.get('description') for f in hipaa_findings]
        }

    def _check_security_controls(self) -> Dict:
        """Analyze security control effectiveness."""
        controls = self.verification_results.get('security_controls', {})
        failed_controls = [
            control for control in controls.items()
            if not control[1].get('compliant', False)
        ]

        return {
            'status': 'COMPLIANT' if not failed_controls else 'NON-COMPLIANT',
            'total_controls': len(controls),
            'failed_controls': len(failed_controls),
            'details': failed_controls
        }

    def _check_access_management(self) -> Dict:
        """Evaluate access management compliance."""
        access_findings = [
            f for f in self.verification_results.get('findings', [])
            if f.get('category') in ['IAM', 'AUTHENTICATION', 'AUTHORIZATION']
        ]

        return {
            'status': 'COMPLIANT' if not access_findings else 'NON-COMPLIANT',
            'findings': len(access_findings),
            'details': [f.get('description') for f in access_findings]
        }

    def _check_data_protection(self) -> Dict:
        """Assess data protection measures."""
        data_findings = [
            f for f in self.verification_results.get('findings', [])
            if f.get('category') in ['ENCRYPTION', 'DATA_SECURITY']
        ]

        return {
            'status': 'COMPLIANT' if not data_findings else 'NON-COMPLIANT',
            'findings': len(data_findings),
            'details': [f.get('description') for f in data_findings]
        }

    def _analyze_security(self) -> Dict:
        """Analyze overall security posture."""
        return {
            'threat_level': self._calculate_threat_level(),
            'vulnerabilities': self._analyze_vulnerabilities(),
            'security_controls': self._analyze_security_controls(),
            'incident_readiness': self._assess_incident_readiness()
        }

    def _calculate_threat_level(self) -> str:
        """Calculate current threat level."""
        high_severity = sum(
            1 for f in self.verification_results.get('findings', [])
            if f.get('severity') == 'HIGH'
        )

        if high_severity > 5:
            return 'CRITICAL'
        elif high_severity > 0:
            return 'HIGH'
        elif self.verification_results.get('failed_checks', 0) > 0:
            return 'MEDIUM'
        else:
            return 'LOW'

    def _analyze_vulnerabilities(self) -> Dict:
        """Analyze detected vulnerabilities."""
        findings = self.verification_results.get('findings', [])

        return {
            'total': len(findings),
            'by_severity': {
                'high': sum(1 for f in findings if f.get('severity') == 'HIGH'),
                'medium': sum(1 for f in findings if f.get('severity') == 'MEDIUM'),
                'low': sum(1 for f in findings if f.get('severity') == 'LOW')
            },
            'by_category': self._group_by_category(findings)
        }

    def _analyze_security_controls(self) -> Dict:
        """Analyze security control effectiveness."""
        controls = self.verification_results.get('security_controls', {})

        return {
            'total_controls': len(controls),
            'effective_controls': sum(
                1 for c in controls.values()
                if c.get('status') == 'EFFECTIVE'
            ),
            'ineffective_controls': sum(
                1 for c in controls.values()
                if c.get('status') == 'INEFFECTIVE'
            ),
            'not_implemented': sum(
                1 for c in controls.values()
                if c.get('status') == 'NOT_IMPLEMENTED'
            )
        }

    def _assess_incident_readiness(self) -> Dict:
        """Assess incident response readiness."""
        readiness_checks = self.verification_results.get('incident_readiness', {})

        return {
            'overall_status': readiness_checks.get('status', 'UNKNOWN'),
            'monitoring_status': readiness_checks.get('monitoring', 'UNKNOWN'),
            'alerting_status': readiness_checks.get('alerting', 'UNKNOWN'),
            'response_plans': readiness_checks.get('response_plans', 'UNKNOWN')
        }

    def _analyze_remediation(self) -> Dict:
        """Analyze remediation effectiveness."""
        return {
            'success_rate': self._calculate_remediation_rate(),
            'automated_actions': self._summarize_automated_actions(),
            'manual_actions': self._summarize_manual_actions(),
            'pending_items': self._analyze_pending_items()
        }

    def _calculate_remediation_rate(self) -> float:
        """Calculate remediation success rate."""
        total = self.remediation_results.get('total_findings', 0)
        if total == 0:
            return 100.0

        remediated = self.remediation_results.get('remediated', 0)
        return (remediated / total) * 100

    def _summarize_automated_actions(self) -> Dict:
        """Summarize automated remediation actions."""
        actions = self.remediation_results.get('actions', [])

        return {
            'total': len(actions),
            'successful': sum(1 for a in actions if a.get('status') == 'SUCCESS'),
            'failed': sum(1 for a in actions if a.get('status') == 'FAILED'),
            'by_type': self._group_by_type(actions)
        }

    def _summarize_manual_actions(self) -> Dict:
        """Summarize manual remediation actions."""
        manual_items = self.remediation_results.get('recommendations', [])

        return {
            'total': len(manual_items),
            'by_type': self._group_by_type(manual_items),
            'priority_items': [
                item for item in manual_items
                if item.get('priority') == 'HIGH'
            ]
        }

    def _analyze_pending_items(self) -> Dict:
        """Analyze pending remediation items."""
        pending = self.remediation_results.get('recommendations', [])

        return {
            'total': len(pending),
            'by_priority': {
                'high': sum(1 for p in pending if p.get('priority') == 'HIGH'),
                'medium': sum(1 for p in pending if p.get('priority') == 'MEDIUM'),
                'low': sum(1 for p in pending if p.get('priority') == 'LOW')
            },
            'estimated_effort': self._estimate_remediation_effort(pending)
        }

    def _assess_risk(self) -> Dict:
        """Perform comprehensive risk assessment."""
        return {
            'risk_score': self._calculate_risk_score(),
            'risk_factors': self._identify_risk_factors(),
            'risk_trends': self._analyze_risk_trends(),
            'mitigation_status': self._assess_mitigation_status()
        }

    def _calculate_risk_score(self) -> int:
        """Calculate overall risk score."""
        findings = self.verification_results.get('findings', [])

        severity_weights = {
            'HIGH': 5,
            'MEDIUM': 3,
            'LOW': 1
        }

        return sum(
            severity_weights.get(f.get('severity', 'LOW'), 1)
            for f in findings
        )

    def _identify_risk_factors(self) -> List[Dict]:
        """Identify key risk factors."""
        findings = self.verification_results.get('findings', [])

        return [
            {
                'type': f.get('type'),
                'severity': f.get('severity'),
                'impact': f.get('impact'),
                'likelihood': f.get('likelihood')
            }
            for f in findings
            if f.get('severity') in ['HIGH', 'MEDIUM']
        ]

    def _generate_recommendations(self) -> List[Dict]:
        """Generate prioritized recommendations."""
        findings = self.verification_results.get('findings', [])
        manual_items = self.remediation_results.get('recommendations', [])

        recommendations = []

        # Add high-priority findings
        for finding in findings:
            if finding.get('severity') == 'HIGH':
                recommendations.append({
                    'priority': 'HIGH',
                    'type': finding.get('type'),
                    'description': finding.get('description'),
                    'remediation_steps': self._get_remediation_steps(finding)
                })

        # Add manual remediation items
        for item in manual_items:
            if item.get('type') == 'MANUAL_REVIEW':
                recommendations.append({
                    'priority': 'MEDIUM',
                    'type': item.get('finding_type'),
                    'description': item.get('description'),
                    'manual_steps': item.get('manual_steps', [])
                })

        return sorted(
            recommendations,
            key=lambda x: 0 if x['priority'] == 'HIGH' else 1
        )

    def _get_remediation_steps(self, finding: Dict) -> List[str]:
        """Get remediation steps for a finding."""
        remediation_steps = {
            'SECURITY_GROUP_OPEN': [
                "Review and restrict security group rules",
                "Implement least-privilege access",
                "Document required access patterns"
            ],
            'IAM_POLICY_OVERPRIVILEGED': [
                "Audit IAM policies and roles",
                "Remove unnecessary permissions",
                "Implement role-based access control"
            ],
            'ENCRYPTION_DISABLED': [
                "Enable encryption for sensitive data",
                "Rotate encryption keys regularly",
                "Monitor encryption status"
            ]
        }

        return remediation_steps.get(
            finding.get('type'),
            ["Review finding and implement appropriate controls"]
        )

    @staticmethod
    def _group_by_category(items: List[Dict]) -> Dict:
        """Group items by category."""
        categories = {}
        for item in items:
            category = item.get('category', 'UNKNOWN')
            categories[category] = categories.get(category, 0) + 1
        return categories

    @staticmethod
    def _group_by_type(items: List[Dict]) -> Dict:
        """Group items by type."""
        types = {}
        for item in items:
            item_type = item.get('type', 'UNKNOWN')
            types[item_type] = types.get(item_type, 0) + 1
        return types

    @staticmethod
    def _estimate_remediation_effort(items: List[Dict]) -> str:
        """Estimate remediation effort."""
        total_items = len(items)
        high_priority = sum(1 for i in items if i.get('priority') == 'HIGH')

        if total_items > 20 or high_priority > 5:
            return 'HIGH'
        elif total_items > 10 or high_priority > 2:
            return 'MEDIUM'
        else:
            return 'LOW'


def main():
    """Main entry point for compliance reporting."""
    import argparse

    parser = argparse.ArgumentParser(
        description='Enhanced Compliance Reporting System'
    )
    parser.add_argument(
        '--verification-results',
        required=True,
        help='Verification results file'
    )
    parser.add_argument(
        '--remediation-results',
        required=True,
        help='Remediation results file'
    )
    parser.add_argument(
        '--output',
        help='Output report file'
    )
    args = parser.parse_args()

    # Configure logging
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )

    try:
        # Load results
        with open(args.verification_results, 'r') as f:
            verification_results = json.load(f)

        with open(args.remediation_results, 'r') as f:
            remediation_results = json.load(f)

        # Generate report
        generator = ComplianceReportGenerator(
            verification_results,
            remediation_results
        )
        report = generator.generate_comprehensive_report()

        # Save or print report
        if args.output:
            with open(args.output, 'w') as f:
                json.dump(report, f, indent=2)
        else:
            print(json.dumps(report, indent=2))

        # Print summary
        print("\nReport Summary:")
        print(f"Overall Status: {report['overall_status']}")
        print(f"Risk Level: {report['summary']['risk_level']}")
        print(f"Compliance Score: {report['risk_assessment']['risk_score']}")
        print(f"Total Recommendations: {len(report['recommendations'])}")

    except Exception as e:
        logger.error(f"Report generation failed: {e}")
        sys.exit(1)


if __name__ == '__main__':
    main()