import React from 'react';
import { Card } from '../../components/shared/ui/Card';

interface DashboardMetric {
  label: string;
  value: string | number;
  change: string;
  trend: 'up' | 'down' | 'neutral';
}

const metrics: DashboardMetric[] = [
  {
    label: 'Total Orders',
    value: '2,847',
    change: '+8.2%',
    trend: 'up'
  },
  {
    label: 'Active Shipments',
    value: '342',
    change: '+5.8%',
    trend: 'up'
  },
  {
    label: 'IVR Submissions',
    value: '1,284',
    change: '+12.5%',
    trend: 'up'
  },
  {
    label: 'Network Users',
    value: '89',
    change: '+4.2%',
    trend: 'up'
  }
];

const MasterDistributorDashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-slate-800">Master Distributor Dashboard</h1>
      </div>

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

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="overflow-hidden">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-slate-900">Recent Orders</h3>
          </div>
          <div className="p-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-900">ORD-2024-0584</p>
                  <p className="text-xs text-slate-500">2 items • High Priority</p>
                </div>
                <button className="text-sm text-[#375788] hover:text-[#247297] font-medium">
                  Process
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-900">ORD-2024-0583</p>
                  <p className="text-xs text-slate-500">5 items • Standard</p>
                </div>
                <button className="text-sm text-[#375788] hover:text-[#247297] font-medium">
                  Process
                </button>
              </div>
            </div>
          </div>
        </Card>

        <Card className="overflow-hidden">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-slate-900">Pending IVR Reviews</h3>
          </div>
          <div className="p-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-900">IVR-2024-001</p>
                  <p className="text-xs text-slate-500">Submitted 2h ago</p>
                </div>
                <button className="text-sm text-[#375788] hover:text-[#247297] font-medium">
                  Review
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-900">IVR-2024-002</p>
                  <p className="text-xs text-slate-500">Submitted 3h ago</p>
                </div>
                <button className="text-sm text-[#375788] hover:text-[#247297] font-medium">
                  Review
                </button>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Network Performance Alerts */}
      <Card className="overflow-hidden">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-slate-900">Network Performance Alerts</h3>
        </div>
        <div className="p-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">High-Performing Region</p>
                <p className="text-xs text-slate-500">East Coast region exceeding targets by 15%</p>
              </div>
              <button className="text-[#375788] hover:text-[#247297] font-medium">
                View Details
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-600">Training Needed</p>
                <p className="text-xs text-slate-500">3 new distributors need onboarding</p>
              </div>
              <button className="text-[#375788] hover:text-[#247297] font-medium">
                Schedule Training
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Network Expansion</p>
                <p className="text-xs text-slate-500">5 new doctor partnerships this month</p>
              </div>
              <button className="text-[#375788] hover:text-[#247297] font-medium">
                View Growth
              </button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default MasterDistributorDashboard; 