import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const DoctorDetailSimple: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            🩺 Doctor Detail Page - Simple Test
          </h1>

          <div className="space-y-4">
            <div>
              <strong>Doctor ID:</strong> {id || 'No ID provided'}
            </div>

            <div>
              <strong>Current URL:</strong> {window.location.pathname}
            </div>

            <div>
              <strong>Status:</strong> ✅ Component is loading successfully!
            </div>

            <div className="pt-4">
              <button
                onClick={() => navigate('/sales/doctors')}
                className="bg-slate-600 text-white px-4 py-2 rounded-md hover:bg-slate-700"
              >
                ← Back to Doctors List
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorDetailSimple;