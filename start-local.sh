#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}Healthcare IVR Platform - Local Development Launch${NC}\n"

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check prerequisites
check_prerequisites() {
    echo -e "${YELLOW}Checking prerequisites...${NC}"
    
    # Check Docker
    if ! command_exists docker; then
        echo -e "${RED}Error: Docker is not installed${NC}"
        exit 1
    fi
    echo -e "✓ Docker installed"
    
    # Check Python
    if ! command_exists python3; then
        echo -e "${RED}Error: Python 3 is not installed${NC}"
        exit 1
    fi
    python_version=$(python3 --version | cut -d' ' -f2)
    if [[ $(echo "$python_version 3.9" | tr " " "\n" | sort -V | head -n1) != "3.9" ]]; then
        echo -e "${RED}Error: Python version must be 3.9 or higher (found $python_version)${NC}"
        exit 1
    fi
    echo -e "✓ Python $python_version"
    
    # Check Node.js
    if ! command_exists node; then
        echo -e "${RED}Error: Node.js is not installed${NC}"
        exit 1
    fi
    node_version=$(node --version | cut -d'v' -f2)
    if [[ $(echo "$node_version 16.0" | tr " " "\n" | sort -V | head -n1) != "16.0" ]]; then
        echo -e "${RED}Error: Node.js version must be 16.0 or higher (found $node_version)${NC}"
        exit 1
    fi
    echo -e "✓ Node.js $node_version"
    
    # Check AWS CLI configuration
    if ! command_exists aws; then
        echo -e "${RED}Warning: AWS CLI is not installed${NC}"
    else
        if ! aws configure list &>/dev/null; then
            echo -e "${RED}Warning: AWS credentials not configured${NC}"
        else
            echo -e "✓ AWS CLI configured"
        fi
    fi
}

# Function to setup backend
setup_backend() {
    echo -e "\n${YELLOW}Setting up backend...${NC}"
    
    cd backend || exit 1
    
    # Create virtual environment if it doesn't exist
    if [ ! -d "venv" ]; then
        echo "Creating Python virtual environment..."
        python3 -m venv venv
    fi
    
    # Activate virtual environment
    source venv/bin/activate
    
    # Install dependencies
    echo "Installing backend dependencies..."
    pip install -r requirements.txt
    pip install -r requirements-test.txt
    
    # Check if .env exists, copy from example if not
    if [ ! -f ".env" ]; then
        if [ -f ".env.example" ]; then
            echo "Creating .env from .env.example..."
            cp .env.example .env
        else
            echo -e "${RED}Error: .env.example not found${NC}"
            exit 1
        fi
    fi
    
    # Run database migrations
    echo "Running database migrations..."
    alembic upgrade head
    
    cd ..
}

# Function to setup frontend
setup_frontend() {
    echo -e "\n${YELLOW}Setting up frontend...${NC}"
    
    cd frontend || exit 1
    
    # Install dependencies
    echo "Installing frontend dependencies..."
    npm install
    
    # Check if .env exists, copy from example if not
    if [ ! -f ".env" ]; then
        if [ -f ".env.example" ]; then
            echo "Creating .env from .env.example..."
            cp .env.example .env
        else
            echo -e "${RED}Error: .env.example not found${NC}"
            exit 1
        fi
    fi
    
    cd ..
}

# Function to start services
start_services() {
    echo -e "\n${YELLOW}Starting services...${NC}"
    
    # Start backend service
    cd backend || exit 1
    source venv/bin/activate
    echo "Starting backend service..."
    uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 &
    BACKEND_PID=$!
    cd ..
    
    # Start frontend service
    cd frontend || exit 1
    echo "Starting frontend service..."
    npm start &
    FRONTEND_PID=$!
    cd ..
    
    # Wait for services to be ready
    echo -e "\n${YELLOW}Waiting for services to start...${NC}"
    sleep 5
    
    # Check if services are running
    if ps -p $BACKEND_PID > /dev/null; then
        echo -e "✓ Backend service running at ${GREEN}http://localhost:8000${NC}"
    else
        echo -e "${RED}Error: Backend service failed to start${NC}"
    fi
    
    if ps -p $FRONTEND_PID > /dev/null; then
        echo -e "✓ Frontend service running at ${GREEN}http://localhost:3000${NC}"
    else
        echo -e "${RED}Error: Frontend service failed to start${NC}"
    fi
}

# Function to verify system
verify_system() {
    echo -e "\n${YELLOW}Verifying system...${NC}"
    
    # Check backend health
    echo "Checking backend health..."
    if curl -s http://localhost:8000/api/v1/health | grep -q "healthy"; then
        echo -e "✓ Backend health check passed"
    else
        echo -e "${RED}Error: Backend health check failed${NC}"
    fi
    
    # Check frontend accessibility
    echo "Checking frontend accessibility..."
    if curl -s http://localhost:3000 | grep -q "<!DOCTYPE html>"; then
        echo -e "✓ Frontend accessibility check passed"
    else
        echo -e "${RED}Error: Frontend accessibility check failed${NC}"
    fi
    
    # Run basic integration tests
    echo "Running basic integration tests..."
    cd backend || exit 1
    source venv/bin/activate
    pytest tests/integration/test_basic_integration.py -v
    cd ..
}

# Main execution
check_prerequisites
setup_backend
setup_frontend
start_services
verify_system

echo -e "\n${GREEN}Healthcare IVR Platform is ready for development!${NC}"
echo -e "Backend URL: http://localhost:8000"
echo -e "Frontend URL: http://localhost:3000"
echo -e "API Documentation: http://localhost:8000/docs"

# Trap Ctrl+C and cleanup
trap 'kill $BACKEND_PID $FRONTEND_PID; exit' INT
wait 