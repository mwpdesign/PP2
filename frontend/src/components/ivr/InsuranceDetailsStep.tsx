import React, { useState, useEffect, useCallback } from 'react';
import { Patient, InsuranceDetails, Document } from '../../types/ivr';
import UniversalFileUpload from '../shared/UniversalFileUpload';
import { toast } from 'react-toastify';
import { useSmartAutoPopulation } from '../../hooks/useSmartAutoPopulation';
import { InsuranceProvider } from '../../types/autoPopulation';
import { ChevronDownIcon, CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';

interface InsuranceDetailsStepProps {
  patient: Patient;
  insuranceDetails: InsuranceDetails;
  onInsuranceDetailsChange: (details: InsuranceDetails) => void;
  documents: Document[];
  onDocumentsChange: (documents: Document[]) => void;
}

const InsuranceDetailsStep: React.FC<InsuranceDetailsStepProps> = ({
  patient,
  insuranceDetails,
  onInsuranceDetailsChange,
  documents,
  onDocumentsChange
}) => {
  const [isVerifying, setIsVerifying] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [insuranceSearchQuery, setInsuranceSearchQuery] = useState('');
  const [showInsuranceDropdown, setShowInsuranceDropdown] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<InsuranceProvider | null>(null);

  // Smart Auto-Population for insurance search
  const autoPopulation = useSmartAutoPopulation({
    patientId: patient.id,
    formType: 'insurance',
    currentFieldValues: {
      state: patient.state,
      insuranceProvider: insuranceSearchQuery
    },
    userRole: 'doctor',
    enableInsuranceAutoComplete: true,
    debounceMs: 300
  });

  const handleInputChange = (field: keyof InsuranceDetails, value: any) => {
    onInsuranceDetailsChange({
      ...insuranceDetails,
      [field]: value
    });
  };

  // Handle insurance provider search
  const handleInsuranceSearch = useCallback((query: string) => {
    setInsuranceSearchQuery(query);
    if (query.length > 2) {
      autoPopulation.searchInsurance(query);
      setShowInsuranceDropdown(true);
    } else {
      setShowInsuranceDropdown(false);
    }
  }, [autoPopulation]);

  // Handle insurance provider selection
  const handleProviderSelect = (provider: InsuranceProvider) => {
    setSelectedProvider(provider);
    setInsuranceSearchQuery(provider.name);
    setShowInsuranceDropdown(false);

    // Auto-fill insurance details based on provider
    handleInputChange('policyNumber', insuranceDetails.policyNumber || '');
    handleInputChange('preAuthRequired', provider.contactInfo.priorAuthRequired);

    // Show helpful information about the provider
    toast.info(`Selected ${provider.name}. ${provider.contactInfo.priorAuthRequired ? 'Prior authorization required.' : 'No prior authorization required.'}`, {
      duration: 4000
    });
  };

  // Insurance Provider Dropdown Component
  const InsuranceProviderDropdown: React.FC = () => {
    if (!showInsuranceDropdown || autoPopulation.insuranceProviders.length === 0) {
      return null;
    }

    return (
      <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
        {autoPopulation.insuranceLoading && (
          <div className="px-4 py-2 text-sm text-gray-500">
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
              Searching insurance providers...
            </div>
          </div>
        )}
        {autoPopulation.insuranceProviders.map((provider) => (
          <div
            key={provider.id}
            className="cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-blue-50"
            onClick={() => handleProviderSelect(provider)}
          >
            <div className="flex items-center">
              <span className="font-medium text-gray-900 block truncate">
                {provider.name}
              </span>
              <span className="ml-2 text-xs text-gray-500">
                ({provider.code})
              </span>
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {provider.contactInfo.priorAuthRequired ? 'Prior auth required' : 'No prior auth required'} •
              {provider.coverage.woundCare ? ' Wound care covered' : ' Wound care not covered'}
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Provider Coverage Info Component
  const ProviderCoverageInfo: React.FC<{ provider: InsuranceProvider }> = ({ provider }) => (
    <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
      <h4 className="text-sm font-medium text-blue-900 mb-2">Coverage Information</h4>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
        <div className="flex items-center">
          {provider.coverage.woundCare ? (
            <CheckCircleIcon className="h-4 w-4 text-green-500 mr-1" />
          ) : (
            <ExclamationCircleIcon className="h-4 w-4 text-red-500 mr-1" />
          )}
          <span className={provider.coverage.woundCare ? 'text-green-700' : 'text-red-700'}>
            Wound Care
          </span>
        </div>
        <div className="flex items-center">
          {provider.coverage.skinSubstitutes ? (
            <CheckCircleIcon className="h-4 w-4 text-green-500 mr-1" />
          ) : (
            <ExclamationCircleIcon className="h-4 w-4 text-red-500 mr-1" />
          )}
          <span className={provider.coverage.skinSubstitutes ? 'text-green-700' : 'text-red-700'}>
            Skin Substitutes
          </span>
        </div>
        <div className="flex items-center">
          {provider.coverage.negativePresssure ? (
            <CheckCircleIcon className="h-4 w-4 text-green-500 mr-1" />
          ) : (
            <ExclamationCircleIcon className="h-4 w-4 text-red-500 mr-1" />
          )}
          <span className={provider.coverage.negativePresssure ? 'text-green-700' : 'text-red-700'}>
            Negative Pressure
          </span>
        </div>
      </div>
      <div className="mt-2 text-xs text-blue-700">
        Contact: {provider.contactInfo.phone}
        {provider.contactInfo.website && (
          <span> • <a href={provider.contactInfo.website} target="_blank" rel="noopener noreferrer" className="underline">Website</a></span>
        )}
      </div>
    </div>
  );

  const handleVerifyInsurance = async () => {
    setIsVerifying(true);
    try {
      // TODO: Implement actual insurance verification API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      handleInputChange('verificationStatus', 'verified');
      handleInputChange('verificationDate', new Date().toISOString());
      toast.success('Insurance verification completed successfully');
    } catch (error) {
      handleInputChange('verificationStatus', 'failed');
      toast.error('Insurance verification failed. Please check the details and try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleFileChange = async (file: File | null, documentType: string) => {
    if (!file) {
      // Remove document
      const newDocs = documents.filter(d => d.type !== documentType);
      onDocumentsChange(newDocs);
      return;
    }

    // Simulate file upload with progress
    setUploadProgress(prev => ({ ...prev, [documentType]: 0 }));

    // TODO: Replace with actual file upload API call
    for (let progress = 0; progress <= 100; progress += 10) {
      setUploadProgress(prev => ({ ...prev, [documentType]: progress }));
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    const mockUpload: Document = {
      id: `DOC-${Math.random().toString(36).substr(2, 9)}`,
      name: file.name,
      type: documentType,
      url: URL.createObjectURL(file),
      uploadedAt: new Date().toISOString(),
      status: 'pending'
    };

    const newDocs = documents.filter(d => d.type !== documentType);
    onDocumentsChange([...newDocs, mockUpload]);

    // Clear progress after upload
    setUploadProgress(prev => {
      const { [documentType]: removed, ...rest } = prev;
      return rest;
    });

    toast.success(`${file.name} uploaded successfully`);
  };

  const getDocumentByType = (type: string) => {
    return documents.find(d => d.type === type);
  };

  return (
    <div className="space-y-8 bg-white rounded-lg border border-gray-200 p-6">
      {/* Insurance Information */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Insurance Information</h3>
        <div className="grid grid-cols-1 gap-6">
          {/* Enhanced Insurance Provider Search */}
          <div className="relative">
            <label htmlFor="insuranceProvider" className="block text-sm font-medium text-gray-700">
              Insurance Provider *
            </label>
            <div className="mt-1 relative">
              <input
                type="text"
                id="insuranceProvider"
                value={insuranceSearchQuery}
                onChange={(e) => handleInsuranceSearch(e.target.value)}
                onFocus={() => {
                  if (insuranceSearchQuery.length > 2) {
                    setShowInsuranceDropdown(true);
                  }
                }}
                onBlur={() => {
                  // Delay hiding dropdown to allow for clicks
                  setTimeout(() => setShowInsuranceDropdown(false), 200);
                }}
                className="block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-[#2C3E50] focus:ring-[#2C3E50] sm:text-sm"
                placeholder="Search for insurance provider..."
                required
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                <ChevronDownIcon className="h-4 w-4 text-gray-400" />
              </div>
              <InsuranceProviderDropdown />
            </div>
            {selectedProvider && <ProviderCoverageInfo provider={selectedProvider} />}
          </div>

          <div>
            <label htmlFor="policyNumber" className="block text-sm font-medium text-gray-700">
              Policy Number *
            </label>
            <input
              type="text"
              id="policyNumber"
              value={insuranceDetails.policyNumber}
              onChange={(e) => handleInputChange('policyNumber', e.target.value)}
              required
              className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-[#2C3E50] focus:ring-[#2C3E50] sm:text-sm"
              placeholder={selectedProvider?.commonPolicyFormats[0] || 'Enter policy number'}
            />
            {selectedProvider && (
              <p className="mt-1 text-xs text-gray-500">
                Common format: {selectedProvider.commonPolicyFormats.join(' or ')}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="groupNumber" className="block text-sm font-medium text-gray-700">
              Group Number
            </label>
            <input
              type="text"
              id="groupNumber"
              value={insuranceDetails.groupNumber || ''}
              onChange={(e) => handleInputChange('groupNumber', e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-[#2C3E50] focus:ring-[#2C3E50] sm:text-sm"
            />
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-gray-700">
                Verification Status
              </label>
              <button
                type="button"
                onClick={handleVerifyInsurance}
                disabled={isVerifying || !insuranceDetails.policyNumber}
                className="ml-3 inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-[#2C3E50] hover:bg-[#375788] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2C3E50] disabled:opacity-50"
              >
                {isVerifying ? 'Verifying...' : 'Verify Insurance'}
              </button>
            </div>
            <div className="mt-2">
              <span className={`
                inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                ${insuranceDetails.verificationStatus === 'verified' ? 'bg-green-100 text-green-800' :
                  insuranceDetails.verificationStatus === 'failed' ? 'bg-red-100 text-red-800' :
                  'bg-yellow-100 text-yellow-800'}
              `}>
                {insuranceDetails.verificationStatus.charAt(0).toUpperCase() + insuranceDetails.verificationStatus.slice(1)}
              </span>
            </div>
          </div>

          <div className="flex items-center">
            <input
              id="preAuthRequired"
              type="checkbox"
              checked={insuranceDetails.preAuthRequired}
              onChange={(e) => handleInputChange('preAuthRequired', e.target.checked)}
              className="h-4 w-4 text-[#2C3E50] border-gray-300 rounded focus:ring-[#2C3E50]"
            />
            <label htmlFor="preAuthRequired" className="ml-2 block text-sm text-gray-900">
              Pre-authorization required
            </label>
            {selectedProvider && selectedProvider.contactInfo.priorAuthRequired && (
              <span className="ml-2 text-xs text-blue-600">(Required by {selectedProvider.name})</span>
            )}
          </div>

          {insuranceDetails.preAuthRequired && (
            <div>
              <label htmlFor="preAuthNumber" className="block text-sm font-medium text-gray-700">
                Pre-authorization Number
              </label>
              <input
                type="text"
                id="preAuthNumber"
                value={insuranceDetails.preAuthNumber || ''}
                onChange={(e) => handleInputChange('preAuthNumber', e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-[#2C3E50] focus:ring-[#2C3E50] sm:text-sm"
              />
            </div>
          )}

          <div>
            <label htmlFor="coverageNotes" className="block text-sm font-medium text-gray-700">
              Coverage Notes
            </label>
            <textarea
              id="coverageNotes"
              rows={3}
              value={insuranceDetails.coverageNotes || ''}
              onChange={(e) => handleInputChange('coverageNotes', e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-[#2C3E50] focus:ring-[#2C3E50] sm:text-sm"
              placeholder="Enter any notes about coverage details or restrictions"
            />
          </div>
        </div>
      </div>

      {/* Required Documents */}
      <div className="border-t border-gray-200 pt-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Required Documents</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          <div className="space-y-2">
            <UniversalFileUpload
              label="Face Sheet/Demographics"
              description="Upload patient demographics and face sheet information"
              required
              value={getDocumentByType('face_sheet')?.file as File}
              onChange={(file) => handleFileChange(file, 'face_sheet')}
              onUploadProgress={(progress) => setUploadProgress(prev => ({ ...prev, face_sheet: progress }))}
              status={uploadProgress['face_sheet'] ? 'uploading' : getDocumentByType('face_sheet')?.status === 'verified' ? 'success' : 'pending'}
              acceptedFileTypes={['.pdf', '.jpg', '.jpeg', '.png', '.tiff']}
              maxSizeMB={25}
              showCamera={true}
            />

            <UniversalFileUpload
              label="Insurance Card (Front)"
              description="Upload the front side of the insurance card"
              required
              value={getDocumentByType('insurance_card_front')?.file as File}
              onChange={(file) => handleFileChange(file, 'insurance_card_front')}
              onUploadProgress={(progress) => setUploadProgress(prev => ({ ...prev, insurance_card_front: progress }))}
              status={uploadProgress['insurance_card_front'] ? 'uploading' : getDocumentByType('insurance_card_front')?.status === 'verified' ? 'success' : 'pending'}
              acceptedFileTypes={['.pdf', '.jpg', '.jpeg', '.png', '.tiff']}
              maxSizeMB={25}
              showCamera={true}
            />
          </div>

          <div className="space-y-2">
            <UniversalFileUpload
              label="Patient ID"
              description="Upload a valid government-issued ID"
              required
              value={getDocumentByType('patient_id')?.file as File}
              onChange={(file) => handleFileChange(file, 'patient_id')}
              onUploadProgress={(progress) => setUploadProgress(prev => ({ ...prev, patient_id: progress }))}
              status={uploadProgress['patient_id'] ? 'uploading' : getDocumentByType('patient_id')?.status === 'verified' ? 'success' : 'pending'}
              acceptedFileTypes={['.pdf', '.jpg', '.jpeg', '.png', '.tiff']}
              maxSizeMB={25}
              showCamera={true}
            />

            <UniversalFileUpload
              label="Insurance Card (Back)"
              description="Upload the back side of the insurance card"
              required
              value={getDocumentByType('insurance_card_back')?.file as File}
              onChange={(file) => handleFileChange(file, 'insurance_card_back')}
              onUploadProgress={(progress) => setUploadProgress(prev => ({ ...prev, insurance_card_back: progress }))}
              status={uploadProgress['insurance_card_back'] ? 'uploading' : getDocumentByType('insurance_card_back')?.status === 'verified' ? 'success' : 'pending'}
              acceptedFileTypes={['.pdf', '.jpg', '.jpeg', '.png', '.tiff']}
              maxSizeMB={25}
              showCamera={true}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default InsuranceDetailsStep;