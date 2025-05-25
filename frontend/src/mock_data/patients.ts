import { Patient } from '../types/ivr';

export const mockPatients: Patient[] = [
  {
    id: '1',
    firstName: 'John',
    lastName: 'Doe',
    dateOfBirth: '1980-01-15',
    insuranceInfo: {
      provider: 'Blue Cross Blue Shield',
      policyNumber: 'BCBS123456789',
      groupNumber: 'GRP123'
    }
  },
  {
    id: '2',
    firstName: 'Jane',
    lastName: 'Smith',
    dateOfBirth: '1975-06-22',
    insuranceInfo: {
      provider: 'Aetna',
      policyNumber: 'AET987654321',
      groupNumber: 'GRP456'
    }
  }
];

// Add more mock patients as needed 