import React, { useState } from 'react';
import type { LogisticsOrder } from '../../../types/order';
import { sharedOrderStore } from '../../../services/sharedOrderStore';

interface StatusManagerProps {
  order: LogisticsOrder;
  onStatusUpdate: (orderId: string, newStatus: string) => Promise<void>;
}

const STATUS_FLOW = {
  pending: ['processing'],
  processing: ['packed'],
  packed: ['shipped'],
  shipped: ['delivered'],
  delivered: []
};

const STATUS_LABELS = {
  pending: 'Pending',
  processing: 'Processing',
  packed: 'Packed',
  shipped: 'Shipped',
  delivered: 'Delivered'
};

const StatusManager: React.FC<StatusManagerProps> = ({ order, onStatusUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const availableStatuses = STATUS_FLOW[order.status as keyof typeof STATUS_FLOW];

  const handleStatusUpdate = async (newStatus: string) => {
    setLoading(true);
    setError(null);
    try {
      await onStatusUpdate(order.id, newStatus);
      // Update in shared store
      sharedOrderStore.updateOrderStatus(order.id, newStatus);
    } catch (err) {
      setError('Failed to update status');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Status Management</h3>
      </div>

      <div className="p-4">
        {/* Status Timeline */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <div className="w-full border-t border-gray-200" />
          </div>
          <div className="relative flex justify-between">
            {Object.entries(STATUS_LABELS).map(([status, label], index) => {
              const isCompleted = STATUS_FLOW[order.status as keyof typeof STATUS_FLOW].length === 0 
                ? index <= Object.keys(STATUS_LABELS).indexOf(order.status)
                : index < Object.keys(STATUS_LABELS).indexOf(order.status);
              const isCurrent = status === order.status;

              return (
                <div key={status} className="flex flex-col items-center">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full ${
                      isCompleted
                        ? 'bg-slate-600'
                        : isCurrent
                        ? 'border-2 border-slate-600 bg-white'
                        : 'border-2 border-gray-200 bg-white'
                    }`}
                  >
                    {isCompleted ? (
                      <svg className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <span className={`h-2.5 w-2.5 rounded-full ${isCurrent ? 'bg-slate-600' : 'bg-transparent'}`} />
                    )}
                  </div>
                  <div className="mt-2 text-sm font-medium text-gray-900">{label}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Status Actions */}
        {availableStatuses.length > 0 && (
          <div className="mt-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">Available Actions</p>
              <div className="flex space-x-3">
                {availableStatuses.map((status) => (
                  <button
                    key={status}
                    onClick={() => handleStatusUpdate(status)}
                    disabled={loading}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-slate-600 hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Updating...' : `Mark as ${STATUS_LABELS[status as keyof typeof STATUS_LABELS]}`}
                  </button>
                ))}
              </div>
            </div>
            {error && (
              <p className="mt-2 text-sm text-red-600">{error}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default StatusManager; 