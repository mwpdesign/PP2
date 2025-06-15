import React from 'react';
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface PasswordStrengthIndicatorProps {
  password: string;
}

interface PasswordRequirement {
  label: string;
  test: (password: string) => boolean;
}

const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({ password }) => {
  const requirements: PasswordRequirement[] = [
    {
      label: 'At least 8 characters',
      test: (pwd) => pwd.length >= 8
    },
    {
      label: 'Contains uppercase letter',
      test: (pwd) => /[A-Z]/.test(pwd)
    },
    {
      label: 'Contains lowercase letter',
      test: (pwd) => /[a-z]/.test(pwd)
    },
    {
      label: 'Contains number',
      test: (pwd) => /\d/.test(pwd)
    },
    {
      label: 'Contains special character',
      test: (pwd) => /[!@#$%^&*(),.?":{}|<>]/.test(pwd)
    }
  ];

  const getStrengthScore = (): number => {
    return requirements.filter(req => req.test(password)).length;
  };

  const getStrengthLabel = (score: number): string => {
    if (score === 0) return '';
    if (score <= 2) return 'Weak';
    if (score <= 3) return 'Fair';
    if (score <= 4) return 'Good';
    return 'Strong';
  };

  const getStrengthColor = (score: number): string => {
    if (score === 0) return '';
    if (score <= 2) return 'text-red-600';
    if (score <= 3) return 'text-yellow-600';
    if (score <= 4) return 'text-blue-600';
    return 'text-green-600';
  };

  const getProgressColor = (score: number): string => {
    if (score === 0) return 'bg-slate-200';
    if (score <= 2) return 'bg-red-500';
    if (score <= 3) return 'bg-yellow-500';
    if (score <= 4) return 'bg-blue-500';
    return 'bg-green-500';
  };

  const strengthScore = getStrengthScore();
  const strengthLabel = getStrengthLabel(strengthScore);
  const strengthColor = getStrengthColor(strengthScore);
  const progressColor = getProgressColor(strengthScore);

  // Don't show anything if password is empty
  if (!password) {
    return null;
  }

  return (
    <div className="mt-2">
      {/* Strength Bar */}
      <div className="flex items-center space-x-2 mb-2">
        <div className="flex-1 bg-slate-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${progressColor}`}
            style={{ width: `${(strengthScore / requirements.length) * 100}%` }}
          />
        </div>
        {strengthLabel && (
          <span className={`text-xs font-medium ${strengthColor}`}>
            {strengthLabel}
          </span>
        )}
      </div>

      {/* Requirements List */}
      <div className="space-y-1">
        {requirements.map((requirement, index) => {
          const isValid = requirement.test(password);
          return (
            <div key={index} className="flex items-center space-x-2">
              {isValid ? (
                <CheckIcon className="h-3 w-3 text-green-500 flex-shrink-0" />
              ) : (
                <XMarkIcon className="h-3 w-3 text-slate-400 flex-shrink-0" />
              )}
              <span
                className={`text-xs ${
                  isValid ? 'text-green-600' : 'text-slate-500'
                }`}
              >
                {requirement.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PasswordStrengthIndicator;