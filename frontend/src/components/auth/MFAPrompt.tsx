import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

interface LocationState {
  email: string;
  session: string;
  challengeName: string;
}

export const MFAPrompt: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { verifyMFA, setupTOTP, verifyTOTPSetup } = useAuth();
  
  const [mfaCode, setMfaCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [totpQRCode, setTotpQRCode] = useState<string | null>(null);
  const [isSettingUpTOTP, setIsSettingUpTOTP] = useState(false);
  
  const state = location.state as LocationState;
  
  useEffect(() => {
    if (!state?.email || !state?.session || !state?.challengeName) {
      navigate('/login');
    }
  }, [state, navigate]);

  const handleMFASubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mfaCode.trim()) {
      setError('Please enter your verification code');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      await verifyMFA(
        state.email,
        state.session,
        mfaCode,
        state.challengeName
      );
      navigate('/dashboard');
    } catch (error: any) {
      setError(error.message || 'Failed to verify MFA code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetupTOTP = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const { secretCode } = await setupTOTP();
      setTotpQRCode(secretCode);
      setIsSettingUpTOTP(true);
    } catch (error: any) {
      setError(error.message || 'Failed to setup TOTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyTOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mfaCode.trim()) {
      setError('Please enter your verification code');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      await verifyTOTPSetup(mfaCode);
      navigate('/dashboard');
    } catch (error: any) {
      setError(error.message || 'Failed to verify TOTP code');
    } finally {
      setIsLoading(false);
    }
  };

  if (!state) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {isSettingUpTOTP
              ? 'Set Up Two-Factor Authentication'
              : 'Enter Verification Code'}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {isSettingUpTOTP
              ? 'Scan the QR code with your authenticator app'
              : 'Please enter the verification code sent to your device'}
          </p>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="text-sm text-red-700">{error}</div>
          </div>
        )}

        {isSettingUpTOTP && totpQRCode && (
          <div className="flex justify-center">
            <img
              src={`data:image/png;base64,${totpQRCode}`}
              alt="TOTP QR Code"
              className="w-64 h-64"
            />
          </div>
        )}

        <form
          className="mt-8 space-y-6"
          onSubmit={isSettingUpTOTP ? handleVerifyTOTP : handleMFASubmit}
        >
          <div>
            <label htmlFor="mfa-code" className="sr-only">
              Verification Code
            </label>
            <input
              id="mfa-code"
              name="mfaCode"
              type="text"
              required
              className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
              placeholder="Enter verification code"
              value={mfaCode}
              onChange={(e) => setMfaCode(e.target.value)}
              maxLength={6}
              pattern="[0-9]*"
              inputMode="numeric"
              autoComplete="one-time-code"
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white ${
                isLoading
                  ? 'bg-blue-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
              }`}
            >
              {isLoading ? (
                <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                  <svg
                    className="animate-spin h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                </span>
              ) : null}
              {isLoading
                ? 'Verifying...'
                : isSettingUpTOTP
                ? 'Verify and Enable TOTP'
                : 'Verify Code'}
            </button>
          </div>

          {!isSettingUpTOTP && state.challengeName === 'SMS_MFA' && (
            <div className="text-center">
              <button
                type="button"
                onClick={handleSetupTOTP}
                className="text-sm font-medium text-blue-600 hover:text-blue-500"
              >
                Switch to Authenticator App
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}; 