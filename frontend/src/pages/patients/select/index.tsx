import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MagnifyingGlassIcon, PlusIcon } from '@heroicons/react/24/outline';
import PageHeader from '../../../components/shared/layout/PageHeader';
import PatientCard from '../../../components/patients/PatientCard';
import { Patient } from '../../../types/ivr';
import { mockPatientService } from '../../../services/mockPatientService';

const PatientSelectionPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const fetchPatients = async (query?: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await mockPatientService.searchPatients({
        query: query || '',
        page: currentPage,
        size: pageSize
      });
      setPatients(response.items);
      setTotalItems(response.total);
    } catch (err) {
      setError('Failed to load patients');
      console.error('Error fetching patients:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, [currentPage]);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (searchTerm) {
        setCurrentPage(1); // Reset to first page on new search
        fetchPatients(searchTerm);
      }
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchTerm]);

  const handleViewDetails = (patientId: string) => {
    navigate(`/patients/${patientId}`);
  };

  const handleAddNewPatient = () => {
    navigate('/patients/intake');
  };

  const totalPages = Math.ceil(totalItems / pageSize);

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
            placeholder="Search by name, insurance, or condition..."
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
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2C3E50]"></div>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-500">{error}</p>
            <button
              onClick={() => fetchPatients()}
              className="mt-2 text-[#2C3E50] hover:text-[#375788]"
            >
              Try again
            </button>
          </div>
        ) : patients.length > 0 ? (
          <>
            <div className="space-y-4">
              {patients.map(patient => (
                <PatientCard
                  key={patient.id}
                  patient={patient}
                  onSelect={handleViewDetails}
                />
              ))}
            </div>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center space-x-2 mt-6">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border rounded-md disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="px-3 py-1">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 border rounded-md disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">No patients found matching your search criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientSelectionPage; 