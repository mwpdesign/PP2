import React from 'react';
import { Card } from '../../shared/ui/Card';

interface LogisticsMetric {
  label: string;
  value: string | number;
  change: string;
  trend: 'up' | 'down' | 'neutral';
}

const metrics: LogisticsMetric[] = [
  {
    label: 'Active Shipments',
    value: '342',
    change: '+5.8%',
    trend: 'up'
  },
  {
    label: 'On-Time Delivery',
    value: '98.2%',
    change: '+0.7%',
    trend: 'up'
  },
  {
    label: 'Avg. Transit Time',
    value: '2.1d',
    change: '-0.2d',
    trend: 'down'
  },
  {
    label: 'Delivery Success',
    value: '99.4%',
    change: '+0.3%',
    trend: 'up'
  }
];

const LogisticsManagementView: React.FC = () => {
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

      {/* Active Shipments */}
      <Card className="overflow-hidden">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-slate-900">Active Shipments</h3>
        </div>
        <div className="bg-white">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Tracking #</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Order ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Carrier</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">ETA</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {/* Sample row - replace with real data */}
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">1Z999AA1234567890</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">ORD-2024-0584</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      In Transit
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">UPS</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">Mar 15, 2024</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                    <button className="text-[#375788] hover:text-[#247297] font-medium">Track</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </Card>

      {/* Carrier Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="overflow-hidden">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-slate-900">Carrier Performance</h3>
          </div>
          <div className="p-4">
            <div className="space-y-4">
              {/* UPS */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium text-slate-600">UPS</span>
                  <span className="text-sm font-medium text-slate-900">98.7%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-[#375788] h-2 rounded-full" style={{ width: '98.7%' }}></div>
                </div>
              </div>
              {/* FedEx */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium text-slate-600">FedEx</span>
                  <span className="text-sm font-medium text-slate-900">97.4%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-[#375788] h-2 rounded-full" style={{ width: '97.4%' }}></div>
                </div>
              </div>
              {/* USPS */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium text-slate-600">USPS</span>
                  <span className="text-sm font-medium text-slate-900">95.2%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-[#375788] h-2 rounded-full" style={{ width: '95.2%' }}></div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <Card className="overflow-hidden">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-slate-900">Delivery Exceptions</h3>
          </div>
          <div className="p-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-600">Address Not Found</p>
                  <p className="text-xs text-slate-500">4 active cases</p>
                </div>
                <button className="text-sm text-[#375788] hover:text-[#247297] font-medium">
                  Resolve
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-yellow-600">Weather Delay</p>
                  <p className="text-xs text-slate-500">2 shipments affected</p>
                </div>
                <button className="text-sm text-[#375788] hover:text-[#247297] font-medium">
                  View
                </button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default LogisticsManagementView; 