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
  const { logout } = useAuth();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
    { name: 'Patient Intake', href: '/patients', icon: UserPlusIcon },
    { name: 'IVR Management', href: '/ivr', icon: ClipboardDocumentCheckIcon },
    { name: 'Order Management', href: '/orders', icon: DocumentTextIcon },
    { name: 'Shipping & Logistics', href: '/shipping', icon: TruckIcon },
    { name: 'Analytics & Reports', href: '/analytics', icon: ChartBarIcon },
    { name: 'Settings', href: '/settings', icon: Cog6ToothIcon },
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
    name: 'Dr. John',
    role: 'Doctor',
    avatar: 'Dr'
  };

  return (
    <div className="min-h-screen bg-gray-100 overflow-x-hidden">
      {/* Desktop Sidebar */}
      <Sidebar />
      
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