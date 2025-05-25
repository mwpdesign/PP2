import React from 'react';
import { useNavigate } from 'react-router-dom';

const PatientsPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">Patients</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage and monitor patient records
          </p>
        </div>
        <div className="flex gap-4">
          <button
            onClick={() => navigate('/patients/new')}
            className="px-4 py-2 bg-[#375788] text-white rounded-lg hover:bg-[#2d3748] transition-colors"
          >
            New Patient
          </button>
          <button
            onClick={() => navigate('/patients/assessment')}
            className="px-4 py-2 border border-[#375788] text-[#375788] rounded-lg hover:bg-gray-50 transition-colors"
          >
            New Assessment
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <p className="text-gray-600">Patient Page Works - Navigation Test</p>
      </div>
    </div>
  );
};

export default PatientsPage; 