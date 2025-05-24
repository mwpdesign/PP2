#!/bin/bash

# Run Predictive System Optimizer for Healthcare IVR Platform

# Exit on any error
set -e

# Default report path
REPORT="verification_reports/latest_report.json"

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --report)
      REPORT="$2"
      shift 2
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

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

# Check if report exists
if [ ! -f "$REPORT" ]; then
  echo "Error: Report file not found: $REPORT"
  exit 1
fi

# Run system optimization
echo "Running predictive system optimization..."
python backend/scripts/predictive_system_optimizer.py --report "$REPORT"

# Check exit status
STATUS=$?

# Deactivate virtual environment
deactivate

# Print results location
if [ $STATUS -eq 0 ]; then
  echo "Optimization completed successfully!"
  echo "Check optimization_reports/ for detailed results"
else
  echo "Optimization failed!"
  echo "Check optimization_reports/ for error details"
fi

exit $STATUS 