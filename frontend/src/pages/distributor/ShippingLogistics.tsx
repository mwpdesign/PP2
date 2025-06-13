import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  EyeIcon,
  MagnifyingGlassIcon,
  CalendarIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  TruckIcon,
  MapPinIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { Card } from '../../components/shared/ui/Card';

interface Shipment {
  id: string;
  orderId: string;
  doctorName: string;
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
}

// Comprehensive mock data for Master Distributor monitoring
const mockShipments: Shipment[] = [
  {
    id: 'SHP-2024-001',
    orderId: 'ORD-2024-001',
    doctorName: 'Dr. Sarah Chen',
    facility: 'Metro General Hospital',
    trackingNumber: '1Z999AA1234567890',
    carrier: 'UPS',
    status: 'delivered',
    shippedDate: '2024-12-19',
    estimatedDelivery: '2024-12-20',
    actualDelivery: '2024-12-20',
    destination: 'New York, NY',
    distributor: 'MedSupply East',
    region: 'East Coast',
    packageCount: 2,
    weight: '15.2 lbs',
    priority: 'standard',
    lastUpdate: '2024-12-20T14:30:00Z',
    currentLocation: 'Delivered'
  },
  {
    id: 'SHP-2024-002',
    orderId: 'ORD-2024-002',
    doctorName: 'Dr. Michael Rodriguez',
    facility: 'St. Mary\'s Medical Center',
    trackingNumber: '7712345678901234',
    carrier: 'FedEx',
    status: 'out_for_delivery',
    shippedDate: '2024-12-20',
    estimatedDelivery: '2024-12-21',
    destination: 'Phoenix, AZ',
    distributor: 'HealthCare Partners',
    region: 'Southwest',
    packageCount: 3,
    weight: '22.8 lbs',
    priority: 'expedited',
    lastUpdate: '2024-12-21T08:15:00Z',
    currentLocation: 'Phoenix, AZ - Out for delivery'
  },
  {
    id: 'SHP-2024-003',
    orderId: 'ORD-2024-003',
    doctorName: 'Dr. Lisa Park',
    facility: 'Austin Regional Medical',
    trackingNumber: '9400111899562123456789',
    carrier: 'USPS',
    status: 'in_transit',
    shippedDate: '2024-12-20',
    estimatedDelivery: '2024-12-22',
    destination: 'Austin, TX',
    distributor: 'Texas Medical Supply',
    region: 'Central',
    packageCount: 1,
    weight: '8.5 lbs',
    priority: 'standard',
    lastUpdate: '2024-12-21T06:45:00Z',
    currentLocation: 'Dallas, TX - In transit'
  },
  {
    id: 'SHP-2024-004',
    orderId: 'ORD-2024-004',
    doctorName: 'Dr. James Wilson',
    facility: 'Central Texas Medical',
    trackingNumber: '1Z999AA1987654321',
    carrier: 'UPS',
    status: 'picked_up',
    shippedDate: '2024-12-21',
    estimatedDelivery: '2024-12-23',
    destination: 'Houston, TX',
    distributor: 'Regional Health Partners',
    region: 'Central',
    packageCount: 4,
    weight: '31.7 lbs',
    priority: 'standard',
    lastUpdate: '2024-12-21T10:20:00Z',
    currentLocation: 'Origin facility'
  },
  {
    id: 'SHP-2024-005',
    orderId: 'ORD-2024-005',
    doctorName: 'Dr. Emma Davis',
    facility: 'North Austin Clinic',
    trackingNumber: '7712345678901235',
    carrier: 'FedEx',
    status: 'delivered',
    shippedDate: '2024-12-18',
    estimatedDelivery: '2024-12-19',
    actualDelivery: '2024-12-19',
    destination: 'Austin, TX',
    distributor: 'Austin Medical Group',
    region: 'Central',
    packageCount: 1,
    weight: '5.3 lbs',
    priority: 'overnight',
    lastUpdate: '2024-12-19T11:45:00Z',
    currentLocation: 'Delivered'
  },
  {
    id: 'SHP-2024-006',
    orderId: 'ORD-2024-006',
    doctorName: 'Dr. Robert Chen',
    facility: 'South Austin Medical',
    trackingNumber: '1Z999AA1122334455',
    carrier: 'UPS',
    status: 'exception',
    shippedDate: '2024-12-19',
    estimatedDelivery: '2024-12-20',
    destination: 'San Antonio, TX',
    distributor: 'MedSupply South',
    region: 'Southwest',
    packageCount: 5,
    weight: '45.2 lbs',
    priority: 'expedited',
    lastUpdate: '2024-12-20T16:30:00Z',
    currentLocation: 'Exception - Address correction needed'
  },
  {
    id: 'SHP-2024-007',
    orderId: 'ORD-2024-007',
    doctorName: 'Dr. Jennifer Martinez',
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
    currentLocation: 'Preparing for shipment'
  },
  {
    id: 'SHP-2024-008',
    orderId: 'ORD-2024-008',
    doctorName: 'Dr. Mark Thompson',
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
    currentLocation: 'Fort Worth, TX - In transit'
  },
  {
    id: 'SHP-2024-009',
    orderId: 'ORD-2024-009',
    doctorName: 'Dr. Amanda Foster',
    facility: 'Houston General',
    trackingNumber: '1234567890123456789',
    carrier: 'DHL',
    status: 'out_for_delivery',
    shippedDate: '2024-12-20',
    estimatedDelivery: '2024-12-21',
    destination: 'Houston, TX',
    distributor: 'Gulf Coast Medical',
    region: 'Southeast',
    packageCount: 3,
    weight: '19.6 lbs',
    priority: 'overnight',
    lastUpdate: '2024-12-21T09:45:00Z',
    currentLocation: 'Houston, TX - Out for delivery'
  },
  {
    id: 'SHP-2024-010',
    orderId: 'ORD-2024-010',
    doctorName: 'Dr. Kevin Lee',
    facility: 'Phoenix Medical Plaza',
    trackingNumber: '1Z999AA1555666777',
    carrier: 'UPS',
    status: 'delivered',
    shippedDate: '2024-12-16',
    estimatedDelivery: '2024-12-17',
    actualDelivery: '2024-12-17',
    destination: 'Phoenix, AZ',
    distributor: 'Desert Medical Supply',
    region: 'Southwest',
    packageCount: 4,
    weight: '27.3 lbs',
    priority: 'standard',
    lastUpdate: '2024-12-17T13:20:00Z',
    currentLocation: 'Delivered'
  },
  {
    id: 'SHP-2024-011',
    orderId: 'ORD-2024-011',
    doctorName: 'Dr. Rachel Kim',
    facility: 'Seattle Medical Center',
    trackingNumber: '7712345678901237',
    carrier: 'FedEx',
    status: 'preparing',
    shippedDate: '2024-12-21',
    estimatedDelivery: '2024-12-23',
    destination: 'Seattle, WA',
    distributor: 'Pacific Northwest Supply',
    region: 'Northwest',
    packageCount: 5,
    weight: '33.4 lbs',
    priority: 'expedited',
    lastUpdate: '2024-12-21T08:00:00Z',
    currentLocation: 'Preparing for shipment'
  },
  {
    id: 'SHP-2024-012',
    orderId: 'ORD-2024-012',
    doctorName: 'Dr. David Brown',
    facility: 'Miami General Hospital',
    trackingNumber: '1Z999AA1888999000',
    carrier: 'UPS',
    status: 'delivered',
    shippedDate: '2024-12-15',
    estimatedDelivery: '2024-12-16',
    actualDelivery: '2024-12-16',
    destination: 'Miami, FL',
    distributor: 'Southeast Medical',
    region: 'Southeast',
    packageCount: 7,
    weight: '52.1 lbs',
    priority: 'standard',
    lastUpdate: '2024-12-16T15:10:00Z',
    currentLocation: 'Delivered'
  }
];

