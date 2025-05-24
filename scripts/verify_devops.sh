#!/bin/bash

# DevOps Verification Script
# Runs comprehensive verification of the Healthcare IVR Platform

set -e

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configuration
ENVIRONMENTS=("dev" "staging" "prod")
RESULTS_DIR="verification_results"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Create results directory
mkdir -p "$RESULTS_DIR"

echo -e "${YELLOW}Starting comprehensive DevOps verification...${NC}"

# Function to run verification for an environment
run_verification() {
    local env=$1
    local output_file="$RESULTS_DIR/${env}_verification_${TIMESTAMP}.json"
    
    echo -e "\n${YELLOW}Verifying $env environment...${NC}"
    
    # Run Python verification script
    if python backend/scripts/verify_devops.py --environment "$env" --output "$output_file"; then
        echo -e "${GREEN}✓ $env verification completed successfully${NC}"
        echo -e "  Results saved to: $output_file"
    else
        echo -e "${RED}✗ $env verification failed${NC}"
        echo -e "  Check logs at: $output_file"
        return 1
    fi
}

# Run verification for each environment
failed_envs=()
for env in "${ENVIRONMENTS[@]}"; do
    if ! run_verification "$env"; then
        failed_envs+=("$env")
    fi
done

# Generate summary
echo -e "\n${YELLOW}Verification Summary:${NC}"
echo "Timestamp: $(date)"
echo "Results Directory: $RESULTS_DIR"

if [ ${#failed_envs[@]} -eq 0 ]; then
    echo -e "${GREEN}All environments verified successfully${NC}"
else
    echo -e "${RED}Failed environments: ${failed_envs[*]}${NC}"
    exit 1
fi

# Additional checks
echo -e "\n${YELLOW}Running additional verifications...${NC}"

# Check GitHub Actions workflows
echo "Checking CI/CD workflows..."
gh workflow list

# Verify Terraform configurations
echo -e "\nValidating Terraform configurations..."
for env in "${ENVIRONMENTS[@]}"; do
    echo "Environment: $env"
    terraform -chdir=infrastructure/$env init -backend=false
    terraform -chdir=infrastructure/$env validate
done

# Check AWS backup status
echo -e "\nVerifying AWS backup status..."
aws backup list-backup-jobs --by-state COMPLETED --max-results 10

# Verify monitoring
echo -e "\nChecking CloudWatch dashboards..."
aws cloudwatch list-dashboards

echo -e "\n${GREEN}Comprehensive verification completed${NC}" 