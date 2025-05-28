import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart, LineChart, PieChart } from 'lucide-react';
import { analyticsService } from '@/services/analyticsService';
import { formatNumber, formatDate } from '@/utils/format';

interface MetricCard {
  title: string;
  value: number;
  change: number;
  icon: React.ReactNode;
  color: string;
}

const SystemAnalytics: React.FC = () => {
  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['system-metrics'],
    queryFn: analyticsService.getSystemMetrics
  });

  const { data: userActivity, isLoading: activityLoading } = useQuery({
    queryKey: ['user-activity'],
    queryFn: analyticsService.getUserActivity
  });

  const { data: resourceUsage, isLoading: resourceLoading } = useQuery({
    queryKey: ['resource-usage'],
    queryFn: analyticsService.getResourceUsage
  });

  const metricCards: MetricCard[] = [
    {
      title: 'Active Users',
      value: metrics?.activeUsers || 0,
      change: metrics?.userGrowth || 0,
      icon: <LineChart className="w-6 h-6" />,
      color: 'bg-blue-500'
    },
    {
      title: 'Total Requests',
      value: metrics?.totalRequests || 0,
      change: metrics?.requestGrowth || 0,
      icon: <BarChart className="w-6 h-6" />,
      color: 'bg-green-500'
    },
    {
      title: 'Error Rate',
      value: metrics?.errorRate || 0,
      change: metrics?.errorRateChange || 0,
      icon: <PieChart className="w-6 h-6" />,
      color: 'bg-red-500'
    }
  ];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold text-gray-800 mb-6">System Analytics</h1>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {metricCards.map((card, index) => (
          <div
            key={index}
            className="bg-white rounded-lg shadow p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-lg ${card.color} text-white`}>
                {card.icon}
              </div>
              <div className={`text-sm font-medium ${
                card.change >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {card.change >= 0 ? '+' : ''}{card.change}%
              </div>
            </div>
            <h3 className="text-lg font-medium text-gray-800">{card.title}</h3>
            <p className="text-2xl font-semibold text-gray-900">
              {formatNumber(card.value)}
            </p>
          </div>
        ))}
      </div>

      {/* User Activity */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">User Activity</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Resource</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {activityLoading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center">Loading...</td>
                </tr>
              ) : userActivity?.map((activity, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{activity.user}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{activity.action}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{activity.resource}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{formatDate(activity.timestamp)}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Resource Usage */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Resource Usage</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {resourceLoading ? (
            <div className="col-span-full text-center py-4">Loading...</div>
          ) : resourceUsage?.map((resource, index) => (
            <div key={index} className="p-4 border rounded-lg">
              <h3 className="text-sm font-medium text-gray-600 mb-2">{resource.name}</h3>
              <div className="flex items-center">
                <div className="flex-grow">
                  <div className="h-2 bg-gray-200 rounded-full">
                    <div
                      className="h-2 bg-blue-500 rounded-full"
                      style={{ width: `${resource.usage}%` }}
                    />
                  </div>
                </div>
                <span className="ml-2 text-sm font-medium text-gray-900">
                  {resource.usage}%
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {resource.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SystemAnalytics; 