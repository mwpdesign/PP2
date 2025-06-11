import React, { useState, useRef } from 'react';
import { ChartCard } from '../../components/shared/DashboardWidgets/ChartCard';
import {
  UserPlusIcon,
  ClipboardDocumentListIcon,
  ClockIcon,
  DocumentTextIcon,
  ClipboardDocumentCheckIcon,
} from '@heroicons/react/24/outline';
import { Link, useNavigate } from 'react-router-dom';
import { NotificationDropdown } from '../../components/shared/NotificationDropdown';

// Mock data for IVR processing trends
const ivrTrendData = [
  { day: 'Mon', submissions: 42, approvals: 38 },
  { day: 'Tue', submissions: 48, approvals: 45 },
  { day: 'Wed', submissions: 52, approvals: 48 },
  { day: 'Thu', submissions: 45, approvals: 42 },
  { day: 'Fri', submissions: 50, approvals: 47 },
  { day: 'Sat', submissions: 35, approvals: 32 },
  { day: 'Sun', submissions: 30, approvals: 28 },
];

// Mock data for urgent IVR reviews (notifications)
const initialUrgentItems = [
  {
    id: 1,
    title: 'Skin Graft IVR Missing Clinical Photos',
    priority: 'Critical',
    time: '10 mins ago',
    priorityColor: 'red',
    isRead: false,
  },
  {
    id: 2,
    title: 'Advanced Wound Matrix Pre-Auth Denied',
    priority: 'High',
    time: '25 mins ago',
    priorityColor: 'orange',
    isRead: false,
  },
  {
    id: 3,
    title: 'Temperature-Controlled Shipment Delayed',
    priority: 'Medium',
    time: '1 hour ago',
    priorityColor: 'yellow',
    isRead: true,
  },
  {
    id: 4,
    title: 'Negative Pressure Therapy Documentation Required',
    priority: 'Medium',
    time: '2 hours ago',
    priorityColor: 'yellow',
    isRead: true,
  },
];

// Recent activity data
const recentActivity = [
  {
    id: 1,
    title: 'IVR Submitted: Diabetic foot ulcer skin graft case #2847',
    description: 'Submitted by Dr. Johnson',
    time: '5 mins ago',
    color: 'blue',
    type: 'ivr',
    itemId: '2847',
  },
  {
    id: 2,
    title: 'Order Approved: Collagen matrix for burn patient #1923',
    description: 'Approved by Insurance Team',
    time: '12 mins ago',
    color: 'green',
    type: 'order',
    itemId: '1923',
  },
  {
    id: 3,
    title: 'Shipment Dispatched: Negative pressure therapy unit',
    description: 'En route to patient #4567',
    time: '18 mins ago',
    color: 'purple',
    type: 'order',
    itemId: '4567',
  },
  {
    id: 4,
    title: 'IVR Under Review: Complex wound assessment case #4821',
    description: 'Pending clinical review',
    time: '25 mins ago',
    color: 'yellow',
    type: 'ivr',
    itemId: '4821',
  },
];

const quickActions = [
  {
    name: 'New Patient Intake',
    description: 'Register a new patient',
    href: '/doctor/patients/intake',
    icon: UserPlusIcon,
  },
  {
    name: 'Submit IVR Request',
    description: 'Create insurance verification request',
    href: '/doctor/patients/select',
    icon: DocumentTextIcon,
  },
  {
    name: 'Track Orders',
    description: 'View and manage patient orders',
    href: '/doctor/orders',
          icon: ClipboardDocumentListIcon,
  },
  {
    name: 'Review IVR Queue',
    description: 'Check pending IVR requests',
    href: '/doctor/ivr',
    icon: ClipboardDocumentCheckIcon,
  },
];

const WoundCareDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [urgentItems, setUrgentItems] = useState(initialUrgentItems);
  const [selectedNotification, setSelectedNotification] = useState<number | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const notificationRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});

  const urgentNotifications = urgentItems.filter(item => !item.isRead).length;

  const handleNotificationClick = (notificationId: number, event: React.MouseEvent) => {
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    setDropdownPosition({
      top: rect.bottom + 8,
      left: rect.left
    });
    setSelectedNotification(notificationId);
  };

  const handleMarkAsRead = (notificationId: number) => {
    setUrgentItems(prev =>
      prev.map(item =>
        item.id === notificationId ? { ...item, isRead: true } : item
      )
    );
    setSelectedNotification(null);
  };

  const handleCloseDropdown = () => {
    setSelectedNotification(null);
  };

  const handleActivityClick = (activity: typeof recentActivity[0]) => {
    if (activity.type === 'ivr') {
      navigate(`/doctor/ivr/${activity.itemId}`);
    } else if (activity.type === 'order') {
      navigate(`/doctor/orders/${activity.itemId}`);
    }
  };

  const selectedNotificationData = urgentItems.find(item => item.id === selectedNotification);

  return (
    <div className="bg-gray-50">
      <div className="p-8">
        {/* Key Performance Indicators */}
        <div className="mb-8">
          <h2 className="text-lg font-medium text-gray-700 mb-4">Key Performance Indicators</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">IVR Requests Today</p>
                  <div className="flex items-baseline mt-1">
                    <h3 className="text-2xl font-semibold text-gray-900">47</h3>
                    <span className="ml-2 text-sm text-green-500">↑ 12%</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">requests</p>
                </div>
                <div className="p-3 bg-blue-50 rounded-full">
                  <ClipboardDocumentListIcon className="h-6 w-6 text-blue-500" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Pending Approvals</p>
                  <div className="flex items-baseline mt-1">
                    <h3 className="text-2xl font-semibold text-gray-900">28</h3>
                    <span className="ml-2 text-sm text-red-500">↑ 5%</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">pending</p>
                </div>
                <div className="p-3 bg-green-50 rounded-full">
                  <UserPlusIcon className="h-6 w-6 text-green-500" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Active Orders</p>
                  <div className="flex items-baseline mt-1">
                    <h3 className="text-2xl font-semibold text-gray-900">34</h3>
                    <span className="ml-2 text-sm text-green-500">↑ 8%</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">in progress</p>
                </div>
                <div className="p-3 bg-purple-50 rounded-full">
                  <ClipboardDocumentListIcon className="h-6 w-6 text-purple-500" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Shipping</p>
                  <div className="flex items-baseline mt-1">
                    <h3 className="text-2xl font-semibold text-gray-900">12</h3>
                    <span className="ml-2 text-sm text-green-500">↑ 2%</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">shipments</p>
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
          {/* IVR Processing Trends Chart */}
          <div className="lg:col-span-2 bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-medium text-gray-700">IVR Processing Trends</h2>
              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  <div className="h-3 w-3 bg-[#375788] rounded-full mr-2" />
                  <span className="text-sm text-gray-600">Daily Submissions</span>
                </div>
                <div className="flex items-center">
                  <div className="h-3 w-3 bg-[#10B981] rounded-full mr-2" />
                  <span className="text-sm text-gray-600">Daily Approvals</span>
                </div>
              </div>
            </div>
            <div className="h-[300px]">
              <ChartCard
                title=""
                type="line"
                data={ivrTrendData}
                dataKey="submissions"
                secondaryDataKey="approvals"
                xAxisDataKey="day"
                color="#375788"
                secondaryColor="#10B981"
                height={280}
                legend={[
                  { key: 'submissions', label: 'Daily IVR Submissions', color: '#375788' },
                  { key: 'approvals', label: 'Daily IVR Approvals', color: '#10B981' }
                ]}
              />
            </div>
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-500">Days of Week</p>
            </div>
          </div>

          {/* Urgent Items (Notifications) */}
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-700">Notifications</h2>
              <span className="px-2 py-1 text-xs font-medium text-red-600 bg-red-50 rounded-full">
                {urgentNotifications} New
              </span>
            </div>
            <div className="space-y-2">
              {urgentItems.map((item) => (
                <div
                  key={item.id}
                  ref={el => notificationRefs.current[item.id] = el}
                  className={`p-2.5 rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md ${
                    item.isRead
                      ? 'bg-slate-50 hover:bg-slate-100'
                      : 'bg-blue-50 hover:bg-blue-100 border-l-4 border-blue-400'
                  }`}
                  onClick={(e) => handleNotificationClick(item.id, e)}
                >
                  <div className="flex items-center">
                    <div className={`h-2 w-2 rounded-full mr-2 ${
                      item.priorityColor === 'red'
                        ? 'bg-red-500'
                        : item.priorityColor === 'orange'
                        ? 'bg-orange-500'
                        : 'bg-yellow-500'
                    }`} />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className={`font-medium text-sm ${
                          item.isRead ? 'text-slate-700' : 'text-slate-900'
                        }`}>
                          {item.title}
                        </p>
                        {!item.isRead && (
                          <div className="h-2 w-2 bg-blue-500 rounded-full ml-2" />
                        )}
                      </div>
                      <div className="flex items-center mt-0.5">
                        <span className={`text-xs ${
                          item.priorityColor === 'red'
                            ? 'text-red-600'
                            : item.priorityColor === 'orange'
                            ? 'text-orange-600'
                            : 'text-yellow-600'
                        }`}>
                          {item.priority} Priority
                        </span>
                        <span className="mx-2 text-slate-300">•</span>
                        <span className="text-xs text-slate-500">{item.time}</span>
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
            {quickActions.map((action) => (
              <Link
                key={action.name}
                to={action.href}
                className="flex items-center p-4 bg-white rounded-lg shadow-sm hover:bg-gray-50 transition-colors group"
              >
                <div className="p-3 bg-blue-50 rounded-full transition-colors group-hover:bg-blue-100">
                  <action.icon className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-900">{action.name}</p>
                  <p className="text-xs text-gray-500">{action.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="mt-8">
          <h2 className="text-lg font-medium text-gray-700 mb-4">Recent Activity</h2>
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 hover:shadow-md transition-all duration-200"
                  onClick={() => handleActivityClick(activity)}
                >
                  <div className="flex items-center">
                    <div className={`p-2 rounded-lg bg-${activity.color}-50`}>
                      <div className={`h-2 w-2 rounded-full bg-${activity.color}-500`} />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-900 hover:text-blue-600 transition-colors">
                        {activity.title}
                      </p>
                      <div className="flex items-center mt-1">
                        <span className="text-sm text-gray-500">{activity.description}</span>
                        <span className="mx-2 text-gray-300">•</span>
                        <span className="text-sm text-gray-500">{activity.time}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Notification Dropdown */}
      {selectedNotificationData && (
        <NotificationDropdown
          notification={selectedNotificationData}
          isOpen={selectedNotification !== null}
          onClose={handleCloseDropdown}
          onMarkAsRead={handleMarkAsRead}
          position={dropdownPosition}
        />
      )}
    </div>
  );
};

export default WoundCareDashboard;