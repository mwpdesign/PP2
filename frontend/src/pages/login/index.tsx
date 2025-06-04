import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoading: authLoading, error: authError, isAuthenticated, user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [debugLogs, setDebugLogs] = useState<string[]>([]);

  // Debug logging function
  const addDebugLog = (message: string) => {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}`;
    console.log(`[LOGIN DEBUG] ${logMessage}`);
    setDebugLogs(prev => [...prev, logMessage]);
  };

  // Monitor authentication state changes
  useEffect(() => {
    addDebugLog(`Auth state changed - isAuthenticated: ${isAuthenticated}, user: ${user?.email || 'null'}`);

    if (isAuthenticated && user) {
      const destination = location.state?.from?.pathname || '/dashboard';
      addDebugLog(`User authenticated, navigating to: ${destination}`);
      navigate(destination, { replace: true });
    }
  }, [isAuthenticated, user, navigate, location.state]);

  // Monitor loading states
  useEffect(() => {
    addDebugLog(`Loading states - local: ${isLoading}, auth: ${authLoading}`);
  }, [isLoading, authLoading]);

  // Monitor errors
  useEffect(() => {
    if (authError) {
      addDebugLog(`Auth error: ${authError}`);
    }
    if (error) {
      addDebugLog(`Local error: ${error}`);
    }
  }, [authError, error]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    addDebugLog('=== LOGIN FORM SUBMISSION STARTED ===');
    addDebugLog(`Form data - Email: "${email}", Password length: ${password.length}`);

    setIsLoading(true);
    setError(null);
    addDebugLog('Local loading state set to true, error cleared');

    try {
      addDebugLog('Calling AuthContext.login()...');
      await login(email, password);
      addDebugLog('AuthContext.login() completed successfully');

      // Navigation will be handled by the useEffect above
      addDebugLog('Login successful, waiting for auth state update...');

    } catch (error: any) {
      addDebugLog('=== LOGIN ERROR CAUGHT ===');
      addDebugLog(`Error type: ${typeof error}`);
      addDebugLog(`Error object: ${JSON.stringify(error, null, 2)}`);

      console.error('Login failed:', error);

      let errorMessage = 'Login failed';
      if (error?.detail) {
        errorMessage = typeof error.detail === 'string' ? error.detail : JSON.stringify(error.detail);
      } else if (error?.message) {
        errorMessage = error.message;
      }

      addDebugLog(`Setting error message: ${errorMessage}`);
      setError(errorMessage);
    } finally {
      addDebugLog('Setting local loading state to false');
      setIsLoading(false);
      addDebugLog('=== LOGIN FORM SUBMISSION COMPLETED ===');
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEmail = e.target.value;
    setEmail(newEmail);
    addDebugLog(`Email field updated: "${newEmail}"`);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    addDebugLog(`Password field updated (length: ${newPassword.length})`);
  };

  const fillTestCredentials = (userType: 'admin' | 'doctor' | 'ivr') => {
    const credentials = {
      admin: { email: 'admin@healthcare.local', password: 'admin123' },
      doctor: { email: 'doctor@healthcare.local', password: 'doctor123' },
      ivr: { email: 'ivr@healthcare.local', password: 'ivr123' }
    };

    const creds = credentials[userType];
    setEmail(creds.email);
    setPassword(creds.password);
    addDebugLog(`Test credentials filled for ${userType}: ${creds.email}`);
  };

  const clearDebugLogs = () => {
    setDebugLogs([]);
    addDebugLog('Debug logs cleared');
  };

  return (
    <div className="min-h-screen bg-[#2d3748] flex flex-col items-center justify-center py-16 px-4 sm:px-6 lg:px-8">
      <div className="w-[440px] bg-white rounded-xl shadow-2xl p-8 mb-8">
        {/* Logo and Title Section */}
        <div className="text-center mb-8">
          <img
            className="mx-auto h-20 w-auto mb-4"
            src="/logo.png"
            alt="Healthcare IVR Platform"
          />
          <h2 className="text-2xl font-bold text-[#375788] mb-1">
            Wound Care Management Portal
          </h2>
          <p className="text-base text-gray-600">
            Secure access to wound care management
          </p>
        </div>

        {/* Development Credentials Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-6">
          <h4 className="text-sm font-medium text-blue-800 mb-2">Development Credentials:</h4>
          <div className="text-xs text-blue-700 space-y-1">
            <div className="flex justify-between items-center">
              <span><strong>Admin:</strong> admin@healthcare.local / admin123</span>
              <button
                type="button"
                onClick={() => fillTestCredentials('admin')}
                className="text-xs bg-blue-100 hover:bg-blue-200 px-2 py-1 rounded"
              >
                Fill
              </button>
            </div>
            <div className="flex justify-between items-center">
              <span><strong>Doctor:</strong> doctor@healthcare.local / doctor123</span>
              <button
                type="button"
                onClick={() => fillTestCredentials('doctor')}
                className="text-xs bg-blue-100 hover:bg-blue-200 px-2 py-1 rounded"
              >
                Fill
              </button>
            </div>
            <div className="flex justify-between items-center">
              <span><strong>IVR:</strong> ivr@healthcare.local / ivr123</span>
              <button
                type="button"
                onClick={() => fillTestCredentials('ivr')}
                className="text-xs bg-blue-100 hover:bg-blue-200 px-2 py-1 rounded"
              >
                Fill
              </button>
            </div>
          </div>
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
                value={email}
                onChange={handleEmailChange}
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
                value={password}
                onChange={handlePasswordChange}
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-[#375788] focus:border-[#375788] text-sm"
                placeholder="Enter your password"
              />
            </div>
          </div>

          <div>
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
          </div>
        </form>

        {/* Copyright in Card */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            © {new Date().getFullYear()} Healthcare IVR Platform. All rights reserved.
          </p>
        </div>
      </div>

      {/* Debug Panel */}
      <div className="w-[440px] bg-gray-900 text-white rounded-xl p-4 mb-4">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-sm font-medium">Login Debug Trace</h3>
          <button
            onClick={clearDebugLogs}
            className="text-xs bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded"
          >
            Clear
          </button>
        </div>
        <div className="max-h-40 overflow-y-auto text-xs font-mono space-y-1">
          {debugLogs.length === 0 ? (
            <div className="text-gray-400">No debug logs yet...</div>
          ) : (
            debugLogs.map((log, index) => (
              <div key={index} className="text-green-400">
                {log}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Auth State Debug */}
      <div className="w-[440px] bg-gray-800 text-white rounded-xl p-4 mb-4">
        <h3 className="text-sm font-medium mb-3">Authentication State</h3>
        <div className="text-xs font-mono space-y-1">
          <div>isAuthenticated: <span className={isAuthenticated ? 'text-green-400' : 'text-red-400'}>{String(isAuthenticated)}</span></div>
          <div>isLoading (local): <span className={isLoading ? 'text-yellow-400' : 'text-gray-400'}>{String(isLoading)}</span></div>
          <div>isLoading (auth): <span className={authLoading ? 'text-yellow-400' : 'text-gray-400'}>{String(authLoading)}</span></div>
          <div>user: <span className="text-blue-400">{user?.email || 'null'}</span></div>
          <div>error (local): <span className="text-red-400">{error || 'null'}</span></div>
          <div>error (auth): <span className="text-red-400">{authError || 'null'}</span></div>
          <div>current path: <span className="text-purple-400">{location.pathname}</span></div>
          <div>redirect from: <span className="text-purple-400">{location.state?.from?.pathname || 'null'}</span></div>
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