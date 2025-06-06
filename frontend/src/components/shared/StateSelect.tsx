import React from 'react';
import { US_STATES } from '../../utils/states';

interface StateSelectProps {
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

const StateSelect: React.FC<StateSelectProps> = ({
  value,
  onChange,
  placeholder = 'Select State',
  required = false,
  disabled = false,
  error,
  label,
  className = '',
  id,
  name
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(e.target.value);
  };

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
        <select
          id={id}
          name={name}
          value={value}
          onChange={handleChange}
          disabled={disabled}
          required={required}
          className={`
            mt-1 block w-full rounded-md border border-gray-300 px-3 py-2
            focus:border-blue-500 focus:ring-blue-500 sm:text-sm
            disabled:bg-gray-50 disabled:text-gray-500
            ${error ? 'border-red-300 text-red-900 focus:border-red-500 focus:ring-red-500' : ''}
          `}
        >
          <option value="">{placeholder}</option>
          {US_STATES.map(state => (
            <option key={state.code} value={state.code}>
              {state.name}
            </option>
          ))}
        </select>
      </div>
      {error && (
        <p className="mt-1 text-xs text-red-600">{error}</p>
      )}
    </div>
  );
};

export default StateSelect;