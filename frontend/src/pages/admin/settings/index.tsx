import React, { useState } from 'react';
import {
  Settings, Shield, Bell, Server, Key, Users, Globe, Database,
  Lock, Mail, AlertTriangle, FileText, Building, Map, Workflow,
  Save, RefreshCw, Search, ChevronRight, CheckCircle, XCircle
} from 'lucide-react';

interface SettingSection {
  id: string;
  title: string;
  description: string;
  icon: any;
  fields: SettingField[];
}

interface SettingField {
  id: string;
  label: string;
  type: 'text' | 'select' | 'toggle' | 'number' | 'password' | 'textarea' | 'email';
  value: string | number | boolean;
  options?: { value: string; label: string }[];
  description?: string;
  validation?: {
    required?: boolean;
    pattern?: RegExp;
    min?: number;
    max?: number;
    message?: string;
  };
}

const settingSections: SettingSection[] = [
  {
    id: 'general',
    title: 'General Settings',
    description: 'Configure platform-wide settings and preferences',
    icon: Settings,
    fields: [
      {
        id: 'systemName',
        label: 'Platform Name',
        type: 'text',
        value: 'Healthcare IVR Platform',
        description: 'The name displayed throughout the application',
        validation: { required: true },
      },
      {
        id: 'timezone',
        label: 'Default Timezone',
        type: 'select',
        value: 'UTC',
        options: [
          { value: 'UTC', label: 'UTC' },
          { value: 'EST', label: 'Eastern Time (ET)' },
          { value: 'CST', label: 'Central Time (CT)' },
          { value: 'MST', label: 'Mountain Time (MT)' },
          { value: 'PST', label: 'Pacific Time (PT)' },
        ],
      },
      {
        id: 'dateFormat',
        label: 'Date Format',
        type: 'select',
        value: 'MM/DD/YYYY',
        options: [
          { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
          { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
          { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' },
        ],
      },
      {
        id: 'language',
        label: 'System Language',
        type: 'select',
        value: 'en',
        options: [
          { value: 'en', label: 'English' },
          { value: 'es', label: 'Spanish' },
          { value: 'fr', label: 'French' },
        ],
      },
    ],
  },
  {
    id: 'security',
    title: 'Security & Authentication',
    description: 'Configure security policies and access controls',
    icon: Shield,
    fields: [
      {
        id: 'passwordPolicy',
        label: 'Password Requirements',
        type: 'select',
        value: 'strict',
        options: [
          { value: 'basic', label: 'Basic (8+ characters)' },
          { value: 'standard', label: 'Standard (8+ chars, 1 number, 1 special)' },
          { value: 'strict', label: 'Strict (12+ chars, upper/lower, numbers, special)' },
        ],
        description: 'Password complexity requirements for all users',
      },
      {
        id: 'mfaRequired',
        label: 'Two-Factor Authentication',
        type: 'select',
        value: 'all-users',
        options: [
          { value: 'disabled', label: 'Disabled' },
          { value: 'optional', label: 'Optional for Users' },
          { value: 'admin-only', label: 'Required for Admins' },
          { value: 'all-users', label: 'Required for All Users' },
        ],
      },
      {
        id: 'sessionTimeout',
        label: 'Session Timeout',
        type: 'select',
        value: '30',
        options: [
          { value: '15', label: '15 minutes' },
          { value: '30', label: '30 minutes' },
          { value: '60', label: '1 hour' },
          { value: '120', label: '2 hours' },
        ],
      },
      {
        id: 'ipWhitelist',
        label: 'IP Whitelist',
        type: 'textarea',
        value: '',
        description: 'Comma-separated list of allowed IP addresses',
      },
      {
        id: 'failedLoginLimit',
        label: 'Failed Login Attempts',
        type: 'number',
        value: 5,
        description: 'Number of failed attempts before account lockout',
        validation: { min: 3, max: 10 },
      },
    ],
  },
  {
    id: 'hipaa',
    title: 'HIPAA Compliance',
    description: 'Configure privacy and compliance settings',
    icon: Lock,
    fields: [
      {
        id: 'dataRetention',
        label: 'Data Retention Period',
        type: 'select',
        value: '7-years',
        options: [
          { value: '5-years', label: '5 Years' },
          { value: '7-years', label: '7 Years' },
          { value: '10-years', label: '10 Years' },
        ],
        description: 'Period to retain patient records and audit logs',
      },
      {
        id: 'encryptionKey',
        label: 'Encryption Key ID',
        type: 'text',
        value: 'kms-key-123',
        description: 'AWS KMS key ID for PHI encryption',
      },
      {
        id: 'auditLogging',
        label: 'Audit Log Level',
        type: 'select',
        value: 'detailed',
        options: [
          { value: 'basic', label: 'Basic (Access Events)' },
          { value: 'standard', label: 'Standard (Access + Changes)' },
          { value: 'detailed', label: 'Detailed (All Activities)' },
        ],
      },
      {
        id: 'autoLogout',
        label: 'Auto-logout on Inactivity',
        type: 'toggle',
        value: true,
        description: 'Automatically log out inactive users',
      },
    ],
  },
  {
    id: 'notifications',
    title: 'Notifications & Alerts',
    description: 'Configure system notifications and communication',
    icon: Bell,
    fields: [
      {
        id: 'emailServer',
        label: 'SMTP Server',
        type: 'text',
        value: 'smtp.healthcare.com',
        validation: { required: true },
      },
      {
        id: 'emailFrom',
        label: 'From Email',
        type: 'email',
        value: 'noreply@healthcare.com',
        validation: {
          required: true,
          pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
          message: 'Please enter a valid email address',
        },
      },
      {
        id: 'alertTypes',
        label: 'System Alerts',
        type: 'select',
        value: 'all',
        options: [
          { value: 'critical', label: 'Critical Only' },
          { value: 'important', label: 'Important & Critical' },
          { value: 'all', label: 'All Notifications' },
        ],
      },
      {
        id: 'smsEnabled',
        label: 'SMS Notifications',
        type: 'toggle',
        value: true,
        description: 'Enable SMS alerts for critical events',
      },
    ],
  },
  {
    id: 'organization',
    title: 'Organization Settings',
    description: 'Configure organization and facility settings',
    icon: Building,
    fields: [
      {
        id: 'orgName',
        label: 'Organization Name',
        type: 'text',
        value: 'Healthcare Organization',
        validation: { required: true },
      },
      {
        id: 'orgType',
        label: 'Organization Type',
        type: 'select',
        value: 'hospital',
        options: [
          { value: 'hospital', label: 'Hospital' },
          { value: 'clinic', label: 'Clinic' },
          { value: 'practice', label: 'Medical Practice' },
        ],
      },
      {
        id: 'facilityCount',
        label: 'Number of Facilities',
        type: 'number',
        value: 1,
        validation: { min: 1 },
      },
      {
        id: 'territories',
        label: 'Active Territories',
        type: 'textarea',
        value: '',
        description: 'List of active service territories',
      },
    ],
  },
];

const SettingsPage = () => {
  const [activeSection, setActiveSection] = useState('general');
  const [settings, setSettings] = useState(settingSections);
  const [isDirty, setIsDirty] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const handleFieldChange = (sectionId: string, fieldId: string, value: any) => {
    setSettings(
      settings.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              fields: section.fields.map((field) =>
                field.id === fieldId ? { ...field, value } : field
              ),
            }
          : section
      )
    );
    setIsDirty(true);

    // Validate field
    const section = settings.find((s) => s.id === sectionId);
    const field = section?.fields.find((f) => f.id === fieldId);
    
    if (field?.validation) {
      const errors: Record<string, string> = { ...validationErrors };
      
      if (field.validation.required && !value) {
        errors[fieldId] = 'This field is required';
      } else if (field.validation.pattern && !field.validation.pattern.test(value)) {
        errors[fieldId] = field.validation.message || 'Invalid format';
      } else if (field.validation.min !== undefined && value < field.validation.min) {
        errors[fieldId] = `Minimum value is ${field.validation.min}`;
      } else if (field.validation.max !== undefined && value > field.validation.max) {
        errors[fieldId] = `Maximum value is ${field.validation.max}`;
      } else {
        delete errors[fieldId];
      }
      
      setValidationErrors(errors);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    // Simulate settings refresh
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  };

  const handleSave = () => {
    if (Object.keys(validationErrors).length > 0) {
      return;
    }
    // TODO: Implement settings save
    console.log('Saving settings:', settings);
    setIsDirty(false);
  };

  const filteredSections = searchTerm
    ? settings.map(section => ({
        ...section,
        fields: section.fields.filter(field =>
          field.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
          field.description?.toLowerCase().includes(searchTerm.toLowerCase())
        )
      })).filter(section => section.fields.length > 0)
    : settings;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">System Settings</h1>
            <p className="mt-2 text-sm text-slate-500">
              Configure and manage system-wide settings and preferences
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search settings..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-11 pr-4 py-3 h-12 bg-white border border-slate-200 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
              />
              <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 transform -translate-y-1/2" />
            </div>
            <button
              onClick={handleRefresh}
              className="p-3 text-slate-600 hover:text-slate-900 transition-colors"
              disabled={isRefreshing}
            >
              <RefreshCw className={`w-6 h-6 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={handleSave}
              disabled={!isDirty || Object.keys(validationErrors).length > 0}
              className={`px-6 py-3 h-12 rounded-lg text-white flex items-center gap-2 text-base ${
                isDirty && Object.keys(validationErrors).length === 0
                  ? 'bg-[#2E86AB] hover:bg-[#247297]'
                  : 'bg-slate-300 cursor-not-allowed'
              }`}
            >
              <Save className="w-5 h-5" />
              Save Changes
            </button>
          </div>
        </div>

        {/* Settings Grid */}
        <div className="grid grid-cols-12 gap-8">
          {/* Navigation Sidebar */}
          <div className="col-span-3 pt-[64px]">
            <nav className="space-y-1">
              {settings.map((section) => {
                const SectionIcon = section.icon;
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center gap-2 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                      activeSection === section.id
                        ? 'bg-[#2E86AB] text-white'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <SectionIcon className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{section.title}</span>
                    <ChevronRight className={`w-4 h-4 ml-auto flex-shrink-0 ${
                      activeSection === section.id ? 'text-white' : 'text-slate-400'
                    }`} />
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Settings Content */}
          <div className="col-span-9 space-y-8">
            {filteredSections.map((section) => (
              <div
                key={section.id}
                className={`bg-white shadow-sm rounded-lg border border-slate-200 overflow-hidden ${
                  activeSection === section.id || searchTerm ? 'block' : 'hidden'
                }`}
              >
                <div className="p-8 border-b border-slate-200">
                  <div className="flex items-center gap-4">
                    {React.createElement(section.icon, {
                      className: 'w-7 h-7 text-[#2E86AB]',
                    })}
                    <div>
                      <h2 className="text-xl font-semibold text-slate-900">
                        {section.title}
                      </h2>
                      <p className="mt-1 text-base text-slate-500">{section.description}</p>
                    </div>
                  </div>
                </div>

                <div className="p-8 space-y-8">
                  {section.fields.map((field) => (
                    <div key={field.id} className="grid grid-cols-3 gap-8 items-start">
                      <div className="col-span-1">
                        <label
                          htmlFor={field.id}
                          className="block text-base font-medium text-slate-900 mb-2"
                        >
                          {field.label}
                          {field.validation?.required && (
                            <span className="text-red-500 ml-1">*</span>
                          )}
                        </label>
                        {field.description && (
                          <p className="text-sm text-slate-500">{field.description}</p>
                        )}
                      </div>
                      <div className="col-span-2 space-y-2">
                        {field.type === 'text' && (
                          <input
                            type="text"
                            id={field.id}
                            value={field.value as string}
                            onChange={(e) =>
                              handleFieldChange(section.id, field.id, e.target.value)
                            }
                            className={`block w-full min-h-[48px] px-4 py-3 text-base rounded-lg border ${
                              validationErrors[field.id]
                                ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                                : 'border-slate-300 focus:ring-slate-500 focus:border-slate-500'
                            } shadow-sm transition-colors`}
                          />
                        )}
                        {field.type === 'email' && (
                          <input
                            type="email"
                            id={field.id}
                            value={field.value as string}
                            onChange={(e) =>
                              handleFieldChange(section.id, field.id, e.target.value)
                            }
                            className={`block w-full min-h-[48px] px-4 py-3 text-base rounded-lg border ${
                              validationErrors[field.id]
                                ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                                : 'border-slate-300 focus:ring-slate-500 focus:border-slate-500'
                            } shadow-sm transition-colors`}
                          />
                        )}
                        {field.type === 'select' && (
                          <div className="relative">
                            <select
                              id={field.id}
                              value={field.value as string}
                              onChange={(e) =>
                                handleFieldChange(section.id, field.id, e.target.value)
                              }
                              className="block w-full min-h-[48px] px-4 py-3 text-base rounded-lg border border-slate-300 shadow-sm focus:ring-slate-500 focus:border-slate-500 bg-white appearance-none cursor-pointer pr-10 transition-colors"
                            >
                              {field.options?.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                            <ChevronRight className="w-5 h-5 text-slate-400 absolute right-3 top-1/2 transform -translate-y-1/2 rotate-90 pointer-events-none" />
                          </div>
                        )}
                        {field.type === 'number' && (
                          <input
                            type="number"
                            id={field.id}
                            value={field.value as number}
                            onChange={(e) =>
                              handleFieldChange(section.id, field.id, Number(e.target.value))
                            }
                            className={`block w-full min-h-[48px] px-4 py-3 text-base rounded-lg border ${
                              validationErrors[field.id]
                                ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                                : 'border-slate-300 focus:ring-slate-500 focus:border-slate-500'
                            } shadow-sm transition-colors`}
                          />
                        )}
                        {field.type === 'textarea' && (
                          <textarea
                            id={field.id}
                            value={field.value as string}
                            onChange={(e) =>
                              handleFieldChange(section.id, field.id, e.target.value)
                            }
                            rows={4}
                            className="block w-full px-4 py-3 text-base rounded-lg border border-slate-300 shadow-sm focus:ring-slate-500 focus:border-slate-500 min-h-[120px] resize-y transition-colors"
                          />
                        )}
                        {field.type === 'toggle' && (
                          <div className="flex items-center min-h-[48px]">
                            <button
                              type="button"
                              onClick={() =>
                                handleFieldChange(section.id, field.id, !field.value)
                              }
                              className={`${
                                field.value ? 'bg-slate-600' : 'bg-slate-200'
                              } relative inline-flex h-8 w-16 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2`}
                            >
                              <span
                                className={`${
                                  field.value ? 'translate-x-8' : 'translate-x-0'
                                } pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                              />
                            </button>
                            <span className="ml-4 text-base text-slate-700">
                              {field.value ? 'Enabled' : 'Disabled'}
                            </span>
                          </div>
                        )}
                        {validationErrors[field.id] && (
                          <p className="text-sm text-red-600 mt-2">
                            {validationErrors[field.id]}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage; 