import React from 'react';
import type { LogisticsOrder } from '../../../types/order';

interface ComplianceInfoProps {
  order: LogisticsOrder;
}

const ComplianceInfo: React.FC<ComplianceInfoProps> = ({ order }) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Compliance Information</h3>
      </div>

      <div className="p-4 space-y-6">
        {/* Facility Credentials */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-2">Facility Credentials</h4>
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">NPI Number</p>
                <p className="font-medium">{order.facility.npiNumber}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Medicare Provider Number</p>
                <p className="font-medium">{order.facility.medicareProviderNumber}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Medicaid Provider Number</p>
                <p className="font-medium">{order.facility.medicaidProviderNumber}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Tax ID</p>
                <p className="font-medium">{order.facility.taxId}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Shipping Information */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-2">Shipping Information</h4>
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Facility Name</p>
                <p className="font-medium">{order.facility.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Physician Name</p>
                <p className="font-medium">{order.facility.physicianName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Office Contact</p>
                <p className="font-medium">{order.facility.officeContact}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Phone</p>
                <p className="font-medium">{order.facility.phone}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Fax</p>
                <p className="font-medium">{order.facility.fax}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Business Hours</p>
                <p className="font-medium">{order.facility.businessHours}</p>
              </div>
              <div className="col-span-2">
                <p className="text-sm text-gray-500">Shipping Address</p>
                <p className="font-medium">
                  {order.facility.shippingAddress.street}<br />
                  {order.facility.shippingAddress.city}, {order.facility.shippingAddress.state} {order.facility.shippingAddress.zipCode}
                </p>
              </div>
              {order.facility.specialInstructions && (
                <div className="col-span-2">
                  <p className="text-sm text-gray-500">Special Instructions</p>
                  <p className="font-medium">{order.facility.specialInstructions}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* IVR Documentation */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-2">IVR Documentation</h4>
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Authorization Number</p>
                <p className="font-medium">{order.ivrApproval.authorizationNumber}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">IVR Specialist</p>
                <p className="font-medium">{order.ivrApproval.ivrSpecialist}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-2">Required Documents</p>
                <div className="grid grid-cols-2 gap-3">
                  {order.ivrApproval.approvalDocuments.map((doc) => (
                    <button
                      key={doc.id}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
                    >
                      <svg className="mr-2 h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                      {doc.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComplianceInfo; 