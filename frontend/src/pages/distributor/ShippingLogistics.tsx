import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { HierarchyFilteringService } from '../../services/hierarchyFilteringService';
import ReadOnlyWithCommunication from '../../components/shared/ReadOnlyWithCommunication';
import { shouldApplyReadOnly, getOnBehalfOfText, getRoleDisplayName } from '../../utils/roleUtils';
import { useCurrentUserRole } from '../../components/shared/withReadOnlyCommunication';
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
  doctorId: string; // Add doctorId for hierarchy filtering
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
  // Hierarchy fields for filtering
  salesRepId?: string;
  distributorId?: string;
  regionalDistributorId?: string;
  createdBy?: string;
}

// Updated mock data with hierarchy relationships matching OrderProcessing
const mockShipments: Shipment[] = [
  {
    id: 'SHP-2024-001',
    orderId: 'ORD-2024-001',
    doctorName: 'Dr. John Smith',
    doctorId: 'D-001', // Regional Distributor West
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
    doctorId: 'D-002', // Regional Distributor West
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
    doctorId: 'D-003', // Regional Distributor West
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
    doctorId: 'D-006', // Regional Distributor West
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
  },
  {
    id: 'SHP-2024-005',
    orderId: 'ORD-2024-005',
    doctorName: 'Dr. Robert Chen',
    doctorId: 'D-004', // Regional Distributor East
    facility: 'East Coast Medical Center',
    trackingNumber: '7712345678901235',
    carrier: 'FedEx',
    status: 'delivered',
    shippedDate: '2024-12-18',
    estimatedDelivery: '2024-12-19',
    actualDelivery: '2024-12-19',
    destination: 'Miami, FL',
    distributor: 'Regional Distributor East',
    region: 'East',
    packageCount: 1,
    weight: '5.3 lbs',
    priority: 'overnight',
    lastUpdate: '2024-12-19T11:45:00Z',
    currentLocation: 'Delivered',
    salesRepId: 'sales-rep-2',
    distributorId: 'regional-dist-2',
    regionalDistributorId: 'regional-dist-2',
    createdBy: 'D-004'
  },
  {
    id: 'SHP-2024-006',
    orderId: 'ORD-2024-006',
    doctorName: 'Dr. Lisa Anderson',
    doctorId: 'D-005', // Regional Distributor East
    facility: 'Southeast Regional Hospital',
    trackingNumber: '1Z999AA1122334455',
    carrier: 'UPS',
    status: 'exception',
    shippedDate: '2024-12-19',
    estimatedDelivery: '2024-12-20',
    destination: 'Miami, FL',
    distributor: 'Regional Distributor East',
    region: 'East',
    packageCount: 5,
    weight: '45.2 lbs',
    priority: 'expedited',
    lastUpdate: '2024-12-20T16:30:00Z',
    currentLocation: 'Exception - Address correction needed',
    salesRepId: 'sales-rep-2',
    distributorId: 'regional-dist-2',
    regionalDistributorId: 'regional-dist-2',
    createdBy: 'D-005'
  },
  // Additional shipments from other distributors (will be filtered out for Regional Distributors)
  {
    id: 'SHP-2024-007',
    orderId: 'ORD-2024-007',
    doctorName: 'Dr. Jennifer Martinez',
    doctorId: 'D-007',
    facility: 'Cedar Park Family Health',
    trackingNumber: '9400111899562123456790',
    carrier: 'USPS',
    status: 'preparing',
    shippedDate: '2024-12-21',
    estimatedDelivery: '2024-12-23',
    destination: 'Cedar Park, TX',
    distributor: 'Northwest Medical',
    region: 'Northwest',
    packageCount: 2,
    weight: '12.1 lbs',
    priority: 'standard',
    lastUpdate: '2024-12-21T09:00:00Z',
    currentLocation: 'Preparing for shipment',
    salesRepId: 'sales-rep-4',
    distributorId: 'regional-dist-3',
    regionalDistributorId: 'regional-dist-3',
    createdBy: 'D-007'
  },
  {
    id: 'SHP-2024-008',
    orderId: 'ORD-2024-008',
    doctorName: 'Dr. Mark Thompson',
    doctorId: 'D-008',
    facility: 'Dallas Medical Center',
    trackingNumber: '7712345678901236',
    carrier: 'FedEx',
    status: 'in_transit',
    shippedDate: '2024-12-20',
    estimatedDelivery: '2024-12-22',
    destination: 'Dallas, TX',
    distributor: 'Dallas Health Supply',
    region: 'Central',
    packageCount: 6,
    weight: '38.9 lbs',
    priority: 'expedited',
    lastUpdate: '2024-12-21T07:30:00Z',
    currentLocation: 'Fort Worth, TX - In transit',
    salesRepId: 'sales-rep-5',
    distributorId: 'regional-dist-4',
    regionalDistributorId: 'regional-dist-4',
    createdBy: 'D-008'
  }
];

