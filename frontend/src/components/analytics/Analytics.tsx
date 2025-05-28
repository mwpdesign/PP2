import React from 'react';
import { ChartJS } from './ChartConfig';
import DoctorDashboard from './DoctorDashboard';

// Ensure Chart.js is configured
if (!ChartJS.defaults.responsive) {
  throw new Error('Chart.js configuration not loaded properly');
}

const Analytics: React.FC = () => {
  // TODO: Get actual doctor ID from auth context
  const mockDoctorId = 'DOC123';

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <DoctorDashboard doctorId={mockDoctorId} />
      </div>
    </div>
  );
};

export default Analytics; 