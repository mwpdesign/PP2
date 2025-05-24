import React from 'react';
import { AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import clsx from 'clsx';

// Test component to verify imports
export const TestImports: React.FC = () => {
  return (
    <div className={clsx('flex gap-2')}>
      <AlertCircle />
      <CheckCircle />
      <XCircle />
    </div>
  );
}; 