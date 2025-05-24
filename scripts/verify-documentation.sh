#!/bin/bash

# Exit on any error
set -e

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "=== Healthcare IVR Platform Documentation Verification ==="
echo "Starting verification at $(date)"

# Check if virtual environment exists
if [ ! -d "backend/venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv backend/venv
fi

# Activate virtual environment
source backend/venv/bin/activate

# Install verification requirements
echo "Installing verification requirements..."
pip install -r backend/scripts/requirements-verify.txt

# Run documentation validation
echo -e "\n${GREEN}Running documentation validation...${NC}"
python backend/scripts/documentation_validator.py

# Check exit status
if [ $? -eq 0 ]; then
    echo -e "\n${GREEN}Documentation validation completed successfully!${NC}"
    echo -e "Check verification_reports/ for detailed results."
    echo -e "Check docs/templates/ for any generated documentation templates."
    exit 0
else
    echo -e "\n${RED}Documentation validation failed. Please check the logs for details.${NC}"
    echo -e "Review verification_reports/ for the validation report."
    echo -e "Check docs/templates/ for missing documentation templates."
    exit 1
fi 