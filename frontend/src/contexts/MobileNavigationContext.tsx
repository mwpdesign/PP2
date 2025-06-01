import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

interface MobileNavigationContextType {
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
  isMobile: boolean;
  toggleMobileMenu: () => void;
  closeMobileMenu: () => void;
}

const MobileNavigationContext = createContext<MobileNavigationContextType | undefined>(undefined);

export const useMobileNavigation = () => {
  const context = useContext(MobileNavigationContext);
  if (context === undefined) {
    throw new Error('useMobileNavigation must be used within a MobileNavigationProvider');
  }
  return context;
};

interface MobileNavigationProviderProps {
  children: React.ReactNode;
}

export const MobileNavigationProvider: React.FC<MobileNavigationProviderProps> = ({ children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const lastToggleTime = useRef(0);

  useEffect(() => {
    const checkIsMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
    };

    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);

    return () => {
      window.removeEventListener('resize', checkIsMobile);
    };
  }, []);

  // Close mobile menu when switching to desktop
  useEffect(() => {
    if (!isMobile) {
      setIsMobileMenuOpen(false);
    }
  }, [isMobile]);

  const toggleMobileMenu = () => {
    const now = Date.now();
    if (now - lastToggleTime.current < 100) {
      return;
    }
    lastToggleTime.current = now;
    
    setIsMobileMenuOpen(prev => !prev);
  };

  const closeMobileMenu = () => {
    // Add a small delay to prevent immediate closing after opening
    if (isMobileMenuOpen) {
      const timeSinceToggle = Date.now() - lastToggleTime.current;
      if (timeSinceToggle < 200) {
        setTimeout(() => {
          setIsMobileMenuOpen(false);
        }, 200 - timeSinceToggle);
        return;
      }
    }
    setIsMobileMenuOpen(false);
  };

  const value: MobileNavigationContextType = {
    isMobileMenuOpen,
    setIsMobileMenuOpen,
    isMobile,
    toggleMobileMenu,
    closeMobileMenu,
  };

  return (
    <MobileNavigationContext.Provider value={value}>
      {children}
    </MobileNavigationContext.Provider>
  );
}; 