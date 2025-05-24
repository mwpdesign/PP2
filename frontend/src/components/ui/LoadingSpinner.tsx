import React from 'react';
import { LoadingSpinnerProps } from '../../types/ui';
import clsx from 'clsx';
import { Cross } from 'lucide-react';

/**
 * LoadingSpinner component with medical cross animation
 */
export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  color = 'text-medical-blue',
  className,
  ...props
}) => {
  const sizeStyles = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  };

  return (
    <div
      role="status"
      aria-label="Loading"
      className={clsx(
        'animate-spin',
        color,
        sizeStyles[size],
        className
      )}
      {...props}
    >
      <Cross className="w-full h-full" />
      <span className="sr-only">Loading...</span>
    </div>
  );
};

export default LoadingSpinner; 