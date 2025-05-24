#!/bin/bash

# Kill any existing uvicorn processes
pkill -f uvicorn

# Set the Python path to include the backend directory
export PYTHONPATH=$PYTHONPATH:$(pwd)

# Start uvicorn with the correct module path
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 