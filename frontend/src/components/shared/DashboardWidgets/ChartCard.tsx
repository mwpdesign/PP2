import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { formatNumber, formatPercentage } from '../../../utils/formatters';

type ChartType = 'line' | 'bar' | 'pie';

interface ChartData {
  label: string;
  value: number;
  [key: string]: any;
}

interface ChartCardProps {
  title: string;
  type: ChartType;
  data: ChartData[];
  dataKey: string;
  color?: string;
  isPercentage?: boolean;
  height?: number;
  className?: string;
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

export const ChartCard: React.FC<ChartCardProps> = ({
  title,
  type,
  data,
  dataKey,
  color = '#3B82F6',
  isPercentage = false,
  height = 300,
  className = '',
}) => {
  const formatValue = (value: number) => {
    return isPercentage ? formatPercentage(value) : formatNumber(value);
  };

  const renderChart = () => {
    const commonProps = {
      data,
      margin: { top: 10, right: 30, left: 0, bottom: 0 },
    };

    switch (type) {
      case 'line':
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="label" />
            <YAxis tickFormatter={formatValue} />
            <Tooltip
              formatter={(value: number) => [formatValue(value), dataKey]}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey={dataKey}
              stroke={color}
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        );

      case 'bar':
        return (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="label" />
            <YAxis tickFormatter={formatValue} />
            <Tooltip
              formatter={(value: number) => [formatValue(value), dataKey]}
            />
            <Legend />
            <Bar dataKey={dataKey} fill={color} />
          </BarChart>
        );

      case 'pie':
        return (
          <PieChart {...commonProps}>
            <Pie
              data={data}
              nameKey="label"
              dataKey={dataKey}
              cx="50%"
              cy="50%"
              outerRadius={80}
              fill={color}
              label={(entry) => entry.label}
            >
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number) => [formatValue(value), dataKey]}
            />
            <Legend />
          </PieChart>
        );

      default:
        return (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">Unsupported chart type</p>
          </div>
        );
    }
  };

  return (
    <div
      className={`bg-white rounded-lg shadow-md p-6 ${className}`}
      style={{ height }}
    >
      <h3 className="text-gray-500 text-sm font-medium mb-4">{title}</h3>
      <div className="h-full w-full">
        <ResponsiveContainer width="100%" height="100%">
          {renderChart()}
        </ResponsiveContainer>
      </div>
    </div>
  );
}; 