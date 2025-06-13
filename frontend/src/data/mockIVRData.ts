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
  // Hierarchy fields for filtering
  organizationId: string;
  territoryId?: string;
  networkId?: string;
  distributorNetworkId: string;
  requestingDoctorId: string;
  assignedSalesRepId?: string;
  distributorId?: string;
  salesRepId?: string;
  createdBy: string;
  assignedTo?: string;
  createdAt: string;
  updatedAt: string;
  insuranceProvider: string;
}

export interface DashboardStats {
  submitted: number;
  inReview: number;
  approved: number;
  documentsRequested: number;
  pendingApproval: number;
}

// Helper function to calculate actual days pending from submitted date
const calculateDaysPending = (submittedDate: string): number => {
  const submitted = new Date(submittedDate);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - submitted.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

// Helper function to create recent dates for realistic testing
const getRecentDate = (daysAgo: number): string => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString().split('T')[0]; // Returns YYYY-MM-DD format
};

// Helper function to create ISO timestamp
const getRecentTimestamp = (daysAgo: number): string => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString();
};

// Shared mock data - single source of truth for all IVR data with proper hierarchy
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
    submittedDate: getRecentDate(3), // 3 days ago
    lastUpdated: getRecentDate(1), // 1 day ago
    daysSinceSubmission: 3,
    daysPending: 3,
    hasUnreadMessages: false,
    patientId: 'P-1234',
    doctorId: 'D-001',
    estimatedCompletion: getRecentDate(-2), // 2 days from now
    // Hierarchy fields - Territory 1 (Regional Distributor's territory)
    organizationId: 'org-1',
    territoryId: 'territory-1',
    networkId: 'network-1',
    distributorNetworkId: 'network-1',
    requestingDoctorId: 'D-001',
    assignedSalesRepId: 'sales-rep-1',
    distributorId: 'regional-dist-1',
    salesRepId: 'sales-rep-1',
    createdBy: 'D-001',
    assignedTo: 'sales-rep-1',
    createdAt: getRecentTimestamp(3),
    updatedAt: getRecentTimestamp(1),
    insuranceProvider: 'Blue Cross Blue Shield'
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
    submittedDate: getRecentDate(2), // 2 days ago
    lastUpdated: getRecentDate(1), // 1 day ago
    daysSinceSubmission: 2,
    daysPending: 2,
    hasUnreadMessages: true,
    patientId: 'P-1235',
    doctorId: 'D-002',
    estimatedCompletion: getRecentDate(-3), // 3 days from now
    // Hierarchy fields - Territory 1 (Regional Distributor's territory)
    organizationId: 'org-1',
    territoryId: 'territory-1',
    networkId: 'network-1',
    distributorNetworkId: 'network-1',
    requestingDoctorId: 'D-002',
    assignedSalesRepId: 'sales-rep-1',
    distributorId: 'regional-dist-1',
    salesRepId: 'sales-rep-1',
    createdBy: 'D-002',
    assignedTo: 'sales-rep-1',
    createdAt: getRecentTimestamp(2),
    updatedAt: getRecentTimestamp(1),
    insuranceProvider: 'UnitedHealthcare'
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
    submittedDate: getRecentDate(4), // 4 days ago
    lastUpdated: getRecentDate(1), // 1 day ago
    daysSinceSubmission: 4,
    daysPending: 4,
    hasUnreadMessages: true,
    patientId: 'P-1236',
    doctorId: 'D-003',
    // Hierarchy fields - Territory 1 (Regional Distributor's territory)
    organizationId: 'org-1',
    territoryId: 'territory-1',
    networkId: 'network-1',
    distributorNetworkId: 'network-1',
    requestingDoctorId: 'D-003',
    assignedSalesRepId: 'sales-rep-1',
    distributorId: 'regional-dist-1',
    salesRepId: 'sales-rep-1',
    createdBy: 'D-003',
    assignedTo: 'sales-rep-1',
    createdAt: getRecentTimestamp(4),
    updatedAt: getRecentTimestamp(1),
    insuranceProvider: 'Aetna'
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
    submittedDate: getRecentDate(1), // 1 day ago
    lastUpdated: getRecentDate(1), // 1 day ago
    daysSinceSubmission: 1,
    daysPending: 1,
    hasUnreadMessages: false,
    patientId: 'P-1237',
    doctorId: 'D-004',
    // Hierarchy fields - Territory 2 (Different territory - should NOT be visible to regional-dist-1)
    organizationId: 'org-1',
    territoryId: 'territory-2',
    networkId: 'network-1',
    distributorNetworkId: 'network-1',
    requestingDoctorId: 'D-004',
    assignedSalesRepId: 'sales-rep-2',
    distributorId: 'regional-dist-2',
    salesRepId: 'sales-rep-2',
    createdBy: 'D-004',
    assignedTo: 'sales-rep-2',
    createdAt: getRecentTimestamp(1),
    updatedAt: getRecentTimestamp(1),
    insuranceProvider: 'Cigna'
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
    submittedDate: getRecentDate(6), // 6 days ago
    lastUpdated: getRecentDate(2), // 2 days ago
    daysSinceSubmission: 6,
    daysPending: 6,
    hasUnreadMessages: true,
    patientId: 'P-1238',
    doctorId: 'D-005',
    // Hierarchy fields - Territory 2 (Different territory - should NOT be visible to regional-dist-1)
    organizationId: 'org-1',
    territoryId: 'territory-2',
    networkId: 'network-1',
    distributorNetworkId: 'network-1',
    requestingDoctorId: 'D-005',
    assignedSalesRepId: 'sales-rep-2',
    distributorId: 'regional-dist-2',
    salesRepId: 'sales-rep-2',
    createdBy: 'D-005',
    assignedTo: 'sales-rep-2',
    createdAt: getRecentTimestamp(6),
    updatedAt: getRecentTimestamp(2),
    insuranceProvider: 'Medicare'
  },
  {
    id: '660e8400-e29b-41d4-a716-446655440006',
    ivrNumber: 'IVR-2024-006',
    patientName: 'Amanda Rodriguez',
    doctorName: 'Dr. Carlos Martinez',
    serviceType: 'Bioengineered Skin Substitute',
    insurance: 'Humana',
    status: 'pending_approval',
    priority: 'high',
    submittedDate: getRecentDate(5), // 5 days ago
    lastUpdated: getRecentDate(1), // 1 day ago
    daysSinceSubmission: 5,
    daysPending: 5,
    hasUnreadMessages: false,
    patientId: 'P-1239',
    doctorId: 'D-006',
    estimatedCompletion: getRecentDate(-1), // 1 day from now
    // Hierarchy fields - Territory 1 (Regional Distributor's territory)
    organizationId: 'org-1',
    territoryId: 'territory-1',
    networkId: 'network-1',
    distributorNetworkId: 'network-1',
    requestingDoctorId: 'D-006',
    assignedSalesRepId: 'sales-rep-1',
    distributorId: 'regional-dist-1',
    salesRepId: 'sales-rep-1',
    createdBy: 'D-006',
    assignedTo: 'sales-rep-1',
    createdAt: getRecentTimestamp(5),
    updatedAt: getRecentTimestamp(1),
    insuranceProvider: 'Humana'
  }
].map(request => ({
  ...request,
  // Recalculate days pending based on actual submitted date
  daysPending: calculateDaysPending(request.submittedDate),
  daysSinceSubmission: calculateDaysPending(request.submittedDate)
}));

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

// Export the calculation function for use in components
export { calculateDaysPending };