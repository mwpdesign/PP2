import React, { useState } from 'react';
import { Card } from '../shared/ui/Card';

interface Order {
  id: string;
  orderNumber: string;
  date: string;
  time: string;
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
    specialHandling?: string;
  }>;
  priority: 'Standard' | 'Urgent' | 'Rush';
  status: 'Shipped' | 'Delivered';
  totalItems: number;
  trackingNumber: string;
  carrier: string;
  shipDate: string;
  estimatedDelivery: string;
  deliveredDate?: string;
  receivedDate?: string;
  isOverdue?: boolean;
  deliveryIssues?: string;
  notes?: string;
}

interface DeliveryConfirmation {
  orderId: string;
  receivedDate: string;
  condition: 'good' | 'damaged' | 'partial';
  notes?: string;
  issues?: string;
}

// Mock data for doctor's shipped/delivered orders
const mockShippedOrders: Order[] = [
  {
    id: 'ORD-2024-001',
    orderNumber: 'ORD-2024-001',
    date: '2024-12-19',
    time: '09:15 AM',
    patient: {
      initials: 'J.D.',
      patientId: 'PT-445782'
    },
    ivrReference: 'IVR-2024-0892',
    products: [
      {
        id: 'SKIN-001',
        name: 'Advanced Wound Dressing Kit',
        description: 'Premium biocompatible wound care system',
        quantity: 2,
        specialHandling: 'Temperature sensitive - store below 25°C'
      }
    ],
    priority: 'Urgent',
    status: 'Shipped',
    shipDate: '2024-12-20',
    estimatedDelivery: '2024-12-22',
    trackingNumber: 'UPS789456123',
    carrier: 'UPS',
    totalItems: 2
  },
  {
    id: 'ORD-2024-003',
    orderNumber: 'ORD-2024-003',
    date: '2024-12-18',
    time: '02:30 PM',
    patient: {
      initials: 'S.M.',
      patientId: 'PT-556891'
    },
    ivrReference: 'IVR-2024-0895',
    products: [
      {
        id: 'SKIN-003',
        name: 'Collagen Matrix Implant',
        description: 'Bioengineered collagen scaffolding',
        quantity: 1
      }
    ],
    priority: 'Standard',
    status: 'Delivered',
    shipDate: '2024-12-19',
    estimatedDelivery: '2024-12-21',
    deliveredDate: '2024-12-21',
    receivedDate: '2024-12-21',
    trackingNumber: 'FEDEX456789123',
    carrier: 'FedEx',
    totalItems: 1
  },
  {
    id: 'ORD-2024-004',
    orderNumber: 'ORD-2024-004',
    date: '2024-12-17',
    time: '11:45 AM',
    patient: {
      initials: 'M.R.',
      patientId: 'PT-667234'
    },
    ivrReference: 'IVR-2024-0896',
    products: [
      {
        id: 'SKIN-004',
        name: 'Hydrogel Wound Patches',
        description: 'Advanced hydrogel technology',
        quantity: 4
      }
    ],
    priority: 'Rush',
    status: 'Shipped',
    shipDate: '2024-12-18',
    estimatedDelivery: '2024-12-20',
    trackingNumber: 'UPS123456789',
    carrier: 'UPS',
    totalItems: 4,
    isOverdue: true
  },
  {
    id: 'ORD-2024-005',
    orderNumber: 'ORD-2024-005',
    date: '2024-12-16',
    time: '08:20 AM',
    patient: {
      initials: 'A.K.',
      patientId: 'PT-778901'
    },
    ivrReference: 'IVR-2024-0897',
    products: [
      {
        id: 'SKIN-005',
        name: 'Advanced Healing Matrix',
        description: 'Bioengineered tissue matrix',
        quantity: 1
      }
    ],
    priority: 'Standard',
    status: 'Delivered',
    shipDate: '2024-12-17',
    estimatedDelivery: '2024-12-19',
    deliveredDate: '2024-12-19',
    receivedDate: '2024-12-19',
    trackingNumber: 'FEDEX789123456',
    carrier: 'FedEx',
    totalItems: 1,
    deliveryIssues: 'Package was left at reception instead of secure medical storage'
  }
];

