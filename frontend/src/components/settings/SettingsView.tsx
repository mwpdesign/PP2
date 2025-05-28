import React, { useState } from 'react';
import { Settings as SettingsIcon, User, Shield, Bell, Key, History, Sliders } from 'lucide-react';
import ProfileSection from './ProfileSection';
import SecuritySection from './SecuritySection';
import NotificationSection from './NotificationSection';

type SettingsTab = 'profile' | 'security' | 'notifications' | 'permissions' | 'audit' | 'preferences';

interface TabItem {
  id: SettingsTab;
  label: string;
  icon: React.ReactNode;
}

const tabs: TabItem[] = [
  { id: 'profile', label: 'Profile', icon: <User className="w-5 h-5" /> },
  { id: 'security', label: 'Security', icon: <Shield className="w-5 h-5" /> },
  { id: 'notifications', label: 'Notifications', icon: <Bell className="w-5 h-5" /> },
  { id: 'permissions', label: 'Permissions', icon: <Key className="w-5 h-5" /> },
  { id: 'audit', label: 'Audit & Compliance', icon: <History className="w-5 h-5" /> },
  { id: 'preferences', label: 'Preferences', icon: <Sliders className="w-5 h-5" /> },
];

const SettingsView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const handleSaveAll = () => {
    // TODO: Implement save functionality
    setHasUnsavedChanges(false);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return <ProfileSection />;
      case 'security':
        return <SecuritySection />;
      case 'notifications':
        return <NotificationSection />;
      case 'permissions':
        return <div>Permissions section coming soon...</div>;
      case 'audit':
        return <div>Audit & Compliance section coming soon...</div>;
      case 'preferences':
        return <div>Preferences section coming soon...</div>;
      default:
        return null;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Account Settings</h1>
          <p className="mt-1 text-sm text-slate-600">
            Manage your account settings and preferences
          </p>
        </div>
        <button
          onClick={handleSaveAll}
          disabled={!hasUnsavedChanges}
          className={`px-4 py-2 rounded-md text-white ${
            hasUnsavedChanges
              ? 'bg-slate-600 hover:bg-slate-700'
              : 'bg-slate-400 cursor-not-allowed'
          }`}
        >
          Save All Changes
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <nav className="-mb-px flex space-x-8" aria-label="Settings navigation">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm
                ${
                  activeTab === tab.id
                    ? 'border-slate-600 text-slate-600'
                    : 'border-transparent text-slate-500 hover:text-slate-600 hover:border-slate-300'
                }
              `}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="mt-6">
        {renderTabContent()}
      </div>
    </div>
  );
};

export default SettingsView; 