#!/bin/bash

# Comprehensive Verification Script
# Runs all verification components for the Healthcare IVR Platform

set -e

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configuration
ENVIRONMENT=${1:-"prod"}
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
RESULTS_DIR="verification_results/${TIMESTAMP}"
FINDINGS_FILE="${RESULTS_DIR}/findings.json"
REMEDIATION_FILE="${RESULTS_DIR}/remediation_results.json"
REPORT_FILE="${RESULTS_DIR}/comprehensive_report.json"

# Create results directory
mkdir -p "$RESULTS_DIR"

echo -e "${YELLOW}Starting comprehensive verification for $ENVIRONMENT...${NC}"

# Function to run a verification component
run_verification() {
    local component=$1
    local script=$2
    local output_file="${RESULTS_DIR}/${component}_results.json"
    
    echo -e "\n${YELLOW}Running $component verification...${NC}"
    
    if python "$script" --environment "$ENVIRONMENT" --output "$output_file"; then
        echo -e "${GREEN}✓ $component verification passed${NC}"
        return 0
    else
        echo -e "${RED}✗ $component verification failed${NC}"
        return 1
    fi
}

# Run all verification components
declare -A results

# DevOps Verification
run_verification "devops" "backend/scripts/verify_devops.py"
results["devops"]=$?

# HIPAA Compliance Check
run_verification "compliance" "backend/scripts/compliance_checker.py"
results["compliance"]=$?

# Security Validation
run_verification "security" "backend/scripts/security_validator.py"
results["security"]=$?

# Combine verification findings
echo -e "\n${YELLOW}Combining verification findings...${NC}"
jq -s '
    reduce .[] as $item (
        {
            "timestamp": now | todate,
            "environment": env.ENVIRONMENT,
            "findings": [],
            "total_checks": 0,
            "passed_checks": 0,
            "failed_checks": 0
        };
        .findings += $item.findings |
        .total_checks += $item.total_checks |
        .passed_checks += $item.passed_checks |
        .failed_checks += $item.failed_checks
    )
' "${RESULTS_DIR}"/*_results.json > "$FINDINGS_FILE"

# Run automated remediation
echo -e "\n${YELLOW}Running automated remediation...${NC}"
if python "backend/scripts/remediation_engine.py" \
    --environment "$ENVIRONMENT" \
    --input "$FINDINGS_FILE" \
    --output "$REMEDIATION_FILE"; then
    echo -e "${GREEN}✓ Automated remediation completed${NC}"
    results["remediation"]=0
else
    echo -e "${RED}✗ Automated remediation failed${NC}"
    results["remediation"]=1
fi

# Generate comprehensive report
echo -e "\n${YELLOW}Generating comprehensive report...${NC}"
if python "backend/scripts/compliance_reporting.py" \
    --verification-results "$FINDINGS_FILE" \
    --remediation-results "$REMEDIATION_FILE" \
    --output "$REPORT_FILE"; then
    echo -e "${GREEN}✓ Report generation completed${NC}"
    results["reporting"]=0
else
    echo -e "${RED}✗ Report generation failed${NC}"
    results["reporting"]=1
fi

# Print summary
echo -e "\n${YELLOW}Verification Summary:${NC}"
echo "Timestamp: $(date)"
echo "Environment: $ENVIRONMENT"
echo "Results Directory: $RESULTS_DIR"

# Calculate overall status
FAILED_COMPONENTS=0
for component in "${!results[@]}"; do
    if [ ${results[$component]} -ne 0 ]; then
        FAILED_COMPONENTS=$((FAILED_COMPONENTS + 1))
        echo -e "${RED}✗ $component: FAILED${NC}"
    else
        echo -e "${GREEN}✓ $component: PASSED${NC}"
    fi
done

if [ $FAILED_COMPONENTS -eq 0 ]; then
    echo -e "\n${GREEN}All verifications passed successfully${NC}"
    echo -e "Comprehensive report: $REPORT_FILE"
    
    # Display key metrics from report
    echo -e "\nKey Metrics:"
    jq -r '
        "Overall Status: \(.overall_status)\n" +
        "Risk Level: \(.summary.risk_level)\n" +
        "Total Findings: \(.summary.verification.total_checks)\n" +
        "Remediated Issues: \(.summary.remediation.remediated)\n" +
        "Pending Actions: \(.summary.remediation.pending)"
    ' "$REPORT_FILE"
    
    exit 0
else
    echo -e "\n${RED}$FAILED_COMPONENTS component(s) failed verification${NC}"
    echo -e "Check detailed report: $REPORT_FILE"
    
    # Display critical findings
    echo -e "\nCritical Findings:"
    jq -r '.recommendations[] | select(.priority=="HIGH") | "- \(.description)"' "$REPORT_FILE"
    
    exit 1
fi 