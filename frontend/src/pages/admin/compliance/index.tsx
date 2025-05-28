import React, { useState } from 'react';
import { format } from 'date-fns';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell
} from 'recharts';
import {
  Shield, AlertTriangle, FileText, Clock, Users, Search,
  Download, RefreshCw, Filter, Lock, AlertCircle, CheckCircle,
  Bell, Database, FileCheck, UserCheck, Settings, Eye
} from 'lucide-react';

// Enhanced mock data for demonstration
const complianceScores = [
  { date: '2024-01', score: 98, risk: 12, audits: 45 },
  { date: '2024-02', score: 97, risk: 15, audits: 42 },
  { date: '2024-03', score: 99, risk: 8, audits: 50 },
  { date: '2024-04', score: 98, risk: 10, audits: 48 },
  { date: '2024-05', score: 100, risk: 5, audits: 55 },
  { date: '2024-06', score: 99, risk: 7, audits: 52 },
];

const riskDistribution = [
  { name: 'Critical', value: 2, color: '#EF4444' },
  { name: 'High', value: 5, color: '#F59E0B' },
  { name: 'Medium', value: 8, color: '#2E86AB' },
  { name: 'Low', value: 15, color: '#10B981' },
];

const auditActivity = [
  { hour: '00:00', phi: 12, auth: 25, system: 8 },
  { hour: '04:00', phi: 8, auth: 15, system: 5 },
  { hour: '08:00', phi: 45, auth: 60, system: 20 },
  { hour: '12:00', phi: 50, auth: 75, system: 25 },
  { hour: '16:00', phi: 35, auth: 50, system: 18 },
  { hour: '20:00', phi: 20, auth: 30, system: 12 },
];

const auditLogs = [
  {
    id: 1,
    event: 'PHI Access',
    user: 'Dr. Sarah Johnson',
    timestamp: new Date(2024, 1, 20, 14, 30),
    status: 'Authorized',
    details: 'Accessed patient records #12345',
    type: 'phi',
    severity: 'normal',
  },
  {
    id: 2,
    event: 'Security Alert',
    user: 'System',
    timestamp: new Date(2024, 1, 20, 14, 15),
    status: 'Alert',
    details: 'Multiple failed login attempts detected',
    type: 'security',
    severity: 'high',
  },
  {
    id: 3,
    event: 'Policy Update',
    user: 'Admin',
    timestamp: new Date(2024, 1, 20, 13, 45),
    status: 'Completed',
    details: 'Updated data retention policy',
    type: 'policy',
    severity: 'normal',
  },
  {
    id: 4,
    event: 'Unauthorized Access',
    user: 'Unknown',
    timestamp: new Date(2024, 1, 20, 13, 30),
    status: 'Blocked',
    details: 'Attempted access from unauthorized IP',
    type: 'security',
    severity: 'critical',
  },
];

