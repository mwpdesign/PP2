#!/bin/bash

# Exit on any error
set -e

# Load environment variables
if [ -f .env ]; then
    source .env
fi

# Check if Python virtual environment exists
if [ ! -d "backend/venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv backend/venv
fi

# Activate virtual environment
source backend/venv/bin/activate

# Install verification requirements
pip install -r backend/scripts/requirements-verify.txt

# Run verification script
echo "Running system verification..."
python backend/scripts/advanced_system_verification.py
verification_status=$?

if [ $verification_status -ne 0 ]; then
    echo "System verification failed. Running remediation..."
    python backend/scripts/system_remediation.py
    remediation_status=$?
    
    if [ $remediation_status -ne 0 ]; then
        echo "Remediation failed. Manual intervention required."
        exit 1
    fi
    
    echo "Remediation complete. Running verification again..."
    python backend/scripts/advanced_system_verification.py
    final_status=$?
    
    if [ $final_status -ne 0 ]; then
        echo "System still has issues after remediation. Manual intervention required."
        exit 1
    fi
fi

echo "System health check complete."

# Deactivate virtual environment
deactivate 