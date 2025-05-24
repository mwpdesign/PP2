export type UserRole = 'admin' | 'doctor' | 'ivr_company' | 'logistics';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  avatar?: string;
  territory?: string;
}

export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  verifyMfa: (code: string) => Promise<void>;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
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