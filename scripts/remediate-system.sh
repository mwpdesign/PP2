#!/bin/bash

# Exit on any error
set -e

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "=== Healthcare IVR Platform Intelligent Remediation ==="
echo "Starting remediation at $(date)"

# Check if virtual environment exists
if [ ! -d "backend/venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv backend/venv
fi

# Activate virtual environment
source backend/venv/bin/activate

# Install remediation requirements
echo "Installing remediation requirements..."
pip install -r backend/scripts/requirements-verify.txt
pip install cryptography boto3 psycopg2-binary

# Run system verification first
echo -e "\n${GREEN}Running system verification...${NC}"
python backend/scripts/final_system_verification.py

# Run intelligent remediation
echo -e "\n${GREEN}Running intelligent remediation...${NC}"
python backend/scripts/intelligent_remediation.py

# Check exit status
if [ $? -eq 0 ]; then
    echo -e "\n${GREEN}System remediation completed successfully!${NC}"
    echo -e "Check remediation_reports/ for detailed results."
    exit 0
else
    echo -e "\n${RED}System remediation failed. Please check the logs for details.${NC}"
    echo -e "Review remediation_reports/ for the validation report."
    exit 1
fi

# Deactivate virtual environment
deactivate 