const CompliancePage = () => {
  const [timeRange, setTimeRange] = useState('7d');
  const [filterType, setFilterType] = useState('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  return (
    <div className="space-y-6 p-6 bg-slate-50">
      {/* Header Section */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">HIPAA Compliance Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">Real-time compliance monitoring and audit tracking</p>
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

      {/* Compliance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-50 rounded-lg">
              <Shield className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600">Overall Compliance</p>
              <div className="flex items-baseline gap-2">
                <h3 className="text-2xl font-bold text-slate-900">98.5%</h3>
                <span className="text-sm text-green-600">↑ 0.5%</span>
              </div>
            </div>
          </div>
          <div className="mt-4 h-2 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full" style={{ width: '98.5%' }} />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-50 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600">Active Alerts</p>
              <div className="flex items-baseline gap-2">
                <h3 className="text-2xl font-bold text-slate-900">3</h3>
                <span className="text-sm text-red-600">Critical: 1</span>
              </div>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <span className="px-2.5 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">Critical: 1</span>
            <span className="px-2.5 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">High: 2</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-50 rounded-lg">
              <FileCheck className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600">Audits Completed</p>
              <div className="flex items-baseline gap-2">
                <h3 className="text-2xl font-bold text-slate-900">52</h3>
                <span className="text-sm text-green-600">↑ 8%</span>
              </div>
            </div>
          </div>
          <div className="mt-4 h-2 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-green-500 rounded-full" style={{ width: '85%' }} />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-50 rounded-lg">
              <Clock className="w-6 h-6 text-purple-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600">Next Audit Due</p>
              <div className="flex items-baseline gap-2">
                <h3 className="text-2xl font-bold text-slate-900">5 Days</h3>
                <span className="text-sm text-purple-600">Q1 Review</span>
              </div>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <span className="px-2.5 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-full">Scheduled</span>
          </div>
        </div>
      </div>

      {/* Compliance Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white shadow-sm rounded-lg border border-slate-200">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-slate-900">Compliance Score Trend</h3>
              <div className="flex items-center space-x-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Historical
                </span>
              </div>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={complianceScores}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="date" stroke="#6B7280" />
                  <YAxis stroke="#6B7280" domain={[90, 100]} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #E5E7EB',
                      borderRadius: '0.5rem',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="score"
                    stroke="#2E86AB"
                    fill="#2E86AB"
                    fillOpacity={0.2}
                    name="Compliance Score"
                  />
                  <Area
                    type="monotone"
                    dataKey="risk"
                    stroke="#EF4444"
                    fill="#EF4444"
                    fillOpacity={0.1}
                    name="Risk Score"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="bg-white shadow-sm rounded-lg border border-slate-200">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-slate-900">Audit Activity</h3>
              <div className="flex items-center space-x-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Real-time
                </span>
              </div>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={auditActivity}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="hour" stroke="#6B7280" />
                  <YAxis stroke="#6B7280" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #E5E7EB',
                      borderRadius: '0.5rem',
                    }}
                  />
                  <Bar dataKey="phi" name="PHI Access" fill="#2E86AB" />
                  <Bar dataKey="auth" name="Auth Events" fill="#10B981" />
                  <Bar dataKey="system" name="System Events" fill="#6366F1" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Risk Assessment & Audit Log */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white shadow-sm rounded-lg border border-slate-200">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-slate-900">Risk Distribution</h3>
              <AlertCircle className="w-5 h-5 text-slate-400" />
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={riskDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {riskDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
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
              {riskDistribution.map((item) => (
                <div key={item.name} className="flex items-center">
                  <div
                    className="w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm text-slate-600">{item.name}: {item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 bg-white shadow-sm rounded-lg border border-slate-200">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Audit Log</h3>
                <p className="text-sm text-slate-500 mt-1">Real-time activity monitoring</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search logs..."
                    className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                </div>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Events</option>
                  <option value="phi">PHI Access</option>
                  <option value="security">Security</option>
                  <option value="policy">Policy</option>
                </select>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Event</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Time</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {log.type === 'phi' && <Eye className="w-4 h-4 text-blue-500 mr-2" />}
                          {log.type === 'security' && <Shield className="w-4 h-4 text-red-500 mr-2" />}
                          {log.type === 'policy' && <FileText className="w-4 h-4 text-green-500 mr-2" />}
                          <span className="text-sm font-medium text-slate-900">{log.event}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-slate-600">{log.user}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-slate-600">{format(log.timestamp, 'MMM d, HH:mm')}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            log.status === 'Alert' || log.status === 'Blocked'
                              ? 'bg-red-100 text-red-800'
                              : log.status === 'Authorized'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {log.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-slate-600">{log.details}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Required Actions */}
      <div className="bg-white shadow-sm rounded-lg border border-slate-200">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-slate-900">Required Actions</h3>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
              2 Pending
            </span>
          </div>
          <div className="space-y-4">
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start">
                <AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5" />
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-yellow-900">Security Training Update Required</h4>
                  <p className="mt-1 text-sm text-yellow-700">5 staff members need to complete their annual security training.</p>
                  <div className="mt-3 flex items-center gap-3">
                    <button className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-full bg-yellow-200 text-yellow-800 hover:bg-yellow-300">
                      Send Reminder
                    </button>
                    <button className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-full bg-white text-yellow-800 border border-yellow-300 hover:bg-yellow-50">
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start">
                <FileText className="w-5 h-5 text-blue-500 mt-0.5" />
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-blue-900">Quarterly Compliance Review</h4>
                  <p className="mt-1 text-sm text-blue-700">Schedule the Q1 2024 compliance review meeting.</p>
                  <div className="mt-3 flex items-center gap-3">
                    <button className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-full bg-blue-200 text-blue-800 hover:bg-blue-300">
                      Schedule Review
                    </button>
                    <button className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-full bg-white text-blue-800 border border-blue-300 hover:bg-blue-50">
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompliancePage; 