const ShippingLogistics: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [filteredData, setFilteredData] = useState<Shipment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterResult, setFilterResult] = useState<any>(null);

  // Get current user role for read-only wrapper
  const currentUserRole = useCurrentUserRole();
  const targetRole = 'distributor';
  const shouldApplyWrapper = shouldApplyReadOnly(currentUserRole, targetRole);

  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [carrierFilter, setCarrierFilter] = useState<string>('All');
  const [doctorFilter, setDoctorFilter] = useState<string>('All');
  const [priorityFilter, setPriorityFilter] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [dateRange, setDateRange] = useState<string>('All');

  // Use ref to track if component is mounted to prevent state updates on unmounted component
  const isMountedRef = useRef(true);

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
  const navigateToShippingDetail = (shipmentId: string) => {
    const context = getDistributorContext();

    console.log('🚀 ShippingLogistics Navigation Context:', {
      currentPath: location.pathname,
      detectedContext: context,
      shipmentId: shipmentId
    });

    if (context === 'regional') {
      console.log('🚀 Navigating to Regional Distributor shipping detail');
      navigate(`/distributor-regional/shipping-logistics/${shipmentId}`);
    } else {
      console.log('🚀 Navigating to Master Distributor shipping detail');
      navigate(`/distributor/shipping/${shipmentId}`);
    }
  };

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

      console.log('🚢 [ShippingLogistics] Applying hierarchy filtering...');
      console.log('👤 Current user:', user.email, 'Role:', user.role);
      console.log('🚨 SECURITY: Filtering shipments to prevent data leakage between distributors');

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

      // Apply hierarchy filtering - CRITICAL SECURITY STEP
      const result = HierarchyFilteringService.filterOrderDataByHierarchy(shipmentsForFiltering, user);

      console.log('📦 Shipment hierarchy filtering result:', {
        totalCount: result.totalCount,
        filteredCount: result.filteredCount,
        filterReason: result.filterReason,
        allowedDoctorIds: result.allowedDoctorIds?.length || 0,
        downlineDoctors: result.userHierarchyInfo?.downlineDoctors?.length || 0
      });

      // SECURITY: Filter original shipments based on allowed doctor IDs only
      const allowedDoctorIds = result.allowedDoctorIds || [];
      const hierarchyFilteredShipments = mockShipments.filter(shipment => {
        const isAllowed = allowedDoctorIds.includes(shipment.doctorId) ||
                         shipment.distributorId === result.userHierarchyInfo?.userId ||
                         shipment.regionalDistributorId === result.userHierarchyInfo?.userId;

        if (isAllowed) {
          console.log(`✅ Including shipment ${shipment.id} from doctor ${shipment.doctorId} (${shipment.doctorName})`);
        } else {
          console.log(`❌ SECURITY: Excluding shipment ${shipment.id} from doctor ${shipment.doctorId} (${shipment.doctorName}) - not in downline`);
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

    // SECURITY: Doctor filter (replaces distributor filter) - only shows authorized doctors
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
      standard: 'bg-slate-50 text-slate-700 border-slate-200',
      expedited: 'bg-amber-50 text-amber-700 border-amber-200',
      overnight: 'bg-purple-50 text-purple-700 border-purple-200'
    };

    const priorityLabels = {
      standard: 'Standard',
      expedited: 'Expedited',
      overnight: 'Overnight'
    };

    return {
      className: `px-2 py-1 rounded text-xs font-medium border ${priorityStyles[priority as keyof typeof priorityStyles]}`,
      label: priorityLabels[priority as keyof typeof priorityLabels]
    };
  };

  const getCarrierIcon = (carrier: string) => {
    const carrierColors = {
      UPS: 'text-amber-600',
      FedEx: 'text-purple-600',
      USPS: 'text-blue-600',
      DHL: 'text-red-600',
      Other: 'text-gray-600'
    };

    return carrierColors[carrier as keyof typeof carrierColors] || 'text-gray-600';
  };

  const getTrackingUrl = (carrier: string, trackingNumber: string) => {
    const trackingUrls = {
      UPS: `https://www.ups.com/track?tracknum=${trackingNumber}`,
      FedEx: `https://www.fedex.com/fedextrack/?tracknumbers=${trackingNumber}`,
      USPS: `https://tools.usps.com/go/TrackConfirmAction?qtc_tLabels1=${trackingNumber}`,
      DHL: `https://www.dhl.com/us-en/home/tracking/tracking-express.html?submit=1&tracking-id=${trackingNumber}`,
      Other: '#'
    };

    return trackingUrls[carrier as keyof typeof trackingUrls] || '#';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  // SECURITY: Get unique values from FILTERED data only (not all distributors)
  const uniqueCarriers = [...new Set((filteredData || []).map(shipment => shipment.carrier))];
  const uniqueDoctors = [...new Set((filteredData || []).map(shipment => shipment.doctorName))];

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

  const renderContent = () => (
    <div className="space-y-4 bg-slate-50 min-h-screen">
      {/* Header with filtering summary */}
      <div className="pt-1 pb-3">
        <div className="flex justify-between items-center mb-3">
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-3xl font-bold text-slate-800 tracking-tight leading-tight">Shipping & Logistics - Network Overview</h1>
              {!shouldApplyWrapper && (
                <div className="flex items-center bg-amber-50 border border-amber-200 rounded-lg px-3 py-1">
                  <ShieldCheckIcon className="h-4 w-4 text-amber-600 mr-2" />
                  <span className="text-sm font-medium text-amber-700">View Only Access</span>
                </div>
              )}
            </div>
            <p className="text-slate-600 mt-1 text-lg leading-normal">Monitor shipments and delivery status across your distribution network</p>


          </div>
          <div className="bg-white rounded-xl shadow-sm px-4 py-2 border border-slate-200">
            <span className="text-sm font-medium text-slate-600">Active Shipments: </span>
            <span className="text-xl font-bold text-slate-900">{analytics.totalShipments}</span>
          </div>
        </div>

        {/* Summary Cards - based on filtered data only */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4 text-center shadow-sm">
            <div className="text-2xl font-bold text-slate-700 leading-tight">{analytics.totalShipments}</div>
            <div className="text-sm font-medium text-slate-600 mt-1">Total Shipments</div>
            <div className="text-xs text-slate-500 mt-1">Authorized shipments</div>
          </div>
          <div className="bg-white border border-indigo-200 rounded-xl p-4 text-center shadow-sm">
            <div className="text-2xl font-bold text-indigo-700 leading-tight">{analytics.inTransit}</div>
            <div className="text-sm font-medium text-indigo-600 mt-1">In Transit</div>
            <div className="text-xs text-indigo-500 mt-1">Currently moving</div>
          </div>
          <div className="bg-white border border-orange-200 rounded-xl p-4 text-center shadow-sm">
            <div className="text-2xl font-bold text-orange-700 leading-tight">{analytics.outForDelivery}</div>
            <div className="text-sm font-medium text-orange-600 mt-1">Out for Delivery</div>
            <div className="text-xs text-orange-500 mt-1">Delivering today</div>
          </div>
          <div className="bg-white border border-green-200 rounded-xl p-4 text-center shadow-sm">
            <div className="text-2xl font-bold text-green-700 leading-tight">{analytics.deliveredToday}</div>
            <div className="text-sm font-medium text-green-600 mt-1">Delivered Today</div>
            <div className="text-xs text-green-500 mt-1">Completed</div>
          </div>
          <div className="bg-white border border-red-200 rounded-xl p-4 text-center shadow-sm">
            <div className="text-2xl font-bold text-red-700 leading-tight">{analytics.exceptions}</div>
            <div className="text-sm font-medium text-red-600 mt-1">Exceptions</div>
            <div className="text-xs text-red-500 mt-1">Need attention</div>
          </div>
        </div>

        {/* Search and Filters */}
        <Card className="bg-white border border-slate-200 rounded-xl shadow-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-slate-800">Filter Shipments</h3>
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="text-sm text-slate-600 hover:text-slate-800 underline"
                data-filter="true"
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
                  placeholder="Search by shipment ID, tracking, doctor, or destination..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
                  data-search="true"
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
                data-filter="true"
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
              <label className="block text-sm font-semibold text-slate-700 mb-2">Carrier</label>
              <select
                value={carrierFilter}
                onChange={(e) => setCarrierFilter(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
                data-filter="true"
              >
                <option value="All">All Carriers ({uniqueCarriers.length})</option>
                {uniqueCarriers.map(carrier => (
                  <option key={carrier} value={carrier}>{carrier}</option>
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
                  data-filter="true"
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
                data-filter="true"
              >
                <option value="All">All Doctors ({uniqueDoctors.length})</option>
                {uniqueDoctors.map(doctor => (
                  <option key={doctor} value={doctor}>{doctor}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Priority</label>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
                data-filter="true"
              >
                <option value="All">All Priorities</option>
                <option value="standard">Standard</option>
                <option value="expedited">Expedited</option>
                <option value="overnight">Overnight</option>
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

      {/* SECURITY: READ-ONLY Shipments Table with filtered data */}
      <Card className="bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-slate-800">
              Shipment Results ({getFilteredShipments().length} of {filteredData.length} shipments)
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
                <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-24">ID</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-40">Order/Doctor</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-32">Tracking</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-28">Status</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-36">Destination</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-28">Delivery</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-24">Region</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-24">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {getFilteredShipments().map((shipment) => {
                const statusBadge = getStatusBadge(shipment.status);
                const priorityBadge = getPriorityBadge(shipment.priority);
                const carrierColor = getCarrierIcon(shipment.carrier);
                const trackingUrl = getTrackingUrl(shipment.carrier, shipment.trackingNumber);

                return (
                  <tr key={shipment.id} className="hover:bg-slate-50">
                    <td className="px-3 py-2 whitespace-nowrap text-xs font-medium text-slate-900">{shipment.id}</td>
                    <td className="px-3 py-2 text-xs text-slate-600">
                      <div className="max-w-40">
                        <div className="font-medium truncate">{shipment.orderId}</div>
                        <div className="text-xs text-slate-500 truncate">{shipment.doctorName}</div>
                        <div className="text-xs text-slate-400 truncate">{shipment.facility}</div>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-600">
                      <div className="flex items-center space-x-1">
                        <TruckIcon className={`h-3 w-3 ${carrierColor} flex-shrink-0`} />
                        <div className="min-w-0">
                          <div className="font-medium text-xs">{shipment.carrier}</div>
                          <a
                            href={trackingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:text-blue-800 underline truncate block"
                            title={shipment.trackingNumber}
                          >
                            {shipment.trackingNumber.length > 12 ?
                              `${shipment.trackingNumber.substring(0, 12)}...` :
                              shipment.trackingNumber
                            }
                          </a>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <div className="space-y-1">
                        <span className={`${statusBadge.className} text-xs px-2 py-0.5`}>
                          {statusBadge.label}
                        </span>
                        <div>
                          <span className={`${priorityBadge.className} text-xs px-1 py-0.5`}>
                            {priorityBadge.label}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-600">
                      <div className="flex items-center space-x-1">
                        <MapPinIcon className="h-3 w-3 text-slate-400 flex-shrink-0" />
                        <div className="min-w-0">
                          <div className="font-medium truncate" title={shipment.destination}>{shipment.destination}</div>
                          {shipment.currentLocation && (
                            <div className="text-xs text-slate-500 truncate" title={shipment.currentLocation}>
                              {shipment.currentLocation.length > 20 ?
                                `${shipment.currentLocation.substring(0, 20)}...` :
                                shipment.currentLocation
                              }
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-600">
                      <div className="flex items-center space-x-1">
                        <ClockIcon className="h-3 w-3 text-slate-400 flex-shrink-0" />
                        <div className="min-w-0">
                          <div className="font-medium text-xs">
                            {shipment.actualDelivery ? formatDate(shipment.actualDelivery) : formatDate(shipment.estimatedDelivery)}
                          </div>
                          <div className="text-xs text-slate-500">
                            {shipment.actualDelivery ? 'Delivered' : 'Est.'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-600">
                      <div>
                        <div className="font-medium">{shipment.region}</div>
                        <div className="text-xs text-slate-500">{shipment.packageCount}pkg • {shipment.weight}</div>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-xs">
                      <button
                        onClick={() => {
                          console.log('🚀 Navigating to shipping detail');
                          console.log('Shipment ID:', shipment.id);
                          console.log('Target URL:', `/distributor/shipping/${shipment.id}`);
                          navigateToShippingDetail(shipment.id);
                        }}
                        className="inline-flex items-center px-2 py-1 border border-slate-300 rounded text-xs font-medium text-slate-600 bg-white hover:bg-slate-50 transition-colors"
                        title="View shipment details"
                        data-navigation="true"
                      >
                        <EyeIcon className="h-3 w-3 mr-1" />
                        View
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {getFilteredShipments().length === 0 && (
          <div className="p-12 text-center">
            <div className="mx-auto w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <TruckIcon className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2 leading-tight">No Shipments Found</h3>
            <p className="text-slate-600 text-base">
              {hasActiveFilters
                ? 'No shipments match your current filter criteria. Try adjusting your filters.'
                : 'No shipments available for your current access level.'
              }
            </p>
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="mt-4 px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
                data-filter="true"
              >
                Clear All Filters
              </button>
            )}
          </div>
        )}
      </Card>
    </div>
  );

  // Apply read-only wrapper if user is upper role
  if (shouldApplyWrapper) {
    return (
      <ReadOnlyWithCommunication
        userRole={getRoleDisplayName(currentUserRole)}
        targetRole={getRoleDisplayName(targetRole)}
        pageName="Shipping & Logistics"
        onBehalfOf={getOnBehalfOfText(currentUserRole, targetRole)}
      >
        {renderContent()}
      </ReadOnlyWithCommunication>
    );
  }

  return renderContent();
};

export default ShippingLogistics;