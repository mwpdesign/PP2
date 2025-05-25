import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MagnifyingGlassIcon, PlusIcon } from '@heroicons/react/24/outline';
import PageHeader from '../../../components/shared/layout/PageHeader';
import PatientCard from '../../../components/patients/PatientCard';
import { Patient, mockPatients } from '../../../mock_data/patients';

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
    const searchTermLower = searchTerm.toLowerCase();
    return (
      patient.firstName.toLowerCase().includes(searchTermLower) ||
      patient.lastName.toLowerCase().includes(searchTermLower) ||
      patient.primaryCondition?.toLowerCase().includes(searchTermLower) ||
      patient.insuranceProvider?.toLowerCase().includes(searchTermLower)
    );
  });

  const handleSubmitIVR = (patientId: string) => {
    navigate(`/ivr/submit/${patientId}`);
  };

  const handleViewDetails = (patientId: string) => {
    navigate(`/patients/${patientId}`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#2C3E50] border-r-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 px-8 pt-6">
      <PageHeader 
        title="Select Patient"
        subtitle="View patient details or submit an IVR"
      />

      <div className="flex justify-between items-center">
        <div className="w-96">
          <input
            type="text"
            placeholder="Search patients..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full rounded-md border border-gray-300 px-4 py-2 focus:border-[#2C3E50] focus:ring-[#2C3E50]"
          />
        </div>

        <button
          onClick={() => navigate('/patients/new')}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-[#2C3E50] hover:bg-[#375788]"
        >
          Add New Patient
        </button>
      </div>

      <div className="space-y-4">
        {filteredPatients.map(patient => (
          <PatientCard
            key={patient.id}
            patient={patient}
            onSubmitIVR={handleSubmitIVR}
            onViewDetails={handleViewDetails}
            selected={selectedPatient === patient.id}
            onClick={() => setSelectedPatient(patient.id)}
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