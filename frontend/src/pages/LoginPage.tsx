import React from 'react';
import { AuthLayout } from '../components/auth/AuthLayout';
import { TrustIndicators } from '../components/auth/TrustIndicators';
import { LoginForm } from '../components/auth/LoginForm';

const LoginPage = () => {
  return (
    <AuthLayout 
      title="Healthcare IVR Platform" 
      subtitle="Secure access to patient care management"
    >
      <TrustIndicators />
      <LoginForm />
    </AuthLayout>
  );
};

export default LoginPage; 