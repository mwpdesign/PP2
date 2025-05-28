import { User, Role } from '@/types/user';
import { api } from '@/utils/api';

interface CreateUserData {
  // Basic Info
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
  status?: 'active' | 'draft' | 'inactive';
  
  // Doctor Fields
  medicalLicense?: string;
  npiNumber?: string;
  specialty?: string;
  practiceName?: string;
  credentials?: File | null;
  credentialsUrl?: string;

  // Facility Information
  facilityName?: string;
  medicarePtan?: string;
  taxId?: string;
  medicaidProvider?: string;
  officeContact?: string;
  facilityPhone?: string;
  facilityFax?: string;
  facilityEmail?: string;

  // Shipping Information
  shippingAddressLine1?: string;
  shippingAddressLine2?: string;
  shippingCity?: string;
  shippingState?: string;
  shippingZip?: string;
  shippingInstructions?: string;

  // Doctor's Assistant Fields
  positionTitle?: string;
  certification?: string;
  yearsExperience?: string;
  assignedDoctor?: string;
  accessLevel?: string;
  coverageHoursStart?: string;
  coverageHoursEnd?: string;
  ivrResponseAuthority?: string;
  patientDataAuthority?: string;
  employeeId?: string;
  hipaaTrainingDate?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
}

interface UpdateUserData extends Partial<CreateUserData> {
  id: string;
}

interface CreateRoleData {
  name: string;
  description: string;
  permissions: string[];
}

interface UpdateRoleData extends CreateRoleData {
  id: string;
}

interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
}

interface UserFilters {
  role?: string;
  status?: 'active' | 'inactive' | 'archived';
  dateCreated?: string;
  lastLogin?: string;
}

interface SearchParams extends UserFilters {
  query?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

interface UserSearchParams {
  query?: string;
  role?: string;
  status?: 'active' | 'inactive' | 'archived';
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface UserSearchResponse {
  users: User[];
  total: number;
  page: number;
  limit: number;
}

interface ResetPasswordResponse {
  success: boolean;
  message: string;
  temporaryPassword?: string;
}

export const userService = {
  // User Management
  getAllUsers: async (): Promise<User[]> => {
    const response = await api.get('/api/v1/users');
    return response.data;
  },

  searchUsers: async (params: UserSearchParams): Promise<UserSearchResponse> => {
    const queryParams = new URLSearchParams();
    if (params.query) queryParams.append('query', params.query);
    if (params.role) queryParams.append('role', params.role);
    if (params.status) queryParams.append('status', params.status);
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);

    const response = await api.get(`/api/v1/users/search?${queryParams.toString()}`);
    return response.data;
  },

  getUser: async (id: string): Promise<User> => {
    const response = await api.get(`/api/v1/users/${id}`);
    return response.data;
  },

  createUser: async (data: CreateUserData): Promise<User> => {
    // Handle file upload for credentials if present
    if (data.credentials) {
      const formData = new FormData();
      formData.append('credentials', data.credentials);
      
      // Upload credentials first
      const uploadResponse = await api.post('/api/v1/users/upload-credentials', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Remove the file object and add the uploaded file URL
      delete data.credentials;
      data.credentialsUrl = uploadResponse.data.url;
    }

    const response = await api.post('/api/v1/users', data);
    return response.data;
  },

  updateUser: async (data: UpdateUserData): Promise<User> => {
    // Handle file upload for credentials if present
    if (data.credentials) {
      const formData = new FormData();
      formData.append('credentials', data.credentials);
      
      // Upload credentials first
      const uploadResponse = await api.post('/api/v1/users/upload-credentials', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Remove the file object and add the uploaded file URL
      delete data.credentials;
      data.credentialsUrl = uploadResponse.data.url;
    }

    const response = await api.put(`/api/v1/users/${data.id}`, data);
    return response.data;
  },

  archiveUser: async (id: string): Promise<void> => {
    await api.put(`/api/v1/users/${id}/archive`);
  },

  bulkArchiveUsers: async (ids: string[]): Promise<void> => {
    await api.post('/api/v1/users/bulk-archive', { ids });
  },

  resetPassword: async (id: string): Promise<ResetPasswordResponse> => {
    const response = await api.post(`/api/v1/users/${id}/reset-password`);
    return response.data;
  },

  bulkResetPasswords: async (ids: string[]): Promise<ResetPasswordResponse[]> => {
    const response = await api.post('/api/v1/users/bulk-reset-password', { ids });
    return response.data;
  },

  // Role Management
  getAllRoles: async (): Promise<Role[]> => {
    const response = await api.get('/api/v1/roles');
    return response.data;
  },

  getRole: async (id: string): Promise<Role> => {
    const response = await api.get(`/api/v1/roles/${id}`);
    return response.data;
  },

  createRole: async (data: CreateRoleData): Promise<Role> => {
    const response = await api.post('/api/v1/roles', data);
    return response.data;
  },

  updateRole: async (data: UpdateRoleData): Promise<Role> => {
    const response = await api.put(`/api/v1/roles/${data.id}`, data);
    return response.data;
  },

  deleteRole: async (id: string): Promise<void> => {
    await api.delete(`/api/v1/roles/${id}`);
  },

  // Permission Management
  getAllPermissions: async (): Promise<Permission[]> => {
    const response = await api.get('/api/v1/permissions');
    return response.data;
  },

  // Doctor's Assistant Management
  getAssignableDoctors: async (): Promise<User[]> => {
    const response = await api.get('/api/v1/users/doctors');
    return response.data;
  },

  getAssistants: async (doctorId: string): Promise<User[]> => {
    const response = await api.get(`/api/v1/users/doctors/${doctorId}/assistants`);
    return response.data;
  },

  // Search users with filters
  async searchUsersWithFilters(params: SearchParams): Promise<PaginatedResponse<User>> {
    const response = await api.get('/api/users', { params });
    return response.data;
  },

  // Get user statistics
  async getUserStats(): Promise<{
    totalUsers: number;
    activeUsers: number;
    usersByRole: Record<Role, number>;
    recentLogins: number;
  }> {
    const response = await api.get('/api/users/stats');
    return response.data;
  },

  // Bulk operations
  async bulkArchive(ids: string[]): Promise<void> {
    await api.post('/api/users/bulk-archive', { ids });
  },

  async bulkUpdateStatus(ids: string[], status: 'active' | 'inactive'): Promise<void> {
    await api.post('/api/users/bulk-status', { ids, status });
  }
}; 