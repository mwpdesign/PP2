# 🔐 Authentication Verification Guide

## Quick Start (One-Click Testing)

### For Mac/Linux Users:
```bash
cd backend
./test_auth.sh
```

### For Windows Users:
```cmd
cd backend
test_auth.bat
```

## What These Scripts Do

The authentication verification scripts test your Healthcare IVR Platform to make sure:

✅ **Backend Server** - The server is running and responding  
✅ **Admin Login** - You can log in with admin credentials  
✅ **Security Tokens** - JWT tokens are working correctly  
✅ **Protected Access** - Secure endpoints are properly protected  

## Script Options

### 🚀 Quick Test (`quick_auth_test.py`)
- **Best for**: Quick verification
- **Requirements**: Just Python and httpx
- **Output**: Simple, clear results
- **Usage**: `python scripts/quick_auth_test.py`

### 🔍 Detailed Test (`verify_auth.py`)
- **Best for**: Troubleshooting issues
- **Requirements**: Python, httpx, and colorama
- **Output**: Detailed, color-coded results
- **Usage**: `python scripts/verify_auth.py`

### 🎯 One-Click Scripts
- **`test_auth.sh`** (Mac/Linux): Handles everything automatically
- **`test_auth.bat`** (Windows): Handles everything automatically

## Understanding the Results

### ✅ Success Messages
- **Green checkmarks** = Everything is working
- **"ALL TESTS PASSED"** = Authentication system is ready

### ❌ Error Messages
- **Red X marks** = Something needs attention
- **Specific error codes** = Detailed problem information

## Common Issues & Solutions

### 🔧 "Cannot connect to backend server"
**Problem**: The backend isn't running  
**Solution**: Start the backend server
```bash
cd backend
python -m uvicorn app.main:app --reload
```

### 🔧 "Invalid credentials"
**Problem**: Admin user doesn't exist  
**Solution**: Create the admin user
```bash
python scripts/seed_admin_user.py
```

### 🔧 "Missing required package"
**Problem**: Python packages not installed  
**Solution**: Install required packages
```bash
pip install httpx colorama
```

### 🔧 "Database connection failed"
**Problem**: Database isn't set up  
**Solution**: Check database configuration
```bash
python scripts/test_db_connection.py
```

## Test Details

### What Each Test Checks

1. **Backend Connectivity**
   - Connects to `http://localhost:8000/test`
   - Verifies server is responding
   - Checks basic API functionality

2. **Admin Login**
   - Uses credentials: `admin@example.com` / `password123`
   - Tests `/api/v1/auth/login` endpoint
   - Verifies JWT token generation

3. **Token Validation**
   - Tests `/api/v1/auth/me` endpoint
   - Verifies token is valid and secure
   - Checks user information retrieval

4. **Protected Endpoint**
   - Tests `/api/v1/users/` endpoint
   - Verifies authorization is working
   - Checks database access permissions

## Troubleshooting Steps

### Step 1: Check Prerequisites
- [ ] Python 3.7+ is installed
- [ ] Backend directory exists
- [ ] Virtual environment is activated (if using one)

### Step 2: Verify Backend Setup
- [ ] Database is running (PostgreSQL/SQLite)
- [ ] Environment variables are set
- [ ] Dependencies are installed (`pip install -r requirements.txt`)

### Step 3: Start Services
- [ ] Start backend server: `python -m uvicorn app.main:app --reload`
- [ ] Verify server responds: Open `http://localhost:8000/test` in browser

### Step 4: Create Admin User
- [ ] Run: `python scripts/seed_admin_user.py`
- [ ] Verify no errors in output

### Step 5: Run Authentication Test
- [ ] Use one-click script: `./test_auth.sh` or `test_auth.bat`
- [ ] Or run directly: `python scripts/quick_auth_test.py`

## Advanced Usage

### Custom Configuration
You can modify the test scripts to use different:
- **Server URL**: Change `base_url` in the script
- **Credentials**: Update `admin_email` and `admin_password`
- **Endpoints**: Modify the test URLs

### Integration with CI/CD
The scripts return proper exit codes:
- **Exit 0**: All tests passed
- **Exit 1**: One or more tests failed

Example in a build script:
```bash
python scripts/quick_auth_test.py
if [ $? -eq 0 ]; then
    echo "Authentication tests passed, proceeding with deployment"
else
    echo "Authentication tests failed, stopping deployment"
    exit 1
fi
```

## Getting Help

### If Tests Keep Failing
1. **Check the logs**: Look for detailed error messages
2. **Verify environment**: Make sure all environment variables are set
3. **Test manually**: Try logging in through the web interface
4. **Check database**: Verify the database connection and admin user

### Contact Information
- Check project documentation in `/docs`
- Review implementation guide: `IMPLEMENTATION_GUIDE.md`
- Look for troubleshooting in project README

## Security Notes

⚠️ **Important**: These scripts use default credentials for testing:
- Email: `admin@example.com`
- Password: `password123`

🔒 **For Production**: Always change default credentials before deploying to production environments.

---

*Last updated: $(date)* 