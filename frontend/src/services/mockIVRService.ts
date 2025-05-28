import { IVRRequest, IVRStatus, IVRPriority, IVRQueueParams, IVRQueueResponse, IVRCommunicationMessage, IVRReviewNote, User } from '../types/ivr';
import { mockPatients } from './mockPatientService';

// Create mock providers
const mockProviders = [
  { id: 'P1', name: 'Dr. James Wilson', speciality: 'Internal Medicine', npi: '1234567890' },
  { id: 'P2', name: 'Dr. Lisa Chen', speciality: 'Cardiology', npi: '2345678901' },
  { id: 'P3', name: 'Dr. Michael Scott', speciality: 'Family Medicine', npi: '3456789012' }
];

// Create mock IVR specialists
const mockIVRSpecialists: User[] = [
  { id: 'IVR1', name: 'Jane Smith', email: 'jane.smith@ivrcompany.com', role: 'IVRCompany' },
  { id: 'IVR2', name: 'Bob Johnson', email: 'bob.johnson@ivrcompany.com', role: 'IVRCompany' }
];

// Create mock IVR requests using real patient data
export const mockIVRRequests: IVRRequest[] = [
  {
    id: 'IVR-001',
    patient: mockPatients[0],
    provider: mockProviders[0],
    serviceType: 'Initial Consultation',
    priority: IVRPriority.HIGH,
    status: IVRStatus.SUBMITTED,
    documents: [],
    statusHistory: [
      {
        id: 'SH1',
        ivrRequestId: 'IVR-001',
        fromStatus: IVRStatus.DRAFT,
        toStatus: IVRStatus.SUBMITTED,
        userId: 'USER1',
        createdAt: new Date().toISOString()
      }
    ],
    approvals: [],
    escalations: [],
    facilityId: 'FAC1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    reviewNotes: [],
    communication: [],
    reviews: []
  },
  {
    id: 'IVR-002',
    patient: mockPatients[1],
    provider: mockProviders[1],
    serviceType: 'Follow-up',
    priority: IVRPriority.MEDIUM,
    status: IVRStatus.APPROVED,
    documents: [],
    statusHistory: [
      {
        id: 'SH2',
        ivrRequestId: 'IVR-002',
        fromStatus: IVRStatus.DRAFT,
        toStatus: IVRStatus.SUBMITTED,
        userId: 'USER1',
        createdAt: new Date(Date.now() - 86400000).toISOString()
      },
      {
        id: 'SH3',
        ivrRequestId: 'IVR-002',
        fromStatus: IVRStatus.SUBMITTED,
        toStatus: IVRStatus.APPROVED,
        userId: 'IVR1',
        createdAt: new Date().toISOString()
      }
    ],
    approvals: [
      {
        id: 'APP1',
        ivrRequestId: 'IVR-002',
        approvalLevel: 1,
        decision: 'approved',
        userId: 'IVR1',
        createdAt: new Date().toISOString()
      }
    ],
    escalations: [],
    facilityId: 'FAC1',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
    reviewNotes: [
      {
        id: 'RN1',
        ivrRequestId: 'IVR-002',
        note: 'Patient meets all criteria for follow-up care. Insurance coverage verified and approved.',
        author: mockIVRSpecialists[0],
        createdAt: new Date().toISOString(),
        status: IVRStatus.APPROVED,
        isInternal: false
      }
    ],
    communication: [
      {
        id: 'CM1',
        author: mockIVRSpecialists[0],
        message: 'Request approved. Patient eligibility confirmed for follow-up care.',
        createdAt: new Date().toISOString()
      }
    ],
    reviews: []
  },
  {
    id: 'IVR-003',
    patient: mockPatients[3],
    provider: mockProviders[2],
    serviceType: 'Procedure Authorization',
    priority: IVRPriority.URGENT,
    status: IVRStatus.IN_REVIEW,
    documents: [],
    statusHistory: [
      {
        id: 'SH4',
        ivrRequestId: 'IVR-003',
        fromStatus: IVRStatus.DRAFT,
        toStatus: IVRStatus.SUBMITTED,
        userId: 'USER1',
        createdAt: new Date(Date.now() - 43200000).toISOString()
      },
      {
        id: 'SH5',
        ivrRequestId: 'IVR-003',
        fromStatus: IVRStatus.SUBMITTED,
        toStatus: IVRStatus.IN_REVIEW,
        userId: 'IVR2',
        createdAt: new Date().toISOString()
      }
    ],
    approvals: [],
    escalations: [],
    facilityId: 'FAC1',
    createdAt: new Date(Date.now() - 43200000).toISOString(),
    updatedAt: new Date().toISOString(),
    reviewNotes: [
      {
        id: 'RN2',
        ivrRequestId: 'IVR-003',
        note: 'Additional documentation needed for pre-authorization. Please provide recent lab results and imaging studies.',
        author: mockIVRSpecialists[1],
        createdAt: new Date().toISOString(),
        status: IVRStatus.IN_REVIEW,
        isInternal: false
      }
    ],
    communication: [
      {
        id: 'CM2',
        author: mockIVRSpecialists[1],
        message: 'Please provide recent lab results and imaging studies for pre-authorization review.',
        createdAt: new Date().toISOString()
      }
    ],
    reviews: [
      {
        id: 'REV1',
        reviewer: mockIVRSpecialists[1],
        status: 'in_progress',
        startedAt: new Date().toISOString(),
        createdAt: new Date().toISOString()
      }
    ]
  }
];

