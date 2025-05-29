import React from 'react';

interface ShippedOrder {
  id: string;
  patientName: string;
  patientId: string;
  items: Array<{
    name: string;
    quantity: number;
    sku: string;
  }>;
  status: string;
  trackingNumber?: string;
  estimatedDelivery?: string;
  shippedDate?: string;
  carrier?: string;
  priority: string;
  orderDate: string;
}

interface ShippedOrderCardProps {
  order: ShippedOrder;
  onMarkAsReceived: (order: ShippedOrder) => void;
}

const ShippedOrderCard: React.FC<ShippedOrderCardProps> = ({ order, onMarkAsReceived }) => {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'shipped':
        return 'bg-blue-100 text-blue-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'urgent':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'standard':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const isDelivered = order.status.toLowerCase() === 'delivered';

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-6">
        {/* Header Section */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <h3 className="text-lg font-semibold text-gray-900">
                Order #{order.id}
              </h3>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
              </span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(order.priority)}`}>
                {order.priority}
              </span>
            </div>
            <div className="text-sm text-gray-600 space-y-1">
              <p><span className="font-medium">Patient:</span> {order.patientName} (ID: {order.patientId})</p>
              <p><span className="font-medium">Order Date:</span> {order.orderDate}</p>
              {order.shippedDate && (
                <p><span className="font-medium">Shipped:</span> {order.shippedDate}</p>
              )}
            </div>
          </div>
          
          {/* Action Button */}
          <div className="ml-6">
            {!isDelivered ? (
              <button
                onClick={() => onMarkAsReceived(order)}
                className="bg-[#2E86AB] hover:bg-[#247297] text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#2E86AB] focus:ring-offset-2"
              >
                Mark as Received
              </button>
            ) : (
              <div className="flex items-center space-x-2 text-green-600">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">Delivered</span>
              </div>
            )}
          </div>
        </div>

        {/* Tracking Information */}
        {order.trackingNumber && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Tracking Number:</span>
                <p className="text-gray-900 font-mono">{order.trackingNumber}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Carrier:</span>
                <p className="text-gray-900">{order.carrier}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Est. Delivery:</span>
                <p className="text-gray-900">{order.estimatedDelivery}</p>
              </div>
            </div>
          </div>
        )}

        {/* Items Section */}
        <div>
          <h4 className="font-medium text-gray-900 mb-3">Items Shipped ({order.items.length})</h4>
          <div className="space-y-2">
            {order.items.map((item, index) => (
              <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{item.name}</p>
                  <p className="text-sm text-gray-500">SKU: {item.sku}</p>
                </div>
                <div className="text-sm text-gray-600">
                  Qty: {item.quantity}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer - Status Timeline */}
      <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Order placed on {order.orderDate}</span>
          {isDelivered ? (
            <span className="text-green-600 font-medium">✓ Delivery confirmed</span>
          ) : (
            <span>⏳ Awaiting delivery confirmation</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShippedOrderCard; 