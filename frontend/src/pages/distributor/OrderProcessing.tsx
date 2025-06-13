import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  EyeIcon,
  MagnifyingGlassIcon,
  CalendarIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';
import { Card } from '../../components/shared/ui/Card';

interface Order {
  id: string;
  doctorName: string;
  facility: string;
  products: string;
  totalAmount: number;
  status: 'processing' | 'shipped' | 'delivered' | 'cancelled';
  orderDate: string;
  distributor: string;
  region: string;
  productCount: number;
  shippedDate?: string;
  deliveredDate?: string;
}

// Comprehensive mock data for Master Distributor monitoring
const mockOrders: Order[] = [
  {
    id: 'ORD-2024-001',
    doctorName: 'Dr. Sarah Chen',
    facility: 'Metro General Hospital',
    products: '3 items',
    totalAmount: 2450.00,
    status: 'delivered',
    orderDate: '2024-12-18',
    distributor: 'MedSupply East',
    region: 'East Coast',
    productCount: 3,
    shippedDate: '2024-12-19',
    deliveredDate: '2024-12-20'
  },
  {
    id: 'ORD-2024-002',
    doctorName: 'Dr. Michael Rodriguez',
    facility: 'St. Mary\'s Medical Center',
    products: '5 items',
    totalAmount: 3200.00,
    status: 'shipped',
    orderDate: '2024-12-19',
    distributor: 'HealthCare Partners',
    region: 'Southwest',
    productCount: 5,
    shippedDate: '2024-12-20'
  },
  {
    id: 'ORD-2024-003',
    doctorName: 'Dr. Lisa Park',
    facility: 'Austin Regional Medical',
    products: '2 items',
    totalAmount: 1850.00,
    status: 'processing',
    orderDate: '2024-12-20',
    distributor: 'Texas Medical Supply',
    region: 'Central',
    productCount: 2
  },
  {
    id: 'ORD-2024-004',
    doctorName: 'Dr. James Wilson',
    facility: 'Central Texas Medical',
    products: '4 items',
    totalAmount: 2900.00,
    status: 'shipped',
    orderDate: '2024-12-19',
    distributor: 'Regional Health Partners',
    region: 'Central',
    productCount: 4,
    shippedDate: '2024-12-20'
  },
  {
    id: 'ORD-2024-005',
    doctorName: 'Dr. Emma Davis',
    facility: 'North Austin Clinic',
    products: '1 item',
    totalAmount: 890.00,
    status: 'delivered',
    orderDate: '2024-12-17',
    distributor: 'Austin Medical Group',
    region: 'Central',
    productCount: 1,
    shippedDate: '2024-12-18',
    deliveredDate: '2024-12-19'
  },
  {
    id: 'ORD-2024-006',
    doctorName: 'Dr. Robert Chen',
    facility: 'South Austin Medical',
    products: '6 items',
    totalAmount: 4100.00,
    status: 'delivered',
    orderDate: '2024-12-16',
    distributor: 'MedSupply South',
    region: 'Southwest',
    productCount: 6,
    shippedDate: '2024-12-17',
    deliveredDate: '2024-12-18'
  },
  {
    id: 'ORD-2024-007',
    doctorName: 'Dr. Jennifer Martinez',
    facility: 'Cedar Park Family Health',
    products: '2 items',
    totalAmount: 1650.00,
    status: 'cancelled',
    orderDate: '2024-12-18',
    distributor: 'Northwest Medical',
    region: 'Northwest',
    productCount: 2
  },
  {
    id: 'ORD-2024-008',
    doctorName: 'Dr. Mark Thompson',
    facility: 'Dallas Medical Center',
    products: '7 items',
    totalAmount: 5200.00,
    status: 'processing',
    orderDate: '2024-12-20',
    distributor: 'Dallas Health Supply',
    region: 'Central',
    productCount: 7
  },
  {
    id: 'ORD-2024-009',
    doctorName: 'Dr. Amanda Foster',
    facility: 'Houston General',
    products: '3 items',
    totalAmount: 2750.00,
    status: 'shipped',
    orderDate: '2024-12-19',
    distributor: 'Gulf Coast Medical',
    region: 'Southeast',
    productCount: 3,
    shippedDate: '2024-12-20'
  },
  {
    id: 'ORD-2024-010',
    doctorName: 'Dr. Kevin Lee',
    facility: 'Phoenix Medical Plaza',
    products: '4 items',
    totalAmount: 3400.00,
    status: 'delivered',
    orderDate: '2024-12-15',
    distributor: 'Desert Medical Supply',
    region: 'Southwest',
    productCount: 4,
    shippedDate: '2024-12-16',
    deliveredDate: '2024-12-17'
  },
  {
    id: 'ORD-2024-011',
    doctorName: 'Dr. Rachel Kim',
    facility: 'Seattle Medical Center',
    products: '5 items',
    totalAmount: 3800.00,
    status: 'processing',
    orderDate: '2024-12-20',
    distributor: 'Pacific Northwest Supply',
    region: 'Northwest',
    productCount: 5
  },
  {
    id: 'ORD-2024-012',
    doctorName: 'Dr. David Brown',
    facility: 'Miami General Hospital',
    products: '8 items',
    totalAmount: 6200.00,
    status: 'delivered',
    orderDate: '2024-12-14',
    distributor: 'Southeast Medical',
    region: 'Southeast',
    productCount: 8,
    shippedDate: '2024-12-15',
    deliveredDate: '2024-12-16'
  }
];

