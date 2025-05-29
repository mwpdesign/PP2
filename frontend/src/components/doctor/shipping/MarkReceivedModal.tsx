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
  trackingNumber?: string;
  carrier?: string;
}

interface MarkReceivedModalProps {
  order: ShippedOrder;
  onConfirm: () => void;
  onCancel: () => void;
}

const MarkReceivedModal: React.FC<MarkReceivedModalProps> = ({ order, onConfirm, onCancel }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-[#2E86AB] rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Confirm Delivery Receipt</h3>
              <p className="text-sm text-gray-500">Mark this order as received at your facility</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="space-y-4">
            {/* Order Summary */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="font-medium text-gray-700">Order ID:</span>
                  <span className="text-gray-900 font-mono">#{order.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-gray-700">Patient:</span>
                  <span className="text-gray-900">{order.patientName}</span>
                </div>
                {order.trackingNumber && (
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-700">Tracking:</span>
                    <span className="text-gray-900 font-mono">{order.trackingNumber}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="font-medium text-gray-700">Items:</span>
                  <span className="text-gray-900">{order.items.length} item(s)</span>
                </div>
              </div>
            </div>

            {/* Items List */}
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Items to Confirm:</h4>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {order.items.map((item, index) => (
                  <div key={index} className="flex justify-between items-center text-sm py-1">
                    <span className="text-gray-700">{item.name}</span>
                    <span className="text-gray-500">Qty: {item.quantity}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Confirmation Message */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-start space-x-2">
                <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <div className="text-sm text-blue-800">
                  <p className="font-medium">Please confirm:</p>
                  <p>All items have been received in good condition and are ready for patient use.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-xl">
          <div className="flex space-x-3 justify-end">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="px-6 py-2 bg-[#2E86AB] text-white rounded-lg hover:bg-[#247297] focus:outline-none focus:ring-2 focus:ring-[#2E86AB] focus:ring-offset-2 transition-colors font-medium"
            >
              Confirm Receipt
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarkReceivedModal; 