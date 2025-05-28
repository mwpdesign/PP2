import React, { useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { ChartCard } from '../../../components/shared/DashboardWidgets/ChartCard';
import { MetricCard } from '../../../components/shared/DashboardWidgets/MetricCard';
import {
  Activity, Users, Phone, Shield, Settings, Bell, FileText,
  TrendingUp, Map, AlertCircle, CheckCircle
} from 'lucide-react';

// Enhanced mock data for demonstration
const systemMetrics = [
  { name: 'Mon', calls: 1240, success: 1180, response: 950, avgDuration: 180 },
  { name: 'Tue', calls: 1380, success: 1290, response: 1050, avgDuration: 175 },
  { name: 'Wed', calls: 1520, success: 1420, response: 1150, avgDuration: 190 },
  { name: 'Thu', calls: 1640, success: 1580, response: 1250, avgDuration: 165 },
  { name: 'Fri', calls: 1780, success: 1690, response: 1350, avgDuration: 170 },
  { name: 'Sat', calls: 1460, success: 1380, response: 1150, avgDuration: 185 },
  { name: 'Sun', calls: 1260, success: 1200, response: 1050, avgDuration: 175 },
];

const geographicData = [
  { name: 'West', value: 35 },
  { name: 'East', value: 30 },
  { name: 'North', value: 20 },
  { name: 'South', value: 15 },
];

const COLORS = ['#2E86AB', '#4CAF50', '#F59E0B', '#EF4444'];

const recentActivity = [
  {
    id: 1,
    event: 'New Provider Added',
    user: 'Dr. Sarah Johnson',
    timestamp: '10 minutes ago',
    status: 'success',
    details: 'Added to Northwest Region',
  },
  {
    id: 2,
    event: 'System Update Completed',
    user: 'System',
    timestamp: '1 hour ago',
    status: 'success',
    details: 'Version 2.1.0 deployed successfully',
  },
  {
    id: 3,
    event: 'Security Alert',
    user: 'Security System',
    timestamp: '2 hours ago',
    status: 'warning',
    details: 'Unusual login pattern detected',
  },
  {
    id: 4,
    event: 'Backup Completed',
    user: 'System',
    timestamp: '3 hours ago',
    status: 'success',
    details: 'All systems backed up successfully',
  },
];

const systemAlerts = [
  {
    id: 1,
    type: 'success',
    message: 'All systems operational',
    details: '99.99% uptime in the last 24 hours',
  },
  {
    id: 2,
    type: 'info',
    message: 'Scheduled maintenance',
    details: 'Tomorrow at 2:00 AM EST',
  },
];

const AdminDashboard = () => {
  const { user } = useAuth();
  const [timeRange, setTimeRange] = useState('7d');

  return (
    <div className="space-y-6 p-6 bg-slate-50">
      {/* System Status Bar */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200">
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span className="ml-2 text-sm font-medium text-slate-700">System Status: Operational</span>
            </div>
            <div className="h-4 w-px bg-slate-200" />
            <div className="flex items-center">
              <Activity className="w-5 h-5 text-blue-500" />
              <span className="ml-2 text-sm font-medium text-slate-700">Response Time: 165ms</span>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="text-sm border-slate-200 rounded-md"
            >
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Calls"
          value={8591}
          trend={{ value: 12, isPositive: true }}
          className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200"
        />
        <MetricCard
          title="Success Rate"
          value={98.5}
          trend={{ value: 2.5, isPositive: true }}
          isPercentage={true}
          className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200"
        />
        <MetricCard
          title="Average Response Time"
          value={175}
          unit="ms"
          trend={{ value: 5, isPositive: true }}
          className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200"
        />
        <MetricCard
          title="Active Users"
          value={1247}
          trend={{ value: 8, isPositive: true }}
          className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200"
        />
      </div>

      {/* Advanced Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white shadow-sm rounded-lg p-6 border border-slate-200">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-slate-900">Call Performance</h3>
            <div className="flex items-center space-x-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Real-time
              </span>
            </div>
          </div>
          <div className="h-80">
            <ChartCard
              title=""
              type="line"
              data={systemMetrics}
              dataKey="calls"
              secondaryDataKey="success"
              color="#2E86AB"
              secondaryColor="#4CAF50"
              height={300}
              xAxisDataKey="name"
              legend={[
                { key: 'calls', label: 'Total Calls', color: '#2E86AB' },
                { key: 'success', label: 'Successful Calls', color: '#4CAF50' },
              ]}
            />
          </div>
        </div>

        <div className="bg-white shadow-sm rounded-lg p-6 border border-slate-200">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-slate-900">Response Time Analysis</h3>
            <div className="flex items-center space-x-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Trending
              </span>
            </div>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={systemMetrics}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="name" stroke="#6B7280" />
                <YAxis stroke="#6B7280" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #E5E7EB',
                    borderRadius: '0.5rem',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="response"
                  stroke="#2E86AB"
                  fill="#2E86AB"
                  fillOpacity={0.1}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Enterprise Features Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Geographic Distribution */}
        <div className="bg-white shadow-sm rounded-lg p-6 border border-slate-200">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-slate-900">Geographic Distribution</h3>
            <Map className="w-5 h-5 text-slate-400" />
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={geographicData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                >
                  {geographicData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {geographicData.map((item, index) => (
              <div key={item.name} className="flex items-center">
                <div
                  className="w-3 h-3 rounded-full mr-2"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span className="text-sm text-slate-600">{item.name}: {item.value}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions Panel */}
        <div className="bg-white shadow-sm rounded-lg p-6 border border-slate-200">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-slate-900">Quick Actions</h3>
            <Settings className="w-5 h-5 text-slate-400" />
          </div>
          <div className="space-y-3">
            <button className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors">
              <div className="flex items-center">
                <Users className="w-5 h-5 text-blue-500" />
                <span className="ml-3 text-slate-700">Manage Users</span>
              </div>
              <span className="text-slate-400">→</span>
            </button>
            <button className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors">
              <div className="flex items-center">
                <Activity className="w-5 h-5 text-green-500" />
                <span className="ml-3 text-slate-700">View Analytics</span>
              </div>
              <span className="text-slate-400">→</span>
            </button>
            <button className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors">
              <div className="flex items-center">
                <Shield className="w-5 h-5 text-purple-500" />
                <span className="ml-3 text-slate-700">Security Center</span>
              </div>
              <span className="text-slate-400">→</span>
            </button>
            <button className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors">
              <div className="flex items-center">
                <Bell className="w-5 h-5 text-orange-500" />
                <span className="ml-3 text-slate-700">Notifications</span>
              </div>
              <span className="text-slate-400">→</span>
            </button>
          </div>
        </div>

        {/* System Alerts & Activity */}
        <div className="bg-white shadow-sm rounded-lg p-6 border border-slate-200">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-slate-900">System Alerts</h3>
            <AlertCircle className="w-5 h-5 text-slate-400" />
          </div>
          <div className="space-y-4">
            {systemAlerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-4 rounded-lg ${
                  alert.type === 'success'
                    ? 'bg-green-50 border border-green-200'
                    : 'bg-blue-50 border border-blue-200'
                }`}
              >
                <div className="flex items-center">
                  {alert.type === 'success' ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <Bell className="w-5 h-5 text-blue-500" />
                  )}
                  <div className="ml-3">
                    <p className={`text-sm font-medium ${
                      alert.type === 'success' ? 'text-green-800' : 'text-blue-800'
                    }`}>
                      {alert.message}
                    </p>
                    <p className={`text-sm ${
                      alert.type === 'success' ? 'text-green-600' : 'text-blue-600'
                    }`}>
                      {alert.details}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-medium text-slate-900">Recent Activity</h4>
              <button className="text-sm text-blue-600 hover:text-blue-700">View all</button>
            </div>
            <div className="flow-root">
              <ul className="-mb-8">
                {recentActivity.slice(0, 3).map((activity, activityIdx) => (
                  <li key={activity.id}>
                    <div className="relative pb-8">
                      {activityIdx !== 2 && (
                        <span
                          className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-slate-200"
                          aria-hidden="true"
                        />
                      )}
                      <div className="relative flex space-x-3">
                        <div>
                          <span
                            className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${
                              activity.status === 'success'
                                ? 'bg-green-100'
                                : activity.status === 'warning'
                                ? 'bg-yellow-100'
                                : 'bg-red-100'
                            }`}
                          >
                            {activity.status === 'success' ? (
                              <CheckCircle className="w-5 h-5 text-green-600" />
                            ) : activity.status === 'warning' ? (
                              <AlertCircle className="w-5 h-5 text-yellow-600" />
                            ) : (
                              <AlertCircle className="w-5 h-5 text-red-600" />
                            )}
                          </span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm text-slate-500">
                            <span className="font-medium text-slate-900">{activity.event}</span>
                            <span className="ml-2">by {activity.user}</span>
                          </div>
                          <div className="mt-1 text-sm text-slate-500">
                            <p>{activity.details}</p>
                          </div>
                          <div className="mt-1 text-sm text-slate-400">
                            {activity.timestamp}
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard; 