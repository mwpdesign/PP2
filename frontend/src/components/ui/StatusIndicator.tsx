import React from 'react';
import { StatusIndicatorProps } from '../../types/ui';
import clsx from 'clsx';
import { CheckCircle, AlertCircle, XCircle, Clock } from 'lucide-react';

/**
 * StatusIndicator component for displaying status badges
 */
export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  children,
  size = 'md',
  showIcon = true,
  className,
  ...props
}) => {
  const statusConfig = {
    success: {
      bg: 'bg-green-100',
      text: 'text-green-800',
      icon: CheckCircle,
    },
    warning: {
      bg: 'bg-yellow-100',
      text: 'text-yellow-800',
      icon: AlertCircle,
    },
    error: {
      bg: 'bg-red-100',
      text: 'text-red-800',
      icon: XCircle,
    },
    info: {
      bg: 'bg-brand-primary/10',
      text: 'text-brand-primary',
      icon: AlertCircle,
    },
    pending: {
      bg: 'bg-gray-100',
      text: 'text-gray-800',
      icon: Clock,
    },
  };

  const sizeStyles = {
    sm: 'text-xs py-0.5 px-2',
    md: 'text-sm py-1 px-3',
    lg: 'text-base py-1.5 px-4',
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  const config = statusConfig[status];
  const StatusIcon = config.icon;

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-full font-medium',
        config.bg,
        config.text,
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {showIcon && <StatusIcon className={iconSizes[size]} />}
      {children}
    </span>
  );
};

export default StatusIndicator; 