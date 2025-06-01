# Environment Stack Documentation

This document outlines the technology stack and setup instructions for the local development environment, Docker configuration, and AWS deployment, ensuring consistency and compliance with project rules.

## Overview
The project uses a Python backend (FastAPI), React frontend with TypeScript, and PostgreSQL database. Development prioritizes local setup for speed, Docker for testing, and AWS for production scalability. All environments follow security best practices, such as using environment variables and encryption.

## Local Environment
### Description
Local development uses native tools for fast iteration, with Python virtual environments and npm for dependencies. This setup mirrors production where possible but prioritizes simplicity.

### Tech Stack
- **Backend**: Python with FastAPI, managed via venv.
- **Frontend**: React with TypeScript, using npm/yarn.
- **Database**: SQLite for quick testing or local PostgreSQL.
- **Other Tools**: Standard libraries for error handling and validation.

### Setup Instructions
1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/your-repo.git
   ```

2. Navigate to the project directory:
   ```bash
   cd your-repo
   ```

3. Set up the virtual environment for the backend:
   ```bash
   python -m venv venv
   source venv/bin/activate  # or venv\Scripts\activate on Windows
   pip install -r requirements.txt
   ```

4. Install frontend dependencies:
   ```bash
   cd frontend
   npm install
   npm start
   ```

5. Run the backend server:
   ```bash
   python manage.py runserver  # or uvicorn main:app --reload
   ```

6. For the database, use a local instance or SQLite for testing.

### Best Practices
- Use `.env` files for configuration to avoid hard-coded secrets.
- Ensure hot reloading is enabled for quick feedback.

## Docker Environment
### Description
Docker is used for secondary development and testing, providing a production-like environment with containerization. This helps validate deployments before AWS.

### Tech Stack
- **Containers**: Docker Compose for multi-service setup (backend, frontend, database).
- **Backend**: Python in a Docker container.
- **Frontend**: React in a Node.js container.
- **Database**: Containerized PostgreSQL.
- **Orchestration**: Docker Compose for local management.

### Setup Instructions
1. Ensure Docker is installed.
2. Build and start containers:
   ```bash
   docker-compose up --build
   ```

3. Access services via mapped ports (e.g., backend on 8000, frontend on 3000).

4. Stop containers when done:
   ```bash
   docker-compose down
   ```

### Best Practices
- Use multi-stage builds for optimized images.
- Mount volumes for code changes without rebuilding.
- Run health checks to ensure services are ready.

## AWS Environment
### Description
AWS is the target for production deployment, ensuring scalability and compliance. This setup uses managed services for reliability.

### Tech Stack
- **Backend**: Deployed via AWS ECS or Fargate.
- **Frontend**: Hosted on S3 with CloudFront for CDN.
- **Database**: AWS RDS for PostgreSQL.
- **Storage**: AWS S3 for files.
- **Other Services**: AWS Secrets Manager for credentials, CloudWatch for logging, and Application Load Balancer for traffic.

### Setup Instructions
1. Build and push Docker images to AWS ECR:
   ```bash
   docker build -t your-app .
   aws ecr get-login-password | docker login --username AWS --password-stdin your-ecr-url
   docker push your-ecr-url
   ```

2. Deploy to ECS/Fargate:
   ```bash
   aws ecs update-service --cluster your-cluster --service your-service --force-new-deployment
   ```

3. Configure RDS and S3 via AWS console or CLI.

4. Set environment variables using AWS Secrets Manager.

### Best Practices
- Use auto-scaling for load handling.
- Enable HTTPS with AWS Certificate Manager.
- Monitor with CloudWatch and set up alerts.

## Common Issues & Troubleshooting
- **Local**: Environment activation failures; solution: Verify Python version and PATH.
- **Docker**: Container conflicts; solution: Check port mappings and prune unused containers.
- **AWS**: Deployment errors; solution: Review CloudWatch logs and IAM permissions.

## Future Enhancements
Consider adding CI/CD pipelines with GitHub Actions or AWS CodePipeline for automated deployments across environments. 