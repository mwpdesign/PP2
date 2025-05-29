import React from 'react';
import { Cog6ToothIcon, ShieldCheckIcon, UserGroupIcon, BellIcon, DocumentTextIcon, ArrowPathIcon, CommandLineIcon, KeyIcon } from '@heroicons/react/24/outline';

const SystemSettings: React.FC = () => {
  const settingSections = [
    {
      title: 'System Configuration',
      icon: Cog6ToothIcon,
      description: 'Core system settings and operational parameters',
      settings: [
        { name: 'Environment', value: 'Production', editable: false },
        { name: 'System Version', value: '2.1.0', editable: false },
        { name: 'Debug Mode', value: 'Disabled', editable: true },
      ]
    },
    {
      title: 'Security & Compliance',
      icon: ShieldCheckIcon,
      description: 'HIPAA compliance and security settings',
      settings: [
        { name: 'Session Timeout', value: '30 minutes', editable: true },
        { name: 'Password Policy', value: 'Enterprise', editable: true },
        { name: 'IP Whitelist', value: 'Enabled', editable: true },
      ]
    },
    {
      title: 'User Permissions',
      icon: UserGroupIcon,
      description: 'Default role permissions and access control',
      settings: [
        { name: 'Default Role', value: 'Basic User', editable: true },
        { name: 'MFA Requirement', value: 'Enabled', editable: true },
        { name: 'Session Limit', value: '3', editable: true },
      ]
    },
    {
      title: 'Notifications',
      icon: BellIcon,
      description: 'System notification preferences and channels',
      settings: [
        { name: 'Alert Channel', value: 'Email, SMS', editable: true },
        { name: 'Maintenance Alerts', value: 'Enabled', editable: true },
        { name: 'Security Alerts', value: 'High Priority', editable: true },
      ]
    },
    {
      title: 'Compliance Logging',
      icon: DocumentTextIcon,
      description: 'Audit trail and compliance logging settings',
      settings: [
        { name: 'Audit Detail Level', value: 'Full', editable: true },
        { name: 'Log Retention', value: '365 days', editable: true },
        { name: 'PHI Access Logging', value: 'Enabled', editable: false },
      ]
    },
    {
      title: 'Backup & Recovery',
      icon: ArrowPathIcon,
      description: 'System backup and disaster recovery settings',
      settings: [
        { name: 'Backup Frequency', value: '6 hours', editable: true },
        { name: 'Retention Period', value: '90 days', editable: true },
        { name: 'Auto-Recovery', value: 'Enabled', editable: true },
      ]
    },
    {
      title: 'API Configuration',
      icon: CommandLineIcon,
      description: 'API settings and rate limiting configuration',
      settings: [
        { name: 'Rate Limit', value: '1000/min', editable: true },
        { name: 'Timeout', value: '30 seconds', editable: true },
        { name: 'Version', value: 'v2', editable: true },
      ]
    },
    {
      title: 'License Management',
      icon: KeyIcon,
      description: 'System licensing and subscription settings',
      settings: [
        { name: 'License Type', value: 'Enterprise', editable: false },
        { name: 'Expiration', value: '2025-12-31', editable: false },
        { name: 'Features', value: 'All', editable: false },
      ]
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800">System Settings</h1>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
          Save Changes
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {settingSections.map((section, idx) => (
          <div key={idx} className="bg-white border border-slate-200 rounded-lg shadow-sm">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <section.icon className="h-6 w-6 text-slate-600 mr-3" />
                <div>
                  <h2 className="text-lg font-semibold text-slate-800">{section.title}</h2>
                  <p className="text-sm text-slate-500">{section.description}</p>
                </div>
              </div>
              <div className="space-y-4">
                {section.settings.map((setting, settingIdx) => (
                  <div key={settingIdx} className="flex items-center justify-between">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-slate-700">
                        {setting.name}
                      </label>
                      <div className="mt-1 flex rounded-md shadow-sm">
                        {setting.editable ? (
                          <input
                            type="text"
                            defaultValue={setting.value}
                            className="block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                          />
                        ) : (
                          <div className="block w-full py-2 text-sm text-slate-700">
                            {setting.value}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SystemSettings; 