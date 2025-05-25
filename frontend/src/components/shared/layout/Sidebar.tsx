import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  HomeIcon,
  UserPlusIcon,
  PhoneIcon,
  ShoppingCartIcon,
  TruckIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline';

const navigation = [
  { 
    name: 'Dashboard', 
    path: '/dashboard',
    icon: HomeIcon,
    description: 'Overview and KPIs'
  },
  { 
    name: 'Patient Intake', 
    path: '/patients/intake',
    icon: UserPlusIcon,
    description: 'New patient assessments'
  },
  { 
    name: 'IVR Management', 
    path: '/ivr',
    icon: PhoneIcon,
    description: 'Call handling and routing'
  },
  { 
    name: 'Order Management', 
    path: '/orders',
    icon: ShoppingCartIcon,
    description: 'Process and track orders'
  },
  { 
    name: 'Shipping & Logistics', 
    path: '/shipping',
    icon: TruckIcon,
    description: 'Delivery management'
  },
  { 
    name: 'Analytics & Reports', 
    path: '/analytics',
    icon: ChartBarIcon,
    description: 'Performance metrics'
  },
  { 
    name: 'Settings', 
    path: '/settings',
    icon: Cog6ToothIcon,
    description: 'System configuration'
  }
];

const Sidebar = () => {
  const location = useLocation();
  console.log('Sidebar rendering, current path:', location.pathname);

  const handleSignOut = () => {
    // TODO: Implement sign out logic
    console.log('Sign out clicked');
  };

  return (
    <aside className="fixed top-0 left-0 bottom-0 w-64 bg-[#2d3748] flex flex-col">
      {/* Logo Section - Increased height and padding for better visibility */}
      <div className="flex items-center justify-center pl-4 pr-8 py-8 border-b border-[#1a2533] bg-[#243141]">
        <img 
          src="/logo2.png" 
          alt="Wound Care IVR" 
          className="h-20 w-auto"
          onError={(e) => {
            const target = e.target as HTMLElement;
            target.style.display = 'none';
            const parent = target.parentElement;
            if (parent) {
              parent.innerHTML = '<span class="text-white text-2xl font-semibold">Wound Care IVR</span>';
            }
          }}
        />
      </div>

      {/* Navigation Section */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <Link
              key={item.name}
              to={item.path}
              className={`flex items-center px-4 py-3 text-sm rounded-lg transition-colors group ${
                isActive
                  ? 'bg-[#1a2533] text-white shadow-md'
                  : 'text-gray-300 hover:bg-[#1a2533] hover:text-white'
              }`}
              title={item.description}
            >
              <Icon className={`h-5 w-5 mr-3 ${
                isActive ? 'text-white' : 'text-gray-400 group-hover:text-white'
              }`} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom Section */}
      <div className="mt-auto border-t border-[#1a2533] pb-6">
        {/* User Profile */}
        <div className="px-4 py-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-10 w-10 rounded-full bg-[#375788] flex items-center justify-center">
                <span className="text-white font-medium text-lg">Dr</span>
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-white">Dr. John</p>
              <p className="text-xs text-gray-400">Doctor</p>
            </div>
          </div>
          
          {/* Sign Out Button - Moved under profile info */}
          <button
            onClick={handleSignOut}
            className="w-full mt-4 flex items-center justify-center px-4 py-2 text-sm text-gray-300 hover:bg-[#1a2533] hover:text-white transition-colors group rounded-lg"
          >
            <ArrowRightOnRectangleIcon className="h-5 w-5 mr-2 text-gray-400 group-hover:text-white" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar; 