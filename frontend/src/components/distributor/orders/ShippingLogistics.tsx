import React, { useState, useEffect } from 'react';
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
  trackingNumber?: string;
  carrier?: string;
  shipDate?: string;
  estimatedDelivery?: string;
  deliveredDate?: string;
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

// Mock data for shipped orders
const mockShippedOrders: Order[] = [
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
    shipDate: '2024-12-18',
    estimatedDelivery: '2024-12-20',
    trackingNumber: 'UPS123456789',
    carrier: 'UPS',
    totalItems: 4,
    isOverdue: true // Example overdue order
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
    shipDate: '2024-12-16',
    estimatedDelivery: '2024-12-18',
    deliveredDate: '2024-12-18',
    trackingNumber: 'FEDEX987654321',
    carrier: 'FedEx',
    totalItems: 1
  },
  {
    id: 'ORD-2024-006',
    orderNumber: 'ORD-2024-006',
    date: '2024-12-14',
    time: '11:15 AM',
    doctor: {
      name: 'Dr. Robert Chen',
      facility: 'South Austin Medical',
      email: 'robert.chen@southaustin.com'
    },
    patient: {
      initials: 'T.W.',
      patientId: 'PT-990123'
    },
    ivrReference: 'IVR-2024-0887',
    products: [
      {
        id: 'SKIN-007',
        name: 'Bioactive Wound Gel',
        description: 'Advanced bioactive gel for enhanced healing',
        quantity: 2,
        image: '/api/placeholder/80/80'
      }
    ],
    shippingAddress: {
      facility: 'South Austin Medical',
      address: '5000 W Slaughter Ln',
      city: 'Austin',
      state: 'TX',
      zipCode: '78749',
      attention: 'Dr. Robert Chen - Wound Care Center'
    },
    priority: 'Standard',
    status: 'Delivered',
    shipDate: '2024-12-15',
    estimatedDelivery: '2024-12-17',
    deliveredDate: '2024-12-17',
    trackingNumber: 'USPS876543210',
    carrier: 'USPS',
    totalItems: 2
  }
];

