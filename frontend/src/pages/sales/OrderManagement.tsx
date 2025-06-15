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
  doctorId: string;
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
  salesRepId?: string;
  distributorId?: string;
  regionalDistributorId?: string;
  createdBy?: string;
}

// Mock data with hierarchy relationships
const mockOrders: Order[] = [
  {
    id: 'ORD-2024-001',
    doctorName: 'Dr. John Smith',
    doctorId: 'D-001',
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
    doctorId: 'D-002',
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
    doctorId: 'D-003',
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
    doctorId: 'D-006',
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
  }
];

const SalesOrderManagement: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [filteredData, setFilteredData] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterResult, setFilterResult] = useState<any>(null);

  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [doctorFilter, setDoctorFilter] = useState<string>('All');
  const [regionFilter, setRegionFilter] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [dateRange, setDateRange] = useState<string>('All');
  const [valueRange, setValueRange] = useState<string>('All');

  useEffect(() => {
    const loadFilteredData = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        console.log('🔍 [SalesOrderManagement] Applying hierarchy filtering...');
        console.log('👤 Current user:', user.email, 'Role:', user.role);
        console.log('🚨 SECURITY: Filtering orders to show only assigned doctors');

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

        // Apply hierarchy filtering - Sales sees only their assigned doctors
        const result = HierarchyFilteringService.filterOrderDataByHierarchy(ordersForFiltering, user);

        console.log('📦 Sales order hierarchy filtering result:', {
          totalCount: result.totalCount,
          filteredCount: result.filteredCount,
          filterReason: result.filterReason,
          allowedDoctorIds: result.allowedDoctorIds,
          downlineDoctors: result.userHierarchyInfo.downlineDoctors.length
        });

        // Filter original orders based on allowed doctor IDs only
        const allowedDoctorIds = result.allowedDoctorIds;
        const hierarchyFilteredOrders = mockOrders.filter(order => {
          const isAllowed = allowedDoctorIds.includes(order.doctorId);

          if (isAllowed) {
            console.log(`✅ Including order ${order.id} from doctor ${order.doctorId} (${order.doctorName})`);
          } else {
            console.log(`❌ SECURITY: Excluding order ${order.id} from doctor ${order.doctorId} (${order.doctorName}) - not assigned`);
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

    // Doctor filter - only shows authorized doctors
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

  // Get unique doctors from FILTERED data only (not all distributors)
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
              <h1 className="text-3xl font-bold text-slate-800 tracking-tight leading-tight">Sales Order Management - View Only</h1>
              <div className="flex items-center bg-amber-50 border border-amber-200 rounded-lg px-3 py-1">
                <ShieldCheckIcon className="h-4 w-4 text-amber-600 mr-2" />
                <span className="text-sm font-medium text-amber-700">View Only Access</span>
              </div>
            </div>
            <p className="text-slate-600 mt-1 text-lg leading-normal">Monitor orders from your assigned doctors</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm px-4 py-2 border border-slate-200">
            <div className="text-sm text-slate-500">Filtered Results</div>
            <div className="text-2xl font-bold text-slate-900">{getFilteredOrders().length}</div>
          </div>
        </div>

        {/* Blue filtering banner */}
        {filterResult && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <div className="flex items-center">
              <CheckCircleIcon className="h-5 w-5 text-blue-600 mr-3" />
              <div className="flex-1">
                <div className="text-sm font-medium text-blue-900">
                  🔒 Data isolation active - showing orders from {filterResult.allowedDoctorIds?.length || 0} assigned doctors only
                </div>
                <div className="text-xs text-blue-700 mt-1">
                  Sales scope: {filterResult.filterReason} • Authorized doctors: {filterResult.userHierarchyInfo?.downlineDoctors?.length || 0}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Analytics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-slate-100 rounded-lg">
                <CurrencyDollarIcon className="h-6 w-6 text-slate-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-600">Authorized Orders</p>
                <p className="text-2xl font-bold text-slate-900">{analytics.totalOrders}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <ClockIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-600">Processing</p>
                <p className="text-2xl font-bold text-slate-900">{analytics.processing}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <ExclamationTriangleIcon className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-600">Shipped Today</p>
                <p className="text-2xl font-bold text-slate-900">{analytics.shippedToday}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircleIcon className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-600">Delivered This Week</p>
                <p className="text-2xl font-bold text-slate-900">{analytics.deliveredThisWeek}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="p-4 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-500 mb-1">Search</label>
              <div className="relative">
                <MagnifyingGlassIcon className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search orders, doctors, facilities..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-4 py-2 w-full border border-slate-300 rounded-md text-sm focus:ring-slate-500 focus:border-slate-500"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:ring-slate-500 focus:border-slate-500"
              >
                <option value="All">All Statuses</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {/* Doctor Filter */}
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Doctor (Authorized Only)</label>
              <select
                value={doctorFilter}
                onChange={(e) => setDoctorFilter(e.target.value)}
                className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:ring-slate-500 focus:border-slate-500"
              >
                <option value="All">All Doctors ({uniqueDoctors.length})</option>
                {uniqueDoctors.map(doctor => (
                  <option key={doctor} value={doctor}>{doctor}</option>
                ))}
              </select>
            </div>

            {/* Date Range */}
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Date Range</label>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:ring-slate-500 focus:border-slate-500"
              >
                <option value="All">All Dates</option>
                <option value="Today">Today</option>
                <option value="Week">Last 7 Days</option>
                <option value="Month">Last 30 Days</option>
              </select>
            </div>

            {/* Clear Filters */}
            <div className="flex items-end">
              {hasActiveFilters && (
                <button
                  onClick={clearAllFilters}
                  className="w-full px-3 py-2 text-sm text-slate-600 bg-slate-100 border border-slate-300 rounded-md hover:bg-slate-200 focus:ring-2 focus:ring-slate-500"
                >
                  Clear All
                </button>
              )}
            </div>
          </div>
        </Card>

        {/* Orders Table */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Order ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Doctor</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Facility</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Products</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {getFilteredOrders().map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-slate-900">
                      {order.id}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-900">
                      {order.doctorName}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-900">
                      {order.facility}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-900">
                      {order.products}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-900">
                      {formatCurrency(order.totalAmount)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={getStatusBadge(order.status)}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-500">
                      {order.orderDate}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                      <button
                        className="text-slate-600 hover:text-slate-900 flex items-center opacity-70 cursor-not-allowed"
                        title="View Only - No Actions Available"
                        disabled
                      >
                        <EyeIcon className="h-4 w-4 mr-1" />
                        View Only
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {getFilteredOrders().length === 0 && (
            <div className="text-center py-12">
              <div className="text-slate-500 text-lg">No orders found</div>
              <div className="text-slate-400 text-sm mt-1">
                {hasActiveFilters ? 'Try adjusting your filters' : 'No orders available for your assigned doctors'}
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default SalesOrderManagement;