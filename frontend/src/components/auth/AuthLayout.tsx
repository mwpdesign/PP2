import React from 'react';
import { Activity } from 'lucide-react';
import { TrustIndicators } from './TrustIndicators';

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ title, subtitle, children }) => {
  const currentYear = new Date().getFullYear();

  return (
    <div className="min-h-screen bg-[#2C3E50] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-xl shadow-2xl p-8">
          {/* Branding Section */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-full flex justify-center mb-6">
              <img
                src="/logo.png"
                alt="Wound Care Portal"
                className="h-32 w-auto"
              />
            </div>
            <h2 className="text-2xl font-bold text-[#375788] text-center">{title}</h2>
            <p className="mt-2 text-sm text-gray-600 text-center max-w-sm">{subtitle}</p>
          </div>

          {/* Main Content */}
          <div className="mb-6">
            {children}
          </div>

          {/* Footer with Trust Indicators */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex justify-center">
              <TrustIndicators />
            </div>
            <div className="text-center mt-4">
              <p className="text-xs text-gray-500">
                © {currentYear} Wound Care Portal
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 