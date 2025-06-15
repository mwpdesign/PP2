import React from 'react';
import { Outlet } from 'react-router-dom';
import {
  HomeIcon,
  PhoneIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon,
  TruckIcon
} from '@heroicons/react/24/solid';
import Sidebar from '../shared/layout/Sidebar';
import SystemHeader from '../shared/layout/SystemHeader';
import MobileHeader from '../shared/layout/MobileHeader';
import MobileMenu from '../shared/layout/MobileMenu';
import { useAuth } from '../../contexts/AuthContext';

const IVRLayout: React.FC = () => {
  const { logout, user } = useAuth();

  const navigation = [
    { name: 'Dashboard', href: '/ivr/dashboard', icon: HomeIcon },
    { name: 'IVR Management', href: '/ivr/calls', icon: PhoneIcon },
    { name: 'Order Management', href: '/ivr/orders', icon: DocumentTextIcon },
    { name: 'Shipping & Logistics', href: '/ivr/shipping', icon: TruckIcon },
    { name: 'Queue Monitor', href: '/ivr/queue', icon: ClockIcon },
    { name: 'System Status', href: '/ivr/status', icon: ExclamationTriangleIcon },
    { name: 'Analytics', href: '/ivr/analytics', icon: ChartBarIcon },
    { name: 'Settings', href: '/ivr/settings', icon: Cog6ToothIcon },
    {
      name: 'Sign Out',
      href: '#',
      icon: ArrowRightOnRectangleIcon,
      onClick: async () => {
        try {
          await logout();
          window.location.href = '/login';
        } catch (error) {
          console.error('Sign out failed:', error);
        }
      }
    }
  ];

  const userInfo = {
    name: `${user?.first_name || 'IVR'} ${user?.last_name || 'User'}`,
    role: 'IVR System',
    avatar: user?.first_name?.charAt(0) || 'I'
  };

  return (
    <div className="min-h-screen bg-gray-100 overflow-x-hidden">
      {/* Desktop Sidebar */}
      <Sidebar navigation={navigation} userInfo={userInfo} />

      {/* Mobile Header */}
      <MobileHeader userInfo={userInfo} />

      {/* Mobile Menu */}
      <MobileMenu navigation={navigation} userInfo={userInfo} />

      {/* Main Content */}
      <div className="md:pl-[280px] pt-14 md:pt-0 min-w-0 overflow-x-hidden">
        <SystemHeader />
        <main className="min-h-screen p-4 md:p-8 overflow-x-hidden min-w-0">
          <div className="max-w-full overflow-x-hidden">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default IVRLayout;