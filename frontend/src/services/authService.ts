import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';
console.log('[authService] API_BASE_URL:', API_BASE_URL); // Debug log for API_BASE_URL

interface TokenResponse {
  access_token: string;
  token_type: string;
  refresh_token?: string | null;
  id_token?: string | null;
  expires_in?: number | null;
}

// Based on backend/app/api/auth/models.py UserProfile
export interface UserProfile {
  email: string;
  first_name: string;
  last_name: string;
  phone_number?: string | null;
  email_verified: boolean;
  created_at?: string | null;
  // Adding role, org, is_superuser from token payload for frontend use
  role?: string;
  org?: string;
  is_superuser?: boolean;
  // Raw token claims that might be useful
  sub?: string; // Typically the user ID or email
}

interface AuthErrorDetail {
  detail: string | { msg: string; type: string }[];
}

// Test CORS configuration
export const testCORS = async (): Promise<any> => {
  console.log('[authService] ===== CORS TEST =====');
  try {
    const response = await axios.get(`${API_BASE_URL}/cors-test`);
    console.log('[authService] CORS test successful:', response.data);
    return response.data;
  } catch (error) {
    console.error('[authService] CORS test failed:', error);
    throw error;
  }
};

// Test basic connectivity
export const testConnectivity = async (): Promise<any> => {
  console.log('[authService] ===== CONNECTIVITY TEST =====');
  try {
    const response = await axios.get(`${API_BASE_URL}/test`);
    console.log('[authService] Connectivity test successful:', response.data);
    return response.data;
  } catch (error) {
    console.error('[authService] Connectivity test failed:', error);
    throw error;
  }
};

export const loginUser = async (email_in: string, password_in: string): Promise<TokenResponse> => {
  console.log('[authService] ===== LOGIN REQUEST DEBUG =====');
  console.log('[authService] Raw input email:', email_in);
  console.log('[authService] Raw input password length:', password_in?.length || 0);
  console.log('[authService] Email type:', typeof email_in);
  console.log('[authService] Password type:', typeof password_in);

  // Check for whitespace issues
  const trimmedEmail = email_in?.trim();
  const trimmedPassword = password_in?.trim();
  console.log('[authService] Trimmed email:', trimmedEmail);
  console.log('[authService] Trimmed password length:', trimmedPassword?.length || 0);
  console.log('[authService] Email has whitespace:', email_in !== trimmedEmail);
  console.log('[authService] Password has whitespace:', password_in !== trimmedPassword);

  const params = new URLSearchParams();
  params.append('username', email_in);
  params.append('password', password_in);

  console.log('[authService] URLSearchParams toString():', params.toString());
  console.log('[authService] URLSearchParams entries:');
  for (const [key, value] of params.entries()) {
    console.log(`[authService]   ${key}: "${value}" (length: ${value.length})`);
  }

  const requestUrl = `${API_BASE_URL}/api/v1/auth/login`;
  console.log('[authService] Request URL:', requestUrl);
  console.log('[authService] Request method: POST');
  console.log('[authService] Request headers: Content-Type: application/x-www-form-urlencoded');

  // Test CORS before making the actual request
  try {
    console.log('[authService] Testing CORS configuration...');
    await testCORS();
    console.log('[authService] CORS test passed, proceeding with login...');
  } catch (corsError) {
    console.error('[authService] CORS test failed, but proceeding with login anyway:', corsError);
  }

  console.log('[authService] =====================================');

  try {
    console.log('[authService] Making login request...');
    const startTime = Date.now();

    const response = await axios.post<TokenResponse>(
      requestUrl,
      params,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        timeout: 10000, // 10 second timeout
        withCredentials: false, // Explicitly set credentials policy
      }
    );

    const endTime = Date.now();
    const duration = endTime - startTime;

    console.log('[authService] ===== LOGIN RESPONSE SUCCESS =====');
    console.log('[authService] Response status:', response.status);
    console.log('[authService] Response status text:', response.statusText);
    console.log('[authService] Response time:', `${duration}ms`);
    console.log('[authService] Response headers:', response.headers);
    console.log('[authService] Response data:', response.data);
    console.log('[authService] Access token preview:', response.data.access_token?.substring(0, 50) + '...');
    console.log('[authService] ===================================');
    return response.data;
  } catch (error) {
    console.log('[authService] ===== LOGIN RESPONSE ERROR =====');
    console.error('[authService] Full error object:', error);

    if (axios.isAxiosError(error)) {
      console.error('[authService] Axios error details:');
      console.error('[authService]   - Status:', error.response?.status);
      console.error('[authService]   - Status text:', error.response?.statusText);
      console.error('[authService]   - Headers:', error.response?.headers);
      console.error('[authService]   - Data:', error.response?.data);
      console.error('[authService]   - Config URL:', error.config?.url);
      console.error('[authService]   - Config method:', error.config?.method);
      console.error('[authService]   - Config headers:', error.config?.headers);
      console.error('[authService]   - Config data:', error.config?.data);
      console.error('[authService]   - Config timeout:', error.config?.timeout);
      console.error('[authService]   - Config withCredentials:', error.config?.withCredentials);

      // Check for specific error types
      if (error.code === 'ECONNREFUSED') {
        console.error('[authService] CONNECTION REFUSED - Backend server may not be running');
      } else if (error.code === 'ENOTFOUND') {
        console.error('[authService] DNS RESOLUTION FAILED - Check API_BASE_URL');
      } else if (error.code === 'ECONNABORTED') {
        console.error('[authService] REQUEST TIMEOUT - Server took too long to respond');
      } else if (error.response?.status === 0) {
        console.error('[authService] CORS ERROR - Request blocked by browser CORS policy');
      }

      if (error.response) {
        console.log('[authService] ================================');
        throw error.response.data as AuthErrorDetail; // Re-throw structured error if available
      }
    }

    console.log('[authService] ================================');
    // Fallback for non-Axios errors or Axios errors without a response object
    throw { detail: 'An unknown error occurred during login. Check console for details.' } as AuthErrorDetail;
  }
};

