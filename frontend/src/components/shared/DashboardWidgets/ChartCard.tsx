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

interface LegendItem {
  key: string;
  label: string;
  color: string;
}

interface ChartCardProps {
  title: string;
  type: ChartType;
  data: any[];
  dataKey: string;
  secondaryDataKey?: string;
  color: string;
  secondaryColor?: string;
  height: number;
  legend?: LegendItem[];
  xAxisDataKey?: string;
  isPercentage?: boolean;
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

export const ChartCard: React.FC<ChartCardProps> = ({
  title,
  type,
  data,
  dataKey,
  secondaryDataKey,
  color,
  secondaryColor,
  height,
  legend,
  xAxisDataKey,
  isPercentage = false,
}) => {
  const formatValue = (value: number) => {
    return isPercentage ? formatPercentage(value) : formatNumber(value);
  };

  const renderChart = () => {
    const commonProps = {
      data,
      margin: { top: 5, right: 30, left: 20, bottom: 5 },
    };

    switch (type) {
      case 'line':
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis dataKey={xAxisDataKey || "label"} stroke="#6B7280" />
            <YAxis stroke="#6B7280" />
            <Tooltip
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #E5E7EB',
                borderRadius: '0.5rem',
              }}
            />
            {legend && <Legend />}
            <Line
              type="monotone"
              dataKey={dataKey}
              stroke={color}
              strokeWidth={2}
              dot={{ r: 4, fill: color }}
              activeDot={{ r: 6 }}
              name={legend ? legend[0].label : undefined}
            />
            {secondaryDataKey && secondaryColor && (
              <Line
                type="monotone"
                dataKey={secondaryDataKey}
                stroke={secondaryColor}
                strokeWidth={2}
                dot={{ r: 4, fill: secondaryColor }}
                activeDot={{ r: 6 }}
                name={legend ? legend[1].label : undefined}
              />
            )}
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
    <div className="w-full h-full">
      {title && <h3 className="text-lg font-semibold mb-4">{title}</h3>}
      <div style={{ height: height || 300 }}>
        <ResponsiveContainer width="100%" height="100%">
          {renderChart()}
        </ResponsiveContainer>
      </div>
    </div>
  );
}; 