import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import UnifiedDashboardLayout from '../../components/shared/layout/UnifiedDashboardLayout';
import { createSalesNavigation } from '../../components/sales/SimpleSalesDashboard';
import {
  UserIcon,
  DocumentTextIcon,
  PhoneIcon,
  MapPinIcon,
  UserGroupIcon,
  ClockIcon,
  CloudArrowUpIcon,
  DocumentCheckIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';

interface TabProps {
  id: string;
  name: string;
  icon: React.ComponentType<any>;
  current: boolean;
}

interface Document {
  id: string;
  name: string;
  type: string;
  uploadDate: string;
  status: 'required' | 'uploaded' | 'expired';
  fileUrl?: string;
}

const Settings: React.FC = () => {
  const { logout, user } = useAuth();
  const [activeTab, setActiveTab] = useState('contact');
  const [loading, setLoading] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    // Contact Information
    phone: '',
    mobile: '',
    streetAddress: '',
    city: '',
    state: '',
    zipCode: '',
    emergencyContactName: '',
    emergencyContactRelationship: '',
    emergencyContactPhone: '',
    preferredContact: 'email',
    bestTimeToReach: '9:00 AM - 5:00 PM'
  });

  // Mock documents data
  const [documents, setDocuments] = useState<Document[]>([
    {
      id: '1',
      name: 'Business Associate Agreement (BAA)',
      type: 'baa',
      uploadDate: '2024-01-15',
      status: 'uploaded',
      fileUrl: '/documents/baa-signed.pdf'
    },
    {
      id: '2',
      name: 'HIPAA Training Certificate',
      type: 'hipaa',
      uploadDate: '2024-01-10',
      status: 'uploaded',
      fileUrl: '/documents/hipaa-cert.pdf'
    },
    {
      id: '3',
      name: 'Sales Representative Agreement',
      type: 'sales_agreement',
      uploadDate: '',
      status: 'required'
    }
  ]);

  const navigation = createSalesNavigation(logout);
  const userInfo = {
    name: user?.first_name ? `${user.first_name} ${user.last_name}` : 'Sales Rep',
    role: 'Sales Representative',
    avatar: user?.first_name?.charAt(0) || 'S'
  };

  const tabs: TabProps[] = [
    { id: 'contact', name: 'Contact Information', icon: UserIcon, current: activeTab === 'contact' },
    { id: 'documents', name: 'Documents', icon: DocumentTextIcon, current: activeTab === 'documents' }
  ];

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async (section: string) => {
    setLoading(true);
    setSaveMessage(null);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      setSaveMessage(`${section} information saved successfully!`);
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error) {
      setSaveMessage('Failed to save information. Please try again.');
      setTimeout(() => setSaveMessage(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, documentType: string) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      // Simulate file upload
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Update document status
      setDocuments(prev => prev.map(doc =>
        doc.type === documentType
          ? { ...doc, status: 'uploaded' as const, uploadDate: new Date().toISOString().split('T')[0] }
          : doc
      ));

      setSaveMessage('Document uploaded successfully!');
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error) {
      setSaveMessage('Failed to upload document. Please try again.');
      setTimeout(() => setSaveMessage(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'uploaded':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircleIcon className="h-3 w-3 mr-1" />
            Uploaded
          </span>
        );
      case 'expired':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircleIcon className="h-3 w-3 mr-1" />
            Expired
          </span>
        );
      case 'required':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <ExclamationTriangleIcon className="h-3 w-3 mr-1" />
            Required
          </span>
        );
      default:
        return null;
    }
  };

  const renderContactTab = () => (
    <div className="space-y-8">
      {/* Personal Contact */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-6">Personal Contact</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Full Name (Read-only) */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-2">Full Name</label>
            <input
              type="text"
              value={`${user?.first_name || ''} ${user?.last_name || ''}`}
              disabled
              className="w-full px-3 py-2 border border-slate-300 rounded-md bg-slate-50 text-slate-500"
            />
          </div>

          {/* Email (Read-only) */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Email Address</label>
            <input
              type="email"
              value={user?.email || ''}
              disabled
              className="w-full px-3 py-2 border border-slate-300 rounded-md bg-slate-50 text-slate-500"
            />
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Phone Number</label>
            <div className="relative">
              <PhoneIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="(555) 123-4567"
                className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
              />
            </div>
          </div>

          {/* Mobile Number */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-2">Mobile Number</label>
            <div className="relative">
              <PhoneIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="tel"
                value={formData.mobile}
                onChange={(e) => handleInputChange('mobile', e.target.value)}
                placeholder="(555) 987-6543"
                className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Address */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-6">Address</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Street Address */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-2">Street Address</label>
            <div className="relative">
              <MapPinIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={formData.streetAddress}
                onChange={(e) => handleInputChange('streetAddress', e.target.value)}
                placeholder="123 Main Street"
                className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
              />
            </div>
          </div>

          {/* City */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">City</label>
            <input
              type="text"
              value={formData.city}
              onChange={(e) => handleInputChange('city', e.target.value)}
              placeholder="New York"
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
            />
          </div>

          {/* State */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">State</label>
            <select
              value={formData.state}
              onChange={(e) => handleInputChange('state', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
            >
              <option value="">Select State</option>
              <option value="NY">New York</option>
              <option value="CA">California</option>
              <option value="TX">Texas</option>
              <option value="FL">Florida</option>
              {/* Add more states as needed */}
            </select>
          </div>

          {/* ZIP Code */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-2">ZIP Code</label>
            <input
              type="text"
              value={formData.zipCode}
              onChange={(e) => handleInputChange('zipCode', e.target.value)}
              placeholder="10001"
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
            />
          </div>
        </div>
      </div>

      {/* Emergency Contact */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-6">Emergency Contact</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Emergency Contact Name */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Contact Name</label>
            <div className="relative">
              <UserGroupIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={formData.emergencyContactName}
                onChange={(e) => handleInputChange('emergencyContactName', e.target.value)}
                placeholder="John Doe"
                className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
              />
            </div>
          </div>

          {/* Relationship */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Relationship</label>
            <select
              value={formData.emergencyContactRelationship}
              onChange={(e) => handleInputChange('emergencyContactRelationship', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
            >
              <option value="">Select Relationship</option>
              <option value="spouse">Spouse</option>
              <option value="parent">Parent</option>
              <option value="sibling">Sibling</option>
              <option value="child">Child</option>
              <option value="friend">Friend</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Emergency Contact Phone */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-2">Contact Phone</label>
            <div className="relative">
              <PhoneIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="tel"
                value={formData.emergencyContactPhone}
                onChange={(e) => handleInputChange('emergencyContactPhone', e.target.value)}
                placeholder="(555) 123-4567"
                className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Communication Preferences */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-6">Communication Preferences</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Preferred Contact Method */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Preferred Contact Method</label>
            <select
              value={formData.preferredContact}
              onChange={(e) => handleInputChange('preferredContact', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
            >
              <option value="email">Email</option>
              <option value="phone">Phone</option>
              <option value="text">Text Message</option>
            </select>
          </div>

          {/* Best Time to Reach */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Best Time to Reach</label>
            <div className="relative">
              <ClockIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={formData.bestTimeToReach}
                onChange={(e) => handleInputChange('bestTimeToReach', e.target.value)}
                placeholder="9:00 AM - 5:00 PM"
                className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={() => handleSave('Contact')}
          disabled={loading}
          className="px-6 py-2 bg-slate-600 text-white rounded-md hover:bg-slate-700 focus:ring-2 focus:ring-slate-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Saving...' : 'Save Contact Information'}
        </button>
      </div>
    </div>
  );

  const renderDocumentsTab = () => (
    <div className="space-y-8">
      {/* Business Associate Agreement */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-6">Business Associate Agreement (BAA)</h3>

        <div className="border-2 border-dashed border-slate-300 rounded-lg p-6">
          <div className="text-center">
            <DocumentCheckIcon className="mx-auto h-12 w-12 text-slate-400" />
            <div className="mt-4">
              <label htmlFor="baa-upload" className="cursor-pointer">
                <span className="mt-2 block text-sm font-medium text-slate-900">
                  Upload Business Associate Agreement
                </span>
                <span className="mt-1 block text-sm text-slate-500">
                  PDF, DOC, or DOCX up to 10MB
                </span>
              </label>
              <input
                id="baa-upload"
                name="baa-upload"
                type="file"
                className="sr-only"
                accept=".pdf,.doc,.docx"
                onChange={(e) => handleFileUpload(e, 'baa')}
              />
            </div>
            <div className="mt-6">
              <button
                type="button"
                onClick={() => document.getElementById('baa-upload')?.click()}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-slate-600 hover:bg-slate-700"
              >
                <CloudArrowUpIcon className="h-4 w-4 mr-2" />
                Choose File
              </button>
            </div>
          </div>
        </div>

        {/* Current BAA Status */}
        <div className="mt-6 p-4 bg-slate-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-900">Current BAA Status</p>
              <p className="text-sm text-slate-500">Last updated: January 15, 2024</p>
            </div>
            {getStatusBadge('uploaded')}
          </div>
        </div>
      </div>

      {/* Other Required Documents */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-6">Required Documents</h3>

        <div className="space-y-4">
          {documents.map((doc) => (
            <div key={doc.id} className="border border-slate-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-slate-900">{doc.name}</h4>
                  {doc.uploadDate && (
                    <p className="text-sm text-slate-500">Uploaded: {doc.uploadDate}</p>
                  )}
                </div>
                <div className="flex items-center space-x-3">
                  {getStatusBadge(doc.status)}

                  {doc.status === 'uploaded' ? (
                    <div className="flex space-x-2">
                      <button
                        type="button"
                        className="inline-flex items-center px-3 py-1 border border-slate-300 text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50"
                      >
                        <EyeIcon className="h-4 w-4 mr-1" />
                        View
                      </button>
                      <button
                        type="button"
                        className="inline-flex items-center px-3 py-1 border border-slate-300 text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50"
                      >
                        <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
                        Download
                      </button>
                    </div>
                  ) : (
                    <div>
                      <input
                        type="file"
                        className="sr-only"
                        id={`upload-${doc.id}`}
                        accept=".pdf,.doc,.docx"
                        onChange={(e) => handleFileUpload(e, doc.type)}
                      />
                      <button
                        type="button"
                        onClick={() => document.getElementById(`upload-${doc.id}`)?.click()}
                        className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-slate-600 hover:bg-slate-700"
                      >
                        <CloudArrowUpIcon className="h-4 w-4 mr-1" />
                        Upload
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <UnifiedDashboardLayout navigation={navigation} userInfo={userInfo}>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
              <p className="text-slate-600 mt-2">Manage your contact information and required documents</p>
            </div>
            {saveMessage && (
              <div className={`flex items-center px-4 py-2 rounded-md ${
                saveMessage.includes('successfully')
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {saveMessage.includes('successfully') ? (
                  <CheckCircleIcon className="h-4 w-4 mr-2" />
                ) : (
                  <XCircleIcon className="h-4 w-4 mr-2" />
                )}
                <span className="text-sm font-medium">{saveMessage}</span>
              </div>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow">
          <div className="border-b border-slate-200">
            <nav className="-mb-px flex space-x-8 px-6">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                      tab.current
                        ? 'border-slate-500 text-slate-600'
                        : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {tab.name}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'contact' && renderContactTab()}
            {activeTab === 'documents' && renderDocumentsTab()}
          </div>
        </div>
      </div>
    </UnifiedDashboardLayout>
  );
};

export default Settings;