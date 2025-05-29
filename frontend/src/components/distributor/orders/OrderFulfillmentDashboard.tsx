import React, { useState, useEffect } from 'react';
import { Card } from '../../shared/ui/Card';
import OrderDetailsView from './OrderDetailsView';

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
  status: 'Pending Fulfillment' | 'Preparing for Ship' | 'Shipped' | 'Delivered';
  totalItems: number;
  trackingNumber?: string;
  carrier?: string;
  shipDate?: string;
  estimatedDelivery?: string;
  deliveredDate?: string;
  preparingDate?: string;
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

interface ShippingFormData {
  carrier: string;
  trackingNumber: string;
  estimatedDelivery: string;
  notes: string;
  documents: File[];
}

// Mock data with updated workflow statuses
const mockOrders: Order[] = [
  {
    id: 'ORD-2024-001',
    orderNumber: 'ORD-2024-001',
    date: '2024-12-19',
    time: '09:15 AM',
    doctor: {
      name: 'Dr. Sarah Chen',
      facility: 'Metro General Hospital',
      email: 'sarah.chen@metro.health'
    },
    patient: {
      initials: 'J.D.',
      patientId: 'PT-445782'
    },
    ivrReference: 'IVR-2024-0892',
    products: [
      {
        id: 'SKIN-001',
        name: 'Advanced Wound Dressing Kit',
        description: 'Premium biocompatible wound care system with antimicrobial properties',
        quantity: 2,
        image: '/api/placeholder/80/80',
        specialHandling: 'Temperature sensitive - store below 25°C'
      },
      {
        id: 'SKIN-002', 
        name: 'Skin Graft Bar Code Labels',
        description: 'Sterile tracking labels for skin graft procedures',
        quantity: 1,
        image: '/api/placeholder/80/80'
      }
    ],
    shippingAddress: {
      facility: 'Metro General Hospital',
      address: '1500 Medical Center Drive',
      city: 'Austin',
      state: 'TX',
      zipCode: '78712',
      attention: 'Dr. Sarah Chen - Wound Care Unit'
    },
    priority: 'Urgent',
    status: 'Pending Fulfillment',
    totalItems: 3
  },
  {
    id: 'ORD-2024-002',
    orderNumber: 'ORD-2024-002',
    date: '2024-12-19',
    time: '10:30 AM',
    doctor: {
      name: 'Dr. Michael Rodriguez',
      facility: 'St. Mary\'s Medical Center',
      email: 'michael.rodriguez@stmarys.org'
    },
    patient: {
      initials: 'M.S.',
      patientId: 'PT-556891'
    },
    ivrReference: 'IVR-2024-0893',
    products: [
      {
        id: 'SKIN-003',
        name: 'Collagen Matrix Implant',
        description: 'Bioengineered collagen scaffolding for tissue regeneration',
        quantity: 1,
        image: '/api/placeholder/80/80',
        specialHandling: 'Refrigerated storage required'
      }
    ],
    shippingAddress: {
      facility: 'St. Mary\'s Medical Center',
      address: '900 E 30th Street',
      city: 'Austin',
      state: 'TX',
      zipCode: '78705',
      attention: 'Dr. Michael Rodriguez - Surgery Department'
    },
    priority: 'Standard',
    status: 'Preparing for Ship',
    preparingDate: '2024-12-19',
    totalItems: 1
  },
  {
    id: 'ORD-2024-004',
    orderNumber: 'ORD-2024-004',
    date: '2024-12-17',
    time: '11:20 AM',
    doctor: {
      name: 'Dr. James Wilson',
      facility: 'Central Texas Medical',
      email: 'james.wilson@centraltx.com'
    },
    patient: {
      initials: 'A.M.',
      patientId: 'PT-778234'
    },
    ivrReference: 'IVR-2024-0890',
    products: [
      {
        id: 'SKIN-005',
        name: 'Antimicrobial Gauze Set',
        description: 'Silver-infused antimicrobial gauze for infection prevention',
        quantity: 3,
        image: '/api/placeholder/80/80'
      }
    ],
    shippingAddress: {
      facility: 'Central Texas Medical',
      address: '2400 Medical Plaza Dr',
      city: 'Austin',
      state: 'TX',
      zipCode: '78731',
      attention: 'Dr. James Wilson - Wound Care'
    },
    priority: 'Rush',
    status: 'Shipped',
    preparingDate: '2024-12-17',
    shipDate: '2024-12-18',
    estimatedDelivery: '2024-12-20',
    trackingNumber: 'UPS789456123',
    carrier: 'UPS',
    totalItems: 3
  }
];

