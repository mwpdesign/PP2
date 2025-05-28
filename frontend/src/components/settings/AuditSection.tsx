import React, { useState } from 'react';
import { FileText, Filter, Download, Search } from 'lucide-react';

interface AuditLog {
  id: string;
  timestamp: string;
  action: string;
  user: string;
  details: string;
  category: 'order' | 'patient' | 'security' | 'system';
  status: 'success' | 'warning' | 'error';
}

const AuditSection: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [dateRange, setDateRange] = useState({
    start: '',
    end: ''
  });

  // Mock audit logs - in production, this would come from an API
  const [auditLogs] = useState<AuditLog[]>([
    {
      id: '1',
      timestamp: '2024-02-20T10:30:00Z',
      action: 'Patient Record Access',
      user: 'Dr. John Doe',
      details: 'Viewed patient medical history',
      category: 'patient',
      status: 'success'
    },
    {
      id: '2',
      timestamp: '2024-02-20T11:15:00Z',
      action: 'New Order Created',
      user: 'Dr. John Doe',
      details: 'Created order for medical supplies',
      category: 'order',
      status: 'success'
    },
    {
      id: '3',
      timestamp: '2024-02-20T14:20:00Z',
      action: 'Failed Login Attempt',
      user: 'Unknown',
      details: 'Invalid credentials provided',
      category: 'security',
      status: 'error'
    },
    {
      id: '4',
      timestamp: '2024-02-20T15:45:00Z',
      action: 'System Backup',
      user: 'System',
      details: 'Automated daily backup completed',
      category: 'system',
      status: 'success'
    }
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  const handleExport = () => {
    // TODO: Implement export functionality
    console.log('Exporting audit logs...');
  };

  const filteredLogs = auditLogs.filter(log => {
    if (selectedCategory !== 'all' && log.category !== selectedCategory) return false;
    if (searchQuery && !log.details.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <FileText className="w-5 h-5 text-slate-600" />
          <h2 className="text-xl font-semibold text-slate-800">Audit & Compliance</h2>
        </div>
        <button
          onClick={handleExport}
          className="px-4 py-2 text-sm bg-slate-600 text-white rounded-md hover:bg-slate-700 flex items-center"
        >
          <Download className="w-4 h-4 mr-2" />
          Export Logs
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search audit logs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-full rounded-md border-slate-300 shadow-sm focus:border-slate-500 focus:ring-slate-500"
              />
            </div>
          </div>
          <div className="flex space-x-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Start Date</label>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-slate-500 focus:ring-slate-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">End Date</label>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-slate-500 focus:ring-slate-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-slate-500 focus:ring-slate-500"
            >
              <option value="all">All Categories</option>
              <option value="order">Orders</option>
              <option value="patient">Patients</option>
              <option value="security">Security</option>
              <option value="system">System</option>
            </select>
          </div>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Timestamp
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Action
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  User
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Details
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                    {log.action}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    {log.user}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">
                    {log.details}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(log.status)}`}>
                      {log.status.charAt(0).toUpperCase() + log.status.slice(1)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Compliance Notice */}
      <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
        <div className="flex">
          <div className="ml-3">
            <p className="text-sm text-blue-700">
              All actions are logged and retained for HIPAA compliance. Logs are encrypted and stored securely.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuditSection; 