export const fetchUserProfile = async (token: string): Promise<UserProfile> => {
  console.log('[authService] ===== FETCH USER PROFILE =====');
  console.log('[authService] Token preview:', token.substring(0, 50) + '...');

  try {
    const requestUrl = `${API_BASE_URL}/api/v1/auth/profile`;
    console.log('[authService] Profile request URL:', requestUrl);

    const response = await axios.get<UserProfile>(
      requestUrl,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        timeout: 5000,
      }
    );

    console.log('[authService] Profile response status:', response.status);
    console.log('[authService] Profile response data:', response.data);
    console.log('[authService] ================================');

    return response.data;
  } catch (error) {
    console.error('[authService] Profile fetch error:', error);

    if (axios.isAxiosError(error) && error.response) {
      console.error('[authService] Profile error response:', error.response.data);
      throw error.response.data as AuthErrorDetail;
    }
    throw { detail: 'An unknown error occurred while fetching user profile.' } as AuthErrorDetail;
  }
};

// Helper function to decode JWT - useful for getting claims directly on frontend
// Note: This doesn't verify the token signature; verification happens on the backend.
export const decodeJwt = (token: string): UserProfile | null => {
  console.log('[authService] ===== DECODE JWT =====');
  console.log('[authService] Token to decode preview:', token.substring(0, 50) + '...');

  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const decoded = JSON.parse(jsonPayload);
    console.log('[authService] Decoded JWT payload:', decoded);

    // Map standard JWT claims and custom claims to UserProfile structure
    const userProfile = {
      email: decoded.sub, // Assuming 'sub' is the email, common practice
      sub: decoded.sub,
      role: decoded.role,
      org: decoded.org,
      is_superuser: decoded.is_superuser,
      // These might not be in the JWT, primarily from /profile but good to have placeholders
      first_name: decoded.given_name || '',
      last_name: decoded.family_name || '',
      email_verified: decoded.email_verified || false,
    } as UserProfile;

    console.log('[authService] Mapped user profile:', userProfile);
    console.log('[authService] ================================');

    return userProfile;
  } catch (error) {
    console.error("[authService] Failed to decode JWT:", error);
    console.log('[authService] ================================');
    return null;
  }
};