import React, { useState } from 'react';
import {
  CogIcon,
  BuildingOfficeIcon,
  BellIcon,
  PhotoIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

interface CompanyProfile {
  companyName: string;
  taxId: string;
  businessLicense: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  businessHours: {
    start: string;
    end: string;
    timezone: string;
  };
  logoUrl?: string;
}

interface Preferences {
  notifications: {
    newDistributors: boolean;
    salesActivity: boolean;
    payments: boolean;
    systemUpdates: boolean;
    weeklyReports: boolean;
  };
  display: {
    dateFormat: string;
    timeFormat: string;
    currency: string;
    language: string;
  };
  reports: {
    frequency: string;
    recipients: string[];
  };
}

const RegionalSettings: React.FC = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  // Mock data for Regional Distributor
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile>({
    companyName: 'Regional Health Partners',
    taxId: '98-7654321',
    businessLicense: 'RHP-2024-IL',
    contactName: 'Michael Chen',
    contactEmail: 'michael.chen@regionalhealthpartners.com',
    contactPhone: '(312) 555-0199',
    address: {
      street: '456 Healthcare Blvd',
      city: 'Chicago',
      state: 'IL',
      zip: '60601',
      country: 'United States'
    },
    businessHours: {
      start: '08:00',
      end: '17:00',
      timezone: 'America/Chicago'
    }
  });

  const [preferences, setPreferences] = useState<Preferences>({
    notifications: {
      newDistributors: false, // Regional distributors don't manage other distributors
      salesActivity: true,
      payments: true,
      systemUpdates: false,
      weeklyReports: true
    },
    display: {
      dateFormat: 'MM/DD/YYYY',
      timeFormat: '12-hour',
      currency: 'USD',
      language: 'English'
    },
    reports: {
      frequency: 'weekly',
      recipients: ['michael.chen@regionalhealthpartners.com', 'operations@regionalhealthpartners.com']
    }
  });

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsSaving(false);
    setSaveMessage('Settings saved successfully!');
    setTimeout(() => setSaveMessage(''), 3000);
  };

  // Regional Distributor only gets 2 tabs (no Invoice Settings)
  const tabs = [
    { id: 'profile', name: 'Company Profile', icon: BuildingOfficeIcon },
    { id: 'preferences', name: 'Preferences', icon: BellIcon }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-semibold text-gray-900 flex items-center">
                  <CogIcon className="h-8 w-8 text-gray-600 mr-3" />
                  Regional Distributor Settings
                </h1>
                <p className="mt-1 text-sm text-gray-600">
                  Manage your company profile and preferences
                </p>
              </div>
              <div className="flex items-center space-x-3">
                {saveMessage && (
                  <div className="flex items-center text-green-600">
                    <CheckCircleIcon className="h-5 w-5 mr-2" />
                    <span className="text-sm font-medium">{saveMessage}</span>
                  </div>
                )}
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="bg-slate-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white shadow rounded-lg">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`${
                      activeTab === tab.id
                        ? 'border-slate-500 text-slate-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
                  >
                    <Icon className="h-5 w-5 mr-2" />
                    {tab.name}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="p-6">
            {/* Company Profile Tab */}
            {activeTab === 'profile' && (
              <div className="space-y-8">
                {/* Company Information */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Company Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Company Name</label>
                      <input
                        type="text"
                        value={companyProfile.companyName}
                        onChange={(e) => setCompanyProfile({...companyProfile, companyName: e.target.value})}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-slate-500 focus:border-slate-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Tax ID</label>
                      <input
                        type="text"
                        value={companyProfile.taxId}
                        onChange={(e) => setCompanyProfile({...companyProfile, taxId: e.target.value})}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-slate-500 focus:border-slate-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Business License</label>
                      <input
                        type="text"
                        value={companyProfile.businessLicense}
                        onChange={(e) => setCompanyProfile({...companyProfile, businessLicense: e.target.value})}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-slate-500 focus:border-slate-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Company Logo */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Company Logo</h3>
                  <div className="flex items-center space-x-6">
                    <div className="bg-gray-100 w-24 h-24 rounded-lg flex items-center justify-center">
                      {companyProfile.logoUrl ? (
                        <img src={companyProfile.logoUrl} alt="Company Logo" className="w-full h-full object-cover rounded-lg" />
                      ) : (
                        <PhotoIcon className="h-8 w-8 text-gray-400" />
                      )}
                    </div>
                    <div>
                      <button className="bg-white border border-gray-300 rounded-md px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                        Upload Logo
                      </button>
                      <p className="mt-2 text-xs text-gray-500">
                        Recommended: 200x200px, PNG or JPG format
                      </p>
                    </div>
                  </div>
                </div>

                {/* Primary Contact */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Primary Contact</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Contact Name</label>
                      <input
                        type="text"
                        value={companyProfile.contactName}
                        onChange={(e) => setCompanyProfile({...companyProfile, contactName: e.target.value})}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-slate-500 focus:border-slate-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Email Address</label>
                      <input
                        type="email"
                        value={companyProfile.contactEmail}
                        onChange={(e) => setCompanyProfile({...companyProfile, contactEmail: e.target.value})}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-slate-500 focus:border-slate-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                      <input
                        type="tel"
                        value={companyProfile.contactPhone}
                        onChange={(e) => setCompanyProfile({...companyProfile, contactPhone: e.target.value})}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-slate-500 focus:border-slate-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Business Address */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Business Address</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Street Address</label>
                      <input
                        type="text"
                        value={companyProfile.address.street}
                        onChange={(e) => setCompanyProfile({
                          ...companyProfile,
                          address: {...companyProfile.address, street: e.target.value}
                        })}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-slate-500 focus:border-slate-500"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">City</label>
                        <input
                          type="text"
                          value={companyProfile.address.city}
                          onChange={(e) => setCompanyProfile({
                            ...companyProfile,
                            address: {...companyProfile.address, city: e.target.value}
                          })}
                          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-slate-500 focus:border-slate-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">State</label>
                        <select
                          value={companyProfile.address.state}
                          onChange={(e) => setCompanyProfile({
                            ...companyProfile,
                            address: {...companyProfile.address, state: e.target.value}
                          })}
                          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-slate-500 focus:border-slate-500"
                        >
                          <option value="IL">Illinois</option>
                          <option value="IN">Indiana</option>
                          <option value="WI">Wisconsin</option>
                          <option value="MI">Michigan</option>
                          <option value="OH">Ohio</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">ZIP Code</label>
                        <input
                          type="text"
                          value={companyProfile.address.zip}
                          onChange={(e) => setCompanyProfile({
                            ...companyProfile,
                            address: {...companyProfile.address, zip: e.target.value}
                          })}
                          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-slate-500 focus:border-slate-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Country</label>
                        <select
                          value={companyProfile.address.country}
                          onChange={(e) => setCompanyProfile({
                            ...companyProfile,
                            address: {...companyProfile.address, country: e.target.value}
                          })}
                          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-slate-500 focus:border-slate-500"
                        >
                          <option value="United States">United States</option>
                          <option value="Canada">Canada</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Business Hours */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Business Hours</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Start Time</label>
                      <input
                        type="time"
                        value={companyProfile.businessHours.start}
                        onChange={(e) => setCompanyProfile({
                          ...companyProfile,
                          businessHours: {...companyProfile.businessHours, start: e.target.value}
                        })}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-slate-500 focus:border-slate-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">End Time</label>
                      <input
                        type="time"
                        value={companyProfile.businessHours.end}
                        onChange={(e) => setCompanyProfile({
                          ...companyProfile,
                          businessHours: {...companyProfile.businessHours, end: e.target.value}
                        })}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-slate-500 focus:border-slate-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Timezone</label>
                      <select
                        value={companyProfile.businessHours.timezone}
                        onChange={(e) => setCompanyProfile({
                          ...companyProfile,
                          businessHours: {...companyProfile.businessHours, timezone: e.target.value}
                        })}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-slate-500 focus:border-slate-500"
                      >
                        <option value="America/Chicago">Central Time</option>
                        <option value="America/New_York">Eastern Time</option>
                        <option value="America/Denver">Mountain Time</option>
                        <option value="America/Los_Angeles">Pacific Time</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Preferences Tab */}
            {activeTab === 'preferences' && (
              <div className="space-y-8">
                {/* Notification Settings */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Email Notifications</h3>
                  <div className="space-y-4">
                    {Object.entries(preferences.notifications).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between">
                        <div>
                          <label className="text-sm font-medium text-gray-700">
                            {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                          </label>
                          <p className="text-xs text-gray-500">
                            {key === 'newDistributors' && 'Get notified when new distributors join your network'}
                            {key === 'salesActivity' && 'Receive updates on sales performance and activities'}
                            {key === 'payments' && 'Get alerts for payment receipts and overdue invoices'}
                            {key === 'systemUpdates' && 'Receive notifications about system maintenance and updates'}
                            {key === 'weeklyReports' && 'Get weekly summary reports via email'}
                          </p>
                        </div>
                        <button
                          onClick={() => setPreferences({
                            ...preferences,
                            notifications: {...preferences.notifications, [key]: !value}
                          })}
                          className={`${
                            value ? 'bg-slate-600' : 'bg-gray-200'
                          } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2`}
                        >
                          <span
                            className={`${
                              value ? 'translate-x-5' : 'translate-x-0'
                            } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                          />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Display Preferences */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Display Preferences</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Date Format</label>
                      <select
                        value={preferences.display.dateFormat}
                        onChange={(e) => setPreferences({
                          ...preferences,
                          display: {...preferences.display, dateFormat: e.target.value}
                        })}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-slate-500 focus:border-slate-500"
                      >
                        <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                        <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                        <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Time Format</label>
                      <select
                        value={preferences.display.timeFormat}
                        onChange={(e) => setPreferences({
                          ...preferences,
                          display: {...preferences.display, timeFormat: e.target.value}
                        })}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-slate-500 focus:border-slate-500"
                      >
                        <option value="12-hour">12-hour (AM/PM)</option>
                        <option value="24-hour">24-hour</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Currency</label>
                      <select
                        value={preferences.display.currency}
                        onChange={(e) => setPreferences({
                          ...preferences,
                          display: {...preferences.display, currency: e.target.value}
                        })}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-slate-500 focus:border-slate-500"
                      >
                        <option value="USD">USD ($)</option>
                        <option value="CAD">CAD ($)</option>
                        <option value="EUR">EUR (€)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Language</label>
                      <select
                        value={preferences.display.language}
                        onChange={(e) => setPreferences({
                          ...preferences,
                          display: {...preferences.display, language: e.target.value}
                        })}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-slate-500 focus:border-slate-500"
                      >
                        <option value="English">English</option>
                        <option value="Spanish">Spanish</option>
                        <option value="French">French</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Report Settings */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Report Scheduling</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Report Frequency</label>
                      <select
                        value={preferences.reports.frequency}
                        onChange={(e) => setPreferences({
                          ...preferences,
                          reports: {...preferences.reports, frequency: e.target.value}
                        })}
                        className="mt-1 block w-full md:w-1/3 border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-slate-500 focus:border-slate-500"
                      >
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                        <option value="quarterly">Quarterly</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Report Recipients</label>
                      <div className="mt-2 space-y-2">
                        {preferences.reports.recipients.map((email, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <input
                              type="email"
                              value={email}
                              onChange={(e) => {
                                const newRecipients = [...preferences.reports.recipients];
                                newRecipients[index] = e.target.value;
                                setPreferences({
                                  ...preferences,
                                  reports: {...preferences.reports, recipients: newRecipients}
                                });
                              }}
                              className="block w-full md:w-1/2 border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-slate-500 focus:border-slate-500"
                            />
                            <button
                              onClick={() => {
                                const newRecipients = preferences.reports.recipients.filter((_, i) => i !== index);
                                setPreferences({
                                  ...preferences,
                                  reports: {...preferences.reports, recipients: newRecipients}
                                });
                              }}
                              className="text-red-600 hover:text-red-800"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                        <button
                          onClick={() => setPreferences({
                            ...preferences,
                            reports: {...preferences.reports, recipients: [...preferences.reports.recipients, '']}
                          })}
                          className="text-slate-600 hover:text-slate-800 text-sm font-medium"
                        >
                          + Add Recipient
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegionalSettings;