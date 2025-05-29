import React, { createContext, useContext, useState } from 'react';
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

interface AuthContextType {
  user: User | null;
  login: (credentials: { email: string; password: string }) => Promise<{ success: boolean; user: User }>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(() => {
    const storedUser = localStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  });

  const login = async (credentials: { email: string; password: string }) => {
    // Simulate different roles based on email
    let userData: User;
    
    if (credentials?.email?.includes('doctor')) {
      userData = {
        id: 'doctor-123',
        email: 'doctor@demo.com',
        role: 'Doctor',
        firstName: 'Dr. Sarah',
        lastName: 'Johnson',
        organization_id: 'org-123',
        is_superuser: false,
        permissions: ['manage_patients', 'submit_ivr', 'place_orders']
      };
      navigate('/doctor/dashboard');
    } else if (credentials?.email?.includes('ivr')) {
      userData = {
        id: 'ivr-123',
        email: 'ivr@demo.com',
        role: 'IVRCompany',
        firstName: 'IVR',
        lastName: 'Specialist',
        organization_id: 'org-123',
        is_superuser: false,
        permissions: ['review_ivr', 'approve_requests']
      };
      navigate('/ivr/dashboard');
    } else if (credentials?.email?.includes('distributor')) {
      userData = {
        id: 'distributor-123',
        email: 'distributor@demo.com',
        role: 'Distributor',
        firstName: 'Master',
        lastName: 'Distributor',
        organization_id: 'org-123',
        is_superuser: false,
        permissions: ['manage_orders', 'manage_logistics', 'manage_ivr']
      };
      navigate('/distributor/dashboard');
    } else {
      userData = {
        id: 'admin-123',
        email: 'admin@demo.com',
        role: 'Admin',
        firstName: 'Admin',
        lastName: 'User',
        organization_id: 'org-123',
        is_superuser: true,
        permissions: ['all']
      };
      navigate('/admin/dashboard');
    }
    
    setUser(userData);
    localStorage.setItem('token', 'bypass-jwt-token');
    localStorage.setItem('user', JSON.stringify(userData));
    return { success: true, user: userData };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const value = {
    user,
    login,
    logout,
    isAuthenticated: !!user,
    isLoading: false
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