import React from 'react';
import { Bars3Icon } from '@heroicons/react/24/outline';
import { useMobileNavigation } from '../../../contexts/MobileNavigationContext';
import { MobileNotificationBell } from '../MobileNotificationBell';

interface MobileHeaderProps {
  userInfo?: {
    name: string;
    role: string;
    avatar?: string;
  };
}

const MobileHeader: React.FC<MobileHeaderProps> = ({ userInfo }) => {
  const { toggleMobileMenu } = useMobileNavigation();

  const handleHamburgerClick = () => {
    toggleMobileMenu();
  };

  return (
    <header className="md:hidden fixed top-0 left-0 right-0 z-40 bg-[#334155] text-white border-b border-slate-700 h-14">
      <div className="flex items-center justify-between h-full px-4 relative">
        {/* Left side - Hamburger menu */}
        <div className="flex items-center">
          <button
            onClick={handleHamburgerClick}
            className="p-2 rounded-lg hover:bg-slate-600 transition-colors focus:outline-none focus:ring-2 focus:ring-[#375788]"
            aria-label="Toggle navigation menu"
          >
            <Bars3Icon className="h-6 w-6" />
          </button>
        </div>

        {/* Center - Logo */}
        <div className="absolute left-1/2 transform -translate-x-1/2 flex items-center">
          <img
            src="/logo2.png"
            alt="Healthcare IVR"
            className="h-8 w-auto"
            onError={(e) => {
              const target = e.target as HTMLElement;
              target.style.display = 'none';
              const parent = target.parentElement;
              if (parent) {
                parent.innerHTML = '<span class="text-white text-sm font-semibold">Clear Health Pass</span>';
              }
            }}
          />
        </div>

        {/* Right side - User info and notifications */}
        <div className="flex items-center space-x-3">
          {/* Notifications */}
          <MobileNotificationBell />

          {/* User info - condensed */}
          {userInfo && (
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-full bg-slate-600 flex items-center justify-center">
                <span className="text-white font-medium text-sm">
                  {userInfo.avatar || userInfo.name.split(' ').map(n => n[0]).join('')}
                </span>
              </div>
              <span className="text-sm font-medium text-white hidden xs:block">
                {userInfo.name.split(' ')[0]}
              </span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default MobileHeader;