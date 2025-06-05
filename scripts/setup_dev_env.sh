#!/bin/bash

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Print functions
print_header() {
    echo -e "\n${PURPLE}========================================${NC}"
    echo -e "${PURPLE}$1${NC}"
    echo -e "${PURPLE}========================================${NC}\n"
}

print_status() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_info() {
    echo -e "${BLUE}[ℹ]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[⚠]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

print_step() {
    echo -e "${CYAN}[→]${NC} $1"
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
check_prerequisites() {
    print_header "Checking Prerequisites"

    local missing_deps=()

    # Check Python 3.12+
    if command_exists python3; then
        local python_version=$(python3 --version | cut -d' ' -f2)
        local python_major=$(echo $python_version | cut -d'.' -f1)
        local python_minor=$(echo $python_version | cut -d'.' -f2)

        if [[ $python_major -eq 3 && $python_minor -ge 12 ]]; then
            print_status "Python $python_version found"
        else
            print_error "Python 3.12+ required, found $python_version"
            missing_deps+=("python3.12+")
        fi
    else
        print_error "Python 3 not found"
        missing_deps+=("python3.12+")
    fi

    # Check Node.js 18+
    if command_exists node; then
        local node_version=$(node --version | sed 's/v//')
        local node_major=$(echo $node_version | cut -d'.' -f1)

        if [[ $node_major -ge 18 ]]; then
            print_status "Node.js $node_version found"
        else
            print_error "Node.js 18+ required, found $node_version"
            missing_deps+=("nodejs18+")
        fi
    else
        print_error "Node.js not found"
        missing_deps+=("nodejs18+")
    fi

    # Check npm
    if command_exists npm; then
        local npm_version=$(npm --version)
        print_status "npm $npm_version found"
    else
        print_error "npm not found"
        missing_deps+=("npm")
    fi

    # Check PostgreSQL
    if command_exists psql; then
        local pg_version=$(psql --version | cut -d' ' -f3)
        print_status "PostgreSQL $pg_version found"
    else
        print_warning "PostgreSQL not found - will provide installation instructions"
        missing_deps+=("postgresql")
    fi

    # Check Git
    if command_exists git; then
        local git_version=$(git --version | cut -d' ' -f3)
        print_status "Git $git_version found"
    else
        print_error "Git not found"
        missing_deps+=("git")
    fi

    # Check pip
    if command_exists pip3; then
        print_status "pip3 found"
    else
        print_error "pip3 not found"
        missing_deps+=("pip3")
    fi

    # If missing dependencies, provide installation instructions
    if [[ ${#missing_deps[@]} -gt 0 ]]; then
        print_error "Missing dependencies: ${missing_deps[*]}"
        echo
        print_info "Installation instructions:"

        if [[ " ${missing_deps[*]} " =~ " python3.12+ " ]]; then
            echo "  • Python 3.12+:"
            echo "    - macOS: brew install python@3.12"
            echo "    - Ubuntu: sudo apt install python3.12 python3.12-venv python3.12-pip"
            echo "    - Windows: Download from https://python.org"
        fi

        if [[ " ${missing_deps[*]} " =~ " nodejs18+ " ]]; then
            echo "  • Node.js 18+:"
            echo "    - macOS: brew install node"
            echo "    - Ubuntu: curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash - && sudo apt-get install -y nodejs"
            echo "    - Windows: Download from https://nodejs.org"
        fi

        if [[ " ${missing_deps[*]} " =~ " postgresql " ]]; then
            echo "  • PostgreSQL:"
            echo "    - macOS: brew install postgresql && brew services start postgresql"
            echo "    - Ubuntu: sudo apt install postgresql postgresql-contrib"
            echo "    - Windows: Download from https://postgresql.org"
        fi

        if [[ " ${missing_deps[*]} " =~ " git " ]]; then
            echo "  • Git:"
            echo "    - macOS: brew install git"
            echo "    - Ubuntu: sudo apt install git"
            echo "    - Windows: Download from https://git-scm.com"
        fi

        echo
        print_error "Please install missing dependencies and run this script again."
        exit 1
    fi

    print_status "All prerequisites satisfied!"
}

# Setup environment variables
setup_environment() {
    print_header "Setting Up Environment Configuration"

    if [[ -f .env ]]; then
        print_warning ".env file already exists"
        read -p "Do you want to overwrite it? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_info "Keeping existing .env file"
            return
        fi
    fi

    print_step "Creating .env file from template..."

    # Generate secure keys
    local secret_key=$(python3 -c "import secrets; print(secrets.token_urlsafe(32))")
    local jwt_secret=$(python3 -c "import secrets; print(secrets.token_urlsafe(32))")
    local encryption_key=$(python3 -c "import base64, os; print(base64.urlsafe_b64encode(os.urandom(32)).decode())")
    local encryption_salt=$(python3 -c "import base64, os; print(base64.urlsafe_b64encode(os.urandom(16)).decode())")

    cat > .env <<EOL
# Healthcare IVR Platform - Development Environment
# Generated by setup_dev_env.sh on $(date)

# =============================================================================
# CORE APPLICATION SETTINGS
# =============================================================================
PROJECT_NAME=Healthcare IVR Platform
VERSION=1.0.0
API_V1_STR=/api/v1
DEBUG=true
ENVIRONMENT=development

# =============================================================================
# SECURITY CONFIGURATION
# =============================================================================
SECRET_KEY=${secret_key}
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=480

# Encryption keys (auto-generated)
ENCRYPTION_KEY=${encryption_key}
ENCRYPTION_SALT=${encryption_salt}
ENABLE_LOCAL_ENCRYPTION=true

# JWT Configuration
JWT_SECRET_KEY=${jwt_secret}
TOKEN_EXPIRY_MINUTES=60

# =============================================================================
# DATABASE CONFIGURATION
# =============================================================================
DATABASE_URL=postgresql+asyncpg://postgres:password@localhost:5432/healthcare_ivr

# Individual Database Components
DB_HOST=localhost
DB_PORT=5432
DB_NAME=healthcare_ivr
DB_USER=postgres
DB_PASSWORD=password

# =============================================================================
# AUTHENTICATION CONFIGURATION
# =============================================================================
# Development mode uses mock authentication
AUTH_MODE=local
USE_COGNITO=false

# =============================================================================
# CORS AND FRONTEND CONFIGURATION
# =============================================================================
# Development CORS origins
DEV_CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173,http://localhost:8000

# =============================================================================
# FEATURE FLAGS
# =============================================================================
ENABLE_MOCK_SERVICES=true
ENABLE_DEMO_MODE=true
ENABLE_EMAIL_NOTIFICATIONS=false
ENABLE_SMS_NOTIFICATIONS=false

# =============================================================================
# DEVELOPMENT SETTINGS
# =============================================================================
# Redis (optional for development)
REDIS_URL=redis://localhost:6379

# Logging
LOG_LEVEL=DEBUG
EOL

    print_status "Environment configuration created with secure auto-generated keys"
}

# Setup PostgreSQL database
setup_database() {
    print_header "Setting Up PostgreSQL Database"

    if ! command_exists psql; then
        print_warning "PostgreSQL not found. Please install PostgreSQL and run this script again."
        print_info "Installation commands:"
        echo "  • macOS: brew install postgresql && brew services start postgresql"
        echo "  • Ubuntu: sudo apt install postgresql postgresql-contrib"
        echo "  • Windows: Download from https://postgresql.org"
        return
    fi

    print_step "Checking PostgreSQL service..."

    # Try to connect to PostgreSQL
    if pg_isready -h localhost -p 5432 >/dev/null 2>&1; then
        print_status "PostgreSQL is running"
    else
        print_warning "PostgreSQL is not running. Attempting to start..."

        # Try to start PostgreSQL (macOS with Homebrew)
        if command_exists brew && brew services list | grep postgresql >/dev/null; then
            brew services start postgresql
            sleep 2
        fi

        # Check again
        if ! pg_isready -h localhost -p 5432 >/dev/null 2>&1; then
            print_error "Could not start PostgreSQL. Please start it manually:"
            echo "  • macOS: brew services start postgresql"
            echo "  • Ubuntu: sudo systemctl start postgresql"
            echo "  • Windows: Start PostgreSQL service"
            return
        fi
    fi

    print_step "Creating database..."

    # Create database if it doesn't exist
    if psql -h localhost -U postgres -lqt | cut -d \| -f 1 | grep -qw healthcare_ivr; then
        print_status "Database 'healthcare_ivr' already exists"
    else
        createdb -h localhost -U postgres healthcare_ivr 2>/dev/null || {
            print_warning "Could not create database with default postgres user"
            print_info "You may need to create the database manually:"
            echo "  createdb healthcare_ivr"
            echo "  or"
            echo "  sudo -u postgres createdb healthcare_ivr"
        }
    fi
}

# Setup Python backend
setup_backend() {
    print_header "Setting Up Python Backend"

    cd backend

    print_step "Creating Python virtual environment..."
    if [[ -d venv ]]; then
        print_warning "Virtual environment already exists"
        read -p "Do you want to recreate it? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            rm -rf venv
            python3 -m venv venv
        fi
    else
        python3 -m venv venv
    fi

    print_step "Activating virtual environment..."
    source venv/bin/activate

    print_step "Upgrading pip..."
    pip install --upgrade pip

    print_step "Installing Python dependencies..."
    pip install -r requirements.txt

    print_status "Backend setup completed"
    cd ..
}

# Setup React frontend
setup_frontend() {
    print_header "Setting Up React Frontend"

    cd frontend

    print_step "Installing Node.js dependencies..."
    npm install

    print_status "Frontend setup completed"
    cd ..
}

# Create startup scripts
create_startup_scripts() {
    print_header "Creating Development Startup Scripts"

    # Create start-local.sh if it doesn't exist
    if [[ ! -f start-local.sh ]]; then
        print_step "Creating start-local.sh..."
        cat > start-local.sh <<'EOL'
#!/bin/bash

echo "🚀 Starting Healthcare IVR Platform (Local Development)"
echo "======================================================="

# Function to kill processes on exit
cleanup() {
    echo "🛑 Shutting down servers..."
    pkill -f "uvicorn app.main:app"
    pkill -f "npm run dev"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Start backend
echo "🐍 Starting backend server..."
cd backend
export AUTH_MODE=local
export ENVIRONMENT=development
export DEBUG=true
source venv/bin/activate
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!
cd ..

# Wait for backend to start
echo "⏳ Waiting for backend to start..."
sleep 3

# Start frontend
echo "⚛️  Starting frontend server..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo "✅ Both servers started!"
echo "📱 Frontend: http://localhost:3000"
echo "🔧 Backend API: http://localhost:8000"
echo "📚 API Docs: http://localhost:8000/docs"
echo "❤️  Health Check: http://localhost:8000/health"
echo ""
echo "🔐 Test Credentials:"
echo "   Admin: admin@healthcare.local / admin123"
echo "   Doctor: doctor@healthcare.local / doctor123"
echo ""
echo "Press Ctrl+C to stop all servers"

# Wait for processes
wait $BACKEND_PID $FRONTEND_PID
EOL
        chmod +x start-local.sh
        print_status "Created start-local.sh"
    else
        print_info "start-local.sh already exists"
    fi
}

# Run database migrations
run_migrations() {
    print_header "Running Database Migrations"

    cd backend
    source venv/bin/activate

    print_step "Running Alembic migrations..."
    if [[ -f alembic.ini ]]; then
        alembic upgrade head || {
            print_warning "Migration failed - this is normal for first-time setup"
            print_info "Database will be initialized when the backend starts"
        }
    else
        print_info "No alembic.ini found - database will be auto-initialized"
    fi

    cd ..
}

# Verify installation
verify_installation() {
    print_header "Verifying Installation"

    local issues=()

    # Check .env file
    if [[ -f .env ]]; then
        print_status "Environment configuration exists"
    else
        issues+=("Missing .env file")
    fi

    # Check backend venv
    if [[ -d backend/venv ]]; then
        print_status "Backend virtual environment exists"
    else
        issues+=("Missing backend virtual environment")
    fi

    # Check frontend node_modules
    if [[ -d frontend/node_modules ]]; then
        print_status "Frontend dependencies installed"
    else
        issues+=("Missing frontend dependencies")
    fi

    # Check startup script
    if [[ -f start-local.sh ]]; then
        print_status "Startup script created"
    else
        issues+=("Missing startup script")
    fi

    if [[ ${#issues[@]} -eq 0 ]]; then
        print_status "All components verified successfully!"
        return 0
    else
        print_error "Issues found:"
        for issue in "${issues[@]}"; do
            echo "  • $issue"
        done
        return 1
    fi
}

# Main setup function
main() {
    print_header "Healthcare IVR Platform - Development Environment Setup"

    echo -e "${BLUE}This script will set up your local development environment with:${NC}"
    echo "  • Python virtual environment with all dependencies"
    echo "  • Node.js dependencies for React frontend"
    echo "  • PostgreSQL database configuration"
    echo "  • Environment variables with secure auto-generated keys"
    echo "  • Development startup scripts"
    echo

    read -p "Continue with setup? (Y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Nn]$ ]]; then
        print_info "Setup cancelled"
        exit 0
    fi

    # Run setup steps
    check_prerequisites
    setup_environment
    setup_database
    setup_backend
    setup_frontend
    create_startup_scripts
    run_migrations

    echo
    if verify_installation; then
        print_header "🎉 Setup Complete!"

        echo -e "${GREEN}Your development environment is ready!${NC}"
        echo
        echo -e "${CYAN}Next steps:${NC}"
        echo "  1. Start the development servers:"
        echo "     ${YELLOW}./start-local.sh${NC}"
        echo
        echo "  2. Open your browser to:"
        echo "     ${YELLOW}http://localhost:3000${NC}"
        echo
        echo "  3. Login with test credentials:"
        echo "     ${YELLOW}admin@healthcare.local / admin123${NC}"
        echo
        echo -e "${BLUE}Additional resources:${NC}"
        echo "  • API Documentation: http://localhost:8000/docs"
        echo "  • Health Check: http://localhost:8000/health"
        echo "  • Project Documentation: memory-bank/ directory"
        echo
        print_status "Happy coding! 🚀"
    else
        print_error "Setup completed with issues. Please review and fix the problems above."
        exit 1
    fi
}

# Run main function
main "$@"