import React, { useState } from 'react';
import { User, Shield, FileText, Settings } from 'lucide-react';
import ProfileSection from '../../components/settings/ProfileSection';
import PermissionsTab from '../../components/settings/PermissionsTab';
import AuditSection from '../../components/settings/AuditSection';
import PreferencesSection from '../../components/settings/PreferencesSection';

type TabType = 'profile' | 'permissions' | 'audit' | 'preferences';

const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('profile');

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'permissions', label: 'Permissions', icon: Shield },
    { id: 'audit', label: 'Audit & Compliance', icon: FileText },
    { id: 'preferences', label: 'Preferences', icon: Settings },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'profile':
        return <ProfileSection />;
      case 'permissions':
        return <PermissionsTab />;
      case 'audit':
        return <AuditSection />;
      case 'preferences':
        return <PreferencesSection />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Page header */}
        <div className="px-4 sm:px-0 mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
          <p className="mt-1 text-sm text-slate-600">
            Manage your account settings and preferences
          </p>
        </div>

        <div className="bg-white shadow rounded-lg">
          {/* Navigation Tabs */}
          <div className="border-b border-slate-200">
            <nav className="flex -mb-px">
              {tabs.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id as TabType)}
                  className={`
                    group inline-flex items-center px-6 py-4 border-b-2 font-medium text-sm
                    ${
                      activeTab === id
                        ? 'border-slate-600 text-slate-600'
                        : 'border-transparent text-slate-500 hover:text-slate-600 hover:border-slate-300'
                    }
                  `}
                >
                  <Icon
                    className={`
                      -ml-1 mr-2 h-5 w-5
                      ${
                        activeTab === id
                          ? 'text-slate-600'
                          : 'text-slate-400 group-hover:text-slate-500'
                      }
                    `}
                  />
                  {label}
                </button>
              ))}
            </nav>
          </div>

          {/* Content Area */}
          <div className="p-6">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;