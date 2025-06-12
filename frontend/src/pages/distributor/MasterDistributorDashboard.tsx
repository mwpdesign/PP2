import React from 'react';
import {
  CurrencyDollarIcon,
  BuildingOffice2Icon,
  UsersIcon,
  DocumentTextIcon,
  ArchiveBoxIcon,
  CreditCardIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  PlusIcon,
  EyeIcon,
  ChartBarIcon
} from '@heroicons/react/24/solid';
import { Card } from '../../components/shared/ui/Card';

interface DashboardMetric {
  label: string;
  value: string | number;
  change: string;
  trend: 'up' | 'down' | 'neutral';
  icon: React.ComponentType<any>;
  iconColor: string;
  type: 'business' | 'medical';
}

const metrics: DashboardMetric[] = [
  {
    label: 'Monthly Revenue',
    value: '$458,320',
    change: '+12.3%',
    trend: 'up',
    icon: CurrencyDollarIcon,
    iconColor: 'text-green-600',
    type: 'business'
  },
  {
    label: 'Active Distributors',
    value: '12',
    change: '+2 new',
    trend: 'up',
    icon: BuildingOffice2Icon,
    iconColor: 'text-blue-600',
    type: 'business'
  },
  {
    label: 'Total Sales Reps',
    value: '47',
    change: '+8.5%',
    trend: 'up',
    icon: UsersIcon,
    iconColor: 'text-purple-600',
    type: 'business'
  },
  {
    label: 'IVRs This Month',
    value: '234',
    change: '+15.2%',
    trend: 'up',
    icon: DocumentTextIcon,
    iconColor: 'text-amber-600',
    type: 'medical'
  },
  {
    label: 'Active Orders',
    value: '89',
    change: '+5.8%',
    trend: 'up',
    icon: ArchiveBoxIcon,
    iconColor: 'text-indigo-600',
    type: 'medical'
  },
  {
    label: 'Pending Invoices',
    value: '23',
    change: '-12.5%',
    trend: 'down',
    icon: CreditCardIcon,
    iconColor: 'text-red-600',
    type: 'business'
  }
];

interface ActivityItem {
  type: 'distributor' | 'sales' | 'invoice' | 'network';
  title: string;
  description: string;
  timestamp: string;
  status: 'success' | 'warning' | 'info';
}

const recentActivity: ActivityItem[] = [
  {
    type: 'distributor',
    title: 'New Distributor Onboarded',
    description: 'MedSupply West Coast completed setup',
    timestamp: '2 hours ago',
    status: 'success'
  },
  {
    type: 'invoice',
    title: 'Invoice Payment Received',
    description: '$45,200 from Regional Health Partners',
    timestamp: '4 hours ago',
    status: 'success'
  },
  {
    type: 'sales',
    title: 'Sales Target Achieved',
    description: 'Southwest region hit monthly quota',
    timestamp: '6 hours ago',
    status: 'success'
  },
  {
    type: 'network',
    title: 'Network Performance Alert',
    description: 'East Coast region exceeding targets by 18%',
    timestamp: '8 hours ago',
    status: 'info'
  },
  {
    type: 'invoice',
    title: 'Overdue Invoice Alert',
    description: 'Invoice #INV-2024-0156 is 15 days overdue',
    timestamp: '1 day ago',
    status: 'warning'
  }
];

