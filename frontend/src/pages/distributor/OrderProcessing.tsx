import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { HierarchyFilteringService } from '../../services/hierarchyFilteringService';
import { Card } from '../../components/shared/ui/Card';
import {
  EyeIcon,
  MagnifyingGlassIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

interface Order {
  id: string;
  doctorName: string;
  doctorId: string; // Add doctorId for hierarchy filtering
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
  // Hierarchy fields for filtering
  salesRepId?: string;
  distributorId?: string;
  regionalDistributorId?: string;
  createdBy?: string;
}

// Updated mock data with hierarchy relationships
const mockOrders: Order[] = [
  {
    id: 'ORD-2024-001',
    doctorName: 'Dr. John Smith',
    doctorId: 'D-001', // Regional Distributor West
    facility: 'Metro General Hospital',
    products: '3 items',
    totalAmount: 2450.00,
    status: 'delivered',
    orderDate: '2024-12-18',
    distributor: 'Regional Distributor West',
    region: 'West',
    productCount: 3,
    shippedDate: '2024-12-19',
    deliveredDate: '2024-12-20',
    salesRepId: 'sales-rep-1',
    distributorId: 'regional-dist-1',
    regionalDistributorId: 'regional-dist-1',
    createdBy: 'D-001'
  },
  {
    id: 'ORD-2024-002',
    doctorName: 'Dr. Michael Brown',
    doctorId: 'D-002', // Regional Distributor West
    facility: 'St. Mary\'s Medical Center',
    products: '5 items',
    totalAmount: 3200.00,
    status: 'shipped',
    orderDate: '2024-12-19',
    distributor: 'Regional Distributor West',
    region: 'West',
    productCount: 5,
    shippedDate: '2024-12-20',
    salesRepId: 'sales-rep-1',
    distributorId: 'regional-dist-1',
    regionalDistributorId: 'regional-dist-1',
    createdBy: 'D-002'
  },
  {
    id: 'ORD-2024-003',
    doctorName: 'Dr. Jennifer Lee',
    doctorId: 'D-003', // Regional Distributor West
    facility: 'Austin Regional Medical',
    products: '2 items',
    totalAmount: 1850.00,
    status: 'processing',
    orderDate: '2024-12-20',
    distributor: 'Regional Distributor West',
    region: 'West',
    productCount: 2,
    salesRepId: 'sales-rep-3',
    distributorId: 'regional-dist-1',
    regionalDistributorId: 'regional-dist-1',
    createdBy: 'D-003'
  },
  {
    id: 'ORD-2024-004',
    doctorName: 'Dr. Carlos Martinez',
    doctorId: 'D-006', // Regional Distributor West
    facility: 'Central Texas Medical',
    products: '4 items',
    totalAmount: 2900.00,
    status: 'shipped',
    orderDate: '2024-12-19',
    distributor: 'Regional Distributor West',
    region: 'West',
    productCount: 4,
    shippedDate: '2024-12-20',
    salesRepId: 'sales-rep-1',
    distributorId: 'regional-dist-1',
    regionalDistributorId: 'regional-dist-1',
    createdBy: 'D-006'
  },
  {
    id: 'ORD-2024-005',
    doctorName: 'Dr. Robert Chen',
    doctorId: 'D-004', // Regional Distributor East
    facility: 'East Coast Medical Center',
    products: '1 item',
    totalAmount: 890.00,
    status: 'delivered',
    orderDate: '2024-12-17',
    distributor: 'Regional Distributor East',
    region: 'East',
    productCount: 1,
    shippedDate: '2024-12-18',
    deliveredDate: '2024-12-19',
    salesRepId: 'sales-rep-2',
    distributorId: 'regional-dist-2',
    regionalDistributorId: 'regional-dist-2',
    createdBy: 'D-004'
  },
  {
    id: 'ORD-2024-006',
    doctorName: 'Dr. Lisa Anderson',
    doctorId: 'D-005', // Regional Distributor East
    facility: 'Southeast Regional Hospital',
    products: '6 items',
    totalAmount: 4100.00,
    status: 'delivered',
    orderDate: '2024-12-16',
    distributor: 'Regional Distributor East',
    region: 'East',
    productCount: 6,
    shippedDate: '2024-12-17',
    deliveredDate: '2024-12-18',
    salesRepId: 'sales-rep-2',
    distributorId: 'regional-dist-2',
    regionalDistributorId: 'regional-dist-2',
    createdBy: 'D-005'
  },
  // Additional orders from other distributors (will be filtered out for Regional Distributors)
  {
    id: 'ORD-2024-007',
    doctorName: 'Dr. Jennifer Martinez',
    doctorId: 'D-007',
    facility: 'Cedar Park Family Health',
    products: '2 items',
    totalAmount: 1650.00,
    status: 'cancelled',
    orderDate: '2024-12-18',
    distributor: 'Northwest Medical',
    region: 'Northwest',
    productCount: 2,
    salesRepId: 'sales-rep-4',
    distributorId: 'regional-dist-3',
    regionalDistributorId: 'regional-dist-3',
    createdBy: 'D-007'
  },
  {
    id: 'ORD-2024-008',
    doctorName: 'Dr. Mark Thompson',
    doctorId: 'D-008',
    facility: 'Dallas Medical Center',
    products: '7 items',
    totalAmount: 5200.00,
    status: 'processing',
    orderDate: '2024-12-20',
    distributor: 'Dallas Health Supply',
    region: 'Central',
    productCount: 7,
    salesRepId: 'sales-rep-5',
    distributorId: 'regional-dist-4',
    regionalDistributorId: 'regional-dist-4',
    createdBy: 'D-008'
  }
];

const OrderProcessing: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [filteredData, setFilteredData] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterResult, setFilterResult] = useState<any>(null);

  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [doctorFilter, setDoctorFilter] = useState<string>('All'); // SECURITY: Changed from distributorFilter
  const [regionFilter, setRegionFilter] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [dateRange, setDateRange] = useState<string>('All');
  const [valueRange, setValueRange] = useState<string>('All');

  // Detect current distributor context from URL
  const getDistributorContext = () => {
    if (location.pathname.includes('/distributor-regional/')) {
      return 'regional';
    }
    if (location.pathname.includes('/distributor/')) {
      return 'master';
    }
    return 'master'; // Default fallback
  };

  // Context-aware navigation function
  const navigateToOrderDetail = (orderId: string) => {
    const context = getDistributorContext();

    console.log('🚀 OrderProcessing Navigation Context:', {
      currentPath: location.pathname,
      detectedContext: context,
      orderId: orderId
    });

    if (context === 'regional') {
      console.log('🚀 Navigating to Regional Distributor order detail');
      navigate(`/distributor-regional/order-management/${orderId}`);
    } else {
      console.log('🚀 Navigating to Master Distributor order detail');
      navigate(`/distributor/orders/${orderId}`);
    }
  };

  useEffect(() => {
    const loadFilteredData = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        console.log('🔍 [OrderProcessing] Applying hierarchy filtering...');
        console.log('👤 Current user:', user.email, 'Role:', user.role);
        console.log('🚨 SECURITY: Filtering orders to prevent data leakage between distributors');

        // Convert Order[] to SharedOrder[] format for filtering
        const ordersForFiltering = mockOrders.map(order => ({
          id: order.id,
          orderNumber: order.id,
          date: order.orderDate,
          time: '09:00 AM',
          doctorId: order.doctorId,
          doctorName: order.doctorName,
          doctorEmail: `${order.doctorId}@healthcare.local`,
          facility: order.facility,
          patient: { initials: 'P.T.', patientId: 'PT-123' },
          ivrReference: 'IVR-REF',
          products: [],
          shippingAddress: {
            facility: order.facility,
            address: '123 Medical Dr',
            city: 'Austin',
            state: 'TX',
            zipCode: '78701'
          },
          priority: 'Standard' as const,
          status: 'Pending Fulfillment' as const,
          totalItems: order.productCount,
          salesRepId: order.salesRepId,
          distributorId: order.distributorId,
          regionalDistributorId: order.regionalDistributorId,
          createdBy: order.createdBy
        }));

        // Apply hierarchy filtering - CRITICAL SECURITY STEP
        const result = HierarchyFilteringService.filterOrderDataByHierarchy(ordersForFiltering, user);

        console.log('📦 Order hierarchy filtering result:', {
          totalCount: result.totalCount,
          filteredCount: result.filteredCount,
          filterReason: result.filterReason,
          allowedDoctorIds: result.allowedDoctorIds,
          downlineDoctors: result.userHierarchyInfo.downlineDoctors.length
        });

        // SECURITY: Filter original orders based on allowed doctor IDs only
        const allowedDoctorIds = result.allowedDoctorIds;
        const hierarchyFilteredOrders = mockOrders.filter(order => {
          const isAllowed = allowedDoctorIds.includes(order.doctorId) ||
                           order.distributorId === result.userHierarchyInfo.userId ||
                           order.regionalDistributorId === result.userHierarchyInfo.userId;

          if (isAllowed) {
            console.log(`✅ Including order ${order.id} from doctor ${order.doctorId} (${order.doctorName})`);
          } else {
            console.log(`❌ SECURITY: Excluding order ${order.id} from doctor ${order.doctorId} (${order.doctorName}) - not in downline`);
          }

          return isAllowed;
        });

        console.log(`🔒 SECURITY APPLIED: Showing ${hierarchyFilteredOrders.length} of ${mockOrders.length} orders`);

        setFilterResult(result);
        setFilteredData(hierarchyFilteredOrders);

      } catch (error) {
        console.error('❌ Error loading order data:', error);
        setError('Failed to load order data');
        setFilteredData([]);
        setFilterResult(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadFilteredData();
  }, [user]);

  // Filter orders based on selected criteria (applied to hierarchy-filtered data)
  const getFilteredOrders = () => {
    let filtered = filteredData;

    // Search filter - only searches within allowed data
    if (searchTerm) {
      filtered = filtered.filter(order =>
        order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.doctorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.facility.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.products.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'All') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    // SECURITY: Doctor filter (replaces distributor filter) - only shows authorized doctors
    if (doctorFilter !== 'All') {
      filtered = filtered.filter(order => order.doctorName === doctorFilter);
    }

    // Region filter - only shows regions from authorized data
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

  // Calculate analytics based on FILTERED data only (security requirement)
  const analytics = {
    totalOrders: filteredData.length,
    processing: filteredData.filter(o => o.status === 'processing').length,
    shippedToday: filteredData.filter(o => o.status === 'shipped').length,
    deliveredThisWeek: filteredData.filter(o => o.status === 'delivered').length
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

  // SECURITY: Get unique doctors from FILTERED data only (not all distributors)
  const uniqueDoctors = [...new Set(filteredData.map(order => order.doctorName))];
  const uniqueRegions = [...new Set(filteredData.map(order => order.region))];

  // Clear filters function for better UX
  const clearAllFilters = () => {
    setStatusFilter('All');
    setDoctorFilter('All');
    setRegionFilter('All');
    setSearchTerm('');
    setDateRange('All');
    setValueRange('All');
  };

  // Check if any filters are active
  const hasActiveFilters = statusFilter !== 'All' || doctorFilter !== 'All' ||
                          regionFilter !== 'All' || searchTerm !== '' ||
                          dateRange !== 'All' || valueRange !== 'All';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-slate-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading order data with security filtering...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-600 text-lg font-medium mb-4">{error}</div>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-slate-600 text-white rounded hover:bg-slate-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Please log in to access this page.</div>
      </div>
    );
  }

  return (
    <div className="space-y-4 bg-slate-50 min-h-screen">
      {/* Header with filtering summary */}
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

        {/* Summary Cards - based on filtered data only */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4 text-center shadow-sm">
            <div className="text-2xl font-bold text-slate-700 leading-tight">{analytics.totalOrders}</div>
            <div className="text-sm font-medium text-slate-600 mt-1">Total Orders</div>
            <div className="text-xs text-slate-500 mt-1">Authorized orders</div>
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
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-slate-800">Filter Orders</h3>
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="text-sm text-slate-600 hover:text-slate-800 underline"
              >
                Clear all filters
              </button>
            )}
          </div>

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
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
              >
                <option value="All">All Statuses</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {/* SECURITY: Doctor Filter (replaces Distributor Filter) */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Doctor
                <span className="text-xs text-green-600 ml-1">(Authorized Only)</span>
              </label>
              <select
                value={doctorFilter}
                onChange={(e) => setDoctorFilter(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
              >
                <option value="All">All Doctors ({uniqueDoctors.length})</option>
                {uniqueDoctors.map(doctor => (
                  <option key={doctor} value={doctor}>{doctor}</option>
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
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
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
          <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Order Value</label>
              <div className="relative">
                <CurrencyDollarIcon className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <select
                  value={valueRange}
                  onChange={(e) => setValueRange(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
                >
                  <option value="All">All Values</option>
                  <option value="Under1000">Under $1,000</option>
                  <option value="1000to3000">$1,000 - $3,000</option>
                  <option value="Over3000">Over $3,000</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Region</label>
              <select
                value={regionFilter}
                onChange={(e) => setRegionFilter(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
              >
                <option value="All">All Regions ({uniqueRegions.length})</option>
                {uniqueRegions.map(region => (
                  <option key={region} value={region}>{region}</option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2 flex items-end">
              <div className="flex items-center bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 w-full">
                <ExclamationTriangleIcon className="h-4 w-4 text-slate-500 mr-2" />
                <span className="text-sm text-slate-600">Read-only monitoring access - no editing capabilities</span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* SECURITY: READ-ONLY Orders Table with filtered data */}
      <Card className="bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-slate-800">
              Order Results ({getFilteredOrders().length} of {filteredData.length} orders)
            </h3>
            {hasActiveFilters && (
              <span className="text-sm text-slate-600 bg-blue-50 px-2 py-1 rounded">
                Filters active
              </span>
            )}
          </div>
        </div>

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
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Region</th>
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
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600">{order.region}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    <button
                      onClick={() => {
                        console.log('🚀 Navigating to order detail');
                        console.log('Order ID:', order.id);
                        console.log('Target URL:', `/distributor/orders/${order.id}`);
                        navigateToOrderDetail(order.id);
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
            <p className="text-slate-600 text-base">
              {hasActiveFilters
                ? 'No orders match your current filter criteria. Try adjusting your filters.'
                : 'No orders available for your current access level.'
              }
            </p>
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="mt-4 px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
              >
                Clear All Filters
              </button>
            )}
          </div>
        )}
      </Card>
    </div>
  );
};

export default OrderProcessing;