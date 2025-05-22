import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { format } from 'date-fns';
import { toast } from 'react-toastify';

import { IVRStatus, IVRPriority } from '../../types/ivr';
import ivrService from '../../services/ivrService';

interface ReportingMetrics {
  totalRequests: number;
  approvalRate: number;
  averageProcessingTime: number;
  escalationRate: number;
  statusDistribution: {
    status: string;
    count: number;
  }[];
  priorityDistribution: {
    priority: string;
    count: number;
  }[];
  dailyVolume: {
    date: string;
    requests: number;
    approvals: number;
    rejections: number;
  }[];
  processingTimeByPriority: {
    priority: string;
    averageTime: number;
  }[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const IVRReporting: React.FC = () => {
  const [metrics, setMetrics] = useState<ReportingMetrics>({
    totalRequests: 0,
    approvalRate: 0,
    averageProcessingTime: 0,
    escalationRate: 0,
    statusDistribution: [],
    priorityDistribution: [],
    dailyVolume: [],
    processingTimeByPriority: [],
  });
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [loading, setLoading] = useState(true);

  // Load metrics
  const loadMetrics = useCallback(async () => {
    try {
      setLoading(true);
      const data = await ivrService.getMetrics(dateRange);
      setMetrics(data);
    } catch (error) {
      console.error('Failed to load metrics:', error);
      toast.error('Failed to load reporting metrics');
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    loadMetrics();
  }, [loadMetrics]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Date Range Selector */}
      <div className="flex justify-end space-x-2">
        <button
          onClick={() => setDateRange('7d')}
          className={`px-4 py-2 rounded ${
            dateRange === '7d'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 text-gray-700'
          }`}
        >
          7 Days
        </button>
        <button
          onClick={() => setDateRange('30d')}
          className={`px-4 py-2 rounded ${
            dateRange === '30d'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 text-gray-700'
          }`}
        >
          30 Days
        </button>
        <button
          onClick={() => setDateRange('90d')}
          className={`px-4 py-2 rounded ${
            dateRange === '90d'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 text-gray-700'
          }`}
        >
          90 Days
        </button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-sm font-medium text-gray-500">Total Requests</div>
          <div className="mt-2 text-3xl font-semibold">{metrics.totalRequests}</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-sm font-medium text-gray-500">Approval Rate</div>
          <div className="mt-2 text-3xl font-semibold">
            {(metrics.approvalRate * 100).toFixed(1)}%
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-sm font-medium text-gray-500">
            Avg. Processing Time
          </div>
          <div className="mt-2 text-3xl font-semibold">
            {metrics.averageProcessingTime.toFixed(1)} hrs
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-sm font-medium text-gray-500">Escalation Rate</div>
          <div className="mt-2 text-3xl font-semibold">
            {(metrics.escalationRate * 100).toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Volume Trend */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Daily Volume Trend</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={metrics.dailyVolume}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(value) => format(new Date(value), 'MMM d')}
                />
                <YAxis />
                <Tooltip
                  labelFormatter={(value) =>
                    format(new Date(value as string), 'MMM d, yyyy')
                  }
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="requests"
                  stroke="#8884d8"
                  name="Total Requests"
                />
                <Line
                  type="monotone"
                  dataKey="approvals"
                  stroke="#82ca9d"
                  name="Approvals"
                />
                <Line
                  type="monotone"
                  dataKey="rejections"
                  stroke="#ff7300"
                  name="Rejections"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Processing Time by Priority */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">
            Processing Time by Priority
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics.processingTimeByPriority}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="priority" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar
                  dataKey="averageTime"
                  fill="#8884d8"
                  name="Average Processing Time (hrs)"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Distribution */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Status Distribution</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={metrics.statusDistribution}
                  dataKey="count"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={(entry) =>
                    `${entry.status} (${((entry.count / metrics.totalRequests) * 100).toFixed(
                      1
                    )}%)`
                  }
                >
                  {metrics.statusDistribution.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Priority Distribution */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Priority Distribution</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={metrics.priorityDistribution}
                  dataKey="count"
                  nameKey="priority"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={(entry) =>
                    `${entry.priority} (${(
                      (entry.count / metrics.totalRequests) *
                      100
                    ).toFixed(1)}%)`
                  }
                >
                  {metrics.priorityDistribution.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IVRReporting; 