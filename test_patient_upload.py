#!/usr/bin/env python3
"""
Comprehensive test script for Healthcare IVR Platform
Tests patient registration and document upload functionality
"""

import requests
import sys
from io import BytesIO
from PIL import Image
import time

# Configuration
BASE_URL = "http://localhost:8000"
FRONTEND_URL = "http://localhost:3000"

# Test credentials (from memory bank - 8 user roles)
TEST_USERS = {
    "admin": {"email": "admin@healthcare.local", "password": "admin123"},
    "doctor": {"email": "doctor@healthcare.local", "password": "doctor123"},
    "ivr": {"email": "ivr@healthcare.local", "password": "ivr123"},
    "distributor": {
        "email": "distributor@healthcare.local",
        "password": "distributor123"
    },
    "chp": {"email": "chp@healthcare.local", "password": "chp123"},
    "distributor2": {
        "email": "distributor2@healthcare.local",
        "password": "distributor123"
    },
    "sales": {"email": "sales@healthcare.local", "password": "sales123"},
    "logistics": {
        "email": "logistics@healthcare.local",
        "password": "logistics123"
    },
}


class HealthcareIVRTester:
    def __init__(self):
        self.session = requests.Session()
        self.auth_token = None
        self.patient_id = None

    def print_status(self, message, status="INFO"):
        """Print formatted status message"""
        timestamp = time.strftime("%H:%M:%S")
        print(f"[{timestamp}] {status}: {message}")

    def print_success(self, message):
        self.print_status(message, "✅ SUCCESS")

    def print_error(self, message):
        self.print_status(message, "❌ ERROR")

    def print_warning(self, message):
        self.print_status(message, "⚠️  WARNING")

    def test_backend_health(self):
        """Test if backend is running and healthy"""
        try:
            response = self.session.get(f"{BASE_URL}/health", timeout=5)
            if response.status_code == 200:
                self.print_success("Backend health check passed")
                return True
            else:
                self.print_error(
                    f"Backend health check failed: {response.status_code}"
                )
                return False
        except requests.exceptions.RequestException as e:
            self.print_error(f"Backend connection failed: {e}")
            return False

    def test_frontend_accessibility(self):
        """Test if frontend is accessible"""
        try:
            response = self.session.get(FRONTEND_URL, timeout=5)
            if response.status_code == 200:
                self.print_success("Frontend is accessible")
                return True
            else:
                self.print_error(
                    f"Frontend accessibility failed: {response.status_code}"
                )
                return False
        except requests.exceptions.RequestException as e:
            self.print_error(f"Frontend connection failed: {e}")
            return False

    def authenticate(self, user_type="doctor"):
        """Authenticate with the backend"""
        if user_type not in TEST_USERS:
            self.print_error(f"Unknown user type: {user_type}")
            return False

        credentials = TEST_USERS[user_type]

        try:
            # Login using OAuth2 password flow
            login_data = {
                "username": credentials["email"],
                "password": credentials["password"]
            }

            response = self.session.post(
                f"{BASE_URL}/api/v1/auth/login",
                data=login_data,
                headers={
                    "Content-Type": "application/x-www-form-urlencoded"
                }
            )

            if response.status_code == 200:
                token_data = response.json()
                self.auth_token = token_data.get("access_token")

                # Set authorization header for future requests
                self.session.headers.update({
                    "Authorization": f"Bearer {self.auth_token}"
                })

                self.print_success(f"Authentication successful for {user_type}")
                return True
            else:
                self.print_error(
                    f"Authentication failed: {response.status_code} - "
                    f"{response.text}"
                )
                return False

        except requests.exceptions.RequestException as e:
            self.print_error(f"Authentication request failed: {e}")
            return False

    def test_patient_registration(self):
        """Test patient registration"""
        patient_data = {
            "first_name": "John",
            "last_name": "Doe",
            "email": "john.doe@test.com",
            "date_of_birth": "1990-01-15",
            "phone": "+1234567890",
            "address": "123 Test Street, Test City, CA 90210"
        }

        try:
            response = self.session.post(
                f"{BASE_URL}/api/v1/patients/register",
                json=patient_data,
                headers={"Content-Type": "application/json"}
            )

            if response.status_code == 200:
                patient = response.json()
                self.patient_id = patient.get("id")
                self.print_success(
                    f"Patient registered successfully: {self.patient_id}"
                )
                self.print_status(
                    f"Patient details: {patient.get('first_name')} "
                    f"{patient.get('last_name')}"
                )
                return True
            else:
                self.print_error(
                    f"Patient registration failed: {response.status_code} - "
                    f"{response.text}"
                )
                return False

        except requests.exceptions.RequestException as e:
            self.print_error(f"Patient registration request failed: {e}")
            return False

    def create_test_image(self, filename="test_document.jpg"):
        """Create a test image file for document upload"""
        # Create a simple test image
        img = Image.new('RGB', (800, 600), color='white')

        # Add some text to make it look like a document
        try:
            from PIL import ImageDraw, ImageFont
            draw = ImageDraw.Draw(img)

            # Try to use a default font, fallback to basic if not available
            try:
                font = ImageFont.truetype("Arial.ttf", 24)
            except (OSError, IOError):
                font = ImageFont.load_default()

            draw.text((50, 50), "TEST DOCUMENT", fill='black', font=font)
            draw.text((50, 100), "Patient: John Doe", fill='black', font=font)
            draw.text((50, 150), "Date: 2025-01-01", fill='black', font=font)
            draw.text((50, 200), "Type: Government ID", fill='black', font=font)

        except ImportError:
            # If PIL drawing features aren't available, just use the basic image
            pass

        # Save to BytesIO
        img_bytes = BytesIO()
        img.save(img_bytes, format='JPEG')
        img_bytes.seek(0)

        return img_bytes

    def test_document_upload(self):
        """Test document upload functionality"""
        if not self.patient_id:
            self.print_error(
                "No patient ID available for document upload test"
            )
            return False

        # Create test document
        test_image = self.create_test_image()

        try:
            files = {
                'document': ('test_government_id.jpg', test_image, 'image/jpeg')
            }

            form_data = {
                'document_type': 'identification',
                'document_category': 'government_id',
                'display_name': 'Test Government ID'
            }

            response = self.session.post(
                f"{BASE_URL}/api/v1/patients/{self.patient_id}/documents",
                files=files,
                data=form_data
            )

            if response.status_code == 200:
                document = response.json()
                self.print_success(
                    f"Document uploaded successfully: {document.get('id')}"
                )
                self.print_status(
                    f"Document details: {document.get('display_name')} "
                    f"({document.get('file_size')} bytes)"
                )
                return True
            else:
                self.print_error(
                    f"Document upload failed: {response.status_code} - "
                    f"{response.text}"
                )
                return False

        except requests.exceptions.RequestException as e:
            self.print_error(f"Document upload request failed: {e}")
            return False

    def test_patient_search(self):
        """Test patient search functionality"""
        try:
            response = self.session.get(
                f"{BASE_URL}/api/v1/patients",
                params={"query": "John"}
            )

            if response.status_code == 200:
                patients = response.json()
                patient_list = patients.get("patients", [])
                self.print_success(
                    f"Patient search successful: Found {len(patient_list)} "
                    f"patients"
                )

                for patient in patient_list:
                    self.print_status(
                        f"Found patient: {patient.get('first_name')} "
                        f"{patient.get('last_name')} (ID: {patient.get('id')})"
                    )

                return True
            else:
                self.print_error(
                    f"Patient search failed: {response.status_code} - "
                    f"{response.text}"
                )
                return False

        except requests.exceptions.RequestException as e:
            self.print_error(f"Patient search request failed: {e}")
            return False

    def test_s3_bucket_access(self):
        """Test LocalStack S3 bucket access"""
        try:
            # Test S3 bucket listing
            response = requests.get("http://localhost:4566/healthcare-ivr-local")

            if response.status_code == 200:
                self.print_success("S3 bucket is accessible")
                return True
            else:
                self.print_error(
                    f"S3 bucket access failed: {response.status_code}"
                )
                return False

        except requests.exceptions.RequestException as e:
            self.print_error(f"S3 bucket access failed: {e}")
            return False

    def run_comprehensive_test(self):
        """Run all tests in sequence"""
        self.print_status(
            "Starting Healthcare IVR Platform Document Upload Test"
        )
        self.print_status("=" * 60)

        test_results = {}

        # Test 1: Backend Health
        self.print_status("Test 1: Backend Health Check")
        test_results["backend_health"] = self.test_backend_health()

        # Test 2: Frontend Accessibility
        self.print_status("\nTest 2: Frontend Accessibility")
        test_results["frontend_access"] = self.test_frontend_accessibility()

        # Test 3: S3 Bucket Access
        self.print_status("\nTest 3: S3 Bucket Access")
        test_results["s3_access"] = self.test_s3_bucket_access()

        # Test 4: Authentication
        self.print_status("\nTest 4: Authentication")
        test_results["authentication"] = self.authenticate("doctor")

        # Test 5: Patient Registration
        if test_results["authentication"]:
            self.print_status("\nTest 5: Patient Registration")
            test_results["patient_registration"] = (
                self.test_patient_registration()
            )
        else:
            test_results["patient_registration"] = False
            self.print_warning(
                "Skipping patient registration due to authentication failure"
            )

        # Test 6: Document Upload
        if test_results["patient_registration"]:
            self.print_status("\nTest 6: Document Upload")
            test_results["document_upload"] = self.test_document_upload()
        else:
            test_results["document_upload"] = False
            self.print_warning(
                "Skipping document upload due to patient registration failure"
            )

        # Test 7: Patient Search
        if test_results["authentication"]:
            self.print_status("\nTest 7: Patient Search")
            test_results["patient_search"] = self.test_patient_search()
        else:
            test_results["patient_search"] = False
            self.print_warning(
                "Skipping patient search due to authentication failure"
            )

        # Summary
        self.print_status("\n" + "=" * 60)
        self.print_status("TEST SUMMARY")
        self.print_status("=" * 60)

        passed = sum(test_results.values())
        total = len(test_results)

        for test_name, result in test_results.items():
            status = "✅ PASS" if result else "❌ FAIL"
            self.print_status(
                f"{test_name.replace('_', ' ').title()}: {status}"
            )

        self.print_status(f"\nOverall Result: {passed}/{total} tests passed")

        if passed == total:
            self.print_success(
                "All tests passed! Document upload system is working correctly."
            )
        else:
            self.print_error("Some tests failed. Please check the issues above.")

        return passed == total


def main():
    """Main function to run the tests"""
    tester = HealthcareIVRTester()

    try:
        success = tester.run_comprehensive_test()
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n\nTest interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n\nUnexpected error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()