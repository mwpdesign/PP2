import { api } from '@/utils/api';

interface SystemSettings {
  // General Settings
  platformName: string;
  supportEmail: string;
  supportPhone: string;
  maintenanceMode: boolean;

  // Security Settings
  passwordPolicy: {
    minLength: number;
    requireSpecialChar: boolean;
    requireNumber: boolean;
    requireUppercase: boolean;
    expiryDays: number;
  };

  // Compliance Settings
  hipaaLogging: boolean;
  auditRetentionDays: number;
  dataEncryption: boolean;

  // Integration Settings
  apiRateLimit: number;
  webhookUrl: string;
  enableWebhooks: boolean;

  // Notification Settings
  emailNotifications: boolean;
  smsNotifications: boolean;
  pushNotifications: boolean;
}

export const settingsService = {
  getSystemSettings: async (): Promise<SystemSettings> => {
    const response = await api.get('/api/v1/settings/system');
    return response.data;
  },

  updateSystemSettings: async (settings: SystemSettings): Promise<SystemSettings> => {
    const response = await api.put('/api/v1/settings/system', settings);
    return response.data;
  }
}; 