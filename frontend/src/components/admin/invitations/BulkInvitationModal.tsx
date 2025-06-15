import React, { useState } from 'react';
import {
  XMarkIcon,
  UsersIcon,
  DocumentArrowUpIcon,
  ClockIcon,
  TrashIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

interface BulkInvitationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const BulkInvitationModal: React.FC<BulkInvitationModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [activeTab, setActiveTab] = useState<'create' | 'manage'>('create');
  const [loading, setLoading] = useState(false);
  const [csvData, setCsvData] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedFile(file);

      // Read CSV file
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setCsvData(content);
      };
      reader.readAsText(file);
    }
  };

  const handleBulkCreate = async () => {
    if (!csvData.trim()) {
      toast.error('Please upload a CSV file or enter invitation data');
      return;
    }

    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Parse CSV data (simplified)
      const lines = csvData.trim().split('\n');
      const invitationCount = Math.max(0, lines.length - 1); // Subtract header row

      toast.success(`Successfully created ${invitationCount} invitations`);
      onSuccess();
      onClose();

      // Reset form
      setCsvData('');
      setUploadedFile(null);
    } catch (error) {
      toast.error('Failed to create bulk invitations');
    } finally {
      setLoading(false);
    }
  };

  const handleExpireOld = async () => {
    if (!confirm('Are you sure you want to expire all old invitations? This action cannot be undone.')) {
      return;
    }

    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      const expiredCount = Math.floor(Math.random() * 20) + 5;
      toast.success(`Expired ${expiredCount} old invitations`);
      onSuccess();
    } catch (error) {
      toast.error('Failed to expire old invitations');
    } finally {
      setLoading(false);
    }
  };

  const handleCleanupOld = async () => {
    if (!confirm('Are you sure you want to cleanup old completed invitations? This will permanently delete old records and cannot be undone.')) {
      return;
    }

    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      const cleanedCount = Math.floor(Math.random() * 15) + 3;
      toast.success(`Cleaned up ${cleanedCount} old invitation records`);
      onSuccess();
    } catch (error) {
      toast.error('Failed to cleanup old invitations');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const csvTemplate = `email,first_name,last_name,invitation_type,role_name,organization_id,invitation_message
doctor1@example.com,John,Smith,doctor,Healthcare Provider,,Welcome to our platform
sales1@example.com,Jane,Doe,sales,Sales Representative,,Join our sales team
admin1@example.com,Bob,Wilson,office_admin,Office Administrator,,Administrative access granted`;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div className="flex items-center space-x-3">
            <UsersIcon className="h-6 w-6 text-[#2E86AB]" />
            <h3 className="text-lg font-semibold text-slate-900">Bulk Operations</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-slate-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('create')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'create'
                  ? 'border-[#2E86AB] text-[#2E86AB]'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              Bulk Create
            </button>
            <button
              onClick={() => setActiveTab('manage')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'manage'
                  ? 'border-[#2E86AB] text-[#2E86AB]'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              Bulk Management
            </button>
          </nav>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === 'create' ? (
            <div className="space-y-6">
              <div>
                <h4 className="text-lg font-medium text-slate-900 mb-2">Create Multiple Invitations</h4>
                <p className="text-sm text-slate-600">
                  Upload a CSV file or paste CSV data to create multiple invitations at once.
                </p>
              </div>

              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Upload CSV File
                </label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 border-dashed rounded-lg">
                  <div className="space-y-1 text-center">
                    <DocumentArrowUpIcon className="mx-auto h-12 w-12 text-slate-400" />
                    <div className="flex text-sm text-slate-600">
                      <label
                        htmlFor="file-upload"
                        className="relative cursor-pointer bg-white rounded-md font-medium text-[#2E86AB] hover:text-[#247297] focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-[#2E86AB]"
                      >
                        <span>Upload a file</span>
                        <input
                          id="file-upload"
                          name="file-upload"
                          type="file"
                          accept=".csv"
                          className="sr-only"
                          onChange={handleFileUpload}
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-slate-500">CSV files only</p>
                    {uploadedFile && (
                      <p className="text-sm text-green-600 mt-2">
                        ✓ {uploadedFile.name} uploaded
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* CSV Template */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  CSV Template
                </label>
                <div className="bg-slate-50 rounded-lg p-4">
                  <p className="text-sm text-slate-600 mb-2">
                    Use this template format for your CSV file:
                  </p>
                  <pre className="text-xs text-slate-800 bg-white p-3 rounded border overflow-x-auto">
                    {csvTemplate}
                  </pre>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(csvTemplate);
                      toast.success('Template copied to clipboard');
                    }}
                    className="mt-2 text-sm text-[#2E86AB] hover:text-[#247297]"
                  >
                    Copy template
                  </button>
                </div>
              </div>

              {/* Manual CSV Input */}
              <div>
                <label htmlFor="csv-data" className="block text-sm font-medium text-slate-700 mb-2">
                  Or Paste CSV Data
                </label>
                <textarea
                  id="csv-data"
                  rows={8}
                  value={csvData}
                  onChange={(e) => setCsvData(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2E86AB] focus:border-transparent"
                  placeholder="Paste your CSV data here..."
                />
                <p className="mt-1 text-sm text-slate-500">
                  Include the header row and ensure proper CSV formatting.
                </p>
              </div>

              {/* Preview */}
              {csvData && (
                <div>
                  <h5 className="text-sm font-medium text-slate-700 mb-2">Preview</h5>
                  <div className="bg-slate-50 rounded-lg p-4">
                    <p className="text-sm text-slate-600">
                      {csvData.split('\n').length - 1} invitations will be created
                    </p>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2E86AB]"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBulkCreate}
                  disabled={loading || !csvData.trim()}
                  className="inline-flex items-center px-4 py-2 bg-[#2E86AB] text-white rounded-lg hover:bg-[#247297] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2E86AB] disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Creating...
                    </>
                  ) : (
                    <>
                      <UsersIcon className="h-4 w-4 mr-2" />
                      Create Invitations
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <h4 className="text-lg font-medium text-slate-900 mb-2">Bulk Management Operations</h4>
                <p className="text-sm text-slate-600">
                  Perform bulk operations to maintain invitation hygiene and clean up old records.
                </p>
              </div>

              {/* Expire Old Invitations */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <div className="flex items-start space-x-4">
                  <ClockIcon className="h-8 w-8 text-yellow-600 flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <h5 className="text-lg font-medium text-yellow-900 mb-2">Expire Old Invitations</h5>
                    <p className="text-sm text-yellow-800 mb-4">
                      Mark all invitations that have passed their expiry date as expired.
                      This helps maintain accurate invitation status and prevents confusion.
                    </p>
                    <div className="bg-yellow-100 rounded-lg p-3 mb-4">
                      <p className="text-sm text-yellow-800">
                        <strong>What this does:</strong>
                      </p>
                      <ul className="text-sm text-yellow-800 mt-1 ml-4 list-disc">
                        <li>Finds all invitations past their expiry date</li>
                        <li>Changes their status from 'pending' or 'sent' to 'expired'</li>
                        <li>Prevents these invitations from being used</li>
                        <li>Does not delete any data</li>
                      </ul>
                    </div>
                    <button
                      onClick={handleExpireOld}
                      disabled={loading}
                      className="inline-flex items-center px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50"
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Processing...
                        </>
                      ) : (
                        <>
                          <ClockIcon className="h-4 w-4 mr-2" />
                          Expire Old Invitations
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Cleanup Old Records */}
              <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <div className="flex items-start space-x-4">
                  <TrashIcon className="h-8 w-8 text-red-600 flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <h5 className="text-lg font-medium text-red-900 mb-2">Cleanup Old Records</h5>
                    <p className="text-sm text-red-800 mb-4">
                      Permanently delete old completed, expired, and cancelled invitation records
                      that are older than 90 days. This helps reduce database size and improve performance.
                    </p>
                    <div className="bg-red-100 rounded-lg p-3 mb-4">
                      <div className="flex items-start space-x-2">
                        <ExclamationTriangleIcon className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm text-red-800 font-medium">
                            Warning: This action cannot be undone!
                          </p>
                          <ul className="text-sm text-red-800 mt-1 ml-4 list-disc">
                            <li>Permanently deletes invitation records older than 90 days</li>
                            <li>Only affects completed, expired, and cancelled invitations</li>
                            <li>Active and pending invitations are not affected</li>
                            <li>This data cannot be recovered after deletion</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={handleCleanupOld}
                      disabled={loading}
                      className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Processing...
                        </>
                      ) : (
                        <>
                          <TrashIcon className="h-4 w-4 mr-2" />
                          Cleanup Old Records
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Best Practices */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h5 className="text-lg font-medium text-blue-900 mb-2">Best Practices</h5>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Run "Expire Old Invitations" weekly to maintain accurate status</li>
                  <li>• Run "Cleanup Old Records" monthly to keep the database optimized</li>
                  <li>• Always backup your database before running cleanup operations</li>
                  <li>• Monitor invitation acceptance rates to identify issues early</li>
                  <li>• Consider extending expiry dates for important invitations before they expire</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {activeTab === 'manage' && (
          <div className="flex justify-end p-6 border-t border-slate-200">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2E86AB]"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
};