// Shipping Form Component
const ShippingForm: React.FC<{
  order: Order;
  onSubmit: (order: Order, shippingData: ShippingFormData) => void;
  onCancel: () => void;
}> = ({ order, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState<ShippingFormData>({
    carrier: '',
    trackingNumber: '',
    estimatedDelivery: '',
    notes: '',
    documents: []
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(order, formData);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setFormData(prev => ({ ...prev, documents: [...prev.documents, ...files] }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full m-4 max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="text-xl font-bold text-slate-800">Ship Order: {order.orderNumber}</h2>
          <p className="text-sm text-slate-600 mt-1">Complete shipping information to mark order as shipped</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Carrier Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Carrier *</label>
              <select
                value={formData.carrier}
                onChange={(e) => setFormData(prev => ({ ...prev, carrier: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2E86AB] focus:border-[#2E86AB]"
                required
              >
                <option value="">Select Carrier</option>
                <option value="UPS">UPS</option>
                <option value="FedEx">FedEx</option>
                <option value="USPS">USPS</option>
                <option value="DHL">DHL</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Tracking Number *</label>
              <input
                type="text"
                value={formData.trackingNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, trackingNumber: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2E86AB] focus:border-[#2E86AB]"
                placeholder="Enter tracking number"
                required
              />
            </div>
          </div>

          {/* Expected Delivery Date */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Expected Delivery Date *</label>
            <input
              type="date"
              value={formData.estimatedDelivery}
              onChange={(e) => setFormData(prev => ({ ...prev, estimatedDelivery: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2E86AB] focus:border-[#2E86AB]"
              min={new Date().toISOString().split('T')[0]}
              required
            />
          </div>

          {/* Document Upload */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Shipping Documents</label>
            <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center">
              <input
                type="file"
                multiple
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={handleFileUpload}
                className="hidden"
                id="document-upload"
              />
              <label htmlFor="document-upload" className="cursor-pointer">
                <div className="flex flex-col items-center">
                  <svg className="w-8 h-8 text-slate-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <span className="text-sm font-medium text-slate-700">Click to upload or drag and drop</span>
                  <span className="text-xs text-slate-500">PDF, PNG, JPG up to 10MB</span>
                </div>
              </label>
              {formData.documents.length > 0 && (
                <div className="mt-3 text-left">
                  <p className="text-sm font-medium text-slate-700 mb-1">Selected files:</p>
                  {formData.documents.map((file, index) => (
                    <p key={index} className="text-xs text-slate-600">• {file.name}</p>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Shipping Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2E86AB] focus:border-[#2E86AB]"
              rows={3}
              placeholder="Additional notes or special instructions..."
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-[#2E86AB] text-white rounded-lg hover:bg-[#247297] font-medium transition-colors"
            >
              Ship Order
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const OrderFulfillmentDashboard: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>(mockOrders);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [shippingOrder, setShippingOrder] = useState<Order | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [priorityFilter, setPriorityFilter] = useState<string>('All');

  // Filter orders for pre-ship workflow (Pending, Preparing, recent Shipped)
  const preShipOrders = orders.filter(order => 
    order.status === 'Pending Fulfillment' || 
    order.status === 'Preparing for Ship' ||
    (order.status === 'Shipped' && isRecentlyShipped(order))
  );

  const isRecentlyShipped = (order: Order): boolean => {
    if (!order.shipDate) return false;
    const shipDate = new Date(order.shipDate);
    const now = new Date();
    const hoursSinceShipped = (now.getTime() - shipDate.getTime()) / (1000 * 60 * 60);
    return hoursSinceShipped <= 24; // Show for 24 hours after shipping
  };

  // Filter orders based on search and filters
  const filteredOrders = preShipOrders.filter(order => {
    const matchesSearch = searchTerm === '' || 
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.doctor.facility.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.patient.patientId.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'All' || order.status === statusFilter;
    const matchesPriority = priorityFilter === 'All' || order.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

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

  const handleOrderUpdate = (updatedOrder: Order) => {
    setOrders(orders.map(order => 
      order.id === updatedOrder.id ? updatedOrder : order
    ));
    setSelectedOrder(updatedOrder);
  };

  const handleQuickStatusUpdate = (orderId: string, newStatus: Order['status']) => {
    const now = new Date().toISOString().split('T')[0];
    setOrders(orders.map(order => {
      if (order.id === orderId) {
        const updates: Partial<Order> = { status: newStatus };
        
        if (newStatus === 'Preparing for Ship') {
          updates.preparingDate = now;
        }
        
        return { ...order, ...updates };
      }
      return order;
    }));
  };

  const handleShipOrder = (order: Order, shippingData: ShippingFormData) => {
    const now = new Date().toISOString().split('T')[0];
    
    setOrders(orders.map(o => {
      if (o.id === order.id) {
        return {
          ...o,
          status: 'Shipped' as const,
          shipDate: now,
          trackingNumber: shippingData.trackingNumber,
          carrier: shippingData.carrier,
          estimatedDelivery: shippingData.estimatedDelivery,
          notes: shippingData.notes
        };
      }
      return o;
    }));
    
    setShippingOrder(null);
  };

  const getOneClickActionButton = (order: Order) => {
    switch (order.status) {
      case 'Pending Fulfillment':
        return (
          <button
            onClick={() => handleQuickStatusUpdate(order.id, 'Preparing for Ship')}
            className="bg-[#2E86AB] hover:bg-[#247297] text-white font-semibold py-2 px-6 rounded-lg transition-all duration-200 ease-in-out hover:shadow-md"
          >
            Mark Ready for Ship
          </button>
        );
      case 'Preparing for Ship':
        return (
          <button
            onClick={() => setShippingOrder(order)}
            className="bg-[#2E86AB] hover:bg-[#247297] text-white font-semibold py-2 px-6 rounded-lg transition-all duration-200 ease-in-out hover:shadow-md"
          >
            Mark as Shipped
          </button>
        );
      case 'Shipped':
        return (
          <span className="text-sm text-green-600 font-medium">
            Recently Shipped
          </span>
        );
      default:
        return (
          <button
            onClick={() => setSelectedOrder(order)}
            className="border-2 border-slate-600 text-slate-600 bg-white hover:bg-slate-50 font-semibold py-2 px-4 rounded-lg transition-all duration-200 ease-in-out hover:shadow-md text-sm"
          >
            View Details
          </button>
        );
    }
  };

  // Calculate workflow metrics
  const workflowMetrics = {
    pendingFulfillment: orders.filter(o => o.status === 'Pending Fulfillment').length,
    preparing: orders.filter(o => o.status === 'Preparing for Ship').length,
    recentlyShipped: orders.filter(o => o.status === 'Shipped' && isRecentlyShipped(o)).length,
    totalActive: preShipOrders.length
  };

  if (selectedOrder) {
    return (
      <OrderDetailsView 
        order={selectedOrder} 
        onBack={() => setSelectedOrder(null)}
        onUpdate={handleOrderUpdate}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Shipping Form Modal */}
      {shippingOrder && (
        <ShippingForm
          order={shippingOrder}
          onSubmit={handleShipOrder}
          onCancel={() => setShippingOrder(null)}
        />
      )}

      {/* Header Section */}
      <div className="pt-1 pb-3">
        <div className="flex justify-between items-center mb-3">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 tracking-tight leading-tight">Order Management</h1>
            <p className="text-slate-600 mt-1 text-lg leading-normal">Complete pre-ship workflow with one-click status progression</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="bg-white rounded-xl shadow-sm px-4 py-2 border border-slate-200">
              <span className="text-sm font-medium text-slate-600">Active Orders: </span>
              <span className="text-xl font-bold text-slate-900">{workflowMetrics.totalActive}</span>
            </div>
          </div>
        </div>

        {/* Workflow Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-amber-700 leading-tight">{workflowMetrics.pendingFulfillment}</div>
            <div className="text-sm font-medium text-amber-600 mt-1">Pending Fulfillment</div>
            <div className="text-xs text-amber-500 mt-1">New orders from doctors</div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-blue-700 leading-tight">{workflowMetrics.preparing}</div>
            <div className="text-sm font-medium text-blue-600 mt-1">Preparing for Ship</div>
            <div className="text-xs text-blue-500 mt-1">Getting ready for carrier</div>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-green-700 leading-tight">{workflowMetrics.recentlyShipped}</div>
            <div className="text-sm font-medium text-green-600 mt-1">Recently Shipped</div>
            <div className="text-xs text-green-500 mt-1">Shipped in last 24 hours</div>
          </div>
        </div>

        {/* Search and Filters */}
        <Card className="bg-white border border-slate-200 rounded-xl shadow-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Search Orders</label>
              <input
                type="text"
                placeholder="Search by order, doctor, facility..."
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
                <option value="Shipped">Recently Shipped</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Priority Filter</label>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2E86AB] focus:border-[#2E86AB]"
              >
                <option value="All">All Priorities</option>
                <option value="Rush">Rush</option>
                <option value="Urgent">Urgent</option>
                <option value="Standard">Standard</option>
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
                </div>
                {getOneClickActionButton(order)}
              </div>
              <div className="mt-2 flex items-center space-x-4 text-sm text-slate-600">
                <span className="font-medium">Ordered: {order.date} at {order.time}</span>
                {order.preparingDate && (
                  <span className="font-medium">Preparing: {order.preparingDate}</span>
                )}
                {order.shipDate && (
                  <span className="font-medium">Shipped: {order.shipDate}</span>
                )}
                {order.trackingNumber && (
                  <span className="font-medium text-green-600">Tracking: {order.trackingNumber}</span>
                )}
              </div>
            </div>

            {/* Order Content */}
            <div className="px-4 py-3">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Doctor & Facility */}
                <div>
                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Healthcare Provider</h4>
                  <div className="space-y-1">
                    <p className="text-base font-semibold text-slate-800 leading-tight">{order.doctor.name}</p>
                    <p className="text-sm text-slate-600">{order.doctor.facility}</p>
                    <p className="text-xs text-slate-500">{order.shippingAddress.city}, {order.shippingAddress.state}</p>
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

                {/* Patient & IVR */}
                <div>
                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Order Info</h4>
                  <div className="space-y-1">
                    <p className="text-xs text-slate-600">
                      <span className="font-medium">Patient:</span> {order.patient.initials} ({order.patient.patientId})
                    </p>
                    <p className="text-xs text-slate-600">
                      <span className="font-medium">IVR Reference:</span> {order.ivrReference}
                    </p>
                    <p className="text-xs text-slate-600">
                      <span className="font-medium">Ship to:</span> {order.shippingAddress.attention}
                    </p>
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
            <p className="text-slate-600 text-base">No orders match your current filter criteria</p>
          </Card>
        )}
      </div>
    </div>
  );
};

export default OrderFulfillmentDashboard; 