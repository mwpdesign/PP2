import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MagnifyingGlassIcon, PlusIcon } from '@heroicons/react/24/outline';
import PageHeader from '../../../components/shared/layout/PageHeader';
import PatientCard from '../../../components/patients/PatientCard';
import { Patient } from '../../../types/ivr';

// Mock patient data - TODO: Replace with API call
const mockPatients: Patient[] = [
  {
    id: '1',
    firstName: 'John',
    lastName: 'Doe',
    dateOfBirth: '1980-01-15',
    email: 'john.doe@example.com',
    phone: '(555) 123-4567',
    address: '123 Main St',
    city: 'Los Angeles',
    state: 'CA',
    zipCode: '90001',
    primaryCondition: 'Chronic Wound - Stage 2',
    lastVisitDate: '2024-03-15',
    insuranceInfo: {
      provider: 'Blue Cross Blue Shield',
      policyNumber: 'BCBS123456789',
      groupNumber: 'GRP123',
      status: 'active'
    }
  },
  {
    id: '2',
    firstName: 'Jane',
    lastName: 'Smith',
    dateOfBirth: '1975-06-22',
    email: 'jane.smith@example.com',
    phone: '(555) 987-6543',
    address: '456 Oak Ave',
    city: 'San Francisco',
    state: 'CA',
    zipCode: '94110',
    primaryCondition: 'Diabetic Foot Ulcer',
    lastVisitDate: '2024-03-20',
    insuranceInfo: {
      provider: 'Aetna',
      policyNumber: 'AET987654321',
      groupNumber: 'GRP456',
      status: 'pending'
    }
  }
];

const PatientSelectionPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredPatients = mockPatients.filter(patient =>
    `${patient.firstName} ${patient.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.insuranceInfo.policyNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleViewDetails = (patientId: string) => {
    navigate(`/patients/${patientId}`);
  };

  const handleAddNewPatient = () => {
    navigate('/patients/intake');
  };

  return (
    <div className="px-8 pt-6">
      <PageHeader
        title="Select Patient"
        subtitle="Select a patient to submit an Insurance Verification Request"
      />

      {/* Search and Add Patient */}
      <div className="mt-6 mb-8 flex justify-between items-center">
        <div className="relative flex-1 max-w-lg">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
          </div>
          <input
            type="text"
            placeholder="Search by name or policy number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-[#2C3E50] focus:border-[#2C3E50] sm:text-sm"
          />
        </div>
        <button
          type="button"
          onClick={handleAddNewPatient}
          className="ml-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-[#2C3E50] hover:bg-[#375788]"
        >
          <PlusIcon className="h-5 w-5 mr-2" aria-hidden="true" />
          Add New Patient
        </button>
      </div>

      {/* Patient List */}
      <div className="space-y-4">
        {filteredPatients.map(patient => (
          <PatientCard
            key={patient.id}
            patient={patient}
            onSelect={handleViewDetails}
          />
        ))}

        {filteredPatients.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No patients found matching your search criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientSelectionPage; 