const OrderProcessing: React.FC = () => {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [distributorFilter, setDistributorFilter] = useState<string>('All');
  const [regionFilter, setRegionFilter] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [dateRange, setDateRange] = useState<string>('All');
  const [valueRange, setValueRange] = useState<string>('All');

  // Filter orders based on selected criteria
  const getFilteredOrders = () => {
    let filtered = mockOrders;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(order =>
        order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.doctorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.facility.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'All') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    // Distributor filter
    if (distributorFilter !== 'All') {
      filtered = filtered.filter(order => order.distributor === distributorFilter);
    }

    // Region filter
    if (regionFilter !== 'All') {
      filtered = filtered.filter(order => order.region === regionFilter);
    }

    // Date range filter
    if (dateRange !== 'All') {
      const now = new Date();
      const filterDate = new Date();

      switch (dateRange) {
        case 'Today':
          filterDate.setHours(0, 0, 0, 0);
          break;
        case 'Week':
          filterDate.setDate(now.getDate() - 7);
          break;
        case 'Month':
          filterDate.setMonth(now.getMonth() - 1);
          break;
      }

      if (dateRange !== 'All') {
        filtered = filtered.filter(order => new Date(order.orderDate) >= filterDate);
      }
    }

    // Value range filter
    if (valueRange !== 'All') {
      switch (valueRange) {
        case 'Under1000':
          filtered = filtered.filter(order => order.totalAmount < 1000);
          break;
        case '1000to3000':
          filtered = filtered.filter(order => order.totalAmount >= 1000 && order.totalAmount <= 3000);
          break;
        case 'Over3000':
          filtered = filtered.filter(order => order.totalAmount > 3000);
          break;
      }
    }

    return filtered;
  };

  // Calculate analytics
  const analytics = {
    totalOrders: 89, // Updated to match dashboard
    processing: 23, // Being prepared
    shippedToday: 18, // Out for delivery
    deliveredThisWeek: 67 // Completed
  };

  const getStatusBadge = (status: string) => {
    const statusStyles = {
      processing: 'bg-blue-50 text-blue-700 border-blue-200',
      shipped: 'bg-orange-50 text-orange-700 border-orange-200',
      delivered: 'bg-green-50 text-green-700 border-green-200',
      cancelled: 'bg-gray-50 text-gray-700 border-gray-200'
    };

    return `px-3 py-1 rounded-full text-sm font-medium border ${statusStyles[status as keyof typeof statusStyles]}`;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const uniqueDistributors = [...new Set(mockOrders.map(order => order.distributor))];
  const uniqueRegions = [...new Set(mockOrders.map(order => order.region))];

  return (
    <div className="space-y-4 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="pt-1 pb-3">
        <div className="flex justify-between items-center mb-3">
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-3xl font-bold text-slate-800 tracking-tight leading-tight">Order Processing - Network Overview</h1>
              <div className="flex items-center bg-amber-50 border border-amber-200 rounded-lg px-3 py-1">
                <ShieldCheckIcon className="h-4 w-4 text-amber-600 mr-2" />
                <span className="text-sm font-medium text-amber-700">View Only Access</span>
              </div>
            </div>
            <p className="text-slate-600 mt-1 text-lg leading-normal">Monitor orders and fulfillment across your distribution network</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm px-4 py-2 border border-slate-200">
            <span className="text-sm font-medium text-slate-600">Active Orders: </span>
            <span className="text-xl font-bold text-slate-900">{analytics.totalOrders}</span>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4 text-center shadow-sm">
            <div className="text-2xl font-bold text-slate-700 leading-tight">{analytics.totalOrders}</div>
            <div className="text-sm font-medium text-slate-600 mt-1">Total Orders</div>
            <div className="text-xs text-slate-500 mt-1">Active orders</div>
          </div>
          <div className="bg-white border border-blue-200 rounded-xl p-4 text-center shadow-sm">
            <div className="text-2xl font-bold text-blue-700 leading-tight">{analytics.processing}</div>
            <div className="text-sm font-medium text-blue-600 mt-1">Processing</div>
            <div className="text-xs text-blue-500 mt-1">Being prepared</div>
          </div>
          <div className="bg-white border border-orange-200 rounded-xl p-4 text-center shadow-sm">
            <div className="text-2xl font-bold text-orange-700 leading-tight">{analytics.shippedToday}</div>
            <div className="text-sm font-medium text-orange-600 mt-1">Shipped Today</div>
            <div className="text-xs text-orange-500 mt-1">Out for delivery</div>
          </div>
          <div className="bg-white border border-green-200 rounded-xl p-4 text-center shadow-sm">
            <div className="text-2xl font-bold text-green-700 leading-tight">{analytics.deliveredThisWeek}</div>
            <div className="text-sm font-medium text-green-600 mt-1">Delivered This Week</div>
            <div className="text-xs text-green-500 mt-1">Completed</div>
          </div>
        </div>

        {/* Search and Filters */}
        <Card className="bg-white border border-slate-200 rounded-xl shadow-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Search */}
            <div className="lg:col-span-2">
              <label className="block text-sm font-semibold text-slate-700 mb-2">Search</label>
              <div className="relative">
                <MagnifyingGlassIcon className="h-5 w-5 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by order ID, doctor, or facility..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 opacity-90"
              >
                <option value="All">All Statuses</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {/* Distributor Filter */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Distributor</label>
              <select
                value={distributorFilter}
                onChange={(e) => setDistributorFilter(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 opacity-90"
              >
                <option value="All">All Distributors</option>
                {uniqueDistributors.map(distributor => (
                  <option key={distributor} value={distributor}>{distributor}</option>
                ))}
              </select>
            </div>

            {/* Date Range Filter */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Date Range</label>
              <div className="relative">
                <CalendarIcon className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 opacity-90"
                >
                  <option value="All">All Time</option>
                  <option value="Today">Today</option>
                  <option value="Week">Last 7 Days</option>
                  <option value="Month">Last 30 Days</option>
                </select>
              </div>
            </div>
          </div>

          {/* Second Row of Filters */}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Order Value</label>
              <div className="relative">
                <CurrencyDollarIcon className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <select
                  value={valueRange}
                  onChange={(e) => setValueRange(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 opacity-90"
                >
                  <option value="All">All Values</option>
                  <option value="Under1000">Under $1,000</option>
                  <option value="1000to3000">$1,000 - $3,000</option>
                  <option value="Over3000">Over $3,000</option>
                </select>
              </div>
            </div>
            <div className="md:col-span-2 flex items-end">
              <div className="flex items-center bg-slate-100 border border-slate-200 rounded-lg px-3 py-2">
                <ExclamationTriangleIcon className="h-4 w-4 text-slate-500 mr-2" />
                <span className="text-sm text-slate-600">Read-only monitoring access - no editing capabilities</span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* READ-ONLY Orders Table */}
      <Card className="bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden opacity-95">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-slate-100">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Order ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Doctor/Facility</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Products</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Total Amount</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Order Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Distributor</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {getFilteredOrders().map((order) => (
                <tr key={order.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-slate-900">{order.id}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600">
                    <div>
                      <div className="font-medium">{order.doctorName}</div>
                      <div className="text-xs text-slate-500">{order.facility}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600">{order.products}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-slate-900">{formatCurrency(order.totalAmount)}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={getStatusBadge(order.status)}>
                      {order.status === 'processing' ? 'Processing' :
                       order.status === 'shipped' ? 'Shipped' :
                       order.status === 'delivered' ? 'Delivered' :
                       'Cancelled'}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600">
                    {new Date(order.orderDate).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600">{order.distributor}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    <button
                      onClick={() => {
                        console.log('🚀 CRITICAL DEBUG: Navigating to order detail');
                        console.log('Order ID:', order.id);
                        console.log('Target URL:', `/distributor/orders/${order.id}`);
                        console.log('Current location:', window.location.href);
                        console.log('Using React Router navigate...');
                        navigate(`/distributor/orders/${order.id}`);
                      }}
                      className="inline-flex items-center px-3 py-1 border border-slate-300 rounded-md text-sm font-medium text-slate-600 bg-white hover:bg-slate-50 transition-colors"
                    >
                      <EyeIcon className="h-4 w-4 mr-1" />
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {getFilteredOrders().length === 0 && (
          <div className="p-12 text-center">
            <div className="mx-auto w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2 leading-tight">No Orders Found</h3>
            <p className="text-slate-600 text-base">No orders match your current filter criteria</p>
          </div>
        )}
      </Card>
    </div>
  );
};

export default OrderProcessing;