import React from 'react';
import { useLocation, Link, Outlet } from 'react-router-dom';
import { 
  ChartBarIcon, 
  UsersIcon, 
  CogIcon, 
  ShieldCheckIcon,
  HomeIcon
} from '@heroicons/react/24/outline';
import { classNames } from '../../utils/styles';

const navigation = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: HomeIcon },
  { name: 'User Management', href: '/admin/users', icon: UsersIcon },
  { name: 'System Analytics', href: '/admin/analytics', icon: ChartBarIcon },
  { name: 'Compliance', href: '/admin/compliance', icon: ShieldCheckIcon },
  { name: 'Settings', href: '/admin/settings', icon: CogIcon },
];

const AdminLayout: React.FC = () => {
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Dark Sidebar */}
      <div className="fixed inset-y-0 left-0 w-[280px] bg-[#2C3E50] text-white">
        <div className="flex flex-col h-full">
          {/* Logo Section */}
          <div className="flex items-center justify-start pt-8 px-6 pb-6 border-b border-[rgba(255,255,255,0.1)]">
            <img 
              src="/logo2.png" 
              alt="Healthcare IVR Platform" 
              className="h-20 w-auto pl-[10px]"
            />
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-7 pt-4 space-y-2">
            {navigation.map((item) => {
              const isActive = currentPath === item.href;
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

          {/* Admin Profile */}
          <div className="mt-auto px-7 pb-4">
            <div className="border-t border-[rgba(255,255,255,0.1)] pt-4 mt-4">
              <div className="flex items-center px-4">
                <div className="h-10 w-10 rounded-full bg-[#375788] flex items-center justify-center">
                  <span className="text-white font-medium text-lg">A</span>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-white">Admin User</p>
                  <p className="text-xs text-[rgba(255,255,255,0.7)]">System Administrator</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col flex-1 pl-[280px]">
        {/* Top Header */}
        <div className="flex-shrink-0 bg-white border-b border-gray-200">
          <div className="flex justify-between items-center px-8 py-6">
            <h1 className="text-2xl font-semibold text-gray-900">
              Healthcare IVR Platform
            </h1>
          </div>
        </div>

        {/* Main Content Area */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-8">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout; 