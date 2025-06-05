import React from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import Sidebar from './Sidebar';
import SystemHeader from './SystemHeader';
import MobileHeader from './MobileHeader';
import MobileMenu from './MobileMenu';

interface NavigationItem {
  name: string;
  href: string;
  icon: any;
  onClick?: () => void;
}

interface UnifiedDashboardLayoutProps {
  navigation: NavigationItem[];
  userInfo?: {
    name: string;
    role: string;
    avatar: string;
  };
  children?: React.ReactNode;
}

const UnifiedDashboardLayout: React.FC<UnifiedDashboardLayoutProps> = ({
  navigation,
  userInfo: customUserInfo,
  children
}) => {
  const { logout, user } = useAuth();

  const defaultUserInfo = {
    name: user?.first_name ? `${user.first_name} ${user.last_name}` : 'User',
    role: user?.role || 'User',
    avatar: user?.first_name?.charAt(0) || 'U'
  };

  const userInfo = customUserInfo || defaultUserInfo;

  return (
    <div className="min-h-screen bg-gray-100 overflow-x-hidden">
      {/* Desktop Sidebar */}
      <Sidebar navigation={navigation} userInfo={userInfo} />

      {/* Mobile Header */}
      <MobileHeader userInfo={userInfo} />

      {/* Mobile Menu */}
      <MobileMenu navigation={navigation} userInfo={userInfo} />

      {/* Main Content */}
      <div className="md:pl-[280px] pt-14 md:pt-0 min-w-0 overflow-x-hidden">
        <SystemHeader />
        <main className="min-h-screen p-4 md:p-8 overflow-x-hidden min-w-0">
          <div className="max-w-full overflow-x-hidden">
            {children || <Outlet />}
          </div>
        </main>
      </div>
    </div>
  );
};

export default UnifiedDashboardLayout;