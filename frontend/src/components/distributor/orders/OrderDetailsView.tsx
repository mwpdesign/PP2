import React, { useState } from 'react';
import { Card } from '../../shared/ui/Card';
import DocumentUpload from './DocumentUpload';
import ProductDisplay from './ProductDisplay';

interface Order {
  id: string;
  orderNumber: string;
  date: string;
  time: string;
  doctor: {
    name: string;
    facility: string;
    email: string;
  };
  patient: {
    initials: string;
    patientId: string;
  };
  ivrReference: string;
  products: Array<{
    id: string;
    name: string;
    description: string;
    quantity: number;
    image?: string;
    specialHandling?: string;
  }>;
  shippingAddress: {
    facility: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    attention?: string;
  };
  priority: 'Standard' | 'Urgent' | 'Rush';
  status: 'Pending Fulfillment' | 'In Progress' | 'Shipped' | 'Delivered';
  totalItems: number;
  trackingNumber?: string;
  carrier?: string;
  shipDate?: string;
  estimatedDelivery?: string;
  documents?: Array<{
    id: string;
    name: string;
    type: string;
    url: string;
    uploadedAt: string;
  }>;
  notes?: string;
}

interface OrderDetailsViewProps {
  order: Order;
  onBack: () => void;
  onUpdate: (order: Order) => void;
}

