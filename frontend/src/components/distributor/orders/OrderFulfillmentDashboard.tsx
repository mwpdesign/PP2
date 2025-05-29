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
    initials: string; // HIPAA-compliant display
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

// Mock data for orders with enhanced status workflow
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
    status: 'Processed',
    processedDate: '2024-12-19',
    totalItems: 1
  },
  {
    id: 'ORD-2024-003',
    orderNumber: 'ORD-2024-003',
    date: '2024-12-18',
    time: '02:45 PM',
    doctor: {
      name: 'Dr. Lisa Park',
      facility: 'Austin Regional Medical',
      email: 'lisa.park@austinregional.com'
    },
    patient: {
      initials: 'R.T.',
      patientId: 'PT-667234'
    },
    ivrReference: 'IVR-2024-0891',
    products: [
      {
        id: 'SKIN-004',
        name: 'Hydrogel Wound Patches',
        description: 'Advanced hydrogel technology for optimal healing environment',
        quantity: 4,
        image: '/api/placeholder/80/80'
      }
    ],
    shippingAddress: {
      facility: 'Austin Regional Medical',
      address: '1301 Barbara Jordan Blvd',
      city: 'Austin',
      state: 'TX',
      zipCode: '78723',
      attention: 'Dr. Lisa Park - Dermatology'
    },
    priority: 'Rush',
    status: 'Shipped',
    processedDate: '2024-12-18',
    readyToShipDate: '2024-12-18',
    shipDate: '2024-12-18',
    estimatedDelivery: '2024-12-20',
    trackingNumber: 'UPS123456789',
    carrier: 'UPS',
    totalItems: 4
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
  },
  {
    id: 'ORD-2024-005',
    orderNumber: 'ORD-2024-005',
    date: '2024-12-15',
    time: '03:30 PM',
    doctor: {
      name: 'Dr. Emma Davis',
      facility: 'North Austin Clinic',
      email: 'emma.davis@northaustin.com'
    },
    patient: {
      initials: 'K.L.',
      patientId: 'PT-889456'
    },
    ivrReference: 'IVR-2024-0888',
    products: [
      {
        id: 'SKIN-006',
        name: 'Advanced Healing Matrix',
        description: 'Bioengineered tissue matrix for accelerated healing',
        quantity: 1,
        image: '/api/placeholder/80/80',
        specialHandling: 'Keep refrigerated until use'
      }
    ],
    shippingAddress: {
      facility: 'North Austin Clinic',
      address: '12000 Research Blvd',
      city: 'Austin',
      state: 'TX',
      zipCode: '78759',
      attention: 'Dr. Emma Davis - Dermatology'
    },
    priority: 'Standard',
    status: 'Delivered',
    processedDate: '2024-12-15',
    readyToShipDate: '2024-12-16',
    shipDate: '2024-12-16',
    estimatedDelivery: '2024-12-18',
    deliveredDate: '2024-12-18',
    trackingNumber: 'FEDEX987654321',
    carrier: 'FedEx',
    totalItems: 1
  }
];

