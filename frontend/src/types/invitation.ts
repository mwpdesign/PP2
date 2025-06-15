// Invitation system types for Healthcare IVR Platform
// Task ID: mbvu8p4nc9bidurxtvc
// Phase 4: Frontend Integration

export interface Invitation {
  id: string;
  email: string;
  invitation_token: string;
  invitation_type: InvitationType;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  organization_id?: string;
  role_name: string;
  status: InvitationStatus;
  invited_by_id?: string;
  invited_at: string;
  sent_at?: string;
  accepted_at?: string;
  expires_at: string;
  invitation_message?: string;
  invitation_metadata?: Record<string, any>;
  email_attempts: number;
  email_delivery_status?: EmailDeliveryStatus;
  is_expired: boolean;
  is_pending: boolean;
  is_accepted: boolean;
  days_until_expiry: number;
  created_at: string;
  updated_at: string;
}

export type InvitationType =
  | 'doctor'
  | 'sales'
  | 'distributor'
  | 'master_distributor'
  | 'office_admin'
  | 'medical_staff'
  | 'ivr_company'
  | 'shipping_logistics'
  | 'admin'
  | 'chp_admin';

export type InvitationStatus =
  | 'pending'
  | 'sent'
  | 'accepted'
  | 'expired'
  | 'cancelled'
  | 'failed';

export type EmailDeliveryStatus =
  | 'pending'
  | 'delivered'
  | 'bounced'
  | 'failed';

export interface InvitationCreateRequest {
  email: string;
  invitation_type: InvitationType;
  role_name: string;
  organization_id?: string;
  first_name?: string;
  last_name?: string;
  invitation_message?: string;
  expires_in_days?: number;
  parent_sales_id?: string;
  parent_distributor_id?: string;
  parent_master_distributor_id?: string;
  parent_doctor_id?: string;
}

export interface DoctorInvitationRequest {
  email: string;
  organization_id: string;
  first_name?: string;
  last_name?: string;
  invitation_message?: string;
}

export interface SalesInvitationRequest {
  email: string;
  organization_id: string;
  parent_distributor_id?: string;
  first_name?: string;
  last_name?: string;
  invitation_message?: string;
}

export interface PracticeStaffInvitationRequest {
  email: string;
  organization_id: string;
  staff_role: 'office_admin' | 'medical_staff';
  first_name?: string;
  last_name?: string;
  invitation_message?: string;
}

export interface InvitationAcceptRequest {
  password: string;
  phone?: string;
  additional_data?: Record<string, any>;
}

export interface InvitationListResponse {
  invitations: Invitation[];
  total_count: number;
  limit: number;
  offset: number;
  has_more: boolean;
}

export interface InvitationAcceptResponse {
  invitation: Invitation;
  user_id: string;
  message: string;
}

export interface InvitationStatistics {
  total_invitations: number;
  pending_invitations: number;
  sent_invitations: number;
  accepted_invitations: number;
  expired_invitations: number;
  cancelled_invitations: number;
  failed_invitations: number;
  acceptance_rate: number;
  average_acceptance_time_hours: number;
  invitations_by_type: Record<InvitationType, number>;
  invitations_by_day: Array<{
    date: string;
    count: number;
  }>;
}

export interface InvitationValidationResponse {
  is_valid: boolean;
  invitation?: Invitation;
  error?: string;
  error_message?: string;
  can_accept: boolean;
  expires_in_hours?: number;
}

export interface BulkInvitationRequest {
  invitations: InvitationCreateRequest[];
  send_immediately?: boolean;
}

export interface BulkInvitationResponse {
  successful_invitations: Invitation[];
  failed_invitations: Array<{
    request: InvitationCreateRequest;
    error: string;
  }>;
  total_requested: number;
  total_successful: number;
  total_failed: number;
}

export interface InvitationFilters {
  organization_id?: string;
  invitation_type?: InvitationType;
  status?: InvitationStatus;
  invited_by_id?: string;
  search?: string;
}

export interface InvitationListParams extends InvitationFilters {
  limit?: number;
  offset?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}