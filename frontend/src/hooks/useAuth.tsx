import React, { useState, useEffect, useCallback, createContext, useContext, ReactNode, FC } from 'react';
import { cognitoService, AuthResponse, MFAResponse } from '../services/cognito';

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: any | null;
  hasPhiAccess: boolean;
  deviceTrusted: boolean;
  sessionTimeoutAt: Date | null;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<AuthResponse | MFAResponse>;
  logout: () => Promise<void>;
  verifyMFA: (email: string, session: string, mfaCode: string, challengeName: string) => Promise<AuthResponse>;
  setupTOTP: () => Promise<{ secretCode: string }>;
  verifyTOTPSetup: (totpCode: string) => Promise<{ message: string }>;
  forgotPassword: (email: string) => Promise<{ message: string }>;
  resetPassword: (email: string, code: string, newPassword: string) => Promise<{ message: string }>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes in milliseconds
const TOKEN_REFRESH_INTERVAL = 45 * 60 * 1000; // 45 minutes in milliseconds
const TIMEOUT_CHECK_INTERVAL = 1000; // 1 second in milliseconds

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: FC<AuthProviderProps> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: true,
    user: null,
    hasPhiAccess: false,
    deviceTrusted: false,
    sessionTimeoutAt: null,
  });

  const resetState = useCallback(() => {
    setState({
      isAuthenticated: false,
      isLoading: false,
      user: null,
      hasPhiAccess: false,
      deviceTrusted: false,
      sessionTimeoutAt: null,
    });
  }, []);

  const refreshSession = useCallback(async () => {
    try {
      const { valid, user, phiAccess, deviceTrusted } = await cognitoService.verifyToken();
      if (valid) {
        setState(prev => ({
          ...prev,
          isAuthenticated: true,
          isLoading: false,
          user,
          hasPhiAccess: phiAccess,
          deviceTrusted,
          sessionTimeoutAt: new Date(Date.now() + SESSION_TIMEOUT),
        }));
      } else {
        resetState();
      }
    } catch (error) {
      resetState();
    }
  }, [resetState]);

  const login = async (email: string, password: string) => {
    const response = await cognitoService.login(email, password);
    if ('accessToken' in response) {
      await refreshSession();
    }
    return response;
  };

  const logout = async () => {
    try {
      // Clear local storage, cookies, etc.
      localStorage.removeItem('refreshToken');
      resetState();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const verifyMFA = async (email: string, session: string, mfaCode: string, challengeName: string) => {
    const response = await cognitoService.verifyMFA(email, session, mfaCode, challengeName);
    await refreshSession();
    return response;
  };

  // Check session timeout
  useEffect(() => {
    if (!state.isAuthenticated || !state.sessionTimeoutAt) return;

    const checkTimeout = () => {
      if (state.sessionTimeoutAt && new Date() >= state.sessionTimeoutAt) {
        logout();
      }
    };

    const timeoutInterval = setInterval(checkTimeout, TIMEOUT_CHECK_INTERVAL);
    return () => clearInterval(timeoutInterval);
  }, [state.isAuthenticated, state.sessionTimeoutAt]);

  // Refresh token periodically
  useEffect(() => {
    if (!state.isAuthenticated) return;

    const refreshInterval = setInterval(refreshSession, TOKEN_REFRESH_INTERVAL);
    return () => clearInterval(refreshInterval);
  }, [state.isAuthenticated, refreshSession]);

  // Initial authentication check
  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  const value = {
    ...state,
    login,
    logout,
    verifyMFA,
    setupTOTP: cognitoService.setupTOTP.bind(cognitoService),
    verifyTOTPSetup: cognitoService.verifyTOTPSetup.bind(cognitoService),
    forgotPassword: cognitoService.forgotPassword.bind(cognitoService),
    resetPassword: cognitoService.resetPassword.bind(cognitoService),
    refreshSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 