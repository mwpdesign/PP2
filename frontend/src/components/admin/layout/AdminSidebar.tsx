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

  return (
    <div className="hidden md:block fixed inset-y-0 left-0 w-[280px] bg-[#334155] text-white">
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-start p-6 border-b border-slate-700">
          <img 
            src="/logo2.png" 
            alt="Healthcare IVR Admin" 
            className="h-24 w-auto"
            onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
              const target = e.currentTarget;
              target.style.display = 'none';
              const parent = target.parentElement;
              if (parent) {
                parent.innerHTML = '<span class="text-white text-2xl font-semibold">Healthcare IVR Admin</span>';
              }
            }}
          />
        </div>
        <nav className="flex-1 px-6 pt-4 space-y-1">
          {navigation.map((item) => {
            const isActive = item.href !== '#' && location.pathname.startsWith(item.href);
            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={item.onClick}
                className={`
                  flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors
                  focus:outline-none focus:ring-2 focus:ring-[#375788] focus:ring-offset-2 focus:ring-offset-slate-900
                  ${isActive 
                    ? 'bg-[#375788] text-white' 
                    : 'text-slate-300 hover:bg-slate-600 hover:text-white'}
                `}
              >
                <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                {item.name}
              </Link>
            );
          })}
        </nav>
        <div className="px-6 pb-4">
          <div className="border-t border-slate-700 pt-4 mt-4">
            <div className="flex items-center px-4">
              <div className="h-10 w-10 rounded-full bg-slate-600 flex items-center justify-center">
                <span className="text-white font-medium text-lg">A</span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-white">System Admin</p>
                <p className="text-xs text-slate-400">Administrator</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSidebar; 