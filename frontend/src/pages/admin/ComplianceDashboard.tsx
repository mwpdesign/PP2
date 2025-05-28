import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Shield, AlertTriangle, Search, Download } from 'lucide-react';
import { complianceService } from '@/services/complianceService';
import { formatDate } from '@/utils/format';

interface ComplianceAlert {
  id: string;
  type: 'warning' | 'violation';
  description: string;
  timestamp: string;
  status: 'open' | 'resolved';
  severity: 'low' | 'medium' | 'high';
}

interface AuditLog {
  id: string;
  user: string;
  action: string;
  resource: string;
  timestamp: string;
  details: string;
  status: 'success' | 'failure';
}

const ComplianceDashboard: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'open' | 'resolved'>('all');

  const { data: alerts, isLoading: alertsLoading } = useQuery({
    queryKey: ['compliance-alerts'],
    queryFn: complianceService.getComplianceAlerts
  });

  const { data: auditLogs, isLoading: logsLoading } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: complianceService.getAuditLogs
  });

  const filteredAlerts = alerts?.filter(alert => {
    const matchesSearch = alert.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || alert.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleExportLogs = async () => {
    try {
      await complianceService.exportAuditLogs();
    } catch (error) {
      console.error('Failed to export audit logs:', error);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Compliance Dashboard</h1>
        <button
          onClick={handleExportLogs}
          className="bg-slate-600 hover:bg-slate-700 text-white px-4 py-2 rounded-lg flex items-center"
        >
          <Download className="w-5 h-5 mr-2" />
          Export Logs
        </button>
      </div>

      {/* Compliance Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-lg bg-green-500 text-white">
              <Shield className="w-6 h-6" />
            </div>
            <span className="text-sm font-medium text-green-600">Active</span>
          </div>
          <h3 className="text-lg font-medium text-gray-800">HIPAA Compliance</h3>
          <p className="text-sm text-gray-600 mt-2">All systems compliant with HIPAA regulations</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-lg bg-yellow-500 text-white">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <span className="text-sm font-medium text-yellow-600">
              {alerts?.filter(a => a.status === 'open').length || 0} Open
            </span>
          </div>
          <h3 className="text-lg font-medium text-gray-800">Active Alerts</h3>
          <p className="text-sm text-gray-600 mt-2">Current compliance alerts requiring attention</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-lg bg-blue-500 text-white">
              <Shield className="w-6 h-6" />
            </div>
            <span className="text-sm font-medium text-blue-600">
              {auditLogs?.length || 0} Entries
            </span>
          </div>
          <h3 className="text-lg font-medium text-gray-800">Audit Log Status</h3>
          <p className="text-sm text-gray-600 mt-2">System activity audit trail</p>
        </div>
      </div>

      {/* Compliance Alerts */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Compliance Alerts</h2>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search alerts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-600"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as 'all' | 'open' | 'resolved')}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-600"
            >
              <option value="all">All Status</option>
              <option value="open">Open</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Severity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {alertsLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center">Loading...</td>
                </tr>
              ) : filteredAlerts?.map((alert) => (
                <tr key={alert.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      alert.type === 'violation' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {alert.type}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{alert.description}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      alert.severity === 'high' ? 'bg-red-100 text-red-800' :
                      alert.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {alert.severity}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      alert.status === 'open' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {alert.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(alert.timestamp)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Audit Logs */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Audit Logs</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Resource</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {logsLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center">Loading...</td>
                </tr>
              ) : auditLogs?.map((log) => (
                <tr key={log.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{log.user}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{log.action}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{log.resource}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      log.status === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {log.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(log.timestamp)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-500">{log.details}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ComplianceDashboard; 