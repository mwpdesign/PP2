import asyncio
import httpx
from app.core.security import create_access_token

async def test_basic():
    print("🧪 Testing Treatment API Endpoints")

    # Create a test token
    token = create_access_token(data={'sub': 'doctor@healthcare.local', 'user_id': 'test-id'})

    # Test basic API connectivity
    async with httpx.AsyncClient() as client:
        headers = {'Authorization': f'Bearer {token}'}

        # Test treatment endpoints
        try:
            response = await client.get('http://localhost:8000/api/v1/treatments/patient/123e4567-e89b-12d3-a456-426614174000', headers=headers)
            print(f'✅ Treatment history endpoint: {response.status_code}')
            if response.status_code != 200:
                print(f'   Response: {response.text[:200]}')
        except Exception as e:
            print(f'❌ Treatment history error: {e}')

        # Test inventory endpoint
        try:
            response = await client.get('http://localhost:8000/api/v1/treatments/patients/123e4567-e89b-12d3-a456-426614174000/inventory', headers=headers)
            print(f'✅ Inventory endpoint: {response.status_code}')
            if response.status_code != 200:
                print(f'   Response: {response.text[:200]}')
        except Exception as e:
            print(f'❌ Inventory error: {e}')

        # Test treatment creation
        try:
            treatment_data = {
                "patient_id": "123e4567-e89b-12d3-a456-426614174000",
                "order_id": "order-1",
                "product_id": "prod-1",
                "product_name": "Test Product",
                "quantity_used": 1,
                "date_applied": "2025-01-27",
                "diagnosis": "Test diagnosis",
                "procedure_performed": "Test procedure",
                "wound_location": "Test location",
                "doctor_notes": "Test notes"
            }

            response = await client.post('http://localhost:8000/api/v1/treatments', headers=headers, json=treatment_data)
            print(f'✅ Treatment creation endpoint: {response.status_code}')
            if response.status_code == 201:
                result = response.json()
                print(f'   Created treatment: {result["id"]}')
            elif response.status_code != 201:
                print(f'   Response: {response.text[:200]}')
        except Exception as e:
            print(f'❌ Treatment creation error: {e}')

if __name__ == "__main__":
    asyncio.run(test_basic())