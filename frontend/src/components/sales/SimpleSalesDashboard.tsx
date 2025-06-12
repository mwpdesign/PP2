import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  HomeIcon,
  UsersIcon,
  UserPlusIcon,
  ListBulletIcon,
  PhoneIcon,
  ChartBarIcon,
  DocumentTextIcon,
  CurrencyDollarIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  ClipboardDocumentListIcon,
  TruckIcon,
  UserCircleIcon,
  CalendarIcon,
  CalendarDaysIcon,
  UserIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/solid';
import { useAuth } from '../../contexts/AuthContext';
import UnifiedDashboardLayout from '../shared/layout/UnifiedDashboardLayout';

// Types for dashboard data
interface DashboardData {
  doctors?: {
    total: number;
    active: number;
    inactive: number;
    new_this_month: number;
    change_from_last_month: number;
  };
  ivrs?: {
    total_this_month: number;
    approved: number;
    pending: number;
    denied: number;
    change_from_last_month: number;
  };
  orders?: {
    total_this_month: number;
    delivered: number;
    in_transit: number;
    processing: number;
    change_from_last_month: number;
  };
  performance?: {
    total_revenue: number;
    change_from_last_month: number;
  };
  recent_activity?: Array<{
    type: string;
    description: string;
    timestamp: string;
    details?: any;
  }>;
}

// Centralized Sales Navigation Configuration
export const createSalesNavigation = (logout: () => Promise<void>) => [
  { name: 'Dashboard', href: '/sales/dashboard', icon: HomeIcon },
  { name: 'My Doctors', href: '/sales/doctors', icon: UsersIcon },
  { name: 'Schedule', href: '/sales/schedule', icon: CalendarDaysIcon },
  { name: 'Analytics', href: '/sales/analytics', icon: ChartBarIcon },
  { name: 'IVR Management', href: '/sales/ivr', icon: ClipboardDocumentListIcon },
  { name: 'Order Management', href: '/sales/orders', icon: ClipboardDocumentListIcon },
  { name: 'Shipping & Logistics', href: '/sales/shipping', icon: TruckIcon },
  { name: 'Settings', href: '/sales/settings', icon: Cog6ToothIcon },
  {
    name: 'Sign Out',
    href: '#',
    icon: ArrowRightOnRectangleIcon,
    onClick: async () => {
      try {
        await logout();
        window.location.href = '/login';
      } catch (error) {
        console.error('Logout failed:', error);
      }
    }
  }
];

