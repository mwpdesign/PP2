import React, { useState, useRef, useEffect } from 'react';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

interface ProgressiveInputProps {
  type: 'email' | 'password';
  value: string;
  onChange: (value: string) => void;
  onNext?: () => void;
  onBack?: () => void;
  error?: string;
  isLoading?: boolean;
  autoFocus?: boolean;
  placeholder?: string;
  label?: string;
}

export default function ProgressiveInput({
  type,
  value,
  onChange,
  onNext,
  onBack,
  error,
  isLoading = false,
  autoFocus = false,
  placeholder,
  label
}: ProgressiveInputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      // Delay focus to ensure smooth animation
      setTimeout(() => {
        inputRef.current?.focus();
      }, 150);
    }
  }, [autoFocus]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && value.trim() && onNext && !isLoading) {
      e.preventDefault();
      onNext();
    }
    if (e.key === 'Escape' && onBack) {
      e.preventDefault();
      onBack();
    }
  };

  const inputType = type === 'password' && showPassword ? 'text' : type;
  const hasError = Boolean(error);

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-slate-700">
          {label}
        </label>
      )}

      <div className="relative">
        <input
          ref={inputRef}
          type={inputType}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          disabled={isLoading}
          className={`
            w-full px-4 py-3 text-base border rounded-lg
            transition-all duration-200 ease-in-out
            placeholder-slate-400
            ${hasError
              ? 'border-red-300 bg-red-50 text-red-900 focus:border-red-500 focus:ring-red-500'
              : isFocused
                ? 'border-slate-400 bg-white text-slate-900 focus:border-slate-500 focus:ring-slate-500'
                : 'border-slate-300 bg-slate-50 text-slate-900 hover:border-slate-400'
            }
            focus:outline-none focus:ring-2 focus:ring-opacity-20
            disabled:opacity-50 disabled:cursor-not-allowed
            ${type === 'password' ? 'pr-12' : ''}
          `}
          autoComplete={type === 'email' ? 'email' : 'current-password'}
        />

        {/* Password visibility toggle */}
        {type === 'password' && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            disabled={isLoading}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors duration-200 disabled:opacity-50"
            tabIndex={-1}
          >
            {showPassword ? (
              <EyeSlashIcon className="h-5 w-5" />
            ) : (
              <EyeIcon className="h-5 w-5" />
            )}
          </button>
        )}

        {/* Loading indicator */}
        {isLoading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-slate-300 border-t-slate-600"></div>
          </div>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="flex items-start space-x-2 text-sm text-red-600">
          <svg className="h-4 w-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* Helper text for navigation */}
      {type === 'email' && value.trim() && !error && (
        <div className="text-xs text-slate-500">
          Press Enter to continue
        </div>
      )}

      {type === 'password' && onBack && (
        <div className="text-xs text-slate-500">
          Press Escape to go back
        </div>
      )}
    </div>
  );
}