import React, { useEffect, useRef } from 'react';
import { Bar } from 'react-chartjs-2';

interface PatientInsightsProps {
  dateRange: 'week' | 'month' | 'quarter';
  doctorId: string;
}

const PatientInsights: React.FC<PatientInsightsProps> = ({ dateRange, doctorId }) => {
  const chartRef = useRef<any>(null);

  useEffect(() => {
    console.log('PatientInsights component mounting');
    return () => {
      console.log('PatientInsights component unmounting - cleaning up chart');
      if (chartRef.current) {
        chartRef.current.destroy();
      }
    };
  }, []);

  // Mock data - replace with real API call
  const data = {
    labels: ['New Patients', 'Returning', 'Referred', 'High Priority'],
    datasets: [
      {
        label: 'Patient Distribution',
        data: [65, 45, 30, 25],
        backgroundColor: [
          'rgba(59, 130, 246, 0.5)', // blue
          'rgba(16, 185, 129, 0.5)', // green
          'rgba(139, 92, 246, 0.5)', // purple
          'rgba(245, 158, 11, 0.5)', // yellow
        ],
        borderColor: [
          'rgb(59, 130, 246)',
          'rgb(16, 185, 129)',
          'rgb(139, 92, 246)',
          'rgb(245, 158, 11)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Patient Insights</h3>
          <p className="text-sm text-gray-500">Patient demographics and trends</p>
        </div>
      </div>

      <div className="h-64">
        <Bar ref={chartRef} data={data} options={options} />
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 gap-6 mt-6 pt-6 border-t border-gray-100">
        <div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Patient Retention</p>
              <p className="mt-1 text-xl font-semibold text-gray-900">87.3%</p>
            </div>
            <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
          <div className="mt-1 flex items-center">
            <span className="text-green-500 text-sm">↑ 3.2%</span>
            <span className="text-gray-500 text-sm ml-2">vs last {dateRange}</span>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Avg. Treatment Duration</p>
              <p className="mt-1 text-xl font-semibold text-gray-900">4.2 months</p>
            </div>
            <div className="w-10 h-10 bg-purple-50 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="mt-1 flex items-center">
            <span className="text-red-500 text-sm">↓ 0.3 months</span>
            <span className="text-gray-500 text-sm ml-2">vs last {dateRange}</span>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Referral Rate</p>
              <p className="mt-1 text-xl font-semibold text-gray-900">32.8%</p>
            </div>
            <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
          <div className="mt-1 flex items-center">
            <span className="text-green-500 text-sm">↑ 5.4%</span>
            <span className="text-gray-500 text-sm ml-2">vs last {dateRange}</span>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Patient Satisfaction</p>
              <p className="mt-1 text-xl font-semibold text-gray-900">4.8/5.0</p>
            </div>
            <div className="w-10 h-10 bg-yellow-50 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </div>
          </div>
          <div className="mt-1 flex items-center">
            <span className="text-green-500 text-sm">↑ 0.2</span>
            <span className="text-gray-500 text-sm ml-2">vs last {dateRange}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientInsights; 