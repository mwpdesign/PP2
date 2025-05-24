#!/bin/bash

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Print with color
print_status() {
    echo -e "${GREEN}[+]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

print_error() {
    echo -e "${RED}[-]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    # Check Python
    if ! command -v python3 &> /dev/null; then
        print_error "Python 3 is not installed. Please install Python 3 first."
        exit 1
    fi
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js first."
        exit 1
    fi
}

# Create necessary directories
create_directories() {
    print_status "Creating necessary directories..."
    
    mkdir -p infrastructure/prometheus
    mkdir -p infrastructure/grafana/provisioning
    mkdir -p infrastructure/localstack
    mkdir -p localstack
}

# Generate environment files
generate_env_files() {
    print_status "Generating environment files..."
    
    # Main .env file
    if [ ! -f .env ]; then
        cat > .env <<EOL
# Environment
ENVIRONMENT=development
DEBUG=true

# AWS Configuration (using LocalStack)
AWS_ACCESS_KEY_ID=dummy_key
AWS_SECRET_ACCESS_KEY=dummy_secret
AWS_REGION=us-east-1
AWS_S3_BUCKET=healthcare-ivr-local

# Database Configuration
DATABASE_URL=postgresql://postgres:password@localhost:5432/healthcare_ivr
REDIS_URL=redis://localhost:6379/0

# Security
SECRET_KEY=$(openssl rand -hex 32)
PHI_ENCRYPTION_KEY=$(openssl rand -hex 32)

# Feature Flags
ENABLE_MFA=true
ENABLE_AUDIT_LOGGING=true
ENABLE_PHI_ENCRYPTION=true

# Logging
LOG_LEVEL=DEBUG
EOL
        print_status "Created .env file"
    else
        print_warning ".env file already exists, skipping..."
    fi
}

# Setup Python virtual environment
setup_python_venv() {
    print_status "Setting up Python virtual environment..."
    
    cd backend
    python3 -m venv venv
    source venv/bin/activate
    pip install --upgrade pip
    pip install -r requirements.txt
    cd ..
}

# Setup frontend dependencies
setup_frontend() {
    print_status "Setting up frontend dependencies..."
    
    cd frontend
    npm ci
    cd ..
}

# Initialize LocalStack resources
setup_localstack() {
    print_status "Setting up LocalStack initialization scripts..."
    
    cat > localstack/init-aws.sh <<EOL
#!/bin/bash

# Create S3 bucket
awslocal s3 mb s3://healthcare-ivr-local

# Create KMS key
awslocal kms create-key --description "PHI Encryption Key"

# Create Cognito user pool
awslocal cognito-idp create-user-pool --pool-name healthcare-ivr-pool

# Create DynamoDB tables
awslocal dynamodb create-table \
    --table-name audit-logs \
    --attribute-definitions AttributeName=id,AttributeType=S \
    --key-schema AttributeName=id,KeyType=HASH \
    --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5
EOL

    chmod +x localstack/init-aws.sh
}

# Main setup process
main() {
    print_status "Starting development environment setup..."
    
    check_prerequisites
    create_directories
    generate_env_files
    setup_python_venv
    setup_frontend
    setup_localstack
    
    print_status "Development environment setup completed!"
    print_status "To start the application, run: docker-compose up --build"
}

main 