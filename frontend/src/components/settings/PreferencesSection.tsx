import React, { useState } from 'react';
import { Settings, Save, X, Bell, Moon, Globe } from 'lucide-react';

interface Preferences {
  // Display Settings
  theme: 'light' | 'dark' | 'system';
  language: string;
  timezone: string;
  dateFormat: string;

  // Notification Preferences
  emailNotifications: boolean;
  smsNotifications: boolean;
  orderUpdates: boolean;
  patientReminders: boolean;
  systemAlerts: boolean;

  // Order Preferences
  defaultShippingMethod: string;
  autoApproveOrders: boolean;
  showOrderNotes: boolean;
  requireSignature: boolean;
}

const PreferencesSection: React.FC = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [preferences, setPreferences] = useState<Preferences>({
    // Display Settings
    theme: 'system',
    language: 'en-US',
    timezone: 'America/New_York',
    dateFormat: 'MM/DD/YYYY',

    // Notification Preferences
    emailNotifications: true,
    smsNotifications: true,
    orderUpdates: true,
    patientReminders: true,
    systemAlerts: true,

    // Order Preferences
    defaultShippingMethod: 'standard',
    autoApproveOrders: false,
    showOrderNotes: true,
    requireSignature: true,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setPreferences(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleSave = () => {
    // TODO: Implement save functionality
    setIsEditing(false);
  };

  const handleCancel = () => {
    // TODO: Reset preferences to original values
    setIsEditing(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Settings className="w-5 h-5 text-slate-600" />
          <h2 className="text-xl font-semibold text-slate-800">Preferences</h2>
        </div>
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 text-sm bg-slate-600 text-white rounded-md hover:bg-slate-700"
          >
            Edit Preferences
          </button>
        ) : (
          <div className="space-x-2">
            <button
              onClick={handleSave}
              className="px-4 py-2 text-sm bg-slate-600 text-white rounded-md hover:bg-slate-700"
            >
              <Save className="w-4 h-4 inline-block mr-1" />
              Save
            </button>
            <button
              onClick={handleCancel}
              className="px-4 py-2 text-sm bg-white border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50"
            >
              <X className="w-4 h-4 inline-block mr-1" />
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* Display Settings */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Moon className="w-5 h-5 text-slate-600" />
          <h3 className="text-lg font-medium text-slate-800">Display Settings</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700">Theme</label>
            <select
              name="theme"
              value={preferences.theme}
              onChange={handleInputChange}
              disabled={!isEditing}
              className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-slate-500 focus:ring-slate-500"
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="system">System Default</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Language</label>
            <select
              name="language"
              value={preferences.language}
              onChange={handleInputChange}
              disabled={!isEditing}
              className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-slate-500 focus:ring-slate-500"
            >
              <option value="en-US">English (US)</option>
              <option value="es-ES">Español</option>
              <option value="fr-FR">Français</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Time Zone</label>
            <select
              name="timezone"
              value={preferences.timezone}
              onChange={handleInputChange}
              disabled={!isEditing}
              className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-slate-500 focus:ring-slate-500"
            >
              <option value="America/New_York">Eastern Time (ET)</option>
              <option value="America/Chicago">Central Time (CT)</option>
              <option value="America/Denver">Mountain Time (MT)</option>
              <option value="America/Los_Angeles">Pacific Time (PT)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Date Format</label>
            <select
              name="dateFormat"
              value={preferences.dateFormat}
              onChange={handleInputChange}
              disabled={!isEditing}
              className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-slate-500 focus:ring-slate-500"
            >
              <option value="MM/DD/YYYY">MM/DD/YYYY</option>
              <option value="DD/MM/YYYY">DD/MM/YYYY</option>
              <option value="YYYY-MM-DD">YYYY-MM-DD</option>
            </select>
          </div>
        </div>
      </div>

      {/* Notification Preferences */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Bell className="w-5 h-5 text-slate-600" />
          <h3 className="text-lg font-medium text-slate-800">Notification Preferences</h3>
        </div>
        <div className="space-y-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              name="emailNotifications"
              checked={preferences.emailNotifications}
              onChange={handleInputChange}
              disabled={!isEditing}
              className="h-4 w-4 rounded border-slate-300 text-slate-600 focus:ring-slate-500"
            />
            <label className="ml-2 block text-sm text-slate-700">
              Email Notifications
            </label>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              name="smsNotifications"
              checked={preferences.smsNotifications}
              onChange={handleInputChange}
              disabled={!isEditing}
              className="h-4 w-4 rounded border-slate-300 text-slate-600 focus:ring-slate-500"
            />
            <label className="ml-2 block text-sm text-slate-700">
              SMS Notifications
            </label>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              name="orderUpdates"
              checked={preferences.orderUpdates}
              onChange={handleInputChange}
              disabled={!isEditing}
              className="h-4 w-4 rounded border-slate-300 text-slate-600 focus:ring-slate-500"
            />
            <label className="ml-2 block text-sm text-slate-700">
              Order Status Updates
            </label>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              name="patientReminders"
              checked={preferences.patientReminders}
              onChange={handleInputChange}
              disabled={!isEditing}
              className="h-4 w-4 rounded border-slate-300 text-slate-600 focus:ring-slate-500"
            />
            <label className="ml-2 block text-sm text-slate-700">
              Patient Appointment Reminders
            </label>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              name="systemAlerts"
              checked={preferences.systemAlerts}
              onChange={handleInputChange}
              disabled={!isEditing}
              className="h-4 w-4 rounded border-slate-300 text-slate-600 focus:ring-slate-500"
            />
            <label className="ml-2 block text-sm text-slate-700">
              System Alerts and Updates
            </label>
          </div>
        </div>
      </div>

      {/* Order Preferences */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Globe className="w-5 h-5 text-slate-600" />
          <h3 className="text-lg font-medium text-slate-800">Order Preferences</h3>
        </div>
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700">Default Shipping Method</label>
            <select
              name="defaultShippingMethod"
              value={preferences.defaultShippingMethod}
              onChange={handleInputChange}
              disabled={!isEditing}
              className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-slate-500 focus:ring-slate-500"
            >
              <option value="standard">Standard Shipping</option>
              <option value="express">Express Shipping</option>
              <option value="priority">Priority Shipping</option>
            </select>
          </div>
          <div className="space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                name="autoApproveOrders"
                checked={preferences.autoApproveOrders}
                onChange={handleInputChange}
                disabled={!isEditing}
                className="h-4 w-4 rounded border-slate-300 text-slate-600 focus:ring-slate-500"
              />
              <label className="ml-2 block text-sm text-slate-700">
                Auto-approve orders under standard limit
              </label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                name="showOrderNotes"
                checked={preferences.showOrderNotes}
                onChange={handleInputChange}
                disabled={!isEditing}
                className="h-4 w-4 rounded border-slate-300 text-slate-600 focus:ring-slate-500"
              />
              <label className="ml-2 block text-sm text-slate-700">
                Show order notes in summary view
              </label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                name="requireSignature"
                checked={preferences.requireSignature}
                onChange={handleInputChange}
                disabled={!isEditing}
                className="h-4 w-4 rounded border-slate-300 text-slate-600 focus:ring-slate-500"
              />
              <label className="ml-2 block text-sm text-slate-700">
                Require signature for all deliveries
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreferencesSection; 