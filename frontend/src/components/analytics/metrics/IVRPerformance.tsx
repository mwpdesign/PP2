import React, { useEffect, useRef } from 'react';
import { Doughnut } from 'react-chartjs-2';

interface IVRPerformanceProps {
  dateRange: 'week' | 'month' | 'quarter';
  doctorId: string;
}

const IVRPerformance: React.FC<IVRPerformanceProps> = ({ dateRange, doctorId }) => {
  const chartRef = useRef<any>(null);

  useEffect(() => {
    console.log('IVRPerformance component mounting');
    return () => {
      console.log('IVRPerformance component unmounting - cleaning up chart');
      if (chartRef.current) {
        chartRef.current.destroy();
      }
    };
  }, []);

  // Mock data - replace with real API call
  const data = {
    labels: ['Successful', 'Needs Review', 'Failed'],
    datasets: [
      {
        data: [75, 15, 10],
        backgroundColor: [
          'rgba(16, 185, 129, 0.5)', // green
          'rgba(245, 158, 11, 0.5)', // yellow
          'rgba(239, 68, 68, 0.5)', // red
        ],
        borderColor: [
          'rgb(16, 185, 129)',
          'rgb(245, 158, 11)',
          'rgb(239, 68, 68)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
    },
    cutout: '70%',
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">IVR Performance</h3>
          <p className="text-sm text-gray-500">Call success and quality metrics</p>
        </div>
      </div>

      <div className="h-64 flex items-center justify-center relative">
        <Doughnut ref={chartRef} data={data} options={options} />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <p className="text-3xl font-bold text-gray-900">75%</p>
            <p className="text-sm text-gray-500">Success Rate</p>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-100">
        <div>
          <p className="text-sm font-medium text-gray-500">Avg. Call Duration</p>
          <p className="mt-1 text-xl font-semibold text-gray-900">4m 32s</p>
          <div className="mt-1 flex items-center">
            <span className="text-green-500 text-sm">↓ 23s</span>
            <span className="text-gray-500 text-sm ml-2">vs last {dateRange}</span>
          </div>
        </div>

        <div>
          <p className="text-sm font-medium text-gray-500">First Call Resolution</p>
          <p className="mt-1 text-xl font-semibold text-gray-900">82.4%</p>
          <div className="mt-1 flex items-center">
            <span className="text-green-500 text-sm">↑ 3.1%</span>
            <span className="text-gray-500 text-sm ml-2">vs last {dateRange}</span>
          </div>
        </div>

        <div>
          <p className="text-sm font-medium text-gray-500">Patient Satisfaction</p>
          <p className="mt-1 text-xl font-semibold text-gray-900">4.6/5</p>
          <div className="mt-1 flex items-center">
            <span className="text-green-500 text-sm">↑ 0.2</span>
            <span className="text-gray-500 text-sm ml-2">vs last {dateRange}</span>
          </div>
        </div>
      </div>

      {/* Recent Issues */}
      <div className="mt-6 pt-6 border-t border-gray-100">
        <h4 className="text-sm font-medium text-gray-900 mb-4">Recent Issues</h4>
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-3">
              <span className="w-2 h-2 bg-red-400 rounded-full"></span>
              <span className="text-gray-600">Call Disconnection</span>
            </div>
            <span className="text-gray-500">12 occurrences</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-3">
              <span className="w-2 h-2 bg-yellow-400 rounded-full"></span>
              <span className="text-gray-600">Speech Recognition</span>
            </div>
            <span className="text-gray-500">8 occurrences</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-3">
              <span className="w-2 h-2 bg-orange-400 rounded-full"></span>
              <span className="text-gray-600">Menu Navigation</span>
            </div>
            <span className="text-gray-500">5 occurrences</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IVRPerformance; 