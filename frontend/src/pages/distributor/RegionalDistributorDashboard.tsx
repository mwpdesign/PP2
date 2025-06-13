import React from 'react';
import {
  UsersIcon,
  UserGroupIcon,
  DocumentTextIcon,
  ArchiveBoxIcon,
  ChartBarIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  PlusIcon,
  EyeIcon,
  PhoneIcon,
  MapPinIcon,
  TruckIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/solid';
import { Card } from '../../components/shared/ui/Card';

interface DashboardMetric {
  label: string;
  value: string | number;
  change: string;
  trend: 'up' | 'down' | 'neutral';
  icon: React.ComponentType<any>;
  iconColor: string;
  type: 'sales' | 'medical';
}

const metrics: DashboardMetric[] = [
  {
    label: 'Sales Representatives',
    value: '8',
    change: '+2 new',
    trend: 'up',
    icon: UsersIcon,
    iconColor: 'text-blue-600',
    type: 'sales'
  },
  {
    label: 'Doctor Network',
    value: '34',
    change: '+12.5%',
    trend: 'up',
    icon: UserGroupIcon,
    iconColor: 'text-purple-600',
    type: 'sales'
  },
  {
    label: 'Monthly Sales',
    value: '$156,420',
    change: '+8.3%',
    trend: 'up',
    icon: ChartBarIcon,
    iconColor: 'text-green-600',
    type: 'sales'
  },
  {
    label: 'IVRs This Month',
    value: '89',
    change: '+15.2%',
    trend: 'up',
    icon: DocumentTextIcon,
    iconColor: 'text-amber-600',
    type: 'medical'
  },
  {
    label: 'Active Orders',
    value: '23',
    change: '+5.8%',
    trend: 'up',
    icon: ArchiveBoxIcon,
    iconColor: 'text-indigo-600',
    type: 'medical'
  }
];

interface ActivityItem {
  type: 'sales' | 'doctor' | 'order' | 'network';
  title: string;
  description: string;
  timestamp: string;
  status: 'success' | 'warning' | 'info';
}

const recentActivity: ActivityItem[] = [
  {
    type: 'doctor',
    title: 'New Doctor Added',
    description: 'Dr. Sarah Johnson joined the network via Sales Rep Mike Chen',
    timestamp: '2 hours ago',
    status: 'success'
  },
  {
    type: 'sales',
    title: 'Sales Target Achieved',
    description: 'Jennifer Martinez hit monthly quota early',
    timestamp: '4 hours ago',
    status: 'success'
  },
  {
    type: 'order',
    title: 'Large Order Processed',
    description: '$12,500 order from Metro Wound Care Center',
    timestamp: '6 hours ago',
    status: 'success'
  },
  {
    type: 'network',
    title: 'Territory Performance',
    description: 'North region exceeding targets by 15%',
    timestamp: '8 hours ago',
    status: 'info'
  },
  {
    type: 'sales',
    title: 'Training Completed',
    description: 'New sales rep completed onboarding program',
    timestamp: '1 day ago',
    status: 'success'
  }
];

interface SalesRep {
  id: string;
  name: string;
  territory: string;
  doctorCount: number;
  monthlyTarget: number;
  currentSales: number;
  phone: string;
}

const salesTeam: SalesRep[] = [
  {
    id: '1',
    name: 'Jennifer Martinez',
    territory: 'North Region',
    doctorCount: 8,
    monthlyTarget: 25000,
    currentSales: 28500,
    phone: '(555) 123-4567'
  },
  {
    id: '2',
    name: 'Mike Chen',
    territory: 'South Region',
    doctorCount: 6,
    monthlyTarget: 20000,
    currentSales: 18200,
    phone: '(555) 234-5678'
  },
  {
    id: '3',
    name: 'Sarah Williams',
    territory: 'East Region',
    doctorCount: 7,
    monthlyTarget: 22000,
    currentSales: 24100,
    phone: '(555) 345-6789'
  },
  {
    id: '4',
    name: 'David Rodriguez',
    territory: 'West Region',
    doctorCount: 5,
    monthlyTarget: 18000,
    currentSales: 16800,
    phone: '(555) 456-7890'
  }
];

const RegionalDistributorDashboard: React.FC = () => {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'sales': return UsersIcon;
      case 'doctor': return UserGroupIcon;
      case 'order': return ArchiveBoxIcon;
      case 'network': return ChartBarIcon;
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

  const getPerformanceColor = (current: number, target: number) => {
    const percentage = (current / target) * 100;
    if (percentage >= 100) return 'text-green-600';
    if (percentage >= 80) return 'text-amber-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Regional Distributor Dashboard</h1>
          <p className="text-slate-600 mt-1">Manage your regional operations and monitor your sales network</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex items-center">
            <div className="h-2 w-2 bg-green-500 rounded-full mr-2" />
            <span className="text-sm text-slate-600">Network Status: Operational</span>
          </div>
        </div>
      </div>

      {/* Sales Team Metrics */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-slate-900">Regional Sales Performance</h2>
          <span className="text-sm text-slate-500">Your regional sales metrics</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {metrics.filter(metric => metric.type === 'sales').map((metric) => (
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

      {/* Medical Operations Management */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-slate-900">Medical Operations</h2>
          <span className="text-sm text-slate-500">Full regional medical operations visibility</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {metrics.filter(metric => metric.type === 'medical').map((metric) => (
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

      {/* Sales Team Overview and Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Team Overview */}
        <Card className="overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200">
            <h3 className="text-lg font-medium text-slate-900">Sales Team Overview</h3>
            <p className="text-sm text-slate-500 mt-1">Your regional sales representatives</p>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {salesTeam.map((rep) => {
                const performancePercentage = (rep.currentSales / rep.monthlyTarget) * 100;
                const performanceColor = getPerformanceColor(rep.currentSales, rep.monthlyTarget);

                return (
                  <div key={rep.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center">
                        <span className="text-slate-600 font-medium text-sm">
                          {rep.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900">{rep.name}</p>
                        <div className="flex items-center text-xs text-slate-500">
                          <MapPinIcon className="h-3 w-3 mr-1" />
                          {rep.territory} • {rep.doctorCount} doctors
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-medium ${performanceColor}`}>
                        ${rep.currentSales.toLocaleString()}
                      </p>
                      <p className="text-xs text-slate-500">
                        {performancePercentage.toFixed(0)}% of target
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 pt-4 border-t border-slate-200">
              <button className="w-full flex items-center justify-center p-2 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors">
                <PlusIcon className="h-4 w-4 mr-2" />
                Add Sales Representative
              </button>
            </div>
          </div>
        </Card>

        {/* Recent Activity */}
        <Card className="overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200">
            <h3 className="text-lg font-medium text-slate-900">Recent Activity</h3>
            <p className="text-sm text-slate-500 mt-1">Sales team and network updates</p>
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

      {/* Quick Actions */}
      <Card className="overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200">
          <h3 className="text-lg font-medium text-slate-900">Quick Actions</h3>
          <p className="text-sm text-slate-500 mt-1">Regional operations management</p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button className="flex flex-col items-center p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors text-center">
              <UsersIcon className="h-8 w-8 text-blue-600 mb-2" />
              <span className="text-sm font-medium text-slate-900">Manage Sales Team</span>
              <span className="text-xs text-slate-500 mt-1">8 active reps</span>
            </button>
            <button className="flex flex-col items-center p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors text-center">
              <UserGroupIcon className="h-8 w-8 text-purple-600 mb-2" />
              <span className="text-sm font-medium text-slate-900">Doctor Network</span>
              <span className="text-xs text-slate-500 mt-1">34 doctors</span>
            </button>
            <button className="flex flex-col items-center p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors text-center">
              <DocumentTextIcon className="h-8 w-8 text-amber-600 mb-2" />
              <span className="text-sm font-medium text-slate-900">IVR Management</span>
              <span className="text-xs text-slate-500 mt-1">89 this month</span>
            </button>
            <button className="flex flex-col items-center p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors text-center">
              <ArchiveBoxIcon className="h-8 w-8 text-indigo-600 mb-2" />
              <span className="text-sm font-medium text-slate-900">Order Management</span>
              <span className="text-xs text-slate-500 mt-1">23 active orders</span>
            </button>
            <button className="flex flex-col items-center p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors text-center">
              <TruckIcon className="h-8 w-8 text-green-600 mb-2" />
              <span className="text-sm font-medium text-slate-900">Shipping & Logistics</span>
              <span className="text-xs text-slate-500 mt-1">Track shipments</span>
            </button>
            <button className="flex flex-col items-center p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors text-center">
              <ChartBarIcon className="h-8 w-8 text-green-600 mb-2" />
              <span className="text-sm font-medium text-slate-900">View Analytics</span>
              <span className="text-xs text-slate-500 mt-1">Performance reports</span>
            </button>
            <button className="flex flex-col items-center p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors text-center">
              <PhoneIcon className="h-8 w-8 text-amber-600 mb-2" />
              <span className="text-sm font-medium text-slate-900">Team Meeting</span>
              <span className="text-xs text-slate-500 mt-1">Schedule call</span>
            </button>
            <button className="flex flex-col items-center p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors text-center">
              <Cog6ToothIcon className="h-8 w-8 text-slate-600 mb-2" />
              <span className="text-sm font-medium text-slate-900">Settings</span>
              <span className="text-xs text-slate-500 mt-1">Configure region</span>
            </button>
          </div>
        </div>
      </Card>

      {/* Regional Performance Summary */}
      <Card className="overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200">
          <h3 className="text-lg font-medium text-slate-900">Regional Performance Summary</h3>
          <p className="text-sm text-slate-500 mt-1">Territory performance and growth insights</p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">114%</div>
              <div className="text-sm text-slate-600">Monthly Target</div>
              <div className="text-xs text-slate-500 mt-1">Above target performance</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">34</div>
              <div className="text-sm text-slate-600">Active Doctors</div>
              <div className="text-xs text-slate-500 mt-1">Across all territories</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">$156K</div>
              <div className="text-sm text-slate-600">Monthly Revenue</div>
              <div className="text-xs text-slate-500 mt-1">14% above forecast</div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Excellent Performance</p>
                <p className="text-xs text-slate-500">All territories meeting or exceeding targets</p>
              </div>
              <button className="text-sm text-[#375788] hover:text-[#247297] font-medium">
                View Detailed Report
              </button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default RegionalDistributorDashboard;