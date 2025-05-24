import React, { useState } from 'react';

interface ReportMetrics {
  category: string;
  metrics: {
    label: string;
    value: string;
    change: string;
    trend: 'up' | 'down' | 'neutral';
  }[];
}

const ReportsPage: React.FC = () => {
  const [selectedReport, setSelectedReport] = useState<string>('');
  const [dateRange, setDateRange] = useState<string>('');

  const metrics: ReportMetrics[] = [
    {
      category: 'Patient Metrics',
      metrics: [
        { label: 'Total Patients', value: '2,456', change: '+124', trend: 'up' },
        { label: 'New Patients', value: '156', change: '+23', trend: 'up' },
        { label: 'Active Cases', value: '892', change: '-12', trend: 'down' },
        { label: 'Avg. Visit Duration', value: '24m', change: '-2m', trend: 'down' }
      ]
    },
    {
      category: 'IVR Performance',
      metrics: [
        { label: 'Call Volume', value: '1,234', change: '+89', trend: 'up' },
        { label: 'Avg. Wait Time', value: '2.3m', change: '-0.5m', trend: 'down' },
        { label: 'Resolution Rate', value: '94%', change: '+2%', trend: 'up' },
        { label: 'Patient Satisfaction', value: '4.8/5', change: '+0.2', trend: 'up' }
      ]
    },
    {
      category: 'Order Analytics',
      metrics: [
        { label: 'Total Orders', value: '$45.2k', change: '+$5.2k', trend: 'up' },
        { label: 'Avg. Order Value', value: '$289', change: '+$24', trend: 'up' },
        { label: 'Fulfillment Rate', value: '98%', change: '+1%', trend: 'up' },
        { label: 'Processing Time', value: '1.2d', change: '-0.3d', trend: 'down' }
      ]
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Analytics & Reports</h1>
            <p className="text-gray-600 mt-1">Monitor performance and compliance metrics</p>
          </div>
          <div className="flex gap-3">
            <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
              Export PDF
            </button>
            <button className="px-4 py-2 bg-[#2E86AB] text-white rounded-lg hover:bg-[#247297] transition-colors">
              Generate Report
            </button>
          </div>
        </div>

        {/* Report Controls */}
        <div className="mt-6 flex gap-4">
          <select
            value={selectedReport}
            onChange={(e) => setSelectedReport(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2E86AB] bg-white"
          >
            <option value="">All Reports</option>
            <option value="patient">Patient Analytics</option>
            <option value="ivr">IVR Performance</option>
            <option value="orders">Order Analytics</option>
            <option value="compliance">Compliance Reports</option>
          </select>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2E86AB] bg-white"
          >
            <option value="">Date Range</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="year">This Year</option>
          </select>
        </div>
      </div>

      {/* Metrics Grid */}
      {metrics.map((section) => (
        <div key={section.category} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">{section.category}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {section.metrics.map((metric, index) => (
              <div key={index} className="p-4 border border-gray-200 rounded-lg">
                <div className="text-sm text-gray-600">{metric.label}</div>
                <div className="flex items-center justify-between mt-2">
                  <div className="text-2xl font-bold text-gray-800">{metric.value}</div>
                  <div className={`flex items-center text-sm ${
                    metric.trend === 'up' ? 'text-green-600' :
                    metric.trend === 'down' ? 'text-red-600' :
                    'text-gray-600'
                  }`}>
                    {metric.change}
                    <span className="ml-1">
                      {metric.trend === 'up' ? '↑' : metric.trend === 'down' ? '↓' : '→'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Compliance Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-800 mb-4">Compliance Overview</h2>
        <div className="space-y-4">
          {[
            { label: 'HIPAA Compliance', value: '98%', status: 'Compliant', details: 'Last audit: 2024-03-15' },
            { label: 'Data Encryption', value: '100%', status: 'Secure', details: 'AES-256 encryption' },
            { label: 'Access Control', value: '96%', status: 'Monitored', details: '24/7 monitoring active' },
            { label: 'Audit Logs', value: '100%', status: 'Complete', details: 'All actions logged' }
          ].map((item, index) => (
            <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div>
                <div className="font-medium text-gray-800">{item.label}</div>
                <div className="text-sm text-gray-500">{item.details}</div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-2xl font-bold text-[#2E86AB]">{item.value}</div>
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                  {item.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-800 mb-4">Recent Activity</h2>
        <div className="space-y-2">
          {[
            { action: 'Report Generated', user: 'Dr. Smith', time: '5 minutes ago', type: 'Patient Analytics' },
            { action: 'Compliance Check', user: 'System', time: '1 hour ago', type: 'HIPAA Audit' },
            { action: 'Data Export', user: 'Admin User', time: '2 hours ago', type: 'Monthly Report' },
            { action: 'Alert Triggered', user: 'System', time: '3 hours ago', type: 'Performance Monitor' }
          ].map((activity, index) => (
            <div key={index} className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg">
              <div>
                <div className="font-medium text-gray-800">{activity.action}</div>
                <div className="text-sm text-gray-500">by {activity.user}</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-[#2E86AB]">{activity.type}</div>
                <div className="text-sm text-gray-500">{activity.time}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ReportsPage; 