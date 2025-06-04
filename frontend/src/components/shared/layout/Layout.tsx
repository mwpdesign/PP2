import React from 'react';
import { Outlet } from 'react-router-dom';
import {
  HomeIcon,
  UserPlusIcon,
  ClipboardDocumentCheckIcon,
  DocumentTextIcon,
  TruckIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/solid';
import Sidebar from './Sidebar';
import SystemHeader from './SystemHeader';
import MobileHeader from './MobileHeader';
import MobileMenu from './MobileMenu';
import { useAuth } from '../../../contexts/AuthContext';

const Layout: React.FC = () => {
  const { logout, user } = useAuth();

  const navigation = [
    { name: 'Dashboard', href: '/doctor/dashboard', icon: HomeIcon },
    { name: 'Patient Intake', href: '/doctor/patients', icon: UserPlusIcon },
    { name: 'IVR Management', href: '/doctor/ivr', icon: ClipboardDocumentCheckIcon },
    { name: 'Order Management', href: '/doctor/orders', icon: DocumentTextIcon },
    { name: 'Shipping & Logistics', href: '/doctor/shipping', icon: TruckIcon },
    { name: 'Analytics & Reports', href: '/doctor/analytics', icon: ChartBarIcon },
    { name: 'Settings', href: '/doctor/settings', icon: Cog6ToothIcon },
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
    name: user?.first_name ? `${user.first_name} ${user.last_name}` : 'Dr. John',
    role: user?.role || 'Doctor',
    avatar: user?.first_name?.charAt(0) || 'Dr'
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

export default Layout;