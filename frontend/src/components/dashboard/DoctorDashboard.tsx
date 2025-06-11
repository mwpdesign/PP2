import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { MetricCard } from '../shared/DashboardWidgets/MetricCard';
import { ChartCard } from '../shared/DashboardWidgets/ChartCard';
import { formatDuration } from '../../utils/formatters';

interface DoctorMetrics {
  total_patients: number;
  active_verifications: number;
  avg_verification_time: number;
  approval_rate: number;
  patient_satisfaction: number;
  sentiment_score: number;
  sla_compliance_rate: number;
  verification_success_rate: number;
}

interface PatientInsight {
  age_group: string;
  count: number;
  approval_rate: number;
  avg_processing_time: number;
  satisfaction_rate: number;
  sentiment_score: number;
}

interface ProcessingMetric {
  time_period: string;
  verification_count: number;
  success_rate: number;
  avg_response_time: number;
  sla_compliance: number;
}

interface SatisfactionTrend {
  time_period: string;
  satisfaction_rate: number;
  sentiment_score: number;
}

export const DoctorDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<DoctorMetrics | null>(null);
  const [insights, setInsights] = useState<PatientInsight[]>([]);
  const [processingMetrics, setProcessingMetrics] = useState<ProcessingMetric[]>([]);
  const [satisfactionTrends, setSatisfactionTrends] = useState<SatisfactionTrend[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch doctor's metrics
      const metricsResponse = await fetch('/api/doctor/dashboard/metrics');
      const metricsData = await metricsResponse.json();
      setMetrics(metricsData);

      // Fetch patient insights
      const insightsResponse = await fetch('/api/doctor/dashboard/patient-insights');
      const insightsData = await insightsResponse.json();
      setInsights(insightsData);

      // Fetch processing metrics
      const processResponse = await fetch('/api/doctor/dashboard/processing-metrics');
      const processData = await processResponse.json();
      setProcessingMetrics(processData);

      // Fetch satisfaction trends
      const satisfactionResponse = await fetch('/api/doctor/dashboard/satisfaction-trends');
      const satisfactionData = await satisfactionResponse.json();
      setSatisfactionTrends(satisfactionData);
    } catch (err) {
      setError('Failed to load dashboard data. Please try again.');
      console.error('Dashboard data fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    // TEMPORARILY DISABLED WebSocket to prevent connection errors
    // TODO: Re-enable when WebSocket server endpoints are properly configured
    // const ws = new WebSocket('ws://localhost:8000/ws/doctor-dashboard');
    //
    // ws.onmessage = (event) => {
    //   const data = JSON.parse(event.data);
    //   if (data.type === 'metrics_update') {
    //     setMetrics((prev) => ({ ...prev, ...data.metrics }));
    //   }
    // };
    //
    // return () => {
    //   ws.close();
    // };
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
      {/* Overview Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Patients"
          value={metrics?.total_patients || 0}
          unit="patients"
        />
        <MetricCard
          title="Active Verifications"
          value={metrics?.active_verifications || 0}
          unit="requests"
        />
        <MetricCard
          title="Avg. Verification Time"
          value={metrics?.avg_verification_time || 0}
          unit="sec"
          formatter={formatDuration}
        />
        <MetricCard
          title="Approval Rate"
          value={metrics?.approval_rate || 0}
          isPercentage
        />
      </div>

      {/* Patient Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard
          title="Patient Age Distribution"
          type="bar"
          data={insights.map((insight) => ({
            label: insight.age_group,
            value: insight.count,
          }))}
          dataKey="value"
        />
        <ChartCard
          title="Approval Rate by Age Group"
          type="bar"
          data={insights.map((insight) => ({
            label: insight.age_group,
            value: insight.approval_rate,
          }))}
          dataKey="value"
          isPercentage
        />
      </div>

      {/* Satisfaction Metrics */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-medium mb-4">Patient Satisfaction</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartCard
            title="Satisfaction Trend"
            type="line"
            data={satisfactionTrends.map((trend) => ({
              label: format(new Date(trend.time_period), 'MMM d, HH:mm'),
              value: trend.satisfaction_rate,
            }))}
            dataKey="value"
            isPercentage
          />
          <ChartCard
            title="Sentiment Score Trend"
            type="line"
            data={satisfactionTrends.map((trend) => ({
              label: format(new Date(trend.time_period), 'MMM d, HH:mm'),
              value: trend.sentiment_score,
            }))}
            dataKey="value"
          />
        </div>
        <div className="mt-6">
          <div className="flex items-center justify-between">
            <h4 className="text-md font-medium">Overall Patient Satisfaction</h4>
            <div className="text-3xl font-bold text-blue-500">
              {metrics?.patient_satisfaction.toFixed(1)}%
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
            <div
              className="bg-blue-500 h-2.5 rounded-full"
              style={{ width: `${metrics?.patient_satisfaction || 0}%` }}
            />
          </div>
        </div>
      </div>

      {/* Verification Performance */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-medium mb-4">Verification Performance</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartCard
            title="Success Rate Trend"
            type="line"
            data={processingMetrics.map((metric) => ({
              label: format(new Date(metric.time_period), 'MMM d, HH:mm'),
              value: metric.success_rate,
            }))}
            dataKey="value"
            isPercentage
          />
          <ChartCard
            title="SLA Compliance Trend"
            type="line"
            data={processingMetrics.map((metric) => ({
              label: format(new Date(metric.time_period), 'MMM d, HH:mm'),
              value: metric.sla_compliance,
            }))}
            dataKey="value"
            isPercentage
          />
        </div>
        <div className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h5 className="text-sm font-medium text-gray-500">Success Rate</h5>
              <p className="text-2xl font-bold text-blue-600">
                {`${(metrics?.verification_success_rate || 0).toFixed(1)}%`}
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h5 className="text-sm font-medium text-gray-500">SLA Compliance</h5>
              <p className="text-2xl font-bold text-blue-600">
                {`${(metrics?.sla_compliance_rate || 0).toFixed(1)}%`}
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h5 className="text-sm font-medium text-gray-500">Avg Response Time</h5>
              <p className="text-2xl font-bold text-blue-600">
                {formatDuration(metrics?.avg_verification_time || 0)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};