const DoctorShippingLogistics: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>(mockShippedOrders);
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState<Order | null>(null);
  const [showIssueModal, setShowIssueModal] = useState<Order | null>(null);

  const filteredOrders = orders.filter(order => {
    const matchesSearch = searchTerm === '' || 
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.patient.patientId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.trackingNumber.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'All' || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const shippingMetrics = {
    total: orders.length,
    shipped: orders.filter(o => o.status === 'Shipped').length,
    delivered: orders.filter(o => o.status === 'Delivered').length,
    overdue: orders.filter(o => o.isOverdue).length,
    withIssues: orders.filter(o => o.deliveryIssues).length
  };

  const getStatusBadge = (status: Order['status']) => {
    const baseClasses = 'px-3 py-1 rounded-full text-sm font-medium border';
    switch (status) {
      case 'Shipped':
        return `${baseClasses} bg-blue-50 text-blue-700 border-blue-200`;
      case 'Delivered':
        return `${baseClasses} bg-emerald-50 text-emerald-700 border-emerald-200`;
      default:
        return `${baseClasses} bg-slate-50 text-slate-700 border-slate-200`;
    }
  };

  const getPriorityBadge = (priority: Order['priority']) => {
    const baseClasses = 'px-2 py-1 rounded text-xs font-medium border';
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

  const handleMarkAsReceived = (order: Order) => {
    const now = new Date().toISOString().split('T')[0];
    setOrders(orders.map(o => 
      o.id === order.id 
        ? { ...o, status: 'Delivered' as const, receivedDate: now, deliveredDate: now }
        : o
    ));
    setShowConfirmModal(null);
    alert(`Order ${order.orderNumber} marked as received successfully!`);
  };

  const handleReportIssue = (order: Order, issueDescription: string) => {
    setOrders(orders.map(o => 
      o.id === order.id 
        ? { ...o, deliveryIssues: issueDescription }
        : o
    ));
    setShowIssueModal(null);
    alert(`Delivery issue reported for order ${order.orderNumber}`);
  };

  const DeliveryConfirmationModal: React.FC<{ order: Order; onConfirm: () => void; onCancel: () => void }> = ({ order, onConfirm, onCancel }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full m-4">
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="text-xl font-bold text-slate-800">Confirm Delivery Receipt</h2>
        </div>
        <div className="p-6">
          <p className="text-slate-600 mb-4">
            Please confirm that you have received order <strong>{order.orderNumber}</strong> in good condition.
          </p>
          <div className="bg-slate-50 rounded-lg p-4 mb-4">
            <h4 className="font-semibold text-slate-800 mb-2">Order Details:</h4>
            <p className="text-sm text-slate-600">Patient: {order.patient.initials} ({order.patient.patientId})</p>
            <p className="text-sm text-slate-600">Products: {order.totalItems} item{order.totalItems !== 1 ? 's' : ''}</p>
            <p className="text-sm text-slate-600">Tracking: {order.trackingNumber}</p>
          </div>
        </div>
        <div className="flex justify-end space-x-3 px-6 py-4 border-t border-slate-200">
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-[#2E86AB] text-white rounded-lg hover:bg-[#247297] font-medium transition-colors"
          >
            Confirm Receipt
          </button>
        </div>
      </div>
    </div>
  );

  const DeliveryIssueModal: React.FC<{ order: Order; onReport: (issue: string) => void; onCancel: () => void }> = ({ order, onReport, onCancel }) => {
    const [issueDescription, setIssueDescription] = useState('');
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl shadow-xl max-w-md w-full m-4">
          <div className="px-6 py-4 border-b border-slate-200">
            <h2 className="text-xl font-bold text-slate-800">Report Delivery Issue</h2>
          </div>
          <div className="p-6">
            <p className="text-slate-600 mb-4">
              Report an issue with order <strong>{order.orderNumber}</strong>:
            </p>
            <textarea
              value={issueDescription}
              onChange={(e) => setIssueDescription(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2E86AB] focus:border-[#2E86AB]"
              rows={4}
              placeholder="Describe the delivery issue (e.g., damaged packaging, missing items, delivery location problems, etc.)"
              required
            />
          </div>
          <div className="flex justify-end space-x-3 px-6 py-4 border-t border-slate-200">
            <button
              onClick={onCancel}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => issueDescription.trim() && onReport(issueDescription)}
              disabled={!issueDescription.trim()}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Report Issue
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Modals */}
      {showConfirmModal && (
        <DeliveryConfirmationModal 
          order={showConfirmModal}
          onConfirm={() => handleMarkAsReceived(showConfirmModal)}
          onCancel={() => setShowConfirmModal(null)}
        />
      )}
      
      {showIssueModal && (
        <DeliveryIssueModal 
          order={showIssueModal}
          onReport={(issue) => handleReportIssue(showIssueModal, issue)}
          onCancel={() => setShowIssueModal(null)}
        />
      )}

      {/* Header */}
      <div className="pt-1 pb-3">
        <div className="flex justify-between items-center mb-3">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 tracking-tight leading-tight">Shipping & Logistics</h1>
            <p className="text-slate-600 mt-1 text-lg leading-normal">Track your shipments and confirm deliveries</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm px-4 py-2 border border-slate-200">
            <span className="text-sm font-medium text-slate-600">Total Shipments: </span>
            <span className="text-xl font-bold text-slate-900">{shippingMetrics.total}</span>
          </div>
        </div>

        {/* Shipping Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-blue-700 leading-tight">{shippingMetrics.shipped}</div>
            <div className="text-sm font-medium text-blue-600 mt-1">In Transit</div>
            <div className="text-xs text-blue-500 mt-1">Currently shipping</div>
          </div>
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-emerald-700 leading-tight">{shippingMetrics.delivered}</div>
            <div className="text-sm font-medium text-emerald-600 mt-1">Delivered</div>
            <div className="text-xs text-emerald-500 mt-1">Successfully received</div>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-red-700 leading-tight">{shippingMetrics.overdue}</div>
            <div className="text-sm font-medium text-red-600 mt-1">Overdue</div>
            <div className="text-xs text-red-500 mt-1">Past delivery date</div>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-amber-700 leading-tight">{shippingMetrics.withIssues}</div>
            <div className="text-sm font-medium text-amber-600 mt-1">With Issues</div>
            <div className="text-xs text-amber-500 mt-1">Delivery problems</div>
          </div>
        </div>

        {/* Filters */}
        <Card className="bg-white border border-slate-200 rounded-xl shadow-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Search Shipments</label>
              <input
                type="text"
                placeholder="Search by order number, patient ID, or tracking..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2E86AB] focus:border-[#2E86AB]"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Status Filter</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2E86AB] focus:border-[#2E86AB]"
              >
                <option value="All">All Statuses</option>
                <option value="Shipped">In Transit</option>
                <option value="Delivered">Delivered</option>
              </select>
            </div>
          </div>
        </Card>
      </div>

      {/* Orders List */}
      <div className="space-y-3">
        {filteredOrders.map((order) => (
          <Card key={order.id} className="bg-white border border-slate-200 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 ease-in-out">
            {/* Order Header */}
            <div className="px-4 py-3 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <h3 className="text-lg font-bold text-slate-800 leading-tight">{order.orderNumber}</h3>
                  <span className={getStatusBadge(order.status)}>{order.status}</span>
                  <span className={getPriorityBadge(order.priority)}>{order.priority}</span>
                  {order.isOverdue && (
                    <span className="px-2 py-1 rounded text-xs font-medium border bg-red-50 text-red-700 border-red-200">
                      Overdue
                    </span>
                  )}
                  {order.deliveryIssues && (
                    <span className="px-2 py-1 rounded text-xs font-medium border bg-amber-50 text-amber-700 border-amber-200">
                      Issue Reported
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  {order.status === 'Shipped' && (
                    <>
                      <button
                        onClick={() => setShowConfirmModal(order)}
                        className="bg-[#2E86AB] hover:bg-[#247297] text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 ease-in-out hover:shadow-md text-sm"
                      >
                        Mark as Received
                      </button>
                      <button
                        onClick={() => setShowIssueModal(order)}
                        className="border border-red-600 text-red-600 hover:bg-red-50 font-semibold py-2 px-4 rounded-lg transition-all duration-200 ease-in-out text-sm"
                      >
                        Report Issue
                      </button>
                    </>
                  )}
                  {order.status === 'Delivered' && order.deliveryIssues && (
                    <button
                      onClick={() => setShowIssueModal(order)}
                      className="border border-amber-600 text-amber-600 hover:bg-amber-50 font-semibold py-2 px-4 rounded-lg transition-all duration-200 ease-in-out text-sm"
                    >
                      Update Issue
                    </button>
                  )}
                </div>
              </div>
              <div className="mt-2 flex items-center space-x-4 text-sm text-slate-600">
                <span className="font-medium">Shipped: {order.shipDate}</span>
                <span className="font-medium">Est. Delivery: {order.estimatedDelivery}</span>
                {order.deliveredDate && (
                  <span className="font-medium text-emerald-600">Delivered: {order.deliveredDate}</span>
                )}
                {order.receivedDate && (
                  <span className="font-medium text-emerald-600">Received: {order.receivedDate}</span>
                )}
              </div>
            </div>

            {/* Order Content */}
            <div className="px-4 py-3">
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                {/* Patient Info */}
                <div>
                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Patient Information</h4>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-slate-800">
                      Patient: {order.patient.initials}
                    </p>
                    <p className="text-xs text-slate-600">ID: {order.patient.patientId}</p>
                    <p className="text-xs text-slate-600">IVR: {order.ivrReference}</p>
                  </div>
                </div>

                {/* Products */}
                <div>
                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Products</h4>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-slate-800">
                      {order.totalItems} item{order.totalItems !== 1 ? 's' : ''}
                    </p>
                    <div className="space-y-1">
                      {order.products.map(product => (
                        <div key={product.id} className="text-xs text-slate-600">
                          <span className="font-medium">{product.name}</span>
                          <span className="text-slate-500 ml-2">× {product.quantity}</span>
                          {product.specialHandling && (
                            <div className="text-xs text-amber-600 mt-1 flex items-center">
                              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                              </svg>
                              {product.specialHandling}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Shipping Info */}
                <div>
                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Shipping Details</h4>
                  <div className="space-y-1">
                    <p className="text-xs text-slate-600">
                      <span className="font-medium">Carrier:</span> {order.carrier}
                    </p>
                    <p className="text-xs text-slate-600">
                      <span className="font-medium">Tracking:</span> {order.trackingNumber}
                    </p>
                    <a 
                      href={`#tracking-${order.trackingNumber}`} 
                      className="text-xs text-[#2E86AB] hover:underline font-medium"
                      onClick={(e) => {
                        e.preventDefault();
                        alert(`Track package: ${order.trackingNumber} with ${order.carrier}`);
                      }}
                    >
                      Track Package →
                    </a>
                  </div>
                </div>

                {/* Delivery Issues */}
                <div>
                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Delivery Status</h4>
                  <div className="space-y-1">
                    {order.deliveryIssues ? (
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-2">
                        <p className="text-xs font-medium text-amber-700 mb-1">Issue Reported:</p>
                        <p className="text-xs text-amber-600">{order.deliveryIssues}</p>
                      </div>
                    ) : order.status === 'Delivered' ? (
                      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2">
                        <p className="text-xs font-medium text-emerald-700">✓ Delivered Successfully</p>
                        <p className="text-xs text-emerald-600">No issues reported</p>
                      </div>
                    ) : (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-2">
                        <p className="text-xs font-medium text-blue-700">📦 In Transit</p>
                        <p className="text-xs text-blue-600">Expected: {order.estimatedDelivery}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))}

        {filteredOrders.length === 0 && (
          <Card className="bg-white border border-slate-200 rounded-xl shadow-lg p-12 text-center">
            <div className="mx-auto w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2v0a2 2 0 01-2-2v-2a2 2 0 00-2-2H8z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2 leading-tight">No Shipments Found</h3>
            <p className="text-slate-600 text-base">No shipments match your current search criteria</p>
          </Card>
        )}
      </div>
    </div>
  );
};

export default DoctorShippingLogistics; 