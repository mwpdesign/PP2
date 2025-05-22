import React from 'react';
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/solid';
import { formatNumber } from '../../../utils/formatters';

interface MetricCardProps {
  title: string;
  value: number;
  previousValue?: number;
  unit?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
  formatter?: (value: number) => string;
  isPercentage?: boolean;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  previousValue,
  unit = '',
  trend,
  className = '',
  formatter = formatNumber,
  isPercentage = false,
}) => {
  const calculateTrend = () => {
    if (!previousValue) return null;
    const change = ((value - previousValue) / previousValue) * 100;
    return {
      value: Math.abs(change),
      isPositive: change >= 0,
    };
  };

  const trendInfo = trend || calculateTrend();
  const formattedValue = isPercentage ? `${value.toFixed(1)}%` : formatter(value);

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      <h3 className="text-gray-500 text-sm font-medium mb-2">{title}</h3>
      <div className="flex items-end space-x-2">
        <span className="text-2xl font-bold">
          {formattedValue}
          {!isPercentage && unit && <span className="text-sm ml-1">{unit}</span>}
        </span>
        {trendInfo && (
          <div
            className={`flex items-center text-sm ${
              trendInfo.isPositive ? 'text-green-500' : 'text-red-500'
            }`}
          >
            {trendInfo.isPositive ? (
              <ArrowUpIcon className="w-4 h-4" />
            ) : (
              <ArrowDownIcon className="w-4 h-4" />
            )}
            <span className="ml-1">{formatNumber(trendInfo.value)}%</span>
          </div>
        )}
      </div>
    </div>
  );
}; 