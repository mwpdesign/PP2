import React, { useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useMobileNavigation } from '../../../contexts/MobileNavigationContext';

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick?: () => void;
}

interface MobileMenuProps {
  navigation: NavigationItem[];
  userInfo?: {
    name: string;
    role: string;
    avatar?: string;
  };
}

const MobileMenu: React.FC<MobileMenuProps> = ({ navigation, userInfo }) => {
  const { isMobileMenuOpen, closeMobileMenu } = useMobileNavigation();
  const location = useLocation();
  const previousPathname = useRef(location.pathname);

  // Close menu on route change - but only when route actually changes, not on initial render
  useEffect(() => {
    if (previousPathname.current !== location.pathname) {
      closeMobileMenu();
      previousPathname.current = location.pathname;
    }
  }, [location.pathname, closeMobileMenu]);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  if (!isMobileMenuOpen) {
    return null;
  }

  const handleBackdropClick = () => {
    closeMobileMenu();
  };

  const handleCloseClick = () => {
    closeMobileMenu();
  };

  return (
    <div className="md:hidden fixed inset-0 z-[100]">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity z-[101]"
        onClick={handleBackdropClick}
      />
      
      {/* Menu panel - slides from left */}
      <div className="fixed top-0 left-0 h-full w-80 max-w-[85vw] bg-[#334155] text-white transform transition-transform duration-300 ease-in-out translate-x-0 z-[102]">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-700">
            <div className="flex items-center">
              <img 
                src="/logo2.png" 
                alt="Healthcare IVR" 
                className="h-10 w-auto"
                onError={(e) => {
                  const target = e.target as HTMLElement;
                  target.style.display = 'none';
                  const parent = target.parentElement;
                  if (parent) {
                    parent.innerHTML = '<span class="text-white text-lg font-semibold">Clear Health Pass</span>';
                  }
                }}
              />
            </div>
            <button
              onClick={handleCloseClick}
              className="p-2 rounded-lg hover:bg-slate-600 transition-colors focus:outline-none focus:ring-2 focus:ring-[#375788]"
              aria-label="Close navigation menu"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 pt-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = item.href !== '#' && location.pathname.startsWith(item.href);
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={item.onClick}
                  className={`
                    flex items-center px-4 py-4 text-base font-medium rounded-lg transition-colors
                    focus:outline-none focus:ring-2 focus:ring-[#375788] focus:ring-offset-2 focus:ring-offset-slate-900
                    ${isActive 
                      ? 'bg-[#375788] text-white' 
                      : 'text-slate-300 hover:bg-slate-600 hover:text-white'}
                  `}
                >
                  <item.icon className="mr-4 h-6 w-6 flex-shrink-0" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* User info */}
          {userInfo && (
            <div className="px-4 pb-4">
              <div className="border-t border-slate-700 pt-4 mt-4">
                <div className="flex items-center px-4">
                  <div className="h-12 w-12 rounded-full bg-slate-600 flex items-center justify-center">
                    <span className="text-white font-medium text-lg">
                      {userInfo.avatar || userInfo.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div className="ml-3">
                    <p className="text-base font-medium text-white">{userInfo.name}</p>
                    <p className="text-sm text-slate-400">{userInfo.role}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MobileMenu; 