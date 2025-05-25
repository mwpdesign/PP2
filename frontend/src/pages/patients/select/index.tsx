import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../../components/shared/layout/PageHeader';

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  primaryCondition: string;
  lastVisit: string;
}

// TODO: Replace with actual API call
const mockPatients: Patient[] = [
  {
    id: '1',
    firstName: 'John',
    lastName: 'Doe',
    dateOfBirth: '1980-01-15',
    primaryCondition: 'Diabetes Type 2',
    lastVisit: '2024-05-20'
  },
  {
    id: '2',
    firstName: 'Jane',
    lastName: 'Smith',
    dateOfBirth: '1975-03-22',
    primaryCondition: 'Hypertension',
    lastVisit: '2024-05-18'
  }
];

const PatientSelectionPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<string | null>(null);

  const filteredPatients = mockPatients.filter(patient => 
    patient.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.lastName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleContinue = () => {
    if (selectedPatient) {
      // Navigate to IVR form with selected patient ID
      navigate(`/ivr/submit?patientId=${selectedPatient}`);
    }
  };

  return (
    <div className="p-6">
      <PageHeader 
        title="Select Patient"
        subtitle="Choose a patient to submit an IVR request"
      />

      {/* Search and Actions */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex-1 max-w-sm">
          <label htmlFor="search" className="sr-only">Search Patients</label>
          <div className="relative">
            <input
              type="text"
              name="search"
              id="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search patients..."
              className="block w-full rounded-md border border-gray-300 px-4 py-2 pr-10 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
              <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => navigate('/patients/intake')}
          className="ml-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Add New Patient
        </button>
      </div>

      {/* Patient List */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
        <ul className="divide-y divide-gray-200">
          {filteredPatients.map((patient) => (
            <li 
              key={patient.id}
              className={`
                p-4 cursor-pointer hover:bg-gray-50 transition-colors
                ${selectedPatient === patient.id ? 'bg-blue-50' : ''}
              `}
              onClick={() => setSelectedPatient(patient.id)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">
                    {patient.firstName} {patient.lastName}
                  </h3>
                  <p className="text-sm text-gray-500">
                    DOB: {new Date(patient.dateOfBirth).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-900">{patient.primaryCondition}</p>
                  <p className="text-sm text-gray-500">
                    Last Visit: {new Date(patient.lastVisit).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Action Buttons */}
      <div className="mt-6 flex justify-end space-x-4">
        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleContinue}
          disabled={!selectedPatient}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          Continue to IVR Form
        </button>
      </div>
    </div>
  );
};

export default PatientSelectionPage; 