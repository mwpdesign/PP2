import React, { useState, useEffect } from 'react';
import { XMarkIcon, ChartBarIcon, ArrowTrendingUpIcon, TrendingDownIcon } from '@heroicons/react/24/outline';
import { format, subDays, startOfDay } from 'date-fns';

interface InvitationAnalyticsDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

// Mock analytics data
const mockAnalyticsData = {
  overview: {
    total_invitations: 1247,
    total_accepted: 892,
    total_pending: 234,
    total_expired: 89,
    total_cancelled: 32,
    acceptance_rate: 0.715,
    average_response_time: 2.3, // days
    trend_change: 0.12 // 12% increase
  },
  by_type: [
    { type: 'doctor', count: 456, accepted: 342, rate: 0.75 },
    { type: 'sales', count: 234, accepted: 189, rate: 0.81 },
    { type: 'distributor', count: 123, accepted: 98, rate: 0.80 },
    { type: 'office_admin', count: 189, accepted: 134, rate: 0.71 },
    { type: 'medical_staff', count: 145, accepted: 89, rate: 0.61 },
    { type: 'ivr_company', count: 67, accepted: 23, rate: 0.34 },
    { type: 'admin', count: 33, accepted: 17, rate: 0.52 }
  ],
  daily_stats: Array.from({ length: 30 }, (_, i) => ({
    date: format(subDays(new Date(), 29 - i), 'yyyy-MM-dd'),
    sent: Math.floor(Math.random() * 20) + 5,
    accepted: Math.floor(Math.random() * 15) + 2,
    expired: Math.floor(Math.random() * 3)
  })),
  response_times: [
    { range: '< 1 day', count: 234, percentage: 26.2 },
    { range: '1-3 days', count: 345, percentage: 38.7 },
    { range: '3-7 days', count: 213, percentage: 23.9 },
    { range: '> 7 days', count: 100, percentage: 11.2 }
  ]
};