// Utility functions
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatPercentage = (value: number) => {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value}%`;
};

const formatTimestamp = (timestamp: string) => {
  try {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) {
      return 'Just now';
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString();
    }
  } catch (error) {
    return timestamp;
  }
};

const getActivityIcon = (type: string) => {
  switch (type) {
    case 'ivr_approved':
      return DocumentTextIcon;
    case 'order_shipped':
      return TruckIcon;
    case 'doctor_added':
      return UsersIcon;
    case 'ivr_submitted':
      return ClipboardDocumentListIcon;
    case 'order_delivered':
      return ClipboardDocumentListIcon;
    default:
      return DocumentTextIcon;
  }
};

const getActivityColor = (type: string) => {
  switch (type) {
    case 'ivr_approved':
      return 'green';
    case 'order_shipped':
      return 'blue';
    case 'doctor_added':
      return 'purple';
    case 'ivr_submitted':
      return 'yellow';
    case 'order_delivered':
      return 'emerald';
    default:
      return 'gray';
  }
};

// Loading skeleton components
const MetricCardSkeleton = () => (
  <div className="bg-white rounded-lg shadow p-6 animate-pulse">
    <div className="flex items-center">
      <div className="p-2 bg-gray-200 rounded-lg w-10 h-10"></div>
      <div className="ml-4 flex-1">
        <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
        <div className="h-8 bg-gray-200 rounded w-16"></div>
      </div>
    </div>
  </div>
);

const ActivitySkeleton = () => (
  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg animate-pulse">
    <div className="flex items-center">
      <div className="p-2 bg-gray-200 rounded-lg mr-3 w-8 h-8"></div>
      <div>
        <div className="h-4 bg-gray-200 rounded w-32 mb-1"></div>
        <div className="h-3 bg-gray-200 rounded w-16"></div>
      </div>
    </div>
    <div className="h-6 bg-gray-200 rounded w-16"></div>
  </div>
);

const SimpleSalesDashboard: React.FC = () => {
  const { logout, user } = useAuth();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if user has permission to manage doctors
  const canManageDoctors = user?.role && ['Sales', 'Distributor', 'Master Distributor', 'Admin', 'CHP Admin'].includes(user.role);

  const navigation = createSalesNavigation(logout);

  const userInfo = {
    name: user?.first_name ? `${user.first_name} ${user.last_name}` : 'Sales Rep',
    role: 'Sales Representative',
    avatar: user?.first_name?.charAt(0) || 'S'
  };

  // Fetch dashboard data
  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch('/api/v1/sales-dashboard/dashboard-stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setDashboardData(data);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      setError('Failed to load dashboard data');

      // Fallback to mock data for development
      setDashboardData({
        performance: {
          total_revenue: 45200,
          change_from_last_month: 15
        },
        ivrs: {
          total_this_month: 12,
          approved: 10,
          pending: 2,
          denied: 0,
          change_from_last_month: 20
        },
        orders: {
          total_this_month: 8,
          delivered: 5,
          in_transit: 3,
          processing: 0,
          change_from_last_month: -5
        },
        doctors: {
          total: 15,
          active: 12,
          inactive: 3,
          new_this_month: 2,
          change_from_last_month: 10
        },
        recent_activity: [
          {
            type: 'ivr_approved',
            description: 'IVR Approved - Dr. Johnson',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
          },
          {
            type: 'order_shipped',
            description: 'Order Shipped - Dr. Martinez',
            timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
          },
          {
            type: 'doctor_added',
            description: 'New Doctor Added - Dr. Chen',
            timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
          }
        ]
      });
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-refresh data every 60 seconds
  useEffect(() => {
    fetchDashboardData();

    const interval = setInterval(fetchDashboardData, 60000);
    return () => clearInterval(interval);
  }, [fetchDashboardData]);

  // Render trend indicator
  const renderTrendIndicator = (change: number) => {
    if (change === 0) return null;

    const isPositive = change > 0;
    const Icon = isPositive ? ArrowUpIcon : ArrowDownIcon;
    const colorClass = isPositive ? 'text-green-600' : 'text-red-600';

    return (
      <div className={`flex items-center mt-1 ${colorClass}`}>
        <Icon className="h-3 w-3 mr-1" />
        <span className="text-xs font-medium">{formatPercentage(change)}</span>
      </div>
    );
  };

  return (
    <UnifiedDashboardLayout navigation={navigation} userInfo={userInfo}>
      {/* Dashboard Content */}
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Sales Dashboard</h1>
              <p className="text-gray-600 mt-2">Welcome, {user?.first_name || 'Sales'} {user?.last_name}</p>
            </div>
            {error && (
              <div className="flex items-center text-amber-600">
                <ExclamationTriangleIcon className="h-5 w-5 mr-2" />
                <span className="text-sm">Using offline data</span>
              </div>
            )}
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Sales Management</h2>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <p className="text-purple-800">
                💼 Sales representative dashboard with medical oversight capabilities.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <button
                onClick={() => window.location.href = '/sales/doctors'}
                className="w-full text-left p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                👥 View My Doctors
              </button>
              <button
                onClick={() => window.location.href = '/sales/ivr'}
                className="w-full text-left p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                📋 Monitor IVR Requests
              </button>
              <button
                onClick={() => window.location.href = '/sales/orders'}
                className="w-full text-left p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                📦 Track Orders
              </button>
                            <button
                onClick={() => window.location.href = '/sales/shipping'}
                className="w-full text-left p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                🚚 View Shipments
              </button>
              <button
                onClick={() => window.location.href = '/sales/schedule'}
                className="w-full text-left p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                📅 Schedule Visit
              </button>
            </div>
          </div>
        </div>

        {/* Enhanced Stats Grid with Real Data */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {loading ? (
            <>
              <MetricCardSkeleton />
              <MetricCardSkeleton />
              <MetricCardSkeleton />
              <MetricCardSkeleton />
            </>
          ) : (
            <>
              {/* Monthly Revenue */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <CurrencyDollarIcon className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4 flex-1">
                    <h3 className="text-sm font-medium text-gray-500">Monthly Sales</h3>
                    <p className="text-2xl font-bold text-gray-900">
                      {dashboardData?.performance?.total_revenue
                        ? formatCurrency(dashboardData.performance.total_revenue)
                        : '$0'
                      }
                    </p>
                    {dashboardData?.performance?.change_from_last_month !== undefined &&
                      renderTrendIndicator(dashboardData.performance.change_from_last_month)
                    }
                  </div>
                </div>
              </div>

              {/* Pending IVRs */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <DocumentTextIcon className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-4 flex-1">
                    <h3 className="text-sm font-medium text-gray-500">Pending IVRs</h3>
                    <p className="text-2xl font-bold text-gray-900">
                      {dashboardData?.ivrs?.total_this_month || 0}
                    </p>
                    {dashboardData?.ivrs?.change_from_last_month !== undefined &&
                      renderTrendIndicator(dashboardData.ivrs.change_from_last_month)
                    }
                  </div>
                </div>
              </div>

              {/* Active Orders */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <ClipboardDocumentListIcon className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="ml-4 flex-1">
                    <h3 className="text-sm font-medium text-gray-500">Active Orders</h3>
                    <p className="text-2xl font-bold text-gray-900">
                      {dashboardData?.orders?.total_this_month || 0}
                    </p>
                    {dashboardData?.orders?.change_from_last_month !== undefined &&
                      renderTrendIndicator(dashboardData.orders.change_from_last_month)
                    }
                  </div>
                </div>
              </div>

              {/* In Transit */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <TruckIcon className="h-6 w-6 text-orange-600" />
                  </div>
                  <div className="ml-4 flex-1">
                    <h3 className="text-sm font-medium text-gray-500">In Transit</h3>
                    <p className="text-2xl font-bold text-gray-900">
                      {dashboardData?.orders?.in_transit || 0}
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Recent Activity Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h2>
          {loading ? (
            <div className="space-y-4">
              <ActivitySkeleton />
              <ActivitySkeleton />
              <ActivitySkeleton />
            </div>
          ) : (
            <div className="space-y-4">
              {dashboardData?.recent_activity?.length ? (
                dashboardData.recent_activity.map((activity, index) => {
                  const IconComponent = getActivityIcon(activity.type);
                  const colorClass = getActivityColor(activity.type);

                  return (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <div className={`p-2 bg-${colorClass}-100 rounded-lg mr-3`}>
                          <IconComponent className={`h-4 w-4 text-${colorClass}-600`} />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{activity.description}</p>
                          <p className="text-xs text-gray-500">{formatTimestamp(activity.timestamp)}</p>
                        </div>
                      </div>
                      <span className={`text-xs bg-${colorClass}-100 text-${colorClass}-800 px-2 py-1 rounded-full`}>
                        {activity.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <DocumentTextIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No recent activity</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </UnifiedDashboardLayout>
  );
};

export default SimpleSalesDashboard;