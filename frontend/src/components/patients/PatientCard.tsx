import React from 'react';
import { format } from 'date-fns';
import { UserIcon, CalendarIcon, ClockIcon } from '@heroicons/react/24/outline';

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  primaryCondition?: string;
  lastVisit?: string;
  insuranceProvider?: string;
  insuranceStatus?: 'active' | 'pending' | 'expired';
}

interface PatientCardProps {
  patient: Patient;
  onSubmitIVR: (patientId: string) => void;
  onViewDetails: (patientId: string) => void;
  selected?: boolean;
  onClick?: () => void;
}

const PatientCard: React.FC<PatientCardProps> = ({
  patient,
  onSubmitIVR,
  onViewDetails,
  selected = false,
  onClick
}) => {
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
      onClick={onClick}
      className={`
        relative rounded-lg border p-6 cursor-pointer transition-all bg-white shadow-md hover:shadow-lg
        ${selected 
          ? 'border-[#2C3E50] ring-1 ring-[#2C3E50] ring-opacity-50' 
          : 'border-gray-100 hover:border-[#2C3E50]'
        }
      `}
    >
      <div className="flex items-center justify-between space-x-8">
        <div className="flex items-center space-x-4 min-w-[240px]">
          <div className="flex-shrink-0">
            <div className="h-12 w-12 rounded-full bg-[#2C3E50] bg-opacity-10 flex items-center justify-center">
              <UserIcon className="h-6 w-6 text-[#2C3E50]" />
            </div>
          </div>
          <div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onViewDetails(patient.id);
              }}
              className="text-lg font-medium text-gray-900 hover:text-[#2C3E50] transition-colors group"
            >
              {patient.firstName} {patient.lastName}
              <span className="block h-0.5 max-w-0 bg-[#2C3E50] transition-all duration-300 group-hover:max-w-full"></span>
            </button>
            <div className="mt-1 flex items-center space-x-2 text-sm text-gray-500">
              <CalendarIcon className="h-4 w-4" />
              <span>DOB: {format(new Date(patient.dateOfBirth), 'MM/dd/yyyy')}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-8 flex-1">
          {patient.primaryCondition && (
            <div className="min-w-[200px]">
              <p className="text-xs font-medium text-gray-500">Primary Condition</p>
              <p className="mt-1 text-sm text-gray-900">{patient.primaryCondition}</p>
            </div>
          )}
          
          {patient.lastVisit && (
            <div className="min-w-[160px]">
              <p className="text-xs font-medium text-gray-500">Last Visit</p>
              <div className="mt-1 flex items-center text-sm text-gray-900">
                <ClockIcon className="mr-1.5 h-4 w-4 text-gray-400" />
                {format(new Date(patient.lastVisit), 'MM/dd/yyyy')}
              </div>
            </div>
          )}

          {patient.insuranceProvider && (
            <div className="min-w-[200px]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500">Insurance</p>
                  <p className="mt-1 text-sm text-gray-900">{patient.insuranceProvider}</p>
                </div>
                {patient.insuranceStatus && (
                  <span className={`
                    ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                    ${getInsuranceStatusColor(patient.insuranceStatus)}
                  `}>
                    {patient.insuranceStatus.charAt(0).toUpperCase() + patient.insuranceStatus.slice(1)}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onSubmitIVR(patient.id);
          }}
          className="ml-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-[#2C3E50] hover:bg-[#375788] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2C3E50]"
        >
          Submit IVR
        </button>
      </div>
    </div>
  );
};

export default PatientCard; 