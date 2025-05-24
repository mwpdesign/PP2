#!/bin/bash

# Exit on any error
set -e

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "=== Healthcare IVR Platform System Verification ==="
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

# Run system verification
echo -e "\n${GREEN}Running system verification...${NC}"
python backend/scripts/final_system_verification.py

# Check exit status
if [ $? -eq 0 ]; then
    echo -e "\n${GREEN}System verification completed successfully!${NC}"
    echo -e "Check verification_reports/ for detailed results."
    exit 0
else
    echo -e "\n${RED}System verification failed. Please check the logs for details.${NC}"
    echo -e "Review verification_reports/ for the validation report."
    exit 1
fi

# Deactivate virtual environment
deactivate 