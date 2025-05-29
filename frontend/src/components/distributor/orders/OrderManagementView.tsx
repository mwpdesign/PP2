import React from 'react';
import { Card } from '../../shared/ui/Card';

interface OrderMetric {
  label: string;
  value: string | number;
  change: string;
  trend: 'up' | 'down' | 'neutral';
}

const metrics: OrderMetric[] = [
  {
    label: 'Total Orders',
    value: '2,847',
    change: '+8.2%',
    trend: 'up'
  },
  {
    label: 'Processing',
    value: '156',
    change: '-4.1%',
    trend: 'down'
  },
  {
    label: 'Fulfillment Rate',
    value: '96.8%',
    change: '+1.4%',
    trend: 'up'
  },
  {
    label: 'Avg. Processing Time',
    value: '1.8d',
    change: '-0.3d',
    trend: 'down'
  }
];

const OrderManagementView: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric) => (
          <Card key={metric.label} className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-slate-600">{metric.label}</p>
                <p className="mt-2 text-3xl font-semibold text-slate-900">{metric.value}</p>
              </div>
              <div className={`flex items-center ${
                metric.trend === 'up' ? 'text-green-600' : 
                metric.trend === 'down' ? 'text-red-600' : 
                'text-slate-600'
              }`}>
                {metric.trend === 'up' && (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                  </svg>
                )}
                {metric.trend === 'down' && (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                )}
                <span className="ml-1 text-sm font-medium">{metric.change}</span>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Processing Queue */}
      <Card className="overflow-hidden">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-slate-900">Order Processing Queue</h3>
        </div>
        <div className="bg-white">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Order ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Items</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Priority</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {/* Sample row - replace with real data */}
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">ORD-2024-0584</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">Sarah M.</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                      Processing
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">3 items</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                      High
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                    <button className="text-[#375788] hover:text-[#247297] font-medium">Process</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default OrderManagementView; 