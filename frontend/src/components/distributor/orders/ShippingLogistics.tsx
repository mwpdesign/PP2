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
  status: 'Pending Fulfillment' | 'Preparing for Ship' | 'Shipped' | 'Delivered';
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

// Mock data for shipped and delivered orders
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
  },
  {
    id: 'ORD-2024-007',
    orderNumber: 'ORD-2024-007',
    date: '2024-12-17',
    time: '09:30 AM',
    doctor: {
      name: 'Dr. Jennifer Martinez',
      facility: 'Cedar Park Family Health',
      email: 'jennifer.martinez@cedarpark.com'
    },
    patient: {
      initials: 'S.K.',
      patientId: 'PT-112233'
    },
    ivrReference: 'IVR-2024-0892',
    products: [
      {
        id: 'SKIN-008',
        name: 'Compression Therapy Kit',
        description: 'Advanced compression system for wound management',
        quantity: 1,
        image: '/api/placeholder/80/80'
      }
    ],
    shippingAddress: {
      facility: 'Cedar Park Family Health',
      address: '1000 Medical Pkwy',
      city: 'Cedar Park',
      state: 'TX',
      zipCode: '78613',
      attention: 'Dr. Jennifer Martinez - Family Medicine'
    },
    priority: 'Urgent',
    status: 'Shipped',
    shipDate: '2024-12-19',
    estimatedDelivery: '2024-12-21',
    trackingNumber: 'FEDEX456789123',
    carrier: 'FedEx',
    totalItems: 1
  }
];

