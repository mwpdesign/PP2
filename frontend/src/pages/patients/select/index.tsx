import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MagnifyingGlassIcon, PlusIcon } from '@heroicons/react/24/outline';
import PageHeader from '../../../components/shared/layout/PageHeader';
import PatientCard from '../../../components/patients/PatientCard';

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

// TODO: Replace with API call
const mockPatients: Patient[] = [
  {
    id: '1',
    firstName: 'John',
    lastName: 'Doe',
    dateOfBirth: '1980-01-15',
    primaryCondition: 'Type 2 Diabetes',
    lastVisit: '2024-05-20',
    insuranceProvider: 'Blue Cross Blue Shield',
    insuranceStatus: 'active'
  },
  {
    id: '2',
    firstName: 'Jane',
    lastName: 'Smith',
    dateOfBirth: '1975-03-22',
    primaryCondition: 'Hypertension',
    lastVisit: '2024-05-18',
    insuranceProvider: 'Aetna',
    insuranceStatus: 'pending'
  },
  {
    id: '3',
    firstName: 'Robert',
    lastName: 'Johnson',
    dateOfBirth: '1992-07-08',
    primaryCondition: 'Chronic Wound',
    lastVisit: '2024-05-15',
    insuranceProvider: 'UnitedHealthcare',
    insuranceStatus: 'expired'
  }
];

const PatientSelectionPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<string | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // TODO: Replace with actual API call
    const fetchPatients = async () => {
      try {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        setPatients(mockPatients);
      } catch (error) {
        console.error('Error fetching patients:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPatients();
  }, []);

  const filteredPatients = patients.filter(patient => {
    const searchLower = searchTerm.toLowerCase();
    return (
      patient.firstName.toLowerCase().includes(searchLower) ||
      patient.lastName.toLowerCase().includes(searchLower) ||
      patient.primaryCondition?.toLowerCase().includes(searchLower) ||
      patient.insuranceProvider?.toLowerCase().includes(searchLower)
    );
  });

  const handleSubmitIVR = (patientId: string) => {
    navigate(`/ivr/submit?patientId=${patientId}`);
  };

  return (
    <div className="space-y-8 px-8 pt-6">
      <PageHeader 
        title="Select Patient"
        subtitle="Choose a patient to submit an IVR request"
      />

      {/* Search and Actions */}
      <div className="flex items-center justify-between">
        <div className="flex-1 max-w-lg">
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search patients by name, condition, or insurance..."
              className="block w-full rounded-md border border-gray-300 pl-10 px-4 py-2.5 focus:border-[#2C3E50] focus:ring-[#2C3E50] sm:text-sm"
            />
          </div>
        </div>

        <button
          onClick={() => navigate('/patients/intake')}
          className="ml-4 inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-[#2C3E50] hover:bg-[#375788] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2C3E50]"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Add New Patient
        </button>
      </div>

      {/* Patient List */}
      <div className="mt-8">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#2C3E50] border-r-transparent"></div>
            <p className="mt-4 text-sm text-gray-600">Loading patients...</p>
          </div>
        ) : filteredPatients.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <p className="text-sm text-gray-600">
              {searchTerm 
                ? 'No patients found matching your search criteria'
                : 'No patients found. Add a new patient to get started.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredPatients.map((patient) => (
              <PatientCard
                key={patient.id}
                patient={patient}
                selected={selectedPatient === patient.id}
                onClick={() => setSelectedPatient(patient.id)}
                onSubmitIVR={handleSubmitIVR}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientSelectionPage; 