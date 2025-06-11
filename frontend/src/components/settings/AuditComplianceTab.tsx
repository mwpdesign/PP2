/**
 * Audit & Compliance Tab Component
 * Phase 2: Foundation Systems - Task ID: mbrgdnzkoihwtfftils
 *
 * Displays audit logs, compliance metrics, and export functionality
 * for HIPAA compliance monitoring.
 */

import React, { useState, useEffect } from 'react';
import {
  ShieldCheckIcon,
  DocumentArrowDownIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  UserIcon,
  EyeIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

interface AuditLog {
  id: string;
  user_id: string;
  action_type: string;
  resource_type: string;
  patient_id?: string;
  ip_address: string;
  success: boolean;
  created_at: string;
  metadata: Record<string, any>;
}

interface AuditStatistics {
  total_events: number;
  phi_access_events: number;
  failed_events: number;
  unique_users: number;
  security_events: number;
  period: {
    start_date: string;
    end_date: string;
    days: number;
  };
}

interface ComplianceReport {
  report_id: string;
  generated_at: string;
  compliance_status: string;
  summary: {
    total_events: number;
    phi_access_events: number;
    failed_events: number;
    security_events: number;
    unique_users: number;
    failure_rate: number;
  };
  recommendations: string[];
}

const AuditComplianceTab: React.FC = () => {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [statistics, setStatistics] = useState<AuditStatistics | null>(null);
  const [complianceReport, setComplianceReport] = useState<ComplianceReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDateRange, setSelectedDateRange] = useState(30);
  const [filters, setFilters] = useState({
    action_type: '',
    resource_type: '',
    success: ''
  });

  useEffect(() => {
    loadAuditData();
  }, [selectedDateRange, filters]);

  const loadAuditData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load audit statistics
      const statsResponse = await fetch(`/api/v1/audit/statistics?days=${selectedDateRange}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        }
      });

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStatistics(statsData);
      }

      // Load recent audit logs
      const logsParams = new URLSearchParams({
        limit: '50',
        offset: '0',
        ...(filters.action_type && { action_type: filters.action_type }),
        ...(filters.resource_type && { resource_type: filters.resource_type }),
        ...(filters.success && { success: filters.success })
      });

      const logsResponse = await fetch(`/api/v1/audit/logs?${logsParams}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        }
      });

      if (logsResponse.ok) {
        const logsData = await logsResponse.json();
        setAuditLogs(logsData.audit_logs);
      }

      // Generate compliance report
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - selectedDateRange);

      const reportResponse = await fetch(
        `/api/v1/audit/compliance-report?start_date=${startDate.toISOString()}&end_date=${endDate.toISOString()}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (reportResponse.ok) {
        const reportData = await reportResponse.json();
        setComplianceReport(reportData);
      }

    } catch (err) {
      setError('Failed to load audit data');
      console.error('Error loading audit data:', err);
    } finally {
      setLoading(false);
    }
  };

  const exportAuditLogs = async (format: 'CSV' | 'JSON') => {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - selectedDateRange);

      const response = await fetch('/api/v1/audit/export', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          export_type: format,
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          filters: filters
        })
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `audit_logs_${new Date().toISOString().split('T')[0]}.${format.toLowerCase()}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        throw new Error('Export failed');
      }
    } catch (err) {
      setError('Failed to export audit logs');
      console.error('Export error:', err);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getActionTypeIcon = (actionType: string) => {
    switch (actionType) {
      case 'phi_access':
        return <EyeIcon className="h-4 w-4 text-blue-500" />;
      case 'login_success':
        return <CheckCircleIcon className="h-4 w-4 text-green-500" />;
      case 'login_failed':
        return <ExclamationTriangleIcon className="h-4 w-4 text-red-500" />;
      default:
        return <ClockIcon className="h-4 w-4 text-gray-500" />;
    }
  };

  const getComplianceStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLIANT':
        return 'text-green-600 bg-green-100';
      case 'NON_COMPLIANT':
        return 'text-red-600 bg-red-100';
      case 'REVIEW_REQUIRED':
        return 'text-yellow-600 bg-yellow-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading audit data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <ShieldCheckIcon className="h-8 w-8 text-blue-600" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Audit & Compliance</h2>
            <p className="text-gray-600">HIPAA-compliant audit logging and compliance monitoring</p>
          </div>
        </div>

        <div className="flex space-x-2">
          <button
            onClick={() => exportAuditLogs('CSV')}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
            Export CSV
          </button>
          <button
            onClick={() => exportAuditLogs('JSON')}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
            Export JSON
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ChartBarIcon className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Events</dt>
                    <dd className="text-lg font-medium text-gray-900">{statistics.total_events}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <EyeIcon className="h-6 w-6 text-blue-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">PHI Access</dt>
                    <dd className="text-lg font-medium text-gray-900">{statistics.phi_access_events}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ExclamationTriangleIcon className="h-6 w-6 text-red-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Failed Events</dt>
                    <dd className="text-lg font-medium text-gray-900">{statistics.failed_events}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <UserIcon className="h-6 w-6 text-green-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Unique Users</dt>
                    <dd className="text-lg font-medium text-gray-900">{statistics.unique_users}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Compliance Status */}
      {complianceReport && (
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Compliance Status</h3>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getComplianceStatusColor(complianceReport.compliance_status)}`}>
              {complianceReport.compliance_status.replace('_', ' ')}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{complianceReport.summary.total_events}</div>
              <div className="text-sm text-gray-500">Total Events</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{complianceReport.summary.phi_access_events}</div>
              <div className="text-sm text-gray-500">PHI Access Events</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{(complianceReport.summary.failure_rate * 100).toFixed(1)}%</div>
              <div className="text-sm text-gray-500">Failure Rate</div>
            </div>
          </div>

          {complianceReport.recommendations.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Recommendations</h4>
              <ul className="space-y-1">
                {complianceReport.recommendations.map((recommendation, index) => (
                  <li key={index} className="text-sm text-gray-600 flex items-start">
                    <ExclamationTriangleIcon className="h-4 w-4 text-yellow-500 mr-2 mt-0.5 flex-shrink-0" />
                    {recommendation}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
            <select
              value={selectedDateRange}
              onChange={(e) => setSelectedDateRange(Number(e.target.value))}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
              <option value={365}>Last year</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Action Type</label>
            <select
              value={filters.action_type}
              onChange={(e) => setFilters({ ...filters, action_type: e.target.value })}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="">All Actions</option>
              <option value="phi_access">PHI Access</option>
              <option value="phi_edit">PHI Edit</option>
              <option value="login_success">Login Success</option>
              <option value="login_failed">Login Failed</option>
              <option value="ivr_status_change">IVR Status Change</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Resource Type</label>
            <select
              value={filters.resource_type}
              onChange={(e) => setFilters({ ...filters, resource_type: e.target.value })}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="">All Resources</option>
              <option value="patient">Patient</option>
              <option value="ivr">IVR</option>
              <option value="order">Order</option>
              <option value="user">User</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filters.success}
              onChange={(e) => setFilters({ ...filters, success: e.target.value })}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="">All Status</option>
              <option value="true">Success</option>
              <option value="false">Failed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Recent Audit Logs</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Resource
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  IP Address
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date/Time
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getActionTypeIcon(log.action_type)}
                      <span className="ml-2 text-sm text-gray-900">
                        {log.action_type.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {log.resource_type.toUpperCase()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {log.user_id.substring(0, 8)}...
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {log.ip_address}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      log.success
                        ? 'text-green-800 bg-green-100'
                        : 'text-red-800 bg-red-100'
                    }`}>
                      {log.success ? 'Success' : 'Failed'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(log.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {auditLogs.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">No audit logs found for the selected criteria.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuditComplianceTab;