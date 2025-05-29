import React from 'react';
import { Line } from 'react-chartjs-2';
import { defaultOptions, chartColors } from '../ChartConfig';

interface OrderFulfillmentMetricsProps {
  dateRange: 'week' | 'month' | 'quarter';
}

const OrderFulfillmentMetrics: React.FC<OrderFulfillmentMetricsProps> = () => {
  const data = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Orders Received',
        data: [52, 48, 55, 50, 53, 45, 51],
        borderColor: chartColors.blue.primary,
        backgroundColor: chartColors.blue.light,
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Orders Processed',
        data: [48, 45, 52, 47, 50, 42, 48],
        borderColor: chartColors.green.primary,
        backgroundColor: chartColors.green.light,
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Processing Time (hrs)',
        data: [4.2, 3.8, 4.5, 4.0, 4.3, 3.7, 4.1],
        borderColor: chartColors.purple.primary,
        backgroundColor: chartColors.purple.light,
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
        text: 'Order Fulfillment Analytics',
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
          text: 'Number of Orders',
        },
        min: 0,
      },
      timeAxis: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        title: {
          display: true,
          text: 'Processing Time (hrs)',
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
          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-sm font-medium text-gray-500">Order Volume</p>
            <p className="mt-1 text-2xl font-semibold text-gray-900">354</p>
            <div className="mt-1 flex items-center">
              <span className="text-green-500 text-sm">↑ 12%</span>
              <span className="text-gray-500 text-sm ml-2">vs last week</span>
            </div>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <p className="text-sm font-medium text-gray-500">Processing Rate</p>
            <p className="mt-1 text-2xl font-semibold text-gray-900">94.8%</p>
            <div className="mt-1 flex items-center">
              <span className="text-green-500 text-sm">↑ 2.3%</span>
              <span className="text-gray-500 text-sm ml-2">vs last week</span>
            </div>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <p className="text-sm font-medium text-gray-500">Avg. Processing Time</p>
            <p className="mt-1 text-2xl font-semibold text-gray-900">4.1 hrs</p>
            <div className="mt-1 flex items-center">
              <span className="text-green-500 text-sm">↓ 0.3 hrs</span>
              <span className="text-gray-500 text-sm ml-2">vs last week</span>
            </div>
          </div>
          <div className="bg-yellow-50 rounded-lg p-4">
            <p className="text-sm font-medium text-gray-500">Pending Orders</p>
            <p className="mt-1 text-2xl font-semibold text-gray-900">18</p>
            <div className="mt-1 flex items-center">
              <span className="text-gray-500 text-sm">Updated 5m ago</span>
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

export default OrderFulfillmentMetrics; 