export enum IVRStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  IN_REVIEW = 'in_review',
  APPROVED = 'approved',
  REJECTED = 'rejected'
}

export enum IVRPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  firstName?: string;
  lastName?: string;
}

export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  primaryCondition?: string;
  lastVisitDate?: string;
  insuranceInfo: {
    provider: string;
    policyNumber: string;
    groupNumber: string;
    status: string;
  };
  documents?: Document[];
}

export interface Provider {
  id: string;
  name: string;
  speciality: string;
  npi: string;
}

export interface IVRDocument {
  id: string;
  ivrRequestId: string;
  documentType: string;
  documentKey: string;
  status: string;
  verificationNotes?: string;
  uploadedBy: User;
  url: string;
  createdAt: string;
  updatedAt: string;
}

export interface IVRStatusHistory {
  id: string;
  ivrRequestId: string;
  fromStatus: IVRStatus;
  toStatus: IVRStatus;
  reason?: string;
  userId: string;
  createdAt: string;
}

export interface IVRApproval {
  id: string;
  ivrRequestId: string;
  approvalLevel: number;
  decision: 'approved' | 'rejected';
  reason?: string;
  userId: string;
  createdAt: string;
}

export interface IVREscalation {
  id: string;
  ivrRequestId: string;
  reason: string;
  userId: string;
  status: 'pending' | 'resolved';
  resolution?: string;
  createdAt: string;
  resolvedAt?: string;
}

export interface IVRReview {
  id: string;
  reviewer: User;
  status: 'assigned' | 'in_progress' | 'completed';
  notes?: string;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
}

export interface IVRCommunicationMessage {
  id: string;
  author: User;
  message: string;
  createdAt: string;
}

export interface IVRReviewNote {
  id: string;
  ivrRequestId: string;
  note: string;
  author: User;
  createdAt: string;
  status: IVRStatus;
  isInternal: boolean;
}

export interface IVRRequest {
  id: string;
  patient: Patient;
  provider: Provider;
  serviceType: string;
  priority: IVRPriority;
  status: IVRStatus;
  documents: IVRDocument[];
  statusHistory: IVRStatusHistory[];
  approvals: IVRApproval[];
  escalations: IVREscalation[];
  facilityId: string;
  createdAt: string;
  updatedAt: string;

  // Add new fields
  reviewNotes: IVRReviewNote[];
  communication: IVRCommunicationMessage[];
  currentReviewer?: User;
  reviews: IVRReview[];
}

export interface IVRQueueParams {
  facilityId?: string;
  status?: IVRStatus;
  priority?: IVRPriority;
  reviewerId?: string;
  page?: number;
  size?: number;
  startDate?: string;
  endDate?: string;
  patientName?: string;
  providerName?: string;
  requestId?: string;
}

export interface IVRQueueResponse {
  items: IVRRequest[];
  total: number;
  page: number;
  size: number;
}

export interface IVRBatchAction {
  action: 'approve' | 'reject';
  requestIds: string[];
  reason?: string;
  approvalLevel?: number;
}

export interface IVRBatchResult {
  success: string[];
  failed: Record<string, string>;
}

export type ProductCategory = 'skin_graft' | 'collagen_matrix' | 'negative_pressure' | 'other';

export interface Product {
  id: string;
  name: string;
  code: string;
  category: string;
  description: string;
  size?: string;
}

export interface IVRTracking {
  id: string;
  createdBy: string;
  createdAt: string;
  lastUpdatedAt: string;
  lastUpdatedBy: string;
  status: IVRStatus;
  statusHistory: {
    status: IVRStatus;
    timestamp: string;
    updatedBy: string;
    notes?: string;
  }[];
}

export interface PhysicianInfo {
  id: string;
  name: string;
  npi: string;
  medicarePTAN: string;
  taxId: string;
  facility: {
    id: string;
    name: string;
    address: string;
    phone: string;
  };
}

export interface TreatmentInfo {
  skinSubstituteAcknowledged: boolean;
  qCode: string;
  startDate: string;
  numberOfApplications: number;
  frequency: 'weekly' | 'bi-weekly' | 'monthly' | 'other';
  totalSurfaceArea: number;
  diagnosisCodes: {
    code: string;
    description: string;
    isPrimary: boolean;
  }[];
  clinicalNotes: string;
}

export interface InsuranceDetails {
  verificationStatus: 'pending' | 'verified' | 'failed';
  verificationDate?: string;
  policyNumber: string;
  groupNumber?: string;
  preAuthRequired: boolean;
  preAuthNumber?: string;
  coverageNotes?: string;
}

export interface Document {
  id: string;
  name: string;
  type: string;
  url: string;
  uploadedAt: string;
  status: 'pending' | 'verified' | 'rejected';
  size?: number;
  file?: File;
}

export interface IVRFormData {
  patientId: string;
  status: IVRStatus;
  createdAt: string;
  updatedAt: string;
  selectedProducts: {
    id: string;
    name: string;
    category: string;
    size?: string;
    quantity: number;
  }[];
  treatmentInfo: TreatmentInfo;
  insuranceDetails: InsuranceDetails;
  supportingDocuments: Document[];
  tracking: IVRTracking;
  physician: PhysicianInfo;
}

export interface DocumentAnnotation {
  id: string;
  documentId: string;
  text: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  type: 'highlight' | 'text' | 'drawing';
  color: string;
  points?: number[];
  createdAt: string;
  updatedAt: string;
}

// Mock data for development
export const mockProducts: Product[] = [
  {
    id: 'P1',
    name: 'Advanced Wound Dressing',
    code: 'AWD-001',
    category: 'Wound Care',
    description: 'Advanced dressing for chronic wounds',
    size: '4" x 4"'
  },
  {
    id: 'P2',
    name: 'Compression Bandage',
    code: 'CB-002',
    category: 'Compression',
    description: 'High-compression bandage system',
    size: '6" x 8 yards'
  },
  {
    id: 'P3',
    name: 'Negative Pressure Device',
    code: 'NPD-003',
    category: 'Negative Pressure',
    description: 'Portable negative pressure wound therapy device'
  },
  {
    id: 'P4',
    name: 'Collagen Matrix',
    code: 'CM-004',
    category: 'Biologics',
    description: 'Advanced wound matrix with collagen',
    size: '2" x 2"'
  },
  {
    id: 'P5',
    name: 'Antimicrobial Dressing',
    code: 'AD-005',
    category: 'Wound Care',
    description: 'Silver-infused antimicrobial dressing',
    size: '4" x 5"'
  }
];

// Add Q Code options
export const QCodeOptions = [
  { value: 'Q4101', label: 'Q4101 - Apligraf' },
  { value: 'Q4102', label: 'Q4102 - Oasis Wound Matrix' },
  { value: 'Q4106', label: 'Q4106 - Dermagraft' },
  { value: 'Q4110', label: 'Q4110 - PriMatrix' },
  { value: 'Q4116', label: 'Q4116 - Alloderm' },
  { value: 'Q4121', label: 'Q4121 - TheraSkin' },
  { value: 'Q4124', label: 'Q4124 - OASIS Ultra Tri-Layer Matrix' },
  { value: 'Q4128', label: 'Q4128 - FlexHD' },
  { value: 'Q4132', label: 'Q4132 - Grafix Core' },
  { value: 'Q4133', label: 'Q4133 - Grafix Prime' }
];

export const FrequencyOptions = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'bi-weekly', label: 'Bi-weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'other', label: 'Other' }
];