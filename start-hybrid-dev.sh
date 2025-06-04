#!/bin/bash
echo "Starting ALL backend services in Docker..."
docker-compose up -d
echo "Stopping frontend container (we'll run it locally)..."
docker-compose stop frontend
echo "Starting local frontend development server..."
cd frontend
npm run dev -- --port 0
