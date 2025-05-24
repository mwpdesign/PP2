#!/bin/bash

# Set up Python environment
export PYTHONPATH=$PYTHONPATH:backend

# Run system validation
echo "Running system integration validation..."
python backend/scripts/system_integration_validator.py "$@"

# Check exit code
if [ $? -eq 0 ]; then
    echo "Validation completed successfully"
    exit 0
else
    echo "Validation failed"
    exit 1
fi 