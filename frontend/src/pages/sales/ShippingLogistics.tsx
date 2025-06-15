import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { HierarchyFilteringService } from '../../services/hierarchyFilteringService';
import {
  EyeIcon,
  MagnifyingGlassIcon,
  CalendarIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  TruckIcon,
  MapPinIcon,
  ClockIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { Card } from '../../components/shared/ui/Card';

interface Shipment {
  id: string;
  orderId: string;
  doctorName: string;
  doctorId: string;
  facility: string;
  trackingNumber: string;
  carrier: 'UPS' | 'FedEx' | 'USPS' | 'DHL' | 'Other';
  status: 'preparing' | 'picked_up' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'exception';
  shippedDate: string;
  estimatedDelivery: string;
  actualDelivery?: string;
  destination: string;
  distributor: string;
  region: string;
  packageCount: number;
  weight: string;
  priority: 'standard' | 'expedited' | 'overnight';
  lastUpdate: string;
  currentLocation?: string;
  salesRepId?: string;
  distributorId?: string;
  regionalDistributorId?: string;
  createdBy?: string;
}

// Mock data with hierarchy relationships
const mockShipments: Shipment[] = [
  {
    id: 'SHP-2024-001',
    orderId: 'ORD-2024-001',
    doctorName: 'Dr. John Smith',
    doctorId: 'D-001',
    facility: 'Metro General Hospital',
    trackingNumber: '1Z999AA1234567890',
    carrier: 'UPS',
    status: 'delivered',
    shippedDate: '2024-12-19',
    estimatedDelivery: '2024-12-20',
    actualDelivery: '2024-12-20',
    destination: 'Austin, TX',
    distributor: 'Regional Distributor West',
    region: 'West',
    packageCount: 2,
    weight: '15.2 lbs',
    priority: 'standard',
    lastUpdate: '2024-12-20T14:30:00Z',
    currentLocation: 'Delivered',
    salesRepId: 'sales-rep-1',
    distributorId: 'regional-dist-1',
    regionalDistributorId: 'regional-dist-1',
    createdBy: 'D-001'
  },
  {
    id: 'SHP-2024-002',
    orderId: 'ORD-2024-002',
    doctorName: 'Dr. Michael Brown',
    doctorId: 'D-002',
    facility: 'St. Mary\'s Medical Center',
    trackingNumber: '7712345678901234',
    carrier: 'FedEx',
    status: 'out_for_delivery',
    shippedDate: '2024-12-20',
    estimatedDelivery: '2024-12-21',
    destination: 'Austin, TX',
    distributor: 'Regional Distributor West',
    region: 'West',
    packageCount: 3,
    weight: '22.8 lbs',
    priority: 'expedited',
    lastUpdate: '2024-12-21T08:15:00Z',
    currentLocation: 'Austin, TX - Out for delivery',
    salesRepId: 'sales-rep-1',
    distributorId: 'regional-dist-1',
    regionalDistributorId: 'regional-dist-1',
    createdBy: 'D-002'
  },
  {
    id: 'SHP-2024-003',
    orderId: 'ORD-2024-003',
    doctorName: 'Dr. Jennifer Lee',
    doctorId: 'D-003',
    facility: 'Austin Regional Medical',
    trackingNumber: '9400111899562123456789',
    carrier: 'USPS',
    status: 'in_transit',
    shippedDate: '2024-12-20',
    estimatedDelivery: '2024-12-22',
    destination: 'Austin, TX',
    distributor: 'Regional Distributor West',
    region: 'West',
    packageCount: 1,
    weight: '8.5 lbs',
    priority: 'standard',
    lastUpdate: '2024-12-21T06:45:00Z',
    currentLocation: 'Dallas, TX - In transit',
    salesRepId: 'sales-rep-3',
    distributorId: 'regional-dist-1',
    regionalDistributorId: 'regional-dist-1',
    createdBy: 'D-003'
  },
  {
    id: 'SHP-2024-004',
    orderId: 'ORD-2024-004',
    doctorName: 'Dr. Carlos Martinez',
    doctorId: 'D-006',
    facility: 'Central Texas Medical',
    trackingNumber: '1Z999AA1987654321',
    carrier: 'UPS',
    status: 'picked_up',
    shippedDate: '2024-12-21',
    estimatedDelivery: '2024-12-23',
    destination: 'Austin, TX',
    distributor: 'Regional Distributor West',
    region: 'West',
    packageCount: 4,
    weight: '31.7 lbs',
    priority: 'standard',
    lastUpdate: '2024-12-21T10:20:00Z',
    currentLocation: 'Origin facility',
    salesRepId: 'sales-rep-1',
    distributorId: 'regional-dist-1',
    regionalDistributorId: 'regional-dist-1',
    createdBy: 'D-006'
  }
];

const SalesShippingLogistics: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [filteredData, setFilteredData] = useState<Shipment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterResult, setFilterResult] = useState<any>(null);

  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [carrierFilter, setCarrierFilter] = useState<string>('All');
  const [doctorFilter, setDoctorFilter] = useState<string>('All');
  const [priorityFilter, setPriorityFilter] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [dateRange, setDateRange] = useState<string>('All');

  // Use ref to track if component is mounted to prevent state updates on unmounted component
  const isMountedRef = useRef(true);

  // Memoized function to load filtered data
  const loadFilteredData = useCallback(async () => {
    if (!user) {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
      return;
    }

    try {
      if (isMountedRef.current) {
        setIsLoading(true);
        setError(null);
      }

      console.log('🚢 [SalesShippingLogistics] Applying hierarchy filtering...');
      console.log('👤 Current user:', user.email, 'Role:', user.role);
      console.log('🚨 SECURITY: Filtering shipments to show only assigned doctors');

      // Convert Shipment[] to SharedOrder[] format for filtering
      const shipmentsForFiltering = mockShipments.map(shipment => ({
        id: shipment.id,
        orderNumber: shipment.orderId,
        date: shipment.shippedDate,
        time: '09:00 AM',
        doctorId: shipment.doctorId,
        doctorName: shipment.doctorName,
        doctorEmail: `${shipment.doctorId}@healthcare.local`,
        facility: shipment.facility,
        patient: { initials: 'P.T.', patientId: 'PT-123' },
        ivrReference: 'IVR-REF',
        products: [],
        shippingAddress: {
          facility: shipment.facility,
          address: '123 Medical Dr',
          city: 'Austin',
          state: 'TX',
          zipCode: '78701'
        },
        priority: 'Standard' as const,
        status: 'Pending Fulfillment' as const,
        totalItems: shipment.packageCount,
        salesRepId: shipment.salesRepId,
        distributorId: shipment.distributorId,
        regionalDistributorId: shipment.regionalDistributorId,
        createdBy: shipment.createdBy
      }));

      // Apply hierarchy filtering - Sales sees only their assigned doctors
      const result = HierarchyFilteringService.filterOrderDataByHierarchy(shipmentsForFiltering, user);

      console.log('📦 Sales shipment hierarchy filtering result:', {
        totalCount: result.totalCount,
        filteredCount: result.filteredCount,
        filterReason: result.filterReason,
        allowedDoctorIds: result.allowedDoctorIds?.length || 0,
        downlineDoctors: result.userHierarchyInfo?.downlineDoctors?.length || 0
      });

      // Filter original shipments based on allowed doctor IDs only
      const allowedDoctorIds = result.allowedDoctorIds || [];
      const hierarchyFilteredShipments = mockShipments.filter(shipment => {
        const isAllowed = allowedDoctorIds.includes(shipment.doctorId);

        if (isAllowed) {
          console.log(`✅ Including shipment ${shipment.id} from doctor ${shipment.doctorId} (${shipment.doctorName})`);
        } else {
          console.log(`❌ SECURITY: Excluding shipment ${shipment.id} from doctor ${shipment.doctorId} (${shipment.doctorName}) - not assigned`);
        }

        return isAllowed;
      });

      console.log(`🔒 SECURITY APPLIED: Showing ${hierarchyFilteredShipments.length} of ${mockShipments.length} shipments`);

      if (isMountedRef.current) {
        setFilterResult(result);
        setFilteredData(hierarchyFilteredShipments);
      }

    } catch (error) {
      console.error('❌ Error loading shipment data:', error);
      if (isMountedRef.current) {
        setError('Failed to load shipment data');
        setFilteredData([]);
        setFilterResult(null);
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [user]);

  useEffect(() => {
    loadFilteredData();
  }, [loadFilteredData]);

  // Cleanup function to prevent memory leaks
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Filter shipments based on selected criteria (applied to hierarchy-filtered data)
  const getFilteredShipments = useCallback(() => {
    let filtered = filteredData || [];

    // Search filter - only searches within allowed data
    if (searchTerm) {
      filtered = filtered.filter(shipment =>
        shipment.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        shipment.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        shipment.trackingNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        shipment.doctorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        shipment.facility.toLowerCase().includes(searchTerm.toLowerCase()) ||
        shipment.destination.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'All') {
      filtered = filtered.filter(shipment => shipment.status === statusFilter);
    }

    // Carrier filter
    if (carrierFilter !== 'All') {
      filtered = filtered.filter(shipment => shipment.carrier === carrierFilter);
    }

    // Doctor filter - only shows authorized doctors
    if (doctorFilter !== 'All') {
      filtered = filtered.filter(shipment => shipment.doctorName === doctorFilter);
    }

    // Priority filter
    if (priorityFilter !== 'All') {
      filtered = filtered.filter(shipment => shipment.priority === priorityFilter);
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
        filtered = filtered.filter(shipment => new Date(shipment.shippedDate) >= filterDate);
      }
    }

    return filtered;
  }, [filteredData, searchTerm, statusFilter, carrierFilter, doctorFilter, priorityFilter, dateRange]);

  // Calculate analytics based on FILTERED data only (security requirement)
  const analytics = {
    totalShipments: filteredData?.length || 0,
    inTransit: filteredData?.filter(s => s?.status === 'in_transit').length || 0,
    outForDelivery: filteredData?.filter(s => s?.status === 'out_for_delivery').length || 0,
    deliveredToday: filteredData?.filter(s => s?.status === 'delivered').length || 0,
    exceptions: filteredData?.filter(s => s?.status === 'exception').length || 0
  };

  const getStatusBadge = (status: string) => {
    const statusStyles = {
      preparing: 'bg-gray-50 text-gray-700 border-gray-200',
      picked_up: 'bg-blue-50 text-blue-700 border-blue-200',
      in_transit: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      out_for_delivery: 'bg-orange-50 text-orange-700 border-orange-200',
      delivered: 'bg-green-50 text-green-700 border-green-200',
      exception: 'bg-red-50 text-red-700 border-red-200'
    };

    const statusLabels = {
      preparing: 'Preparing',
      picked_up: 'Picked Up',
      in_transit: 'In Transit',
      out_for_delivery: 'Out for Delivery',
      delivered: 'Delivered',
      exception: 'Exception'
    };

    return {
      className: `px-3 py-1 rounded-full text-sm font-medium border ${statusStyles[status as keyof typeof statusStyles]}`,
      label: statusLabels[status as keyof typeof statusLabels]
    };
  };

  const getPriorityBadge = (priority: string) => {
    const priorityStyles = {
      standard: 'bg-gray-50 text-gray-700 border-gray-200',
      expedited: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      overnight: 'bg-red-50 text-red-700 border-red-200'
    };

    return `px-2 py-1 rounded text-xs font-medium border ${priorityStyles[priority as keyof typeof priorityStyles]}`;
  };

  const getCarrierIcon = (carrier: string) => {
    return <TruckIcon className="h-4 w-4 text-slate-500" />;
  };

  const getTrackingUrl = (carrier: string, trackingNumber: string) => {
    const urls = {
      UPS: `https://www.ups.com/track?tracknum=${trackingNumber}`,
      FedEx: `https://www.fedex.com/fedextrack/?tracknumbers=${trackingNumber}`,
      USPS: `https://tools.usps.com/go/TrackConfirmAction?qtc_tLabels1=${trackingNumber}`,
      DHL: `https://www.dhl.com/en/express/tracking.html?AWB=${trackingNumber}`,
      Other: '#'
    };
    return urls[carrier as keyof typeof urls] || '#';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Get unique values for filters from FILTERED data only
  const uniqueDoctors = [...new Set(filteredData.map(shipment => shipment.doctorName))];
  const uniqueCarriers = [...new Set(filteredData.map(shipment => shipment.carrier))];

  // Clear filters function for better UX
  const clearAllFilters = useCallback(() => {
    setStatusFilter('All');
    setCarrierFilter('All');
    setDoctorFilter('All');
    setPriorityFilter('All');
    setSearchTerm('');
    setDateRange('All');
  }, []);

  // Check if any filters are active
  const hasActiveFilters = statusFilter !== 'All' || carrierFilter !== 'All' ||
                          doctorFilter !== 'All' || priorityFilter !== 'All' ||
                          searchTerm !== '' || dateRange !== 'All';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-slate-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading shipment data with security filtering...</p>
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
            onClick={() => {
              if (isMountedRef.current) {
                loadFilteredData();
              }
            }}
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
              <h1 className="text-3xl font-bold text-slate-800 tracking-tight leading-tight">Sales Shipping & Logistics - View Only</h1>
              <div className="flex items-center bg-amber-50 border border-amber-200 rounded-lg px-3 py-1">
                <ShieldCheckIcon className="h-4 w-4 text-amber-600 mr-2" />
                <span className="text-sm font-medium text-amber-700">View Only Access</span>
              </div>
            </div>
            <p className="text-slate-600 mt-1 text-lg leading-normal">Monitor shipments for your assigned doctors</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm px-4 py-2 border border-slate-200">
            <div className="text-sm text-slate-500">Filtered Results</div>
            <div className="text-2xl font-bold text-slate-900">{getFilteredShipments().length}</div>
          </div>
        </div>

        {/* Blue filtering banner */}
        {filterResult && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <div className="flex items-center">
              <CheckCircleIcon className="h-5 w-5 text-blue-600 mr-3" />
              <div className="flex-1">
                <div className="text-sm font-medium text-blue-900">
                  🔒 Data isolation active - showing shipments from {filterResult.allowedDoctorIds?.length || 0} assigned doctors only
                </div>
                <div className="text-xs text-blue-700 mt-1">
                  Sales scope: {filterResult.filterReason} • Authorized doctors: {filterResult.userHierarchyInfo?.downlineDoctors?.length || 0}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Analytics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <Card className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-slate-100 rounded-lg">
                <TruckIcon className="h-6 w-6 text-slate-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-600">Total Shipments</p>
                <p className="text-2xl font-bold text-slate-900">{analytics.totalShipments}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <MapPinIcon className="h-6 w-6 text-indigo-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-600">In Transit</p>
                <p className="text-2xl font-bold text-slate-900">{analytics.inTransit}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <ClockIcon className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-600">Out for Delivery</p>
                <p className="text-2xl font-bold text-slate-900">{analytics.outForDelivery}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircleIcon className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-600">Delivered Today</p>
                <p className="text-2xl font-bold text-slate-900">{analytics.deliveredToday}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-600">Exceptions</p>
                <p className="text-2xl font-bold text-slate-900">{analytics.exceptions}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="p-4 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-500 mb-1">Search</label>
              <div className="relative">
                <MagnifyingGlassIcon className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search shipments, tracking, doctors..."
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
                <option value="preparing">Preparing</option>
                <option value="picked_up">Picked Up</option>
                <option value="in_transit">In Transit</option>
                <option value="out_for_delivery">Out for Delivery</option>
                <option value="delivered">Delivered</option>
                <option value="exception">Exception</option>
              </select>
            </div>

            {/* Carrier Filter */}
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Carrier</label>
              <select
                value={carrierFilter}
                onChange={(e) => setCarrierFilter(e.target.value)}
                className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:ring-slate-500 focus:border-slate-500"
              >
                <option value="All">All Carriers</option>
                {uniqueCarriers.map(carrier => (
                  <option key={carrier} value={carrier}>{carrier}</option>
                ))}
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

            {/* Priority Filter */}
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Priority</label>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:ring-slate-500 focus:border-slate-500"
              >
                <option value="All">All Priorities</option>
                <option value="standard">Standard</option>
                <option value="expedited">Expedited</option>
                <option value="overnight">Overnight</option>
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

        {/* Shipments Table */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-24">Shipment</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-32">Doctor</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-40">Tracking</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-24">Status</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-24">Priority</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-32">Destination</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-24">Delivery</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-24">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {getFilteredShipments().map((shipment) => {
                  const statusBadge = getStatusBadge(shipment.status);
                  return (
                    <tr key={shipment.id} className="hover:bg-slate-50">
                      <td className="px-3 py-2 whitespace-nowrap text-sm">
                        <div className="font-medium text-slate-900">{shipment.id}</div>
                        <div className="text-slate-500 text-xs">{shipment.orderId}</div>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm">
                        <div className="font-medium text-slate-900 truncate">{shipment.doctorName}</div>
                        <div className="text-slate-500 text-xs truncate">{shipment.facility}</div>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm">
                        <div className="flex items-center">
                          {getCarrierIcon(shipment.carrier)}
                          <div className="ml-2">
                            <div className="font-medium text-slate-900">{shipment.carrier}</div>
                            <a
                              href={getTrackingUrl(shipment.carrier, shipment.trackingNumber)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 text-xs truncate block"
                              style={{ maxWidth: '120px' }}
                            >
                              {shipment.trackingNumber}
                            </a>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <span className={statusBadge.className}>
                          {statusBadge.label}
                        </span>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <span className={getPriorityBadge(shipment.priority)}>
                          {shipment.priority.charAt(0).toUpperCase() + shipment.priority.slice(1)}
                        </span>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-slate-900 truncate">
                        {shipment.destination}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-slate-500">
                        {shipment.actualDelivery ? formatDate(shipment.actualDelivery) : formatDate(shipment.estimatedDelivery)}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm font-medium">
                        <button
                          className="text-slate-600 hover:text-slate-900 flex items-center opacity-70 cursor-not-allowed"
                          title="View Only - No Actions Available"
                          disabled
                        >
                          <EyeIcon className="h-3 w-3 mr-1" />
                          View Only
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {getFilteredShipments().length === 0 && (
            <div className="text-center py-12">
              <div className="text-slate-500 text-lg">No shipments found</div>
              <div className="text-slate-400 text-sm mt-1">
                {hasActiveFilters ? 'Try adjusting your filters' : 'No shipments available for your assigned doctors'}
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default SalesShippingLogistics;