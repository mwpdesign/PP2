import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import UnifiedDashboardLayout from '../../components/shared/layout/UnifiedDashboardLayout';
import {
  HomeIcon,
  QueueListIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  BuildingStorefrontIcon,
  TruckIcon,
  BellIcon,
  DocumentArrowDownIcon,
  ClipboardDocumentListIcon,
  MapPinIcon,
  ClockIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/solid';

const LogisticsSettings: React.FC = () => {
  const { logout, user } = useAuth();
  const [activeTab, setActiveTab] = useState('warehouse');

  // Role protection
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

  const tabs = [
    { id: 'warehouse', name: 'Warehouse Configuration', icon: BuildingStorefrontIcon },
    { id: 'shipping', name: 'Shipping Preferences', icon: TruckIcon },
    { id: 'notifications', name: 'Notifications', icon: BellIcon },
    { id: 'reports', name: 'Reports & Export', icon: DocumentArrowDownIcon }
  ];

  const renderWarehouseSettings = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <MapPinIcon className="h-5 w-5 mr-2 text-blue-600" />
          Warehouse Locations
        </h3>
        <div className="space-y-4">
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-gray-900">Primary Warehouse</h4>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Active
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
              <div>
                <p><strong>Address:</strong> 123 Industrial Blvd</p>
                <p><strong>City:</strong> Atlanta, GA 30309</p>
              </div>
              <div>
                <p><strong>Capacity:</strong> 85% (8,500 / 10,000 sq ft)</p>
                <p><strong>Manager:</strong> John Smith</p>
              </div>
            </div>
          </div>
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-gray-900">Secondary Warehouse</h4>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                Backup
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
              <div>
                <p><strong>Address:</strong> 456 Commerce Dr</p>
                <p><strong>City:</strong> Birmingham, AL 35203</p>
              </div>
              <div>
                <p><strong>Capacity:</strong> 45% (2,250 / 5,000 sq ft)</p>
                <p><strong>Manager:</strong> Sarah Johnson</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <ClockIcon className="h-5 w-5 mr-2 text-green-600" />
          Operating Hours
        </h3>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Warehouse Hours</label>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Monday - Friday:</span>
                <span className="font-medium">6:00 AM - 6:00 PM</span>
              </div>
              <div className="flex justify-between">
                <span>Saturday:</span>
                <span className="font-medium">8:00 AM - 2:00 PM</span>
              </div>
              <div className="flex justify-between">
                <span>Sunday:</span>
                <span className="font-medium">Closed</span>
              </div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Shipping Cutoff Times</label>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Same Day:</span>
                <span className="font-medium">11:00 AM</span>
              </div>
              <div className="flex justify-between">
                <span>Next Day:</span>
                <span className="font-medium">4:00 PM</span>
              </div>
              <div className="flex justify-between">
                <span>Ground:</span>
                <span className="font-medium">5:00 PM</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderShippingSettings = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <TruckIcon className="h-5 w-5 mr-2 text-blue-600" />
          Default Carriers
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-gray-900">UPS</h4>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Primary
              </span>
            </div>
            <div className="text-sm text-gray-600 space-y-1">
              <p><strong>Account:</strong> 123456</p>
              <p><strong>Rate:</strong> Negotiated</p>
              <p><strong>Services:</strong> Ground, Next Day, 2-Day</p>
            </div>
          </div>
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-gray-900">FedEx</h4>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Secondary
              </span>
            </div>
            <div className="text-sm text-gray-600 space-y-1">
              <p><strong>Account:</strong> 789012</p>
              <p><strong>Rate:</strong> Standard</p>
              <p><strong>Services:</strong> Express, Ground</p>
            </div>
          </div>
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-gray-900">USPS</h4>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                Backup
              </span>
            </div>
            <div className="text-sm text-gray-600 space-y-1">
              <p><strong>Account:</strong> 345678</p>
              <p><strong>Rate:</strong> Commercial</p>
              <p><strong>Services:</strong> Priority, Ground</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <CurrencyDollarIcon className="h-5 w-5 mr-2 text-green-600" />
          Shipping Rules
        </h3>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Free Shipping Threshold</label>
              <div className="flex items-center">
                <span className="text-gray-500 mr-2">$</span>
                <input
                  type="number"
                  defaultValue="150"
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Rush Order Surcharge</label>
              <div className="flex items-center">
                <span className="text-gray-500 mr-2">$</span>
                <input
                  type="number"
                  defaultValue="25"
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
            </div>
          </div>
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                defaultChecked
                className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
              />
              <span className="ml-2 text-sm text-gray-700">Automatically select fastest carrier for rush orders</span>
            </label>
          </div>
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                defaultChecked
                className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
              />
              <span className="ml-2 text-sm text-gray-700">Require signature for orders over $500</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );

  const renderNotificationSettings = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <BellIcon className="h-5 w-5 mr-2 text-yellow-600" />
          Alert Preferences
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-900">New Order Notifications</h4>
              <p className="text-sm text-gray-500">Get notified when new orders are ready for processing</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" defaultChecked className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-900">Delivery Delays</h4>
              <p className="text-sm text-gray-500">Alert when shipments are delayed or have issues</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" defaultChecked className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-900">Low Inventory Alerts</h4>
              <p className="text-sm text-gray-500">Notify when product inventory is running low</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" defaultChecked className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-900">Daily Summary Reports</h4>
              <p className="text-sm text-gray-500">Receive daily shipping summary via email</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Email Settings</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Notification Email</label>
            <input
              type="email"
              defaultValue="logistics@healthcare.local"
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Backup Email</label>
            <input
              type="email"
              defaultValue="manager@healthcare.local"
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderReportsSettings = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <ClipboardDocumentListIcon className="h-5 w-5 mr-2 text-purple-600" />
          Automated Reports
        </h3>
        <div className="space-y-4">
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-gray-900">Daily Shipping Summary</h4>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Active
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-3">Daily report of all shipments processed, delivered, and pending</p>
            <div className="flex items-center space-x-4 text-sm">
              <span><strong>Schedule:</strong> Daily at 6:00 PM</span>
              <span><strong>Recipients:</strong> 3 users</span>
              <span><strong>Format:</strong> PDF + Excel</span>
            </div>
          </div>
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-gray-900">Weekly Performance Report</h4>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Active
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-3">Weekly analysis of delivery times, costs, and carrier performance</p>
            <div className="flex items-center space-x-4 text-sm">
              <span><strong>Schedule:</strong> Mondays at 8:00 AM</span>
              <span><strong>Recipients:</strong> 2 users</span>
              <span><strong>Format:</strong> PDF</span>
            </div>
          </div>
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-gray-900">Monthly Cost Analysis</h4>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                Paused
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-3">Monthly breakdown of shipping costs by carrier, destination, and service type</p>
            <div className="flex items-center space-x-4 text-sm">
              <span><strong>Schedule:</strong> 1st of each month</span>
              <span><strong>Recipients:</strong> 1 user</span>
              <span><strong>Format:</strong> Excel</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <DocumentArrowDownIcon className="h-5 w-5 mr-2 text-blue-600" />
          Export Options
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Quick Exports</h4>
            <div className="space-y-2">
              <button className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Today's Shipments</span>
                  <DocumentArrowDownIcon className="h-4 w-4 text-gray-400" />
                </div>
              </button>
              <button className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">This Week's Orders</span>
                  <DocumentArrowDownIcon className="h-4 w-4 text-gray-400" />
                </div>
              </button>
              <button className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Pending Shipments</span>
                  <DocumentArrowDownIcon className="h-4 w-4 text-gray-400" />
                </div>
              </button>
            </div>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Custom Export</h4>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                  <input
                    type="date"
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Format</label>
                <select className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm">
                  <option>Excel (.xlsx)</option>
                  <option>CSV (.csv)</option>
                  <option>PDF Report</option>
                </select>
              </div>
              <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors">
                Generate Export
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <UnifiedDashboardLayout navigation={navigation} userInfo={userInfo}>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-gray-900">Logistics Settings</h1>
          <p className="text-gray-600 mt-2">Configure warehouse operations, shipping preferences, and system settings</p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <tab.icon className="h-4 w-4 mr-2" />
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>
          <div className="p-6">
            {activeTab === 'warehouse' && renderWarehouseSettings()}
            {activeTab === 'shipping' && renderShippingSettings()}
            {activeTab === 'notifications' && renderNotificationSettings()}
            {activeTab === 'reports' && renderReportsSettings()}
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button className="bg-blue-600 text-white py-2 px-6 rounded-md hover:bg-blue-700 transition-colors">
            Save Settings
          </button>
        </div>
      </div>
    </UnifiedDashboardLayout>
  );
};

export default LogisticsSettings;