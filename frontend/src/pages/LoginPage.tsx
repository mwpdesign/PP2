import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { LockClosedIcon } from '@heroicons/react/20/solid';

// Define a mapping from role ID (as potentially returned in JWT) to a base path
// This is an example; you'll need to adjust roles and paths to match your actual setup
const roleRedirects: Record<string, string> = {
  // These keys should match the 'role' field from the decoded JWT payload (e.g., user.role)
  // Example role IDs (adjust these based on what your backend sends in the JWT 'role' claim):
  'admin': '/admin/dashboard',         // Or whatever your admin role ID is
  'provider': '/provider/dashboard',   // Or whatever your provider role ID is
  'staff': '/staff/dashboard',         // Or whatever your staff role ID is
  'distributor': '/distributor/dashboard',
  'doctor': '/doctor/dashboard',
  'ivrcompany': '/ivr/dashboard', // Example for IVRCompany role
  // Add a default or handle roles not explicitly listed if necessary
};

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading, error: authError, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated && user) {
      // Role-based redirection
      const userRole = user.role?.toLowerCase(); // Assuming role is a string like 'Admin', 'Provider' etc.
      const redirectPath = userRole ? roleRedirects[userRole] : '/dashboard'; // Default to /dashboard
      navigate(redirectPath, { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    try {
      await login(email, password);
      // Successful login will trigger the useEffect above due to isAuthenticated and user state changes.
      // No need to navigate explicitly here if useEffect handles it.
    } catch (err: any) {
      const message = err?.detail || 'Login failed. Please check your credentials or server status.';
      setFormError(typeof message === 'string' ? message : JSON.stringify(message));
      console.error('Login page error:', err);
    }
  };

  return (
    <AuthLayout 
      title="Wound Care Portal" 
      subtitle="Streamlined access to wound care management"
    >
      <LoginForm />
    </AuthLayout>
  );
};

export default LoginPage; 