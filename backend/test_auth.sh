#!/bin/bash

# 🔐 Healthcare IVR Platform - One-Click Authentication Test
# ==========================================================
# 
# This script automatically tests the authentication system.
# Perfect for non-technical users!
#
# Usage: ./test_auth.sh

echo ""
echo "🔐 Healthcare IVR Platform - Authentication Test"
echo "=================================================="
echo "Starting automated authentication verification..."
echo ""

# Check if we're in the right directory
if [ ! -f "scripts/quick_auth_test.py" ]; then
    echo "❌ ERROR: Please run this script from the backend directory"
    echo "   cd backend && ./test_auth.sh"
    exit 1
fi

# Check if Python is available
if ! command -v python &> /dev/null; then
    echo "❌ ERROR: Python is not installed or not in PATH"
    echo "   Please install Python 3.7 or higher"
    exit 1
fi

# Check if httpx is installed, install if needed
echo "📦 Checking dependencies..."
python -c "import httpx" 2>/dev/null
if [ $? -ne 0 ]; then
    echo "📦 Installing required package 'httpx'..."
    pip install httpx
    if [ $? -ne 0 ]; then
        echo "❌ ERROR: Failed to install httpx"
        echo "   Please run: pip install httpx"
        exit 1
    fi
fi

echo "✅ Dependencies ready"
echo ""

# Run the authentication test
echo "🚀 Running authentication test..."
echo ""
python scripts/quick_auth_test.py

# Capture exit code
exit_code=$?

echo ""
if [ $exit_code -eq 0 ]; then
    echo "🎉 Authentication test completed successfully!"
    echo "   Your authentication system is working correctly."
else
    echo "⚠️  Authentication test failed."
    echo "   Please check the error messages above."
    echo ""
    echo "🔧 Common solutions:"
    echo "   1. Make sure the backend server is running:"
    echo "      python -m uvicorn app.main:app --reload"
    echo "   2. Create the admin user:"
    echo "      python scripts/seed_admin_user.py"
    echo "   3. Check database connection"
fi

echo ""
echo "=================================================="
echo "Test completed at $(date)"
echo "=================================================="

exit $exit_code 