/**
 * Dashboard Service
 * Handles API calls for dashboard statistics and analytics
 */

import { config } from '../config';

export interface DashboardKPICard {
  title: string;
  value: number | string;
  trend: number;
  icon: string;
  color: string;
}

export interface DashboardStats {
  role: string;
  period_days: number;
  kpi_cards: Record<string, DashboardKPICard>;
  detailed_stats?: Record<string, any>;
  generated_at: string;
}

export interface TrendData {
  date: string;
  value: number;
}

export interface DashboardTrends {
  metric: string;
  period_days: number;
  trend_data: TrendData[];
  generated_at: string;
}

class DashboardService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = config.getAPIEndpoint('/api/v1/dashboard');
  }

  /**
   * Get dashboard statistics for the current user
   */
  async getDashboardStats(days: number = 30): Promise<DashboardStats> {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${this.baseUrl}/stats?days=${days}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication failed');
        }
        if (response.status === 403) {
          throw new Error('Access denied');
        }
        throw new Error(`Failed to fetch dashboard stats: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      throw error;
    }
  }

  /**
   * Get trend data for dashboard charts
   */
  async getDashboardTrends(
    metric: 'ivrs' | 'orders' | 'patients',
    days: number = 30
  ): Promise<DashboardTrends> {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(
        `${this.baseUrl}/trends?metric=${metric}&days=${days}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication failed');
        }
        if (response.status === 403) {
          throw new Error('Access denied');
        }
        throw new Error(`Failed to fetch dashboard trends: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching dashboard trends:', error);
      throw error;
    }
  }

  /**
   * Get mock dashboard stats as fallback
   */
  getMockDashboardStats(role: string): DashboardStats {
    const mockStats: Record<string, DashboardStats> = {
      doctor: {
        role: 'doctor',
        period_days: 30,
        kpi_cards: {
          patients: {
            title: 'Total Patients',
            value: 47,
            trend: 12,
            icon: 'users',
            color: 'blue'
          },
          ivr_requests: {
            title: 'IVR Requests',
            value: 28,
            trend: -5,
            icon: 'clipboard-document-check',
            color: 'green'
          },
          pending_approvals: {
            title: 'Pending Approvals',
            value: 8,
            trend: 0,
            icon: 'clock',
            color: 'amber'
          },
          active_orders: {
            title: 'Active Orders',
            value: 12,
            trend: 8,
            icon: 'archive-box',
            color: 'purple'
          }
        },
        generated_at: new Date().toISOString()
      },
      ivr_company: {
        role: 'ivr_company',
        period_days: 30,
        kpi_cards: {
          in_review: {
            title: 'In Review',
            value: 5,
            trend: 0,
            icon: 'eye',
            color: 'amber'
          },
          documents_requested: {
            title: 'Documents Requested',
            value: 3,
            trend: 0,
            icon: 'document-text',
            color: 'purple'
          },
          pending_approval: {
            title: 'Pending Approval',
            value: 12,
            trend: 0,
            icon: 'clock',
            color: 'emerald'
          },
          approved_today: {
            title: 'Approved Today',
            value: 8,
            trend: 0,
            icon: 'check-circle',
            color: 'green'
          }
        },
        generated_at: new Date().toISOString()
      },
      sales: {
        role: 'sales',
        period_days: 30,
        kpi_cards: {
          total_doctors: {
            title: 'Total Doctors',
            value: 12,
            trend: 20,
            icon: 'user-group',
            color: 'blue'
          },
          ivr_requests: {
            title: 'IVR Requests',
            value: 45,
            trend: 15,
            icon: 'clipboard-document-check',
            color: 'green'
          },
          active_orders: {
            title: 'Active Orders',
            value: 35,
            trend: -5,
            icon: 'archive-box',
            color: 'purple'
          },
          monthly_revenue: {
            title: 'Monthly Revenue',
            value: '$45,200',
            trend: 12.3,
            icon: 'currency-dollar',
            color: 'emerald'
          }
        },
        generated_at: new Date().toISOString()
      }
    };

    return mockStats[role] || mockStats.doctor;
  }
}

export const dashboardService = new DashboardService();
export default dashboardService;