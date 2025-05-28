#!/bin/bash

# Set the Python path to include the backend directory
export PYTHONPATH=$PYTHONPATH:$(pwd)

# Run the Alembic migrations
alembic upgrade head 