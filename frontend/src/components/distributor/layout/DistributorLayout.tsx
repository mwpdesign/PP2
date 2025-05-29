import React from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import {
  HomeIcon,
  DocumentTextIcon,
  ArchiveBoxIcon,
  TruckIcon,
  ChartBarIcon,
  ArrowRightOnRectangleIcon
  // TODO: Restore for post-demo - UsersIcon, Cog6ToothIcon
} from '@heroicons/react/24/solid';
import { useAuth } from '../../../contexts/AuthContext';

const DistributorLayout: React.FC = () => {
  const location = useLocation();
  const { user, logout } = useAuth();

  const handleSignOut = async () => {
    try {
      await logout();
      window.location.href = '/login';
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  };

  // TODO: Demo configuration - Manage Network and Settings temporarily removed
  // To restore post-demo, uncomment the following lines:
  // { name: 'Manage Network', href: '/distributor/network', icon: UsersIcon },
  // { name: 'Settings', href: '/distributor/settings', icon: Cog6ToothIcon },
  const navigation = [
    { name: 'Dashboard', href: '/distributor/dashboard', icon: HomeIcon },
    { name: 'IVR Management', href: '/distributor/ivr/management', icon: DocumentTextIcon },
    { name: 'Order Processing', href: '/distributor/orders/management', icon: ArchiveBoxIcon },
    { name: 'Shipping & Logistics', href: '/distributor/orders/shipping', icon: TruckIcon },
    { name: 'Analytics & Reports', href: '/distributor/analytics', icon: ChartBarIcon },
    { 
      name: 'Sign Out', 
      href: '#', 
      icon: ArrowRightOnRectangleIcon,
      onClick: handleSignOut 
    }
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 w-[280px] bg-[#334155] text-white">
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-start p-6 border-b border-slate-700">
            <img 
              src="/logo2.png" 
              alt="Healthcare IVR Platform" 
              className="h-24 w-auto"
              onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                const target = e.currentTarget;
                target.style.display = 'none';
                const parent = target.parentElement;
                if (parent) {
                  parent.innerHTML = '<span class="text-white text-2xl font-semibold">Healthcare IVR Platform</span>';
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
                  <span className="text-white font-medium text-lg">
                    {user?.firstName?.[0]}{user?.lastName?.[0] || 'MD'}
                  </span>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-white">{user?.firstName} {user?.lastName}</p>
                  <p className="text-xs text-slate-400">Master Distributor</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="pl-[280px]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-white border-b border-gray-200">
          <div>
            <h1 className="text-lg font-medium text-gray-900">
              Welcome, {user?.firstName} {user?.lastName}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center">
              <div className="h-2 w-2 bg-green-500 rounded-full mr-2" />
              <span className="text-sm text-gray-600">System Status: Operational</span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main className="min-h-screen p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DistributorLayout; 