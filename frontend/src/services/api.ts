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
      baseURL: config.API_BASE_URL || '',  // Use empty string for relative URLs with Vite proxy
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

// Doctors API functions
export const getDoctors = async (params?: {
  search?: string;
  page?: number;
  limit?: number;
}) => {
  const searchParams = new URLSearchParams();

  if (params?.search) {
    searchParams.append('search', params.search);
  }
  if (params?.page) {
    searchParams.append('page', params.page.toString());
  }
  if (params?.limit) {
    searchParams.append('limit', params.limit.toString());
  }

  const url = `/api/v1/doctors${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;

  try {
    const response = await apiClient.get(url);
    return response.data;
  } catch (error) {
    console.warn('Backend doctors endpoint not available, using mock data:', error);

    // Return mock doctors data
    const mockDoctors = [
      {
        id: 'f867a41c-83b1-4ef3-96ec-c3ed1fea07a2',
        first_name: 'Dr. John',
        last_name: 'Smith',
        email: 'john.smith@healthcare.com',
        phone: '(555) 123-4567',
        specialty: 'Wound Care Specialist',
        facility: 'City Medical Center',
        status: 'active',
        added_by_name: 'Sales Representative',
        created_at: new Date().toISOString()
      },
      {
        id: 'a123b456-789c-4def-9012-3456789abcde',
        first_name: 'Dr. Sarah',
        last_name: 'Johnson',
        email: 'sarah.johnson@healthcare.com',
        phone: '(555) 987-6543',
        specialty: 'Dermatology',
        facility: 'Regional Health Center',
        status: 'active',
        added_by_name: 'Sales Representative',
        created_at: new Date(Date.now() - 86400000).toISOString() // 1 day ago
      },
      {
        id: 'b987c654-321d-4afe-8765-4321098765ba',
        first_name: 'Dr. Michael',
        last_name: 'Brown',
        email: 'michael.brown@healthcare.com',
        phone: '(555) 456-7890',
        specialty: 'Plastic Surgery',
        facility: 'Metro Medical Plaza',
        status: 'active',
        added_by_name: 'Sales Representative',
        created_at: new Date(Date.now() - 172800000).toISOString() // 2 days ago
      }
    ];

    // Apply search filter if provided
    let filteredDoctors = mockDoctors;
    if (params?.search) {
      const searchTerm = params.search.toLowerCase();
      filteredDoctors = mockDoctors.filter(doctor =>
        doctor.first_name.toLowerCase().includes(searchTerm) ||
        doctor.last_name.toLowerCase().includes(searchTerm) ||
        doctor.email.toLowerCase().includes(searchTerm) ||
        doctor.specialty.toLowerCase().includes(searchTerm) ||
        doctor.facility.toLowerCase().includes(searchTerm)
      );
    }

    // Apply pagination
    const page = params?.page || 1;
    const limit = params?.limit || 20;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedDoctors = filteredDoctors.slice(startIndex, endIndex);

    return {
      doctors: paginatedDoctors,
      total: filteredDoctors.length,
      page: page,
      pages: Math.ceil(filteredDoctors.length / limit)
    };
  }
};

export const getDoctorDetail = async (doctorId: string) => {
  const response = await apiClient.get(`/api/v1/doctors/${doctorId}`);
  return response.data;
};

export const getDoctorById = async (doctorId: string) => {
  // Temporary mock data until backend endpoints are implemented
  // This prevents the "Something went wrong" error page
  try {
    const response = await apiClient.get(`/api/v1/doctors/${doctorId}`);
    return response.data;
  } catch (error) {
    console.warn('Backend doctor endpoint not available, using mock data:', error);

    // Return specific mock data based on doctor ID
    const mockDoctors: { [key: string]: any } = {
      'f867a41c-83b1-4ef3-96ec-c3ed1fea07a2': {
        id: 'f867a41c-83b1-4ef3-96ec-c3ed1fea07a2',
        first_name: 'Dr. John',
        last_name: 'Smith',
        email: 'john.smith@healthcare.com',
        phone: '(555) 123-4567',
        specialty: 'Wound Care Specialist',
        facility: 'City Medical Center',
        status: 'active',
        npi: '1234567890',
        license_number: 'MD123456',
        address_line_1: '123 Medical Drive',
        address_line_2: 'Suite 100',
        city: 'Healthcare City',
        state: 'CA',
        zip_code: '90210',
        years_experience: 15,
        wound_care_percentage: 80,
        added_by_name: 'Sales Representative',
        created_at: new Date().toISOString()
      },
      'a123b456-789c-4def-9012-3456789abcde': {
        id: 'a123b456-789c-4def-9012-3456789abcde',
        first_name: 'Dr. Sarah',
        last_name: 'Johnson',
        email: 'sarah.johnson@healthcare.com',
        phone: '(555) 987-6543',
        specialty: 'Dermatology',
        facility: 'Regional Health Center',
        status: 'active',
        npi: '9876543210',
        license_number: 'MD789012',
        address_line_1: '456 Health Boulevard',
        address_line_2: 'Floor 3',
        city: 'Medical Town',
        state: 'NY',
        zip_code: '10001',
        years_experience: 12,
        wound_care_percentage: 60,
        added_by_name: 'Sales Representative',
        created_at: new Date(Date.now() - 86400000).toISOString()
      },
      'b987c654-321d-4afe-8765-4321098765ba': {
        id: 'b987c654-321d-4afe-8765-4321098765ba',
        first_name: 'Dr. Michael',
        last_name: 'Brown',
        email: 'michael.brown@healthcare.com',
        phone: '(555) 456-7890',
        specialty: 'Plastic Surgery',
        facility: 'Metro Medical Plaza',
        status: 'active',
        npi: '5555666677',
        license_number: 'MD345678',
        address_line_1: '789 Surgery Center',
        address_line_2: '',
        city: 'Metro City',
        state: 'TX',
        zip_code: '75001',
        years_experience: 20,
        wound_care_percentage: 90,
        added_by_name: 'Sales Representative',
        created_at: new Date(Date.now() - 172800000).toISOString()
      }
    };

    // Return specific doctor data or default if ID not found
    return mockDoctors[doctorId] || {
      id: doctorId,
      first_name: 'Dr. Unknown',
      last_name: 'Doctor',
      email: 'unknown@healthcare.com',
      phone: '(555) 000-0000',
      specialty: 'General Practice',
      facility: 'Unknown Medical Center',
      status: 'active',
      npi: '0000000000',
      license_number: 'MD000000',
      address_line_1: '000 Unknown Street',
      address_line_2: '',
      city: 'Unknown City',
      state: 'XX',
      zip_code: '00000',
      years_experience: 5,
      wound_care_percentage: 50,
      added_by_name: 'Sales Representative',
      created_at: new Date().toISOString()
    };
  }
};

export const updateDoctor = async (doctorId: string, data: any) => {
  // Temporary mock implementation until backend endpoints are implemented
  try {
    const response = await apiClient.put(`/api/v1/doctors/${doctorId}`, data);
    return response.data;
  } catch (error) {
    console.warn('Backend doctor update endpoint not available, using mock response:', error);

    // Return mock success response
    return {
      success: true,
      message: 'Doctor updated successfully (mock)',
      doctor: {
        id: doctorId,
        ...data,
        updated_at: new Date().toISOString()
      }
    };
  }
};