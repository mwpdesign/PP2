import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import authService from './authService';
import config from '../config';

/**
 * Professional API Client for Healthcare IVR Platform
 *
 * Features:
 * - Automatic authentication header injection
 * - Token refresh on 401 errors
 * - Request/response logging for debugging
 * - Error handling with auth state management
 * - HIPAA-compliant request tracking
 */
class APIClient {
  private client: AxiosInstance;
  private isRefreshing = false;
  private failedQueue: Array<{
    resolve: (value?: any) => void;
    reject: (error?: any) => void;
  }> = [];

  constructor() {
    // Create axios instance with default configuration
    this.client = axios.create({
      baseURL: config.API_BASE_URL || 'http://localhost:8000',
      timeout: config.API_TIMEOUT || 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
    console.log('[APIClient] Initialized with base URL:', this.client.defaults.baseURL);
  }

  /**
   * Setup request and response interceptors
   */
  private setupInterceptors(): void {
    // Request interceptor - inject auth token and handle content types
    this.client.interceptors.request.use(
      (config) => {
        // Inject authentication token
        const token = authService.getToken();
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // Handle different content types
        if (config.data instanceof URLSearchParams) {
          config.headers!['Content-Type'] = 'application/x-www-form-urlencoded';
        } else if (config.data instanceof FormData) {
          // Let browser set Content-Type for FormData (includes boundary)
          delete config.headers!['Content-Type'];
        }

        // Log request for debugging (without sensitive data)
        console.log(`[APIClient] ${config.method?.toUpperCase()} ${config.url}`, {
          headers: this.sanitizeHeaders(config.headers),
          hasData: !!config.data,
        });

        return config;
      },
      (error) => {
        console.error('[APIClient] Request interceptor error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor - handle auth errors and token refresh
    this.client.interceptors.response.use(
      (response) => {
        // Log successful response
        console.log(`[APIClient] ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url}`);
        return response;
      },
      async (error) => {
        const originalRequest = error.config;

        // Handle 401 Unauthorized errors
        if (error.response?.status === 401 && !originalRequest._retry) {
          if (this.isRefreshing) {
            // If already refreshing, queue this request
            return new Promise((resolve, reject) => {
              this.failedQueue.push({ resolve, reject });
            }).then(() => {
              return this.client(originalRequest);
            }).catch((err) => {
              return Promise.reject(err);
            });
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            // Attempt to refresh token
            await authService.refreshToken();

            // Process queued requests
            this.processQueue(null);

            // Retry original request
            return this.client(originalRequest);
          } catch (refreshError) {
            // Refresh failed - clear auth and redirect to login
            console.error('[APIClient] Token refresh failed:', refreshError);
            this.processQueue(refreshError);

            // Clear auth state and emit error
            await authService.logout();
            this.emitAuthError('Session expired - please log in again');

            return Promise.reject(refreshError);
          } finally {
            this.isRefreshing = false;
          }
        }

        // Log error response
        console.error(`[APIClient] ${error.response?.status || 'Network'} Error:`, {
          url: error.config?.url,
          method: error.config?.method,
          status: error.response?.status,
          data: error.response?.data,
        });

        return Promise.reject(error);
      }
    );
  }

  /**
   * Process queued requests after token refresh
   */
  private processQueue(error: any): void {
    this.failedQueue.forEach(({ resolve, reject }) => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });

    this.failedQueue = [];
  }

  /**
   * Sanitize headers for logging (remove sensitive data)
   */
  private sanitizeHeaders(headers: any): any {
    if (!headers) return {};

    const sanitized = { ...headers };
    if (sanitized.Authorization) {
      sanitized.Authorization = 'Bearer [REDACTED]';
    }
    return sanitized;
  }

  /**
   * Emit authentication error event
   */
  private emitAuthError(message: string): void {
    const event = new CustomEvent('auth:error', {
      detail: { message, status: 401 }
    });
    window.dispatchEvent(event);
  }

  // HTTP Methods

  /**
   * GET request
   */
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.get<T>(url, config);
  }

  /**
   * POST request
   */
  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.post<T>(url, data, config);
  }

  /**
   * PUT request
   */
  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.put<T>(url, data, config);
  }

  /**
   * PATCH request
   */
  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.patch<T>(url, data, config);
  }

  /**
   * DELETE request
   */
  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.delete<T>(url, config);
  }

  // Convenience methods for common API patterns

  /**
   * Upload file with progress tracking
   */
  async uploadFile<T = any>(
    url: string,
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<AxiosResponse<T>> {
    const formData = new FormData();
    formData.append('file', file);

    return this.client.post<T>(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    });
  }

  /**
   * Download file
   */
  async downloadFile(url: string, filename?: string): Promise<void> {
    const response = await this.client.get(url, {
      responseType: 'blob',
    });

    // Create download link
    const blob = new Blob([response.data]);
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename || 'download';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
  }

  /**
   * Health check endpoint
   */
  async healthCheck(): Promise<AxiosResponse<any>> {
    return this.client.get('/health');
  }

  /**
   * Test CORS configuration
   */
  async testCORS(): Promise<AxiosResponse<any>> {
    return this.client.get('/cors-test');
  }

  /**
   * Get the underlying axios instance for advanced usage
   */
  getAxiosInstance(): AxiosInstance {
    return this.client;
  }
}

// Create singleton instance
const apiClient = new APIClient();

// Export the instance as default
export default apiClient;

// Also export the class for testing or multiple instances
export { APIClient };

// Legacy export for backward compatibility
export const api = apiClient;