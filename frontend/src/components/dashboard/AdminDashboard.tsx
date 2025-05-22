import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { MetricCard } from '../shared/DashboardWidgets/MetricCard';
import { ChartCard } from '../shared/DashboardWidgets/ChartCard';
import { formatCurrency, formatDuration } from '../../utils/formatters';

interface DashboardMetrics {
  total_calls: number;
  avg_call_duration: number;
  total_orders: number;
  total_revenue: number;
  approval_rate: number;
  total_notifications: number;
  notification_success_rate: number;
  satisfaction_rate: number;
  avg_sentiment_score: number;
  verification_success_rate: number;
  sla_compliance_rate: number;
}

interface TerritoryMetrics {
  territory_id: string;
  state: string;
  region: string;
  total_calls: number;
  avg_call_duration: number;
  total_orders: number;
  total_revenue: number;
  approval_rate: number;
}

interface ProviderMetrics {
  provider_id: string;
  name: string;
  type: string;
  total_verifications: number;
  avg_verification_time: number;
  approval_rate: number;
  sla_compliance: number;
}

interface SatisfactionMetrics {
  satisfaction_level: string;
  count: number;
  feedback_category: string;
  sentiment_score: number;
}

interface VerificationMetrics {
  verification_type: string;
  count: number;
  success_rate: number;
  avg_response_time: number;
  sla_compliance: number;
}

interface TrendData {
  time_period: string;
  value: number;
}

export const AdminDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [territoryMetrics, setTerritoryMetrics] = useState<TerritoryMetrics[]>([]);
  const [providerMetrics, setProviderMetrics] = useState<ProviderMetrics[]>([]);
  const [satisfactionMetrics, setSatisfactionMetrics] = useState<SatisfactionMetrics[]>([]);
  const [verificationMetrics, setVerificationMetrics] = useState<VerificationMetrics[]>([]);
  const [trends, setTrends] = useState<TrendData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch overview metrics
      const overviewResponse = await fetch('/api/admin/dashboard/overview');
      const overviewData = await overviewResponse.json();
      setMetrics(overviewData);

      // Fetch territory metrics
      const territoryResponse = await fetch('/api/admin/dashboard/territory-metrics');
      const territoryData = await territoryResponse.json();
      setTerritoryMetrics(territoryData);

      // Fetch provider metrics
      const providerResponse = await fetch('/api/admin/dashboard/provider-performance');
      const providerData = await providerResponse.json();
      setProviderMetrics(providerData);

      // Fetch satisfaction metrics
      const satisfactionResponse = await fetch('/api/admin/dashboard/satisfaction-metrics');
      const satisfactionData = await satisfactionResponse.json();
      setSatisfactionMetrics(satisfactionData);

      // Fetch verification metrics
      const verificationResponse = await fetch('/api/admin/dashboard/verification-metrics');
      const verificationData = await verificationResponse.json();
      setVerificationMetrics(verificationData);

      // Fetch trend data
      const trendResponse = await fetch(
        '/api/admin/dashboard/trend-analysis?metric=calls&interval=daily'
      );
      const trendData = await trendResponse.json();
      setTrends(trendData);
    } catch (err) {
      setError('Failed to load dashboard data. Please try again.');
      console.error('Dashboard data fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    // Set up WebSocket connection for real-time updates
    const ws = new WebSocket('ws://localhost:8000/ws/dashboard');
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      // Update relevant metrics based on real-time data
      if (data.type === 'metrics_update') {
        setMetrics((prev) => ({ ...prev, ...data.metrics }));
      }
    };

    return () => {
      ws.close();
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-500 p-4">
        <p>{error}</p>
        <button
          onClick={fetchDashboardData}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Overview Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Calls"
          value={metrics?.total_calls || 0}
          unit="calls"
        />
        <MetricCard
          title="Average Call Duration"
          value={metrics?.avg_call_duration || 0}
          unit="sec"
          formatter={formatDuration}
        />
        <MetricCard
          title="Total Revenue"
          value={metrics?.total_revenue || 0}
          formatter={formatCurrency}
        />
        <MetricCard
          title="Approval Rate"
          value={metrics?.approval_rate || 0}
          unit="%"
          isPercentage
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard
          title="Call Volume Trend"
          type="line"
          data={trends.map((t) => ({
            label: format(new Date(t.time_period), 'MMM d'),
            value: t.value,
          }))}
          dataKey="value"
        />
        <ChartCard
          title="Territory Performance"
          type="bar"
          data={territoryMetrics.slice(0, 10).map((t) => ({
            label: t.state,
            value: t.approval_rate,
          }))}
          dataKey="value"
          isPercentage
        />
      </div>

      {/* Patient Satisfaction Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-medium mb-4">Patient Satisfaction Analysis</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartCard
            title="Satisfaction Distribution"
            type="pie"
            data={satisfactionMetrics.map((s) => ({
              label: s.satisfaction_level,
              value: s.count,
            }))}
            dataKey="value"
          />
          <ChartCard
            title="Feedback Categories"
            type="bar"
            data={satisfactionMetrics.map((s) => ({
              label: s.feedback_category,
              value: s.sentiment_score,
            }))}
            dataKey="value"
            isPercentage
          />
        </div>
      </div>

      {/* Verification Performance Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-medium mb-4">Verification Performance</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartCard
            title="Verification Types"
            type="pie"
            data={verificationMetrics.map((v) => ({
              label: v.verification_type,
              value: v.count,
            }))}
            dataKey="value"
          />
          <ChartCard
            title="SLA Compliance by Type"
            type="bar"
            data={verificationMetrics.map((v) => ({
              label: v.verification_type,
              value: v.sla_compliance,
            }))}
            dataKey="value"
            isPercentage
          />
        </div>
        <div className="mt-6">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Success Rate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Avg Response Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  SLA Compliance
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {verificationMetrics.map((v) => (
                <tr key={v.verification_type}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {v.verification_type}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {`${(v.success_rate * 100).toFixed(1)}%`}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDuration(v.avg_response_time)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {`${(v.sla_compliance * 100).toFixed(1)}%`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Provider Performance Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-medium mb-4">Insurance Provider Performance</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Provider
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Verifications
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Avg. Verification Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Approval Rate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  SLA Compliance
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {providerMetrics.map((provider) => (
                <tr key={provider.provider_id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {provider.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {provider.type}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {provider.total_verifications.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDuration(provider.avg_verification_time)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {`${(provider.approval_rate * 100).toFixed(1)}%`}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {`${(provider.sla_compliance * 100).toFixed(1)}%`}
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