export const InvitationAnalyticsDashboard: React.FC<InvitationAnalyticsDashboardProps> = ({
  isOpen,
  onClose
}) => {
  const [timeRange, setTimeRange] = useState('30d');
  const [analytics, setAnalytics] = useState(mockAnalyticsData);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Simulate loading analytics data
      setLoading(true);
      setTimeout(() => {
        setAnalytics(mockAnalyticsData);
        setLoading(false);
      }, 1000);
    }
  }, [isOpen, timeRange]);

  if (!isOpen) return null;

  const getTypeColor = (type: string) => {
    const colors = {
      doctor: 'bg-blue-500',
      sales: 'bg-green-500',
      distributor: 'bg-purple-500',
      office_admin: 'bg-yellow-500',
      medical_staff: 'bg-pink-500',
      ivr_company: 'bg-cyan-500',
      admin: 'bg-red-500'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-500';
  };

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div className="flex items-center space-x-3">
            <ChartBarIcon className="h-6 w-6 text-[#2E86AB]" />
            <h3 className="text-lg font-semibold text-slate-900">Invitation Analytics</h3>
          </div>
          <div className="flex items-center space-x-4">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2E86AB] focus:border-transparent"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
            </select>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2E86AB]"></div>
              <span className="ml-3 text-slate-600">Loading analytics...</span>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Overview Metrics */}
              <div>
                <h4 className="text-lg font-medium text-slate-900 mb-4">Overview</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-white border border-slate-200 rounded-lg p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-600">Total Invitations</p>
                        <p className="text-2xl font-bold text-slate-900">{analytics.overview.total_invitations.toLocaleString()}</p>
                      </div>
                      <div className="flex items-center text-green-600">
                        <ArrowTrendingUpIcon className="h-4 w-4 mr-1" />
                        <span className="text-sm font-medium">
                          {formatPercentage(analytics.overview.trend_change)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-lg p-6">
                    <div>
                      <p className="text-sm font-medium text-slate-600">Acceptance Rate</p>
                      <p className="text-2xl font-bold text-slate-900">
                        {formatPercentage(analytics.overview.acceptance_rate)}
                      </p>
                      <p className="text-sm text-slate-500 mt-1">
                        {analytics.overview.total_accepted} of {analytics.overview.total_invitations} accepted
                      </p>
                    </div>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-lg p-6">
                    <div>
                      <p className="text-sm font-medium text-slate-600">Avg Response Time</p>
                      <p className="text-2xl font-bold text-slate-900">
                        {analytics.overview.average_response_time} days
                      </p>
                      <p className="text-sm text-slate-500 mt-1">Time to acceptance</p>
                    </div>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-lg p-6">
                    <div>
                      <p className="text-sm font-medium text-slate-600">Pending</p>
                      <p className="text-2xl font-bold text-slate-900">{analytics.overview.total_pending}</p>
                      <p className="text-sm text-slate-500 mt-1">Awaiting response</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Invitation Types Breakdown */}
              <div>
                <h4 className="text-lg font-medium text-slate-900 mb-4">By User Type</h4>
                <div className="bg-white border border-slate-200 rounded-lg p-6">
                  <div className="space-y-4">
                    {analytics.by_type.map((item) => (
                      <div key={item.type} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`w-3 h-3 rounded-full ${getTypeColor(item.type)}`}></div>
                          <span className="text-sm font-medium text-slate-900 capitalize">
                            {item.type.replace('_', ' ')}
                          </span>
                        </div>
                        <div className="flex items-center space-x-6">
                          <div className="text-right">
                            <p className="text-sm font-medium text-slate-900">{item.count}</p>
                            <p className="text-xs text-slate-500">total</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-slate-900">{item.accepted}</p>
                            <p className="text-xs text-slate-500">accepted</p>
                          </div>
                          <div className="text-right min-w-[60px]">
                            <p className="text-sm font-medium text-slate-900">{formatPercentage(item.rate)}</p>
                            <p className="text-xs text-slate-500">rate</p>
                          </div>
                          <div className="w-24 bg-slate-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${getTypeColor(item.type)}`}
                              style={{ width: `${item.rate * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Response Time Distribution */}
              <div>
                <h4 className="text-lg font-medium text-slate-900 mb-4">Response Time Distribution</h4>
                <div className="bg-white border border-slate-200 rounded-lg p-6">
                  <div className="space-y-4">
                    {analytics.response_times.map((item, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <span className="text-sm font-medium text-slate-900 min-w-[80px]">
                            {item.range}
                          </span>
                        </div>
                        <div className="flex items-center space-x-4 flex-1 max-w-md">
                          <div className="flex-1 bg-slate-200 rounded-full h-2">
                            <div
                              className="h-2 rounded-full bg-[#2E86AB]"
                              style={{ width: `${item.percentage}%` }}
                            ></div>
                          </div>
                          <div className="text-right min-w-[80px]">
                            <p className="text-sm font-medium text-slate-900">{item.count}</p>
                            <p className="text-xs text-slate-500">{item.percentage.toFixed(1)}%</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Daily Activity Chart */}
              <div>
                <h4 className="text-lg font-medium text-slate-900 mb-4">Daily Activity (Last 30 Days)</h4>
                <div className="bg-white border border-slate-200 rounded-lg p-6">
                  <div className="h-64 flex items-end justify-between space-x-1">
                    {analytics.daily_stats.slice(-14).map((day, index) => (
                      <div key={index} className="flex flex-col items-center space-y-1 flex-1">
                        <div className="flex flex-col items-center space-y-1 h-48">
                          <div className="flex flex-col justify-end h-full space-y-1">
                            <div
                              className="bg-green-500 rounded-t"
                              style={{
                                height: `${(day.accepted / 20) * 100}%`,
                                minHeight: day.accepted > 0 ? '2px' : '0'
                              }}
                              title={`${day.accepted} accepted`}
                            ></div>
                            <div
                              className="bg-blue-500"
                              style={{
                                height: `${(day.sent / 20) * 100}%`,
                                minHeight: day.sent > 0 ? '2px' : '0'
                              }}
                              title={`${day.sent} sent`}
                            ></div>
                          </div>
                        </div>
                        <span className="text-xs text-slate-500 transform -rotate-45 origin-center">
                          {format(new Date(day.date), 'M/d')}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-center space-x-6 mt-4 pt-4 border-t border-slate-200">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-blue-500 rounded"></div>
                      <span className="text-sm text-slate-600">Sent</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-green-500 rounded"></div>
                      <span className="text-sm text-slate-600">Accepted</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Key Insights */}
              <div>
                <h4 className="text-lg font-medium text-slate-900 mb-4">Key Insights</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h5 className="text-sm font-medium text-blue-900 mb-2">Best Performing Type</h5>
                    <p className="text-sm text-blue-800">
                      Sales representatives have the highest acceptance rate at 81%,
                      making them the most responsive user type.
                    </p>
                  </div>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h5 className="text-sm font-medium text-yellow-900 mb-2">Improvement Opportunity</h5>
                    <p className="text-sm text-yellow-800">
                      IVR company invitations have a low 34% acceptance rate.
                      Consider reviewing the invitation process for this user type.
                    </p>
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h5 className="text-sm font-medium text-green-900 mb-2">Quick Response</h5>
                    <p className="text-sm text-green-800">
                      65% of invitations are accepted within 3 days,
                      indicating good engagement with the platform.
                    </p>
                  </div>
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <h5 className="text-sm font-medium text-purple-900 mb-2">Growth Trend</h5>
                    <p className="text-sm text-purple-800">
                      Invitation volume has increased by 12% compared to the previous period,
                      showing platform growth.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t border-slate-200">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2E86AB]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};