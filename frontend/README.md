# Healthcare IVR Platform Frontend

This is the frontend application for the Healthcare IVR Platform. It provides a user interface for managing IVR (Interactive Voice Response) requests in a healthcare setting.

## Features

- IVR Request Submission
- Document Upload and Management
- Review and Approval Workflow
- Real-time Status Updates
- Advanced Search and Filtering
- Analytics and Reporting
- Territory-based Access Control

## Prerequisites

- Node.js 16.x or later
- npm 8.x or later

## Setup

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd healthcare-ivr-platform/frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file:
   ```bash
   cp .env.example .env
   ```

4. Update the environment variables in `.env` as needed:
   ```
   REACT_APP_API_BASE_URL=http://localhost:8000
   REACT_APP_WS_URL=ws://localhost:8000
   ```

## Development

Start the development server:
```bash
npm start
```

The application will be available at `http://localhost:3000`.

## Building for Production

Build the application:
```bash
npm run build
```

The build artifacts will be stored in the `build/` directory.

## Project Structure

```
frontend/
├── src/
│   ├── components/     # React components
│   │   ├── auth/      # Authentication components
│   │   └── ivr/       # IVR-related components
│   ├── hooks/         # Custom React hooks
│   ├── services/      # API and WebSocket services
│   ├── types/         # TypeScript type definitions
│   └── utils/         # Utility functions
├── public/            # Static assets
└── package.json       # Project configuration
```

## Key Components

### IVR Components

- `IVRSubmission`: Form for submitting new IVR requests
- `IVRReview`: Interface for reviewing and approving requests
- `IVRDashboard`: Overview of IVR requests and statistics
- `IVRSearch`: Advanced search and filtering interface
- `StatusTracking`: Real-time status tracking component
- `DocumentViewer`: Document preview with annotation support

### Services

- `ivrService`: API integration for IVR operations
- `websocket`: Real-time updates and notifications

## Contributing

1. Create a feature branch
2. Make your changes
3. Submit a pull request

## Security

This application follows security best practices:

- HIPAA compliance
- Secure data transmission
- Territory-based access control
- Audit logging
- Document encryption

## License

[License Type] - See LICENSE file for details 