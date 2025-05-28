import React from 'react';
import OrderMetrics from './metrics/OrderMetrics';
import PatientInsights from './metrics/PatientInsights';
import IVRPerformance from './metrics/IVRPerformance';
import ComplianceMetrics from './metrics/ComplianceMetrics';
import { format } from 'date-fns';

interface DoctorDashboardProps {
  doctorId: string;
}

const DoctorDashboard: React.FC<DoctorDashboardProps> = ({ doctorId }) => {
  const [dateRange, setDateRange] = React.useState<'week' | 'month' | 'quarter'>('week');
  const [isLoading, setIsLoading] = React.useState(false);

  return (
    <div className="space-y-8">
      {/* Header with Date Range Selector */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Analytics Dashboard</h2>
          <p className="mt-1 text-sm text-gray-500">
            Last updated: {format(new Date(), 'MMM d, yyyy h:mm a')}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">Time Range:</span>
          <div className="inline-flex rounded-lg shadow-sm">
            <button
              onClick={() => setDateRange('week')}
              className={`px-4 py-2 text-sm font-medium rounded-l-lg ${
                dateRange === 'week'
                  ? 'bg-slate-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              } border border-gray-200`}
            >
              Week
            </button>
            <button
              onClick={() => setDateRange('month')}
              className={`px-4 py-2 text-sm font-medium -ml-px ${
                dateRange === 'month'
                  ? 'bg-slate-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              } border border-gray-200`}
            >
              Month
            </button>
            <button
              onClick={() => setDateRange('quarter')}
              className={`px-4 py-2 text-sm font-medium rounded-r-lg -ml-px ${
                dateRange === 'quarter'
                  ? 'bg-slate-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              } border border-gray-200`}
            >
              Quarter
            </button>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Orders</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">247</h3>
            </div>
            <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <span className="text-green-500 text-sm font-medium">↑ 12%</span>
            <span className="text-gray-500 text-sm ml-2">vs last {dateRange}</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Success Rate</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">94.2%</h3>
            </div>
            <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <span className="text-green-500 text-sm font-medium">↑ 2.3%</span>
            <span className="text-gray-500 text-sm ml-2">vs last {dateRange}</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Avg. Processing Time</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">1.4 days</h3>
            </div>
            <div className="w-12 h-12 bg-purple-50 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <span className="text-red-500 text-sm font-medium">↓ 0.2 days</span>
            <span className="text-gray-500 text-sm ml-2">vs last {dateRange}</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Patient Satisfaction</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">4.8/5</h3>
            </div>
            <div className="w-12 h-12 bg-yellow-50 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <span className="text-green-500 text-sm font-medium">↑ 0.2</span>
            <span className="text-gray-500 text-sm ml-2">vs last {dateRange}</span>
          </div>
        </div>
      </div>

      {/* Detailed Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <OrderMetrics dateRange={dateRange} doctorId={doctorId} />
        <PatientInsights dateRange={dateRange} doctorId={doctorId} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <IVRPerformance dateRange={dateRange} doctorId={doctorId} />
        <ComplianceMetrics dateRange={dateRange} doctorId={doctorId} />
      </div>
    </div>
  );
};

export default DoctorDashboard; 