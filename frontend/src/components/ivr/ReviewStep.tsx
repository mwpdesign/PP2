import React from 'react';
import { format } from 'date-fns';
import { Patient, IVRFormData, Document } from '../../types/ivr';
import { DocumentIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

interface ReviewStepProps {
  patient: Patient;
  formData: IVRFormData;
}

const ReviewStep: React.FC<ReviewStepProps> = ({ patient, formData }) => {
  const renderDocumentStatus = (doc: Document) => {
    if (doc.status === 'verified') {
      return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
    } else if (doc.status === 'rejected') {
      return <XCircleIcon className="h-5 w-5 text-red-500" />;
    }
    return <span className="text-sm text-gray-500">Pending</span>;
  };

  const renderSection = (title: string, children: React.ReactNode) => (
    <div className="border-t border-gray-200 pt-6 first:border-t-0 first:pt-0">
      <h3 className="text-lg font-medium text-gray-900 mb-4">{title}</h3>
      {children}
    </div>
  );

  const renderField = (label: string, value: string | number | null | undefined) => (
    <div>
      <dt className="text-sm font-medium text-gray-500">{label}</dt>
      <dd className="mt-1 text-sm text-gray-900">{value || 'N/A'}</dd>
    </div>
  );

  return (
    <div className="space-y-8 bg-white rounded-lg border border-gray-200 p-6">
      {/* Header */}
      <div className="border-b border-gray-200 pb-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Insurance Verification Request</h2>
            <p className="mt-1 text-sm text-gray-500">
              Created on {format(new Date(formData.createdAt), 'MMM d, yyyy')}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-gray-900">IVR Status</p>
            <p className="mt-1 text-sm text-gray-500">{formData.status}</p>
          </div>
        </div>
      </div>

      {/* Patient Information */}
      {renderSection('Patient Information', (
        <div className="grid grid-cols-2 gap-4">
          {renderField('Name', `${patient.firstName} ${patient.lastName}`)}
          {renderField('Date of Birth', format(new Date(patient.dateOfBirth), 'MMM d, yyyy'))}
          {renderField('Phone', patient.phone)}
          {renderField('Email', patient.email)}
          <div className="col-span-2">
            {renderField('Address', patient.address && `${patient.address}, ${patient.city}, ${patient.state} ${patient.zipCode}`)}
          </div>
        </div>
      ))}

      {/* Treatment Information */}
      {renderSection('Treatment Information', (
        <div className="space-y-4">
          <div>
            <dt className="text-sm font-medium text-gray-500">Skin Substitute Application</dt>
            <dd className="mt-1">
              {formData.treatmentInfo.skinSubstituteAcknowledged ? (
                <span className="text-green-600">Acknowledged</span>
              ) : (
                <span className="text-red-600">Not Acknowledged</span>
              )}
            </dd>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {renderField('Q Code Product', formData.treatmentInfo.qCodeProduct)}
            {renderField('Product Size', formData.treatmentInfo.qCodeSize)}
            {renderField('Full Q Code', formData.treatmentInfo.qCode)}
            {renderField('Start Date', formData.treatmentInfo.startDate && format(new Date(formData.treatmentInfo.startDate), 'MMM d, yyyy'))}
            {renderField('Number of Applications', formData.treatmentInfo.numberOfApplications)}
            {renderField('Frequency', formData.treatmentInfo.frequency)}
            {renderField('Total Surface Area', `${formData.treatmentInfo.totalSurfaceArea} cm²`)}
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Diagnosis Codes</dt>
            <dd className="mt-2 space-y-2">
              {formData.treatmentInfo.diagnosisCodes.map((diagnosis, index) => (
                <div key={index} className="flex items-start">
                  <span className="text-sm font-medium w-24">{diagnosis.code}</span>
                  <span className="text-sm text-gray-500">{diagnosis.description}</span>
                </div>
              ))}
            </dd>
          </div>
          {formData.treatmentInfo.clinicalNotes && (
            <div>
              <dt className="text-sm font-medium text-gray-500">Clinical Notes</dt>
              <dd className="mt-1 text-sm whitespace-pre-wrap">{formData.treatmentInfo.clinicalNotes}</dd>
            </div>
          )}
        </div>
      ))}

      {/* Insurance Information */}
      {renderSection('Insurance Information', (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {renderField('Insurance Provider', patient.insuranceInfo.provider)}
            {renderField('Policy Number', formData.insuranceDetails.policyNumber)}
            {renderField('Group Number', formData.insuranceDetails.groupNumber)}
            {renderField('Verification Status', formData.insuranceDetails.verificationStatus)}
          </div>
          {formData.insuranceDetails.preAuthRequired && (
            <div>
              <dt className="text-sm font-medium text-gray-500">Pre-authorization Number</dt>
              <dd className="mt-1">{formData.insuranceDetails.preAuthNumber || 'Pending'}</dd>
            </div>
          )}
          {formData.insuranceDetails.coverageNotes && (
            <div>
              <dt className="text-sm font-medium text-gray-500">Coverage Notes</dt>
              <dd className="mt-1 text-sm whitespace-pre-wrap">{formData.insuranceDetails.coverageNotes}</dd>
            </div>
          )}
        </div>
      ))}

      {/* Supporting Documents */}
      {renderSection('Supporting Documents', (
        <div className="space-y-3">
          {formData.supportingDocuments.map((doc) => (
            <div key={doc.id} className="flex items-center justify-between py-2">
              <div className="flex items-center space-x-3">
                <DocumentIcon className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">{doc.name}</p>
                  <p className="text-xs text-gray-500">
                    Uploaded {format(new Date(doc.uploadedAt), 'MMM d, yyyy')}
                  </p>
                </div>
              </div>
              <div className="flex items-center">
                {renderDocumentStatus(doc)}
              </div>
            </div>
          ))}
        </div>
      ))}

      {/* Physician Information */}
      {renderSection('Physician Information', (
        <div className="grid grid-cols-2 gap-4">
          {renderField('Name', formData.physician.name)}
          {renderField('NPI', formData.physician.npi)}
          {renderField('Medicare PTAN', formData.physician.medicarePTAN)}
          {renderField('Tax ID', formData.physician.taxId)}
          <div className="col-span-2">
            <dt className="text-sm font-medium text-gray-500">Facility</dt>
            <dd className="mt-1">
              <p>{formData.physician.facility.name}</p>
              <p className="text-sm text-gray-500">{formData.physician.facility.address}</p>
              <p className="text-sm text-gray-500">{formData.physician.facility.phone}</p>
            </dd>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ReviewStep;