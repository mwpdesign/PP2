import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CalendarDaysIcon,
  ClockIcon,
  DocumentTextIcon,
  PlusIcon,
  UserGroupIcon,
  ChartBarIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import UnifiedDashboardLayout from '../../components/shared/layout/UnifiedDashboardLayout';
import { createSalesNavigation } from '../../components/sales/SimpleSalesDashboard';

const Schedule: React.FC = () => {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [activeTab, setActiveTab] = useState('calendar');

  const navigation = createSalesNavigation(logout);

  const userInfo = {
    name: user?.first_name ? `${user.first_name} ${user.last_name}` : 'Sales Rep',
    role: 'Sales Representative',
    avatar: user?.first_name?.charAt(0) || 'S'
  };

  // Mock stats data - will be replaced with real API data later
  const stats = {
    thisWeek: 3,
    thisMonth: 12,
    overdue: 2,
    averageFrequency: 14
  };

  const tabs = [
    {
      id: 'calendar',
      name: 'Calendar View',
      icon: CalendarDaysIcon,
      content: (
        <div className="text-center py-16">
          <CalendarDaysIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">📅 Calendar view coming soon...</h3>
          <p className="text-gray-600">This will show a monthly calendar with scheduled visits.</p>
        </div>
      )
    },
    {
      id: 'upcoming',
      name: 'Upcoming Visits',
      icon: ClockIcon,
      content: (
        <div className="text-center py-16">
          <ClockIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">🕐 Upcoming visits list coming soon...</h3>
          <p className="text-gray-600">This will show your next scheduled doctor visits.</p>
        </div>
      )
    },
    {
      id: 'history',
      name: 'Visit History',
      icon: DocumentTextIcon,
      content: (
        <div className="text-center py-16">
          <DocumentTextIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">📋 Visit history coming soon...</h3>
          <p className="text-gray-600">This will show past visits and outcomes.</p>
        </div>
      )
    }
  ];

  const handleScheduleNewVisit = () => {
    // TODO: Navigate to schedule new visit modal/page
    console.log('Schedule new visit clicked');
  };

  return (
    <UnifiedDashboardLayout navigation={navigation} userInfo={userInfo}>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Visit Schedule</h1>
              <p className="text-gray-600 mt-2">Manage visits with doctors in your network</p>
            </div>
            <button
              onClick={handleScheduleNewVisit}
              className="inline-flex items-center px-4 py-2 bg-slate-600 text-white text-sm font-medium rounded-md hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Schedule New Visit
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* This Week */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <CalendarDaysIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">This Week</h3>
                <p className="text-2xl font-bold text-gray-900">{stats.thisWeek}</p>
                <p className="text-xs text-gray-500">visits</p>
              </div>
            </div>
          </div>

          {/* This Month */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <ChartBarIcon className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">This Month</h3>
                <p className="text-2xl font-bold text-gray-900">{stats.thisMonth}</p>
                <p className="text-xs text-gray-500">visits</p>
              </div>
            </div>
          </div>

          {/* Overdue Visits */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">Overdue Visits</h3>
                <p className="text-2xl font-bold text-gray-900">{stats.overdue}</p>
                <p className="text-xs text-gray-500">doctors</p>
              </div>
            </div>
          </div>

          {/* Average Visit Frequency */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <UserGroupIcon className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">Average Visit Frequency</h3>
                <p className="text-2xl font-bold text-gray-900">{stats.averageFrequency}</p>
                <p className="text-xs text-gray-500">days</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabbed Interface */}
        <div className="bg-white rounded-lg shadow">
          {/* Tab Navigation */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`${
                      activeTab === tab.id
                        ? 'border-slate-600 text-slate-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {tab.name}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {tabs.find(tab => tab.id === activeTab)?.content}
          </div>
        </div>
      </div>
    </UnifiedDashboardLayout>
  );
};

export default Schedule;