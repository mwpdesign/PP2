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
    image?: string;
    specialHandling?: string;
  }>;
  priority: 'Standard' | 'Urgent' | 'Rush';
  status: 'Pending Fulfillment' | 'Preparing for Ship' | 'Shipped' | 'Delivered';
  totalItems: number;
  trackingNumber?: string;
  carrier?: string;
  shipDate?: string;
  estimatedDelivery?: string;
  deliveredDate?: string;
  isOverdue?: boolean;
  notes?: string;
}

interface ApprovedIVR {
  id: string;
  patientName: string;
  patientId: string;
  submittedAt: string;
  approvedAt: string;
  type: string;
  priority: 'high' | 'medium' | 'low';
  products: Array<{
    id: string;
    name: string;
    description: string;
    quantity: number;
  }>;
  totalItems: number;
  canOrder: boolean;
}

// Mock data for doctor's orders (filtered for current doctor)
const mockDoctorOrders: Order[] = [
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
    id: 'ORD-2024-007',
    orderNumber: 'ORD-2024-007',
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
    status: 'Preparing for Ship',
    totalItems: 1
  },
  {
    id: 'ORD-2024-008',
    orderNumber: 'ORD-2024-008',
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
    status: 'Delivered',
    shipDate: '2024-12-18',
    estimatedDelivery: '2024-12-20',
    deliveredDate: '2024-12-20',
    trackingNumber: 'FEDEX123789456',
    carrier: 'FedEx',
    totalItems: 4
  }
];

// Mock approved IVRs ready for ordering
const mockApprovedIVRs: ApprovedIVR[] = [
  {
    id: 'IVR-2024-0897',
    patientName: 'Patient A.K.',
    patientId: 'PT-778901',
    submittedAt: '2024-12-19 08:30',
    approvedAt: '2024-12-19 11:00',
    type: 'Skin Graft Authorization',
    priority: 'high',
    products: [
      {
        id: 'SKIN-005',
        name: 'Advanced Healing Matrix',
        description: 'Bioengineered tissue matrix',
        quantity: 1
      }
    ],
    totalItems: 1,
    canOrder: true
  },
  {
    id: 'IVR-2024-0898',
    patientName: 'Patient L.W.',
    patientId: 'PT-889012',
    submittedAt: '2024-12-19 10:15',
    approvedAt: '2024-12-19 13:30',
    type: 'Wound Care Supplies',
    priority: 'medium',
    products: [
      {
        id: 'SKIN-006',
        name: 'Antimicrobial Gauze Set',
        description: 'Silver-infused antimicrobial gauze',
        quantity: 3
      }
    ],
    totalItems: 3,
    canOrder: true
  }
];

const DoctorOrderManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'orders' | 'place-order'>('orders');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [orders, setOrders] = useState<Order[]>(mockDoctorOrders);

  const filteredOrders = orders.filter(order => {
    const matchesSearch = searchTerm === '' || 
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.patient.patientId.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'All' || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const orderMetrics = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'Pending Fulfillment').length,
    preparing: orders.filter(o => o.status === 'Preparing for Ship').length,
    shipped: orders.filter(o => o.status === 'Shipped').length,
    delivered: orders.filter(o => o.status === 'Delivered').length
  };

  const getStatusBadge = (status: Order['status']) => {
    const baseClasses = 'px-3 py-1 rounded-full text-sm font-medium border';
    switch (status) {
      case 'Pending Fulfillment':
        return `${baseClasses} bg-amber-50 text-amber-700 border-amber-200`;
      case 'Preparing for Ship':
        return `${baseClasses} bg-blue-50 text-blue-700 border-blue-200`;
      case 'Shipped':
        return `${baseClasses} bg-green-50 text-green-700 border-green-200`;
      case 'Delivered':
        return `${baseClasses} bg-emerald-50 text-emerald-700 border-emerald-200`;
      default:
        return `${baseClasses} bg-slate-50 text-slate-700 border-slate-200`;
    }
  };

  const getPriorityBadge = (priority: string) => {
    const baseClasses = 'px-2 py-1 rounded text-xs font-medium border';
    switch (priority) {
      case 'Rush':
      case 'high':
        return `${baseClasses} bg-red-50 text-red-700 border-red-200`;
      case 'Urgent':
      case 'medium':
        return `${baseClasses} bg-orange-50 text-orange-700 border-orange-200`;
      case 'Standard':
      case 'low':
        return `${baseClasses} bg-slate-50 text-slate-700 border-slate-200`;
      default:
        return `${baseClasses} bg-slate-50 text-slate-700 border-slate-200`;
    }
  };

  const handlePlaceOrder = (ivr: ApprovedIVR) => {
    // Create new order from approved IVR
    const newOrder: Order = {
      id: `ORD-2024-${String(orders.length + 1).padStart(3, '0')}`,
      orderNumber: `ORD-2024-${String(orders.length + 1).padStart(3, '0')}`,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      patient: {
        initials: ivr.patientName.split(' ')[1] || ivr.patientName,
        patientId: ivr.patientId
      },
      ivrReference: ivr.id,
      products: ivr.products,
      priority: ivr.priority === 'high' ? 'Rush' : 'Standard',
      status: 'Pending Fulfillment',
      totalItems: ivr.totalItems
    };

    setOrders([newOrder, ...orders]);
    setActiveTab('orders');
    
    // Show success message
    alert(`Order ${newOrder.orderNumber} placed successfully!`);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="pt-1 pb-3">
        <div className="flex justify-between items-center mb-3">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 tracking-tight leading-tight">Order Management</h1>
            <p className="text-slate-600 mt-1 text-lg leading-normal">Manage your orders and place new orders from approved IVRs</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm px-4 py-2 border border-slate-200">
            <span className="text-sm font-medium text-slate-600">Total Orders: </span>
            <span className="text-xl font-bold text-slate-900">{orderMetrics.total}</span>
          </div>
        </div>

        {/* Order Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-amber-700 leading-tight">{orderMetrics.pending}</div>
            <div className="text-sm font-medium text-amber-600 mt-1">Pending</div>
            <div className="text-xs text-amber-500 mt-1">Being processed</div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-blue-700 leading-tight">{orderMetrics.preparing}</div>
            <div className="text-sm font-medium text-blue-600 mt-1">Preparing</div>
            <div className="text-xs text-blue-500 mt-1">Ready to ship</div>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-green-700 leading-tight">{orderMetrics.shipped}</div>
            <div className="text-sm font-medium text-green-600 mt-1">Shipped</div>
            <div className="text-xs text-green-500 mt-1">In transit</div>
          </div>
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-emerald-700 leading-tight">{orderMetrics.delivered}</div>
            <div className="text-sm font-medium text-emerald-600 mt-1">Delivered</div>
            <div className="text-xs text-emerald-500 mt-1">Received</div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-4">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('orders')}
              className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'orders'
                  ? 'border-[#2E86AB] text-[#2E86AB]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              My Orders
              <span className="ml-2 bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                {orders.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('place-order')}
              className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'place-order'
                  ? 'border-[#2E86AB] text-[#2E86AB]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Place New Order
              <span className="ml-2 bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                {mockApprovedIVRs.length}
              </span>
            </button>
          </nav>
        </div>

        {/* Filters (only show for orders tab) */}
        {activeTab === 'orders' && (
          <Card className="bg-white border border-slate-200 rounded-xl shadow-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Search Orders</label>
                <input
                  type="text"
                  placeholder="Search by order number or patient ID..."
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
                  <option value="Pending Fulfillment">Pending Fulfillment</option>
                  <option value="Preparing for Ship">Preparing for Ship</option>
                  <option value="Shipped">Shipped</option>
                  <option value="Delivered">Delivered</option>
                </select>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Content Area */}
      {activeTab === 'orders' && (
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
                  </div>
                  {order.status === 'Shipped' && (
                    <div className="text-sm">
                      <span className="text-green-600 font-medium">Tracking: {order.trackingNumber}</span>
                    </div>
                  )}
                </div>
                <div className="mt-2 flex items-center space-x-4 text-sm text-slate-600">
                  <span className="font-medium">Ordered: {order.date} at {order.time}</span>
                  {order.shipDate && (
                    <span className="font-medium">Shipped: {order.shipDate}</span>
                  )}
                  {order.estimatedDelivery && (
                    <span className="font-medium">Est. Delivery: {order.estimatedDelivery}</span>
                  )}
                </div>
              </div>

              {/* Order Content */}
              <div className="px-4 py-3">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
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
                    <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Shipping Status</h4>
                    <div className="space-y-1">
                      {order.carrier && order.trackingNumber && (
                        <p className="text-xs text-slate-600">
                          <span className="font-medium">Carrier:</span> {order.carrier}
                        </p>
                      )}
                      {order.trackingNumber && (
                        <p className="text-xs text-slate-600">
                          <span className="font-medium">Tracking:</span> {order.trackingNumber}
                        </p>
                      )}
                      {order.deliveredDate && (
                        <p className="text-xs text-emerald-600 font-medium">
                          Delivered: {order.deliveredDate}
                        </p>
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2 leading-tight">No Orders Found</h3>
              <p className="text-slate-600 text-base">No orders match your current search criteria</p>
            </Card>
          )}
        </div>
      )}

      {activeTab === 'place-order' && (
        <div className="space-y-3">
          <Card className="bg-white border border-slate-200 rounded-xl shadow-lg p-4 mb-4">
            <h3 className="text-lg font-semibold text-slate-800 mb-2">Approved IVRs Ready for Ordering</h3>
            <p className="text-slate-600 text-sm">Select an approved IVR to place an order</p>
          </Card>

          {mockApprovedIVRs.map((ivr) => (
            <Card key={ivr.id} className="bg-white border border-slate-200 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 ease-in-out">
              <div className="px-4 py-3 border-b border-slate-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <h3 className="text-lg font-bold text-slate-800 leading-tight">{ivr.id}</h3>
                    <span className="px-3 py-1 rounded-full text-sm font-medium border bg-green-50 text-green-700 border-green-200">
                      Approved
                    </span>
                    <span className={getPriorityBadge(ivr.priority)}>
                      {ivr.priority.charAt(0).toUpperCase() + ivr.priority.slice(1)}
                    </span>
                  </div>
                  <button
                    onClick={() => handlePlaceOrder(ivr)}
                    disabled={!ivr.canOrder}
                    className="bg-[#2E86AB] hover:bg-[#247297] text-white font-semibold py-2 px-6 rounded-lg transition-all duration-200 ease-in-out hover:shadow-md disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    Place Order
                  </button>
                </div>
                <div className="mt-2 flex items-center space-x-4 text-sm text-slate-600">
                  <span className="font-medium">Submitted: {ivr.submittedAt}</span>
                  <span className="font-medium">Approved: {ivr.approvedAt}</span>
                </div>
              </div>

              <div className="px-4 py-3">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Patient Information</h4>
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-slate-800">{ivr.patientName}</p>
                      <p className="text-xs text-slate-600">ID: {ivr.patientId}</p>
                      <p className="text-xs text-slate-600">Type: {ivr.type}</p>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Approved Products</h4>
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-slate-800">
                        {ivr.totalItems} item{ivr.totalItems !== 1 ? 's' : ''}
                      </p>
                      <div className="space-y-1">
                        {ivr.products.map(product => (
                          <div key={product.id} className="text-xs text-slate-600">
                            <span className="font-medium">{product.name}</span>
                            <span className="text-slate-500 ml-2">× {product.quantity}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}

          {mockApprovedIVRs.length === 0 && (
            <Card className="bg-white border border-slate-200 rounded-xl shadow-lg p-12 text-center">
              <div className="mx-auto w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2 leading-tight">No Approved IVRs</h3>
              <p className="text-slate-600 text-base">No approved IVRs are currently available for ordering</p>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

export default DoctorOrderManagement; 