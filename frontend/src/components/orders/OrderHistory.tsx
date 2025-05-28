import React, { useState } from 'react';
import type { Order } from '../../types/order';
import { format } from 'date-fns';

interface OrderHistoryProps {
  orders: Order[];
}

const OrderHistory: React.FC<OrderHistoryProps> = ({ orders }) => {
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  const toggleOrderDetails = (orderId: string) => {
    setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
  };

  if (orders.length === 0) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500">No order history available.</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-6">Order History</h3>
      
      <div className="space-y-4">
        {orders.map((order) => (
          <div key={order.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            {/* Order Summary Row */}
            <div
              className="p-4 cursor-pointer hover:bg-gray-50 flex items-center justify-between"
              onClick={() => toggleOrderDetails(order.id)}
            >
              <div className="flex items-center space-x-4">
                <div>
                  <p className="font-medium text-gray-900">Order #{order.id}</p>
                  <p className="text-sm text-gray-500">
                    {format(new Date(order.createdAt), 'MMM d, yyyy')}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                  ${order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    order.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                    order.status === 'shipped' ? 'bg-purple-100 text-purple-800' :
                    'bg-green-100 text-green-800'}`}
                >
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </span>
                <svg
                  className={`h-5 w-5 text-gray-400 transform transition-transform ${
                    expandedOrderId === order.id ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {/* Expanded Order Details */}
            {expandedOrderId === order.id && (
              <div className="border-t border-gray-200 p-4 bg-gray-50">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-500">IVR Reference</p>
                    <p className="font-medium">{order.ivrId}</p>
                  </div>
                  {order.estimatedDelivery && (
                    <div>
                      <p className="text-sm text-gray-500">Estimated Delivery</p>
                      <p className="font-medium">
                        {format(new Date(order.estimatedDelivery), 'MMM d, yyyy')}
                      </p>
                    </div>
                  )}
                  {order.trackingNumber && (
                    <div>
                      <p className="text-sm text-gray-500">Tracking Number</p>
                      <p className="font-medium">{order.trackingNumber}</p>
                    </div>
                  )}
                </div>

                {/* Product Details */}
                <div className="mb-4">
                  <p className="text-sm text-gray-500 mb-2">Product</p>
                  <div className="bg-white rounded-lg border border-gray-200 p-3">
                    <p className="font-medium">
                      {order.graftSelection.type === 'type_a' ? 'Amniotic Skin Graft - Type A' : 'Amniotic Skin Graft - Type B'}
                    </p>
                    <p className="text-sm text-gray-500">
                      Size: {order.graftSelection.size} • Quantity: {order.graftSelection.quantity}
                    </p>
                  </div>
                </div>

                {/* Shipping Information */}
                <div>
                  <p className="text-sm text-gray-500 mb-2">Shipping to Facility</p>
                  <div className="bg-white rounded-lg border border-gray-200 p-3">
                    <p className="font-medium">{order.facilityCredentials.officeContact}</p>
                    <p className="text-sm text-gray-500">
                      {order.facilityCredentials.shippingAddress.street}<br />
                      {order.facilityCredentials.shippingAddress.city}, {order.facilityCredentials.shippingAddress.state} {order.facilityCredentials.shippingAddress.zipCode}
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-4 flex justify-end space-x-3">
                  <button
                    onClick={() => window.print()}
                    className="px-3 py-2 text-sm text-gray-700 hover:text-gray-900"
                  >
                    Print Details
                  </button>
                  {order.status === 'delivered' && (
                    <button
                      className="px-3 py-2 text-sm text-slate-600 hover:text-slate-700"
                      onClick={(e) => {
                        e.stopPropagation();
                        // Handle reorder functionality
                      }}
                    >
                      Reorder
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default OrderHistory; 