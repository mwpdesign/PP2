#!/bin/bash

# Set the Python path to include the backend directory
export PYTHONPATH=$PYTHONPATH:$(pwd)

# Run the Alembic migration
alembic revision --autogenerate -m "Add accessible_territories relationship to Role model" 