# Patient Management

## Description
This feature manages patient data, including creation, updates, and retrieval, with HIPAA-compliant encryption and territory-based access control.

## User Flow
Users search or select patients, view details, and update records, with real-time validation for security.

## API Endpoints
- **Endpoint**: `GET /api/patients/{id}`
  - **Request**: No body required.
  - **Response**: 
    ```json
    {
      "id": "string",
      "name": "string",
      "territory_id": "string"
    }
    ```

## Database Schema
Patients are stored in a 'patients' table with fields like id, name, encrypted_PHI, and territory_id.

## Frontend Components
Includes PatientList and PatientDetail components in React with TypeScript for data display and editing.

## Security Considerations
All patient data is encrypted using AWS KMS, with field-level encryption and audit logging for PHI access.

## Testing
Unit tests for data validation using Jest; integration tests for API endpoints with pytest.

## Installation Instructions
To install this project locally from the GitHub repository, follow these steps:

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/your-repo.git
   ```

2. Navigate to the project directory:
   ```bash
   cd your-repo
   ```

3. Set up the virtual environment (for Python backend):
   ```bash
   python -m venv venv
   source venv/bin/activate  # or venv\Scripts\activate on Windows
   ```

4. Install the required packages:
   ```bash
   pip install -r requirements.txt
   ```

5. Start the backend server:
   ```bash
   python manage.py runserver  # or uvicorn main:app --reload
   ```

6. For the frontend, navigate to the frontend directory and install dependencies:
   ```bash
   cd frontend
   npm install
   npm start
   ```

## Common Issues & Troubleshooting
Common issue: Access denied errors; solution: Verify territory_id in user session.

## Future Enhancements
Add support for patient consent management. 