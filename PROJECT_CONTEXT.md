# Healthcare IVR Platform - Project Context

## What We're Building
A HIPAA-compliant platform for healthcare insurance verification requests (IVR) with the following key features:

- Multi-role authentication (Admin, Doctor, IVR Company, Logistics, etc.)
- Encrypted patient data management
- Insurance verification workflow
- Order management and logistics
- Real-time notifications
- Comprehensive analytics

## Tech Stack
- **Frontend**: React + TypeScript + Tailwind CSS
- **Backend**: Python FastAPI + SQLAlchemy
- **Database**: PostgreSQL with encryption
- **Cloud**: AWS (Cognito, RDS, S3, KMS, Lambda)
- **Infrastructure**: Terraform
- **Deployment**: Docker + ECS Fargate

## Key Requirements
- HIPAA compliance for all PHI handling
- Field-level encryption for sensitive data
- Role-based access control with territories
- Audit logging for all PHI access
- Multi-tenant architecture

## Current Status
Starting Phase 1: Project Foundation & Infrastructure Setup
