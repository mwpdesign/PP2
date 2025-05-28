import React, { useState, useEffect } from 'react';
import type { LogisticsOrder } from '../../types/order';
import OrderQueue from './logistics/OrderQueue';
import OrderDetails from './logistics/OrderDetails';
import StatusManager from './logistics/StatusManager';
import ComplianceInfo from './logistics/ComplianceInfo';
import BatchActions from './logistics/BatchActions';
import { sharedOrderStore } from '../../services/sharedOrderStore';

const LogisticsView: React.FC = () => {
  const [orders, setOrders] = useState<LogisticsOrder[]>([]);
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [activeOrder, setActiveOrder] = useState<LogisticsOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Initial load from shared store
    setOrders(sharedOrderStore.getOrders());
    setLoading(false);

    // Subscribe to changes
    const unsubscribe = sharedOrderStore.subscribe(() => {
      setOrders(sharedOrderStore.getOrders());
    });

    return unsubscribe;
  }, []);

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      sharedOrderStore.updateOrderStatus(orderId, newStatus);
      // Update local state to reflect the change
      setOrders(orders.map(order => 
        order.id === orderId 
          ? { ...order, status: newStatus as LogisticsOrder['status'] }
          : order
      ));
    } catch (err) {
      setError('Failed to update order status');
    }
  };

  const handleBatchAction = async (action: string) => {
    try {
      // TODO: Handle batch actions via API
      setSelectedOrders([]);
    } catch (err) {
      setError('Failed to process batch action');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-600"></div>
          <p className="text-slate-600">Loading logistics dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Logistics Dashboard</h1>
              <p className="mt-1 text-sm text-gray-500">
                Manage order fulfillment and shipping operations
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 px-4 py-2 bg-gray-50 rounded-lg">
                <span className="flex h-3 w-3 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                </span>
                <span className="text-sm text-gray-600">System Status: Operational</span>
              </div>
              <button
                onClick={() => {}} // TODO: Implement refresh
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="p-8">
        {/* Batch Actions */}
        {selectedOrders.length > 0 && (
          <div className="mb-6">
            <BatchActions
              selectedOrders={selectedOrders}
              onAction={handleBatchAction}
            />
          </div>
        )}

        {error && (
          <div className="mb-6">
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-12 gap-8">
          {/* Order Queue */}
          <div className="col-span-12 lg:col-span-7">
            <OrderQueue
              orders={orders}
              selectedOrders={selectedOrders}
              onSelectOrders={setSelectedOrders}
              onSelectOrder={setActiveOrder}
            />
          </div>

          {/* Order Details and Actions */}
          <div className="col-span-12 lg:col-span-5">
            <div className="sticky top-8">
              {activeOrder ? (
                <div className="space-y-6">
                  <OrderDetails order={activeOrder} />
                  <StatusManager
                    order={activeOrder}
                    onStatusUpdate={handleStatusUpdate}
                  />
                  <ComplianceInfo order={activeOrder} />
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                  <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-1">No Order Selected</h3>
                  <p className="text-gray-500">Select an order from the queue to view its details</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LogisticsView; 