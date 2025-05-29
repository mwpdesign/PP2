import React from 'react';
import { Card } from '../../../components/shared/ui/Card';
import { MetricCard } from '../../../components/shared/DashboardWidgets/MetricCard';
import { ChartCard } from '../../../components/shared/DashboardWidgets/ChartCard';
import { UsersIcon, ClipboardDocumentCheckIcon, ShieldCheckIcon, ChartBarIcon } from '@heroicons/react/24/solid';

const AdminDashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Welcome, Admin User</h1>
        <p className="mt-1 text-sm text-gray-600">Healthcare IVR Platform Administration</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Patients"
          value={1234}
          trend={12}
          icon={<UsersIcon className="h-8 w-8 text-gray-400" />}
        />
        <MetricCard
          title="Active IVR Sessions"
          value={56}
          trend={23}
          icon={<ClipboardDocumentCheckIcon className="h-8 w-8 text-gray-400" />}
        />
        <MetricCard
          title="Pending Orders"
          value={89}
          trend={-5}
          icon={<ChartBarIcon className="h-8 w-8 text-gray-400" />}
        />
        <MetricCard
          title="System Health"
          value={99.9}
          isPercentage
          trend={0.1}
          icon={<ShieldCheckIcon className="h-8 w-8 text-gray-400" />}
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button className="bg-indigo-600 text-white px-4 py-3 rounded-lg hover:bg-indigo-700 transition-colors">
          Generate System Report
        </button>
        <button className="bg-indigo-600 text-white px-4 py-3 rounded-lg hover:bg-indigo-700 transition-colors">
          Manage User Access
        </button>
        <button className="bg-indigo-600 text-white px-4 py-3 rounded-lg hover:bg-indigo-700 transition-colors">
          View Audit Logs
        </button>
      </div>

      {/* System Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">IVR Processing Trends</h2>
          <ChartCard
            title="Daily Activity"
            type="line"
            data={[
              { label: 'Mon', value: 42 },
              { label: 'Tue', value: 47 },
              { label: 'Wed', value: 45 },
              { label: 'Thu', value: 43 },
              { label: 'Fri', value: 48 },
              { label: 'Sat', value: 35 },
              { label: 'Sun', value: 32 }
            ]}
            dataKey="value"
            height={300}
            color="#375788"
          />
        </Card>
        
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">System Performance</h2>
          <ChartCard
            title="Response Times"
            type="line"
            data={[
              { label: 'Mon', value: 120 },
              { label: 'Tue', value: 115 },
              { label: 'Wed', value: 130 },
              { label: 'Thu', value: 125 },
              { label: 'Fri', value: 110 },
              { label: 'Sat', value: 105 },
              { label: 'Sun', value: 115 }
            ]}
            dataKey="value"
            height={300}
            color="#375788"
          />
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard; 