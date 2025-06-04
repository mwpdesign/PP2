@echo off
REM 🔐 Healthcare IVR Platform - One-Click Authentication Test (Windows)
REM ====================================================================
REM 
REM This script automatically tests the authentication system on Windows.
REM Perfect for non-technical users!
REM
REM Usage: test_auth.bat

echo.
echo 🔐 Healthcare IVR Platform - Authentication Test
echo ==================================================
echo Starting automated authentication verification...
echo.

REM Check if we're in the right directory
if not exist "scripts\quick_auth_test.py" (
    echo ❌ ERROR: Please run this script from the backend directory
    echo    cd backend ^&^& test_auth.bat
    pause
    exit /b 1
)

REM Check if Python is available
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ ERROR: Python is not installed or not in PATH
    echo    Please install Python 3.7 or higher
    pause
    exit /b 1
)

REM Check if httpx is installed, install if needed
echo 📦 Checking dependencies...
python -c "import httpx" >nul 2>&1
if errorlevel 1 (
    echo 📦 Installing required package 'httpx'...
    pip install httpx
    if errorlevel 1 (
        echo ❌ ERROR: Failed to install httpx
        echo    Please run: pip install httpx
        pause
        exit /b 1
    )
)

echo ✅ Dependencies ready
echo.

REM Run the authentication test
echo 🚀 Running authentication test...
echo.
python scripts\quick_auth_test.py

REM Check exit code
if errorlevel 1 (
    echo.
    echo ⚠️  Authentication test failed.
    echo    Please check the error messages above.
    echo.
    echo 🔧 Common solutions:
    echo    1. Make sure the backend server is running:
    echo       python -m uvicorn app.main:app --reload
    echo    2. Create the admin user:
    echo       python scripts\seed_admin_user.py
    echo    3. Check database connection
) else (
    echo.
    echo 🎉 Authentication test completed successfully!
    echo    Your authentication system is working correctly.
)

echo.
echo ==================================================
echo Test completed at %date% %time%
echo ==================================================
echo.
pause 