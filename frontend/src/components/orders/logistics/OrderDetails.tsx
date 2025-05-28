import React from 'react';
import type { LogisticsOrder } from '../../../types/order';
import { format } from 'date-fns';

interface OrderDetailsProps {
  order: LogisticsOrder;
}

const OrderDetails: React.FC<OrderDetailsProps> = ({ order }) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Order Details</h3>
      </div>

      <div className="p-4 space-y-6">
        {/* Order Summary */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Order ID</p>
            <p className="font-medium">{order.id}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Order Date</p>
            <p className="font-medium">{format(new Date(order.orderDate), 'MMM d, yyyy')}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Priority</p>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
              ${order.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                order.priority === 'rush' ? 'bg-yellow-100 text-yellow-800' :
                'bg-green-100 text-green-800'}`}
            >
              {order.priority.charAt(0).toUpperCase() + order.priority.slice(1)}
            </span>
          </div>
          <div>
            <p className="text-sm text-gray-500">Status</p>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
              ${order.status === 'pending' ? 'bg-gray-100 text-gray-800' :
                order.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                order.status === 'packed' ? 'bg-purple-100 text-purple-800' :
                order.status === 'shipped' ? 'bg-indigo-100 text-indigo-800' :
                'bg-green-100 text-green-800'}`}
            >
              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
            </span>
          </div>
        </div>

        {/* Patient Information */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-2">Patient Information</h4>
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Name</p>
                <p className="font-medium">{order.patient.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Contact</p>
                <p className="font-medium">{order.patient.contact}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Doctor Information */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-2">Doctor Information</h4>
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Name</p>
                <p className="font-medium">{order.doctor.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">NPI</p>
                <p className="font-medium">{order.doctor.npi}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Product Information */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-2">Product Information</h4>
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Type</p>
                <p className="font-medium">
                  {order.product.type === 'type_a' ? 'Amniotic Skin Graft - Type A' : 'Amniotic Skin Graft - Type B'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Size</p>
                <p className="font-medium">{order.product.size}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Quantity</p>
                <p className="font-medium">{order.product.quantity}</p>
              </div>
              {order.product.specialRequirements.length > 0 && (
                <div className="col-span-2">
                  <p className="text-sm text-gray-500">Special Requirements</p>
                  <ul className="mt-1 space-y-1">
                    {order.product.specialRequirements.map((req, index) => (
                      <li key={index} className="text-sm font-medium">• {req}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* IVR Approval */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-2">IVR Approval</h4>
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Authorization Number</p>
                <p className="font-medium">{order.ivrApproval.authorizationNumber}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">IVR Specialist</p>
                <p className="font-medium">{order.ivrApproval.ivrSpecialist}</p>
              </div>
              <div className="col-span-2">
                <p className="text-sm text-gray-500 mb-2">Approval Documents</p>
                <div className="flex flex-wrap gap-2">
                  {order.ivrApproval.approvalDocuments.map((doc) => (
                    <button
                      key={doc.id}
                      className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
                    >
                      View Document
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Logistics Information */}
        {order.logistics && (
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-2">Logistics Information</h4>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="grid grid-cols-2 gap-4">
                {order.logistics.assignedTo && (
                  <div>
                    <p className="text-sm text-gray-500">Assigned To</p>
                    <p className="font-medium">{order.logistics.assignedTo}</p>
                  </div>
                )}
                {order.logistics.estimatedShipDate && (
                  <div>
                    <p className="text-sm text-gray-500">Estimated Ship Date</p>
                    <p className="font-medium">
                      {format(new Date(order.logistics.estimatedShipDate), 'MMM d, yyyy')}
                    </p>
                  </div>
                )}
                {order.logistics.carrier && (
                  <div>
                    <p className="text-sm text-gray-500">Carrier</p>
                    <p className="font-medium">{order.logistics.carrier}</p>
                  </div>
                )}
                {order.logistics.trackingNumber && (
                  <div>
                    <p className="text-sm text-gray-500">Tracking Number</p>
                    <p className="font-medium">{order.logistics.trackingNumber}</p>
                  </div>
                )}
                {order.logistics.notes && (
                  <div className="col-span-2">
                    <p className="text-sm text-gray-500">Notes</p>
                    <p className="font-medium">{order.logistics.notes}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderDetails; 