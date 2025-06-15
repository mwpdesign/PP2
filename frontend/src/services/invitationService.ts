// Invitation service for Healthcare IVR Platform
// Task ID: mbvu8p4nc9bidurxtvc
// Phase 4: Frontend Integration

import { apiClient } from './apiClient';
import {
  Invitation,
  InvitationCreateRequest,
  DoctorInvitationRequest,
  SalesInvitationRequest,
  PracticeStaffInvitationRequest,
  InvitationAcceptRequest,
  InvitationListResponse,
  InvitationAcceptResponse,
  InvitationStatistics,
  InvitationValidationResponse,
  BulkInvitationRequest,
  BulkInvitationResponse,
  InvitationListParams
} from '../types/invitation';

class InvitationService {
  private baseUrl = '/api/v1/invitations';

  // ==================== INVITATION CREATION ====================

  async createInvitation(data: InvitationCreateRequest): Promise<Invitation> {
    const response = await apiClient.post<Invitation>(this.baseUrl, data);
    return response.data;
  }

  async createDoctorInvitation(data: DoctorInvitationRequest): Promise<Invitation> {
    const response = await apiClient.post<Invitation>(`${this.baseUrl}/doctors`, data);
    return response.data;
  }

  async createSalesInvitation(data: SalesInvitationRequest): Promise<Invitation> {
    const response = await apiClient.post<Invitation>(`${this.baseUrl}/sales`, data);
    return response.data;
  }

  async createPracticeStaffInvitation(data: PracticeStaffInvitationRequest): Promise<Invitation> {
    const response = await apiClient.post<Invitation>(`${this.baseUrl}/practice-staff`, data);
    return response.data;
  }

  // ==================== INVITATION RETRIEVAL ====================

  async listInvitations(params?: InvitationListParams): Promise<InvitationListResponse> {
    const response = await apiClient.get<InvitationListResponse>(this.baseUrl, { params });
    return response.data;
  }

  async getInvitation(invitationId: string): Promise<Invitation> {
    const response = await apiClient.get<Invitation>(`${this.baseUrl}/${invitationId}`);
    return response.data;
  }

  async getPendingInvitations(limit = 50): Promise<Invitation[]> {
    const response = await apiClient.get<Invitation[]>(`${this.baseUrl}/pending/list`, {
      params: { limit }
    });
    return response.data;
  }

  // ==================== INVITATION LIFECYCLE ====================

  async sendInvitation(invitationId: string): Promise<Invitation> {
    const response = await apiClient.post<Invitation>(`${this.baseUrl}/${invitationId}/send`);
    return response.data;
  }

  async resendInvitation(invitationId: string): Promise<Invitation> {
    const response = await apiClient.post<Invitation>(`${this.baseUrl}/${invitationId}/resend`);
    return response.data;
  }

  async acceptInvitation(token: string, data: InvitationAcceptRequest): Promise<InvitationAcceptResponse> {
    const response = await apiClient.post<InvitationAcceptResponse>(`${this.baseUrl}/accept/${token}`, data);
    return response.data;
  }

  async cancelInvitation(invitationId: string): Promise<Invitation> {
    const response = await apiClient.post<Invitation>(`${this.baseUrl}/${invitationId}/cancel`);
    return response.data;
  }

  async extendInvitationExpiry(invitationId: string, days = 7): Promise<Invitation> {
    const response = await apiClient.post<Invitation>(`${this.baseUrl}/${invitationId}/extend`, null, {
      params: { days }
    });
    return response.data;
  }

  // ==================== PUBLIC ENDPOINTS ====================

  async validateInvitationToken(token: string): Promise<InvitationValidationResponse> {
    const response = await apiClient.get<InvitationValidationResponse>(`${this.baseUrl}/validate/${token}`);
    return response.data;
  }

  async getInvitationUrl(invitationId: string, baseUrl: string): Promise<{ url: string }> {
    const response = await apiClient.get<{ url: string }>(`${this.baseUrl}/${invitationId}/url`, {
      params: { base_url: baseUrl }
    });
    return response.data;
  }

  // ==================== STATISTICS ====================

  async getInvitationStatistics(organizationId?: string, days = 30): Promise<InvitationStatistics> {
    const response = await apiClient.get<InvitationStatistics>(`${this.baseUrl}/statistics/summary`, {
      params: { organization_id: organizationId, days }
    });
    return response.data;
  }

  // ==================== BULK OPERATIONS ====================

  async createBulkInvitations(data: BulkInvitationRequest): Promise<BulkInvitationResponse> {
    const response = await apiClient.post<BulkInvitationResponse>(`${this.baseUrl}/bulk/create`, data);
    return response.data;
  }

  async expireOldInvitations(): Promise<{ expired_count: number }> {
    const response = await apiClient.post<{ expired_count: number }>(`${this.baseUrl}/bulk/expire-old`);
    return response.data;
  }

  async cleanupOldInvitations(daysOld = 90): Promise<{ deleted_count: number }> {
    const response = await apiClient.delete<{ deleted_count: number }>(`${this.baseUrl}/bulk/cleanup`, {
      params: { days_old: daysOld }
    });
    return response.data;
  }

  // ==================== UTILITY METHODS ====================

  getInvitationTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      doctor: 'Doctor',
      sales: 'Sales Representative',
      distributor: 'Distributor',
      master_distributor: 'Master Distributor',
      office_admin: 'Office Administrator',
      medical_staff: 'Medical Staff',
      ivr_company: 'IVR Company',
      shipping_logistics: 'Shipping & Logistics',
      admin: 'Administrator',
      chp_admin: 'CHP Administrator'
    };
    return labels[type] || type;
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      pending: 'Pending',
      sent: 'Sent',
      accepted: 'Accepted',
      expired: 'Expired',
      cancelled: 'Cancelled',
      failed: 'Failed'
    };
    return labels[status] || status;
  }

  getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      pending: 'text-yellow-600 bg-yellow-100',
      sent: 'text-blue-600 bg-blue-100',
      accepted: 'text-green-600 bg-green-100',
      expired: 'text-red-600 bg-red-100',
      cancelled: 'text-gray-600 bg-gray-100',
      failed: 'text-red-600 bg-red-100'
    };
    return colors[status] || 'text-gray-600 bg-gray-100';
  }

  formatExpiryDate(expiresAt: string): string {
    const date = new Date(expiresAt);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return 'Expired';
    } else if (diffDays === 0) {
      return 'Expires today';
    } else if (diffDays === 1) {
      return 'Expires tomorrow';
    } else {
      return `Expires in ${diffDays} days`;
    }
  }
}

export const invitationService = new InvitationService();