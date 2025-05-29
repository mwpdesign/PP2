import React from 'react';
import { Line } from 'react-chartjs-2';
import { defaultOptions, chartColors } from '../ChartConfig';

interface LogisticsMetricsProps {
  dateRange: 'week' | 'month' | 'quarter';
}

const LogisticsMetrics: React.FC<LogisticsMetricsProps> = () => {
  const data = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'On-Time Deliveries',
        data: [45, 42, 48, 43, 46, 40, 44],
        borderColor: chartColors.green.primary,
        backgroundColor: chartColors.green.light,
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Delayed Shipments',
        data: [3, 4, 2, 5, 3, 2, 4],
        borderColor: chartColors.red.primary,
        backgroundColor: chartColors.red.light,
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Avg. Transit Time (days)',
        data: [2.1, 2.3, 2.0, 2.4, 2.2, 2.1, 2.3],
        borderColor: chartColors.blue.primary,
        backgroundColor: chartColors.blue.light,
        fill: true,
        tension: 0.4,
        yAxisID: 'timeAxis',
      }
    ],
  };

  const options = {
    ...defaultOptions,
    plugins: {
      ...defaultOptions.plugins,
      title: {
        display: true,
        text: 'Shipping & Logistics Performance',
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
          text: 'Number of Shipments',
        },
        min: 0,
      },
      timeAxis: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        title: {
          display: true,
          text: 'Transit Time (days)',
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
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-green-50 rounded-lg p-4">
            <p className="text-sm font-medium text-gray-500">On-Time Delivery Rate</p>
            <p className="mt-1 text-2xl font-semibold text-gray-900">93.2%</p>
            <div className="mt-1 flex items-center">
              <span className="text-green-500 text-sm">↑ 1.5%</span>
              <span className="text-gray-500 text-sm ml-2">vs last week</span>
            </div>
          </div>
          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-sm font-medium text-gray-500">Avg. Transit Time</p>
            <p className="mt-1 text-2xl font-semibold text-gray-900">2.2 days</p>
            <div className="mt-1 flex items-center">
              <span className="text-green-500 text-sm">↓ 0.3 days</span>
              <span className="text-gray-500 text-sm ml-2">vs last week</span>
            </div>
          </div>
          <div className="bg-yellow-50 rounded-lg p-4">
            <p className="text-sm font-medium text-gray-500">In Transit</p>
            <p className="mt-1 text-2xl font-semibold text-gray-900">85</p>
            <div className="mt-1 flex items-center">
              <span className="text-gray-500 text-sm">Updated 5m ago</span>
            </div>
          </div>
          <div className="bg-red-50 rounded-lg p-4">
            <p className="text-sm font-medium text-gray-500">Delivery Issues</p>
            <p className="mt-1 text-2xl font-semibold text-gray-900">6</p>
            <div className="mt-1 flex items-center">
              <span className="text-red-500 text-sm">↑ 2</span>
              <span className="text-gray-500 text-sm ml-2">vs yesterday</span>
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

export default LogisticsMetrics; 