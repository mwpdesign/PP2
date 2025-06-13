# Healthcare IVR Platform - Test Files

This directory contains all test files that were previously in the `public/` folder. They have been organized by category for better maintainability and to prevent accidental deployment to production.

## Directory Structure

### `/auth/` - Authentication & Authorization Tests
- Permission management tests
- Role-based access control tests
- Token debugging and authentication flow tests

### `/components/` - Component-Level Tests
- Individual React component tests
- UI component integration tests
- Layout and styling tests

### `/hierarchy/` - Hierarchy & Filtering Tests
- Distributor hierarchy filtering tests
- Sales team hierarchy tests
- Data isolation and security tests

### `/integration/` - Integration & System Tests
- End-to-end workflow tests
- Cross-component integration tests
- System-wide bug fix verification tests
- Professional polish and audit reports

### `/ivr/` - IVR System Tests
- IVR workflow and submission tests
- Communication system tests
- Document upload and management tests
- IVR Company dashboard tests

### `/navigation/` - Navigation & Routing Tests
- Route testing and navigation flow tests
- Context-aware navigation tests
- Role-based navigation tests

### `/orders/` - Order Management Tests
- Order processing workflow tests
- Order detail and product display tests
- Order consolidation and management tests

### `/pages/` - Page-Level Tests
- Individual page functionality tests
- Dashboard and settings page tests
- User management and staff tests

### `/sales/` - Sales System Tests
- Sales dashboard and analytics tests
- Sales representative functionality tests
- Sales navigation and workflow tests

### `/services/` - Service Layer Tests
- WebSocket and real-time communication tests
- API service integration tests
- Date formatting and utility tests

### `/settings/` - Settings & Configuration Tests
- Settings page functionality tests
- Permission and role configuration tests
- System configuration tests

### `/shipping/` - Shipping & Logistics Tests
- Shipping workflow and queue tests
- Logistics management tests
- Shipping detail and tracking tests

### `/treatment/` - Treatment Tracking Tests
- Treatment recording and history tests
- Treatment integration tests
- Demo mode and treatment workflow tests

## Usage Guidelines

1. **Development Testing**: Use these files during development to test specific features
2. **Bug Reproduction**: Reference these files when reproducing and fixing bugs
3. **Integration Testing**: Use integration tests to verify cross-component functionality
4. **Documentation**: Many files serve as documentation of implemented features

## Security Note

These test files contain mock data and testing credentials. They should NEVER be deployed to production environments. The cleanup from the `public/` folder prevents accidental exposure of test data and credentials.

## File Naming Convention

- `test_*.html` - Interactive test pages
- `debug_*.html` - Debugging and diagnostic pages
- `verify_*.html` - Verification and validation pages
- `*.md` - Documentation and guides

## Maintenance

When adding new test files:
1. Place them in the appropriate category directory
2. Use descriptive filenames that indicate the feature being tested
3. Update this README if adding new categories
4. Ensure no test files are placed in the `public/` folder