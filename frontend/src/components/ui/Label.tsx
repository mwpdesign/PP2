import React from 'react';
import clsx from 'clsx';

interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
  error?: boolean;
}

/**
 * Label component for form fields
 */
const Label: React.FC<LabelProps> = ({
  children,
  className,
  required = false,
  error = false,
  ...props
}) => {
  return (
    <label
      className={clsx(
        'text-sm font-medium text-gray-700',
        error && 'text-red-600',
        className
      )}
      {...props}
    >
      {children}
      {required && (
        <span className="ml-1 text-red-600" aria-hidden="true">
          *
        </span>
      )}
    </label>
  );
};

export default Label; 