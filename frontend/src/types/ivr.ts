export enum IVRStatus {
  SUBMITTED = 'submitted',
  IN_REVIEW = 'in_review',
  PENDING_APPROVAL = 'pending_approval',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  ESCALATED = 'escalated',
  CANCELLED = 'cancelled',
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
}

export interface Patient {
  id: string;
  name: string;
  dateOfBirth: string;
  insuranceInfo: {
    provider: string;
    policyNumber: string;
    groupNumber: string;
  };
}

export interface Provider {
  id: string;
  name: string;
  speciality: string;
  npi: string;
  territory: string;
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
  territoryId: string;
  facilityId: string;
  createdAt: string;
  updatedAt: string;
  
  // Relationships
  currentReviewer?: User;
  reviews: IVRReview[];
}

export interface IVRQueueParams {
  territoryId?: string;
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