export const mockIVRService = {
  getQueue: async (params: IVRQueueParams): Promise<IVRQueueResponse> => {
    await new Promise(resolve => setTimeout(resolve, 400)); // Simulate network delay
    
    let filtered = [...mockIVRRequests];
    
    // Apply filters
    if (params.status) {
      filtered = filtered.filter(r => r.status === params.status);
    }
    if (params.priority) {
      filtered = filtered.filter(r => r.priority === params.priority);
    }
    if (params.facilityId) {
      filtered = filtered.filter(r => r.facilityId === params.facilityId);
    }
    
    // Apply pagination
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
  
  updateStatus: async (id: string, status: IVRStatus, userId: string = 'USER1'): Promise<IVRRequest> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    const request = mockIVRRequests.find(r => r.id === id);
    if (!request) throw new Error('IVR request not found');
    
    const oldStatus = request.status;
    request.status = status;
    request.updatedAt = new Date().toISOString();
    
    // Add status history
    request.statusHistory.push({
      id: `SH${request.statusHistory.length + 1}`,
      ivrRequestId: id,
      fromStatus: oldStatus,
      toStatus: status,
      userId,
      createdAt: new Date().toISOString()
    });
    
    return request;
  },

  addReviewNote: async (id: string, note: string, author: User, isInternal: boolean = false): Promise<IVRRequest> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    const request = mockIVRRequests.find(r => r.id === id);
    if (!request) throw new Error('IVR request not found');

    const reviewNote: IVRReviewNote = {
      id: `RN${request.reviewNotes.length + 1}`,
      ivrRequestId: id,
      note,
      author,
      createdAt: new Date().toISOString(),
      status: request.status,
      isInternal
    };

    request.reviewNotes.push(reviewNote);
    request.updatedAt = new Date().toISOString();

    return request;
  },

  addCommunication: async (id: string, message: string, author: User): Promise<IVRRequest> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    const request = mockIVRRequests.find(r => r.id === id);
    if (!request) throw new Error('IVR request not found');

    const communicationMessage: IVRCommunicationMessage = {
      id: `CM${request.communication.length + 1}`,
      author,
      message,
      createdAt: new Date().toISOString()
    };

    request.communication.push(communicationMessage);
    request.updatedAt = new Date().toISOString();

    return request;
  },
  
  createRequest: async (data: Partial<IVRRequest>): Promise<IVRRequest> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    const newRequest: IVRRequest = {
      id: `IVR-${String(mockIVRRequests.length + 1).padStart(3, '0')}`,
      status: IVRStatus.DRAFT,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      documents: [],
      statusHistory: [],
      approvals: [],
      escalations: [],
      reviews: [],
      reviewNotes: [],
      communication: [],
      ...data
    } as IVRRequest;
    
    mockIVRRequests.push(newRequest);
    return newRequest;
  }
}; 