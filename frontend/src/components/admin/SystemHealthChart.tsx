import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { AlertCircle } from 'lucide-react';

interface SystemHealthChartProps {
  data: Array<{
    timestamp: string;
    value: number;
  }>;
  cpuUsage: number;
  memoryUsage: number;
  responseTime: number;
}

export const SystemHealthChart: React.FC<SystemHealthChartProps> = ({
  data,
  cpuUsage,
  memoryUsage,
  responseTime
}) => {
  const getHealthStatus = (value: number): string => {
    if (value < 70) return 'text-red-500';
    if (value < 90) return 'text-yellow-500';
    return 'text-green-500';
  };

  const formatValue = (value: number): string => {
    return value.toFixed(1) + '%';
  };

  const healthMetrics = [
    {
      name: 'CPU Usage',
      value: cpuUsage,
      threshold: 80,
      status: getHealthStatus(100 - cpuUsage)
    },
    {
      name: 'Memory Usage',
      value: memoryUsage,
      threshold: 85,
      status: getHealthStatus(100 - memoryUsage)
    },
    {
      name: 'HIPAA Compliance',
      value: 100,
      threshold: 100,
      status: 'text-green-500'
    },
    {
      name: 'Data Encryption',
      value: 100,
      threshold: 100,
      status: 'text-green-500'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Health Indicators */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {healthMetrics.map((metric) => (
          <div
            key={metric.name}
            className="bg-slate-50 rounded-lg p-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-slate-600">{metric.name}</h3>
              {metric.value >= metric.threshold && (
                <AlertCircle className="h-4 w-4 text-red-500" />
              )}
            </div>
            <div className="mt-2 flex items-baseline">
              <p className={`text-2xl font-semibold ${metric.status}`}>
                {formatValue(metric.value)}
              </p>
              <p className="ml-2 text-xs text-slate-500">
                Threshold: {metric.threshold}%
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Performance Chart */}
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
            <XAxis
              dataKey="timestamp"
              stroke="#64748B"
              fontSize={12}
              tickFormatter={(value) => new Date(value).toLocaleTimeString()}
            />
            <YAxis stroke="#64748B" fontSize={12} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: '8px',
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="value"
              name="System Load"
              stroke="#475569"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* System Status */}
      <div className="bg-slate-50 rounded-lg p-4">
        <h3 className="text-sm font-medium text-slate-600 mb-2">System Status</h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-500">IVR Service</span>
            <span className="text-sm font-medium text-green-500">Operational</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-500">Verification API</span>
            <span className="text-sm font-medium text-green-500">Operational</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-500">Order Processing</span>
            <span className="text-sm font-medium text-green-500">Operational</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-500">Shipping Integration</span>
            <span className="text-sm font-medium text-green-500">Operational</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-500">Response Time</span>
            <span className="text-sm font-medium text-slate-700">{responseTime}ms</span>
          </div>
        </div>
      </div>
    </div>
  );
}; 