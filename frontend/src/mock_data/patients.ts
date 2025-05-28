export interface Document {
  id: string;
  name: string;
  type: 'id' | 'insurance' | 'facesheet' | 'medical' | 'other';
  uploadDate: string;
  url: string;
  size: number;
  thumbnailUrl?: string;
}

export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  primaryCondition?: string;
  lastVisit?: string;
  insuranceProvider?: string;
  insuranceStatus?: 'active' | 'pending' | 'expired';
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  insuranceNumber?: string;
  documents?: Document[];
}

export const mockPatients: Patient[] = [
  {
    id: '1',
    firstName: 'John',
    lastName: 'Doe',
    dateOfBirth: '1980-01-15',
    primaryCondition: 'Type 2 Diabetes',
    lastVisit: '2024-05-20',
    insuranceProvider: 'Blue Cross Blue Shield',
    insuranceStatus: 'active',
    email: 'john.doe@example.com',
    phone: '(555) 123-4567',
    address: '123 Main St',
    city: 'Boston',
    state: 'MA',
    zipCode: '02108',
    insuranceNumber: 'BCBS123456789',
    documents: [
      {
        id: 'doc1',
        name: 'Driver License',
        type: 'id',
        uploadDate: '2024-03-15T10:30:00Z',
        url: '/documents/drivers-license.pdf',
        size: 1024576,
        thumbnailUrl: '/thumbnails/drivers-license.jpg'
      },
      {
        id: 'doc2',
        name: 'Insurance Card - Front',
        type: 'insurance',
        uploadDate: '2024-03-15T10:31:00Z',
        url: '/documents/insurance-front.pdf',
        size: 512000,
        thumbnailUrl: '/thumbnails/insurance-front.jpg'
      },
      {
        id: 'doc3',
        name: 'Insurance Card - Back',
        type: 'insurance',
        uploadDate: '2024-03-15T10:32:00Z',
        url: '/documents/insurance-back.pdf',
        size: 498000,
        thumbnailUrl: '/thumbnails/insurance-back.jpg'
      },
      {
        id: 'doc4',
        name: 'Latest Medical Report',
        type: 'medical',
        uploadDate: '2024-05-20T15:45:00Z',
        url: '/documents/medical-report.pdf',
        size: 2048000
      }
    ]
  },
  {
    id: '2',
    firstName: 'Jane',
    lastName: 'Smith',
    dateOfBirth: '1975-03-22',
    primaryCondition: 'Hypertension',
    lastVisit: '2024-05-18',
    insuranceProvider: 'Aetna',
    insuranceStatus: 'pending',
    email: 'jane.smith@example.com',
    phone: '(555) 234-5678',
    address: '456 Oak Ave',
    city: 'Cambridge',
    state: 'MA',
    zipCode: '02139',
    insuranceNumber: 'AET987654321'
  },
  {
    id: '3',
    firstName: 'Robert',
    lastName: 'Johnson',
    dateOfBirth: '1992-07-08',
    primaryCondition: 'Chronic Wound',
    lastVisit: '2024-05-15',
    insuranceProvider: 'UnitedHealthcare',
    insuranceStatus: 'expired',
    email: 'robert.johnson@example.com',
    phone: '(555) 345-6789',
    address: '789 Pine St',
    city: 'Somerville',
    state: 'MA',
    zipCode: '02143',
    insuranceNumber: 'UHC456789123'
  }
]; 