import React, { useState } from 'react';
import { Patient, InsuranceDetails, Document } from '../../types/ivr';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import DocumentUpload from '../shared/DocumentUpload';
import { toast } from 'react-toastify';

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

  const handleInputChange = (field: keyof InsuranceDetails, value: any) => {
    onInsuranceDetailsChange({
      ...insuranceDetails,
      [field]: value
    });
  };

  const handleVerifyInsurance = async () => {
    setIsVerifying(true);
    try {
      // TODO: Implement actual insurance verification API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      handleInputChange('verificationStatus', 'verified');
      handleInputChange('verificationDate', new Date().toISOString());
    } catch (error) {
      handleInputChange('verificationStatus', 'failed');
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
          <div>
            <label className="block text-sm font-medium text-gray-700">Insurance Provider</label>
            <div className="mt-1 text-sm text-gray-900">{patient.insuranceInfo.provider}</div>
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
            />
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
                disabled={isVerifying}
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
            <DocumentUpload
              label="Face Sheet/Demographics"
              description="Upload patient demographics and face sheet information"
              required
              value={getDocumentByType('face_sheet')?.file as File}
              onChange={(file) => handleFileChange(file, 'face_sheet')}
              onUploadProgress={(progress) => setUploadProgress(prev => ({ ...prev, face_sheet: progress }))}
              status={uploadProgress['face_sheet'] ? 'uploading' : getDocumentByType('face_sheet')?.status === 'verified' ? 'success' : 'pending'}
              acceptedFileTypes={['.pdf', '.jpg', '.jpeg', '.png']}
              maxSizeMB={10}
              showCamera={false}
            />

            <DocumentUpload
              label="Insurance Card (Front)"
              description="Upload the front side of the insurance card"
              required
              value={getDocumentByType('insurance_card_front')?.file as File}
              onChange={(file) => handleFileChange(file, 'insurance_card_front')}
              onUploadProgress={(progress) => setUploadProgress(prev => ({ ...prev, insurance_card_front: progress }))}
              status={uploadProgress['insurance_card_front'] ? 'uploading' : getDocumentByType('insurance_card_front')?.status === 'verified' ? 'success' : 'pending'}
              acceptedFileTypes={['.jpg', '.jpeg', '.png']}
              maxSizeMB={10}
              showCamera={true}
            />
          </div>

          <div className="space-y-2">
            <DocumentUpload
              label="Patient ID"
              description="Upload a valid government-issued ID"
              required
              value={getDocumentByType('patient_id')?.file as File}
              onChange={(file) => handleFileChange(file, 'patient_id')}
              onUploadProgress={(progress) => setUploadProgress(prev => ({ ...prev, patient_id: progress }))}
              status={uploadProgress['patient_id'] ? 'uploading' : getDocumentByType('patient_id')?.status === 'verified' ? 'success' : 'pending'}
              acceptedFileTypes={['.jpg', '.jpeg', '.png']}
              maxSizeMB={10}
              showCamera={true}
            />

            <DocumentUpload
              label="Insurance Card (Back)"
              description="Upload the back side of the insurance card"
              required
              value={getDocumentByType('insurance_card_back')?.file as File}
              onChange={(file) => handleFileChange(file, 'insurance_card_back')}
              onUploadProgress={(progress) => setUploadProgress(prev => ({ ...prev, insurance_card_back: progress }))}
              status={uploadProgress['insurance_card_back'] ? 'uploading' : getDocumentByType('insurance_card_back')?.status === 'verified' ? 'success' : 'pending'}
              acceptedFileTypes={['.jpg', '.jpeg', '.png']}
              maxSizeMB={10}
              showCamera={true}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default InsuranceDetailsStep; 