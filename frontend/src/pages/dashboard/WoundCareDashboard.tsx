import React from 'react';
import { format } from 'date-fns';
import { MetricCard } from '../../components/shared/DashboardWidgets/MetricCard';
import { ChartCard } from '../../components/shared/DashboardWidgets/ChartCard';
import {
  BellIcon,
  UserPlusIcon,
  ClipboardDocumentCheckIcon,
  ShoppingCartIcon,
  ChartBarIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

// Mock data for IVR processing trends
const ivrTrendData = [
  { label: '9 AM', value: 15 },
  { label: '10 AM', value: 20 },
  { label: '11 AM', value: 18 },
  { label: '12 PM', value: 25 },
  { label: '1 PM', value: 22 },
  { label: '2 PM', value: 28 },
  { label: '3 PM', value: 32 },
];

// Mock data for urgent IVR reviews
const urgentItems = [
  {
    id: 1,
    title: 'Lab Results Review',
    priority: 'Urgent',
    time: '10 mins ago',
    priorityColor: 'red',
  },
  {
    id: 2,
    title: 'Patient Callback',
    priority: 'High',
    time: '25 mins ago',
    priorityColor: 'orange',
  },
  {
    id: 3,
    title: 'Prescription Renewal',
    priority: 'Medium',
    time: '1 hour ago',
    priorityColor: 'yellow',
  },
  {
    id: 4,
    title: 'Insurance Verification',
    priority: 'Medium',
    time: '2 hours ago',
    priorityColor: 'yellow',
  },
];

const WoundCareDashboard: React.FC = () => {
  const notifications = 2; // Number of new urgent items

  return (
    <div className="bg-gray-50">
      <div className="p-8">
        {/* Header Section */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
            <p className="text-sm text-gray-500 mt-1">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <div className="h-2 w-2 bg-green-500 rounded-full mr-2" />
              <span className="text-sm text-gray-600">Welcome back, Dr.</span>
            </div>
          </div>
        </div>

        {/* Key Performance Indicators */}
        <div className="mb-8">
          <h2 className="text-lg font-medium text-gray-700 mb-4">Key Performance Indicators</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Patients</p>
                  <div className="flex items-baseline mt-1">
                    <h3 className="text-2xl font-semibold text-gray-900">1.2K</h3>
                    <span className="ml-2 text-sm text-green-500">↑ 12%</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">patients</p>
                </div>
                <div className="p-3 bg-blue-50 rounded-full">
                  <UserPlusIcon className="h-6 w-6 text-blue-500" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Today's IVR Requests</p>
                  <div className="flex items-baseline mt-1">
                    <h3 className="text-2xl font-semibold text-gray-900">28</h3>
                    <span className="ml-2 text-sm text-green-500">↑ 5%</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">scheduled</p>
                </div>
                <div className="p-3 bg-green-50 rounded-full">
                  <ClipboardDocumentCheckIcon className="h-6 w-6 text-green-500" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">IVR Approval Rate</p>
                  <div className="flex items-baseline mt-1">
                    <h3 className="text-2xl font-semibold text-gray-900">94.5%</h3>
                    <span className="ml-2 text-sm text-green-500">↑ 2.3%</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">approval rate</p>
                </div>
                <div className="p-3 bg-purple-50 rounded-full">
                  <ChartBarIcon className="h-6 w-6 text-purple-500" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Avg. Processing Time</p>
                  <div className="flex items-baseline mt-1">
                    <h3 className="text-2xl font-semibold text-gray-900">12</h3>
                    <span className="ml-2 text-sm text-red-500">↓ 8%</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">minutes</p>
                </div>
                <div className="p-3 bg-orange-50 rounded-full">
                  <ClockIcon className="h-6 w-6 text-orange-500" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Patient Flow Chart */}
          <div className="lg:col-span-2 bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-medium text-gray-700">Today's Overview</h2>
            </div>
            <div className="h-[300px]">
              <ChartCard
                title=""
                type="line"
                data={ivrTrendData}
                dataKey="value"
                color="#375788"
                height={280}
              />
            </div>
          </div>

          {/* Urgent Items */}
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-medium text-gray-700">Urgent Items</h2>
              <span className="px-2 py-1 text-xs font-medium text-red-600 bg-red-50 rounded-full">
                {notifications} New
              </span>
            </div>
            <div className="space-y-4">
              {urgentItems.map((item) => (
                <div key={item.id} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <div className={`h-2 w-2 rounded-full mr-3 ${
                      item.priorityColor === 'red' 
                        ? 'bg-red-500' 
                        : item.priorityColor === 'orange'
                        ? 'bg-orange-500'
                        : 'bg-yellow-500'
                    }`} />
                    <div>
                      <p className="font-medium text-gray-900">{item.title}</p>
                      <div className="flex items-center mt-1">
                        <span className={`text-sm ${
                          item.priorityColor === 'red'
                            ? 'text-red-600'
                            : item.priorityColor === 'orange'
                            ? 'text-orange-600'
                            : 'text-yellow-600'
                        }`}>
                          {item.priority} Priority
                        </span>
                        <span className="mx-2 text-gray-300">•</span>
                        <span className="text-sm text-gray-500">{item.time}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <h2 className="text-lg font-medium text-gray-700 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button className="flex items-center justify-center p-4 bg-white rounded-lg shadow-sm hover:bg-gray-50 transition-colors group">
              <UserPlusIcon className="h-6 w-6 text-gray-400 group-hover:text-gray-500 mr-3" />
              <span className="text-sm font-medium text-gray-700">New Patient</span>
            </button>
            <button className="flex items-center justify-center p-4 bg-white rounded-lg shadow-sm hover:bg-gray-50 transition-colors group">
              <ClipboardDocumentCheckIcon className="h-6 w-6 text-gray-400 group-hover:text-gray-500 mr-3" />
              <span className="text-sm font-medium text-gray-700">Submit IVR</span>
            </button>
            <button className="flex items-center justify-center p-4 bg-white rounded-lg shadow-sm hover:bg-gray-50 transition-colors group">
              <ShoppingCartIcon className="h-6 w-6 text-gray-400 group-hover:text-gray-500 mr-3" />
              <span className="text-sm font-medium text-gray-700">Process Orders</span>
            </button>
            <button className="flex items-center justify-center p-4 bg-white rounded-lg shadow-sm hover:bg-gray-50 transition-colors group">
              <ChartBarIcon className="h-6 w-6 text-gray-400 group-hover:text-gray-500 mr-3" />
              <span className="text-sm font-medium text-gray-700">View Reports</span>
            </button>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="mt-8">
          <h2 className="text-lg font-medium text-gray-700 mb-4">Recent Activity</h2>
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <div className="h-2 w-2 bg-green-500 rounded-full mr-3" />
                <div>
                  <p className="font-medium text-gray-900">Patient Check-in</p>
                  <p className="text-sm text-gray-500">Sarah Johnson checked in for appointment</p>
                  <p className="text-xs text-gray-400 mt-1">5 mins ago</p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <div className="h-2 w-2 bg-blue-500 rounded-full mr-3" />
                <div>
                  <p className="font-medium text-gray-900">New Lab Results</p>
                  <p className="text-sm text-gray-500">Lab results received for Michael Chen</p>
                  <p className="text-xs text-gray-400 mt-1">10 mins ago</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WoundCareDashboard; 