import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  EyeIcon,
  EyeSlashIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';

// Conditional logic operators
export type ConditionalOperator =
  | 'equals'
  | 'not_equals'
  | 'contains'
  | 'not_contains'
  | 'greater_than'
  | 'less_than'
  | 'greater_than_or_equal'
  | 'less_than_or_equal'
  | 'is_empty'
  | 'is_not_empty'
  | 'starts_with'
  | 'ends_with'
  | 'regex_match';

// Field types for validation
export type FieldType =
  | 'text'
  | 'number'
  | 'email'
  | 'phone'
  | 'date'
  | 'select'
  | 'checkbox'
  | 'radio'
  | 'textarea'
  | 'file'
  | 'medical_condition'
  | 'medication'
  | 'allergy';

// Medical priority levels
export type MedicalPriority = 'critical' | 'high' | 'medium' | 'low';

// Conditional rule definition
export interface ConditionalRule {
  id: string;
  sourceField: string;
  operator: ConditionalOperator;
  value: any;
  targetFields: string[];
  action: 'show' | 'hide' | 'require' | 'disable' | 'set_value';
  actionValue?: any;
  medicalPriority?: MedicalPriority;
  description?: string;
}

// Field definition
export interface FieldDefinition {
  id: string;
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  placeholder?: string;
  options?: Array<{ value: string; label: string; medicalCode?: string }>;
  validation?: {
    pattern?: string;
    min?: number;
    max?: number;
    minLength?: number;
    maxLength?: number;
    custom?: (value: any) => string | null;
  };
  medicalPriority?: MedicalPriority;
  medicalCategory?: string;
  defaultValue?: any;
  helpText?: string;
  conditionalRules?: ConditionalRule[];
}

// Field state
export interface FieldState {
  value: any;
  visible: boolean;
  required: boolean;
  disabled: boolean;
  errors: string[];
  touched: boolean;
  medicalPriority?: MedicalPriority;
}

export interface ConditionalFieldLogicProps {
  fields: FieldDefinition[];
  initialValues?: Record<string, any>;
  onFieldChange: (fieldId: string, value: any) => void;
  onValidationChange?: (isValid: boolean, errors: Record<string, string[]>) => void;
  medicalMode?: boolean;
  debugMode?: boolean;
  className?: string;
  disabled?: boolean;
  showPriorityIndicators?: boolean;
  groupByPriority?: boolean;
}

