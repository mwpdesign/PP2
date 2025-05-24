import React from 'react';
import { Shield, Lock } from 'lucide-react';

interface TrustBadgeProps {
  icon: React.ReactNode;
  title: string;
}

const TrustBadge: React.FC<TrustBadgeProps> = ({ icon, title }) => (
  <div className="flex items-center gap-2 bg-[#375788] rounded-lg px-3 py-1.5">
    <div className="text-white">
      {icon}
    </div>
    <span className="text-xs font-medium text-white">
      {title}
    </span>
  </div>
);

export const TrustIndicators: React.FC = () => {
  return (
    <div className="flex space-x-3">
      <TrustBadge
        icon={<Shield className="w-3.5 h-3.5" />}
        title="HIPAA Compliant"
      />
      <TrustBadge
        icon={<Lock className="w-3.5 h-3.5" />}
        title="Secure Access"
      />
    </div>
  );
}; 