const OrderDetailsView: React.FC<OrderDetailsViewProps> = ({ order, onBack, onUpdate }) => {
  const [currentOrder, setCurrentOrder] = useState<Order>(order);
  const [trackingNumber, setTrackingNumber] = useState(order.trackingNumber || '');
  const [carrier, setCarrier] = useState(order.carrier || '');
  const [shipDate, setShipDate] = useState(order.shipDate || '');
  const [estimatedDelivery, setEstimatedDelivery] = useState(order.estimatedDelivery || '');
  const [notes, setNotes] = useState(order.notes || '');
  const [documents, setDocuments] = useState(order.documents || []);

  const getStatusBadge = (status: Order['status']) => {
    const baseClasses = 'px-4 py-2 rounded-full text-sm font-semibold border';
    switch (status) {
      case 'Pending Fulfillment':
        return `${baseClasses} bg-amber-50 text-amber-700 border-amber-200`;
      case 'In Progress':
        return `${baseClasses} bg-blue-50 text-blue-700 border-blue-200`;
      case 'Shipped':
        return `${baseClasses} bg-emerald-50 text-emerald-700 border-emerald-200`;
      case 'Delivered':
        return `${baseClasses} bg-green-50 text-green-700 border-green-200`;
      default:
        return `${baseClasses} bg-slate-50 text-slate-700 border-slate-200`;
    }
  };

  const getPriorityBadge = (priority: Order['priority']) => {
    const baseClasses = 'px-3 py-1 rounded text-sm font-semibold border';
    switch (priority) {
      case 'Rush':
        return `${baseClasses} bg-red-50 text-red-700 border-red-200`;
      case 'Urgent':
        return `${baseClasses} bg-orange-50 text-orange-700 border-orange-200`;
      case 'Standard':
        return `${baseClasses} bg-slate-50 text-slate-700 border-slate-200`;
      default:
        return `${baseClasses} bg-slate-50 text-slate-700 border-slate-200`;
    }
  };

  const handleStatusChange = (newStatus: Order['status']) => {
    const updatedOrder = { ...currentOrder, status: newStatus };
    setCurrentOrder(updatedOrder);
    onUpdate(updatedOrder);
  };

  const handleShippingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const updatedOrder = {
      ...currentOrder,
      status: 'Shipped' as const,
      trackingNumber,
      carrier,
      shipDate,
      estimatedDelivery,
      notes,
      documents
    };
    
    setCurrentOrder(updatedOrder);
    onUpdate(updatedOrder);
    
    // Here you would typically send a notification to the doctor
    alert(`Order ${currentOrder.orderNumber} has been marked as shipped!\nTracking: ${trackingNumber}\nCarrier: ${carrier}\nExpected delivery: ${estimatedDelivery}`);
  };

  const handleDocumentUpload = (newDocument: any) => {
    const updatedDocuments = [...documents, newDocument];
    setDocuments(updatedDocuments);
  };

  const canProgress = () => {
    switch (currentOrder.status) {
      case 'Pending Fulfillment':
        return true;
      case 'In Progress':
        return trackingNumber && carrier && shipDate;
      case 'Shipped':
        return false;
      case 'Delivered':
        return false;
      default:
        return false;
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="pt-2 pb-6">
        <div className="flex items-center space-x-6">
          <button
            onClick={onBack}
            className="p-3 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all duration-200"
          >
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Order Details</h1>
            <p className="text-slate-600 mt-2 text-lg">{currentOrder.orderNumber} - Process and ship order</p>
          </div>
          <div className="flex items-center space-x-4">
            <span className={getStatusBadge(currentOrder.status)}>{currentOrder.status}</span>
            <span className={getPriorityBadge(currentOrder.priority)}>{currentOrder.priority}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Left Column - Order Summary */}
        <div className="space-y-8">
          {/* Order Information */}
          <Card className="bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
            <div className="px-8 py-6 border-b border-slate-200 bg-slate-50">
              <h3 className="text-xl font-bold text-slate-800">Order Summary</h3>
            </div>
            <div className="p-8">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Order Number</label>
                  <p className="text-lg font-bold text-slate-800 mt-1">{currentOrder.orderNumber}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Order Date</label>
                  <p className="text-lg font-semibold text-slate-800 mt-1">{currentOrder.date} at {currentOrder.time}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-500 uppercase tracking-wide">IVR Reference</label>
                  <p className="text-lg font-semibold text-slate-800 mt-1">{currentOrder.ivrReference}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Total Items</label>
                  <p className="text-lg font-bold text-slate-800 mt-1">{currentOrder.totalItems}</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Doctor Information */}
          <Card className="bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
            <div className="px-8 py-6 border-b border-slate-200 bg-slate-50">
              <h3 className="text-xl font-bold text-slate-800">Healthcare Provider</h3>
            </div>
            <div className="p-8 space-y-6">
              <div>
                <label className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Doctor</label>
                <p className="text-lg font-bold text-slate-800 mt-1">{currentOrder.doctor.name}</p>
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Facility</label>
                <p className="text-lg font-semibold text-slate-800 mt-1">{currentOrder.doctor.facility}</p>
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Email</label>
                <p className="text-base text-slate-600 mt-1">{currentOrder.doctor.email}</p>
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Patient</label>
                <p className="text-lg font-semibold text-slate-800 mt-1">
                  {currentOrder.patient.initials} 
                  <span className="text-slate-500 ml-2">({currentOrder.patient.patientId})</span>
                </p>
              </div>
            </div>
          </Card>

          {/* Shipping Address */}
          <Card className="bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
            <div className="px-8 py-6 border-b border-slate-200 bg-slate-50">
              <h3 className="text-xl font-bold text-slate-800">Shipping Address</h3>
            </div>
            <div className="p-8">
              <div className="space-y-3">
                <p className="text-lg font-bold text-slate-800">{currentOrder.shippingAddress.facility}</p>
                {currentOrder.shippingAddress.attention && (
                  <p className="text-base font-semibold text-slate-700">Attn: {currentOrder.shippingAddress.attention}</p>
                )}
                <p className="text-base text-slate-600">{currentOrder.shippingAddress.address}</p>
                <p className="text-base text-slate-600">
                  {currentOrder.shippingAddress.city}, {currentOrder.shippingAddress.state} {currentOrder.shippingAddress.zipCode}
                </p>
              </div>
            </div>
          </Card>

          {/* Products */}
          <Card className="bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
            <div className="px-8 py-6 border-b border-slate-200 bg-slate-50">
              <h3 className="text-xl font-bold text-slate-800">Products Ordered</h3>
            </div>
            <div className="p-8">
              <ProductDisplay products={currentOrder.products} />
            </div>
          </Card>
        </div>

        {/* Right Column - Fulfillment Actions */}
        <div className="space-y-8">
          {/* Status Actions */}
          <Card className="bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
            <div className="px-8 py-6 border-b border-slate-200 bg-slate-50">
              <h3 className="text-xl font-bold text-slate-800">Order Status Management</h3>
            </div>
            <div className="p-8">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Current Status</span>
                  <span className={getStatusBadge(currentOrder.status)}>{currentOrder.status}</span>
                </div>
                
                {currentOrder.status === 'Pending Fulfillment' && (
                  <button
                    onClick={() => handleStatusChange('In Progress')}
                    className="w-full border-2 border-slate-600 text-slate-600 bg-white hover:bg-slate-50 font-bold py-4 px-6 rounded-xl transition-all duration-200 ease-in-out hover:shadow-md"
                  >
                    Start Processing Order
                  </button>
                )}
              </div>
            </div>
          </Card>

          {/* Shipping Fulfillment Form */}
          {currentOrder.status === 'In Progress' && (
            <Card className="bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
              <div className="px-8 py-6 border-b border-slate-200 bg-slate-50">
                <h3 className="text-xl font-bold text-slate-800">Shipping Fulfillment</h3>
              </div>
              <div className="p-8">
                <form onSubmit={handleShippingSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-3">
                        Tracking Number *
                      </label>
                      <input
                        type="text"
                        value={trackingNumber}
                        onChange={(e) => setTrackingNumber(e.target.value)}
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors"
                        placeholder="Enter tracking number"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-3">
                        Carrier *
                      </label>
                      <select
                        value={carrier}
                        onChange={(e) => setCarrier(e.target.value)}
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors"
                        required
                      >
                        <option value="">Select carrier</option>
                        <option value="UPS">UPS</option>
                        <option value="FedEx">FedEx</option>
                        <option value="USPS">USPS</option>
                        <option value="DHL">DHL</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-3">
                        Ship Date *
                      </label>
                      <input
                        type="date"
                        value={shipDate}
                        onChange={(e) => setShipDate(e.target.value)}
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-3">
                        Estimated Delivery
                      </label>
                      <input
                        type="date"
                        value={estimatedDelivery}
                        onChange={(e) => setEstimatedDelivery(e.target.value)}
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-3">
                      Notes & Special Instructions
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={4}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors"
                      placeholder="Add any special handling notes or instructions"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={!canProgress()}
                    className="w-full border-2 border-emerald-600 text-emerald-600 bg-white hover:bg-emerald-50 disabled:border-slate-300 disabled:text-slate-400 disabled:bg-slate-50 font-bold py-4 px-6 rounded-xl transition-all duration-200 ease-in-out hover:shadow-md disabled:cursor-not-allowed"
                  >
                    Mark as Shipped & Notify Doctor
                  </button>
                </form>
              </div>
            </Card>
          )}

          {/* Document Upload */}
          <Card className="bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
            <div className="px-8 py-6 border-b border-slate-200 bg-slate-50">
              <h3 className="text-xl font-bold text-slate-800">Document Upload</h3>
            </div>
            <div className="p-8">
              <DocumentUpload 
                orderId={currentOrder.id}
                onDocumentUpload={handleDocumentUpload}
                existingDocuments={documents}
              />
            </div>
          </Card>

          {/* Shipping Information (if shipped) */}
          {currentOrder.status === 'Shipped' && (
            <Card className="bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
              <div className="px-8 py-6 border-b border-slate-200 bg-slate-50">
                <h3 className="text-xl font-bold text-slate-800">Shipping Information</h3>
              </div>
              <div className="p-8 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Tracking Number</label>
                    <p className="text-lg font-bold text-slate-800 font-mono mt-1">{currentOrder.trackingNumber}</p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Carrier</label>
                    <p className="text-lg font-semibold text-slate-800 mt-1">{currentOrder.carrier}</p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Ship Date</label>
                    <p className="text-lg font-semibold text-slate-800 mt-1">{currentOrder.shipDate}</p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Estimated Delivery</label>
                    <p className="text-lg font-semibold text-slate-800 mt-1">{currentOrder.estimatedDelivery}</p>
                  </div>
                </div>
                {currentOrder.notes && (
                  <div>
                    <label className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Notes</label>
                    <p className="text-base text-slate-600 mt-1">{currentOrder.notes}</p>
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderDetailsView; 