const ShippingLogistics: React.FC = () => {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [carrierFilter, setCarrierFilter] = useState<string>('All');
  const [distributorFilter, setDistributorFilter] = useState<string>('All');
  const [priorityFilter, setPriorityFilter] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [dateRange, setDateRange] = useState<string>('All');

  // Filter shipments based on selected criteria
  const getFilteredShipments = () => {
    let filtered = mockShipments;

    // Search filter
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

    // Distributor filter
    if (distributorFilter !== 'All') {
      filtered = filtered.filter(shipment => shipment.distributor === distributorFilter);
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
  };

  // Calculate analytics
  const analytics = {
    totalShipments: 45, // Total active shipments
    inTransit: 18, // Currently moving
    outForDelivery: 8, // Out for delivery today
    deliveredToday: 12, // Delivered today
    exceptions: 3 // Issues requiring attention
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

  const uniqueCarriers = [...new Set(mockShipments.map(shipment => shipment.carrier))];
  const uniqueDistributors = [...new Set(mockShipments.map(shipment => shipment.distributor))];

  return (
    <div className="space-y-4 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="pt-1 pb-3">
        <div className="flex justify-between items-center mb-3">
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-3xl font-bold text-slate-800 tracking-tight leading-tight">Shipping & Logistics - Network Overview</h1>
              <div className="flex items-center bg-amber-50 border border-amber-200 rounded-lg px-3 py-1">
                <ShieldCheckIcon className="h-4 w-4 text-amber-600 mr-2" />
                <span className="text-sm font-medium text-amber-700">View Only Access</span>
              </div>
            </div>
            <p className="text-slate-600 mt-1 text-lg leading-normal">Monitor shipments and delivery status across your distribution network</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm px-4 py-2 border border-slate-200">
            <span className="text-sm font-medium text-slate-600">Active Shipments: </span>
            <span className="text-xl font-bold text-slate-900">{analytics.totalShipments}</span>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4 text-center shadow-sm">
            <div className="text-2xl font-bold text-slate-700 leading-tight">{analytics.totalShipments}</div>
            <div className="text-sm font-medium text-slate-600 mt-1">Total Shipments</div>
            <div className="text-xs text-slate-500 mt-1">Active shipments</div>
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
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 opacity-90"
              >
                <option value="All">All Carriers</option>
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
          <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
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
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Priority</label>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 opacity-90"
              >
                <option value="All">All Priorities</option>
                <option value="standard">Standard</option>
                <option value="expedited">Expedited</option>
                <option value="overnight">Overnight</option>
              </select>
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

      {/* READ-ONLY Shipments Table */}
      <Card className="bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden opacity-95">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-slate-100">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Shipment ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Order/Doctor</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Tracking</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Destination</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Delivery</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Distributor</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
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
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-slate-900">{shipment.id}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600">
                      <div>
                        <div className="font-medium">{shipment.orderId}</div>
                        <div className="text-xs text-slate-500">{shipment.doctorName}</div>
                        <div className="text-xs text-slate-400">{shipment.facility}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600">
                      <div className="flex items-center space-x-2">
                        <TruckIcon className={`h-4 w-4 ${carrierColor}`} />
                        <div>
                          <div className="font-medium">{shipment.carrier}</div>
                          <a
                            href={trackingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:text-blue-800 underline"
                          >
                            {shipment.trackingNumber}
                          </a>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="space-y-1">
                        <span className={statusBadge.className}>
                          {statusBadge.label}
                        </span>
                        <div>
                          <span className={priorityBadge.className}>
                            {priorityBadge.label}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600">
                      <div className="flex items-center space-x-1">
                        <MapPinIcon className="h-4 w-4 text-slate-400" />
                        <div>
                          <div className="font-medium">{shipment.destination}</div>
                          {shipment.currentLocation && (
                            <div className="text-xs text-slate-500">{shipment.currentLocation}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600">
                      <div className="flex items-center space-x-1">
                        <ClockIcon className="h-4 w-4 text-slate-400" />
                        <div>
                          <div className="font-medium">
                            {shipment.actualDelivery ? formatDate(shipment.actualDelivery) : formatDate(shipment.estimatedDelivery)}
                          </div>
                          <div className="text-xs text-slate-500">
                            {shipment.actualDelivery ? 'Delivered' : 'Estimated'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600">
                      <div>
                        <div className="font-medium">{shipment.distributor}</div>
                        <div className="text-xs text-slate-500">{shipment.packageCount} pkg{shipment.packageCount !== 1 ? 's' : ''} • {shipment.weight}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      <button
                        onClick={() => {
                          console.log('🚀 CRITICAL DEBUG: Navigating to shipping detail');
                          console.log('Shipment ID:', shipment.id);
                          console.log('Target URL:', `/distributor/shipping/${shipment.id}`);
                          console.log('Using React Router navigate');
                          navigate(`/distributor/shipping/${shipment.id}`);
                        }}
                        className="inline-flex items-center px-3 py-1 border border-slate-300 rounded-md text-sm font-medium text-slate-600 bg-white hover:bg-slate-50 transition-colors"
                      >
                        <EyeIcon className="h-4 w-4 mr-1" />
                        View Details
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
            <p className="text-slate-600 text-base">No shipments match your current filter criteria</p>
          </div>
        )}
      </Card>
    </div>
  );
};

export default ShippingLogistics;