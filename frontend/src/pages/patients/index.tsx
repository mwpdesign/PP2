import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function PatientsPage() {
  const navigate = useNavigate();

  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Patients</h1>
          <p className="mt-2 text-sm text-gray-600">
            Manage your patient records and wound care treatments
          </p>
        </div>
        <button
          onClick={() => navigate('/patients/new')}
          className="px-4 py-2 bg-[#375788] text-white rounded-md hover:bg-[#2a4266] transition-colors"
        >
          Add New Patient
        </button>
      </div>

      {/* Placeholder for patient list - will be implemented later */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="text-center text-gray-500 py-8">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No patients yet</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by adding a new patient.</p>
          <div className="mt-6">
            <button
              onClick={() => navigate('/patients/new')}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-[#375788] hover:bg-[#2a4266] focus:outline-none"
            >
              <svg
                className="-ml-1 mr-2 h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Add New Patient
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 