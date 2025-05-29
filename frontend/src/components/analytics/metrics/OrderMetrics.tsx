import React, { useEffect, useRef } from 'react';
import { Line } from 'react-chartjs-2';
import type { ChartData, ChartOptions } from 'chart.js';
import { chartColors } from '../ChartConfig';

interface OrderMetricsProps {
  dateRange: 'week' | 'month' | 'quarter';
  doctorId: string;
}

const OrderMetrics: React.FC<OrderMetricsProps> = ({ dateRange, doctorId }) => {
  const chartRef = useRef<any>(null);

  useEffect(() => {
    console.log('OrderMetrics component mounting');
    return () => {
      console.log('OrderMetrics component unmounting - cleaning up chart');
      if (chartRef.current) {
        chartRef.current.destroy();
      }
    };
  }, []);

  const data: ChartData<'line'> = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Orders',
        data: [12, 19, 15, 17, 14, 13, 18],
        fill: false,
        borderColor: chartColors.blue.primary,
        backgroundColor: chartColors.blue.light,
        tension: 0.1,
      },
      {
        label: 'Completed',
        data: [10, 15, 13, 14, 12, 11, 15],
        fill: false,
        borderColor: chartColors.green.primary,
        backgroundColor: chartColors.green.light,
        tension: 0.1,
      },
    ],
  };

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        type: 'linear' as const,
      },
    },
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Order Metrics</h3>
          <p className="text-sm text-gray-500">Order volume and completion rates</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 bg-gray-600 rounded-full"></span>
            <span className="text-sm text-gray-600">Total Orders</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 bg-green-500 rounded-full"></span>
            <span className="text-sm text-gray-600">Completed</span>
          </div>
        </div>
      </div>

      <div className="h-64">
        <Line ref={chartRef} data={data} options={options} />
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-100">
        <div>
          <p className="text-sm font-medium text-gray-500">Conversion Rate</p>
          <p className="mt-1 text-xl font-semibold text-gray-900">85.7%</p>
          <div className="mt-1 flex items-center">
            <span className="text-green-500 text-sm">↑ 2.1%</span>
            <span className="text-gray-500 text-sm ml-2">vs last {dateRange}</span>
          </div>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500">Avg. Order Value</p>
          <p className="mt-1 text-xl font-semibold text-gray-900">$1,247</p>
          <div className="mt-1 flex items-center">
            <span className="text-green-500 text-sm">↑ $124</span>
            <span className="text-gray-500 text-sm ml-2">vs last {dateRange}</span>
          </div>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500">Fulfillment Rate</p>
          <p className="mt-1 text-xl font-semibold text-gray-900">94.2%</p>
          <div className="mt-1 flex items-center">
            <span className="text-green-500 text-sm">↑ 1.3%</span>
            <span className="text-gray-500 text-sm ml-2">vs last {dateRange}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderMetrics; 