const ShippingLogistics: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>(mockShippedOrders);
  const [showDelivered, setShowDelivered] = useState(true);
  const [carrierFilter, setCarrierFilter] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [showOverdueOnly, setShowOverdueOnly] = useState(false);

  // Auto-detect overdue deliveries
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
            }
          }
          return order;
        })
      );
    };

    checkOverdueDeliveries();
    const interval = setInterval(checkOverdueDeliveries, 60 * 60 * 1000); // Check every hour
    return () => clearInterval(interval);
  }, []);

  // Filter orders for shipping logistics (Shipped and Delivered only)
  const shippingOrders = orders.filter(order => {
    const matchesStatus = order.status === 'Shipped' || (showDelivered && order.status === 'Delivered');
    const matchesCarrier = carrierFilter === 'All' || order.carrier === carrierFilter;
    const matchesOverdue = !showOverdueOnly || order.isOverdue;
    const matchesSearch = searchTerm === '' || 
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.trackingNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.doctor.facility.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesCarrier && matchesSearch && matchesOverdue;
  });

  // Calculate delivery performance metrics
  const deliveryMetrics = {
    totalShipped: orders.filter(o => o.status === 'Shipped' || o.status === 'Delivered').length,
    inTransit: orders.filter(o => o.status === 'Shipped').length,
    delivered: orders.filter(o => o.status === 'Delivered').length,
    overdue: orders.filter(o => o.isOverdue).length,
    avgDeliveryTime: calculateAverageDeliveryTime(),
    onTimeDeliveryRate: calculateOnTimeDeliveryRate()
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

  function calculateOnTimeDeliveryRate() {
    const completedShipments = orders.filter(o => o.status === 'Delivered' && o.estimatedDelivery && o.deliveredDate);
    if (completedShipments.length === 0) return 100;
    
    const onTimeDeliveries = completedShipments.filter(order => {
      const estimatedDate = new Date(order.estimatedDelivery!);
      const actualDate = new Date(order.deliveredDate!);
      return actualDate <= estimatedDate;
    });
    
    return Math.round((onTimeDeliveries.length / completedShipments.length) * 100);
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
    const iconClasses = "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white";
    switch (carrier) {
      case 'UPS':
        return <div className={`${iconClasses} bg-amber-600`}>UPS</div>;
      case 'FedEx':
        return <div className={`${iconClasses} bg-purple-600`}>FX</div>;
      case 'USPS':
        return <div className={`${iconClasses} bg-blue-600`}>USPS</div>;
      case 'DHL':
        return <div className={`${iconClasses} bg-red-600`}>DHL</div>;
      default:
        return <div className={`${iconClasses} bg-slate-500`}>{carrier?.charAt(0) || '?'}</div>;
    }
  };

  const getDaysInTransit = (shipDate: string, deliveredDate?: string) => {
    const start = new Date(shipDate);
    const end = deliveredDate ? new Date(deliveredDate) : new Date();
    return Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  };

  const handleMarkAsReceived = (orderId: string) => {
    const now = new Date().toISOString().split('T')[0];
    setOrders(orders.map(order => 
      order.id === orderId 
        ? { ...order, status: 'Delivered' as const, deliveredDate: now, isOverdue: false }
        : order
    ));
  };

  const handleReportIssue = (orderId: string) => {
    const issue = prompt('Describe the delivery issue:');
    if (issue) {
      setOrders(orders.map(order => 
        order.id === orderId 
          ? { ...order, deliveryIssues: issue }
          : order
      ));
    }
  };

  const getActionButton = (order: Order) => {
    if (order.status === 'Shipped' && !order.isOverdue) {
      return (
        <div className="flex space-x-2">
          <button
            onClick={() => handleMarkAsReceived(order.id)}
            className="bg-[#2E86AB] hover:bg-[#247297] text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 text-sm"
          >
            Mark as Received
          </button>
          <button
            onClick={() => handleReportIssue(order.id)}
            className="border-2 border-orange-500 text-orange-600 bg-white hover:bg-orange-50 font-semibold py-2 px-3 rounded-lg transition-all duration-200 text-sm"
          >
            Report Issue
          </button>
        </div>
      );
    }
    
    if (order.status === 'Shipped' && order.isOverdue) {
      return (
        <div className="flex space-x-2">
          <button
            onClick={() => handleMarkAsReceived(order.id)}
            className="bg-[#2E86AB] hover:bg-[#247297] text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 text-sm"
          >
            Mark as Received
          </button>
          <button
            onClick={() => handleReportIssue(order.id)}
            className="border-2 border-red-500 text-red-600 bg-white hover:bg-red-50 font-semibold py-2 px-3 rounded-lg transition-all duration-200 text-sm"
          >
            Report Issue
          </button>
        </div>
      );
    }

    return (
      <span className="text-sm text-emerald-600 font-medium flex items-center">
        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        Delivered
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header Section */}
      <div className="pt-1 pb-3">
        <div className="flex justify-between items-center mb-3">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 tracking-tight leading-tight">Shipping & Logistics</h1>
            <p className="text-slate-600 mt-1 text-lg leading-normal">Monitor delivery performance and track shipped orders</p>
          </div>
          <div className="flex items-center space-x-4">
            {deliveryMetrics.overdue > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-xl shadow-sm px-3 py-2">
                <span className="text-sm font-medium text-red-600">Overdue: </span>
                <span className="text-xl font-bold text-red-700">{deliveryMetrics.overdue}</span>
              </div>
            )}
            <div className="bg-white rounded-xl shadow-sm px-4 py-2 border border-slate-200">
              <span className="text-sm font-medium text-slate-600">In Transit: </span>
              <span className="text-xl font-bold text-slate-900">{deliveryMetrics.inTransit}</span>
            </div>
          </div>
        </div>

        {/* Delivery Performance Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-blue-700 leading-tight">{deliveryMetrics.totalShipped}</div>
            <div className="text-sm font-medium text-blue-600 mt-1">Total Shipped</div>
            <div className="text-xs text-blue-500 mt-1">All time</div>
          </div>
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-emerald-700 leading-tight">{deliveryMetrics.delivered}</div>
            <div className="text-sm font-medium text-emerald-600 mt-1">Delivered</div>
            <div className="text-xs text-emerald-500 mt-1">Successfully received</div>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-purple-700 leading-tight">{deliveryMetrics.avgDeliveryTime}</div>
            <div className="text-sm font-medium text-purple-600 mt-1">Avg Days</div>
            <div className="text-xs text-purple-500 mt-1">Ship to delivery</div>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-green-700 leading-tight">{deliveryMetrics.onTimeDeliveryRate}%</div>
            <div className="text-sm font-medium text-green-600 mt-1">On-Time Rate</div>
            <div className="text-xs text-green-500 mt-1">Performance metric</div>
          </div>
        </div>

        {/* Filter Controls */}
        <Card className="bg-white border border-slate-200 rounded-xl shadow-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Search Orders</label>
              <input
                type="text"
                placeholder="Search by order, tracking, doctor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2E86AB] focus:border-[#2E86AB]"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Carrier Filter</label>
              <select
                value={carrierFilter}
                onChange={(e) => setCarrierFilter(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2E86AB] focus:border-[#2E86AB]"
              >
                <option value="All">All Carriers</option>
                <option value="UPS">UPS</option>
                <option value="FedEx">FedEx</option>
                <option value="USPS">USPS</option>
                <option value="DHL">DHL</option>
              </select>
            </div>
            <div className="flex flex-col justify-end">
              <label className="flex items-center space-x-2 mb-2">
                <input
                  type="checkbox"
                  checked={showDelivered}
                  onChange={(e) => setShowDelivered(e.target.checked)}
                  className="rounded border-slate-300 text-[#2E86AB] focus:ring-[#2E86AB]"
                />
                <span className="text-sm font-medium text-slate-700">Show delivered orders</span>
              </label>
            </div>
            <div className="flex flex-col justify-end">
              <label className="flex items-center space-x-2 mb-2">
                <input
                  type="checkbox"
                  checked={showOverdueOnly}
                  onChange={(e) => setShowOverdueOnly(e.target.checked)}
                  className="rounded border-slate-300 text-red-600 focus:ring-red-500"
                />
                <span className="text-sm font-medium text-slate-700">Overdue only</span>
              </label>
            </div>
          </div>
        </Card>
      </div>

      {/* Shipping Orders List */}
      <div className="space-y-3">
        {shippingOrders.map((order) => (
          <Card key={order.id} className={`bg-white border rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 ease-in-out ${
            order.isOverdue ? 'border-red-300 bg-red-50' : 'border-slate-200'
          }`}>
            {/* Order Header */}
            <div className="px-4 py-3 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <h3 className="text-lg font-bold text-slate-800 leading-tight">{order.orderNumber}</h3>
                  <span className={getStatusBadge(order.status)}>{order.status}</span>
                  <span className={getPriorityBadge(order.priority)}>{order.priority}</span>
                  {order.isOverdue && (
                    <span className="px-2 py-1 rounded-full text-xs font-medium border bg-red-100 text-red-700 border-red-300">
                      OVERDUE
                    </span>
                  )}
                </div>
                {getActionButton(order)}
              </div>
              
              {/* Tracking Information */}
              <div className="mt-3 flex items-center space-x-4">
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
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Delivery Status */}
                <div>
                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Delivery Status</h4>
                  <div className="space-y-1">
                    <p className="text-xs text-slate-600">
                      <span className="font-medium">Patient:</span> {order.patient.initials} ({order.patient.patientId})
                    </p>
                    <p className="text-xs text-slate-600">
                      <span className="font-medium">Ship to:</span> {order.shippingAddress.attention}
                    </p>
                    {order.deliveryIssues && (
                      <div className="mt-2 p-2 bg-orange-50 border border-orange-200 rounded-lg">
                        <p className="text-xs font-medium text-orange-800">Issue Reported:</p>
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
          <Card className="bg-white border border-slate-200 rounded-xl shadow-lg p-12 text-center">
            <div className="mx-auto w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2 leading-tight">No Shipped Orders</h3>
            <p className="text-slate-600 text-base">No orders match your current filter criteria</p>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ShippingLogistics; 