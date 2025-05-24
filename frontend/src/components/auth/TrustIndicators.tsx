import React from 'react';
import { Paper, Box, Typography } from '@mui/material';
import { Shield, Lock, CheckCircle } from 'lucide-react';

interface TrustBadgeProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const TrustBadge: React.FC<TrustBadgeProps> = ({ icon, title, description }) => (
  <div className="flex items-start gap-4 bg-[#375788]/10 rounded-lg p-4 border border-[#375788]/20">
    <div className="text-[#375788] mt-1">
      {icon}
    </div>
    <div>
      <h3 className="text-sm font-semibold text-[#375788] mb-1">
        {title}
      </h3>
      <p className="text-sm text-gray-300">
        {description}
      </p>
    </div>
  </div>
);

export const TrustIndicators: React.FC = () => {
  return (
    <div className="space-y-3">
      <TrustBadge
        icon={<Shield className="w-5 h-5" />}
        title="HIPAA Compliant"
        description="Your data is protected by industry-leading security measures"
      />
      <TrustBadge
        icon={<Lock className="w-5 h-5" />}
        title="Secure Authentication"
        description="Multi-factor authentication and role-based access control"
      />
      <TrustBadge
        icon={<CheckCircle className="w-5 h-5" />}
        title="SOC 2 Type II Certified"
        description="Independently audited for security and compliance"
      />
    </div>
  );
}; 