const ShippingLogistics: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>(mockShippedOrders);
  const [showDelivered, setShowDelivered] = useState(true);
  const [carrierFilter, setCarrierFilter] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState('');

  // Filter orders for shipping logistics (Shipped and Delivered only)
  const shippingOrders = orders.filter(order => {
    const matchesStatus = order.status === 'Shipped' || (showDelivered && order.status === 'Delivered');
    const matchesCarrier = carrierFilter === 'All' || order.carrier === carrierFilter;
    const matchesSearch = searchTerm === '' || 
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.trackingNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.doctor.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesCarrier && matchesSearch;
  });

  // Calculate delivery performance metrics
  const deliveryMetrics = {
    totalShipped: orders.filter(o => o.status === 'Shipped' || o.status === 'Delivered').length,
    inTransit: orders.filter(o => o.status === 'Shipped').length,
    delivered: orders.filter(o => o.status === 'Delivered').length,
    overdue: orders.filter(o => o.isOverdue).length,
    avgDeliveryTime: calculateAverageDeliveryTime(),
    deliveryRate: calculateDeliveryRate()
  };

  function calculateAverageDeliveryTime() {
    const deliveredOrders = orders.filter(o => o.status === 'Delivered' && o.shipDate && o.deliveredDate);
    if (deliveredOrders.length === 0) return 0;
    
    const totalDays = deliveredOrders.reduce((sum, order) => {
      const shipDate = new Date(order.shipDate!);
      const deliveryDate = new Date(order.deliveredDate!);
      const days = Math.floor((deliveryDate.getTime() - shipDate.getTime()) / (1000 * 60 * 60 * 24));
      return sum + days;
    }, 0);
    
    return Math.round((totalDays / deliveredOrders.length) * 10) / 10;
  }

  function calculateDeliveryRate() {
    const totalOrders = orders.filter(o => o.status === 'Shipped' || o.status === 'Delivered').length;
    const deliveredOrders = orders.filter(o => o.status === 'Delivered').length;
    return totalOrders > 0 ? Math.round((deliveredOrders / totalOrders) * 100) : 0;
  }

  const getStatusBadge = (status: Order['status']) => {
    const baseClasses = 'px-3 py-1 rounded-full text-sm font-medium border';
    switch (status) {
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

  const getCarrierIcon = (carrier: string) => {
    // This would typically return carrier-specific icons
    return (
      <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center">
        <span className="text-xs font-bold text-slate-600">{carrier?.charAt(0)}</span>
      </div>
    );
  };

  const getDaysInTransit = (shipDate: string, deliveredDate?: string) => {
    const start = new Date(shipDate);
    const end = deliveredDate ? new Date(deliveredDate) : new Date();
    return Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  };

  const handleReportIssue = (orderId: string) => {
    // This would typically open a modal for reporting delivery issues
    const issue = prompt('Describe the delivery issue:');
    if (issue) {
      setOrders(orders.map(order => 
        order.id === orderId 
          ? { ...order, deliveryIssues: issue }
          : order
      ));
    }
  };

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="pt-2 pb-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Shipping & Logistics</h1>
            <p className="text-slate-600 mt-2 text-lg">Monitor shipped orders and delivery performance</p>
          </div>
          <div className="flex items-center space-x-6">
            {deliveryMetrics.overdue > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-xl shadow-sm px-4 py-3">
                <span className="text-sm font-medium text-red-600">Overdue: </span>
                <span className="text-xl font-bold text-red-700">{deliveryMetrics.overdue}</span>
              </div>
            )}
            <div className="bg-white rounded-xl shadow-sm px-6 py-3 border border-slate-200">
              <span className="text-sm font-medium text-slate-600">In Transit: </span>
              <span className="text-xl font-bold text-slate-900">{deliveryMetrics.inTransit}</span>
            </div>
          </div>
        </div>

        {/* Delivery Performance Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 text-center">
            <div className="text-3xl font-bold text-blue-700">{deliveryMetrics.totalShipped}</div>
            <div className="text-sm font-medium text-blue-600 mt-2">Total Shipped</div>
          </div>
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 text-center">
            <div className="text-3xl font-bold text-emerald-700">{deliveryMetrics.delivered}</div>
            <div className="text-sm font-medium text-emerald-600 mt-2">Delivered</div>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-6 text-center">
            <div className="text-3xl font-bold text-purple-700">{deliveryMetrics.avgDeliveryTime}</div>
            <div className="text-sm font-medium text-purple-600 mt-2">Avg Days</div>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
            <div className="text-3xl font-bold text-green-700">{deliveryMetrics.deliveryRate}%</div>
            <div className="text-sm font-medium text-green-600 mt-2">Success Rate</div>
          </div>
        </div>

        {/* Filter Controls */}
        <Card className="bg-white border border-slate-200 rounded-xl shadow-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-3">Search Orders</label>
              <input
                type="text"
                placeholder="Search by order, tracking number, doctor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-3">Carrier Filter</label>
              <select
                value={carrierFilter}
                onChange={(e) => setCarrierFilter(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors"
              >
                <option value="All">All Carriers</option>
                <option value="UPS">UPS</option>
                <option value="FedEx">FedEx</option>
                <option value="USPS">USPS</option>
                <option value="DHL">DHL</option>
              </select>
            </div>
            <div className="flex items-end">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={showDelivered}
                  onChange={(e) => setShowDelivered(e.target.checked)}
                  className="rounded border-slate-300 text-slate-600 focus:ring-slate-500"
                />
                <span className="text-sm font-medium text-slate-700">Show delivered orders</span>
              </label>
            </div>
          </div>
        </Card>
      </div>

      {/* Shipping Orders List */}
      <div className="space-y-6">
        {shippingOrders.map((order) => (
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
                {order.status === 'Shipped' && (
                  <button
                    onClick={() => handleReportIssue(order.id)}
                    className="border-2 border-orange-500 text-orange-600 bg-white hover:bg-orange-50 font-semibold py-2 px-4 rounded-lg transition-all duration-200 ease-in-out hover:shadow-md text-sm"
                  >
                    Report Issue
                  </button>
                )}
              </div>
              
              {/* Tracking Information */}
              <div className="mt-4 flex items-center space-x-6">
                {getCarrierIcon(order.carrier || '')}
                <div className="flex-1">
                  <div className="flex items-center space-x-4 text-sm">
                    <span className="font-medium text-slate-700">
                      <span className="font-semibold">{order.carrier}:</span> {order.trackingNumber}
                    </span>
                    <span className="text-slate-500">
                      Shipped: {order.shipDate}
                    </span>
                    <span className="text-slate-500">
                      Est. Delivery: {order.estimatedDelivery}
                    </span>
                    {order.deliveredDate && (
                      <span className="text-emerald-600 font-medium">
                        Delivered: {order.deliveredDate}
                      </span>
                    )}
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    {getDaysInTransit(order.shipDate!, order.deliveredDate)} days {order.status === 'Delivered' ? 'total' : 'in transit'}
                  </div>
                </div>
              </div>
            </div>

            {/* Order Details */}
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
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Delivery Status */}
                <div>
                  <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Delivery Status</h4>
                  <div className="space-y-2">
                    <p className="text-sm text-slate-600">
                      <span className="font-medium">Patient:</span> {order.patient.initials} ({order.patient.patientId})
                    </p>
                    <p className="text-sm text-slate-600">
                      <span className="font-medium">Ship to:</span> {order.shippingAddress.attention}
                    </p>
                    {order.deliveryIssues && (
                      <div className="mt-2 p-2 bg-orange-50 border border-orange-200 rounded-lg">
                        <p className="text-xs font-medium text-orange-800">Delivery Issue Reported:</p>
                        <p className="text-xs text-orange-700 mt-1">{order.deliveryIssues}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))}

        {shippingOrders.length === 0 && (
          <Card className="bg-white border border-slate-200 rounded-xl shadow-lg p-16 text-center">
            <div className="mx-auto w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-6">
              <svg className="w-12 h-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-3">No Shipped Orders</h3>
            <p className="text-slate-600 text-lg">No orders match your current filter criteria</p>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ShippingLogistics; 