export type UserRole =
  | 'Admin'
  | 'Doctor'
  | 'IVR'
  | 'Master Distributor'
  | 'CHP Admin'
  | 'Distributor'
  | 'Sales'
  | 'Shipping and Logistics';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  organization_id: string;
  permissions: string[];
  is_superuser: boolean;
  avatar?: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  refresh_token?: string | null;
  id_token?: string | null;
  expires_in?: number | null;
}

export interface UserProfile {
  email: string;
  first_name: string;
  last_name: string;
  phone_number?: string | null;
  email_verified: boolean;
  created_at?: string | null;
  role?: UserRole;
  org?: string;
  is_superuser?: boolean;
  sub?: string;
}

export interface AuthContextType {
  user: UserProfile | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  getToken: () => string | null;
  refreshToken: () => Promise<void>;
  getUserRole: () => UserRole | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface MFAVerification {
  code: string;
  rememberDevice?: boolean;
}

export interface LoginStep {
  step: 'email' | 'password' | 'mfa' | 'success';
  email?: string;
  password?: string;
  mfaCode?: string;
  rememberDevice?: boolean;
}

export interface AuthError {
  message: string;
  field?: string;
  detail?: string | { msg: string; type: string }[];
}

export interface NavigationItem {
  id: string;
  title: string;
  path: string;
  icon: string;
  roles: UserRole[];
  children?: Omit<NavigationItem, 'children'>[];
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  isRead: boolean;
  createdAt: string;
  roles: UserRole[];
  containsPHI: boolean;
}

export interface JWTPayload {
  sub: string;
  role: UserRole;
  org: string;
  is_superuser: boolean;
  exp: number;
  iat?: number;
}

export interface AuthConfig {
  apiBaseUrl: string;
  tokenStorageKey: string;
  refreshTokenKey: string;
  tokenRefreshThreshold: number;
  sessionTimeoutMinutes: number;
}

export interface MockCredentials {
  email: string;
  password: string;
  role: UserRole;
  name: string;
}

export const MOCK_USERS: MockCredentials[] = [
  { email: 'admin@healthcare.local', password: 'admin123', role: 'Admin', name: 'Admin User' },
  { email: 'doctor@healthcare.local', password: 'doctor123', role: 'Doctor', name: 'Dr. John Smith' },
  { email: 'ivr@healthcare.local', password: 'ivr123', role: 'IVR', name: 'IVR Company' },
  { email: 'distributor@healthcare.local', password: 'distributor123', role: 'Master Distributor', name: 'Master Distributor' },
  { email: 'chp@healthcare.local', password: 'chp123', role: 'CHP Admin', name: 'CHP Administrator' },
  { email: 'distributor2@healthcare.local', password: 'distributor123', role: 'Distributor', name: 'Regional Distributor' },
  { email: 'sales@healthcare.local', password: 'sales123', role: 'Sales', name: 'Sales Representative' },
  { email: 'logistics@healthcare.local', password: 'logistics123', role: 'Shipping and Logistics', name: 'Shipping Logistics' }
];