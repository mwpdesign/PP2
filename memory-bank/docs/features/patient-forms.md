# Patient Forms

## Overview
The Healthcare IVR Platform includes three types of patient registration forms:

1. **Full Patient Registration** (`/patients/new`)
   - Comprehensive patient information
   - Insurance details with card uploads
   - Medical history and notes
   - Document management
   - Auto-saving functionality

2. **Quick Add Patient** (`/patients/quick-add`)
   - Basic patient information
   - Essential insurance details
   - Streamlined interface
   - Perfect for rapid data entry

3. **Simple Patient Form** (`/patients/simple-add`)
   - Clean, medical-grade design
   - Dark blue color scheme (#1a365d)
   - Professional layout with clear sections
   - Essential patient and insurance fields
   - Smooth navigation and error handling

## Authentication & Access

- Forms are protected by role-based authentication
- Test credentials: doctor@example.com / password
- Only users with 'doctor' role can access patient forms
- Session persistence through localStorage

## Form Features

### Simple Patient Form
- Professional medical-grade styling
- Gradient header bar (#1a365d to #2c5282)
- Organized sections:
  - Personal Information
  - Address Information
  - Insurance Information
- Form validation
- Cancel confirmation
- Loading states
- Error handling
- Clean navigation

### Full Registration Form
- Patient demographics
- Address information
- Government ID upload
- Primary/Secondary insurance
- Insurance card uploads (front/back)
- Medical notes with auto-save
- Document management
- Form validation
- Unsaved changes warning

### Quick Add Form
- Basic patient info
- Insurance provider selection
- Simple validation
- Quick submission process

## Navigation

- Access from dashboard quick actions
- Role-based menu navigation
- Proper routing with protected routes
- Cancel/back functionality with confirmation
- Breadcrumb navigation

## Working State Verification

1. **Authentication Flow**
   ```typescript
   // Login with test credentials
   await login('doctor@example.com', 'password');
   ```

2. **Form Access**
   - Must be authenticated
   - Must have 'doctor' role
   - Redirects to login if unauthenticated

3. **Form Submission**
   - Validates required fields
   - Shows success message
   - Redirects to patient list

## Known Good State

The current implementation represents a known working state with:
- Clean, professional medical styling
- Proper authentication
- Working form validation
- Smooth navigation
- Role-based access control
- Error handling
- Loading states

## Design Notes

### Color Scheme
- Primary: #1a365d (Dark Blue)
- Secondary: #2c5282 (Medium Blue)
- Gradient: linear-gradient(90deg, #1a365d 0%, #2c5282 100%)
- Background: White
- Borders: rgba(0, 0, 0, 0.08)
- Text: Dark (#1a365d for headers, regular for content)

### Layout
- Card-based design
- Clear section separation
- Consistent spacing
- Responsive grid
- Professional typography
- Clean form controls 