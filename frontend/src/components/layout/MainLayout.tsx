import React, { Suspense } from 'react';
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
import Sidebar from '../shared/layout/Sidebar';
import MobileHeader from '../shared/layout/MobileHeader';
import MobileMenu from '../shared/layout/MobileMenu';
import { useAuth } from '../../contexts/AuthContext';

const LoadingFallback = () => (
  <div className="flex items-center justify-center h-screen bg-gray-50">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#375788]" />
  </div>
);

export const MainLayout: React.FC = () => {
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

  console.log('MainLayout component mounted');

  return (
    <div className="flex min-h-screen bg-gray-50 overflow-x-hidden">
      {/* Desktop Sidebar */}
      <Sidebar />
      
      {/* Mobile Header */}
      <MobileHeader userInfo={userInfo} />
      
      {/* Mobile Menu */}
      <MobileMenu navigation={navigation} userInfo={userInfo} />
      
      {/* Main Content */}
      <main className="flex-grow md:ml-[280px] pt-14 md:pt-0 min-h-screen bg-gray-50 min-w-0 overflow-x-hidden">
        <div className="max-w-full overflow-x-hidden">
          <Suspense fallback={<LoadingFallback />}>
            <Outlet />
          </Suspense>
        </div>
      </main>
    </div>
  );
}; 