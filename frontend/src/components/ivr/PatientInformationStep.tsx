import React from 'react';
import { format } from 'date-fns';
import { Patient } from '../../types/ivr';

interface PatientInformationStepProps {
  patient: Patient;
}

const PatientInformationStep: React.FC<PatientInformationStepProps> = ({ patient }) => {
  const getInsuranceStatusColor = (status?: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'expired':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Patient Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Full Name</label>
            <div className="mt-1 p-3 bg-gray-50 rounded-md">
              {patient.firstName} {patient.lastName}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
            <div className="mt-1 p-3 bg-gray-50 rounded-md">
              {format(new Date(patient.dateOfBirth), 'MMMM d, yyyy')}
            </div>
          </div>

          {patient.email && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <div className="mt-1 p-3 bg-gray-50 rounded-md">
                {patient.email}
              </div>
            </div>
          )}

          {patient.phone && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Phone</label>
              <div className="mt-1 p-3 bg-gray-50 rounded-md">
                {patient.phone}
              </div>
            </div>
          )}

          {patient.address && (
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Address</label>
              <div className="mt-1 p-3 bg-gray-50 rounded-md">
                {patient.address}
                {patient.city && patient.state && patient.zipCode && (
                  <div className="mt-1">
                    {patient.city}, {patient.state} {patient.zipCode}
                  </div>
                )}
              </div>
            </div>
          )}

          {patient.insuranceInfo && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700">Insurance Provider</label>
                <div className="mt-1 p-3 bg-gray-50 rounded-md flex items-center justify-between">
                  <span>{patient.insuranceInfo.provider}</span>
                  {patient.insuranceInfo.status && (
                    <span className={`
                      inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                      ${getInsuranceStatusColor(patient.insuranceInfo.status)}
                    `}>
                      {patient.insuranceInfo.status.charAt(0).toUpperCase() + patient.insuranceInfo.status.slice(1)}
                    </span>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Policy Number</label>
                <div className="mt-1 p-3 bg-gray-50 rounded-md font-mono">
                  {patient.insuranceInfo.policyNumber}
                </div>
              </div>

              {patient.insuranceInfo.groupNumber && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Group Number</label>
                  <div className="mt-1 p-3 bg-gray-50 rounded-md font-mono">
                    {patient.insuranceInfo.groupNumber}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <div className="rounded-md bg-blue-50 p-4">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              Insurance Verification Request
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>
                You are creating an Insurance Verification Request (IVR) for this patient.
                Please verify that all patient information is correct before proceeding.
                The insurance information shown here will be used for the verification process.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientInformationStep; 