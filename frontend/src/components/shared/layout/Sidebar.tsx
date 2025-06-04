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

interface NavigationItem {
  name: string;
  href: string;
  icon: any;
  onClick?: () => void;
}

interface UserInfo {
  name: string;
  role: string;
  avatar: string;
}

interface SidebarProps {
  navigation?: NavigationItem[];
  userInfo?: UserInfo;
}

const Sidebar: React.FC<SidebarProps> = ({ navigation: customNavigation, userInfo: customUserInfo }) => {
  const location = useLocation();
  const { logout } = useAuth();

  const defaultNavigation = [
    { name: 'Dashboard', href: '/doctor/dashboard', icon: HomeIcon },
    { name: 'Patient Intake', href: '/doctor/patients', icon: UserPlusIcon },
    { name: 'IVR Management', href: '/doctor/ivr', icon: ClipboardDocumentCheckIcon },
    { name: 'Order Management', href: '/doctor/orders', icon: DocumentTextIcon },
    { name: 'Shipping & Logistics', href: '/doctor/shipping', icon: TruckIcon },
    { name: 'Analytics & Reports', href: '/doctor/analytics', icon: ChartBarIcon },
    { name: 'Settings', href: '/doctor/settings', icon: Cog6ToothIcon },
  ];

  const defaultUserInfo = {
    name: 'Dr. John',
    role: 'Doctor',
    avatar: 'Dr'
  };

  const navigation = customNavigation || defaultNavigation;
  const userInfo = customUserInfo || defaultUserInfo;

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

            if (item.onClick) {
              return (
                <button
                  key={item.name}
                  onClick={item.onClick}
                  className="w-full flex items-center px-4 py-3 text-sm font-medium text-[rgba(255,255,255,0.9)] hover:text-white hover:bg-[rgba(255,255,255,0.1)] rounded-lg transition-colors"
                >
                  <item.icon className="mr-4 h-5 w-5" />
                  {item.name}
                </button>
              );
            }

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
        <div className="mt-auto px-7 pb-4">
          {/* Logout Button - Always available */}
          <button
            onClick={handleSignOut}
            className="w-full flex items-center px-4 py-3 text-sm font-medium text-[rgba(255,255,255,0.9)] hover:text-white hover:bg-[rgba(255,255,255,0.1)] rounded-lg transition-colors mb-4"
          >
            <ArrowRightOnRectangleIcon className="mr-4 h-5 w-5" />
            Sign Out
          </button>

          <div className="border-t border-[rgba(255,255,255,0.1)] pt-4">
            <div className="flex items-center px-4">
              <div className="h-10 w-10 rounded-full bg-[#375788] flex items-center justify-center">
                <span className="text-white font-medium text-lg">{userInfo.avatar}</span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-white">{userInfo.name}</p>
                <p className="text-xs text-[rgba(255,255,255,0.7)]">{userInfo.role}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;