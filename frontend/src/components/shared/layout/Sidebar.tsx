import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import Logo from './Logo';
import {
  HomeIcon,
  UserGroupIcon,
  PhoneIcon,
  ClipboardDocumentListIcon,
  UserIcon,
  ChartBarIcon,
  CalendarIcon,
  DocumentTextIcon,
  Cog6ToothIcon,
  ArrowLeftOnRectangleIcon
} from '@heroicons/react/24/solid';

const navigation = [
  { 
    name: 'Dashboard', 
    path: '/dashboard', 
    icon: HomeIcon,
    description: 'Overview and analytics'
  },
  { 
    name: 'Patients', 
    path: '/patients', 
    icon: UserGroupIcon,
    description: 'Patient management'
  },
  { 
    name: 'Wound Care', 
    path: '/ivr', 
    icon: PhoneIcon,
    description: 'Care management system'
  },
  { 
    name: 'Orders', 
    path: '/orders', 
    icon: ClipboardDocumentListIcon,
    description: 'Order management'
  },
  { 
    name: 'Providers', 
    path: '/providers', 
    icon: UserIcon,
    description: 'Healthcare providers'
  },
  { 
    name: 'Appointments', 
    path: '/appointments', 
    icon: CalendarIcon,
    description: 'Schedule management'
  },
  { 
    name: 'Documents', 
    path: '/documents', 
    icon: DocumentTextIcon,
    description: 'Medical records'
  },
  { 
    name: 'Analytics', 
    path: '/analytics', 
    icon: ChartBarIcon,
    description: 'Reports and insights'
  }
];

const Sidebar: React.FC = () => {
  const location = useLocation();

  return (
    <div className="fixed top-0 left-0 h-screen w-[280px] bg-[#2C3E50] flex flex-col">
      <div className="p-6">
        <div className="flex items-start justify-start mb-8">
          <img src="/logo2.png" alt="Healthcare IVR" className="h-32 w-auto" />
        </div>
        
        <nav className="space-y-1">
          {navigation.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center px-4 py-3 rounded-lg transition-all duration-200 ${
                  isActive
                    ? 'bg-[#375788] text-white shadow-sm'
                    : 'text-white hover:bg-[#375788]/20'
                }`}
              >
                <item.icon className={`h-5 w-5 mr-3 ${
                  isActive ? 'text-white' : 'text-white'
                }`} />
                <span className={`text-sm ${
                  isActive ? 'font-semibold' : 'font-medium'
                }`}>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="mt-auto p-6">
        <div className="bg-[#375788]/10 p-4 rounded-lg border border-[#375788]/20">
          <div className="flex items-center space-x-2 text-white mb-2">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span className="font-medium">HIPAA Compliant</span>
          </div>
          <p className="text-sm text-white">
            Your session is protected by industry-leading security measures
          </p>
        </div>
      </div>
    </div>
  );
};

export default Sidebar; 