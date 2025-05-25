import React, { useState } from 'react';
import { Patient, InsuranceDetails, Document } from '../../types/ivr';
import { DocumentIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

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

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, documentType: string) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // TODO: Implement actual file upload API call
    const mockUpload: Document = {
      id: `DOC-${Math.random().toString(36).substr(2, 9)}`,
      name: file.name,
      type: documentType,
      url: URL.createObjectURL(file),
      uploadedAt: new Date().toISOString(),
      status: 'pending'
    };

    onDocumentsChange([...documents, mockUpload]);
  };

  const getDocumentStatus = (type: string) => {
    const doc = documents.find(d => d.type === type);
    return doc ? doc.status : null;
  };

  const renderDocumentUpload = (type: string, label: string, required: boolean = true) => {
    const status = getDocumentStatus(type);
    const existingDoc = documents.find(d => d.type === type);

    return (
      <div className="relative border rounded-lg p-4 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <DocumentIcon className="h-6 w-6 text-gray-400" />
            <div>
              <p className="text-sm font-medium text-gray-900">
                {label} {required && <span className="text-red-500">*</span>}
              </p>
              <p className="text-xs text-gray-500">PDF, JPG, or PNG up to 10MB</p>
            </div>
          </div>
          {status && (
            <div className="flex items-center">
              {status === 'verified' ? (
                <CheckCircleIcon className="h-5 w-5 text-green-500" />
              ) : status === 'rejected' ? (
                <XCircleIcon className="h-5 w-5 text-red-500" />
              ) : (
                <div className="text-xs text-gray-500">Pending</div>
              )}
            </div>
          )}
        </div>
        {existingDoc ? (
          <div className="mt-2">
            <p className="text-sm text-gray-600">{existingDoc.name}</p>
            <button
              type="button"
              onClick={() => {
                const newDocs = documents.filter(d => d.id !== existingDoc.id);
                onDocumentsChange(newDocs);
              }}
              className="mt-1 text-sm text-red-600 hover:text-red-800"
            >
              Remove
            </button>
          </div>
        ) : (
          <input
            type="file"
            onChange={(e) => handleFileUpload(e, type)}
            accept=".pdf,.jpg,.jpeg,.png"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
        )}
      </div>
    );
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
        <div className="grid grid-cols-1 gap-4">
          {renderDocumentUpload('face_sheet', 'Face Sheet/Demographics', true)}
          {renderDocumentUpload('patient_id', 'Patient ID', true)}
          {renderDocumentUpload('insurance_card_front', 'Insurance Card (Front)', true)}
          {renderDocumentUpload('insurance_card_back', 'Insurance Card (Back)', true)}
        </div>
      </div>
    </div>
  );
};

export default InsuranceDetailsStep; 