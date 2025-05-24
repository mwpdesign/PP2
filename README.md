# Healthcare IVR Platform

A HIPAA-compliant Interactive Voice Response (IVR) platform for healthcare providers.

## Features

- Secure patient data handling with PHI encryption
- Real-time IVR flow management
- Provider scheduling and availability management
- Patient appointment scheduling and reminders
- Audit logging and compliance tracking
- Territory-based access control
- Real-time analytics and reporting

## Prerequisites

- Docker & Docker Compose
- Python 3.9+
- Node.js 16+
- AWS Account (or LocalStack for development)

## Quick Start

1. Clone the repository:
```bash
git clone https://github.com/your-org/healthcare-ivr-platform.git
cd healthcare-ivr-platform
```

2. Set up environment variables:
```bash
# For local development with LocalStack
export AWS_ACCESS_KEY_ID=dummy_key
export AWS_SECRET_ACCESS_KEY=dummy_secret
```

3. Run the development environment setup script:
```bash
chmod +x scripts/setup-dev-environment.sh
./scripts/setup-dev-environment.sh
```

4. Start the application:
```bash
docker-compose up --build
```

5. Bootstrap the system (first time only):
```bash
docker-compose exec backend python scripts/system_bootstrap.py
```

## Access Points

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000/api/v1
- API Documentation: http://localhost:8000/docs
- Database Admin: http://localhost:8080
- Grafana Dashboard: http://localhost:3001
- Prometheus Metrics: http://localhost:9090

## Default Credentials

**Admin User:**
- Email: admin@healthcare-ivr.com
- Password: admin123 (change on first login)

**Adminer:**
- System: PostgreSQL
- Server: db
- Username: postgres
- Password: password
- Database: healthcare_ivr

**Grafana:**
- Username: admin
- Password: admin

## Development

### Directory Structure

```
healthcare-ivr-platform/
├── backend/                 # Python FastAPI backend
│   ├── app/                # Application code
│   ├── tests/              # Test suites
│   └── scripts/            # Utility scripts
├── frontend/               # React.js frontend
│   ├── src/               # Source code
│   └── public/            # Static assets
├── infrastructure/         # Infrastructure configuration
│   ├── prometheus/        # Prometheus configuration
│   ├── grafana/           # Grafana dashboards
│   └── localstack/        # LocalStack resources
└── scripts/               # Development scripts
```

### Running Tests

```bash
# Backend tests
docker-compose exec backend pytest

# Frontend tests
docker-compose exec frontend npm test
```

### Code Style

The project uses:
- Backend: Black, isort, flake8, mypy
- Frontend: ESLint, Prettier

Format code before committing:
```bash
# Backend
docker-compose exec backend black .
docker-compose exec backend isort .

# Frontend
docker-compose exec frontend npm run format
```

## Monitoring & Debugging

### Logs

View container logs:
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
```

### Metrics

- Application metrics: http://localhost:9090
- System monitoring: http://localhost:3001

## Security Notes

1. Change default passwords immediately in production
2. Enable MFA for all admin accounts
3. Regularly rotate access keys
4. Monitor audit logs for suspicious activity
5. Keep all dependencies updated

## Compliance

The platform is designed for HIPAA compliance:
- PHI encryption at rest and in transit
- Comprehensive audit logging
- Role-based access control
- Secure communication channels
- Data backup and recovery
- Regular security assessments

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests
5. Submit a pull request

## License

[Your License Here] 