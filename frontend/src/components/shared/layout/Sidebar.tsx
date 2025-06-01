import { Link, useLocation } from 'react-router-dom';
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
import { useAuth } from '../../../contexts/AuthContext';

const Sidebar = () => {
  const location = useLocation();
  const { logout } = useAuth();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
    { name: 'Patient Intake', href: '/patients', icon: UserPlusIcon },
    { name: 'IVR Management', href: '/ivr', icon: ClipboardDocumentCheckIcon },
    { name: 'Order Management', href: '/orders', icon: DocumentTextIcon },
    { name: 'Shipping & Logistics', href: '/shipping', icon: TruckIcon },
    { name: 'Analytics & Reports', href: '/analytics', icon: ChartBarIcon },
    { name: 'Settings', href: '/settings', icon: Cog6ToothIcon },
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
    <div className="hidden md:block fixed inset-y-0 left-0 w-[280px] bg-[#2C3E50] text-white">
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-start p-6 border-b border-[rgba(255,255,255,0.1)]">
          <img 
            src="/logo2.png" 
            alt="Healthcare IVR" 
            className="h-24 w-auto"
            onError={(e) => {
              const target = e.target as HTMLElement;
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
          <button
            onClick={handleSignOut}
            className="w-full flex items-center px-4 py-3 text-sm font-medium text-[rgba(255,255,255,0.9)] hover:text-white hover:bg-[rgba(255,255,255,0.1)] rounded-lg transition-colors mt-2"
          >
            <ArrowRightOnRectangleIcon className="mr-4 h-5 w-5" />
            Sign Out
          </button>
        </nav>
        <div className="mt-auto px-7 pb-4">
          <div className="border-t border-[rgba(255,255,255,0.1)] pt-4 mt-4">
            <div className="flex items-center px-4">
              <div className="h-10 w-10 rounded-full bg-[#375788] flex items-center justify-center">
                <span className="text-white font-medium text-lg">Dr</span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-white">Dr. John</p>
                <p className="text-xs text-[rgba(255,255,255,0.7)]">Doctor</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar; 