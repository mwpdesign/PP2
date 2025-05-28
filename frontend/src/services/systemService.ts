import axios from 'axios';
import { SystemMetrics, SystemHealth, UserActivity } from '@/types/system';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

class SystemService {
  async getSystemMetrics(): Promise<SystemMetrics> {
    const response = await axios.get(`${API_BASE_URL}/api/v1/system/metrics`);
    return response.data;
  }

  async getSystemHealth(): Promise<SystemHealth> {
    const response = await axios.get(`${API_BASE_URL}/api/v1/system/health`);
    return response.data;
  }

  async getUserActivity(): Promise<UserActivity[]> {
    const response = await axios.get(`${API_BASE_URL}/api/v1/system/activity`);
    return response.data;
  }

  async getPerformanceData(timeframe: string = '24h'): Promise<any[]> {
    const response = await axios.get(`${API_BASE_URL}/api/v1/system/performance?timeframe=${timeframe}`);
    return response.data;
  }

  async getGeographicDistribution(): Promise<any[]> {
    const response = await axios.get(`${API_BASE_URL}/api/v1/system/geographic-distribution`);
    return response.data;
  }
}

export const systemService = new SystemService(); 