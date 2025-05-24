import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  HomeIcon,
  UserPlusIcon,
  ClipboardDocumentCheckIcon,
  ShoppingCartIcon,
  TruckIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/solid';

const navigation = [
  { 
    name: 'Dashboard', 
    path: '/dashboard', 
    icon: HomeIcon,
    description: 'Overview and analytics'
  },
  { 
    name: 'Patient Intake', 
    path: '/intake', 
    icon: UserPlusIcon,
    description: 'Wound assessment forms'
  },
  { 
    name: 'IVR Management', 
    path: '/ivr', 
    icon: ClipboardDocumentCheckIcon,
    description: 'Submit and track IVR requests'
  },
  { 
    name: 'Order Management', 
    path: '/orders', 
    icon: ShoppingCartIcon,
    description: 'Post-IVR approval ordering'
  },
  { 
    name: 'Shipping & Logistics', 
    path: '/shipping', 
    icon: TruckIcon,
    description: 'Track order fulfillment'
  },
  { 
    name: 'Analytics & Reports', 
    path: '/analytics', 
    icon: ChartBarIcon,
    description: 'Wound care outcomes'
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

  return (
    <aside className="fixed top-0 left-0 bottom-0 w-64 bg-[#2C3E50] flex flex-col">
      {/* Logo */}
      <div className="h-28 flex items-center justify-center px-6 border-b border-[#1a2533]">
        <img src="/logo2.png" alt="Wound Care Management" className="h-20 w-auto" />
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {navigation.map((item) => (
          <Link
            key={item.name}
            to={item.path}
            className={`flex items-center px-4 py-3 text-sm rounded-lg transition-colors ${
              location.pathname === item.path
                ? 'bg-[#1a2533] text-white shadow-md'
                : 'text-gray-300 hover:bg-[#1a2533] hover:text-white'
            }`}
          >
            <item.icon className="w-5 h-5 mr-3" />
            <span>{item.name}</span>
          </Link>
        ))}
      </nav>

      {/* User Profile and Sign Out */}
      <div className="mt-auto border-t border-[#1a2533]">
        <div className="p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-[#1a2533] flex items-center justify-center text-white">
              <span className="text-sm font-medium">Dr</span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-white">Dr. John</p>
              <p className="text-xs text-gray-400">Doctor</p>
            </div>
          </div>
          <Link 
            to="/logout" 
            className="mt-3 flex items-center px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-[#1a2533] rounded-lg transition-colors"
          >
            <ArrowRightOnRectangleIcon className="w-5 h-5 mr-3" />
            <span>Sign Out</span>
          </Link>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar; 