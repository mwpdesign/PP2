import React, { useEffect } from 'react';
import { ChartJS } from './ChartConfig';
import DoctorDashboard from './DoctorDashboard';
import { useAuth } from '../../contexts/AuthContext';

// Ensure Chart.js is configured
if (!ChartJS.defaults.responsive) {
  throw new Error('Chart.js configuration not loaded properly');
}

const Analytics: React.FC = () => {
  const { user } = useAuth();

  useEffect(() => {
    return () => {
      // Cleanup all chart instances when Analytics unmounts
      const charts = Object.values(ChartJS.instances);
      charts.forEach(chart => chart?.destroy());
    };
  }, []);

  // Get doctor ID from auth context, fallback to mock for development
  const doctorId = user?.id || 'DOC123';

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <DoctorDashboard doctorId={doctorId} />
      </div>
    </div>
  );
};

export default Analytics;