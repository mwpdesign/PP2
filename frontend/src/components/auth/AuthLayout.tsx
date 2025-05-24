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
      <div className="max-w-md w-full space-y-8">
        <div className="flex flex-col items-start">
          <img
            src="/logo2.png"
            alt="Healthcare IVR Platform"
            className="h-36 w-auto mb-8"
          />
          <h2 className="text-3xl font-extrabold text-white tracking-tight">{title}</h2>
          <p className="mt-2 text-sm text-gray-300">{subtitle}</p>
        </div>

        <div className="bg-white rounded-xl shadow-2xl p-8">
          {children}
        </div>

        <div className="mt-8 space-y-6">
          <TrustIndicators />
          
          <div className="text-center">
            <p className="text-sm text-gray-300">
              © {currentYear} Healthcare IVR Platform. All rights reserved.
            </p>
            <p className="mt-1 text-xs text-gray-400">
              HIPAA Compliant • SOC 2 Type II Certified • 256-bit Encryption
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}; 