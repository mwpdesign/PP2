import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoading: authLoading, error: authError } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    const form = e.target as HTMLFormElement;
    const email = (form.elements.namedItem('email') as HTMLInputElement).value;
    const password = (form.elements.namedItem('password') as HTMLInputElement).value;
    
    try {
      await login({ email, password });
      const destination = location.state?.from?.pathname || '/dashboard';
      navigate(destination, { replace: true });
    } catch (error) {
      console.error('Login failed:', error);
      setError('Invalid credentials. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdminLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await login({ email: 'admin@test.com', password: 'demo123' });
    } catch (error) {
      console.error('Admin login failed:', error);
      setError('Admin login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#2d3748] flex flex-col items-center justify-center py-16 px-4 sm:px-6 lg:px-8">
      <div className="w-[440px] bg-white rounded-xl shadow-2xl p-8 mb-8">
        {/* Logo and Title Section */}
        <div className="text-center mb-8">
          <img
            className="mx-auto h-20 w-auto mb-4"
            src="/logo2.png"
            alt="Healthcare IVR Platform"
          />
          <h2 className="text-2xl font-bold text-[#375788] mb-1">
            Wound Care Management Portal
          </h2>
          <p className="text-base text-gray-600">
            Secure access to wound care management
          </p>
        </div>

        {/* Trust Indicators */}
        <div className="flex items-center justify-center space-x-3 text-sm text-gray-500 mb-6">
          <span className="flex items-center">
            <svg className="h-4 w-4 text-green-500 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            HIPAA Compliant
          </span>
          <span>•</span>
          <span className="flex items-center">
            <svg className="h-4 w-4 text-green-500 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Secure Access
          </span>
        </div>

        {/* Error Alert */}
        {(error || authError) && (
          <div className="rounded-md bg-red-50 p-4 border border-red-100 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  {error || authError}
                </h3>
              </div>
            </div>
          </div>
        )}

        {/* Login Form */}
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-5">
            <div>
              <label htmlFor="email-address" className="block text-sm font-medium text-gray-700 mb-1">
                Email address
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-[#375788] focus:border-[#375788] text-sm"
                placeholder="Enter your email"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-[#375788] focus:border-[#375788] text-sm"
                placeholder="Enter your password"
              />
            </div>
          </div>

          <div className="space-y-3">
            <button
              type="submit"
              disabled={isLoading || authLoading}
              className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#375788] hover:bg-[#2a4266] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#375788] disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {isLoading || authLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Signing in...
                </div>
              ) : (
                'Sign in to Portal'
              )}
            </button>

            {/* Quick Admin Access Button */}
            <button
              type="button"
              onClick={handleAdminLogin}
              disabled={isLoading || authLoading}
              className="w-full flex justify-center py-2.5 px-4 border-2 border-[#375788] rounded-md shadow-sm text-sm font-medium text-[#375788] bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#375788] disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {isLoading || authLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#375788] mr-2"></div>
                  Accessing Admin...
                </div>
              ) : (
                'Continue as Admin'
              )}
            </button>
          </div>
        </form>

        {/* Copyright in Card */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            © {new Date().getFullYear()} Healthcare IVR Platform. All rights reserved.
          </p>
        </div>
      </div>

      {/* Compliance Information Below Card */}
      <div className="w-[440px] flex justify-between text-sm text-white/90">
        <span className="flex items-center">
          <svg className="h-4 w-4 mr-1.5 text-white/90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          HIPAA Compliant
        </span>
        <span className="flex items-center">
          <svg className="h-4 w-4 mr-1.5 text-white/90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          SOC 2 Type II
        </span>
        <span className="flex items-center">
          <svg className="h-4 w-4 mr-1.5 text-white/90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8V7a4 4 0 00-8 0v4h8z" />
          </svg>
          256-bit Secure
        </span>
      </div>
    </div>
  );
} 