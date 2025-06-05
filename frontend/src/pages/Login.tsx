import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoginForm from '../components/auth/LoginForm';

export default function Login() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  const handleLoginSuccess = () => {
    // Navigation will be handled by the auth context
    // This is just for any additional success handling
    console.log('Login successful');
  };

  return (
    <div className="min-h-screen bg-slate-600 flex flex-col">
            {/* Header with branding - 1.5x larger */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-24">
                        <div className="flex items-center">
              <div>
                <h1 className="text-2xl font-semibold text-slate-900">
                  Wound Care Portal
                </h1>
                <p className="text-sm text-slate-500">
                  Professional Wound Care Management
                </p>
              </div>
            </div>

            {/* Trust indicators */}
            <div className="hidden sm:flex items-center space-x-6 text-xs text-slate-500">
              <div className="flex items-center space-x-1">
                <svg className="h-4 w-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span>HIPAA Compliant</span>
              </div>
              <div className="flex items-center space-x-1">
                <svg className="h-4 w-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span>SOC 2 Type II</span>
              </div>
              <div className="flex items-center space-x-1">
                <svg className="h-4 w-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span>256-bit Encryption</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content - Professional spacing */}
      <div className="flex-1 flex items-center justify-center py-8 px-4 sm:px-6 lg:px-8 -mt-5">
        <div className="w-full max-w-md">
                                        {/* Clean Logo Placement */}
          <div className="mb-16 text-center -mt-5">
            <img
              src="/logo2.png"
              alt="Clear Health Pass"
              className="h-36 w-auto object-contain mx-auto filter drop-shadow-lg"
            />
          </div>

          <LoginForm onSuccess={handleLoginSuccess} />
        </div>
      </div>

      {/* Footer - Updated branding */}
      <div className="bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center space-x-6 text-xs text-slate-500">
              <span>© 2025 Clear Health Pass</span>
              <a href="#" className="hover:text-slate-700 transition-colors duration-200">
                Privacy Policy
              </a>
              <a href="#" className="hover:text-slate-700 transition-colors duration-200">
                Terms of Service
              </a>
              <a href="#" className="hover:text-slate-700 transition-colors duration-200">
                Support
              </a>
            </div>

            <div className="flex items-center space-x-4 text-xs text-slate-500">
              <span>Need help?</span>
              <a
                href="mailto:support@clearhealthpass.com"
                className="text-slate-600 hover:text-slate-800 font-medium transition-colors duration-200"
              >
                Contact Support
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Accessibility announcement for screen readers */}
      <div className="sr-only" aria-live="polite" id="login-status">
        Wound Care Portal login page loaded. Use the form to sign in to your account.
      </div>
    </div>
  );
}