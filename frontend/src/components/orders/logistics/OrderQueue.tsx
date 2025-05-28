import React from 'react';
import type { LogisticsOrder } from '../../../types/order';
import { format } from 'date-fns';

interface OrderQueueProps {
  orders: LogisticsOrder[];
  selectedOrders: string[];
  onSelectOrders: (orderIds: string[]) => void;
  onSelectOrder: (order: LogisticsOrder) => void;
}

const OrderQueue: React.FC<OrderQueueProps> = ({
  orders,
  selectedOrders,
  onSelectOrders,
  onSelectOrder,
}) => {
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSelectOrders(e.target.checked ? orders.map(order => order.id) : []);
  };

  const handleSelectOrder = (orderId: string, checked: boolean) => {
    onSelectOrders(
      checked
        ? [...selectedOrders, orderId]
        : selectedOrders.filter(id => id !== orderId)
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'processing':
        return 'bg-blue-50 text-blue-700 border-blue-100';
      case 'packed':
        return 'bg-purple-50 text-purple-700 border-purple-100';
      case 'shipped':
        return 'bg-indigo-50 text-indigo-700 border-indigo-100';
      default:
        return 'bg-green-50 text-green-700 border-green-100';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-50 text-red-700 border-red-100';
      case 'rush':
        return 'bg-yellow-50 text-yellow-700 border-yellow-100';
      default:
        return 'bg-green-50 text-green-700 border-green-100';
    }
  };

  if (orders.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-8 text-center">
        <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-1">No Orders in Queue</h3>
        <p className="text-gray-500">New orders will appear here when they are placed.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with Select All */}
      <div className="flex items-center justify-between bg-white rounded-xl shadow-sm p-4">
        <div className="flex items-center space-x-3">
          <input
            type="checkbox"
            className="rounded border-gray-300 text-slate-600 focus:ring-slate-500"
            checked={selectedOrders.length === orders.length}
            onChange={handleSelectAll}
          />
          <h3 className="text-lg font-medium text-gray-900">Order Queue</h3>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <span>{orders.length} orders</span>
          <span>•</span>
          <span>{selectedOrders.length} selected</span>
        </div>
      </div>

      {/* Order Cards */}
      <div className="grid grid-cols-1 gap-4">
        {orders.map((order) => (
          <div
            key={order.id}
            className="bg-white rounded-xl shadow-sm border border-gray-100 hover:border-slate-300 transition-colors cursor-pointer"
            onClick={() => onSelectOrder(order)}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-slate-600 focus:ring-slate-500"
                    checked={selectedOrders.includes(order.id)}
                    onChange={(e) => {
                      e.stopPropagation();
                      handleSelectOrder(order.id, e.target.checked);
                    }}
                  />
                  <div>
                    <h4 className="text-lg font-medium text-gray-900">{order.id}</h4>
                    <p className="text-sm text-gray-500">{format(new Date(order.orderDate), 'MMM d, yyyy')}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getPriorityColor(order.priority)}`}>
                    {order.priority.charAt(0).toUpperCase() + order.priority.slice(1)}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(order.status)}`}>
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Facility</p>
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{order.facility.name}</p>
                      <p className="text-sm text-gray-500">{order.facility.shippingAddress.city}, {order.facility.shippingAddress.state}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Product</p>
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {order.product.type === 'type_a' ? 'Type A Graft' : 'Type B Graft'}
                      </p>
                      <p className="text-sm text-gray-500">
                        Size: {order.product.size} • Qty: {order.product.quantity}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OrderQueue; 