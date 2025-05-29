import React, { useState } from 'react';
import { MagnifyingGlassIcon, AdjustmentsHorizontalIcon, DocumentArrowDownIcon } from '@heroicons/react/24/outline';

const AuditLogs: React.FC = () => {
  const [selectedSeverity, setSelectedSeverity] = useState('all');

  const mockLogs = [
    {
      id: 'LOG-001',
      timestamp: '2024-03-20 10:30:15 AM',
      action: 'Patient Record Access',
      user: 'Dr. Sarah Johnson',
      details: 'Accessed patient record #12345',
      severity: 'info',
      category: 'Data Access'
    },
    {
      id: 'LOG-002',
      timestamp: '2024-03-20 10:15:22 AM',
      action: 'Failed Login Attempt',
      user: 'Unknown',
      details: 'Multiple failed login attempts from IP 192.168.1.100',
      severity: 'warning',
      category: 'Security'
    },
    {
      id: 'LOG-003',
      timestamp: '2024-03-20 10:00:05 AM',
      action: 'System Configuration Change',
      user: 'Admin Smith',
      details: 'Modified security settings',
      severity: 'critical',
      category: 'System'
    }
  ];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'info': return 'text-blue-600 bg-blue-50';
      case 'warning': return 'text-yellow-600 bg-yellow-50';
      case 'critical': return 'text-red-600 bg-red-50';
      default: return 'text-slate-600 bg-slate-50';
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center space-y-4 md:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Audit Logs</h1>
          <p className="mt-1 text-sm text-slate-600">System activity and security audit trail</p>
        </div>
        <button className="flex items-center justify-center px-4 py-2 bg-[#375788] text-white rounded-lg hover:bg-[#2a4368] w-full md:w-auto">
          <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
          Export Logs
        </button>
      </div>

      <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="Search audit logs..."
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#375788] focus:border-[#375788]"
          />
          <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
        </div>
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
          <select
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value)}
            className="w-full sm:w-auto border border-slate-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#375788] focus:border-[#375788]"
          >
            <option value="all">All Severities</option>
            <option value="info">Info</option>
            <option value="warning">Warning</option>
            <option value="critical">Critical</option>
          </select>
          <button className="flex items-center justify-center px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 w-full sm:w-auto">
            <AdjustmentsHorizontalIcon className="h-5 w-5 mr-2" />
            Filters
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Timestamp</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Action</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider hidden md:table-cell">User</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider hidden lg:table-cell">Details</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Severity</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider hidden md:table-cell">Category</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {mockLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-slate-900">{log.timestamp}</div>
                    <div className="text-xs text-slate-500">{log.id}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-slate-900">{log.action}</div>
                    <div className="md:hidden text-xs text-slate-500">
                      {log.user} • {log.category}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 hidden md:table-cell">{log.user}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 hidden lg:table-cell">{log.details}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getSeverityColor(log.severity)}`}>
                      {log.severity.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 hidden md:table-cell">{log.category}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button className="text-[#375788] hover:text-[#2a4368]">View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
        <div className="text-sm text-slate-600 w-full sm:w-auto text-center sm:text-left">
          Showing 3 of 3 logs
        </div>
        <div className="flex items-center space-x-2">
          <button className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50">Previous</button>
          <button className="px-4 py-2 bg-[#375788] text-white rounded-lg hover:bg-[#2a4368]">Next</button>
        </div>
      </div>
    </div>
  );
};

export default AuditLogs; 