import React, { useState } from 'react';
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
import {
  Activity, Users, Phone, Server, Shield, Clock, AlertTriangle,
  TrendingUp, Database, Cpu, Download, RefreshCw
} from 'lucide-react';

// Enhanced mock data for demonstration
const activityData = [
  { name: 'Mon', users: 120, requests: 240, success: 235, failed: 5 },
  { name: 'Tue', users: 150, requests: 280, success: 272, failed: 8 },
  { name: 'Wed', users: 180, requests: 320, success: 310, failed: 10 },
  { name: 'Thu', users: 190, requests: 340, success: 332, failed: 8 },
  { name: 'Fri', users: 210, requests: 380, success: 370, failed: 10 },
  { name: 'Sat', users: 220, requests: 400, success: 388, failed: 12 },
  { name: 'Sun', users: 250, requests: 450, success: 438, failed: 12 },
];

const performanceData = [
  { name: '00:00', cpu: 45, memory: 60, network: 30 },
  { name: '04:00', cpu: 55, memory: 65, network: 35 },
  { name: '08:00', cpu: 75, memory: 80, network: 60 },
  { name: '12:00', cpu: 85, memory: 85, network: 70 },
  { name: '16:00', cpu: 80, memory: 82, network: 65 },
  { name: '20:00', cpu: 70, memory: 75, network: 55 },
  { name: '23:59', cpu: 50, memory: 70, network: 40 },
];

const responseTimeData = [
  { name: '00:00', p50: 120, p90: 180, p99: 250 },
  { name: '04:00', p50: 125, p90: 185, p99: 260 },
  { name: '08:00', p50: 150, p90: 220, p99: 300 },
  { name: '12:00', p50: 160, p90: 240, p99: 320 },
  { name: '16:00', p50: 155, p90: 230, p99: 310 },
  { name: '20:00', p50: 140, p90: 200, p99: 280 },
  { name: '23:59', p50: 130, p90: 190, p99: 270 },
];

const errorDistribution = [
  { name: 'Authentication', value: 35 },
  { name: 'Network', value: 25 },
  { name: 'Database', value: 20 },
  { name: 'Validation', value: 15 },
  { name: 'Other', value: 5 },
];

const COLORS = ['#2E86AB', '#4CAF50', '#F59E0B', '#EF4444', '#8B5CF6'];

