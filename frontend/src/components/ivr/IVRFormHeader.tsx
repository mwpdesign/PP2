import React from 'react';
import { format } from 'date-fns';
import { IVRTracking, Patient, PhysicianInfo } from '../../types/ivr';
import { IdentificationIcon } from '@heroicons/react/24/outline';

interface IVRFormHeaderProps {
  tracking: IVRTracking;
  patient: Patient;
  physician: PhysicianInfo;
}

const IVRFormHeader: React.FC<IVRFormHeaderProps> = ({
  tracking,
  patient,
  physician
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted':
        return 'bg-blue-100 text-blue-800';
      case 'in_review':
        return 'bg-yellow-100 text-yellow-800';
      case 'pending_approval':
        return 'bg-orange-100 text-orange-800';
      case 'documents_requested':
        return 'bg-purple-100 text-purple-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'escalated':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* IVR Details */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">IVR Details</h3>
          <dl className="space-y-2">
            <div>
              <dt className="text-sm font-medium text-gray-500">IVR ID</dt>
              <dd className="text-sm text-gray-900">{tracking.id}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Status</dt>
              <dd>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(tracking.status)}`}>
                  {tracking.status ? String(tracking.status).replace('_', ' ').toUpperCase() : 'UNKNOWN'}
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Created</dt>
              <dd className="text-sm text-gray-900">{format(new Date(tracking.createdAt), 'MMM d, yyyy h:mm a')}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
              <dd className="text-sm text-gray-900">{format(new Date(tracking.lastUpdatedAt), 'MMM d, yyyy h:mm a')}</dd>
            </div>
          </dl>
        </div>

        {/* Patient Information */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Patient Information</h3>
          <dl className="space-y-2">
            <div>
              <dt className="text-sm font-medium text-gray-500">Name</dt>
              <dd className="text-sm text-gray-900">{`${patient.firstName} ${patient.lastName}`}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Date of Birth</dt>
              <dd className="text-sm text-gray-900">{format(new Date(patient.dateOfBirth), 'MMM d, yyyy')}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Insurance</dt>
              <dd className="text-sm text-gray-900">{patient.insuranceInfo.provider}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Policy Number</dt>
              <dd className="text-sm text-gray-900">{patient.insuranceInfo.policyNumber}</dd>
            </div>
          </dl>
        </div>

        {/* Treating Physician */}
        <div className="bg-slate-50 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-4">
            <IdentificationIcon className="h-5 w-5 text-slate-600" />
            <h3 className="text-lg font-medium text-gray-900 mb-4">Treating Physician</h3>
          </div>
          <dl className="space-y-2">
            <div>
              <dt className="text-sm font-medium text-gray-500">Name</dt>
              <dd className="text-sm text-gray-900">{physician.name}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">NPI</dt>
              <dd className="text-sm text-gray-900">{physician.npi}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Medicaid Provider #</dt>
              <dd className="text-sm text-gray-900">{physician.medicaidProviderNumber}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Facility</dt>
              <dd className="text-sm text-gray-900">{physician.facility.name}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Medicare PTAN</dt>
              <dd className="text-sm text-gray-900">{physician.medicarePTAN}</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
};

export default IVRFormHeader;