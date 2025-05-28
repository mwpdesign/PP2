import { api } from '@/utils/api';

interface ComplianceAlert {
  id: string;
  type: 'warning' | 'violation';
  description: string;
  timestamp: string;
  status: 'open' | 'resolved';
  severity: 'low' | 'medium' | 'high';
}

interface AuditLog {
  id: string;
  user: string;
  action: string;
  resource: string;
  timestamp: string;
  details: string;
  status: 'success' | 'failure';
}

export const complianceService = {
  getComplianceAlerts: async (): Promise<ComplianceAlert[]> => {
    const response = await api.get('/api/v1/compliance/alerts');
    return response.data;
  },

  getAuditLogs: async (): Promise<AuditLog[]> => {
    const response = await api.get('/api/v1/compliance/audit-logs');
    return response.data;
  },

  exportAuditLogs: async (): Promise<void> => {
    const response = await api.get('/api/v1/compliance/audit-logs/export', {
      responseType: 'blob'
    });
    
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `audit-logs-${new Date().toISOString()}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  }
}; 