import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChartBarIcon,
  UserGroupIcon,
  ClipboardDocumentCheckIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ArrowDownTrayIcon,
  PresentationChartLineIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import UnifiedDashboardLayout from '../../components/shared/layout/UnifiedDashboardLayout';
import { createSalesNavigation } from '../../components/sales/SimpleSalesDashboard';

const Analytics: React.FC = () => {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [dateRange, setDateRange] = useState('last30days');

  const navigation = createSalesNavigation(logout);

  const userInfo = {
    name: user?.first_name ? `${user.first_name} ${user.last_name}` : 'Sales Rep',
    role: 'Sales Representative',
    avatar: user?.first_name?.charAt(0) || 'S'
  };

  // Mock KPI data - TODO: Replace with real API data
  const kpis = {
    networkGrowthRate: {
      value: '+15%',
      trend: 'positive',
      change: '+3% from last period'
    },
    avgIVRsPerDoctor: {
      value: '3.5',
      trend: 'positive',
      change: '+0.8 from last period'
    },
    conversionRate: {
      value: '85%',
      trend: 'positive',
      change: '+5% from last period'
    },
    activeDoctorPercentage: {
      value: '67%',
      trend: 'negative',
      change: '-2% from last period'
    }
  };

  const handleExportReport = () => {
    // TODO: Implement report export functionality
    console.log('Export report clicked for date range:', dateRange);
  };

  const getTrendIcon = (trend: string) => {
    return trend === 'positive' ? ArrowUpIcon : ArrowDownIcon;
  };

  const getTrendColor = (trend: string) => {
    return trend === 'positive' ? 'text-green-600' : 'text-red-600';
  };

  return (
    <UnifiedDashboardLayout navigation={navigation} userInfo={userInfo}>
      <div className="space-y-6">
        {/* Breadcrumb */}
        <nav className="flex" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-4">
            <li>
              <div className="flex items-center">
                <span className="text-gray-500 hover:text-gray-700 cursor-pointer">Sales</span>
              </div>
            </li>
            <li>
              <div className="flex items-center">
                <svg className="flex-shrink-0 h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
                <span className="ml-4 text-gray-900 font-medium">Analytics</span>
              </div>
            </li>
          </ol>
        </nav>

        {/* Header */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Sales Analytics</h1>
              <p className="text-gray-600 mt-2">Track performance and identify opportunities</p>
            </div>
            <div className="flex items-center">
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-slate-500 focus:border-slate-500"
              >
                <option value="last7days">Last 7 days</option>
                <option value="last30days">Last 30 days</option>
                <option value="last90days">Last 90 days</option>
                <option value="thisMonth">This month</option>
                <option value="lastMonth">Last month</option>
                <option value="thisYear">This year</option>
              </select>
              <button
                onClick={handleExportReport}
                className="bg-slate-600 text-white px-4 py-2 rounded-md hover:bg-slate-700 ml-4 inline-flex items-center text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
              >
                <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
                Export Report
              </button>
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Network Growth Rate */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <PresentationChartLineIcon className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-medium text-gray-500">Network Growth Rate</h3>
                  <p className={`text-2xl font-bold ${kpis.networkGrowthRate.trend === 'positive' ? 'text-green-600' : 'text-red-600'}`}>
                    {kpis.networkGrowthRate.value}
                  </p>
                </div>
              </div>
            </div>
            <div className={`flex items-center mt-2 text-xs ${getTrendColor(kpis.networkGrowthRate.trend)}`}>
              {React.createElement(getTrendIcon(kpis.networkGrowthRate.trend), { className: 'h-3 w-3 mr-1' })}
              {kpis.networkGrowthRate.change}
            </div>
          </div>

          {/* Average IVRs per Doctor */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <ClipboardDocumentCheckIcon className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-medium text-gray-500">Average IVRs per Doctor</h3>
                  <p className="text-2xl font-bold text-gray-900">{kpis.avgIVRsPerDoctor.value}</p>
                </div>
              </div>
            </div>
            <div className={`flex items-center mt-2 text-xs ${getTrendColor(kpis.avgIVRsPerDoctor.trend)}`}>
              {React.createElement(getTrendIcon(kpis.avgIVRsPerDoctor.trend), { className: 'h-3 w-3 mr-1' })}
              {kpis.avgIVRsPerDoctor.change}
            </div>
          </div>

          {/* Conversion Rate */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <ChartBarIcon className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-medium text-gray-500">Conversion Rate</h3>
                  <p className="text-2xl font-bold text-gray-900">{kpis.conversionRate.value}</p>
                  <p className="text-xs text-gray-500">IVR to Order</p>
                </div>
              </div>
            </div>
            <div className={`flex items-center mt-2 text-xs ${getTrendColor(kpis.conversionRate.trend)}`}>
              {React.createElement(getTrendIcon(kpis.conversionRate.trend), { className: 'h-3 w-3 mr-1' })}
              {kpis.conversionRate.change}
            </div>
          </div>

          {/* Active Doctor Percentage */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <UserGroupIcon className="h-6 w-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-medium text-gray-500">Active Doctor Percentage</h3>
                  <p className="text-2xl font-bold text-gray-900">{kpis.activeDoctorPercentage.value}</p>
                  <p className="text-xs text-gray-500">submitted IVRs this month</p>
                </div>
              </div>
            </div>
            <div className={`flex items-center mt-2 text-xs ${getTrendColor(kpis.activeDoctorPercentage.trend)}`}>
              {React.createElement(getTrendIcon(kpis.activeDoctorPercentage.trend), { className: 'h-3 w-3 mr-1' })}
              {kpis.activeDoctorPercentage.change}
            </div>
          </div>
        </div>

        {/* Performance Charts Placeholder */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Performance Charts</h3>
          <div className="text-gray-500 text-center py-12">
            📊 Interactive charts coming soon...
            <br />
            • Doctor Activity Trends
            <br />
            • IVR Submission Patterns
            <br />
            • Order Volume Analysis
            <br />
            • Territory Performance Map
          </div>
        </div>
      </div>
    </UnifiedDashboardLayout>
  );
};

export default Analytics;