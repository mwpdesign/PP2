import React from 'react';
import { AuthLayout } from '../components/auth/AuthLayout';
import { TrustIndicators } from '../components/auth/TrustIndicators';
import { LoginForm } from '../components/auth/LoginForm';

const LoginPage = () => {
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