export const ConditionalFieldLogic: React.FC<ConditionalFieldLogicProps> = ({
  fields,
  initialValues = {},
  onFieldChange,
  onValidationChange,
  medicalMode = false,
  debugMode = false,
  className = '',
  disabled = false,
  showPriorityIndicators = true,
  groupByPriority = false
}) => {
  const [fieldStates, setFieldStates] = useState<Record<string, FieldState>>({});
  const [currentFieldValues, setCurrentFieldValues] = useState<Record<string, any>>(initialValues);

  // Initialize field states
  useEffect(() => {
    const initialStates: Record<string, FieldState> = {};

    fields.forEach(field => {
      initialStates[field.id] = {
        value: initialValues[field.id] || field.defaultValue || '',
        visible: true,
        required: field.required || false,
        disabled: false,
        errors: [],
        touched: false,
        medicalPriority: field.medicalPriority
      };
    });

    setFieldStates(initialStates);
    setCurrentFieldValues({ ...initialValues });
  }, [fields, initialValues]);

  // Evaluate conditional rules
  const evaluateRule = useCallback((rule: ConditionalRule, fieldValues: Record<string, any>): boolean => {
    const sourceValue = fieldValues[rule.sourceField];
    const { operator, value } = rule;

    switch (operator) {
      case 'equals':
        return sourceValue === value;
      case 'not_equals':
        return sourceValue !== value;
      case 'contains':
        return String(sourceValue || '').toLowerCase().includes(String(value || '').toLowerCase());
      case 'not_contains':
        return !String(sourceValue || '').toLowerCase().includes(String(value || '').toLowerCase());
      case 'greater_than':
        return Number(sourceValue) > Number(value);
      case 'less_than':
        return Number(sourceValue) < Number(value);
      case 'greater_than_or_equal':
        return Number(sourceValue) >= Number(value);
      case 'less_than_or_equal':
        return Number(sourceValue) <= Number(value);
      case 'is_empty':
        return !sourceValue || sourceValue === '' || (Array.isArray(sourceValue) && sourceValue.length === 0);
      case 'is_not_empty':
        return sourceValue && sourceValue !== '' && (!Array.isArray(sourceValue) || sourceValue.length > 0);
      case 'starts_with':
        return String(sourceValue || '').toLowerCase().startsWith(String(value || '').toLowerCase());
      case 'ends_with':
        return String(sourceValue || '').toLowerCase().endsWith(String(value || '').toLowerCase());
      case 'regex_match':
        try {
          const regex = new RegExp(value);
          return regex.test(String(sourceValue || ''));
        } catch {
          return false;
        }
      default:
        return false;
    }
  }, []);

  // Apply conditional rules
  const applyConditionalRules = useCallback((fieldValues: Record<string, any>) => {
    setFieldStates(prevStates => {
      const newStates = { ...prevStates };

      // Reset all fields to their default state
      Object.keys(newStates).forEach(fieldId => {
        const field = fields.find(f => f.id === fieldId);
        if (field) {
          newStates[fieldId] = {
            ...newStates[fieldId],
            visible: true,
            required: field.required || false,
            disabled: false
          };
        }
      });

      // Apply all conditional rules
      fields.forEach(field => {
        if (field.conditionalRules) {
          field.conditionalRules.forEach(rule => {
            if (evaluateRule(rule, fieldValues)) {
              rule.targetFields.forEach(targetFieldId => {
                if (newStates[targetFieldId]) {
                  switch (rule.action) {
                    case 'show':
                      newStates[targetFieldId].visible = true;
                      break;
                    case 'hide':
                      newStates[targetFieldId].visible = false;
                      break;
                    case 'require':
                      newStates[targetFieldId].required = true;
                      break;
                    case 'disable':
                      newStates[targetFieldId].disabled = true;
                      break;
                    case 'set_value':
                      if (rule.actionValue !== undefined) {
                        newStates[targetFieldId].value = rule.actionValue;
                        fieldValues[targetFieldId] = rule.actionValue;
                      }
                      break;
                  }

                  // Update medical priority if specified
                  if (rule.medicalPriority) {
                    newStates[targetFieldId].medicalPriority = rule.medicalPriority;
                  }
                }
              });
            }
          });
        }
      });

      return newStates;
    });
  }, [fields, evaluateRule]);

  // Validate field value
  const validateField = useCallback((field: FieldDefinition, value: any): string[] => {
    const errors: string[] = [];

    // Required validation
    if (fieldStates[field.id]?.required && (!value || value === '')) {
      errors.push(`${field.label} is required`);
      return errors; // Return early for required fields
    }

    // Skip other validations if field is empty and not required
    if (!value || value === '') {
      return errors;
    }

    // Type-specific validation
    switch (field.type) {
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          errors.push('Please enter a valid email address');
        }
        break;

      case 'phone':
        const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
        if (!phoneRegex.test(value.replace(/[\s\-\(\)]/g, ''))) {
          errors.push('Please enter a valid phone number');
        }
        break;

      case 'number':
        if (isNaN(Number(value))) {
          errors.push('Please enter a valid number');
        }
        break;

      case 'date':
        if (isNaN(Date.parse(value))) {
          errors.push('Please enter a valid date');
        }
        break;
    }

    // Custom validation rules
    if (field.validation) {
      const { pattern, min, max, minLength, maxLength, custom } = field.validation;

      if (pattern) {
        const regex = new RegExp(pattern);
        if (!regex.test(value)) {
          errors.push(`${field.label} format is invalid`);
        }
      }

      if (field.type === 'number') {
        const numValue = Number(value);
        if (min !== undefined && numValue < min) {
          errors.push(`${field.label} must be at least ${min}`);
        }
        if (max !== undefined && numValue > max) {
          errors.push(`${field.label} must be no more than ${max}`);
        }
      }

      if (typeof value === 'string') {
        if (minLength !== undefined && value.length < minLength) {
          errors.push(`${field.label} must be at least ${minLength} characters`);
        }
        if (maxLength !== undefined && value.length > maxLength) {
          errors.push(`${field.label} must be no more than ${maxLength} characters`);
        }
      }

      if (custom) {
        const customError = custom(value);
        if (customError) {
          errors.push(customError);
        }
      }
    }

    return errors;
  }, [fieldStates]);

  // Handle field value change
  const handleFieldChange = useCallback((fieldId: string, value: any) => {
    const newFieldValues = { ...currentFieldValues, [fieldId]: value };
    setCurrentFieldValues(newFieldValues);

    // Update field state
    setFieldStates(prev => ({
      ...prev,
      [fieldId]: {
        ...prev[fieldId],
        value,
        touched: true,
        errors: validateField(fields.find(f => f.id === fieldId)!, value)
      }
    }));

    // Apply conditional rules
    applyConditionalRules(newFieldValues);

    // Notify parent component
    onFieldChange(fieldId, value);
  }, [currentFieldValues, fields, validateField, applyConditionalRules, onFieldChange]);

  // Validate all fields and notify parent
  useEffect(() => {
    const allErrors: Record<string, string[]> = {};
    let isValid = true;

    Object.keys(fieldStates).forEach(fieldId => {
      const field = fields.find(f => f.id === fieldId);
      if (field && fieldStates[fieldId].visible) {
        const errors = validateField(field, fieldStates[fieldId].value);
        if (errors.length > 0) {
          allErrors[fieldId] = errors;
          isValid = false;
        }
      }
    });

    onValidationChange?.(isValid, allErrors);
  }, [fieldStates, fields, validateField, onValidationChange]);

  // Group fields by priority for medical mode
  const groupedFields = useMemo(() => {
    if (!medicalMode || !groupByPriority) {
      return { all: fields };
    }

    const groups: Record<string, FieldDefinition[]> = {
      critical: [],
      high: [],
      medium: [],
      low: []
    };

    fields.forEach(field => {
      const priority = field.medicalPriority || 'low';
      groups[priority].push(field);
    });

    return groups;
  }, [fields, medicalMode, groupByPriority]);

  // Get priority color
  const getPriorityColor = (priority: MedicalPriority) => {
    switch (priority) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  // Get priority icon
  const getPriorityIcon = (priority: MedicalPriority) => {
    switch (priority) {
      case 'critical': return <XCircleIcon className="w-4 h-4" />;
      case 'high': return <ExclamationTriangleIcon className="w-4 h-4" />;
      case 'medium': return <InformationCircleIcon className="w-4 h-4" />;
      case 'low': return <CheckCircleIcon className="w-4 h-4" />;
      default: return <InformationCircleIcon className="w-4 h-4" />;
    }
  };

  // Render field input
  const renderFieldInput = (field: FieldDefinition) => {
    const fieldState = fieldStates[field.id];
    if (!fieldState?.visible) return null;

    const baseInputClasses = `
      w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500
      transition-colors duration-200 text-base
      ${fieldState.disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
      ${fieldState.errors.length > 0 ? 'border-red-300' : 'border-gray-300'}
      ${medicalMode ? 'min-h-[44px]' : ''}
    `;

    const commonProps = {
      id: field.id,
      name: field.name,
      value: fieldState.value || '',
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
        handleFieldChange(field.id, e.target.value),
      disabled: fieldState.disabled || disabled,
      required: fieldState.required,
      placeholder: field.placeholder,
      className: baseInputClasses
    };

    switch (field.type) {
      case 'textarea':
        return (
          <textarea
            {...commonProps}
            rows={4}
            className={`${baseInputClasses} resize-vertical`}
          />
        );

      case 'select':
        return (
          <select {...commonProps}>
            <option value="">Select an option...</option>
            {field.options?.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
                {option.medicalCode && ` (${option.medicalCode})`}
              </option>
            ))}
          </select>
        );

      case 'checkbox':
        return (
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id={field.id}
              name={field.name}
              checked={fieldState.value || false}
              onChange={(e) => handleFieldChange(field.id, e.target.checked)}
              disabled={fieldState.disabled || disabled}
              className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor={field.id} className="text-sm text-gray-700">
              {field.label}
            </label>
          </div>
        );

      case 'radio':
        return (
          <div className="space-y-2">
            {field.options?.map(option => (
              <div key={option.value} className="flex items-center space-x-2">
                <input
                  type="radio"
                  id={`${field.id}_${option.value}`}
                  name={field.name}
                  value={option.value}
                  checked={fieldState.value === option.value}
                  onChange={(e) => handleFieldChange(field.id, e.target.value)}
                  disabled={fieldState.disabled || disabled}
                  className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <label htmlFor={`${field.id}_${option.value}`} className="text-sm text-gray-700">
                  {option.label}
                  {option.medicalCode && ` (${option.medicalCode})`}
                </label>
              </div>
            ))}
          </div>
        );

      case 'file':
        return (
          <input
            type="file"
            {...commonProps}
            onChange={(e) => handleFieldChange(field.id, e.target.files?.[0] || null)}
            className={`${baseInputClasses} file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100`}
          />
        );

      default:
        return (
          <input
            type={field.type}
            {...commonProps}
          />
        );
    }
  };

  // Render field group
  const renderFieldGroup = (groupFields: FieldDefinition[], groupName?: string) => (
    <div key={groupName || 'all'} className="space-y-4">
      {groupName && medicalMode && (
        <div className={`p-3 rounded-lg border ${getPriorityColor(groupName as MedicalPriority)}`}>
          <div className="flex items-center space-x-2">
            {getPriorityIcon(groupName as MedicalPriority)}
            <h3 className="font-semibold capitalize">{groupName} Priority Fields</h3>
          </div>
        </div>
      )}

      {groupFields.map(field => {
        const fieldState = fieldStates[field.id];
        if (!fieldState?.visible) return null;

        return (
          <div key={field.id} className="space-y-2">
            {field.type !== 'checkbox' && (
              <label htmlFor={field.id} className="block text-sm font-medium text-gray-700">
                {field.label}
                {fieldState.required && <span className="text-red-500 ml-1">*</span>}
                {showPriorityIndicators && field.medicalPriority && (
                  <span className={`ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(field.medicalPriority)}`}>
                    {getPriorityIcon(field.medicalPriority)}
                    <span className="ml-1 capitalize">{field.medicalPriority}</span>
                  </span>
                )}
              </label>
            )}

            {renderFieldInput(field)}

            {field.helpText && (
              <p className="text-sm text-gray-500">{field.helpText}</p>
            )}

            {fieldState.errors.length > 0 && (
              <div className="space-y-1">
                {fieldState.errors.map((error, index) => (
                  <p key={index} className="text-sm text-red-600 flex items-center">
                    <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
                    {error}
                  </p>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Debug panel */}
      {debugMode && (
        <div className="bg-gray-100 p-4 rounded-lg border">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-800">Debug Information</h3>
            <button
              onClick={() => setFieldStates(prev => ({ ...prev }))}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Refresh
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Field Values:</h4>
              <pre className="bg-white p-2 rounded border text-xs overflow-auto max-h-32">
                {JSON.stringify(currentFieldValues, null, 2)}
              </pre>
            </div>

            <div>
              <h4 className="font-medium text-gray-700 mb-2">Field States:</h4>
              <pre className="bg-white p-2 rounded border text-xs overflow-auto max-h-32">
                {JSON.stringify(
                  Object.fromEntries(
                    Object.entries(fieldStates).map(([key, state]) => [
                      key,
                      {
                        visible: state.visible,
                        required: state.required,
                        disabled: state.disabled,
                        errors: state.errors.length,
                        priority: state.medicalPriority
                      }
                    ])
                  ),
                  null,
                  2
                )}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* Fields */}
      {groupByPriority && medicalMode ? (
        <div className="space-y-8">
          {Object.entries(groupedFields).map(([groupName, groupFields]) =>
            groupFields.length > 0 ? renderFieldGroup(groupFields, groupName) : null
          )}
        </div>
      ) : (
        renderFieldGroup(fields)
      )}
    </div>
  );
};