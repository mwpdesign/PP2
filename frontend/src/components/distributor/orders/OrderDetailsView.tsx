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
  status: 'Pending Fulfillment' | 'Processed' | 'Ready to Ship' | 'Shipped' | 'Delivered';
  totalItems: number;
  trackingNumber?: string;
  carrier?: string;
  shipDate?: string;
  estimatedDelivery?: string;
  deliveredDate?: string;
  processedDate?: string;
  readyToShipDate?: string;
  isOverdue?: boolean;
  deliveryIssues?: string;
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
      case 'Processed':
        return `${baseClasses} bg-blue-50 text-blue-700 border-blue-200`;
      case 'Ready to Ship':
        return `${baseClasses} bg-purple-50 text-purple-700 border-purple-200`;
      case 'Shipped':
        return `${baseClasses} bg-green-50 text-green-700 border-green-200`;
      case 'Delivered':
        return `${baseClasses} bg-emerald-50 text-emerald-700 border-emerald-200`;
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
    const now = new Date().toISOString().split('T')[0];
    const updates: Partial<Order> = { status: newStatus };
    
    switch (newStatus) {
      case 'Processed':
        updates.processedDate = now;
        break;
      case 'Ready to Ship':
        updates.readyToShipDate = now;
        break;
      case 'Shipped':
        updates.shipDate = now;
        // Auto-calculate estimated delivery (2 days from ship date)
        const shipDate = new Date();
        shipDate.setDate(shipDate.getDate() + 2);
        updates.estimatedDelivery = shipDate.toISOString().split('T')[0];
        break;
      case 'Delivered':
        updates.deliveredDate = now;
        break;
    }
    
    const updatedOrder = { ...currentOrder, ...updates };
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
    
    // Simulate doctor notification
    alert(`Order ${currentOrder.orderNumber} has been marked as shipped!
    
Doctor Notification Sent:
✓ Email sent to ${currentOrder.doctor.email}
✓ In-app notification created
✓ Tracking details included: ${carrier} ${trackingNumber}
✓ Expected delivery: ${estimatedDelivery}
✓ ${documents.length} document(s) attached
    
The doctor can now track the shipment and will be notified of any delivery issues.`);
  };

  const handleDocumentUpload = (newDocument: any) => {
    const updatedDocuments = [...documents, newDocument];
    setDocuments(updatedDocuments);
  };

  const handleReportDeliveryIssue = () => {
    const issue = prompt('Describe the delivery issue:');
    if (issue) {
      const updatedOrder = { 
        ...currentOrder, 
        deliveryIssues: issue,
        // Keep as shipped if there are issues
        status: 'Shipped' as const
      };
      setCurrentOrder(updatedOrder);
      onUpdate(updatedOrder);
      
      alert('Delivery issue reported. Order status maintained as "Shipped" pending resolution.');
    }
  };

  const canProgressToNextStage = () => {
    switch (currentOrder.status) {
      case 'Pending Fulfillment':
        return true;
      case 'Processed':
        return true;
      case 'Ready to Ship':
        return trackingNumber && carrier && shipDate;
      case 'Shipped':
      case 'Delivered':
        return false;
      default:
        return false;
    }
  };

  const getNextStageButton = () => {
    switch (currentOrder.status) {
      case 'Pending Fulfillment':
        return (
          <button
            onClick={() => handleStatusChange('Processed')}
            className="w-full border-2 border-blue-600 text-blue-600 bg-white hover:bg-blue-50 font-bold py-4 px-6 rounded-xl transition-all duration-200 ease-in-out hover:shadow-md"
          >
            Mark as Processed
          </button>
        );
      case 'Processed':
        return (
          <button
            onClick={() => handleStatusChange('Ready to Ship')}
            className="w-full border-2 border-purple-600 text-purple-600 bg-white hover:bg-purple-50 font-bold py-4 px-6 rounded-xl transition-all duration-200 ease-in-out hover:shadow-md"
          >
            Mark Ready to Ship
          </button>
        );
      case 'Ready to Ship':
        return null; // Show shipping form instead
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="pt-1 pb-3">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all duration-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-slate-800 tracking-tight leading-tight">Order Details</h1>
            <p className="text-slate-600 mt-1 text-lg leading-normal">{currentOrder.orderNumber} - Process and ship order</p>
          </div>
          <div className="flex items-center space-x-3">
            <span className={getStatusBadge(currentOrder.status)}>{currentOrder.status}</span>
            <span className={getPriorityBadge(currentOrder.priority)}>{currentOrder.priority}</span>
            {currentOrder.isOverdue && (
              <span className="px-2 py-1 rounded-full text-xs font-medium border bg-red-100 text-red-700 border-red-300">
                OVERDUE
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Left Column - Order Summary */}
        <div className="space-y-4">
          {/* Order Information */}
          <Card className="bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
              <h3 className="text-lg font-bold text-slate-800 leading-tight">Order Summary</h3>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Order Number</label>
                  <p className="text-base font-bold text-slate-800 mt-1 leading-tight">{currentOrder.orderNumber}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Order Date</label>
                  <p className="text-base font-semibold text-slate-800 mt-1 leading-tight">{currentOrder.date} at {currentOrder.time}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">IVR Reference</label>
                  <p className="text-base font-semibold text-slate-800 mt-1 leading-tight">{currentOrder.ivrReference}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Total Items</label>
                  <p className="text-base font-bold text-slate-800 mt-1 leading-tight">{currentOrder.totalItems}</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Workflow Timeline */}
          <Card className="bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
              <h3 className="text-lg font-bold text-slate-800 leading-tight">Workflow Timeline</h3>
            </div>
            <div className="p-4">
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${currentOrder.status !== 'Pending Fulfillment' ? 'bg-blue-500' : 'bg-slate-300'}`}></div>
                  <div className="flex-1">
                    <span className="font-semibold text-slate-800 text-sm">Order Placed</span>
                    <p className="text-xs text-slate-600">{currentOrder.date} at {currentOrder.time}</p>
                  </div>
                </div>
                
                {currentOrder.processedDate && (
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${['Processed', 'Ready to Ship', 'Shipped', 'Delivered'].includes(currentOrder.status) ? 'bg-blue-500' : 'bg-slate-300'}`}></div>
                    <div className="flex-1">
                      <span className="font-semibold text-slate-800 text-sm">Processed</span>
                      <p className="text-xs text-slate-600">{currentOrder.processedDate}</p>
                    </div>
                  </div>
                )}
                
                {currentOrder.readyToShipDate && (
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${['Ready to Ship', 'Shipped', 'Delivered'].includes(currentOrder.status) ? 'bg-purple-500' : 'bg-slate-300'}`}></div>
                    <div className="flex-1">
                      <span className="font-semibold text-slate-800 text-sm">Ready to Ship</span>
                      <p className="text-xs text-slate-600">{currentOrder.readyToShipDate}</p>
                    </div>
                  </div>
                )}
                
                {currentOrder.shipDate && (
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${['Shipped', 'Delivered'].includes(currentOrder.status) ? 'bg-green-500' : 'bg-slate-300'}`}></div>
                    <div className="flex-1">
                      <span className="font-semibold text-slate-800 text-sm">Shipped</span>
                      <p className="text-xs text-slate-600">{currentOrder.shipDate}</p>
                      {currentOrder.trackingNumber && (
                        <p className="text-xs text-slate-500 font-mono">{currentOrder.carrier}: {currentOrder.trackingNumber}</p>
                      )}
                    </div>
                  </div>
                )}
                
                {currentOrder.deliveredDate && (
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                    <div className="flex-1">
                      <span className="font-semibold text-slate-800 text-sm">Delivered</span>
                      <p className="text-xs text-slate-600">{currentOrder.deliveredDate}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Doctor Information */}
          <Card className="bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
              <h3 className="text-lg font-bold text-slate-800 leading-tight">Healthcare Provider</h3>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Doctor</label>
                <p className="text-base font-bold text-slate-800 mt-1 leading-tight">{currentOrder.doctor.name}</p>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Facility</label>
                <p className="text-base font-semibold text-slate-800 mt-1 leading-tight">{currentOrder.doctor.facility}</p>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Email</label>
                <p className="text-sm text-slate-600 mt-1">{currentOrder.doctor.email}</p>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Patient</label>
                <p className="text-base font-semibold text-slate-800 mt-1 leading-tight">
                  {currentOrder.patient.initials} 
                  <span className="text-slate-500 ml-2">({currentOrder.patient.patientId})</span>
                </p>
              </div>
            </div>
          </Card>

          {/* Shipping Address */}
          <Card className="bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
              <h3 className="text-lg font-bold text-slate-800 leading-tight">Shipping Address</h3>
            </div>
            <div className="p-4">
              <div className="space-y-2">
                <p className="text-base font-bold text-slate-800 leading-tight">{currentOrder.shippingAddress.facility}</p>
                {currentOrder.shippingAddress.attention && (
                  <p className="text-sm font-semibold text-slate-700">Attn: {currentOrder.shippingAddress.attention}</p>
                )}
                <p className="text-sm text-slate-600">{currentOrder.shippingAddress.address}</p>
                <p className="text-sm text-slate-600">
                  {currentOrder.shippingAddress.city}, {currentOrder.shippingAddress.state} {currentOrder.shippingAddress.zipCode}
                </p>
              </div>
            </div>
          </Card>

          {/* Products */}
          <Card className="bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
              <h3 className="text-lg font-bold text-slate-800 leading-tight">Products Ordered</h3>
            </div>
            <div className="p-4">
              <ProductDisplay products={currentOrder.products} />
            </div>
          </Card>
        </div>

        {/* Right Column - Fulfillment Actions */}
        <div className="space-y-4">
          {/* Status Actions */}
          <Card className="bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
              <h3 className="text-lg font-bold text-slate-800 leading-tight">Order Status Management</h3>
            </div>
            <div className="p-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Current Status</span>
                  <span className={getStatusBadge(currentOrder.status)}>{currentOrder.status}</span>
                </div>
                
                {getNextStageButton()}
                
                {currentOrder.status === 'Shipped' && (
                  <button
                    onClick={handleReportDeliveryIssue}
                    className="w-full border-2 border-orange-600 text-orange-600 bg-white hover:bg-orange-50 font-bold py-3 px-4 rounded-xl transition-all duration-200 ease-in-out hover:shadow-md"
                  >
                    Report Delivery Issue
                  </button>
                )}
              </div>
            </div>
          </Card>

          {/* Shipping Fulfillment Form */}
          {currentOrder.status === 'Ready to Ship' && (
            <Card className="bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
                <h3 className="text-lg font-bold text-slate-800 leading-tight">Shipping Fulfillment</h3>
              </div>
              <div className="p-4">
                <form onSubmit={handleShippingSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">
                        Tracking Number *
                      </label>
                      <input
                        type="text"
                        value={trackingNumber}
                        onChange={(e) => setTrackingNumber(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors"
                        placeholder="Enter tracking number"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">
                        Carrier *
                      </label>
                      <select
                        value={carrier}
                        onChange={(e) => setCarrier(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors"
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
                      <label className="block text-sm font-bold text-slate-700 mb-2">
                        Ship Date *
                      </label>
                      <input
                        type="date"
                        value={shipDate}
                        onChange={(e) => setShipDate(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">
                        Estimated Delivery
                      </label>
                      <input
                        type="date"
                        value={estimatedDelivery}
                        onChange={(e) => setEstimatedDelivery(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      Notes & Special Instructions
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors"
                      placeholder="Add any special handling notes or instructions"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={!canProgressToNextStage()}
                    className="w-full border-2 border-emerald-600 text-emerald-600 bg-white hover:bg-emerald-50 disabled:border-slate-300 disabled:text-slate-400 disabled:bg-slate-50 font-bold py-3 px-4 rounded-xl transition-all duration-200 ease-in-out hover:shadow-md disabled:cursor-not-allowed"
                  >
                    Ship Order & Notify Doctor
                  </button>
                </form>
              </div>
            </Card>
          )}

          {/* Document Upload */}
          <Card className="bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
              <h3 className="text-lg font-bold text-slate-800 leading-tight">Document Upload</h3>
            </div>
            <div className="p-4">
              <DocumentUpload 
                orderId={currentOrder.id}
                onDocumentUpload={handleDocumentUpload}
                existingDocuments={documents}
              />
            </div>
          </Card>

          {/* Shipping Information (if shipped) */}
          {['Shipped', 'Delivered'].includes(currentOrder.status) && (
            <Card className="bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
                <h3 className="text-lg font-bold text-slate-800 leading-tight">Shipping Information</h3>
              </div>
              <div className="p-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Tracking Number</label>
                    <p className="text-base font-bold text-slate-800 font-mono mt-1 leading-tight">{currentOrder.trackingNumber}</p>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Carrier</label>
                    <p className="text-base font-semibold text-slate-800 mt-1 leading-tight">{currentOrder.carrier}</p>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Ship Date</label>
                    <p className="text-base font-semibold text-slate-800 mt-1 leading-tight">{currentOrder.shipDate}</p>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Estimated Delivery</label>
                    <p className="text-base font-semibold text-slate-800 mt-1 leading-tight">{currentOrder.estimatedDelivery}</p>
                  </div>
                </div>
                {currentOrder.deliveredDate && (
                  <div className="pt-3 border-t border-slate-200">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Delivered Date</label>
                    <p className="text-base font-semibold text-emerald-600 mt-1 leading-tight">{currentOrder.deliveredDate}</p>
                  </div>
                )}
                {currentOrder.notes && (
                  <div className="pt-3 border-t border-slate-200">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Notes</label>
                    <p className="text-sm text-slate-600 mt-1">{currentOrder.notes}</p>
                  </div>
                )}
                {currentOrder.deliveryIssues && (
                  <div className="pt-3 border-t border-slate-200">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Delivery Issues</label>
                    <div className="mt-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                      <p className="text-sm text-orange-800">{currentOrder.deliveryIssues}</p>
                    </div>
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