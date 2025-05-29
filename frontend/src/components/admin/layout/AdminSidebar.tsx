import React from 'react';
import { Link, useLocation } from 'react-router-dom';
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

const AdminSidebar: React.FC = () => {
  const location = useLocation();
  const { logout } = useAuth();

  const navigation = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: HomeIcon },
    { name: 'User Management', href: '/admin/users', icon: UsersIcon },
    { name: 'IVR Review Queue', href: '/admin/ivr-review', icon: ClipboardDocumentCheckIcon },
    { name: 'Provider Network', href: '/admin/providers', icon: BuildingOfficeIcon },
    { name: 'System Analytics', href: '/admin/analytics', icon: ChartBarIcon },
    { name: 'Audit Logs', href: '/admin/audit', icon: DocumentMagnifyingGlassIcon },
    { name: 'Settings', href: '/admin/settings', icon: Cog6ToothIcon }
  ];

  const handleSignOut = async () => {
    try {
      await logout();
      window.location.href = '/login';
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  };

  return (
    <div className="fixed inset-y-0 left-0 w-[280px] bg-[#2C3E50] text-white">
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-start p-6 border-b border-[rgba(255,255,255,0.1)]">
          <img 
            src="/logo2.png" 
            alt="Clear Health Plus Wound Care" 
            className="h-24 w-auto"
            onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
              const target = e.currentTarget;
              target.style.display = 'none';
              const parent = target.parentElement;
              if (parent) {
                parent.innerHTML = '<span class="text-white text-2xl font-semibold">Healthcare IVR</span>';
              }
            }}
          />
        </div>
        <nav className="flex-1 px-7 pt-4 space-y-2">
          {navigation.map((item) => {
            const isActive = location.pathname.startsWith(item.href);
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`
                  flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors
                  ${isActive 
                    ? 'bg-[#375788] text-white' 
                    : 'text-[rgba(255,255,255,0.9)] hover:bg-[rgba(255,255,255,0.1)] hover:text-white'}
                `}
              >
                <item.icon className="mr-4 h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>
        <div className="px-7 py-4">
          <button
            onClick={handleSignOut}
            className="w-full flex items-center px-4 py-3 text-sm font-medium text-[rgba(255,255,255,0.9)] hover:text-white hover:bg-[rgba(255,255,255,0.1)] rounded-lg transition-colors"
          >
            <ArrowRightOnRectangleIcon className="mr-4 h-5 w-5" />
            Sign Out
          </button>
        </div>
        <div className="px-7 pb-4">
          <div className="border-t border-[rgba(255,255,255,0.1)] pt-4 mt-4">
            <div className="flex items-center px-4">
              <div className="h-10 w-10 rounded-full bg-[#375788] flex items-center justify-center">
                <span className="text-white font-medium text-lg">Ad</span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-white">Admin User</p>
                <p className="text-xs text-[rgba(255,255,255,0.7)]">Administrator</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSidebar; 