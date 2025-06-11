export interface SharedIVRRequest {
  id: string;
  ivrNumber: string;
  patientName: string;
  doctorName: string;
  serviceType: string;
  insurance: string;
  status: 'submitted' | 'in_review' | 'pending_approval' | 'documents_requested' | 'approved' | 'rejected' | 'escalated' | 'cancelled';
  priority: 'high' | 'medium' | 'low';
  submittedDate: string;
  lastUpdated: string;
  daysSinceSubmission: number;
  daysPending: number;
  hasUnreadMessages: boolean;
  patientId: string;
  doctorId: string;
  estimatedCompletion?: string;
}

export interface DashboardStats {
  submitted: number;
  inReview: number;
  approved: number;
  documentsRequested: number;
  pendingApproval: number;
}

// Shared mock data - single source of truth for all IVR data
export const mockIVRRequests: SharedIVRRequest[] = [
  {
    id: '660e8400-e29b-41d4-a716-446655440001',
    ivrNumber: 'IVR-2024-001',
    patientName: 'John Smith',
    doctorName: 'Dr. John Smith',
    serviceType: 'Wound Care Authorization',
    insurance: 'Blue Cross Blue Shield',
    status: 'approved',
    priority: 'high',
    submittedDate: '2024-03-15',
    lastUpdated: '2024-03-18',
    daysSinceSubmission: 3,
    daysPending: 3,
    hasUnreadMessages: false,
    patientId: 'P-1234',
    doctorId: 'D-001',
    estimatedCompletion: '2024-03-20'
  },
  {
    id: '660e8400-e29b-41d4-a716-446655440002',
    ivrNumber: 'IVR-2024-002',
    patientName: 'Emily Davis',
    doctorName: 'Dr. Michael Brown',
    serviceType: 'Skin Graft Authorization',
    insurance: 'UnitedHealthcare',
    status: 'in_review',
    priority: 'medium',
    submittedDate: '2024-03-16',
    lastUpdated: '2024-03-17',
    daysSinceSubmission: 2,
    daysPending: 2,
    hasUnreadMessages: true,
    patientId: 'P-1235',
    doctorId: 'D-002',
    estimatedCompletion: '2024-03-22'
  },
  {
    id: '660e8400-e29b-41d4-a716-446655440003',
    ivrNumber: 'IVR-2024-003',
    patientName: 'David Wilson',
    doctorName: 'Dr. Jennifer Lee',
    serviceType: 'Negative Pressure Therapy',
    insurance: 'Aetna',
    status: 'documents_requested',
    priority: 'high',
    submittedDate: '2024-03-14',
    lastUpdated: '2024-03-17',
    daysSinceSubmission: 4,
    daysPending: 4,
    hasUnreadMessages: true,
    patientId: 'P-1236',
    doctorId: 'D-003'
  },
  {
    id: '660e8400-e29b-41d4-a716-446655440004',
    ivrNumber: 'IVR-2024-004',
    patientName: 'Sarah Johnson',
    doctorName: 'Dr. Robert Chen',
    serviceType: 'Advanced Wound Care',
    insurance: 'Cigna',
    status: 'submitted',
    priority: 'low',
    submittedDate: '2024-03-18',
    lastUpdated: '2024-03-18',
    daysSinceSubmission: 1,
    daysPending: 1,
    hasUnreadMessages: false,
    patientId: 'P-1237',
    doctorId: 'D-004'
  },
  {
    id: '660e8400-e29b-41d4-a716-446655440005',
    ivrNumber: 'IVR-2024-005',
    patientName: 'Michael Brown',
    doctorName: 'Dr. Lisa Anderson',
    serviceType: 'Collagen Dressing Auth',
    insurance: 'Medicare',
    status: 'rejected',
    priority: 'medium',
    submittedDate: '2024-03-12',
    lastUpdated: '2024-03-16',
    daysSinceSubmission: 6,
    daysPending: 6,
    hasUnreadMessages: true,
    patientId: 'P-1238',
    doctorId: 'D-005'
  }
];

// Shared dashboard stats
export const mockDashboardStats: DashboardStats = {
  submitted: 8,
  inReview: 5,
  approved: 12,
  documentsRequested: 3,
  pendingApproval: 12
};

// Helper function to get stats from current data
export const calculateStatsFromData = (requests: SharedIVRRequest[]): DashboardStats => {
  return {
    submitted: requests.filter(r => r.status === 'submitted').length,
    inReview: requests.filter(r => r.status === 'in_review').length,
    approved: requests.filter(r => r.status === 'approved').length,
    documentsRequested: requests.filter(r => r.status === 'documents_requested').length,
    pendingApproval: requests.filter(r => r.status === 'pending_approval').length
  };
};