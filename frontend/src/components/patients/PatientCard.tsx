import React from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { UserIcon, CalendarIcon, ClipboardDocumentListIcon, ClockIcon } from '@heroicons/react/24/outline';
import { Patient } from '../../types/ivr';

interface PatientCardProps {
  patient: Patient;
  onSelect?: (patientId: string) => void;
  showActions?: boolean;
}

const PatientCard: React.FC<PatientCardProps> = ({
  patient,
  onSelect,
  showActions = true
}) => {
  const navigate = useNavigate();

  const handleSubmitIVR = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/ivr/submit/${patient.id}`);
  };

  const handleSelect = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onSelect) {
      onSelect(patient.id);
    }
  };

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
    <div
      className={`
        relative rounded-lg border p-6 cursor-pointer transition-all bg-white shadow-sm hover:shadow-md
        ${onSelect ? 'hover:border-[#2C3E50]' : ''}
      `}
      onClick={handleSelect}
    >
      <div className="grid grid-cols-[2fr_1.5fr_1fr_1.5fr_1fr] gap-6 items-center">
        {/* Column 1: Patient Basic Info */}
        <div className="flex items-center space-x-4">
          <div className="flex-shrink-0">
            <div className="h-12 w-12 rounded-full bg-[#2C3E50] bg-opacity-10 flex items-center justify-center">
              <UserIcon className="h-6 w-6 text-[#2C3E50]" />
            </div>
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-900">
              {patient.firstName} {patient.lastName}
            </h3>
            <div className="mt-1 flex items-center space-x-2 text-sm text-gray-500">
              <CalendarIcon className="h-4 w-4" />
              <span>DOB: {format(new Date(patient.dateOfBirth), 'MM/dd/yyyy')}</span>
            </div>
          </div>
        </div>

        {/* Column 2: Primary Condition */}
        <div>
          <p className="text-xs font-medium text-gray-500">Primary Condition</p>
          <div className="mt-1">
            <div className="flex items-center space-x-2">
              <ClipboardDocumentListIcon className="h-4 w-4 text-gray-400" />
              <p className="text-sm text-gray-900">{patient.primaryCondition || 'Not specified'}</p>
            </div>
          </div>
        </div>

        {/* Column 3: Last Visit */}
        <div>
          <p className="text-xs font-medium text-gray-500">Last Visit</p>
          <div className="mt-1">
            <div className="flex items-center space-x-2">
              <ClockIcon className="h-4 w-4 text-gray-400" />
              <p className="text-sm text-gray-900">
                {patient.lastVisitDate 
                  ? format(new Date(patient.lastVisitDate), 'MM/dd/yyyy')
                  : 'No visits recorded'}
              </p>
            </div>
          </div>
        </div>

        {/* Column 4: Insurance Info */}
        <div>
          <p className="text-xs font-medium text-gray-500">Insurance Provider</p>
          <div className="mt-1">
            <div className="flex items-center space-x-2">
              <p className="text-sm text-gray-900">{patient.insuranceInfo.provider}</p>
              {patient.insuranceInfo.status && (
                <span className={`
                  inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                  ${getInsuranceStatusColor(patient.insuranceInfo.status)}
                `}>
                  {patient.insuranceInfo.status.charAt(0).toUpperCase() + patient.insuranceInfo.status.slice(1)}
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Policy #: {patient.insuranceInfo.policyNumber}
            </p>
          </div>
        </div>

        {/* Column 5: Action Buttons */}
        {showActions && (
          <div className="flex flex-col space-y-2">
            <button
              type="button"
              onClick={handleSelect}
              className="inline-flex items-center justify-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 w-full"
            >
              View Details
            </button>
            <button
              type="button"
              onClick={handleSubmitIVR}
              className="inline-flex items-center justify-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-[#2C3E50] hover:bg-[#375788] w-full"
            >
              Submit IVR
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientCard; 