const SystemAnalytics = () => {
  const [timeRange, setTimeRange] = useState('7d');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    // Simulate data refresh
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  return (
    <div className="space-y-6 p-6 bg-slate-50">
      {/* Header Section */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">System Analytics</h1>
          <p className="text-sm text-slate-500 mt-1">Real-time system performance and metrics</p>
        </div>
        <div className="flex items-center gap-4">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>
          <button
            onClick={handleRefresh}
            className="p-2 text-slate-600 hover:text-slate-900 transition-colors"
            disabled={isRefreshing}
          >
            <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
          <button className="px-4 py-2 bg-[#2E86AB] text-white rounded-lg hover:bg-[#247297] transition-colors flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export Report
          </button>
        </div>
      </div>

      {/* System Status Overview */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200">
        <div className="p-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">System Status Overview</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 p-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Server className="w-5 h-5 text-blue-500" />
              <span className="text-sm font-medium text-slate-600">System Health</span>
            </div>
            <div className="flex items-end gap-2">
              <span className="text-2xl font-bold text-slate-900">99.9%</span>
              <span className="text-sm text-green-600">↑ 0.1%</span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full" style={{ width: '99.9%' }} />
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-green-500" />
              <span className="text-sm font-medium text-slate-600">Response Time</span>
            </div>
            <div className="flex items-end gap-2">
              <span className="text-2xl font-bold text-slate-900">165ms</span>
              <span className="text-sm text-green-600">↓ 15ms</span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-green-500 rounded-full" style={{ width: '85%' }} />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Cpu className="w-5 h-5 text-purple-500" />
              <span className="text-sm font-medium text-slate-600">CPU Usage</span>
            </div>
            <div className="flex items-end gap-2">
              <span className="text-2xl font-bold text-slate-900">45%</span>
              <span className="text-sm text-yellow-600">↑ 5%</span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-purple-500 rounded-full" style={{ width: '45%' }} />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-orange-500" />
              <span className="text-sm font-medium text-slate-600">Memory Usage</span>
            </div>
            <div className="flex items-end gap-2">
              <span className="text-2xl font-bold text-slate-900">68%</span>
              <span className="text-sm text-yellow-600">↑ 3%</span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-orange-500 rounded-full" style={{ width: '68%' }} />
            </div>
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white shadow-sm rounded-lg border border-slate-200">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-slate-900">System Performance</h3>
              <div className="flex items-center space-x-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Real-time
                </span>
              </div>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={performanceData}>
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
                    dataKey="cpu"
                    stackId="1"
                    stroke="#2E86AB"
                    fill="#2E86AB"
                    fillOpacity={0.2}
                    name="CPU Usage"
                  />
                  <Area
                    type="monotone"
                    dataKey="memory"
                    stackId="2"
                    stroke="#4CAF50"
                    fill="#4CAF50"
                    fillOpacity={0.2}
                    name="Memory Usage"
                  />
                  <Area
                    type="monotone"
                    dataKey="network"
                    stackId="3"
                    stroke="#F59E0B"
                    fill="#F59E0B"
                    fillOpacity={0.2}
                    name="Network Usage"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="bg-white shadow-sm rounded-lg border border-slate-200">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-slate-900">Response Time Analysis</h3>
              <div className="flex items-center space-x-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Monitoring
                </span>
              </div>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={responseTimeData}>
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
                  <Line
                    type="monotone"
                    dataKey="p50"
                    stroke="#2E86AB"
                    strokeWidth={2}
                    name="P50 Response"
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="p90"
                    stroke="#F59E0B"
                    strokeWidth={2}
                    name="P90 Response"
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="p99"
                    stroke="#EF4444"
                    strokeWidth={2}
                    name="P99 Response"
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Activity */}
        <div className="bg-white shadow-sm rounded-lg border border-slate-200">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-slate-900">User Activity</h3>
              <Users className="w-5 h-5 text-slate-400" />
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={activityData}>
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
                  <Bar dataKey="users" fill="#2E86AB" name="Active Users" />
                  <Bar dataKey="requests" fill="#4CAF50" name="Total Requests" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Error Distribution */}
        <div className="bg-white shadow-sm rounded-lg border border-slate-200">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-slate-900">Error Distribution</h3>
              <AlertTriangle className="w-5 h-5 text-slate-400" />
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={errorDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {errorDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #E5E7EB',
                      borderRadius: '0.5rem',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {errorDistribution.map((item, index) => (
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
        </div>

        {/* System Health Indicators */}
        <div className="bg-white shadow-sm rounded-lg border border-slate-200">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-slate-900">System Health</h3>
              <Activity className="w-5 h-5 text-slate-400" />
            </div>
            <div className="space-y-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Server className="w-5 h-5 text-green-500 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-green-900">API Services</p>
                      <p className="text-sm text-green-600">All systems operational</p>
                    </div>
                  </div>
                  <span className="text-green-500">●</span>
                </div>
              </div>

              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Database className="w-5 h-5 text-green-500 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-green-900">Database</p>
                      <p className="text-sm text-green-600">Connected and healthy</p>
                    </div>
                  </div>
                  <span className="text-green-500">●</span>
                </div>
              </div>

              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Clock className="w-5 h-5 text-yellow-500 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-yellow-900">Background Jobs</p>
                      <p className="text-sm text-yellow-600">Processing with delays</p>
                    </div>
                  </div>
                  <span className="text-yellow-500">●</span>
                </div>
              </div>

              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Shield className="w-5 h-5 text-green-500 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-green-900">Security</p>
                      <p className="text-sm text-green-600">No threats detected</p>
                    </div>
                  </div>
                  <span className="text-green-500">●</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemAnalytics; 