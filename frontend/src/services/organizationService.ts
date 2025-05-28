import { api } from '@/utils/api';

interface Organization {
  id: string;
  name: string;
  type: 'hospital' | 'clinic' | 'laboratory';
  address: string;
  phone: string;
  email: string;
  status: 'active' | 'inactive';
  providerCount: number;
  createdAt: string;
  updatedAt: string;
}

interface CreateOrganizationData {
  name: string;
  type: 'hospital' | 'clinic' | 'laboratory';
  address: string;
  phone: string;
  email: string;
  status: 'active' | 'inactive';
}

interface UpdateOrganizationData extends CreateOrganizationData {
  id: string;
}

export const organizationService = {
  getAllOrganizations: async (): Promise<Organization[]> => {
    const response = await api.get('/api/v1/organizations');
    return response.data;
  },

  getOrganization: async (id: string): Promise<Organization> => {
    const response = await api.get(`/api/v1/organizations/${id}`);
    return response.data;
  },

  createOrganization: async (data: CreateOrganizationData): Promise<Organization> => {
    const response = await api.post('/api/v1/organizations', data);
    return response.data;
  },

  updateOrganization: async (data: UpdateOrganizationData): Promise<Organization> => {
    const response = await api.put(`/api/v1/organizations/${data.id}`, data);
    return response.data;
  },

  deleteOrganization: async (id: string): Promise<void> => {
    await api.delete(`/api/v1/organizations/${id}`);
  }
}; 