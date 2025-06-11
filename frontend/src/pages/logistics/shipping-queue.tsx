import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import UnifiedDashboardLayout from '../../components/shared/layout/UnifiedDashboardLayout';
import ShippingQueueTable from '../../components/logistics/ShippingQueueTable';
import ShippingQueueFilters, { FilterState } from '../../components/logistics/ShippingQueueFilters';
import {
  HomeIcon,
  TruckIcon,
  ArchiveBoxIcon,
  MapIcon,
  ClipboardDocumentListIcon,
  BuildingStorefrontIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  QueueListIcon
} from '@heroicons/react/24/solid';

const ShippingQueuePage: React.FC = () => {
  const { logout, user } = useAuth();

  // Filter state management
  const [filters, setFilters] = useState<FilterState>({
    statuses: ['Created', 'Processing'], // Default to Created and Processing (not Shipped)
    startDate: '',
    endDate: '',
    doctorSearch: ''
  });

  // Role protection - only allow Shipping and Logistics role
  if (user?.role !== 'Shipping and Logistics') {
    return <Navigate to="/dashboard" replace />;
  }

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
    { name: 'Shipping Queue', href: '/logistics/shipping-queue', icon: QueueListIcon },
    { name: 'Shipment Processing', href: '/logistics/shipments', icon: TruckIcon },
    { name: 'Inventory Management', href: '/logistics/inventory', icon: ArchiveBoxIcon },
    { name: 'Delivery Tracking', href: '/logistics/tracking', icon: MapIcon },
    { name: 'Warehouse Operations', href: '/logistics/warehouse', icon: BuildingStorefrontIcon },
    { name: 'Reports', href: '/logistics/reports', icon: ClipboardDocumentListIcon },
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
      <div className="space-y-6">
        {/* Header Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-slate-100 rounded-lg">
              <QueueListIcon className="h-6 w-6 text-slate-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Shipping Queue</h1>
              <p className="text-gray-600 mt-1">Process and manage orders ready for shipment</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <ShippingQueueFilters
          filters={filters}
          onFiltersChange={setFilters}
        />

        {/* Shipping Queue Table */}
        <ShippingQueueTable filters={filters} />
      </div>
    </UnifiedDashboardLayout>
  );
};

export default ShippingQueuePage;