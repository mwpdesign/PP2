import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import UnifiedDashboardLayout from './layout/UnifiedDashboardLayout';
import {
  HomeIcon,
  UsersIcon,
  ChartBarIcon,
  DocumentTextIcon,
  ClipboardDocumentListIcon,
  TruckIcon,
  CalendarIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/solid';

interface ReadOnlyViewProps {
  component: React.ComponentType<any>;
  componentProps?: any;
  title?: string;
}

const ReadOnlyView: React.FC<ReadOnlyViewProps> = ({
  component: Component,
  componentProps = {},
  title = "View Only Access"
}) => {
  const { logout, user } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // Sales navigation for consistency (matches createSalesNavigation)
  const navigation = [
    { name: 'Dashboard', href: '/sales/dashboard', icon: HomeIcon },
    { name: 'My Doctors', href: '/sales/doctors', icon: UsersIcon },
    { name: 'Schedule', href: '/sales/schedule', icon: CalendarIcon },
    { name: 'Analytics', href: '/sales/analytics', icon: ChartBarIcon },
    { name: 'IVR Management', href: '/sales/ivr', icon: DocumentTextIcon },
    { name: 'Order Management', href: '/sales/orders', icon: ClipboardDocumentListIcon },
    { name: 'Shipping & Logistics', href: '/sales/shipping', icon: TruckIcon },
    { name: 'Settings', href: '/sales/settings', icon: Cog6ToothIcon },
    {
      name: 'Sign Out',
      href: '#',
      icon: ArrowRightOnRectangleIcon,
      onClick: handleLogout
    }
  ];

  const userInfo = {
    name: user?.first_name ? `${user.first_name} ${user.last_name}` : 'Sales Rep',
    role: 'Sales Representative',
    avatar: user?.first_name?.charAt(0) || 'S'
  };

  return (
    <UnifiedDashboardLayout navigation={navigation} userInfo={userInfo}>
      {/* Read-Only Banner */}
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-yellow-700">
              <strong>View Only Access:</strong> {title} - You can view information but cannot make changes.
            </p>
          </div>
        </div>
      </div>

      {/* Component with read-only styling */}
      <div className="read-only-wrapper">
        <Component {...componentProps} />
      </div>

      {/* CSS for read-only styling */}
      <style dangerouslySetInnerHTML={{
        __html: `
          .read-only-wrapper button:not(.read-only-allowed),
          .read-only-wrapper input:not(.read-only-allowed),
          .read-only-wrapper textarea:not(.read-only-allowed),
          .read-only-wrapper select:not(.read-only-allowed) {
            pointer-events: none !important;
            opacity: 0.7 !important;
            cursor: not-allowed !important;
          }

          .read-only-wrapper .read-only-allowed {
            pointer-events: auto !important;
            opacity: 1 !important;
            cursor: pointer !important;
          }

          /* Allow navigation and search to work */
          .read-only-wrapper nav button,
          .read-only-wrapper nav a,
          .read-only-wrapper [role="button"],
          .read-only-wrapper input[type="search"],
          .read-only-wrapper .search-input {
            pointer-events: auto !important;
            opacity: 1 !important;
            cursor: pointer !important;
          }
        `
      }} />
    </UnifiedDashboardLayout>
  );
};

export default ReadOnlyView;