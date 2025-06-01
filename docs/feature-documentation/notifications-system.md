# Notifications System

## Description
This feature manages real-time notifications for events like order updates, patient alerts, and system messages, using WebSocket for delivery and ensuring HIPAA compliance.

## User Flow
Users receive notifications based on their preferences, with options to acknowledge or dismiss them in the dashboard.

## API Endpoints
- **Endpoint**: `POST /api/notifications/send`
  - **Request**: 
    ```json
    {
      "user_id": "string",
      "message": "string",
      "territory_id": "string"
    }
    ```
  - **Response**: 
    ```json
    {
      "notification_id": "string",
      "status": "sent"
    }
    ```

## Database Schema
Notifications are stored in a 'notifications' table with fields like id, user_id, message, and status.

## Frontend Components
Includes NotificationPanel and WebSocketHandler components in React with TypeScript for real-time updates.

## Security Considerations
Notifications are territory-specific, with logging of all sends and PHI redacted where necessary.

## Testing
Unit tests for message formatting using Jest; integration tests for WebSocket delivery with pytest.

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
Common issue: Notifications not delivering; solution: Verify WebSocket connections and server status.

## Future Enhancements
Add support for email and SMS notifications alongside WebSocket. 