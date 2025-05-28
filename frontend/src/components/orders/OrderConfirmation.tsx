import React from 'react';
import type { Order } from '../../types/order';
import { format } from 'date-fns';

interface OrderConfirmationProps {
  order: Order;
  onBackToList: () => void;
}

const OrderConfirmation: React.FC<OrderConfirmationProps> = ({ order, onBackToList }) => {
  return (
    <div className="p-6">
      {/* Success Message */}
      <div className="mb-8 text-center">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
          <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Order Placed Successfully</h2>
        <p className="text-gray-600">Order #{order.id}</p>
      </div>

      {/* Order Details */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Order Details</h3>
        
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <p className="text-sm text-gray-500">Order Date</p>
            <p className="font-medium">{format(new Date(order.createdAt), 'MMM d, yyyy')}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Status</p>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
              ${order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                order.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                order.status === 'shipped' ? 'bg-purple-100 text-purple-800' :
                'bg-green-100 text-green-800'}`}
            >
              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
            </span>
          </div>
          <div>
            <p className="text-sm text-gray-500">IVR Reference</p>
            <p className="font-medium">{order.ivrId}</p>
          </div>
          {order.estimatedDelivery && (
            <div>
              <p className="text-sm text-gray-500">Estimated Delivery</p>
              <p className="font-medium">{format(new Date(order.estimatedDelivery), 'MMM d, yyyy')}</p>
            </div>
          )}
        </div>

        {/* Product Details */}
        <div className="border-t border-gray-200 pt-4">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Product</h4>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium">
                  {order.graftSelection.type === 'type_a' ? 'Amniotic Skin Graft - Type A' : 'Amniotic Skin Graft - Type B'}
                </p>
                <p className="text-sm text-gray-500">Size: {order.graftSelection.size}</p>
                <p className="text-sm text-gray-500">Quantity: {order.graftSelection.quantity}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Shipping Information */}
        <div className="border-t border-gray-200 pt-4 mt-4">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Shipping to Facility</h4>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Facility Contact</p>
                <p className="font-medium">{order.facilityCredentials.officeContact}</p>
              </div>
              <div>
                <p className="text-gray-500">Phone</p>
                <p className="font-medium">{order.facilityCredentials.phone}</p>
              </div>
              <div className="col-span-2">
                <p className="text-gray-500">Address</p>
                <p className="font-medium">
                  {order.facilityCredentials.shippingAddress.street}<br />
                  {order.facilityCredentials.shippingAddress.city}, {order.facilityCredentials.shippingAddress.state} {order.facilityCredentials.shippingAddress.zipCode}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Facility Credentials */}
        <div className="border-t border-gray-200 pt-4 mt-4">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Facility Credentials</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">NPI Number</p>
              <p className="font-medium">{order.facilityCredentials.npiNumber}</p>
            </div>
            <div>
              <p className="text-gray-500">Medicare Provider ID</p>
              <p className="font-medium">{order.facilityCredentials.medicareProviderId}</p>
            </div>
            <div>
              <p className="text-gray-500">Medicaid Provider ID</p>
              <p className="font-medium">{order.facilityCredentials.medicaidProviderId}</p>
            </div>
            <div>
              <p className="text-gray-500">Tax ID</p>
              <p className="font-medium">{order.facilityCredentials.taxId}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-between items-center">
        <button
          onClick={onBackToList}
          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
        >
          Back to Orders
        </button>
        <button
          onClick={() => window.print()}
          className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
        >
          Print Order Details
        </button>
      </div>
    </div>
  );
};

export default OrderConfirmation; 