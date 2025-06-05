import axios, { AxiosInstance } from 'axios';
import {
  TokenResponse,
  UserProfile,
  UserRole,
  AuthError,
  JWTPayload,
  AuthConfig
} from '../types/auth';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';
console.log('[authService] API_BASE_URL:', API_BASE_URL); // Debug log for API_BASE_URL

// Authentication configuration
const AUTH_CONFIG: AuthConfig = {
  apiBaseUrl: API_BASE_URL,
  tokenStorageKey: 'authToken',
  refreshTokenKey: 'refreshToken',
  tokenRefreshThreshold: 5, // Refresh token 5 minutes before expiry
  sessionTimeoutMinutes: 30, // HIPAA compliance - 30 minute session timeout
};

/**
 * Professional Authentication Service for Healthcare IVR Platform
 *
 * Features:
 * - Secure login/logout to backend on port 8000
 * - Token management with automatic refresh
 * - Role detection for all 8 user types
 * - Session handling and timeout management
 * - HIPAA-compliant security measures
 */
class AuthenticationService {
  private apiClient: AxiosInstance;
  private sessionTimeoutId: NodeJS.Timeout | null = null;
  private tokenRefreshTimeoutId: NodeJS.Timeout | null = null;

  constructor() {
    console.log('[AuthService] Initializing with API_BASE_URL:', API_BASE_URL);

    // Create dedicated API client for authentication
    this.apiClient = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Setup request interceptor for auth headers
    this.apiClient.interceptors.request.use((config) => {
      const token = this.getStoredToken();
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Setup response interceptor for error handling
    this.apiClient.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          console.log('[AuthService] 401 Unauthorized - clearing auth state');
          this.clearAuthData();
          this.emitAuthError('Authentication expired');
        }
        return Promise.reject(error);
      }
    );

