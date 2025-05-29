import React, { useState, useEffect } from 'react';
import { Users, Activity, Server, Clock, AlertCircle, FileText, Settings, Database, Phone, Package, Shield, CheckCircle, Timer, Truck } from 'lucide-react';
import { format } from 'date-fns';
import { Card } from '../shared/ui/Card';
import { MetricCard } from '../shared/DashboardWidgets/MetricCard';
import { ChartCard } from '../shared/DashboardWidgets/ChartCard';
import { AdminUserTable } from './users/AdminUserTable';
import { SystemHealthChart } from './SystemHealthChart';
import { RecentActivityFeed } from './RecentActivityFeed';
import { NotificationCenter } from './NotificationCenter';
import { useConfig } from '../../contexts/ConfigContext';

interface AdminMetrics {
  total_users: number;
  active_sessions: number;
  system_health: number;
  pending_approvals: number;
  cpu_usage: number;
  memory_usage: number;
  response_time: number;
  error_rate: number;
  total_ivr_requests: number;
  pending_verifications: number;
  verification_success_rate: number;
  avg_verification_time: number;
  active_orders: number;
  shipping_success_rate: number;
}

interface SystemMetric {
  timestamp: string;
  value: number;
}

interface ActivityLog {
  id: string;
  user: string;
  action: string;
  timestamp: Date;
  details: string;
  severity: 'info' | 'warning' | 'error';
}

