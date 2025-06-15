import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { CheckCircleIcon, ExclamationTriangleIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { invitationService } from '../../services/invitationService';
import { InvitationValidationResponse, InvitationType } from '../../types/invitation';
import PasswordStrengthIndicator from '../../components/invitations/PasswordStrengthIndicator';
import RoleBasedFields from '../../components/invitations/RoleBasedFields';

interface ActivationFormData {
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  phone: string;
  // Role-specific fields
  npi?: string;
  licenseNumber?: string;
  practiceName?: string;
  companyAffiliation?: string;
  territory?: string;
  acceptTerms: boolean;
}

const ActivatePage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  // State management
  const [validationData, setValidationData] = useState<InvitationValidationResponse | null>(null);
  const [isValidating, setIsValidating] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Form data
  const [formData, setFormData] = useState<ActivationFormData>({
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phone: '',
    acceptTerms: false
  });

  // Form validation errors
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Validate invitation token on mount
  useEffect(() => {
    if (!token) {
      setError('Invalid activation link');
      setIsValidating(false);
      return;
    }

    const validateToken = async () => {
      try {
        const response = await invitationService.validateInvitationToken(token);
        setValidationData(response);

        if (!response.is_valid) {
          setError(response.error_message || 'Invalid or expired invitation');
        } else if (!response.can_accept) {
          setError('This invitation cannot be accepted');
        } else if (response.invitation) {
          // Pre-fill form with invitation data
          setFormData(prev => ({
            ...prev,
            firstName: response.invitation.first_name || '',
            lastName: response.invitation.last_name || ''
          }));
        }
      } catch (err: any) {
        setError(err.message || 'Failed to validate invitation');
      } finally {
        setIsValidating(false);
      }
    };

    validateToken();
  }, [token]);

  // Handle form field changes
  const handleFieldChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Clear field error when user starts typing
    if (fieldErrors[field]) {
      setFieldErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    // Required fields
    if (!formData.firstName.trim()) {
      errors.firstName = 'First name is required';
    }
    if (!formData.lastName.trim()) {
      errors.lastName = 'Last name is required';
    }
    if (!formData.phone.trim()) {
      errors.phone = 'Phone number is required';
    }
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    }
    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    if (!formData.acceptTerms) {
      errors.acceptTerms = 'You must accept the terms and conditions';
    }

    // Role-specific validation
    if (validationData?.invitation?.invitation_type === 'doctor') {
      if (!formData.npi?.trim()) {
        errors.npi = 'NPI number is required for doctors';
      }
      if (!formData.licenseNumber?.trim()) {
        errors.licenseNumber = 'License number is required for doctors';
      }
      if (!formData.practiceName?.trim()) {
        errors.practiceName = 'Practice name is required for doctors';
      }
    }

    if (['ivr_company', 'shipping_logistics'].includes(validationData?.invitation?.invitation_type || '')) {
      if (!formData.companyAffiliation?.trim()) {
        errors.companyAffiliation = 'Company affiliation is required';
      }
    }

    if (['sales', 'distributor'].includes(validationData?.invitation?.invitation_type || '')) {
      if (!formData.territory?.trim()) {
        errors.territory = 'Territory information is required';
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Prepare activation data
      const activationData = {
        password: formData.password,
        first_name: formData.firstName,
        last_name: formData.lastName,
        phone: formData.phone,
        additional_data: {
          ...(formData.npi && { npi: formData.npi }),
          ...(formData.licenseNumber && { license_number: formData.licenseNumber }),
          ...(formData.practiceName && { practice_name: formData.practiceName }),
          ...(formData.companyAffiliation && { company_affiliation: formData.companyAffiliation }),
          ...(formData.territory && { territory: formData.territory })
        }
      };

      // Call activation endpoint
      const response = await fetch('/api/auth/activate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          ...activationData
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Activation failed');
      }

      const result = await response.json();

      // Store authentication data
      localStorage.setItem('authToken', result.access_token);
      localStorage.setItem('user', JSON.stringify(result.user));

      setSuccess(true);

      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);

    } catch (err: any) {
      setError(err.message || 'Failed to activate account');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state
  if (isValidating) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-600 mx-auto mb-4"></div>
            <h2 className="text-lg font-medium text-slate-900 mb-2">Validating Invitation</h2>
            <p className="text-sm text-slate-600">Please wait while we verify your invitation...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !validationData?.is_valid) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-lg font-medium text-slate-900 mb-2">Invalid Invitation</h2>
            <p className="text-sm text-slate-600 mb-6">{error}</p>
            <Link
              to="/login"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-slate-600 hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
            >
              Go to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <CheckCircleIcon className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h2 className="text-lg font-medium text-slate-900 mb-2">Account Activated!</h2>
            <p className="text-sm text-slate-600 mb-6">
              Your account has been successfully activated. You will be redirected to your dashboard shortly.
            </p>
            <Link
              to="/dashboard"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-slate-600 hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
            >
              Go to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Main activation form
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Activate Your Account</h1>
          <p className="mt-2 text-sm text-slate-600">
            Complete your registration to access the Healthcare IVR Platform
          </p>
        </div>

        {/* Invitation Info */}
        {validationData?.invitation && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="text-sm">
              <p className="text-blue-800 font-medium">
                You've been invited as: {validationData.invitation.role_name}
              </p>
              <p className="text-blue-600 mt-1">
                Email: {validationData.invitation.email}
              </p>
              {validationData.expires_in_hours && (
                <p className="text-blue-600 mt-1">
                  Expires in: {Math.round(validationData.expires_in_hours / 24)} days
                </p>
              )}
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-2 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        )}

        {/* Activation Form */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-slate-900">Personal Information</h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-slate-700">
                    First Name *
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => handleFieldChange('firstName', e.target.value)}
                    className={`mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-slate-500 focus:ring-slate-500 sm:text-sm ${
                      fieldErrors.firstName ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''
                    }`}
                    placeholder="Enter first name"
                  />
                  {fieldErrors.firstName && (
                    <p className="mt-1 text-sm text-red-600">{fieldErrors.firstName}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-slate-700">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => handleFieldChange('lastName', e.target.value)}
                    className={`mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-slate-500 focus:ring-slate-500 sm:text-sm ${
                      fieldErrors.lastName ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''
                    }`}
                    placeholder="Enter last name"
                  />
                  {fieldErrors.lastName && (
                    <p className="mt-1 text-sm text-red-600">{fieldErrors.lastName}</p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-slate-700">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleFieldChange('phone', e.target.value)}
                  className={`mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-slate-500 focus:ring-slate-500 sm:text-sm ${
                    fieldErrors.phone ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''
                  }`}
                  placeholder="(555) 123-4567"
                />
                {fieldErrors.phone && (
                  <p className="mt-1 text-sm text-red-600">{fieldErrors.phone}</p>
                )}
              </div>
            </div>

            {/* Role-based Fields */}
            <RoleBasedFields
              invitationType={validationData?.invitation?.invitation_type as InvitationType}
              formData={formData}
              fieldErrors={fieldErrors}
              onFieldChange={handleFieldChange}
            />

            {/* Password Fields */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-slate-900">Create Password</h3>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                  Password *
                </label>
                <div className="mt-1 relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    value={formData.password}
                    onChange={(e) => handleFieldChange('password', e.target.value)}
                    className={`block w-full rounded-md border-slate-300 shadow-sm focus:border-slate-500 focus:ring-slate-500 sm:text-sm pr-10 ${
                      fieldErrors.password ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''
                    }`}
                    placeholder="Enter password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="h-5 w-5 text-slate-400" />
                    ) : (
                      <EyeIcon className="h-5 w-5 text-slate-400" />
                    )}
                  </button>
                </div>
                {fieldErrors.password && (
                  <p className="mt-1 text-sm text-red-600">{fieldErrors.password}</p>
                )}
                <PasswordStrengthIndicator password={formData.password} />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700">
                  Confirm Password *
                </label>
                <div className="mt-1 relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={(e) => handleFieldChange('confirmPassword', e.target.value)}
                    className={`block w-full rounded-md border-slate-300 shadow-sm focus:border-slate-500 focus:ring-slate-500 sm:text-sm pr-10 ${
                      fieldErrors.confirmPassword ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''
                    }`}
                    placeholder="Confirm password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeSlashIcon className="h-5 w-5 text-slate-400" />
                    ) : (
                      <EyeIcon className="h-5 w-5 text-slate-400" />
                    )}
                  </button>
                </div>
                {fieldErrors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">{fieldErrors.confirmPassword}</p>
                )}
              </div>
            </div>

            {/* Terms Acceptance */}
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="acceptTerms"
                  type="checkbox"
                  checked={formData.acceptTerms}
                  onChange={(e) => handleFieldChange('acceptTerms', e.target.checked)}
                  className={`focus:ring-slate-500 h-4 w-4 text-slate-600 border-slate-300 rounded ${
                    fieldErrors.acceptTerms ? 'border-red-300' : ''
                  }`}
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="acceptTerms" className="text-slate-700">
                  I accept the{' '}
                  <a href="/terms" className="text-slate-600 hover:text-slate-500 underline">
                    Terms and Conditions
                  </a>{' '}
                  and{' '}
                  <a href="/privacy" className="text-slate-600 hover:text-slate-500 underline">
                    Privacy Policy
                  </a>
                </label>
                {fieldErrors.acceptTerms && (
                  <p className="mt-1 text-red-600">{fieldErrors.acceptTerms}</p>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-slate-600 hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Activating Account...
                </>
              ) : (
                'Activate Account'
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-sm text-slate-600">
            Already have an account?{' '}
            <Link to="/login" className="text-slate-600 hover:text-slate-500 underline">
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ActivatePage;