import React, { createContext, useReducer, useEffect, ReactNode, useCallback, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import type { UserRole, UserProfile, AuthContextType } from '../types/auth';

interface AuthState {
  isAuthenticated: boolean;
  user: UserProfile | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  token: null,
  isLoading: false,
  error: null,
};

type AuthAction =
  | { type: 'LOGIN_REQUEST' }
  | { type: 'LOGIN_SUCCESS'; payload: { token: string; user: UserProfile } }
  | { type: 'LOGIN_FAILURE'; payload: string }
  | { type: 'LOAD_USER_SUCCESS'; payload: { token: string; user: UserProfile } }
  | { type: 'LOAD_USER_FAILURE' }
  | { type: 'LOGOUT' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'CLEAR_ERROR' };

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  console.log(`[AuthContext] Reducer action: ${action.type}`, action);

  switch (action.type) {
    case 'LOGIN_REQUEST':
      console.log('[AuthContext] LOGIN_REQUEST - setting loading true, clearing error');
      return { ...state, isLoading: true, error: null };

    case 'SET_LOADING':
      console.log(`[AuthContext] SET_LOADING - setting loading to ${action.payload}`);
      return { ...state, isLoading: action.payload };

    case 'CLEAR_ERROR':
      return { ...state, error: null };

    case 'LOGIN_SUCCESS':
    case 'LOAD_USER_SUCCESS':
      console.log(`[AuthContext] ${action.type} - user authenticated:`, action.payload.user.email);
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload.user,
        token: action.payload.token,
        isLoading: false,
        error: null,
      };

    case 'LOGIN_FAILURE':
      console.log(`[AuthContext] LOGIN_FAILURE - error:`, action.payload);
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        token: null,
        isLoading: false,
        error: action.payload,
      };

    case 'LOAD_USER_FAILURE':
    case 'LOGOUT':
      console.log(`🚨 [AuthContext] ${action.type} - CLEARING ALL AUTH STATE 🚨`);
      return {
        isAuthenticated: false,
        user: null,
        token: null,
        isLoading: false,
        error: null,
      };

    default:
      console.log(`[AuthContext] Unknown action type: ${(action as any).type}`);
      return state;
  }
};

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const navigate = useNavigate();
  const [state, dispatch] = useReducer(authReducer, initialState);

  console.log('[AuthContext] Current state:', {
    isAuthenticated: state.isAuthenticated,
    user: state.user?.email || 'null',
    token: state.token ? 'present' : 'null',
    isLoading: state.isLoading,
    error: state.error
  });

  /**
   * Load user from stored token
   */
  const loadUserFromToken = useCallback(async (token: string) => {
    console.log('[AuthContext] loadUserFromToken called');
    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      // Get user profile from backend
      const userProfile = await authService.getUserProfile();
      console.log('[AuthContext] Profile fetched:', userProfile);

      // Get role from token for consistency
      const role = authService.getUserRole();
      const comprehensiveUser: UserProfile = {
        ...userProfile,
        role: role || userProfile.role,
      };

      console.log('[AuthContext] 🎯 ROLE DEBUG - Final user role:', comprehensiveUser.role);

      dispatch({ type: 'LOAD_USER_SUCCESS', payload: { token, user: comprehensiveUser } });
    } catch (error: any) {
      console.error('[AuthContext] Error in loadUserFromToken:', error);
      dispatch({ type: 'LOAD_USER_FAILURE' });
    }
  }, []);

  /**
   * Initialize authentication state on mount
   */
  useEffect(() => {
    console.log('[AuthContext] useEffect - checking for existing authentication');

    if (authService.isAuthenticated()) {
      const token = authService.getToken();
      if (token) {
        console.log('[AuthContext] Found valid token, loading user...');
        loadUserFromToken(token);
      } else {
        console.log('[AuthContext] No valid token found');
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    } else {
      console.log('[AuthContext] User not authenticated');
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [loadUserFromToken]);

  /**
   * Listen for authentication events from the service
   */
  useEffect(() => {
    const handleAuthError = (event: CustomEvent) => {
      console.log('[AuthContext] Auth error event received:', event.detail);
      dispatch({ type: 'LOGOUT' });
      navigate('/login');
    };

    const handleLogout = () => {
      console.log('[AuthContext] Logout event received');
      dispatch({ type: 'LOGOUT' });
      navigate('/login');
    };

    window.addEventListener('auth:error', handleAuthError as EventListener);
    window.addEventListener('auth:logout', handleLogout);

    return () => {
      window.removeEventListener('auth:error', handleAuthError as EventListener);
      window.removeEventListener('auth:logout', handleLogout);
    };
  }, [navigate]);

  /**
   * Login function
   */
  const login = async (email: string, password: string) => {
    console.log('[AuthContext] login called with:', { email, passwordLength: password.length });
    dispatch({ type: 'LOGIN_REQUEST' });

    try {
      // Use the authentication service
      const tokenData = await authService.login(email, password);
      console.log('[AuthContext] Login successful, loading user...');

      // Load user profile
      await loadUserFromToken(tokenData.access_token);
      console.log('[AuthContext] Login process completed successfully');
    } catch (error: any) {
      console.error('[AuthContext] Login error:', error);
      const errorMessage = error.message || error.detail || 'Login failed';
      dispatch({ type: 'LOGIN_FAILURE', payload: errorMessage });
      throw error;
    }
  };

  /**
   * Logout function
   */
  const logout = () => {
    console.log('🚨 [AuthContext] LOGOUT CALLED 🚨');

    // Use the authentication service logout
    authService.logout();

    // Update local state
    dispatch({ type: 'LOGOUT' });

    // Force redirect to login page
    window.location.href = '/login';
  };

  /**
   * Get current token
   */
  const getToken = (): string | null => {
    return authService.getToken();
  };

  /**
   * Get current user role
   */
  const getUserRole = (): UserRole | null => {
    return authService.getUserRole();
  };

  /**
   * Refresh token
   */
  const refreshToken = async (): Promise<void> => {
    try {
      await authService.refreshToken();
      // Token refresh is handled by the service
    } catch (error) {
      console.error('[AuthContext] Token refresh failed:', error);
      logout();
    }
  };

  /**
   * Clear error state
   */
  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const value: AuthContextType = {
    ...state,
    login,
    logout,
    getToken,
    getUserRole,
    refreshToken,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;