import React from 'react';
import {
  HomeIcon,
  TruckIcon,
  ArchiveBoxIcon,
  MapIcon,
  ClipboardDocumentListIcon,
  BuildingStorefrontIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  QueueListIcon,
  EyeIcon,
  ClipboardIcon
} from '@heroicons/react/24/solid';
import { ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import UnifiedDashboardLayout from '../shared/layout/UnifiedDashboardLayout';

const SimpleLogisticsDashboard: React.FC = () => {
  const { logout, user } = useAuth();

  // Mock recent shipments data
  const recentShipments = [
    {
      id: 'ORD-2024-001',
      doctor: 'Dr. Sarah Johnson',
      facility: 'Metro Health Center',
      status: 'In Transit',
      trackingNumber: 'UPS789456123',
      carrier: 'UPS',
      expectedDelivery: '2024-06-12',
      priority: 'Standard'
    },
    {
      id: 'ORD-2024-002',
      doctor: 'Dr. Michael Chen',
      facility: 'City Medical Plaza',
      status: 'Delivered',
      trackingNumber: 'FEDEX456789123',
      carrier: 'FedEx',
      expectedDelivery: '2024-06-11',
      priority: 'Rush'
    },
    {
      id: 'ORD-2024-003',
      doctor: 'Dr. Emily Rodriguez',
      facility: 'Westside Clinic',
      status: 'Processing',
      trackingNumber: '',
      carrier: '',
      expectedDelivery: '2024-06-13',
      priority: 'Urgent'
    },
    {
      id: 'ORD-2024-004',
      doctor: 'Dr. James Wilson',
      facility: 'North Valley Hospital',
      status: 'Shipped',
      trackingNumber: 'USPS123789456',
      carrier: 'USPS',
      expectedDelivery: '2024-06-14',
      priority: 'Standard'
    },
    {
      id: 'ORD-2024-005',
      doctor: 'Dr. Lisa Thompson',
      facility: 'Downtown Medical',
      status: 'In Transit',
      trackingNumber: 'UPS987654321',
      carrier: 'UPS',
      expectedDelivery: '2024-06-12',
      priority: 'Standard'
    }
  ];

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'Processing': { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Processing' },
      'Shipped': { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Shipped' },
      'In Transit': { bg: 'bg-purple-100', text: 'text-purple-800', label: 'In Transit' },
      'Delivered': { bg: 'bg-green-100', text: 'text-green-800', label: 'Delivered' }
    };
    return statusConfig[status as keyof typeof statusConfig] || statusConfig['Processing'];
  };

  const getPriorityBadge = (priority: string) => {
    const priorityConfig = {
      'Rush': { bg: 'bg-red-100', text: 'text-red-800', label: 'Rush' },
      'Urgent': { bg: 'bg-orange-100', text: 'text-orange-800', label: 'Urgent' },
      'Standard': { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Standard' }
    };
    return priorityConfig[priority as keyof typeof priorityConfig] || priorityConfig['Standard'];
  };

  const copyTrackingNumber = (trackingNumber: string) => {
    navigator.clipboard.writeText(trackingNumber);
    // You could add a toast notification here
  };

  const openTrackingLink = (carrier: string, trackingNumber: string) => {
    const trackingUrls = {
      'UPS': `https://www.ups.com/track?tracknum=${trackingNumber}`,
      'FedEx': `https://www.fedex.com/fedextrack/?trknbr=${trackingNumber}`,
      'USPS': `https://tools.usps.com/go/TrackConfirmAction?qtc_tLabels1=${trackingNumber}`
    };
    const url = trackingUrls[carrier as keyof typeof trackingUrls];
    if (url) {
      window.open(url, '_blank');
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const navigation = [
    { name: 'Dashboard', href: '/logistics/dashboard', icon: HomeIcon },
    { name: 'IVR Management', href: '/logistics/ivr-management', icon: ClipboardDocumentListIcon },
    { name: 'Order Management', href: '/logistics/orders', icon: ArchiveBoxIcon },
    { name: 'Shipping Queue', href: '/logistics/shipping-queue', icon: QueueListIcon },
    { name: 'Settings', href: '/logistics/settings', icon: Cog6ToothIcon },
    {
      name: 'Sign Out',
      href: '#',
      icon: ArrowRightOnRectangleIcon,
      onClick: handleLogout
    }
  ];

  const userInfo = {
    name: user?.first_name ? `${user.first_name} ${user.last_name}` : 'Logistics Coordinator',
    role: 'Shipping & Logistics',
    avatar: user?.first_name?.charAt(0) || 'L'
  };

  return (
    <UnifiedDashboardLayout navigation={navigation} userInfo={userInfo}>
      {/* Dashboard Content */}
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-gray-900">Shipping & Logistics Dashboard</h1>
          <p className="text-gray-600 mt-2">Welcome, {user?.first_name || 'Logistics'} {user?.last_name}</p>
        </div>

        {/* KPI Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <ArchiveBoxIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">Pending Shipments</h3>
                <p className="text-2xl font-bold text-gray-900">12</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TruckIcon className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">In Transit</h3>
                <p className="text-2xl font-bold text-gray-900">8</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <MapIcon className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">Delivered Today</h3>
                <p className="text-2xl font-bold text-gray-900">15</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <BuildingStorefrontIcon className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">Avg. Transit Time</h3>
                <p className="text-2xl font-bold text-gray-900">2.3d</p>
              </div>
            </div>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick Actions - More Prominent */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <QueueListIcon className="h-5 w-5 mr-2 text-blue-600" />
              Quick Actions
            </h2>
            <div className="space-y-3">
              <button
                onClick={() => window.location.href = '/logistics/shipping-queue'}
                className="w-full text-left p-4 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors group"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-blue-900">📦 Process Shipments</p>
                    <p className="text-sm text-blue-700">Manage shipping queue</p>
                  </div>
                  <ArrowTopRightOnSquareIcon className="h-4 w-4 text-blue-600 group-hover:text-blue-800" />
                </div>
              </button>
              <button className="w-full text-left p-4 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">🚛 Track Deliveries</p>
                    <p className="text-sm text-gray-600">Monitor shipment status</p>
                  </div>
                </div>
              </button>
              <button className="w-full text-left p-4 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">📋 Generate Reports</p>
                    <p className="text-sm text-gray-600">Export shipping data</p>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Recent Activity/Alerts */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <ClipboardDocumentListIcon className="h-5 w-5 mr-2 text-green-600" />
              Recent Activity
            </h2>
            <div className="space-y-3">
              <div className="flex items-center p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="p-1 bg-green-100 rounded-full mr-3">
                  <TruckIcon className="h-4 w-4 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-green-900">Order ORD-2024-002 delivered successfully</p>
                  <p className="text-xs text-green-700">Dr. Michael Chen • City Medical Plaza • 2 minutes ago</p>
                </div>
              </div>
              <div className="flex items-center p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="p-1 bg-blue-100 rounded-full mr-3">
                  <ArchiveBoxIcon className="h-4 w-4 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-900">New order ORD-2024-006 ready for processing</p>
                  <p className="text-xs text-blue-700">Dr. Robert Davis • East Side Clinic • 15 minutes ago</p>
                </div>
              </div>
              <div className="flex items-center p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="p-1 bg-orange-100 rounded-full mr-3">
                  <MapIcon className="h-4 w-4 text-orange-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-orange-900">Delivery delay reported for ORD-2024-001</p>
                  <p className="text-xs text-orange-700">UPS tracking update • Expected: Tomorrow • 1 hour ago</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Shipments Table */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Recent Shipments</h2>
              <button
                onClick={() => window.location.href = '/logistics/shipping-queue'}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center"
              >
                View All
                <ArrowTopRightOnSquareIcon className="h-4 w-4 ml-1" />
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Destination
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tracking
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Expected Delivery
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentShipments.map((shipment) => {
                  const statusBadge = getStatusBadge(shipment.status);
                  const priorityBadge = getPriorityBadge(shipment.priority);

                  return (
                    <tr key={shipment.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{shipment.id}</div>
                            <div className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${priorityBadge.bg} ${priorityBadge.text}`}>
                              {priorityBadge.label}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{shipment.doctor}</div>
                        <div className="text-sm text-gray-500">{shipment.facility}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusBadge.bg} ${statusBadge.text}`}>
                          {statusBadge.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {shipment.trackingNumber ? (
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-900">{shipment.carrier}</span>
                            <button
                              onClick={() => copyTrackingNumber(shipment.trackingNumber)}
                              className="text-xs text-blue-600 hover:text-blue-800 flex items-center"
                              title="Copy tracking number"
                            >
                              <ClipboardIcon className="h-3 w-3 mr-1" />
                              {shipment.trackingNumber}
                            </button>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">Not assigned</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {shipment.expectedDelivery}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button className="text-blue-600 hover:text-blue-900 flex items-center">
                            <EyeIcon className="h-4 w-4 mr-1" />
                            View
                          </button>
                          {shipment.trackingNumber && (
                            <button
                              onClick={() => openTrackingLink(shipment.carrier, shipment.trackingNumber)}
                              className="text-green-600 hover:text-green-900 flex items-center"
                            >
                                                          <ArrowTopRightOnSquareIcon className="h-4 w-4 mr-1" />
                            Track
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </UnifiedDashboardLayout>
  );
};

export default SimpleLogisticsDashboard;