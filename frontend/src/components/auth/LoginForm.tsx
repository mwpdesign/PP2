import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import ProgressiveInput from './ProgressiveInput';
import { AuthError } from '../../types/auth';

interface LoginFormProps {
  onSuccess?: () => void;
}

type LoginStep = 'email' | 'password' | 'authenticating' | 'success';

interface FormData {
  email: string;
  password: string;
  rememberDevice: boolean;
}

interface ValidationErrors {
  email?: string;
  password?: string;
  general?: string;
}

export default function LoginForm({ onSuccess }: LoginFormProps) {
  const { login, isLoading: authLoading, error: authError } = useAuth();

  // Form state
  const [currentStep, setCurrentStep] = useState<LoginStep>('email');
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    rememberDevice: false
  });
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isValidating, setIsValidating] = useState(false);

  // Clear errors when form data changes
  useEffect(() => {
    if (errors.email && formData.email) {
      setErrors(prev => ({ ...prev, email: undefined }));
    }
    if (errors.password && formData.password) {
      setErrors(prev => ({ ...prev, password: undefined }));
    }
  }, [formData.email, formData.password, errors.email, errors.password]);

  // Handle auth errors
  useEffect(() => {
    if (authError) {
      setErrors(prev => ({ ...prev, general: authError }));
      // Return to appropriate step based on error
      if (authError.toLowerCase().includes('email') || authError.toLowerCase().includes('user')) {
        setCurrentStep('email');
      } else {
        setCurrentStep('password');
      }
    }
  }, [authError]);

  const validateEmail = (email: string): string | undefined => {
    if (!email.trim()) {
      return 'Email address is required for secure access';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return 'Please enter a valid email address';
    }

    // Healthcare domain validation (optional enhancement)
    if (email.length > 254) {
      return 'Email address is too long';
    }

    return undefined;
  };

  const validatePassword = (password: string): string | undefined => {
    if (!password) {
      return 'Password is required to access your account';
    }

    if (password.length < 6) {
      return 'Password must be at least 6 characters for security';
    }

    return undefined;
  };

  const handleEmailNext = async () => {
    const emailError = validateEmail(formData.email);
    if (emailError) {
      setErrors(prev => ({ ...prev, email: emailError }));
      return;
    }

    setIsValidating(true);
    setErrors({});

    // Simulate email validation delay for professional feel
    await new Promise(resolve => setTimeout(resolve, 300));

    setIsValidating(false);
    setCurrentStep('password');
  };

  const handlePasswordBack = () => {
    setCurrentStep('email');
    setErrors({});
  };

  const handleSubmit = async () => {
    const passwordError = validatePassword(formData.password);
    if (passwordError) {
      setErrors(prev => ({ ...prev, password: passwordError }));
      return;
    }

    setCurrentStep('authenticating');
    setErrors({});

    try {
      await login(formData.email, formData.password);
      setCurrentStep('success');

      // Handle remember device functionality
      if (formData.rememberDevice) {
        localStorage.setItem('rememberDevice', 'true');
        localStorage.setItem('lastEmail', formData.email);
      }

      onSuccess?.();
    } catch (error: any) {
      // Error handling is managed by useEffect above
      console.error('Login failed:', error);
    }
  };

  const handleQuickFill = (userType: 'admin' | 'doctor' | 'distributor') => {
    const credentials = {
      admin: { email: 'admin@healthcare.local', password: 'admin123' },
      doctor: { email: 'doctor@healthcare.local', password: 'doctor123' },
      distributor: { email: 'distributor@healthcare.local', password: 'distributor123' }
    };

    const creds = credentials[userType];
    setFormData(prev => ({ ...prev, ...creds }));
    setCurrentStep('password');
  };

  const renderEmailStep = () => (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-semibold text-slate-800">
          Welcome Back
        </h2>
        <p className="text-slate-600">
          Enter your email to access the <strong>wound care portal</strong>
        </p>
      </div>

      <ProgressiveInput
        type="email"
        value={formData.email}
        onChange={(value) => setFormData(prev => ({ ...prev, email: value }))}
        onNext={handleEmailNext}
        error={errors.email}
        isLoading={isValidating}
        autoFocus
        placeholder="your.email@healthcare.com"
        label="Email Address"
      />

      <button
        onClick={handleEmailNext}
        disabled={!formData.email.trim() || isValidating}
        className="w-full bg-slate-600 hover:bg-slate-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
      >
        {isValidating ? (
          <div className="flex items-center justify-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
            <span>Validating...</span>
          </div>
        ) : (
          'Continue'
        )}
      </button>

      {/* Development Quick Fill */}
      <div className="border-t border-slate-200 pt-4">
        <p className="text-xs text-slate-500 mb-3 text-center">Development Quick Access</p>
        <div className="grid grid-cols-3 gap-2">
          {[
            { key: 'admin', label: 'Admin' },
            { key: 'doctor', label: 'Doctor' },
            { key: 'distributor', label: 'Distributor' }
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => handleQuickFill(key as any)}
              className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 px-3 rounded transition-colors duration-200"
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const renderPasswordStep = () => (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <button
          onClick={handlePasswordBack}
          className="inline-flex items-center text-sm text-slate-600 hover:text-slate-800 transition-colors duration-200"
        >
          <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          {formData.email}
        </button>
        <h2 className="text-2xl font-semibold text-slate-800">
          Enter Password
        </h2>
        <p className="text-slate-600">
          Please enter your password to continue
        </p>
      </div>

      <ProgressiveInput
        type="password"
        value={formData.password}
        onChange={(value) => setFormData(prev => ({ ...prev, password: value }))}
        onNext={handleSubmit}
        onBack={handlePasswordBack}
        error={errors.password}
        isLoading={authLoading}
        autoFocus
        placeholder="Enter your password"
        label="Password"
      />

      <div className="flex items-center">
        <input
          id="remember-device"
          type="checkbox"
          checked={formData.rememberDevice}
          onChange={(e) => setFormData(prev => ({ ...prev, rememberDevice: e.target.checked }))}
          className="h-4 w-4 text-slate-600 focus:ring-slate-500 border-slate-300 rounded"
        />
        <label htmlFor="remember-device" className="ml-2 text-sm text-slate-700">
          Remember this device for 30 days
        </label>
      </div>

      <button
        onClick={handleSubmit}
        disabled={!formData.password || authLoading}
        className="w-full bg-slate-600 hover:bg-slate-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
      >
        {authLoading ? (
          <div className="flex items-center justify-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
            <span>Authenticating...</span>
          </div>
        ) : (
          'Sign In Securely'
        )}
      </button>
    </div>
  );

  const renderAuthenticatingStep = () => (
    <div className="space-y-6 text-center">
      <div className="space-y-4">
        <div className="mx-auto w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-3 border-slate-300 border-t-slate-600"></div>
        </div>
        <h2 className="text-2xl font-semibold text-slate-800">
          Authenticating
        </h2>
        <p className="text-slate-600">
          Verifying your credentials securely...
        </p>
      </div>
    </div>
  );

  const renderSuccessStep = () => (
    <div className="space-y-6 text-center">
      <div className="space-y-4">
        <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
          <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-semibold text-slate-800">
          Welcome Back
        </h2>
        <p className="text-slate-600">
          Authentication successful. Redirecting to your dashboard...
        </p>
      </div>
    </div>
  );

  return (
    <div className="w-full max-w-md mx-auto">
      {/* General error display */}
      {errors.general && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start space-x-3">
            <svg className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div>
              <h3 className="text-sm font-medium text-red-800">Authentication Error</h3>
              <p className="text-sm text-red-700 mt-1">{errors.general}</p>
            </div>
          </div>
        </div>
      )}

      {/* Step content */}
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200/50 p-8 backdrop-blur-sm">
        {currentStep === 'email' && renderEmailStep()}
        {currentStep === 'password' && renderPasswordStep()}
        {currentStep === 'authenticating' && renderAuthenticatingStep()}
        {currentStep === 'success' && renderSuccessStep()}
      </div>

      {/* Progress indicator */}
      <div className="mt-6 flex justify-center space-x-2">
        <div className={`h-2 w-8 rounded-full transition-colors duration-300 ${
          currentStep === 'email' ? 'bg-white' : 'bg-slate-400'
        }`} />
        <div className={`h-2 w-8 rounded-full transition-colors duration-300 ${
          ['password', 'authenticating', 'success'].includes(currentStep) ? 'bg-white' : 'bg-slate-400'
        }`} />
      </div>
    </div>
  );
}