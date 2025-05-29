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
  status: 'Pending Fulfillment' | 'In Progress' | 'Shipped' | 'Delivered';
  totalItems: number;
}

// Mock data for orders
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
    status: 'In Progress',
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
    totalItems: 4
  }
];

const OrderFulfillmentDashboard: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>(mockOrders);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [priorityFilter, setPriorityFilter] = useState<string>('All');

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
      case 'In Progress':
        return `${baseClasses} bg-blue-50 text-blue-700 border-blue-200`;
      case 'Shipped':
        return `${baseClasses} bg-emerald-50 text-emerald-700 border-emerald-200`;
      case 'Delivered':
        return `${baseClasses} bg-green-50 text-green-700 border-green-200`;
      default:
        return `${baseClasses} bg-gray-50 text-gray-700 border-gray-200`;
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
            <p className="text-slate-600 mt-2 text-lg">Process and ship orders from healthcare providers</p>
          </div>
          <div className="flex items-center space-x-6">
            <div className="bg-white rounded-xl shadow-sm px-6 py-3 border border-slate-200">
              <span className="text-sm font-medium text-slate-600">Total Orders: </span>
              <span className="text-xl font-bold text-slate-900">{filteredOrders.length}</span>
            </div>
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
                <option value="In Progress">In Progress</option>
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
          <Card key={order.id} className="bg-white border border-slate-200 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 ease-in-out">
            {/* Order Header */}
            <div className="px-8 py-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <h3 className="text-xl font-bold text-slate-800">{order.orderNumber}</h3>
                  <span className={getStatusBadge(order.status)}>{order.status}</span>
                  <span className={getPriorityBadge(order.priority)}>{order.priority}</span>
                </div>
                <button
                  onClick={() => setSelectedOrder(order)}
                  className="border-2 border-slate-600 text-slate-600 bg-white hover:bg-slate-50 font-semibold py-3 px-6 rounded-lg transition-all duration-200 ease-in-out hover:shadow-md"
                >
                  Process Order
                </button>
              </div>
              <p className="text-slate-600 mt-2 font-medium">{order.date} at {order.time}</p>
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

            {/* Product Information */}
            <div className="px-8 py-6 border-b border-slate-100">
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
              </div>
            </div>

            {/* Patient Information */}
            <div className="px-8 py-6">
              <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Patient Information</h4>
              <p className="text-base text-slate-700">
                <span className="font-semibold">Patient:</span> {order.patient.initials} 
                <span className="text-slate-500 ml-2">({order.patient.patientId})</span>
              </p>
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