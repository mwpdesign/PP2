import axios from 'axios';
import config from '../config';

// Create axios instance with default config
const api = axios.create({
  baseURL: '',  // Empty base URL to allow proxy to work
  headers: {
    'Content-Type': 'application/json',  // Default content type
  },
  timeout: config.API_TIMEOUT,
});

// Track if we're already redirecting to avoid loops
let isRedirecting = false;

// Add request interceptor to inject auth token and handle content types
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  // Handle form-urlencoded data
  if (config.data instanceof URLSearchParams) {
    config.headers['Content-Type'] = 'application/x-www-form-urlencoded';
  }
  
  return config;
});

// Add response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && !isRedirecting) {
      isRedirecting = true;
      
      // Clear auth data and trigger auth error event
      localStorage.removeItem('token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      
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