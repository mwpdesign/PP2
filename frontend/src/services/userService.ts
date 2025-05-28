import { User, Role } from '@/types/user';
import { api } from '@/utils/api';

interface CreateUserData {
  name: string;
  email: string;
  role: string;
  status: 'active' | 'inactive';
  password: string;
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

export const userService = {
  getAllUsers: async (): Promise<User[]> => {
    const response = await api.get('/api/v1/users');
    return response.data;
  },

  getUser: async (id: string): Promise<User> => {
    const response = await api.get(`/api/v1/users/${id}`);
    return response.data;
  },

  createUser: async (data: CreateUserData): Promise<User> => {
    const response = await api.post('/api/v1/users', data);
    return response.data;
  },

  updateUser: async (data: UpdateUserData): Promise<User> => {
    const response = await api.put(`/api/v1/users/${data.id}`, data);
    return response.data;
  },

  deleteUser: async (id: string): Promise<void> => {
    await api.delete(`/api/v1/users/${id}`);
  },

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

  getAllPermissions: async (): Promise<Permission[]> => {
    const response = await api.get('/api/v1/permissions');
    return response.data;
  }
}; 