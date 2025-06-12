import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UserPlusIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
import {
  HomeIcon,
  UsersIcon,
  PhoneIcon,
  ChartBarIcon,
  DocumentTextIcon,
  CurrencyDollarIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/solid';
import { useAuth } from '../../contexts/AuthContext';
import UnifiedDashboardLayout from '../../components/shared/layout/UnifiedDashboardLayout';
import { createSalesNavigation } from '../../components/sales/SimpleSalesDashboard';

interface DoctorFormData {
  // Personal Information
  firstName: string;
  lastName: string;
  professionalTitle: string;
  specialty: string;
  email: string;
  phone: string;

  // Professional Credentials
  licenseNumber: string;
  npiNumber: string;
  medicareProvider: string;
  medicaidProvider: string;
  taxId: string;

  // Facility Information
  primaryFacility: string;
  officeContactName: string;
  officePhone: string;
  officeFax: string;

  // Shipping Information
  streetAddress: string;
  city: string;
  state: string;
  zipCode: string;
  shippingContactName: string;
  shippingPhone: string;
  deliveryInstructions: string;
}

interface FormErrors {
  [key: string]: string;
}

const AddDoctor: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout, getToken } = useAuth();

  const [formData, setFormData] = useState<DoctorFormData>({
    // Personal Information
    firstName: '',
    lastName: '',
    professionalTitle: 'Dr.',
    specialty: '',
    email: '',
    phone: '',

    // Professional Credentials
    licenseNumber: '',
    npiNumber: '',
    medicareProvider: '',
    medicaidProvider: '',
    taxId: '',

    // Facility Information
    primaryFacility: '',
    officeContactName: '',
    officePhone: '',
    officeFax: '',

    // Shipping Information
    streetAddress: '',
    city: '',
    state: '',
    zipCode: '',
    shippingContactName: '',
    shippingPhone: '',
    deliveryInstructions: ''
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string>('');

  // Check if user can manage doctors
  const canManageDoctors = user?.role && ['Sales', 'Distributor', 'Master Distributor', 'Admin', 'CHP Admin'].includes(user.role);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navigation = createSalesNavigation(logout);

  const userInfo = {
    name: user?.first_name && user?.last_name ? `${user.first_name} ${user.last_name}` : user?.username || 'User',
    email: user?.email || '',
    role: user?.role || 'Sales'
  };

  // Professional titles dropdown options
  const professionalTitles = [
    'Dr.',
    'MD',
    'DO',
    'DPM',
    'DDS',
    'DMD',
    'PharmD',
    'PhD',
    'NP',
    'PA',
    'RN'
  ];

  // Medical specialties dropdown options
  const medicalSpecialties = [
    'Wound Care Specialist',
    'Dermatology',
    'Plastic Surgery',
    'General Surgery',
    'Vascular Surgery',
    'Podiatry',
    'Internal Medicine',
    'Family Medicine',
    'Emergency Medicine',
    'Orthopedic Surgery',
    'Infectious Disease',
    'Endocrinology',
    'Cardiology',
    'Oncology',
    'Other'
  ];

  // US States dropdown options
  const usStates = [
    'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
    'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
    'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
    'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
    'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
  ];

  const handleInputChange = (field: keyof DoctorFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const formatPhoneNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
    if (match) {
      return `(${match[1]}) ${match[2]}-${match[3]}`;
    }
    return value;
  };

  const formatNPI = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    return cleaned.slice(0, 10);
  };

  const formatTaxId = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{2})(\d{7})$/);
    if (match) {
      return `${match[1]}-${match[2]}`;
    }
    return value;
  };

  const formatZipCode = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 5) {
      return cleaned;
    } else if (cleaned.length <= 9) {
      return `${cleaned.slice(0, 5)}-${cleaned.slice(5)}`;
    }
    return value;
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Personal Information - Required fields
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    if (!formData.specialty.trim()) {
      newErrors.specialty = 'Specialty is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^\(\d{3}\) \d{3}-\d{4}$/.test(formData.phone)) {
      newErrors.phone = 'Phone must be in format (555) 123-4567';
    }

    // Professional Credentials - Required fields
    if (!formData.licenseNumber.trim()) {
      newErrors.licenseNumber = 'License number is required';
    }

    if (!formData.npiNumber.trim()) {
      newErrors.npiNumber = 'NPI number is required';
    } else if (!/^\d{10}$/.test(formData.npiNumber)) {
      newErrors.npiNumber = 'NPI must be exactly 10 digits';
    }

    if (formData.taxId && !/^\d{2}-\d{7}$/.test(formData.taxId)) {
      newErrors.taxId = 'Tax ID must be in format XX-XXXXXXX';
    }

    // Facility Information - Required fields
    if (!formData.primaryFacility.trim()) {
      newErrors.primaryFacility = 'Primary facility is required';
    }

    // Shipping Information - Required fields
    if (!formData.streetAddress.trim()) {
      newErrors.streetAddress = 'Street address is required';
    }

    if (!formData.city.trim()) {
      newErrors.city = 'City is required';
    }

    if (!formData.state.trim()) {
      newErrors.state = 'State is required';
    }

    if (!formData.zipCode.trim()) {
      newErrors.zipCode = 'ZIP code is required';
    } else if (!/^\d{5}(-\d{4})?$/.test(formData.zipCode)) {
      newErrors.zipCode = 'ZIP code must be XXXXX or XXXXX-XXXX format';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Get token from AuthContext
      const token = getToken();
      console.log('[AddDoctor] Token available:', !!token);
      console.log('[AddDoctor] Current user:', user?.email, 'Role:', user?.role);

      if (!token) {
        throw new Error('Authentication required. Please log in again.');
      }

      // Prepare doctor data for sales representative
      const doctorData = {
        // Personal Information
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        date_of_birth: formData.dateOfBirth || null,

        // Professional Information
        npi_number: formData.npiNumber,
        medical_license_number: formData.licenseNumber,
        dea_number: formData.deaNumber || null,
        tax_id: formData.taxId || null,
        specialty: formData.specialty,
        board_certifications: formData.boardCertifications ? [formData.boardCertifications] : [],
        years_of_experience: formData.yearsOfExperience ? parseInt(formData.yearsOfExperience) : null,
        wound_care_percentage: formData.woundCarePercentage ? parseInt(formData.woundCarePercentage) : null,

        // Practice Information
        practice_name: formData.primaryFacility,
        practice_address_line1: formData.streetAddress,
        practice_address_line2: formData.practiceAddressLine2 || null,
        practice_city: formData.city,
        practice_state: formData.state,
        practice_zip: formData.zipCode,
        practice_phone: formData.officePhone || null,
        practice_fax: formData.officeFax || null,

        // Shipping Information
        shipping_address_line1: formData.streetAddress,
        shipping_address_line2: formData.shippingAddressLine2 || null,
        shipping_city: formData.city,
        shipping_state: formData.state,
        shipping_zip: formData.zipCode,

        // Additional Information
        preferred_contact_method: formData.preferredContactMethod || 'email',
        emergency_contact_name: formData.emergencyContactName || null,
        emergency_contact_phone: formData.emergencyContactPhone || null,
        notes: formData.notes || null,

        // Sales context - this doctor is being added by a sales rep
        added_by_sales: true,
        sales_rep_id: user?.sub, // Current sales rep's ID
        sales_rep_email: user?.email
      };

      console.log('[AddDoctor] Submitting doctor data:', {
        email: doctorData.email,
        name: `${doctorData.first_name} ${doctorData.last_name}`,
        npi: doctorData.npi_number,
        sales_rep: doctorData.sales_rep_email
      });

      // Make API call to create doctor
      const response = await fetch('http://localhost:8000/api/v1/doctors/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(doctorData),
      });

      console.log('[AddDoctor] API Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('[AddDoctor] API Error:', errorData);

        if (response.status === 401) {
          throw new Error('Authentication failed. Please log in again.');
        } else if (response.status === 403) {
          throw new Error('You do not have permission to add doctors. Please contact your administrator.');
        } else if (response.status === 422) {
          throw new Error(errorData.detail || 'Invalid data provided. Please check all required fields.');
        } else {
          throw new Error(errorData.detail || `Server error (${response.status}). Please try again.`);
        }
      }

      const result = await response.json();
      console.log('[AddDoctor] Doctor created successfully:', result);

      // Show success message
      alert(`Doctor ${doctorData.first_name} ${doctorData.last_name} has been successfully added to your network!`);

      // Navigate back to doctors list
      navigate('/sales/doctors');

    } catch (error: any) {
      console.error('[AddDoctor] Error creating doctor:', error);
      setSubmitError(error.message || 'Failed to create doctor. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getSectionCompletion = (section: number): boolean => {
    switch (section) {
      case 1: // Personal Information
        return !!(formData.firstName && formData.lastName && formData.specialty && formData.email && formData.phone);
      case 2: // Professional Credentials
        return !!(formData.licenseNumber && formData.npiNumber);
      case 3: // Facility Information
        return !!(formData.primaryFacility);
      case 4: // Shipping Information
        return !!(formData.streetAddress && formData.city && formData.state && formData.zipCode);
      default:
        return false;
    }
  };

  const renderSectionIndicator = (section: number, title: string) => (
    <div className="flex items-center space-x-2 mb-4">
      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
        getSectionCompletion(section)
          ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
          : 'bg-slate-100 text-slate-500 border border-slate-200'
      }`}>
        {getSectionCompletion(section) ? <CheckCircleIcon className="w-4 h-4" /> : section}
      </div>
      <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
    </div>
  );

  return (
    <UnifiedDashboardLayout navigation={navigation} userInfo={userInfo}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/sales/doctors')}
              className="flex items-center text-slate-600 hover:text-slate-900 transition-colors"
            >
              <ArrowLeftIcon className="h-5 w-5 mr-2" />
              Back to Doctors
            </button>
            <div className="h-6 w-px bg-slate-300" />
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
                <UserPlusIcon className="h-6 w-6 text-slate-600" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-slate-900">Add New Doctor</h1>
                <p className="text-sm text-slate-600">Complete doctor registration form</p>
              </div>
            </div>
          </div>
        </div>

        {/* Form Container */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <form onSubmit={handleSubmit} className="p-6">
            <div className="space-y-8">
              {/* Success Display */}
              {submitSuccess && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 flex items-start space-x-3">
                  <CheckCircleIcon className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="text-sm font-medium text-emerald-800">Doctor Created Successfully!</h4>
                    <pre className="text-sm text-emerald-700 mt-1 whitespace-pre-wrap">{submitSuccess}</pre>
                  </div>
                </div>
              )}

              {/* Error Display */}
              {submitError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
                  <ExclamationTriangleIcon className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="text-sm font-medium text-red-800">Error Creating Doctor</h4>
                    <p className="text-sm text-red-700 mt-1">{submitError}</p>
                  </div>
                </div>
              )}

              {/* Section 1: Personal Information */}
              <div className="bg-slate-50 p-6 rounded-lg">
                {renderSectionIndicator(1, 'Personal Information')}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-slate-500 focus:border-slate-500 ${
                        errors.firstName ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Enter first name"
                      disabled={isSubmitting}
                    />
                    {errors.firstName && (
                      <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-slate-500 focus:border-slate-500 ${
                        errors.lastName ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Enter last name"
                      disabled={isSubmitting}
                    />
                    {errors.lastName && (
                      <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="professionalTitle" className="block text-sm font-medium text-gray-700 mb-1">
                      Professional Title
                    </label>
                    <select
                      id="professionalTitle"
                      value={formData.professionalTitle}
                      onChange={(e) => handleInputChange('professionalTitle', e.target.value)}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-slate-500 focus:border-slate-500"
                      disabled={isSubmitting}
                    >
                      <option value="">Select title</option>
                      {professionalTitles.map(title => (
                        <option key={title} value={title}>{title}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="specialty" className="block text-sm font-medium text-gray-700 mb-1">
                      Specialty <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="specialty"
                      value={formData.specialty}
                      onChange={(e) => handleInputChange('specialty', e.target.value)}
                      className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-slate-500 focus:border-slate-500 ${
                        errors.specialty ? 'border-red-300' : 'border-gray-300'
                      }`}
                      disabled={isSubmitting}
                    >
                      <option value="">Select specialty</option>
                      {medicalSpecialties.map(specialty => (
                        <option key={specialty} value={specialty}>{specialty}</option>
                      ))}
                    </select>
                    {errors.specialty && (
                      <p className="mt-1 text-sm text-red-600">{errors.specialty}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-slate-500 focus:border-slate-500 ${
                        errors.email ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="doctor@example.com"
                      disabled={isSubmitting}
                    />
                    {errors.email && (
                      <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', formatPhoneNumber(e.target.value))}
                      className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-slate-500 focus:border-slate-500 ${
                        errors.phone ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="(555) 123-4567"
                      disabled={isSubmitting}
                    />
                    {errors.phone && (
                      <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Section 2: Professional Credentials */}
              <div className="bg-slate-50 p-6 rounded-lg">
                {renderSectionIndicator(2, 'Professional Credentials')}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="licenseNumber" className="block text-sm font-medium text-gray-700 mb-1">
                      License Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="licenseNumber"
                      value={formData.licenseNumber}
                      onChange={(e) => handleInputChange('licenseNumber', e.target.value)}
                      className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-slate-500 focus:border-slate-500 ${
                        errors.licenseNumber ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="MD123456"
                      disabled={isSubmitting}
                    />
                    {errors.licenseNumber && (
                      <p className="mt-1 text-sm text-red-600">{errors.licenseNumber}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="npiNumber" className="block text-sm font-medium text-gray-700 mb-1">
                      NPI Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="npiNumber"
                      value={formData.npiNumber}
                      onChange={(e) => handleInputChange('npiNumber', formatNPI(e.target.value))}
                      className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-slate-500 focus:border-slate-500 ${
                        errors.npiNumber ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="1234567890"
                      disabled={isSubmitting}
                    />
                    {errors.npiNumber && (
                      <p className="mt-1 text-sm text-red-600">{errors.npiNumber}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="medicareProvider" className="block text-sm font-medium text-gray-700 mb-1">
                      Medicare Provider # (PTAN)
                    </label>
                    <input
                      type="text"
                      id="medicareProvider"
                      value={formData.medicareProvider}
                      onChange={(e) => handleInputChange('medicareProvider', e.target.value)}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-slate-500 focus:border-slate-500"
                      placeholder="K234567"
                      disabled={isSubmitting}
                    />
                  </div>

                  <div>
                    <label htmlFor="medicaidProvider" className="block text-sm font-medium text-gray-700 mb-1">
                      Medicaid Provider #
                    </label>
                    <input
                      type="text"
                      id="medicaidProvider"
                      value={formData.medicaidProvider}
                      onChange={(e) => handleInputChange('medicaidProvider', e.target.value)}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-slate-500 focus:border-slate-500"
                      placeholder="MP987654"
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label htmlFor="taxId" className="block text-sm font-medium text-gray-700 mb-1">
                      Tax ID
                    </label>
                    <input
                      type="text"
                      id="taxId"
                      value={formData.taxId}
                      onChange={(e) => handleInputChange('taxId', formatTaxId(e.target.value))}
                      className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-slate-500 focus:border-slate-500 ${
                        errors.taxId ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="12-3456789"
                      disabled={isSubmitting}
                    />
                    {errors.taxId && (
                      <p className="mt-1 text-sm text-red-600">{errors.taxId}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Section 3: Facility Information */}
              <div className="bg-slate-50 p-6 rounded-lg">
                {renderSectionIndicator(3, 'Facility Information')}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="primaryFacility" className="block text-sm font-medium text-gray-700 mb-1">
                      Primary Facility <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="primaryFacility"
                      value={formData.primaryFacility}
                      onChange={(e) => handleInputChange('primaryFacility', e.target.value)}
                      className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-slate-500 focus:border-slate-500 ${
                        errors.primaryFacility ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="City General Hospital"
                      disabled={isSubmitting}
                    />
                    {errors.primaryFacility && (
                      <p className="mt-1 text-sm text-red-600">{errors.primaryFacility}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="officeContactName" className="block text-sm font-medium text-gray-700 mb-1">
                      Office Contact Name
                    </label>
                    <input
                      type="text"
                      id="officeContactName"
                      value={formData.officeContactName}
                      onChange={(e) => handleInputChange('officeContactName', e.target.value)}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-slate-500 focus:border-slate-500"
                      placeholder="Sarah Johnson"
                      disabled={isSubmitting}
                    />
                  </div>

                  <div>
                    <label htmlFor="officePhone" className="block text-sm font-medium text-gray-700 mb-1">
                      Office Phone
                    </label>
                    <input
                      type="tel"
                      id="officePhone"
                      value={formData.officePhone}
                      onChange={(e) => handleInputChange('officePhone', formatPhoneNumber(e.target.value))}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-slate-500 focus:border-slate-500"
                      placeholder="(555) 234-5678"
                      disabled={isSubmitting}
                    />
                  </div>

                  <div>
                    <label htmlFor="officeFax" className="block text-sm font-medium text-gray-700 mb-1">
                      Office Fax
                    </label>
                    <input
                      type="tel"
                      id="officeFax"
                      value={formData.officeFax}
                      onChange={(e) => handleInputChange('officeFax', formatPhoneNumber(e.target.value))}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-slate-500 focus:border-slate-500"
                      placeholder="(555) 234-5679"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              </div>

              {/* Section 4: Shipping Information */}
              <div className="bg-slate-50 p-6 rounded-lg">
                {renderSectionIndicator(4, 'Shipping Information')}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label htmlFor="streetAddress" className="block text-sm font-medium text-gray-700 mb-1">
                      Street Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="streetAddress"
                      value={formData.streetAddress}
                      onChange={(e) => handleInputChange('streetAddress', e.target.value)}
                      className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-slate-500 focus:border-slate-500 ${
                        errors.streetAddress ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="123 Medical Center Drive"
                      disabled={isSubmitting}
                    />
                    {errors.streetAddress && (
                      <p className="mt-1 text-sm text-red-600">{errors.streetAddress}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                      City <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="city"
                      value={formData.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-slate-500 focus:border-slate-500 ${
                        errors.city ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="San Francisco"
                      disabled={isSubmitting}
                    />
                    {errors.city && (
                      <p className="mt-1 text-sm text-red-600">{errors.city}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">
                      State <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="state"
                      value={formData.state}
                      onChange={(e) => handleInputChange('state', e.target.value)}
                      className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-slate-500 focus:border-slate-500 ${
                        errors.state ? 'border-red-300' : 'border-gray-300'
                      }`}
                      disabled={isSubmitting}
                    >
                      <option value="">Select state</option>
                      {usStates.map(state => (
                        <option key={state} value={state}>{state}</option>
                      ))}
                    </select>
                    {errors.state && (
                      <p className="mt-1 text-sm text-red-600">{errors.state}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="zipCode" className="block text-sm font-medium text-gray-700 mb-1">
                      ZIP Code <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="zipCode"
                      value={formData.zipCode}
                      onChange={(e) => handleInputChange('zipCode', formatZipCode(e.target.value))}
                      className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-slate-500 focus:border-slate-500 ${
                        errors.zipCode ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="94143"
                      disabled={isSubmitting}
                    />
                    {errors.zipCode && (
                      <p className="mt-1 text-sm text-red-600">{errors.zipCode}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="shippingContactName" className="block text-sm font-medium text-gray-700 mb-1">
                      Shipping Contact Name
                    </label>
                    <input
                      type="text"
                      id="shippingContactName"
                      value={formData.shippingContactName}
                      onChange={(e) => handleInputChange('shippingContactName', e.target.value)}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-slate-500 focus:border-slate-500"
                      placeholder="Mark Wilson"
                      disabled={isSubmitting}
                    />
                  </div>

                  <div>
                    <label htmlFor="shippingPhone" className="block text-sm font-medium text-gray-700 mb-1">
                      Shipping Phone
                    </label>
                    <input
                      type="tel"
                      id="shippingPhone"
                      value={formData.shippingPhone}
                      onChange={(e) => handleInputChange('shippingPhone', formatPhoneNumber(e.target.value))}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-slate-500 focus:border-slate-500"
                      placeholder="(555) 345-6789"
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label htmlFor="deliveryInstructions" className="block text-sm font-medium text-gray-700 mb-1">
                      Delivery Instructions
                    </label>
                    <textarea
                      id="deliveryInstructions"
                      rows={3}
                      value={formData.deliveryInstructions}
                      onChange={(e) => handleInputChange('deliveryInstructions', e.target.value)}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-slate-500 focus:border-slate-500"
                      placeholder="Delivery entrance on side of building. Hours: 8am-5pm M-F"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              </div>

              {/* Progress Indicator */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-2">
                  <InformationCircleIcon className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium">Form Progress: {[1,2,3,4].filter(section => getSectionCompletion(section)).length}/4 sections completed</p>
                    <p className="mt-1">
                      Complete all required fields (*) to submit the doctor registration.
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => navigate('/sales/doctors')}
                  disabled={isSubmitting}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 transition-colors disabled:opacity-50 flex items-center"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                      Adding Doctor...
                    </>
                  ) : (
                    <>
                      <UserPlusIcon className="h-4 w-4 mr-2" />
                      Add Doctor
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </UnifiedDashboardLayout>
  );
};

export default AddDoctor;