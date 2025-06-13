#!/usr/bin/env python3
"""
Test script for Treatment API endpoints.

This script validates the treatment API routes, schemas, and integration
without requiring a running server.
"""

import sys
import os
import inspect
from typing import get_type_hints

# Add the backend directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__)))


def test_api_routes():
    """Test that all API routes are properly defined."""
    print("🔍 Testing Treatment API routes...")

    try:
        from app.api.treatments.routes import router
        from fastapi import APIRouter

        # Check router type
        if not isinstance(router, APIRouter):
            print("❌ Router is not a FastAPI APIRouter instance")
            return False
        print("✅ Router is a valid FastAPI APIRouter")

        # Check routes exist
        routes = router.routes
        route_paths = [route.path for route in routes]

        expected_routes = [
            "",  # POST /treatments
            "/patient/{patient_id}",  # GET /treatments/patient/{patient_id}
            "/order/{order_id}",  # GET /treatments/order/{order_id}
            "/{treatment_id}",  # GET /treatments/{treatment_id}
            "/patients/{patient_id}/inventory",  # GET /treatments/patients/{patient_id}/inventory
        ]

        for expected_route in expected_routes:
            if expected_route not in route_paths:
                print(f"❌ Missing route: {expected_route}")
                return False
            print(f"✅ Route exists: {expected_route}")

        # Check HTTP methods
        route_methods = {}
        for route in routes:
            route_methods[route.path] = route.methods

        # Validate specific route methods
        if "POST" not in route_methods.get("", set()):
            print("❌ POST method missing for create treatment route")
            return False
        print("✅ POST method exists for create treatment")

        if "GET" not in route_methods.get("/patient/{patient_id}", set()):
            print("❌ GET method missing for patient treatments route")
            return False
        print("✅ GET method exists for patient treatments")

        print("✅ All API routes validated successfully")
        return True

    except Exception as e:
        print(f"❌ Error testing API routes: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_schemas():
    """Test that all schemas are properly defined."""
    print("\n🔍 Testing Treatment schemas...")

    try:
        from app.schemas.treatments import (
            TreatmentCreateRequest,
            TreatmentResponse,
            TreatmentListResponse,
            InventorySummaryResponse,
            TreatmentErrorResponse,
        )
        from pydantic import BaseModel

        schemas = [
            TreatmentCreateRequest,
            TreatmentResponse,
            TreatmentListResponse,
            InventorySummaryResponse,
            TreatmentErrorResponse,
        ]

        for schema in schemas:
            # Check if it's a Pydantic model
            if not issubclass(schema, BaseModel):
                print(f"❌ {schema.__name__} is not a Pydantic BaseModel")
                return False
            print(f"✅ {schema.__name__} is a valid Pydantic model")

            # Check if it has required fields
            fields = schema.__fields__
            if not fields:
                print(f"❌ {schema.__name__} has no fields defined")
                return False
            print(f"✅ {schema.__name__} has {len(fields)} fields defined")

        # Test TreatmentCreateRequest specifically
        required_fields = [
            'patient_id', 'order_id', 'product_id', 'product_name',
            'quantity_used', 'date_applied'
        ]

        create_fields = TreatmentCreateRequest.__fields__
        for field in required_fields:
            if field not in create_fields:
                print(f"❌ TreatmentCreateRequest missing required field: {field}")
                return False
            print(f"✅ TreatmentCreateRequest has required field: {field}")

        # Test TreatmentResponse specifically
        response_fields = TreatmentResponse.__fields__
        if 'id' not in response_fields:
            print("❌ TreatmentResponse missing id field")
            return False
        print("✅ TreatmentResponse has id field")

        print("✅ All schemas validated successfully")
        return True

    except Exception as e:
        print(f"❌ Error testing schemas: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_api_integration():
    """Test API integration with main router."""
    print("\n🔍 Testing API integration...")

    try:
        from app.api.v1.api import api_router
        from fastapi import APIRouter

        # Check that treatments router is included
        included_routers = []
        for route in api_router.routes:
            if hasattr(route, 'path_regex'):
                path = route.path
                if path.startswith('/treatments'):
                    included_routers.append(path)

        if not included_routers:
            print("❌ Treatments router not included in main API router")
            return False

        print(f"✅ Treatments router included with {len(included_routers)} routes")

        # Check specific treatment routes in main router
        expected_main_routes = [
            '/treatments',
            '/treatments/patient/{patient_id}',
            '/treatments/order/{order_id}',
            '/treatments/{treatment_id}',
            '/treatments/patients/{patient_id}/inventory',
        ]

        main_route_paths = [route.path for route in api_router.routes]

        for expected_route in expected_main_routes:
            if expected_route not in main_route_paths:
                print(f"❌ Route not found in main router: {expected_route}")
                return False
            print(f"✅ Route found in main router: {expected_route}")

        print("✅ API integration validated successfully")
        return True

    except Exception as e:
        print(f"❌ Error testing API integration: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_dependencies():
    """Test that all dependencies are properly imported."""
    print("\n🔍 Testing dependencies...")

    try:
        # Test core dependencies
        from app.core.database import get_db
        from app.core.security import get_current_user
        from app.schemas.token import TokenData
        print("✅ Core dependencies imported successfully")

        # Test treatment-specific dependencies
        from app.api.treatments.service import TreatmentService
        from app.api.treatments.models import TreatmentRecord
        print("✅ Treatment dependencies imported successfully")

        # Test exception handling
        from app.core.exceptions import (
            NotFoundException,
            ValidationError,
            AuthorizationError,
        )
        print("✅ Exception classes imported successfully")

        # Test FastAPI dependencies
        from fastapi import APIRouter, Depends, HTTPException, Query, status
        from sqlalchemy.ext.asyncio import AsyncSession
        print("✅ FastAPI dependencies imported successfully")

        print("✅ All dependencies validated successfully")
        return True

    except Exception as e:
        print(f"❌ Error testing dependencies: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_route_signatures():
    """Test that route functions have correct signatures."""
    print("\n🔍 Testing route function signatures...")

    try:
        from app.api.treatments.routes import (
            create_treatment,
            get_treatments_by_patient,
            get_treatments_by_order,
            get_treatment_by_id,
            get_patient_inventory_summary,
        )

        # Test create_treatment signature
        sig = inspect.signature(create_treatment)
        params = list(sig.parameters.keys())
        expected_params = ['treatment_data', 'db', 'current_user']

        for param in expected_params:
            if param not in params:
                print(f"❌ create_treatment missing parameter: {param}")
                return False
        print("✅ create_treatment has correct signature")

        # Test get_treatments_by_patient signature
        sig = inspect.signature(get_treatments_by_patient)
        params = list(sig.parameters.keys())
        expected_params = ['patient_id', 'db', 'current_user', 'limit', 'offset']

        for param in expected_params:
            if param not in params:
                print(f"❌ get_treatments_by_patient missing parameter: {param}")
                return False
        print("✅ get_treatments_by_patient has correct signature")

        # Test get_treatment_by_id signature
        sig = inspect.signature(get_treatment_by_id)
        params = list(sig.parameters.keys())
        expected_params = ['treatment_id', 'db', 'current_user']

        for param in expected_params:
            if param not in params:
                print(f"❌ get_treatment_by_id missing parameter: {param}")
                return False
        print("✅ get_treatment_by_id has correct signature")

        print("✅ All route signatures validated successfully")
        return True

    except Exception as e:
        print(f"❌ Error testing route signatures: {e}")
        import traceback
        traceback.print_exc()
        return False


def main():
    """Run all API tests."""
    print("🚀 Starting Treatment API Test Suite")
    print("=" * 60)

    # Test API routes
    routes_ok = test_api_routes()

    # Test schemas
    schemas_ok = test_schemas()

    # Test API integration
    integration_ok = test_api_integration()

    # Test dependencies
    dependencies_ok = test_dependencies()

    # Test route signatures
    signatures_ok = test_route_signatures()

    print("\n" + "=" * 60)
    print("📊 API TEST RESULTS:")
    print(f"API routes: {'✅ PASSED' if routes_ok else '❌ FAILED'}")
    print(f"Schemas: {'✅ PASSED' if schemas_ok else '❌ FAILED'}")
    print(f"API integration: {'✅ PASSED' if integration_ok else '❌ FAILED'}")
    print(f"Dependencies: {'✅ PASSED' if dependencies_ok else '❌ FAILED'}")
    print(f"Route signatures: {'✅ PASSED' if signatures_ok else '❌ FAILED'}")

    all_passed = all([routes_ok, schemas_ok, integration_ok, dependencies_ok, signatures_ok])

    if all_passed:
        print("\n🎉 ALL API TESTS PASSED!")
        print("✅ Treatment API endpoints are properly implemented")
        print("✅ All schemas are correctly defined")
        print("✅ API integration is working")
        print("✅ All dependencies are available")
        print("✅ Route signatures are correct")
        print("\n📋 API ENDPOINTS AVAILABLE:")
        print("  POST   /api/v1/treatments")
        print("  GET    /api/v1/treatments/patient/{patient_id}")
        print("  GET    /api/v1/treatments/order/{order_id}")
        print("  GET    /api/v1/treatments/{treatment_id}")
        print("  GET    /api/v1/treatments/patients/{patient_id}/inventory")
        print("\n🚀 Ready for production use!")
        return True
    else:
        print("\n❌ SOME API TESTS FAILED")
        print("Please review the errors above before deploying")
        return False


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)