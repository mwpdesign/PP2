import React from 'react';
import { Outlet } from 'react-router-dom';
import {
  HomeIcon,
  UsersIcon,
  ClipboardDocumentCheckIcon,
  BuildingOfficeIcon,
  ChartBarIcon,
  DocumentMagnifyingGlassIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/solid';
import { useAuth } from '../../../contexts/AuthContext';
import AdminSidebar from './AdminSidebar';
import MobileHeader from '../../shared/layout/MobileHeader';
import MobileMenu from '../../shared/layout/MobileMenu';

const AdminLayout: React.FC = () => {
  const { user, logout } = useAuth();

  const handleSignOut = async () => {
    try {
      await logout();
      window.location.href = '/login';
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  };

  const navigation = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: HomeIcon },
    { name: 'IVR Review', href: '/admin/ivr-review', icon: ClipboardDocumentCheckIcon },
    { name: 'Provider Network', href: '/admin/providers', icon: BuildingOfficeIcon },
    { name: 'User Management', href: '/admin/users', icon: UsersIcon },
    { name: 'System Analytics', href: '/admin/analytics', icon: ChartBarIcon },
    { name: 'Audit Logs', href: '/admin/audit-logs', icon: DocumentMagnifyingGlassIcon },
    { name: 'System Settings', href: '/admin/settings', icon: Cog6ToothIcon },
    { 
      name: 'Sign Out', 
      href: '#', 
      icon: ArrowRightOnRectangleIcon,
      onClick: handleSignOut 
    }
  ];

  const userInfo = {
    name: `${user?.firstName || 'System'} ${user?.lastName || 'Admin'}`,
    role: 'Administrator',
    avatar: 'A'
  };

  return (
    <div className="flex h-screen bg-gray-100 overflow-x-hidden">
      {/* Desktop Sidebar */}
      <AdminSidebar />
      
      {/* Mobile Header */}
      <MobileHeader userInfo={userInfo} />
      
      {/* Mobile Menu */}
      <MobileMenu navigation={navigation} userInfo={userInfo} />
      
      {/* Main Content Area */}
      <div className="flex-1 md:ml-[280px] pt-14 md:pt-0 min-w-0 overflow-x-hidden">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 overflow-x-hidden">
          <div className="flex items-center justify-between px-4 md:px-8 py-4 min-w-0">
            <h1 className="text-lg font-medium text-gray-900 truncate">
              Welcome, {user?.firstName} {user?.lastName}
            </h1>
            <div className="hidden md:flex items-center gap-4 flex-shrink-0">
              <div className="flex items-center">
                <div className="h-2 w-2 bg-green-500 rounded-full mr-2" />
                <span className="text-sm text-gray-600">System Status: Operational</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main className="p-4 md:p-8 overflow-x-hidden min-w-0">
          <div className="max-w-full overflow-x-hidden">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout; 