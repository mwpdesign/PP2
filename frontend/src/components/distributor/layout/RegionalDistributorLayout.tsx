import React from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import {
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/solid';
import { useAuth } from '../../../contexts/AuthContext';
import MobileHeader from '../../shared/layout/MobileHeader';
import MobileMenu from '../../shared/layout/MobileMenu';
import { createRegionalDistributorNavigation } from '../../../utils/navigation';

interface NavigationItemWithExtras {
  name: string;
  href: string;
  icon: any;
  badge?: string;
  onClick?: () => Promise<void>;
}

const RegionalDistributorLayout: React.FC = () => {
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

  // Get navigation from our centralized navigation utility
  const baseNavigation = createRegionalDistributorNavigation();

  // Map our navigation items to the format expected by this layout
  const navigation: NavigationItemWithExtras[] = [
    ...baseNavigation.map(item => ({
      name: item.label,
      href: item.path,
      icon: item.icon
    })),
    {
      name: 'Sign Out',
      href: '#',
      icon: ArrowRightOnRectangleIcon,
      onClick: handleSignOut
    }
  ];

  // Find the most specific (longest) matching navigation item
  const getActiveHref = (pathname: string, nav: NavigationItemWithExtras[]) => {
    let activeHref = '';
    nav.forEach(item => {
      if (item.href !== '#' && (pathname === item.href || (pathname.startsWith(item.href) && item.href.length > activeHref.length))) {
        activeHref = item.href;
      }
    });
    return activeHref;
  };
  const activeHref = getActiveHref(location.pathname, navigation);

  const userInfo = {
    name: `${user?.first_name || ''} ${user?.last_name || 'RD'}`,
    role: 'Regional Distributor',
    avatar: `${user?.first_name?.[0] || ''}${user?.last_name?.[0] || 'RD'}`
  };

  return (
    <div className="min-h-screen bg-gray-100 overflow-x-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden md:block fixed inset-y-0 left-0 w-[280px] bg-[#334155] text-white">
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
              const isActive = item.href !== '#' && item.href === activeHref;
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
                    {user?.first_name?.[0]}{user?.last_name?.[0] || 'RD'}
                  </span>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-white">{user?.first_name} {user?.last_name}</p>
                  <p className="text-xs text-slate-400">Regional Distributor</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Header */}
      <MobileHeader userInfo={userInfo} />

      {/* Mobile Menu */}
      <MobileMenu navigation={navigation} userInfo={userInfo} />

      {/* Main Content Area */}
      <div className="md:pl-[280px] pt-14 md:pt-0 min-w-0 overflow-x-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 md:px-4 py-4 bg-white border-b border-gray-200 overflow-x-hidden">
          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-medium text-gray-900 truncate">
              Welcome, {user?.first_name} {user?.last_name}
            </h1>
          </div>
          <div className="hidden md:flex items-center gap-4 flex-shrink-0">
            <div className="flex items-center">
              <div className="h-2 w-2 bg-green-500 rounded-full mr-2" />
              <span className="text-sm text-gray-600">System Status: Operational</span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main className="min-h-screen p-4 md:p-8 overflow-x-hidden min-w-0">
          <div className="max-w-full overflow-x-hidden">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default RegionalDistributorLayout;