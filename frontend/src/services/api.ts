import axios from 'axios';
import config from '../config';

// Create axios instance with default config
const api = axios.create({
  baseURL: config.API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Track if we're already redirecting to avoid loops
let isRedirecting = false;

// Add request interceptor to inject auth token
api.interceptors.request.use((config) => {
  const storedAuth = localStorage.getItem('auth');
  if (storedAuth) {
    try {
      const { token } = JSON.parse(storedAuth);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Failed to parse auth data:', error);
      // Don't clear storage here, let the auth context handle it
    }
  }
  return config;
});

// Add response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && !isRedirecting) {
      isRedirecting = true;
      
      // Instead of clearing localStorage directly, dispatch a custom event
      // This allows AuthContext to handle the logout process
      const authErrorEvent = new CustomEvent('auth:error', {
        detail: { status: 401, message: 'Authentication failed' }
      });
      window.dispatchEvent(authErrorEvent);
      
      // Reset redirect flag after a short delay
      setTimeout(() => {
        isRedirecting = false;
      }, 1000);
    }
    return Promise.reject(error);
  }
);

export default api; 