export const AdminDashboard: React.FC = () => {
  const { apiBaseUrl } = useConfig();
  const [metrics, setMetrics] = useState<AdminMetrics>({
    total_users: 2847,
    active_sessions: 156,
    system_health: 98,
    pending_approvals: 23,
    cpu_usage: 45,
    memory_usage: 62,
    response_time: 250,
    error_rate: 0.5,
    total_ivr_requests: 15234,
    pending_verifications: 42,
    verification_success_rate: 94.8,
    avg_verification_time: 180, // seconds
    active_orders: 328,
    shipping_success_rate: 99.2
  });
  const [systemMetrics, setSystemMetrics] = useState<SystemMetric[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch admin metrics
      const metricsResponse = await fetch(`${apiBaseUrl}/api/admin/dashboard/metrics`);
      if (!metricsResponse.ok) throw new Error('Failed to fetch metrics');
      const metricsData = await metricsResponse.json();
      setMetrics(metricsData);

      // Fetch system metrics
      const systemResponse = await fetch(`${apiBaseUrl}/api/admin/dashboard/system-metrics`);
      if (!systemResponse.ok) throw new Error('Failed to fetch system metrics');
      const systemData = await systemResponse.json();
      setSystemMetrics(systemData);

      // Fetch activity logs
      const logsResponse = await fetch(`${apiBaseUrl}/api/admin/dashboard/activity-logs`);
      if (!logsResponse.ok) throw new Error('Failed to fetch activity logs');
      const logsData = await logsResponse.json();
      setActivityLogs(logsData);

    } catch (err) {
      setError('Failed to load dashboard data. Please try again.');
      console.error('Dashboard data fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    
    // Set up WebSocket for real-time updates
    const wsUrl = `${apiBaseUrl.replace('http', 'ws')}/ws/admin-dashboard`;
    const ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
      console.log('WebSocket connection established');
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setError('Real-time updates unavailable. Please refresh the page.');
    };
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        switch (data.type) {
          case 'metrics_update':
            setMetrics(prev => ({ ...prev, ...data.metrics }));
            break;
          case 'system_update':
            setSystemMetrics(prev => [...prev, data.metric].slice(-50));
            break;
          case 'activity_update':
            setActivityLogs(prev => [data.activity, ...prev].slice(0, 50));
            break;
          default:
            console.warn('Unknown WebSocket message type:', data.type);
        }
      } catch (err) {
        console.error('Error processing WebSocket message:', err);
      }
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [apiBaseUrl]);

  const quickActions = [
    {
      name: 'Process IVR Request',
      icon: <Phone className="w-5 h-5" />,
      description: 'Handle pending verifications',
      color: 'bg-[#475569]'
    },
    {
      name: 'Review Orders',
      icon: <Package className="w-5 h-5" />,
      description: 'Manage wound care orders',
      color: 'bg-[#475569]'
    },
    {
      name: 'Audit Logs',
      icon: <Shield className="w-5 h-5" />,
      description: 'Review HIPAA compliance',
      color: 'bg-[#475569]'
    },
    {
      name: 'System Health',
      icon: <Activity className="w-5 h-5" />,
      description: 'Monitor platform status',
      color: 'bg-[#475569]'
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#475569]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-500 p-4">
        <p>{error}</p>
        <button
          onClick={fetchDashboardData}
          className="mt-4 px-4 py-2 bg-[#475569] text-white rounded hover:bg-[#334155] transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Admin Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">
            Wound Care Platform Overview
          </p>
        </div>
        <NotificationCenter />
      </div>

      {/* Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total IVR Requests"
          value={metrics.total_ivr_requests}
          icon={<Phone className="h-8 w-8 text-slate-400" />}
          trend={+8}
        />
        <MetricCard
          title="Pending Verifications"
          value={metrics.pending_verifications}
          icon={<Clock className="h-8 w-8 text-slate-400" />}
          trend={-3}
        />
        <MetricCard
          title="Verification Success"
          value={metrics.verification_success_rate}
          icon={<CheckCircle className="h-8 w-8 text-slate-400" />}
          isPercentage
          trend={+2.5}
        />
        <MetricCard
          title="Active Orders"
          value={metrics.active_orders}
          icon={<Package className="h-8 w-8 text-slate-400" />}
          trend={+15}
        />
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Avg. Verification Time"
          value={metrics.avg_verification_time}
          icon={<Timer className="h-8 w-8 text-slate-400" />}
          unit="sec"
          trend={-12}
        />
        <MetricCard
          title="Shipping Success"
          value={metrics.shipping_success_rate}
          icon={<Truck className="h-8 w-8 text-slate-400" />}
          isPercentage
          trend={+0.8}
        />
        <MetricCard
          title="System Health"
          value={metrics.system_health}
          icon={<Activity className="h-8 w-8 text-slate-400" />}
          isPercentage
          trend={-0.5}
        />
        <MetricCard
          title="Active Users"
          value={metrics.active_sessions}
          icon={<Users className="h-8 w-8 text-slate-400" />}
          trend={+24}
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => (
            <button
              key={action.name}
              className="flex flex-col p-4 rounded-lg border-2 border-slate-100 hover:border-[#475569] hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center">
                <div className={`p-2 rounded-lg ${action.color} bg-opacity-10`}>
                  {React.cloneElement(action.icon, {
                    className: `w-5 h-5 text-[#475569]`
                  })}
                </div>
                <span className="ml-3 font-medium text-slate-900">{action.name}</span>
              </div>
              <p className="mt-2 text-sm text-slate-500 text-left pl-11">{action.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* System Health Monitoring */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">System Health</h2>
          <SystemHealthChart
            data={systemMetrics}
            cpuUsage={metrics.cpu_usage}
            memoryUsage={metrics.memory_usage}
            responseTime={metrics.response_time}
          />
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Error Rate</h2>
          <ChartCard
            title="System Errors"
            type="line"
            data={systemMetrics.map(metric => ({
              label: format(new Date(metric.timestamp), 'HH:mm'),
              value: metric.value
            }))}
            dataKey="value"
          />
        </div>
      </div>

      {/* Recent Activity and User Management */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">User Management</h2>
            <AdminUserTable />
          </div>
        </div>
        <div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Recent Activity</h2>
            <RecentActivityFeed activities={activityLogs} />
          </div>
        </div>
      </div>
    </div>
  );
}; 