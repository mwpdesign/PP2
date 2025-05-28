import React, { useState, useEffect } from 'react';
import { Save, X } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsService } from '@/services/settingsService';

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

type SettingsRecord = Record<keyof SystemSettings, any>;

const SystemSettings: React.FC = () => {
  const [isEditing, setIsEditing] = useState(false);
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['system-settings'],
    queryFn: settingsService.getSystemSettings
  });

  const updateSettingsMutation = useMutation({
    mutationFn: settingsService.updateSystemSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-settings'] });
      setIsEditing(false);
    }
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
    category?: keyof SystemSettings,
    subField?: string
  ) => {
    const { name, value, type } = e.target;
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;

    if (!settings) return;

    const newSettings = { ...settings } as SettingsRecord;
    if (category && subField && category in newSettings) {
      const categoryObj = newSettings[category];
      if (typeof categoryObj === 'object') {
        newSettings[category] = {
          ...categoryObj,
          [subField]: type === 'checkbox' ? checked : value
        };
      }
    } else {
      newSettings[name as keyof SystemSettings] = type === 'checkbox' ? checked : value;
    }

    queryClient.setQueryData(['system-settings'], newSettings as SystemSettings);
  };

  const handleSave = async () => {
    if (!settings) return;
    await updateSettingsMutation.mutateAsync(settings);
  };

  const renderSection = (title: string, children: React.ReactNode) => (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">{title}</h3>
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-600"></div>
        </div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Failed to load system settings.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">System Settings</h1>
        <div className="flex space-x-3">
          {isEditing ? (
            <>
              <button
                onClick={() => setIsEditing(false)}
                className="flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                <X className="w-5 h-5 mr-2" />
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="flex items-center px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg"
              >
                <Save className="w-5 h-5 mr-2" />
                Save Changes
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg"
            >
              Edit Settings
            </button>
          )}
        </div>
      </div>

      <div className="space-y-6">
        {/* General Settings */}
        {renderSection('General Settings', (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Platform Name
              </label>
              <input
                type="text"
                name="platformName"
                value={settings.platformName}
                onChange={handleInputChange}
                disabled={!isEditing}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-600 disabled:bg-gray-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Support Email
              </label>
              <input
                type="email"
                name="supportEmail"
                value={settings.supportEmail}
                onChange={handleInputChange}
                disabled={!isEditing}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-600 disabled:bg-gray-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Support Phone
              </label>
              <input
                type="tel"
                name="supportPhone"
                value={settings.supportPhone}
                onChange={handleInputChange}
                disabled={!isEditing}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-600 disabled:bg-gray-100"
              />
            </div>
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="maintenanceMode"
                  checked={settings.maintenanceMode}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="rounded border-gray-300 text-slate-600 focus:ring-slate-500 disabled:bg-gray-100"
                />
                <span className="ml-2 text-sm text-gray-700">Maintenance Mode</span>
              </label>
            </div>
          </>
        ))}

        {/* Security Settings */}
        {renderSection('Security Settings', (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Minimum Password Length
              </label>
              <input
                type="number"
                name="minLength"
                value={settings.passwordPolicy.minLength}
                onChange={(e) => handleInputChange(e, 'passwordPolicy', 'minLength')}
                disabled={!isEditing}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-600 disabled:bg-gray-100"
              />
            </div>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="requireSpecialChar"
                  checked={settings.passwordPolicy.requireSpecialChar}
                  onChange={(e) => handleInputChange(e, 'passwordPolicy', 'requireSpecialChar')}
                  disabled={!isEditing}
                  className="rounded border-gray-300 text-slate-600 focus:ring-slate-500 disabled:bg-gray-100"
                />
                <span className="ml-2 text-sm text-gray-700">Require Special Character</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="requireNumber"
                  checked={settings.passwordPolicy.requireNumber}
                  onChange={(e) => handleInputChange(e, 'passwordPolicy', 'requireNumber')}
                  disabled={!isEditing}
                  className="rounded border-gray-300 text-slate-600 focus:ring-slate-500 disabled:bg-gray-100"
                />
                <span className="ml-2 text-sm text-gray-700">Require Number</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="requireUppercase"
                  checked={settings.passwordPolicy.requireUppercase}
                  onChange={(e) => handleInputChange(e, 'passwordPolicy', 'requireUppercase')}
                  disabled={!isEditing}
                  className="rounded border-gray-300 text-slate-600 focus:ring-slate-500 disabled:bg-gray-100"
                />
                <span className="ml-2 text-sm text-gray-700">Require Uppercase Letter</span>
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password Expiry (Days)
              </label>
              <input
                type="number"
                name="expiryDays"
                value={settings.passwordPolicy.expiryDays}
                onChange={(e) => handleInputChange(e, 'passwordPolicy', 'expiryDays')}
                disabled={!isEditing}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-600 disabled:bg-gray-100"
              />
            </div>
          </>
        ))}

        {/* Compliance Settings */}
        {renderSection('Compliance Settings', (
          <>
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="hipaaLogging"
                  checked={settings.hipaaLogging}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="rounded border-gray-300 text-slate-600 focus:ring-slate-500 disabled:bg-gray-100"
                />
                <span className="ml-2 text-sm text-gray-700">HIPAA Logging</span>
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Audit Log Retention (Days)
              </label>
              <input
                type="number"
                name="auditRetentionDays"
                value={settings.auditRetentionDays}
                onChange={handleInputChange}
                disabled={!isEditing}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-600 disabled:bg-gray-100"
              />
            </div>
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="dataEncryption"
                  checked={settings.dataEncryption}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="rounded border-gray-300 text-slate-600 focus:ring-slate-500 disabled:bg-gray-100"
                />
                <span className="ml-2 text-sm text-gray-700">Data Encryption</span>
              </label>
            </div>
          </>
        ))}

        {/* Integration Settings */}
        {renderSection('Integration Settings', (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                API Rate Limit (requests/hour)
              </label>
              <input
                type="number"
                name="apiRateLimit"
                value={settings.apiRateLimit}
                onChange={handleInputChange}
                disabled={!isEditing}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-600 disabled:bg-gray-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Webhook URL
              </label>
              <input
                type="url"
                name="webhookUrl"
                value={settings.webhookUrl}
                onChange={handleInputChange}
                disabled={!isEditing}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-600 disabled:bg-gray-100"
              />
            </div>
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="enableWebhooks"
                  checked={settings.enableWebhooks}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="rounded border-gray-300 text-slate-600 focus:ring-slate-500 disabled:bg-gray-100"
                />
                <span className="ml-2 text-sm text-gray-700">Enable Webhooks</span>
              </label>
            </div>
          </>
        ))}

        {/* Notification Settings */}
        {renderSection('Notification Settings', (
          <>
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="emailNotifications"
                  checked={settings.emailNotifications}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="rounded border-gray-300 text-slate-600 focus:ring-slate-500 disabled:bg-gray-100"
                />
                <span className="ml-2 text-sm text-gray-700">Email Notifications</span>
              </label>
            </div>
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="smsNotifications"
                  checked={settings.smsNotifications}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="rounded border-gray-300 text-slate-600 focus:ring-slate-500 disabled:bg-gray-100"
                />
                <span className="ml-2 text-sm text-gray-700">SMS Notifications</span>
              </label>
            </div>
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="pushNotifications"
                  checked={settings.pushNotifications}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="rounded border-gray-300 text-slate-600 focus:ring-slate-500 disabled:bg-gray-100"
                />
                <span className="ml-2 text-sm text-gray-700">Push Notifications</span>
              </label>
            </div>
          </>
        ))}
      </div>
    </div>
  );
};

export default SystemSettings; 