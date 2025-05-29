import React, { useState } from 'react';
import { Card } from '../../shared/ui/Card';

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
  processedDate?: string;
  readyToShipDate?: string;
}

// Mock data for active workflow orders
const mockActiveOrders: Order[] = [
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
    status: 'Processed',
    processedDate: '2024-12-19',
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
    priority: 'Standard',
    status: 'Ready to Ship',
    processedDate: '2024-12-17',
    readyToShipDate: '2024-12-18',
    totalItems: 3
  }
];

const OrderQueue: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>(mockActiveOrders);
  const [showCompleted, setShowCompleted] = useState(false);

  // Filter orders for active workflow (Processed and Ready to Ship only)
  const activeOrders = orders.filter(order => 
    order.status === 'Processed' || order.status === 'Ready to Ship'
  );

  const getStatusBadge = (status: Order['status']) => {
    const baseClasses = 'px-3 py-1 rounded-full text-sm font-medium border';
    switch (status) {
      case 'Processed':
        return `${baseClasses} bg-blue-50 text-blue-700 border-blue-200`;
      case 'Ready to Ship':
        return `${baseClasses} bg-purple-50 text-purple-700 border-purple-200`;
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

  const handleStatusUpdate = (orderId: string, newStatus: Order['status']) => {
    const now = new Date().toISOString().split('T')[0];
    setOrders(orders.map(order => {
      if (order.id === orderId) {
        const updates: Partial<Order> = { status: newStatus };
        
        if (newStatus === 'Ready to Ship') {
          updates.readyToShipDate = now;
        }
        
        return { ...order, ...updates };
      }
      return order;
    }));
  };

  const getActionButton = (order: Order) => {
    if (order.status === 'Processed') {
      return (
        <button
          onClick={() => handleStatusUpdate(order.id, 'Ready to Ship')}
          className="border-2 border-purple-600 text-purple-600 bg-white hover:bg-purple-50 font-semibold py-2 px-6 rounded-lg transition-all duration-200 ease-in-out hover:shadow-md"
        >
          Mark Ready to Ship
        </button>
      );
    }
    
    if (order.status === 'Ready to Ship') {
      return (
        <button
          onClick={() => {/* Navigate to shipping form */}}
          className="border-2 border-green-600 text-green-600 bg-white hover:bg-green-50 font-semibold py-2 px-6 rounded-lg transition-all duration-200 ease-in-out hover:shadow-md"
        >
          Ship Order
        </button>
      );
    }

    return null;
  };

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="pt-2 pb-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Order Queue</h1>
            <p className="text-slate-600 mt-2 text-lg">Active workflow management for processed orders</p>
          </div>
          <div className="flex items-center space-x-6">
            <div className="bg-white rounded-xl shadow-sm px-6 py-3 border border-slate-200">
              <span className="text-sm font-medium text-slate-600">Active Orders: </span>
              <span className="text-xl font-bold text-slate-900">{activeOrders.length}</span>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 text-center">
            <div className="text-3xl font-bold text-blue-700">
              {orders.filter(o => o.status === 'Processed').length}
            </div>
            <div className="text-sm font-medium text-blue-600 mt-2">Processed - Ready for Packaging</div>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-6 text-center">
            <div className="text-3xl font-bold text-purple-700">
              {orders.filter(o => o.status === 'Ready to Ship').length}
            </div>
            <div className="text-sm font-medium text-purple-600 mt-2">Ready to Ship - Awaiting Carrier</div>
          </div>
        </div>

        {/* Filter Controls */}
        <Card className="bg-white border border-slate-200 rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={showCompleted}
                  onChange={(e) => setShowCompleted(e.target.checked)}
                  className="rounded border-slate-300 text-slate-600 focus:ring-slate-500"
                />
                <span className="text-sm font-medium text-slate-700">Show completed items</span>
              </label>
            </div>
            <div className="text-sm text-slate-500">
              Displaying active workflow items only
            </div>
          </div>
        </Card>
      </div>

      {/* Active Orders List */}
      <div className="space-y-6">
        {activeOrders.map((order) => (
          <Card key={order.id} className="bg-white border border-slate-200 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 ease-in-out">
            {/* Order Header */}
            <div className="px-8 py-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <h3 className="text-xl font-bold text-slate-800">{order.orderNumber}</h3>
                  <span className={getStatusBadge(order.status)}>{order.status}</span>
                  <span className={getPriorityBadge(order.priority)}>{order.priority}</span>
                </div>
                {getActionButton(order)}
              </div>
              <div className="mt-3 flex items-center space-x-6 text-sm text-slate-600">
                <span className="font-medium">Ordered: {order.date} at {order.time}</span>
                {order.processedDate && (
                  <span className="font-medium">Processed: {order.processedDate}</span>
                )}
                {order.readyToShipDate && (
                  <span className="font-medium">Ready: {order.readyToShipDate}</span>
                )}
              </div>
            </div>

            {/* Order Content */}
            <div className="px-8 py-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Doctor & Facility */}
                <div>
                  <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Healthcare Provider</h4>
                  <div className="space-y-1">
                    <p className="text-lg font-semibold text-slate-800">{order.doctor.name}</p>
                    <p className="text-base text-slate-600">{order.doctor.facility}</p>
                    <p className="text-sm text-slate-500">{order.shippingAddress.city}, {order.shippingAddress.state}</p>
                  </div>
                </div>

                {/* Products */}
                <div>
                  <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Products</h4>
                  <div className="space-y-2">
                    <p className="text-base font-semibold text-slate-800">
                      {order.totalItems} item{order.totalItems !== 1 ? 's' : ''}
                    </p>
                    <div className="space-y-1">
                      {order.products.map(product => (
                        <div key={product.id} className="text-sm text-slate-600">
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
                  <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Order Info</h4>
                  <div className="space-y-2">
                    <p className="text-sm text-slate-600">
                      <span className="font-medium">Patient:</span> {order.patient.initials} ({order.patient.patientId})
                    </p>
                    <p className="text-sm text-slate-600">
                      <span className="font-medium">IVR Reference:</span> {order.ivrReference}
                    </p>
                    <p className="text-sm text-slate-600">
                      <span className="font-medium">Ship to:</span> {order.shippingAddress.attention}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))}

        {activeOrders.length === 0 && (
          <Card className="bg-white border border-slate-200 rounded-xl shadow-lg p-16 text-center">
            <div className="mx-auto w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-6">
              <svg className="w-12 h-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-3">No Active Orders</h3>
            <p className="text-slate-600 text-lg">All orders are either pending or have been shipped</p>
          </Card>
        )}
      </div>
    </div>
  );
};

export default OrderQueue; 