const OrderFulfillmentDashboard: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>(mockOrders);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [priorityFilter, setPriorityFilter] = useState<string>('All');

  // Auto-delivery system - check for overdue deliveries
  useEffect(() => {
    const checkOverdueDeliveries = () => {
      const now = new Date();
      setOrders(prevOrders => 
        prevOrders.map(order => {
          if (order.status === 'Shipped' && order.estimatedDelivery) {
            const deliveryDate = new Date(order.estimatedDelivery);
            const daysPastDue = Math.floor((now.getTime() - deliveryDate.getTime()) / (1000 * 60 * 60 * 24));
            
            if (daysPastDue >= 2) {
              return { ...order, isOverdue: true };
            } else if (daysPastDue >= 0 && !order.deliveryIssues) {
              // Auto-mark as delivered if past delivery date with no issues reported
              return { 
                ...order, 
                status: 'Delivered' as const,
                deliveredDate: order.estimatedDelivery
              };
            }
          }
          return order;
        })
      );
    };

    // Check immediately and then every hour
    checkOverdueDeliveries();
    const interval = setInterval(checkOverdueDeliveries, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Filter orders based on search and filters
  const filteredOrders = orders.filter(order => {
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
        
        return { ...order, ...updates };
      }
      return order;
    }));
  };

  const getQuickActionButton = (order: Order) => {
    switch (order.status) {
      case 'Pending Fulfillment':
        return (
          <button
            onClick={() => handleQuickStatusUpdate(order.id, 'Processed')}
            className="border-2 border-blue-600 text-blue-600 bg-white hover:bg-blue-50 font-semibold py-2 px-4 rounded-lg transition-all duration-200 ease-in-out hover:shadow-md text-sm"
          >
            Mark as Processed
          </button>
        );
      case 'Processed':
        return (
          <button
            onClick={() => handleQuickStatusUpdate(order.id, 'Ready to Ship')}
            className="border-2 border-purple-600 text-purple-600 bg-white hover:bg-purple-50 font-semibold py-2 px-4 rounded-lg transition-all duration-200 ease-in-out hover:shadow-md text-sm"
          >
            Mark Ready to Ship
          </button>
        );
      case 'Ready to Ship':
        return (
          <button
            onClick={() => setSelectedOrder(order)}
            className="border-2 border-green-600 text-green-600 bg-white hover:bg-green-50 font-semibold py-2 px-4 rounded-lg transition-all duration-200 ease-in-out hover:shadow-md text-sm"
          >
            Ship Order
          </button>
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
    processed: orders.filter(o => o.status === 'Processed').length,
    readyToShip: orders.filter(o => o.status === 'Ready to Ship').length,
    shipped: orders.filter(o => o.status === 'Shipped').length,
    delivered: orders.filter(o => o.status === 'Delivered').length,
    overdue: orders.filter(o => o.isOverdue).length
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
    <div className="space-y-8">
      {/* Header Section */}
      <div className="pt-2 pb-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Order Fulfillment</h1>
            <p className="text-slate-600 mt-2 text-lg">Complete order processing and shipping workflow</p>
          </div>
          <div className="flex items-center space-x-6">
            {workflowMetrics.overdue > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-xl shadow-sm px-4 py-3">
                <span className="text-sm font-medium text-red-600">Overdue Deliveries: </span>
                <span className="text-xl font-bold text-red-700">{workflowMetrics.overdue}</span>
              </div>
            )}
            <div className="bg-white rounded-xl shadow-sm px-6 py-3 border border-slate-200">
              <span className="text-sm font-medium text-slate-600">Active Orders: </span>
              <span className="text-xl font-bold text-slate-900">{filteredOrders.length}</span>
            </div>
          </div>
        </div>

        {/* Workflow Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-amber-700">{workflowMetrics.pendingFulfillment}</div>
            <div className="text-sm font-medium text-amber-600">Pending</div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-blue-700">{workflowMetrics.processed}</div>
            <div className="text-sm font-medium text-blue-600">Processed</div>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-purple-700">{workflowMetrics.readyToShip}</div>
            <div className="text-sm font-medium text-purple-600">Ready to Ship</div>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-green-700">{workflowMetrics.shipped}</div>
            <div className="text-sm font-medium text-green-600">Shipped</div>
          </div>
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-emerald-700">{workflowMetrics.delivered}</div>
            <div className="text-sm font-medium text-emerald-600">Delivered</div>
          </div>
        </div>

        {/* Search and Filters Section */}
        <Card className="bg-white border border-slate-200 rounded-xl shadow-lg p-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-3">Search Orders</label>
              <input
                type="text"
                placeholder="Search by order number, doctor, facility..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-3">Status Filter</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors"
              >
                <option value="All">All Statuses</option>
                <option value="Pending Fulfillment">Pending Fulfillment</option>
                <option value="Processed">Processed</option>
                <option value="Ready to Ship">Ready to Ship</option>
                <option value="Shipped">Shipped</option>
                <option value="Delivered">Delivered</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-3">Priority Filter</label>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors"
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
      <div className="space-y-6">
        {filteredOrders.map((order) => (
          <Card key={order.id} className={`bg-white border rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 ease-in-out ${
            order.isOverdue ? 'border-red-300 bg-red-50' : 'border-slate-200'
          }`}>
            {/* Order Header */}
            <div className="px-8 py-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <h3 className="text-xl font-bold text-slate-800">{order.orderNumber}</h3>
                  <span className={getStatusBadge(order.status)}>{order.status}</span>
                  <span className={getPriorityBadge(order.priority)}>{order.priority}</span>
                  {order.isOverdue && (
                    <span className="px-3 py-1 rounded-full text-sm font-medium border bg-red-100 text-red-700 border-red-300">
                      OVERDUE
                    </span>
                  )}
                </div>
                {getQuickActionButton(order)}
              </div>
              <div className="mt-2 flex items-center space-x-4 text-sm text-slate-600">
                <span className="font-medium">{order.date} at {order.time}</span>
                {order.trackingNumber && (
                  <span className="font-mono bg-slate-100 px-2 py-1 rounded">
                    {order.carrier}: {order.trackingNumber}
                  </span>
                )}
              </div>
            </div>

            {/* Doctor & Facility */}
            <div className="px-8 py-6 border-b border-slate-100">
              <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Healthcare Provider</h4>
              <div className="space-y-1">
                <p className="text-lg font-semibold text-slate-800">{order.doctor.name}</p>
                <p className="text-base text-slate-600">{order.doctor.facility}</p>
                <p className="text-sm text-slate-500">{order.shippingAddress.city}, {order.shippingAddress.state}</p>
              </div>
            </div>

            {/* Order Details & Timeline */}
            <div className="px-8 py-6 border-b border-slate-100">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Order Details</h4>
                  <div className="space-y-2">
                    <p className="text-base font-semibold text-slate-800">
                      {order.totalItems} item{order.totalItems !== 1 ? 's' : ''}: 
                      <span className="font-normal text-slate-600 ml-2">
                        {order.products.map(p => p.name).join(', ')}
                      </span>
                    </p>
                    <p className="text-sm text-slate-500">
                      <span className="font-medium">IVR Reference:</span> {order.ivrReference}
                    </p>
                    <p className="text-sm text-slate-500">
                      <span className="font-medium">Patient:</span> {order.patient.initials} ({order.patient.patientId})
                    </p>
                  </div>
                </div>
                
                {/* Status Timeline */}
                <div>
                  <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Timeline</h4>
                  <div className="space-y-1 text-sm">
                    {order.processedDate && (
                      <p className="text-slate-600">
                        <span className="font-medium text-blue-600">Processed:</span> {order.processedDate}
                      </p>
                    )}
                    {order.readyToShipDate && (
                      <p className="text-slate-600">
                        <span className="font-medium text-purple-600">Ready to Ship:</span> {order.readyToShipDate}
                      </p>
                    )}
                    {order.shipDate && (
                      <p className="text-slate-600">
                        <span className="font-medium text-green-600">Shipped:</span> {order.shipDate}
                      </p>
                    )}
                    {order.estimatedDelivery && (
                      <p className="text-slate-600">
                        <span className="font-medium text-slate-700">Est. Delivery:</span> {order.estimatedDelivery}
                      </p>
                    )}
                    {order.deliveredDate && (
                      <p className="text-slate-600">
                        <span className="font-medium text-emerald-600">Delivered:</span> {order.deliveredDate}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))}

        {filteredOrders.length === 0 && (
          <Card className="bg-white border border-slate-200 rounded-xl shadow-lg p-16 text-center">
            <div className="mx-auto w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-6">
              <svg className="w-12 h-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2 2v-5m16 0h-5M4 13h5m6 0h5" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-3">No Orders Found</h3>
            <p className="text-slate-600 text-lg">No orders match your current search and filter criteria</p>
          </Card>
        )}
      </div>
    </div>
  );
};

export default OrderFulfillmentDashboard; 