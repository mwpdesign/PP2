import { Patient } from '../types/ivr';

export const mockPatients: Patient[] = [
  {
    id: '1',
    firstName: 'John',
    lastName: 'Smith',
    dateOfBirth: '1985-03-15',
    email: 'john.smith@email.com',
    phone: '(555) 123-4567',
    address: '123 Main St',
    city: 'Springfield',
    state: 'IL',
    zipCode: '62701',
    primaryCondition: 'Diabetes',
    lastVisitDate: '2025-05-20',
    insuranceInfo: {
      provider: 'Blue Cross',
      policyNumber: 'BC123456789',
      groupNumber: 'GRP001',
      status: 'active'
    }
  },
  {
    id: '2',
    firstName: 'Sarah',
    lastName: 'Johnson',
    dateOfBirth: '1978-11-22',
    email: 'sarah.j@email.com',
    phone: '(555) 234-5678',
    address: '456 Oak Ave',
    city: 'Springfield',
    state: 'IL',
    zipCode: '62702',
    primaryCondition: 'Hypertension',
    lastVisitDate: '2025-05-18',
    insuranceInfo: {
      provider: 'Aetna',
      policyNumber: 'AET987654321',
      groupNumber: 'GRP002',
      status: 'active'
    }
  },
  {
    id: '3',
    firstName: 'Michael',
    lastName: 'Brown',
    dateOfBirth: '1992-07-08',
    email: 'michael.b@email.com',
    phone: '(555) 345-6789',
    address: '789 Pine St',
    city: 'Springfield',
    state: 'IL',
    zipCode: '62703',
    primaryCondition: 'Asthma',
    lastVisitDate: '2025-05-15',
    insuranceInfo: {
      provider: 'UnitedHealth',
      policyNumber: 'UH456789123',
      groupNumber: 'GRP003',
      status: 'active'
    }
  },
  {
    id: '4',
    firstName: 'Emily',
    lastName: 'Davis',
    dateOfBirth: '1965-12-03',
    email: 'emily.d@email.com',
    phone: '(555) 456-7890',
    address: '321 Elm St',
    city: 'Springfield',
    state: 'IL',
    zipCode: '62704',
    primaryCondition: 'Arthritis',
    lastVisitDate: '2025-05-10',
    insuranceInfo: {
      provider: 'Cigna',
      policyNumber: 'CIG789123456',
      groupNumber: 'GRP004',
      status: 'active'
    }
  },
  {
    id: '5',
    firstName: 'Robert',
    lastName: 'Wilson',
    dateOfBirth: '1989-04-17',
    email: 'robert.w@email.com',
    phone: '(555) 567-8901',
    address: '654 Maple Dr',
    city: 'Springfield',
    state: 'IL',
    zipCode: '62705',
    primaryCondition: 'COPD',
    lastVisitDate: '2025-05-25',
    insuranceInfo: {
      provider: 'Humana',
      policyNumber: 'HUM234567891',
      groupNumber: 'GRP005',
      status: 'active'
    }
  }
];

interface SearchParams {
  query?: string;
  page?: number;
  size?: number;
}

interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
}

