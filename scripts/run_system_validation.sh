#!/bin/bash

# Run System Integration Validation for Healthcare IVR Platform

# Exit on any error
set -e

# Default environment
ENV="dev"

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --env)
      ENV="$2"
      shift 2
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

# Validate environment value
if [[ ! "$ENV" =~ ^(dev|staging|prod)$ ]]; then
  echo "Invalid environment. Must be one of: dev, staging, prod"
  exit 1
fi

# Ensure we're in the project root
cd "$(dirname "$0")/.."

# Check if virtual environment exists
if [ ! -d "backend/venv" ]; then
  echo "Creating Python virtual environment..."
  python3 -m venv backend/venv
fi

# Activate virtual environment
source backend/venv/bin/activate

# Install dependencies if needed
if [ ! -f "backend/venv/installed" ]; then
  echo "Installing Python dependencies..."
  pip install -r requirements.txt
  touch backend/venv/installed
fi

# Run system validation
echo "Running system validation for $ENV environment..."
python backend/scripts/system_integration_validator.py --environment "$ENV"

# Check exit status
STATUS=$?

# Deactivate virtual environment
deactivate

# Print results location
if [ $STATUS -eq 0 ]; then
  echo "Validation completed successfully!"
  echo "Check verification_reports/ for detailed results"
else
  echo "Validation failed!"
  echo "Check verification_reports/ for error details"
fi

exit $STATUS 