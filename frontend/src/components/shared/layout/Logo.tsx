import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const Logo: React.FC<LogoProps> = ({ className = '', size = 'md' }) => {
  const sizes = {
    sm: 'h-6',
    md: 'h-8',
    lg: 'h-12'
  };

  return (
    <div className={`flex items-center ${className}`}>
      <div className={`${sizes[size]} aspect-auto text-brand-primary`}>
        <svg viewBox="0 0 200 50" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
          {/* Cross symbol */}
          <path d="M20 10h10v30H20z" />
          <path d="M10 20h30v10H10z" />
          {/* Health text path */}
          <path d="M60 35h-2V15h2v8h10v-8h2v20h-2v-10H60v10zm25-20h2l8 20h-2.2l-2.3-6H80l-2.3 6h-2.2l8-20zm5.3 12L86 17l-4.3 10h8.6zm12.7-12h2v18h10v2H103V15zm25 0h2v18h10v2h-12V15z" />
          {/* Pass text path */}
          <path d="M150 35h-2V15h2v8h8c1.1 0 2 .9 2 2v8c0 1.1-.9 2-2 2h-8zm0-2h8v-8h-8v8zm25-18h2v20h-2V15zm15 0h2v20h-2V15z" />
        </svg>
      </div>
      <div className="ml-2">
        <div className={`font-bold ${size === 'sm' ? 'text-sm' : size === 'md' ? 'text-base' : 'text-lg'} text-gray-900`}>
          Clear Health Pass
        </div>
        <div className={`${size === 'sm' ? 'text-xs' : size === 'md' ? 'text-sm' : 'text-base'} text-gray-600`}>
          Wound Care
        </div>
      </div>
    </div>
  );
};

export default Logo; 