export const mockPatientService = {
  searchPatients: async (params: SearchParams): Promise<PaginatedResponse<Patient>> => {
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay

    let filtered = [...mockPatients];

    if (params.query) {
      const query = params.query.toLowerCase();
      filtered = filtered.filter(p =>
        p.firstName.toLowerCase().includes(query) ||
        p.lastName.toLowerCase().includes(query) ||
        p.insuranceInfo.provider.toLowerCase().includes(query) ||
        p.primaryCondition?.toLowerCase().includes(query)
      );
    }

    const page = params.page || 1;
    const size = params.size || 10;
    const start = (page - 1) * size;
    const end = start + size;

    return {
      items: filtered.slice(start, end),
      total: filtered.length,
      page,
      size
    };
  },

  getAllPatients: async (): Promise<Patient[]> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return mockPatients;
  },

  getPatient: async (id: string): Promise<Patient | undefined> => {
    await new Promise(resolve => setTimeout(resolve, 200));
    return mockPatients.find(p => p.id === id);
  },

  createPatient: async (patient: Omit<Patient, 'id'>): Promise<Patient> => {
    await new Promise(resolve => setTimeout(resolve, 400));
    const newPatient = {
      ...patient,
      id: String(mockPatients.length + 1)
    };
    mockPatients.push(newPatient);
    return newPatient;
  },

  updatePatient: async (id: string, updates: Partial<Patient>): Promise<Patient> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    const index = mockPatients.findIndex(p => p.id === id);
    if (index === -1) throw new Error('Patient not found');

    mockPatients[index] = {
      ...mockPatients[index],
      ...updates
    };
    return mockPatients[index];
  },

  // Enhanced search with auto-population support
  searchPatientsWithHistory: async (params: SearchParams & { includeHistory?: boolean }): Promise<PaginatedResponse<Patient & { hasHistory?: boolean }>> => {
    await new Promise(resolve => setTimeout(resolve, 400));

    let filtered = [...mockPatients];

    if (params.query) {
      const query = params.query.toLowerCase();
      filtered = filtered.filter(p =>
        p.firstName.toLowerCase().includes(query) ||
        p.lastName.toLowerCase().includes(query) ||
        p.insuranceInfo.provider.toLowerCase().includes(query) ||
        p.primaryCondition?.toLowerCase().includes(query) ||
        p.email.toLowerCase().includes(query) ||
        p.phone.includes(query)
      );
    }

    const page = params.page || 1;
    const size = params.size || 10;
    const start = (page - 1) * size;
    const end = start + size;

    // Add history indicator if requested
    const enhancedResults = filtered.map(patient => ({
      ...patient,
      hasHistory: params.includeHistory ? Math.random() > 0.5 : undefined // Mock history indicator
    }));

    return {
      items: enhancedResults.slice(start, end),
      total: filtered.length,
      page,
      size
    };
  },

  // Get patient with related form history
  getPatientWithHistory: async (id: string): Promise<(Patient & { formHistory?: any[] }) | undefined> => {
    await new Promise(resolve => setTimeout(resolve, 250));
    const patient = mockPatients.find(p => p.id === id);

    if (!patient) return undefined;

    // Mock form history
    const mockHistory = [
      {
        id: 'hist_001',
        formType: 'ivr',
        createdAt: '2024-12-15T10:30:00Z',
        status: 'completed',
        treatmentType: 'Wound Care Matrix'
      },
      {
        id: 'hist_002',
        formType: 'assessment',
        createdAt: '2024-12-10T14:15:00Z',
        status: 'completed',
        treatmentType: 'Negative Pressure Therapy'
      }
    ];

    return {
      ...patient,
      formHistory: Math.random() > 0.3 ? mockHistory : [] // 70% chance of having history
    };
  },

  // Search insurance providers (integrated with auto-population)
  searchInsuranceProviders: async (query: string, limit: number = 5): Promise<any[]> => {
    await new Promise(resolve => setTimeout(resolve, 200));

    const allProviders = [
      'Blue Cross Blue Shield',
      'Aetna',
      'UnitedHealthcare',
      'Cigna',
      'Humana',
      'Medicare',
      'Medicaid',
      'Kaiser Permanente',
      'Anthem',
      'Molina Healthcare'
    ];

    const filtered = allProviders
      .filter(provider => provider.toLowerCase().includes(query.toLowerCase()))
      .slice(0, limit)
      .map(name => ({
        name,
        code: name.replace(/\s+/g, '').substring(0, 4).toUpperCase(),
        type: name.includes('Medicare') ? 'medicare' : name.includes('Medicaid') ? 'medicaid' : 'primary'
      }));

    return filtered;
  }
};