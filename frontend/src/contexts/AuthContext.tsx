import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { UserRole } from '../types/auth';
import api from '../services/api';
import CryptoJS from 'crypto-js';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  territory?: string;
}

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  clearAuth: () => void;
  isLoading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SECRET_KEY = import.meta.env.VITE_JWT_SECRET || "healthcare-ivr-development-secret-key-2025";

// Mock user data for testing
const mockUsers: Record<string, User> = {
  'doctor@example.com': {
    id: '1',
    email: 'doctor@example.com',
    firstName: 'John',
    lastName: 'Doe',
    role: 'doctor' as UserRole,
    territory: 'US-East',
  },
  'admin@example.com': {
    id: '2',
    email: 'admin@example.com',
    firstName: 'Admin',
    lastName: 'User',
    role: 'admin' as UserRole,
    territory: 'US-All',
  },
};

// Mock JWT token generation (for development only)
const generateMockJWT = (user: User) => {
  // Create a proper JWT token structure
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  };

  const payload = {
    sub: user.id,
    email: user.email,
    given_name: user.firstName,
    family_name: user.lastName,
    role: user.role,
    territory: user.territory,
    email_verified: "true",
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours expiration
  };

  // Base64Url encode the parts
  const encodeSegment = (segment: any) => {
    const str = JSON.stringify(segment);
    const base64 = btoa(str);
    return base64
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  };

  const encodedHeader = encodeSegment(header);
  const encodedPayload = encodeSegment(payload);

  // Create a proper HMAC signature using the SECRET_KEY
  const signatureInput = `${encodedHeader}.${encodedPayload}`;
  const signature = CryptoJS.HmacSHA256(signatureInput, SECRET_KEY)
    .toString(CryptoJS.enc.Base64)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  return `${encodedHeader}.${encodedPayload}.${signature}`;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);
  
  // Initialize state from localStorage
  const [authState, setAuthState] = useState<AuthState>(() => {
    const storedAuth = localStorage.getItem('auth');
    if (storedAuth) {
      try {
        return JSON.parse(storedAuth);
      } catch (err) {
        console.error('Failed to parse stored auth:', err);
        return {
          isAuthenticated: false,
          user: null,
          token: null
        };
      }
    }
    return {
      isAuthenticated: false,
      user: null,
      token: null
    };
  });

  // Update localStorage whenever auth state changes
  useEffect(() => {
    if (authState.isAuthenticated && authState.user && authState.token) {
      localStorage.setItem('auth', JSON.stringify(authState));
    } else {
      localStorage.removeItem('auth');
    }
  }, [authState]);

  // Clear all auth data from storage
  const clearAuth = useCallback(() => {
    // Clear localStorage
    localStorage.clear();
    
    // Clear sessionStorage
    sessionStorage.clear();
    
    // Clear cookies
    document.cookie.split(";").forEach((c) => {
      document.cookie = c
        .replace(/^ +/, "")
        .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });
    
    // Reset state
    setAuthState({
      isAuthenticated: false,
      user: null,
      token: null
    });
    setError(null);
    setIsLoading(false);
  }, []);

  const handleAuthError = useCallback(() => {
    if (!isRedirecting) {
      setIsRedirecting(true);
      clearAuth();
      navigate('/login', { replace: true });
      
      // Reset redirect flag after navigation
      setTimeout(() => {
        setIsRedirecting(false);
      }, 1000);
    }
  }, [clearAuth, navigate, isRedirecting]);

  // Listen for auth errors from API client
  useEffect(() => {
    const handleAuthEvent = (event: CustomEvent) => {
      if (event.detail?.status === 401) {
        handleAuthError();
      }
    };

    window.addEventListener('auth:error', handleAuthEvent as EventListener);
    return () => {
      window.removeEventListener('auth:error', handleAuthEvent as EventListener);
    };
  }, [handleAuthError]);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // In development, use mock authentication
      // In production, this would be a real API call
      const mockUser = mockUsers[email.toLowerCase()];
      if (!mockUser || password !== 'password') {
        throw new Error('Invalid credentials');
      }
      
      // Generate a mock JWT token
      const token = generateMockJWT(mockUser);
      
      setAuthState({
        isAuthenticated: true,
        user: mockUser,
        token
      });
      
      // Configure API client with the new token
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
    } catch (err) {
      setError('Invalid email or password. Try doctor@example.com / password');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    if (!isRedirecting) {
      setIsRedirecting(true);
      
      // Remove token from API client
      delete api.defaults.headers.common['Authorization'];
      
      clearAuth();
      navigate('/login', { replace: true });
      
      // Reset redirect flag after navigation
      setTimeout(() => {
        setIsRedirecting(false);
      }, 1000);
    }
  }, [clearAuth, navigate, isRedirecting]);

  const value = {
    ...authState,
    login,
    logout,
    clearAuth,
    isLoading,
    error,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 