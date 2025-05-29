import React from 'react';
import { ArrowUpIcon, ArrowDownIcon, ServerIcon, ShieldCheckIcon, ClockIcon } from '@heroicons/react/24/outline';

const AdminDashboard = () => {
  const systemMetrics = [
    { 
      name: 'System Load',
      value: '67%',
      trend: '+2.3%',
      isUp: true,
      details: 'Avg. over last hour'
    },
    {
      name: 'Response Time',
      value: '124ms',
      trend: '-12ms',
      isUp: false,
      details: 'Last 5 minutes'
    },
    {
      name: 'Active Users',
      value: '1,284',
      trend: '+34',
      isUp: true,
      details: 'Current sessions'
    },
    {
      name: 'Error Rate',
      value: '0.02%',
      trend: '-0.01%',
      isUp: false,
      details: 'Last hour'
    }
  ];

  const recentActivity = [
    {
      id: 1,
      event: 'System Backup Completed',
      time: '2 minutes ago',
      status: 'success'
    },
    {
      id: 2,
      event: 'Failed Login Attempt',
      time: '15 minutes ago',
      status: 'warning'
    },
    {
      id: 3,
      event: 'Database Optimization',
      time: '1 hour ago',
      status: 'success'
    }
  ];

  const securityAlerts = [
    {
      id: 1,
      alert: 'Unusual Login Pattern Detected',
      severity: 'high',
      time: '10 minutes ago'
    },
    {
      id: 2,
      alert: 'SSL Certificate Expiring Soon',
      severity: 'medium',
      time: '2 hours ago'
    }
  ];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-slate-600 bg-slate-50';
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header with System Status */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">System Overview</h1>
          <p className="mt-1 text-sm text-slate-600">Real-time monitoring and analytics</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex items-center px-3 py-2 bg-green-50 text-green-700 rounded-lg">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
            <span className="text-sm font-medium">All Systems Operational</span>
          </div>
          <button className="px-4 py-2 bg-[#375788] text-white rounded-lg hover:bg-[#2a4368] transition-colors">
            View Details
          </button>
        </div>
      </div>

      {/* System Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {systemMetrics.map((metric, idx) => (
          <div key={idx} className="bg-white border border-slate-200 rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-slate-600">{metric.name}</p>
                <p className="mt-2 text-2xl font-bold text-slate-800">{metric.value}</p>
              </div>
              <div className={`flex items-center ${metric.isUp ? 'text-green-600' : 'text-red-600'}`}>
                {metric.isUp ? <ArrowUpIcon className="h-5 w-5" /> : <ArrowDownIcon className="h-5 w-5" />}
                <span className="ml-1 text-sm font-medium">{metric.trend}</span>
              </div>
            </div>
            <p className="mt-2 text-sm text-slate-500">{metric.details}</p>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Recent System Activity</h2>
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`w-2 h-2 rounded-full ${
                      activity.status === 'success' ? 'bg-green-500' : 'bg-yellow-500'
                    } mr-3`}></div>
                    <div>
                      <p className="text-sm font-medium text-slate-800">{activity.event}</p>
                      <p className="text-xs text-slate-500">{activity.time}</p>
                    </div>
                  </div>
                  <button className="text-sm text-[#375788] hover:text-[#2a4368]">View</button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Security Alerts */}
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Security Alerts</h2>
            <div className="space-y-4">
              {securityAlerts.map((alert) => (
                <div key={alert.id} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <ShieldCheckIcon className={`h-5 w-5 mr-3 ${
                      alert.severity === 'high' ? 'text-red-500' : 'text-yellow-500'
                    }`} />
                    <div>
                      <p className="text-sm font-medium text-slate-800">{alert.alert}</p>
                      <div className="flex items-center mt-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${getSeverityColor(alert.severity)}`}>
                          {alert.severity.toUpperCase()}
                        </span>
                        <span className="text-xs text-slate-500 ml-2">{alert.time}</span>
                      </div>
                    </div>
                  </div>
                  <button className="text-sm text-[#375788] hover:text-[#2a4368]">
                    Investigate
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Performance Monitoring */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold text-slate-800">Performance Monitoring</h2>
          <select className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#375788]">
            <option>Last 24 Hours</option>
            <option>Last 7 Days</option>
            <option>Last 30 Days</option>
          </select>
        </div>
        <div className="h-64 flex items-center justify-center border-2 border-dashed border-slate-200 rounded-lg">
          <p className="text-slate-500">Performance Graph Placeholder</p>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard; 