const MasterDistributorDashboard: React.FC = () => {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'distributor': return BuildingOffice2Icon;
      case 'sales': return ChartBarIcon;
      case 'invoice': return CreditCardIcon;
      case 'network': return UsersIcon;
      default: return DocumentTextIcon;
    }
  };

  const getActivityColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-600 bg-green-50';
      case 'warning': return 'text-amber-600 bg-amber-50';
      case 'info': return 'text-blue-600 bg-blue-50';
      default: return 'text-slate-600 bg-slate-50';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Master Distributor Dashboard</h1>
          <p className="text-slate-600 mt-1">Manage your distribution network and monitor operations</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex items-center">
            <div className="h-2 w-2 bg-green-500 rounded-full mr-2" />
            <span className="text-sm text-slate-600">Network Status: Operational</span>
          </div>
        </div>
      </div>

      {/* Business Metrics Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-slate-900">Business Metrics</h2>
          <span className="text-sm text-slate-500">Primary business KPIs</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {metrics.filter(metric => metric.type === 'business').map((metric) => (
            <Card key={metric.label} className="p-6 bg-white border border-slate-200 shadow-sm">
              <div className="flex items-center">
                <div className={`p-3 rounded-lg bg-slate-50`}>
                  <metric.icon className={`h-6 w-6 ${metric.iconColor}`} />
                </div>
                <div className="ml-4 flex-1">
                  <p className="text-sm font-medium text-slate-600">{metric.label}</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{metric.value}</p>
                  <div className={`flex items-center mt-1 ${
                    metric.trend === 'up' ? 'text-green-600' :
                    metric.trend === 'down' ? 'text-red-600' :
                    'text-slate-600'
                  }`}>
                    {metric.trend === 'up' && <ArrowUpIcon className="h-3 w-3 mr-1" />}
                    {metric.trend === 'down' && <ArrowDownIcon className="h-3 w-3 mr-1" />}
                    <span className="text-xs font-medium">{metric.change}</span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Medical Operations Monitoring */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-slate-900">Medical Operations</h2>
          <span className="text-sm text-slate-500">Read-only monitoring metrics</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {metrics.filter(metric => metric.type === 'medical').map((metric) => (
            <Card key={metric.label} className="p-6 bg-slate-50 border border-slate-200 shadow-sm">
              <div className="flex items-center">
                <div className={`p-3 rounded-lg bg-white`}>
                  <metric.icon className={`h-6 w-6 ${metric.iconColor}`} />
                </div>
                <div className="ml-4 flex-1">
                  <div className="flex items-center">
                    <p className="text-sm font-medium text-slate-600">{metric.label}</p>
                    <span className="ml-2 text-xs bg-slate-200 text-slate-600 px-2 py-1 rounded-full">Monitor Only</span>
                  </div>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{metric.value}</p>
                  <div className={`flex items-center mt-1 ${
                    metric.trend === 'up' ? 'text-green-600' :
                    metric.trend === 'down' ? 'text-red-600' :
                    'text-slate-600'
                  }`}>
                    {metric.trend === 'up' && <ArrowUpIcon className="h-3 w-3 mr-1" />}
                    {metric.trend === 'down' && <ArrowDownIcon className="h-3 w-3 mr-1" />}
                    <span className="text-xs font-medium">{metric.change}</span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Business Actions and Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <Card className="overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200">
            <h3 className="text-lg font-medium text-slate-900">Quick Actions</h3>
            <p className="text-sm text-slate-500 mt-1">Common business tasks</p>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              <button className="w-full flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors text-left">
                <div className="flex items-center">
                  <EyeIcon className="h-5 w-5 text-slate-600 mr-3" />
                  <span className="text-sm font-medium text-slate-900">View Invoices</span>
                </div>
                <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">23 pending</span>
              </button>
              <button className="w-full flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors text-left">
                <div className="flex items-center">
                  <PlusIcon className="h-5 w-5 text-slate-600 mr-3" />
                  <span className="text-sm font-medium text-slate-900">Add Distributor</span>
                </div>
              </button>
              <button className="w-full flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors text-left">
                <div className="flex items-center">
                  <ChartBarIcon className="h-5 w-5 text-slate-600 mr-3" />
                  <span className="text-sm font-medium text-slate-900">Network Analytics</span>
                </div>
              </button>
              <button className="w-full flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors text-left">
                <div className="flex items-center">
                  <UsersIcon className="h-5 w-5 text-slate-600 mr-3" />
                  <span className="text-sm font-medium text-slate-900">Manage Sales Team</span>
                </div>
              </button>
            </div>
          </div>
        </Card>

        {/* Recent Activity */}
        <Card className="overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200">
            <h3 className="text-lg font-medium text-slate-900">Recent Activity</h3>
            <p className="text-sm text-slate-500 mt-1">Network and business updates</p>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {recentActivity.map((activity, index) => {
                const IconComponent = getActivityIcon(activity.type);
                const colorClasses = getActivityColor(activity.status);

                return (
                  <div key={index} className="flex items-start space-x-3">
                    <div className={`p-2 rounded-lg ${colorClasses}`}>
                      <IconComponent className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900">{activity.title}</p>
                      <p className="text-xs text-slate-500 mt-1">{activity.description}</p>
                      <p className="text-xs text-slate-400 mt-1">{activity.timestamp}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      </div>

      {/* Network Performance Summary */}
      <Card className="overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200">
          <h3 className="text-lg font-medium text-slate-900">Network Performance Summary</h3>
          <p className="text-sm text-slate-500 mt-1">Regional performance and growth insights</p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">18%</div>
              <div className="text-sm text-slate-600">East Coast Growth</div>
              <div className="text-xs text-slate-500 mt-1">Above target performance</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">94%</div>
              <div className="text-sm text-slate-600">Network Utilization</div>
              <div className="text-xs text-slate-500 mt-1">Optimal capacity usage</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">$2.1M</div>
              <div className="text-sm text-slate-600">Quarterly Revenue</div>
              <div className="text-xs text-slate-500 mt-1">15% above forecast</div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-amber-600">Action Required</p>
                <p className="text-xs text-slate-500">3 new distributors need onboarding training</p>
              </div>
              <button className="text-sm text-[#375788] hover:text-[#247297] font-medium">
                Schedule Training
              </button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default MasterDistributorDashboard;