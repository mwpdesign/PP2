#!/bin/bash
echo "🚀 Starting Healthcare IVR Platform..."

# Start all Docker services EXCEPT frontend
docker-compose up -d db adminer localstack redis backend node-exporter postgres-exporter redis-exporter prometheus grafana

# Start local frontend
echo "Starting local frontend..."
cd frontend && npm run dev -- --port 0
