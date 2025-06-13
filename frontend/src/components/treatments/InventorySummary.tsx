import React from 'react';
import {
  CubeIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { InventoryItem, InventorySummaryProps } from '../../types/treatments';

const InventorySummary: React.FC<InventorySummaryProps> = ({
  patientId,
  inventory,
  loading = false,
  onRefresh
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'plenty':
        return 'text-emerald-600 bg-emerald-50 border-emerald-200';
      case 'low':
        return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'out':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-slate-600 bg-slate-50 border-slate-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'plenty':
        return <CheckCircleIcon className="h-5 w-5 text-emerald-600" />;
      case 'low':
        return <ExclamationTriangleIcon className="h-5 w-5 text-amber-600" />;
      case 'out':
        return <XCircleIcon className="h-5 w-5 text-red-600" />;
      default:
        return <CubeIcon className="h-5 w-5 text-slate-600" />;
    }
  };

  const getProgressBarColor = (status: string) => {
    switch (status) {
      case 'plenty':
        return 'bg-emerald-500';
      case 'low':
        return 'bg-amber-500';
      case 'out':
        return 'bg-red-500';
      default:
        return 'bg-slate-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'plenty':
        return 'Well Stocked';
      case 'low':
        return 'Low Stock';
      case 'out':
        return 'Out of Stock';
      default:
        return 'Unknown';
    }
  };

  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-slate-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-slate-100 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (inventory.length === 0) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-medium text-slate-900">Inventory Summary</h3>
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="text-slate-600 hover:text-slate-900 transition-colors"
            >
              <ArrowPathIcon className="h-5 w-5" />
            </button>
          )}
        </div>

        <div className="text-center py-8">
          <CubeIcon className="mx-auto h-12 w-12 text-slate-400" />
          <h3 className="mt-2 text-sm font-medium text-slate-900">No inventory data</h3>
          <p className="mt-1 text-sm text-slate-500">
            Inventory information will appear here once orders are placed and treatments are recorded.
          </p>
        </div>
      </div>
    );
  }

  const totalProducts = inventory.length;
  const lowStockCount = inventory.filter(item => item.status === 'low').length;
  const outOfStockCount = inventory.filter(item => item.status === 'out').length;

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-6 py-4 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-slate-900">Inventory Summary</h3>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-sm text-slate-600">
              <ChartBarIcon className="h-4 w-4" />
              <span>{totalProducts} products</span>
            </div>
            {(lowStockCount > 0 || outOfStockCount > 0) && (
              <div className="flex items-center space-x-2">
                {lowStockCount > 0 && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                    {lowStockCount} low
                  </span>
                )}
                {outOfStockCount > 0 && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    {outOfStockCount} out
                  </span>
                )}
              </div>
            )}
            {onRefresh && (
              <button
                onClick={onRefresh}
                className="text-slate-600 hover:text-slate-900 transition-colors"
              >
                <ArrowPathIcon className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {inventory.map((item) => (
            <div
              key={item.product_id}
              className={`border rounded-lg p-4 transition-all hover:shadow-md ${getStatusColor(item.status)}`}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-slate-900 truncate">
                    {item.product_name}
                  </h4>
                  <div className="flex items-center mt-1">
                    {getStatusIcon(item.status)}
                    <span className="ml-1 text-xs font-medium">
                      {getStatusText(item.status)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Inventory Numbers */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="text-center">
                  <div className="text-lg font-semibold text-slate-900">
                    {item.total_ordered}
                  </div>
                  <div className="text-xs text-slate-500">Ordered</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-slate-900">
                    {item.total_used}
                  </div>
                  <div className="text-xs text-slate-500">Used</div>
                </div>
                <div className="text-center">
                  <div className={`text-lg font-semibold ${
                    item.on_hand <= 0 ? 'text-red-600' :
                    item.status === 'low' ? 'text-amber-600' : 'text-emerald-600'
                  }`}>
                    {item.on_hand}
                  </div>
                  <div className="text-xs text-slate-500">On Hand</div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-2">
                <div className="flex justify-between text-xs text-slate-600 mb-1">
                  <span>Usage</span>
                  <span>{Math.round(item.usage_percentage)}%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${getProgressBarColor(item.status)}`}
                    style={{ width: `${Math.min(item.usage_percentage, 100)}%` }}
                  ></div>
                </div>
              </div>

              {/* Status Message */}
              <div className="text-xs text-slate-600">
                {item.status === 'out' && 'Reorder needed immediately'}
                {item.status === 'low' && 'Consider reordering soon'}
                {item.status === 'plenty' && 'Adequate supply available'}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Summary Footer */}
      {(lowStockCount > 0 || outOfStockCount > 0) && (
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 rounded-b-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {outOfStockCount > 0 && (
                <div className="flex items-center text-sm text-red-600">
                  <XCircleIcon className="h-4 w-4 mr-1" />
                  <span>{outOfStockCount} product{outOfStockCount !== 1 ? 's' : ''} out of stock</span>
                </div>
              )}
              {lowStockCount > 0 && (
                <div className="flex items-center text-sm text-amber-600">
                  <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                  <span>{lowStockCount} product{lowStockCount !== 1 ? 's' : ''} running low</span>
                </div>
              )}
            </div>
            <div className="text-xs text-slate-500">
              Last updated: {new Date().toLocaleTimeString()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventorySummary;