import { api } from '@/utils/api';

interface SystemMetrics {
  activeUsers: number;
  totalRequests: number;
  errorRate: number;
  userGrowth: number;
  requestGrowth: number;
  errorRateChange: number;
}

interface UserActivity {
  user: string;
  action: string;
  resource: string;
  timestamp: string;
}

interface ResourceUsage {
  name: string;
  usage: number;
  description: string;
}

export const analyticsService = {
  getSystemMetrics: async (): Promise<SystemMetrics> => {
    const response = await api.get('/api/v1/analytics/metrics');
    return response.data;
  },

  getUserActivity: async (): Promise<UserActivity[]> => {
    const response = await api.get('/api/v1/analytics/activity');
    return response.data;
  },

  getResourceUsage: async (): Promise<ResourceUsage[]> => {
    const response = await api.get('/api/v1/analytics/resources');
    return response.data;
  }
}; 