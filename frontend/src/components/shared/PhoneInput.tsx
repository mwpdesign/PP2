import React, { useCallback } from 'react';
import { formatPhoneInput, unformatPhone } from '../../utils/phoneFormatter';

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  label?: string;
  className?: string;
  id?: string;
  name?: string;
}

const PhoneInput: React.FC<PhoneInputProps> = ({
  value,
  onChange,
  placeholder = '(555) 555-5555',
  required = false,
  disabled = false,
  error,
  label,
  className = '',
  id,
  name
}) => {
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    const digits = unformatPhone(inputValue);
    
    // Don't allow more than 10 digits
    if (digits.length > 10) return;
    
    // Format the phone number and update the value
    const formattedValue = formatPhoneInput(inputValue);
    onChange(formattedValue);
  }, [onChange]);

  return (
    <div className={className}>
      {label && (
        <label 
          htmlFor={id} 
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <div className="relative">
        <input
          type="tel"
          id={id}
          name={name}
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className={`
            mt-1 block w-full rounded-md border border-gray-300 px-3 py-2
            focus:border-blue-500 focus:ring-blue-500 sm:text-sm
            disabled:bg-gray-50 disabled:text-gray-500
            ${error ? 'border-red-300 text-red-900 placeholder-red-300 focus:border-red-500 focus:ring-red-500' : ''}
          `}
        />
      </div>
      {error && (
        <p className="mt-1 text-xs text-red-600">{error}</p>
      )}
    </div>
  );
};

export default PhoneInput; 