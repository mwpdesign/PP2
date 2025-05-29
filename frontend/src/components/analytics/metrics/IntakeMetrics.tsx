import React from 'react';
import { Line } from 'react-chartjs-2';
import { defaultOptions, chartColors } from '../ChartConfig';

interface IntakeMetricsProps {
  dateRange: 'week' | 'month' | 'quarter';
}

const IntakeMetrics: React.FC<IntakeMetricsProps> = () => {
  const data = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Completed Intakes',
        data: [32, 28, 35, 30, 33, 25, 31],
        borderColor: chartColors.blue.primary,
        backgroundColor: chartColors.blue.light,
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Avg. Completion Time (mins)',
        data: [18, 15, 17, 16, 19, 14, 16],
        borderColor: chartColors.green.primary,
        backgroundColor: chartColors.green.light,
        fill: true,
        tension: 0.4,
        yAxisID: 'timeAxis',
      },
      {
        label: 'Abandoned Forms',
        data: [4, 3, 5, 4, 6, 3, 4],
        borderColor: chartColors.red.primary,
        backgroundColor: chartColors.red.light,
        fill: true,
        tension: 0.4,
      }
    ],
  };

  const options = {
    ...defaultOptions,
    plugins: {
      ...defaultOptions.plugins,
      title: {
        display: true,
        text: 'Patient Intake Analytics',
        font: {
          size: 16,
          weight: 'bold' as const,
        },
        padding: {
          bottom: 20
        }
      }
    },
    scales: {
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        title: {
          display: true,
          text: 'Number of Forms',
        },
        min: 0,
      },
      timeAxis: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        title: {
          display: true,
          text: 'Time (minutes)',
        },
        grid: {
          drawOnChartArea: false,
        },
      },
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <div className="mb-6">
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-sm font-medium text-gray-500">Form Completion Rate</p>
            <p className="mt-1 text-2xl font-semibold text-gray-900">88.5%</p>
            <div className="mt-1 flex items-center">
              <span className="text-green-500 text-sm">↑ 3.2%</span>
              <span className="text-gray-500 text-sm ml-2">vs last week</span>
            </div>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <p className="text-sm font-medium text-gray-500">Avg. Completion Time</p>
            <p className="mt-1 text-2xl font-semibold text-gray-900">16.4 mins</p>
            <div className="mt-1 flex items-center">
              <span className="text-green-500 text-sm">↓ 2.1 mins</span>
              <span className="text-gray-500 text-sm ml-2">vs last week</span>
            </div>
          </div>
          <div className="bg-red-50 rounded-lg p-4">
            <p className="text-sm font-medium text-gray-500">Abandonment Rate</p>
            <p className="mt-1 text-2xl font-semibold text-gray-900">11.5%</p>
            <div className="mt-1 flex items-center">
              <span className="text-red-500 text-sm">↑ 1.2%</span>
              <span className="text-gray-500 text-sm ml-2">vs last week</span>
            </div>
          </div>
        </div>
      </div>
      <div style={{ height: '300px' }}>
        <Line data={data} options={options} />
      </div>
    </div>
  );
};

export default IntakeMetrics; 