    // Initialize session management
    this.initializeSessionManagement();
  }

  /**
   * Authenticate user with email and password
   */
  async login(email: string, password: string): Promise<TokenResponse> {
    console.log('[AuthService] ===== LOGIN REQUEST =====');
    console.log('[AuthService] Email:', email);
    console.log('[AuthService] Password length:', password?.length || 0);

    try {
      // Clear any existing auth data
      this.clearAuthData();

      // Prepare form data for OAuth2 password flow
      const formData = new URLSearchParams();
      formData.append('username', email.trim());
      formData.append('password', password.trim());

      console.log('[AuthService] Making login request to:', `${API_BASE_URL}/api/v1/auth/login`);

      const response = await this.apiClient.post<TokenResponse>(
        '/api/v1/auth/login',
        formData,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      console.log('[AuthService] Login successful:', response.status);
      console.log('[AuthService] Token received:', response.data.access_token?.substring(0, 50) + '...');

      // Store tokens securely
      this.storeTokens(response.data);

      // Setup automatic token refresh
      this.setupTokenRefresh(response.data.access_token);

      // Setup session timeout for HIPAA compliance
      this.setupSessionTimeout();

      console.log('[AuthService] ===== LOGIN COMPLETE =====');
      return response.data;

    } catch (error) {
      console.error('[AuthService] Login error:', error);
      this.clearAuthData();

      if (axios.isAxiosError(error)) {
        const authError: AuthError = {
          message: error.response?.data?.detail || 'Login failed',
          detail: error.response?.data?.detail,
        };
        throw authError;
      }

      throw { message: 'An unknown error occurred during login' } as AuthError;
    }
  }

  /**
   * Logout user and clear all auth data
   */
  async logout(): Promise<void> {
    console.log('[AuthService] ===== LOGOUT =====');

    try {
      // Clear all auth data
      this.clearAuthData();

      // Clear timeouts
      this.clearTimeouts();

      // Emit logout event
      this.emitAuthEvent('logout');

      console.log('[AuthService] Logout complete');
    } catch (error) {
      console.error('[AuthService] Logout error:', error);
      // Still clear auth data even if logout request fails
      this.clearAuthData();
    }
  }

  /**
   * Refresh authentication token
   */
  async refreshToken(): Promise<void> {
    console.log('[AuthService] Refreshing token...');

    const refreshToken = localStorage.getItem(AUTH_CONFIG.refreshTokenKey);
    if (!refreshToken) {
      console.log('[AuthService] No refresh token available');
      throw new Error('No refresh token available');
    }

    try {
      // Note: Backend doesn't currently support refresh tokens
      // This is a placeholder for future implementation
      console.log('[AuthService] Refresh token not yet implemented in backend');

      // For now, we'll rely on session timeout to handle token expiry

    } catch (error) {
      console.error('[AuthService] Token refresh failed:', error);
      this.clearAuthData();
      throw error;
    }
  }

  /**
   * Get current user profile
   */
  async getUserProfile(): Promise<UserProfile> {
    console.log('[AuthService] Fetching user profile...');

    try {
      const response = await this.apiClient.get<UserProfile>('/api/v1/auth/profile');
      console.log('[AuthService] Profile fetched:', response.data);
      return response.data;
    } catch (error) {
      console.error('[AuthService] Profile fetch error:', error);
      throw error;
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    const token = this.getStoredToken();
    if (!token) {
      return false;
    }

    // Check if token is expired
    try {
      const payload = this.decodeJWT(token);
      const now = Math.floor(Date.now() / 1000);
      const isValid = payload.exp > now;

      if (!isValid) {
        console.log('[AuthService] Token expired, clearing auth data');
        this.clearAuthData();
      }

      return isValid;
    } catch (error) {
      console.error('[AuthService] Token validation error:', error);
      this.clearAuthData();
      return false;
    }
  }

  /**
   * Get current user role
   */
  getUserRole(): UserRole | null {
    const token = this.getStoredToken();
    if (!token) {
      return null;
    }

    try {
      const payload = this.decodeJWT(token);
      console.log('[AuthService] User role from token:', payload.role);
      return payload.role;
    } catch (error) {
      console.error('[AuthService] Error getting user role:', error);
      return null;
    }
  }

  /**
   * Get stored authentication token
   */
  getToken(): string | null {
    return this.getStoredToken();
  }

  /**
   * Decode JWT token payload
   */
  private decodeJWT(token: string): JWTPayload {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('[AuthService] JWT decode error:', error);
      throw new Error('Invalid token format');
    }
  }

  /**
   * Store authentication tokens securely
   */
  private storeTokens(tokenResponse: TokenResponse): void {
    localStorage.setItem(AUTH_CONFIG.tokenStorageKey, tokenResponse.access_token);

    if (tokenResponse.refresh_token) {
      localStorage.setItem(AUTH_CONFIG.refreshTokenKey, tokenResponse.refresh_token);
    }

    console.log('[AuthService] Tokens stored securely');
  }

  /**
   * Get stored token from localStorage
   */
  private getStoredToken(): string | null {
    return localStorage.getItem(AUTH_CONFIG.tokenStorageKey);
  }

  /**
   * Clear all authentication data
   */
  private clearAuthData(): void {
    localStorage.removeItem(AUTH_CONFIG.tokenStorageKey);
    localStorage.removeItem(AUTH_CONFIG.refreshTokenKey);
    localStorage.removeItem('user');
    localStorage.removeItem('userProfile');
    localStorage.removeItem('authState');

    console.log('[AuthService] Auth data cleared');
  }

  /**
   * Setup automatic token refresh
   */
  private setupTokenRefresh(token: string): void {
    try {
      const payload = this.decodeJWT(token);
      const expiryTime = payload.exp * 1000; // Convert to milliseconds
      const refreshTime = expiryTime - (AUTH_CONFIG.tokenRefreshThreshold * 60 * 1000);
      const timeUntilRefresh = refreshTime - Date.now();

      if (timeUntilRefresh > 0) {
        this.tokenRefreshTimeoutId = setTimeout(() => {
          console.log('[AuthService] Auto-refreshing token...');
          this.refreshToken().catch((error) => {
            console.error('[AuthService] Auto-refresh failed:', error);
            this.logout();
          });
        }, timeUntilRefresh);

        console.log(`[AuthService] Token refresh scheduled in ${Math.round(timeUntilRefresh / 1000 / 60)} minutes`);
      }
    } catch (error) {
      console.error('[AuthService] Token refresh setup error:', error);
    }
  }

  /**
   * Setup session timeout for HIPAA compliance
   */
  private setupSessionTimeout(): void {
    this.clearSessionTimeout();

    const timeoutMs = AUTH_CONFIG.sessionTimeoutMinutes * 60 * 1000;
    this.sessionTimeoutId = setTimeout(() => {
      console.log('[AuthService] Session timeout - logging out for HIPAA compliance');
      this.logout();
      this.emitAuthError('Session expired for security');
    }, timeoutMs);

    console.log(`[AuthService] Session timeout set for ${AUTH_CONFIG.sessionTimeoutMinutes} minutes`);
  }

  /**
   * Clear session timeout
   */
  private clearSessionTimeout(): void {
    if (this.sessionTimeoutId) {
      clearTimeout(this.sessionTimeoutId);
      this.sessionTimeoutId = null;
    }
  }

  /**
   * Clear all timeouts
   */
  private clearTimeouts(): void {
    this.clearSessionTimeout();

    if (this.tokenRefreshTimeoutId) {
      clearTimeout(this.tokenRefreshTimeoutId);
      this.tokenRefreshTimeoutId = null;
    }
  }

  /**
   * Initialize session management
   */
  private initializeSessionManagement(): void {
    // Reset session timeout on user activity
    const resetSessionTimeout = () => {
      if (this.isAuthenticated()) {
        this.setupSessionTimeout();
      }
    };

    // Listen for user activity events
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, resetSessionTimeout, { passive: true });
    });

    console.log('[AuthService] Session management initialized');
  }

  /**
   * Emit authentication events
   */
  private emitAuthEvent(type: string, data?: any): void {
    const event = new CustomEvent(`auth:${type}`, { detail: data });
    window.dispatchEvent(event);
  }

  /**
   * Emit authentication error
   */
  private emitAuthError(message: string): void {
    this.emitAuthEvent('error', { message });
  }

  /**
   * Test CORS configuration
   */
  async testCORS(): Promise<any> {
    console.log('[AuthService] Testing CORS configuration...');
    try {
      const response = await this.apiClient.get('/cors-test');
      console.log('[AuthService] CORS test successful:', response.data);
      return response.data;
    } catch (error) {
      console.error('[AuthService] CORS test failed:', error);
      throw error;
    }
  }

  /**
   * Test connectivity to backend
   */
  async testConnectivity(): Promise<any> {
    console.log('[AuthService] Testing backend connectivity...');
    try {
      const response = await this.apiClient.get('/health');
      console.log('[AuthService] Connectivity test successful:', response.data);
      return response.data;
    } catch (error) {
      console.error('[AuthService] Connectivity test failed:', error);
      throw error;
    }
  }
}

// Create singleton instance
const authService = new AuthenticationService();

// Export the service instance and individual methods for backward compatibility
export default authService;

// Legacy exports for backward compatibility with existing code
export const loginUser = (email: string, password: string) => authService.login(email, password);
export const fetchUserProfile = (token: string) => authService.getUserProfile();
export const testCORS = () => authService.testCORS();
export const testConnectivity = () => authService.testConnectivity();

// Export the decodeJwt function for backward compatibility
export const decodeJwt = (token: string): UserProfile | null => {
  try {
    const payload = authService['decodeJWT'](token);
    return {
      email: payload.sub,
      sub: payload.sub,
      role: payload.role,
      org: payload.org,
      is_superuser: payload.is_superuser,
      first_name: '',
      last_name: '',
      email_verified: false,
    };
  } catch (error) {
    console.error('[AuthService] JWT decode error:', error);
    return null;
  }
};

// Export types for convenience
export type { TokenResponse, UserProfile, UserRole, AuthError };