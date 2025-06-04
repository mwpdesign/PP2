import React, { createContext, useReducer, useEffect, ReactNode, useCallback, useContext } from 'react';
import { loginUser, fetchUserProfile, decodeJwt, UserProfile } from '../services/authService';
import { useNavigate } from 'react-router-dom';
import type { UserRole } from '../types/auth';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  organization_id: string;
  permissions: string[];
  is_superuser: boolean;
}

interface AuthState {
  isAuthenticated: boolean;
  user: UserProfile | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
}

interface AuthContextType extends AuthState {
  login: (email_in: string, password_in: string) => Promise<void>;
  logout: () => void;
  // loadUser is implicitly called on init and after login
}

const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  token: null,
  isLoading: false, // MODIFIED: Start with isLoading false
  error: null,
};

type AuthAction =
  | { type: 'LOGIN_REQUEST' }
  | { type: 'LOGIN_SUCCESS'; payload: { token: string; user: UserProfile } }
  | { type: 'LOGIN_FAILURE'; payload: string }
  | { type: 'LOAD_USER_SUCCESS'; payload: { token: string; user: UserProfile } }
  | { type: 'LOAD_USER_FAILURE' }
  | { type: 'LOGOUT' }
  | { type: 'SET_LOADING'; payload: boolean };

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  console.log(`[AuthContext] Reducer action: ${action.type}`, action);

  switch (action.type) {
    case 'LOGIN_REQUEST':
      console.log('[AuthContext] LOGIN_REQUEST - setting loading true, clearing error');
      return { ...state, isLoading: true, error: null };
    case 'SET_LOADING':
      console.log(`[AuthContext] SET_LOADING - setting loading to ${action.payload}`);
      return { ...state, isLoading: action.payload, error: null };
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
      console.log(`[AuthContext] ${action.type} - clearing auth state and localStorage`);
      localStorage.removeItem('authToken');
      return {
        ...initialState,
        isLoading: false,
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

  const loadUserFromToken = useCallback(async (token: string) => {
    console.log('[AuthContext] loadUserFromToken called with token:', token.substring(0, 20) + '...');
    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      console.log('[AuthContext] Decoding JWT token...');
      const decodedUser = decodeJwt(token);
      console.log('[AuthContext] Decoded user from JWT:', decodedUser);

      console.log('[AuthContext] Fetching user profile from API...');
      const profileFromApi = await fetchUserProfile(token);
      console.log('[AuthContext] Profile from API:', profileFromApi);

            const comprehensiveUser: UserProfile = {
        ...decodedUser,
        ...profileFromApi,
      };
      console.log('[AuthContext] Comprehensive user object:', comprehensiveUser);

      if (comprehensiveUser) {
        console.log('[AuthContext] Storing token in localStorage and dispatching success');
        localStorage.setItem('authToken', token);
        dispatch({ type: 'LOAD_USER_SUCCESS', payload: { token, user: comprehensiveUser } });
      } else {
        throw new Error('Failed to process user information from token.');
      }
    } catch (error) {
      console.error('[AuthContext] Error in loadUserFromToken:', error);
      localStorage.removeItem('authToken');
      dispatch({ type: 'LOAD_USER_FAILURE' });
    }
  }, []);

  useEffect(() => {
    console.log('[AuthContext] useEffect - checking for existing token in localStorage');
    const token = localStorage.getItem('authToken');
    if (token) {
      console.log('[AuthContext] Found existing token, loading user...');
      loadUserFromToken(token);
    } else {
      console.log('[AuthContext] No existing token found, setting loading to false');
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [loadUserFromToken]);

  const login = async (email_in: string, password_in: string) => {
    console.log('[AuthContext] login called with:', { email: email_in, passwordLength: password_in.length });
    dispatch({ type: 'LOGIN_REQUEST' });

    try {
      console.log('[AuthContext] Calling loginUser service...');
      const tokenData = await loginUser(email_in, password_in);
      console.log('[AuthContext] loginUser service returned:', tokenData);

      console.log('[AuthContext] Loading user from received token...');
      await loadUserFromToken(tokenData.access_token);
      console.log('[AuthContext] Login process completed successfully');
    } catch (error: any) {
      console.error('[AuthContext] Login error:', error);
      const errorMessage = typeof error.detail === 'string' ? error.detail : JSON.stringify(error.detail);
      console.log('[AuthContext] Dispatching LOGIN_FAILURE with message:', errorMessage);
      dispatch({ type: 'LOGIN_FAILURE', payload: errorMessage || 'Login failed' });
      throw error;
    }
  };

  const logout = () => {
    console.log('[AuthContext] logout called');
    dispatch({ type: 'LOGOUT' });
  };

  const value = {
    ...state,
    login,
    logout,
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