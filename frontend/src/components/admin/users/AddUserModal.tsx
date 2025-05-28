import React, { useState, useEffect } from 'react';
import { X, ChevronRight, Upload, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { userService } from '@/services/userService';
import { toast } from 'react-hot-toast';

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (userData: any) => Promise<void>;
}

// Role definitions with their specific field requirements
const ROLES = {
  DOCTOR: 'Doctor',
  DOCTOR_ASSISTANT: 'Doctor Assistant',
  MASTER_DISTRIBUTOR: 'Master Distributor',
  DISTRIBUTOR: 'Distributor',
  SALES_REP: 'Sales Representative',
  IVR_STAFF: 'IVR Company Staff',
  LOGISTICS: 'Logistics Coordinator',
  SYSTEM_ADMIN: 'System Admin',
  COMPLIANCE: 'Compliance Officer'
} as const;

// Position titles for Doctor's Assistant
const ASSISTANT_POSITIONS = {
  MEDICAL_ASSISTANT: 'Medical Assistant',
  ADMINISTRATIVE_ASSISTANT: 'Administrative Assistant',
  OFFICE_MANAGER: 'Office Manager'
} as const;

// Experience levels for Doctor's Assistant
const EXPERIENCE_LEVELS = [
  '<1 year',
  '1-3 years',
  '3-5 years',
  '5-10 years',
  '10+ years'
] as const;

// Access levels for Doctor's Assistant
const ACCESS_LEVELS = {
  FULL_PATIENT: 'Full Patient Access',
  IVR_ONLY: 'IVR Only',
  ADMINISTRATIVE: 'Administrative Only'
} as const;

// IVR Response Authority levels
const IVR_AUTHORITY = {
  INFO_GATHERING: 'Information Gathering Only',
  ROUTINE: 'Routine Requests',
  FULL: 'Full Authority'
} as const;

// Patient Data Authority levels
const PATIENT_DATA_AUTHORITY = {
  VIEW_ONLY: 'View Only',
  UPDATE_BASIC: 'Update Demographics/Insurance',
  FULL_MANAGEMENT: 'Full Patient Management'
} as const;

// US States for dropdown
const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
] as const;

// At the top of the file, update the type definitions
type Role = typeof ROLES[keyof typeof ROLES];
type AssistantPosition = typeof ASSISTANT_POSITIONS[keyof typeof ASSISTANT_POSITIONS];
type AccessLevel = typeof ACCESS_LEVELS[keyof typeof ACCESS_LEVELS];
type IvrAuthority = typeof IVR_AUTHORITY[keyof typeof IVR_AUTHORITY];
type PatientDataAuthority = typeof PATIENT_DATA_AUTHORITY[keyof typeof PATIENT_DATA_AUTHORITY];
type ExperienceLevel = typeof EXPERIENCE_LEVELS[number];

interface FormData {
  // Basic Info
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: Role | '';
  
  // Doctor Fields
  medicalLicense: string;
  npiNumber: string;
  specialty: string;
  practiceName: string;
  territory: string;
  credentials: File | null;

  // Facility Information
  facilityName: string;
  medicarePtan: string;
  taxId: string;
  medicaidProvider: string;
  officeContact: string;
  facilityPhone: string;
  facilityFax: string;
  facilityEmail: string;

  // Shipping Information
  shippingAddressLine1: string;
  shippingAddressLine2: string;
  shippingCity: string;
  shippingState: string;
  shippingZip: string;
  shippingInstructions: string;

  // Territory & Access
  territoryAssignment: string;
  primaryDistributor: string;
  secondaryDistributor: string;

  // Doctor's Assistant Fields
  positionTitle: AssistantPosition | '';
  certification: string;
  yearsExperience: ExperienceLevel | '';
  assignedDoctor: string;
  accessLevel: AccessLevel | '';
  coverageHoursStart: string;
  coverageHoursEnd: string;
  ivrResponseAuthority: IvrAuthority | '';
  patientDataAuthority: PatientDataAuthority | '';
  employeeId: string;
  hipaaTrainingDate: string;
  emergencyContactName: string;
  emergencyContactPhone: string;

  // Other Role Fields
  managerName: string;
  commissionRate: string;
  targetGoals: string;
  companyName: string;
  territoryCoverage: string;
  warehouseLocation: string;
  supervisor: string;
  departmentAssignment: string;
}

// Initial form state
const initialFormState = {
  // Basic Info
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  role: '',
  
  // Doctor Fields
  medicalLicense: '',
  npiNumber: '',
  specialty: '',
  practiceName: '',
  territory: '',
  credentials: null,

  // Facility Information
  facilityName: '',
  medicarePtan: '',
  taxId: '',
  medicaidProvider: '',
  officeContact: '',
  facilityPhone: '',
  facilityFax: '',
  facilityEmail: '',

  // Shipping Information
  shippingAddressLine1: '',
  shippingAddressLine2: '',
  shippingCity: '',
  shippingState: '',
  shippingZip: '',
  shippingInstructions: '',

  // Territory & Access
  territoryAssignment: '',
  primaryDistributor: '',
  secondaryDistributor: '',

  // Doctor's Assistant Fields
  positionTitle: '',
  certification: '',
  yearsExperience: '',
  assignedDoctor: '',
  accessLevel: '',
  coverageHoursStart: '',
  coverageHoursEnd: '',
  ivrResponseAuthority: '',
  patientDataAuthority: '',
  employeeId: '',
  hipaaTrainingDate: '',
  emergencyContactName: '',
  emergencyContactPhone: '',

  // Other Role Fields
  managerName: '',
  commissionRate: '',
  targetGoals: '',
  companyName: '',
  territoryCoverage: '',
  warehouseLocation: '',
  supervisor: '',
  departmentAssignment: '',
};

const AddUserModal: React.FC<AddUserModalProps> = ({ isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState<FormData>(initialFormState as FormData);
  const [currentStep, setCurrentStep] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isDraft, setIsDraft] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field: string, value: string | File | null) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when field is modified
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    // Basic validation
    if (!formData.firstName) newErrors.firstName = 'First name is required';
    if (!formData.lastName) newErrors.lastName = 'Last name is required';
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    if (!formData.role) newErrors.role = 'Role selection is required';

    // Role-specific validation for Doctor
    if (formData.role === ROLES.DOCTOR) {
      // Medical Credentials
      if (!formData.medicalLicense) newErrors.medicalLicense = 'Medical license is required';
      if (!formData.npiNumber) {
        newErrors.npiNumber = 'NPI number is required';
      } else if (!/^\d{10}$/.test(formData.npiNumber)) {
        newErrors.npiNumber = 'NPI must be a 10-digit number';
      }

      // Facility Information
      if (!formData.facilityName) newErrors.facilityName = 'Facility name is required';
      if (!formData.medicarePtan) newErrors.medicarePtan = 'Medicare (PTAN) Provider Number is required';
      if (!formData.medicaidProvider) newErrors.medicaidProvider = 'Medicaid Provider Number is required';
      
      // Phone/Fax Validation
      if (formData.facilityPhone && !/^\d{10}$/.test(formData.facilityPhone.replace(/\D/g, ''))) {
        newErrors.facilityPhone = 'Please enter a valid 10-digit phone number';
      }
      if (formData.facilityFax && !/^\d{10}$/.test(formData.facilityFax.replace(/\D/g, ''))) {
        newErrors.facilityFax = 'Please enter a valid 10-digit fax number';
      }

      // Shipping Information
      if (!formData.shippingAddressLine1) newErrors.shippingAddressLine1 = 'Shipping address is required';
      if (!formData.shippingCity) newErrors.shippingCity = 'City is required';
      if (!formData.shippingState) newErrors.shippingState = 'State is required';
      if (!formData.shippingZip) {
        newErrors.shippingZip = 'ZIP code is required';
      } else if (!/^\d{5}(-\d{4})?$/.test(formData.shippingZip)) {
        newErrors.shippingZip = 'Please enter a valid ZIP code (5 or 9 digits)';
      }

      // Territory Assignment
      if (!formData.territoryAssignment) newErrors.territoryAssignment = 'Territory assignment is required';
      if (!formData.primaryDistributor) newErrors.primaryDistributor = 'Primary distributor is required';
    }

    // Role-specific validation for Doctor's Assistant
    if (formData.role === ROLES.DOCTOR_ASSISTANT) {
      // Position & Experience
      if (!formData.positionTitle) newErrors.positionTitle = 'Position title is required';
      if (!formData.certification) newErrors.certification = 'Certification is required';
      if (!formData.yearsExperience) newErrors.yearsExperience = 'Years of experience is required';

      // Doctor Assignment & Access
      if (!formData.assignedDoctor) newErrors.assignedDoctor = 'Assigned doctor is required';
      if (!formData.accessLevel) newErrors.accessLevel = 'Access level is required';
      if (!formData.coverageHoursStart) newErrors.coverageHoursStart = 'Coverage start time is required';
      if (!formData.coverageHoursEnd) newErrors.coverageHoursEnd = 'Coverage end time is required';

      // Authority Levels
      if (!formData.ivrResponseAuthority) newErrors.ivrResponseAuthority = 'IVR response authority is required';
      if (!formData.patientDataAuthority) newErrors.patientDataAuthority = 'Patient data authority is required';

      // Administrative Information
      if (!formData.hipaaTrainingDate) newErrors.hipaaTrainingDate = 'HIPAA training date is required';
      if (!formData.emergencyContactName) newErrors.emergencyContactName = 'Emergency contact name is required';
      if (!formData.emergencyContactPhone) {
        newErrors.emergencyContactPhone = 'Emergency contact phone is required';
      } else if (!/^\d{10}$/.test(formData.emergencyContactPhone.replace(/\D/g, ''))) {
        newErrors.emergencyContactPhone = 'Please enter a valid 10-digit phone number';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (asDraft: boolean = false) => {
    if (!asDraft && !validateForm()) return;
    
    setIsSubmitting(true);
    try {
      // Prepare form data
      const userData = {
        ...formData,
        status: asDraft ? ('draft' as const) : ('active' as const)
      };

      // Create user via API
      const createdUser = await userService.createUser(userData);

      // Show success message
      toast.success(
        asDraft 
          ? 'User saved as draft successfully' 
          : 'User created successfully'
      );

      // Close modal and refresh parent
      onClose();
      onSave(createdUser);
    } catch (error) {
      console.error('Error saving user:', error);
      toast.error(
        error instanceof Error 
          ? error.message 
          : 'Failed to save user. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderBasicFields = () => (
    <div className="grid grid-cols-2 gap-6">
      <div>
        <label htmlFor="firstName" className="block text-sm font-medium text-slate-700 mb-2">
          First Name <span className="text-red-500">*</span>
        </label>
        <input
          id="firstName"
          type="text"
          value={formData.firstName}
          onChange={(e) => handleInputChange('firstName', e.target.value)}
          className={`block w-full min-h-[48px] px-4 py-3 text-base rounded-lg border ${
            errors.firstName ? 'border-red-300' : 'border-slate-300'
          } shadow-sm focus:ring-slate-500 focus:border-slate-500 transition-colors`}
        />
        {errors.firstName && (
          <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>
        )}
      </div>

      <div>
        <label htmlFor="lastName" className="block text-sm font-medium text-slate-700 mb-2">
          Last Name <span className="text-red-500">*</span>
        </label>
        <input
          id="lastName"
          type="text"
          value={formData.lastName}
          onChange={(e) => handleInputChange('lastName', e.target.value)}
          className={`block w-full min-h-[48px] px-4 py-3 text-base rounded-lg border ${
            errors.lastName ? 'border-red-300' : 'border-slate-300'
          } shadow-sm focus:ring-slate-500 focus:border-slate-500 transition-colors`}
        />
        {errors.lastName && (
          <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>
        )}
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
          Email Address <span className="text-red-500">*</span>
        </label>
        <input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => handleInputChange('email', e.target.value)}
          className={`block w-full min-h-[48px] px-4 py-3 text-base rounded-lg border ${
            errors.email ? 'border-red-300' : 'border-slate-300'
          } shadow-sm focus:ring-slate-500 focus:border-slate-500 transition-colors`}
        />
        {errors.email && (
          <p className="mt-1 text-sm text-red-600">{errors.email}</p>
        )}
      </div>

      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-slate-700 mb-2">
          Phone Number
        </label>
        <input
          id="phone"
          type="tel"
          value={formData.phone}
          onChange={(e) => handleInputChange('phone', e.target.value)}
          className="block w-full min-h-[48px] px-4 py-3 text-base rounded-lg border border-slate-300 shadow-sm focus:ring-slate-500 focus:border-slate-500 transition-colors"
        />
      </div>

      <div className="col-span-2">
        <label htmlFor="role" className="block text-sm font-medium text-slate-700 mb-2">
          Role <span className="text-red-500">*</span>
        </label>
        <select
          id="role"
          value={formData.role}
          onChange={(e) => handleInputChange('role', e.target.value)}
          className={`block w-full min-h-[48px] px-4 py-3 text-base rounded-lg border ${
            errors.role ? 'border-red-300' : 'border-slate-300'
          } shadow-sm focus:ring-slate-500 focus:border-slate-500 transition-colors`}
        >
          <option value="">Select a role</option>
          {Object.entries(ROLES).map(([key, value]) => (
            <option key={key} value={value}>{value}</option>
          ))}
        </select>
        {errors.role && (
          <p className="mt-1 text-sm text-red-600">{errors.role}</p>
        )}
      </div>
    </div>
  );

  const renderDoctorFields = () => {
    // Auto-populate physician name
    const physicianName = formData.firstName && formData.lastName 
      ? `${formData.firstName} ${formData.lastName}`
      : '';

    return (
      <div
        className={`transition-all duration-300 ease-in-out space-y-8 mt-8 overflow-hidden ${
          formData.role === ROLES.DOCTOR
            ? 'opacity-100 max-h-[2000px]'
            : 'opacity-0 max-h-0'
        }`}
      >
        {/* Medical Credentials Section */}
        <div className="bg-white p-6 rounded-lg border border-slate-200">
          <h3 className="text-lg font-medium text-slate-900 border-b border-slate-200 pb-3 mb-6">
            Medical Credentials
          </h3>
          
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label htmlFor="medicalLicense" className="block text-sm font-medium text-slate-700 mb-2">
                Medical License Number <span className="text-red-500">*</span>
              </label>
              <input
                id="medicalLicense"
                type="text"
                value={formData.medicalLicense}
                onChange={(e) => handleInputChange('medicalLicense', e.target.value)}
                className={`block w-full min-h-[48px] px-4 py-3 text-base rounded-lg border ${
                  errors.medicalLicense ? 'border-red-300' : 'border-slate-300'
                } shadow-sm focus:ring-slate-500 focus:border-slate-500 transition-colors`}
              />
              {errors.medicalLicense && (
                <p className="mt-1 text-sm text-red-600">{errors.medicalLicense}</p>
              )}
            </div>

            <div>
              <label htmlFor="npiNumber" className="block text-sm font-medium text-slate-700 mb-2">
                NPI Number <span className="text-red-500">*</span>
              </label>
              <input
                id="npiNumber"
                type="text"
                value={formData.npiNumber}
                onChange={(e) => handleInputChange('npiNumber', e.target.value)}
                placeholder="10-digit number"
                className={`block w-full min-h-[48px] px-4 py-3 text-base rounded-lg border ${
                  errors.npiNumber ? 'border-red-300' : 'border-slate-300'
                } shadow-sm focus:ring-slate-500 focus:border-slate-500 transition-colors`}
              />
              {errors.npiNumber && (
                <p className="mt-1 text-sm text-red-600">{errors.npiNumber}</p>
              )}
            </div>

            <div>
              <label htmlFor="specialty" className="block text-sm font-medium text-slate-700 mb-2">
                Specialty/Practice Area
              </label>
              <input
                id="specialty"
                type="text"
                value={formData.specialty}
                onChange={(e) => handleInputChange('specialty', e.target.value)}
                className="block w-full min-h-[48px] px-4 py-3 text-base rounded-lg border border-slate-300 shadow-sm focus:ring-slate-500 focus:border-slate-500 transition-colors"
              />
            </div>

            <div>
              <label htmlFor="credentials" className="block text-sm font-medium text-slate-700 mb-2">
                Credentials & Certifications
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 border-dashed rounded-lg hover:border-slate-400 transition-colors">
                <div className="space-y-1 text-center">
                  <Upload className="mx-auto h-12 w-12 text-slate-400" />
                  <div className="flex text-sm text-slate-600">
                    <label
                      htmlFor="credentials"
                      className="relative cursor-pointer rounded-md font-medium text-slate-600 hover:text-slate-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-slate-500"
                    >
                      <span>Upload files</span>
                      <input
                        id="credentials"
                        name="credentials"
                        type="file"
                        className="sr-only"
                        onChange={(e) => handleInputChange('credentials', e.target.files?.[0] || null)}
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-slate-500">
                    PDF, PNG, JPG up to 10MB
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Facility Information Section */}
        <div className="bg-white p-6 rounded-lg border border-slate-200">
          <h3 className="text-lg font-medium text-slate-900 border-b border-slate-200 pb-3 mb-6">
            Facility Information
          </h3>
          
          <div className="grid grid-cols-3 gap-6">
            <div>
              <label htmlFor="physicianName" className="block text-sm font-medium text-slate-700 mb-2">
                Physician Name
              </label>
              <input
                id="physicianName"
                type="text"
                value={physicianName}
                disabled
                className="block w-full min-h-[48px] px-4 py-3 text-base rounded-lg border border-slate-200 bg-slate-50 text-slate-500"
              />
            </div>

            <div>
              <label htmlFor="facilityName" className="block text-sm font-medium text-slate-700 mb-2">
                Facility Name <span className="text-red-500">*</span>
              </label>
              <input
                id="facilityName"
                type="text"
                value={formData.facilityName}
                onChange={(e) => handleInputChange('facilityName', e.target.value)}
                className={`block w-full min-h-[48px] px-4 py-3 text-base rounded-lg border ${
                  errors.facilityName ? 'border-red-300' : 'border-slate-300'
                } shadow-sm focus:ring-slate-500 focus:border-slate-500 transition-colors`}
              />
              {errors.facilityName && (
                <p className="mt-1 text-sm text-red-600">{errors.facilityName}</p>
              )}
            </div>

            <div>
              <label htmlFor="medicarePtan" className="block text-sm font-medium text-slate-700 mb-2">
                Medicare (PTAN) Provider # <span className="text-red-500">*</span>
              </label>
              <input
                id="medicarePtan"
                type="text"
                value={formData.medicarePtan}
                onChange={(e) => handleInputChange('medicarePtan', e.target.value)}
                className={`block w-full min-h-[48px] px-4 py-3 text-base rounded-lg border ${
                  errors.medicarePtan ? 'border-red-300' : 'border-slate-300'
                } shadow-sm focus:ring-slate-500 focus:border-slate-500 transition-colors`}
              />
              {errors.medicarePtan && (
                <p className="mt-1 text-sm text-red-600">{errors.medicarePtan}</p>
              )}
            </div>

            <div>
              <label htmlFor="taxId" className="block text-sm font-medium text-slate-700 mb-2">
                Tax ID
              </label>
              <input
                id="taxId"
                type="text"
                value={formData.taxId}
                onChange={(e) => handleInputChange('taxId', e.target.value)}
                className="block w-full min-h-[48px] px-4 py-3 text-base rounded-lg border border-slate-300 shadow-sm focus:ring-slate-500 focus:border-slate-500 transition-colors"
              />
            </div>

            <div>
              <label htmlFor="medicaidProvider" className="block text-sm font-medium text-slate-700 mb-2">
                Medicaid Provider # <span className="text-red-500">*</span>
              </label>
              <input
                id="medicaidProvider"
                type="text"
                value={formData.medicaidProvider}
                onChange={(e) => handleInputChange('medicaidProvider', e.target.value)}
                className={`block w-full min-h-[48px] px-4 py-3 text-base rounded-lg border ${
                  errors.medicaidProvider ? 'border-red-300' : 'border-slate-300'
                } shadow-sm focus:ring-slate-500 focus:border-slate-500 transition-colors`}
              />
              {errors.medicaidProvider && (
                <p className="mt-1 text-sm text-red-600">{errors.medicaidProvider}</p>
              )}
            </div>

            <div>
              <label htmlFor="officeContact" className="block text-sm font-medium text-slate-700 mb-2">
                Office Contact
              </label>
              <input
                id="officeContact"
                type="text"
                value={formData.officeContact}
                onChange={(e) => handleInputChange('officeContact', e.target.value)}
                className="block w-full min-h-[48px] px-4 py-3 text-base rounded-lg border border-slate-300 shadow-sm focus:ring-slate-500 focus:border-slate-500 transition-colors"
              />
            </div>

            <div>
              <label htmlFor="facilityPhone" className="block text-sm font-medium text-slate-700 mb-2">
                Phone
              </label>
              <input
                id="facilityPhone"
                type="tel"
                value={formData.facilityPhone}
                onChange={(e) => handleInputChange('facilityPhone', e.target.value)}
                placeholder="(XXX) XXX-XXXX"
                className={`block w-full min-h-[48px] px-4 py-3 text-base rounded-lg border ${
                  errors.facilityPhone ? 'border-red-300' : 'border-slate-300'
                } shadow-sm focus:ring-slate-500 focus:border-slate-500 transition-colors`}
              />
              {errors.facilityPhone && (
                <p className="mt-1 text-sm text-red-600">{errors.facilityPhone}</p>
              )}
            </div>

            <div>
              <label htmlFor="facilityFax" className="block text-sm font-medium text-slate-700 mb-2">
                Fax
              </label>
              <input
                id="facilityFax"
                type="tel"
                value={formData.facilityFax}
                onChange={(e) => handleInputChange('facilityFax', e.target.value)}
                placeholder="(XXX) XXX-XXXX"
                className={`block w-full min-h-[48px] px-4 py-3 text-base rounded-lg border ${
                  errors.facilityFax ? 'border-red-300' : 'border-slate-300'
                } shadow-sm focus:ring-slate-500 focus:border-slate-500 transition-colors`}
              />
              {errors.facilityFax && (
                <p className="mt-1 text-sm text-red-600">{errors.facilityFax}</p>
              )}
            </div>

            <div>
              <label htmlFor="facilityEmail" className="block text-sm font-medium text-slate-700 mb-2">
                Email
              </label>
              <input
                id="facilityEmail"
                type="email"
                value={formData.facilityEmail}
                onChange={(e) => handleInputChange('facilityEmail', e.target.value)}
                className="block w-full min-h-[48px] px-4 py-3 text-base rounded-lg border border-slate-300 shadow-sm focus:ring-slate-500 focus:border-slate-500 transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Shipping Information Section */}
        <div className="bg-white p-6 rounded-lg border border-slate-200">
          <h3 className="text-lg font-medium text-slate-900 border-b border-slate-200 pb-3 mb-6">
            Shipping Information
          </h3>
          
          <div className="grid grid-cols-2 gap-6">
            <div className="col-span-2">
              <label htmlFor="shippingAddressLine1" className="block text-sm font-medium text-slate-700 mb-2">
                Address Line 1 <span className="text-red-500">*</span>
              </label>
              <input
                id="shippingAddressLine1"
                type="text"
                value={formData.shippingAddressLine1}
                onChange={(e) => handleInputChange('shippingAddressLine1', e.target.value)}
                className={`block w-full min-h-[48px] px-4 py-3 text-base rounded-lg border ${
                  errors.shippingAddressLine1 ? 'border-red-300' : 'border-slate-300'
                } shadow-sm focus:ring-slate-500 focus:border-slate-500 transition-colors`}
              />
              {errors.shippingAddressLine1 && (
                <p className="mt-1 text-sm text-red-600">{errors.shippingAddressLine1}</p>
              )}
            </div>

            <div className="col-span-2">
              <label htmlFor="shippingAddressLine2" className="block text-sm font-medium text-slate-700 mb-2">
                Address Line 2
              </label>
              <input
                id="shippingAddressLine2"
                type="text"
                value={formData.shippingAddressLine2}
                onChange={(e) => handleInputChange('shippingAddressLine2', e.target.value)}
                className="block w-full min-h-[48px] px-4 py-3 text-base rounded-lg border border-slate-300 shadow-sm focus:ring-slate-500 focus:border-slate-500 transition-colors"
              />
            </div>

            <div>
              <label htmlFor="shippingCity" className="block text-sm font-medium text-slate-700 mb-2">
                City <span className="text-red-500">*</span>
              </label>
              <input
                id="shippingCity"
                type="text"
                value={formData.shippingCity}
                onChange={(e) => handleInputChange('shippingCity', e.target.value)}
                className={`block w-full min-h-[48px] px-4 py-3 text-base rounded-lg border ${
                  errors.shippingCity ? 'border-red-300' : 'border-slate-300'
                } shadow-sm focus:ring-slate-500 focus:border-slate-500 transition-colors`}
              />
              {errors.shippingCity && (
                <p className="mt-1 text-sm text-red-600">{errors.shippingCity}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label htmlFor="shippingState" className="block text-sm font-medium text-slate-700 mb-2">
                  State <span className="text-red-500">*</span>
                </label>
                <select
                  id="shippingState"
                  value={formData.shippingState}
                  onChange={(e) => handleInputChange('shippingState', e.target.value)}
                  className={`block w-full min-h-[48px] px-4 py-3 text-base rounded-lg border ${
                    errors.shippingState ? 'border-red-300' : 'border-slate-300'
                  } shadow-sm focus:ring-slate-500 focus:border-slate-500 transition-colors`}
                >
                  <option value="">Select State</option>
                  {US_STATES.map((state) => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </select>
                {errors.shippingState && (
                  <p className="mt-1 text-sm text-red-600">{errors.shippingState}</p>
                )}
              </div>

              <div>
                <label htmlFor="shippingZip" className="block text-sm font-medium text-slate-700 mb-2">
                  ZIP Code <span className="text-red-500">*</span>
                </label>
                <input
                  id="shippingZip"
                  type="text"
                  value={formData.shippingZip}
                  onChange={(e) => handleInputChange('shippingZip', e.target.value)}
                  placeholder="XXXXX or XXXXX-XXXX"
                  className={`block w-full min-h-[48px] px-4 py-3 text-base rounded-lg border ${
                    errors.shippingZip ? 'border-red-300' : 'border-slate-300'
                  } shadow-sm focus:ring-slate-500 focus:border-slate-500 transition-colors`}
                />
                {errors.shippingZip && (
                  <p className="mt-1 text-sm text-red-600">{errors.shippingZip}</p>
                )}
              </div>
            </div>

            <div className="col-span-2">
              <label htmlFor="shippingInstructions" className="block text-sm font-medium text-slate-700 mb-2">
                Shipping Instructions
              </label>
              <textarea
                id="shippingInstructions"
                value={formData.shippingInstructions}
                onChange={(e) => handleInputChange('shippingInstructions', e.target.value)}
                rows={3}
                className="block w-full px-4 py-3 text-base rounded-lg border border-slate-300 shadow-sm focus:ring-slate-500 focus:border-slate-500 transition-colors"
                placeholder="Special delivery instructions, access codes, or preferred delivery times"
              />
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderAssistantFields = () => {
    return (
      <div
        className={`transition-all duration-300 ease-in-out space-y-8 mt-8 overflow-hidden ${
          formData.role === ROLES.DOCTOR_ASSISTANT
            ? 'opacity-100 max-h-[2000px]'
            : 'opacity-0 max-h-0'
        }`}
      >
        {/* Position & Experience Section */}
        <div className="bg-white p-6 rounded-lg border border-slate-200">
          <h3 className="text-lg font-medium text-slate-900 border-b border-slate-200 pb-3 mb-6">
            Position & Experience
          </h3>
          
          <div className="grid grid-cols-3 gap-6">
            <div>
              <label htmlFor="positionTitle" className="block text-sm font-medium text-slate-700 mb-2">
                Position Title <span className="text-red-500">*</span>
              </label>
              <select
                id="positionTitle"
                value={formData.positionTitle}
                onChange={(e) => handleInputChange('positionTitle', e.target.value)}
                className={`block w-full min-h-[48px] px-4 py-3 text-base rounded-lg border ${
                  errors.positionTitle ? 'border-red-300' : 'border-slate-300'
                } shadow-sm focus:ring-slate-500 focus:border-slate-500 transition-colors`}
              >
                <option value="">Select Position</option>
                {Object.values(ASSISTANT_POSITIONS).map((position) => (
                  <option key={position} value={position}>{position}</option>
                ))}
              </select>
              {errors.positionTitle && (
                <p className="mt-1 text-sm text-red-600">{errors.positionTitle}</p>
              )}
            </div>

            <div>
              <label htmlFor="certification" className="block text-sm font-medium text-slate-700 mb-2">
                Certification <span className="text-red-500">*</span>
              </label>
              <input
                id="certification"
                type="text"
                value={formData.certification}
                onChange={(e) => handleInputChange('certification', e.target.value)}
                placeholder="CMA, RMA, CCMA, etc."
                className={`block w-full min-h-[48px] px-4 py-3 text-base rounded-lg border ${
                  errors.certification ? 'border-red-300' : 'border-slate-300'
                } shadow-sm focus:ring-slate-500 focus:border-slate-500 transition-colors`}
              />
              {errors.certification && (
                <p className="mt-1 text-sm text-red-600">{errors.certification}</p>
              )}
            </div>

            <div>
              <label htmlFor="yearsExperience" className="block text-sm font-medium text-slate-700 mb-2">
                Years of Experience <span className="text-red-500">*</span>
              </label>
              <select
                id="yearsExperience"
                value={formData.yearsExperience}
                onChange={(e) => handleInputChange('yearsExperience', e.target.value)}
                className={`block w-full min-h-[48px] px-4 py-3 text-base rounded-lg border ${
                  errors.yearsExperience ? 'border-red-300' : 'border-slate-300'
                } shadow-sm focus:ring-slate-500 focus:border-slate-500 transition-colors`}
              >
                <option value="">Select Experience</option>
                {EXPERIENCE_LEVELS.map((level) => (
                  <option key={level} value={level}>{level}</option>
                ))}
              </select>
              {errors.yearsExperience && (
                <p className="mt-1 text-sm text-red-600">{errors.yearsExperience}</p>
              )}
            </div>
          </div>
        </div>

        {/* Doctor Assignment & Access Section */}
        <div className="bg-white p-6 rounded-lg border border-slate-200">
          <h3 className="text-lg font-medium text-slate-900 border-b border-slate-200 pb-3 mb-6">
            Doctor Assignment & Access
          </h3>
          
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label htmlFor="assignedDoctor" className="block text-sm font-medium text-slate-700 mb-2">
                Assigned Doctor <span className="text-red-500">*</span>
              </label>
              <select
                id="assignedDoctor"
                value={formData.assignedDoctor}
                onChange={(e) => handleInputChange('assignedDoctor', e.target.value)}
                className={`block w-full min-h-[48px] px-4 py-3 text-base rounded-lg border ${
                  errors.assignedDoctor ? 'border-red-300' : 'border-slate-300'
                } shadow-sm focus:ring-slate-500 focus:border-slate-500 transition-colors`}
              >
                <option value="">Select Doctor</option>
                {/* TODO: Fetch and populate doctors list */}
              </select>
              {errors.assignedDoctor && (
                <p className="mt-1 text-sm text-red-600">{errors.assignedDoctor}</p>
              )}
            </div>

            <div>
              <label htmlFor="accessLevel" className="block text-sm font-medium text-slate-700 mb-2">
                Access Level <span className="text-red-500">*</span>
              </label>
              <select
                id="accessLevel"
                value={formData.accessLevel}
                onChange={(e) => handleInputChange('accessLevel', e.target.value)}
                className={`block w-full min-h-[48px] px-4 py-3 text-base rounded-lg border ${
                  errors.accessLevel ? 'border-red-300' : 'border-slate-300'
                } shadow-sm focus:ring-slate-500 focus:border-slate-500 transition-colors`}
              >
                <option value="">Select Access Level</option>
                {Object.values(ACCESS_LEVELS).map((level) => (
                  <option key={level} value={level}>{level}</option>
                ))}
              </select>
              {errors.accessLevel && (
                <p className="mt-1 text-sm text-red-600">{errors.accessLevel}</p>
              )}
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Coverage Hours <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <input
                    type="time"
                    value={formData.coverageHoursStart}
                    onChange={(e) => handleInputChange('coverageHoursStart', e.target.value)}
                    className="block w-full min-h-[48px] px-4 py-3 text-base rounded-lg border border-slate-300 shadow-sm focus:ring-slate-500 focus:border-slate-500 transition-colors"
                  />
                </div>
                <div>
                  <input
                    type="time"
                    value={formData.coverageHoursEnd}
                    onChange={(e) => handleInputChange('coverageHoursEnd', e.target.value)}
                    className="block w-full min-h-[48px] px-4 py-3 text-base rounded-lg border border-slate-300 shadow-sm focus:ring-slate-500 focus:border-slate-500 transition-colors"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Authority Levels Section */}
        <div className="bg-white p-6 rounded-lg border border-slate-200">
          <h3 className="text-lg font-medium text-slate-900 border-b border-slate-200 pb-3 mb-6">
            Authority Levels
          </h3>
          
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label htmlFor="ivrResponseAuthority" className="block text-sm font-medium text-slate-700 mb-2">
                IVR Response Authority <span className="text-red-500">*</span>
              </label>
              <select
                id="ivrResponseAuthority"
                value={formData.ivrResponseAuthority}
                onChange={(e) => handleInputChange('ivrResponseAuthority', e.target.value)}
                className={`block w-full min-h-[48px] px-4 py-3 text-base rounded-lg border ${
                  errors.ivrResponseAuthority ? 'border-red-300' : 'border-slate-300'
                } shadow-sm focus:ring-slate-500 focus:border-slate-500 transition-colors`}
              >
                <option value="">Select Authority Level</option>
                {Object.values(IVR_AUTHORITY).map((authority) => (
                  <option key={authority} value={authority}>{authority}</option>
                ))}
              </select>
              {errors.ivrResponseAuthority && (
                <p className="mt-1 text-sm text-red-600">{errors.ivrResponseAuthority}</p>
              )}
            </div>

            <div>
              <label htmlFor="patientDataAuthority" className="block text-sm font-medium text-slate-700 mb-2">
                Patient Data Authority <span className="text-red-500">*</span>
              </label>
              <select
                id="patientDataAuthority"
                value={formData.patientDataAuthority}
                onChange={(e) => handleInputChange('patientDataAuthority', e.target.value)}
                className={`block w-full min-h-[48px] px-4 py-3 text-base rounded-lg border ${
                  errors.patientDataAuthority ? 'border-red-300' : 'border-slate-300'
                } shadow-sm focus:ring-slate-500 focus:border-slate-500 transition-colors`}
              >
                <option value="">Select Authority Level</option>
                {Object.values(PATIENT_DATA_AUTHORITY).map((authority) => (
                  <option key={authority} value={authority}>{authority}</option>
                ))}
              </select>
              {errors.patientDataAuthority && (
                <p className="mt-1 text-sm text-red-600">{errors.patientDataAuthority}</p>
              )}
            </div>
          </div>
        </div>

        {/* Administrative Information Section */}
        <div className="bg-white p-6 rounded-lg border border-slate-200">
          <h3 className="text-lg font-medium text-slate-900 border-b border-slate-200 pb-3 mb-6">
            Administrative Information
          </h3>
          
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label htmlFor="employeeId" className="block text-sm font-medium text-slate-700 mb-2">
                Employee ID
              </label>
              <input
                id="employeeId"
                type="text"
                value={formData.employeeId}
                onChange={(e) => handleInputChange('employeeId', e.target.value)}
                className="block w-full min-h-[48px] px-4 py-3 text-base rounded-lg border border-slate-300 shadow-sm focus:ring-slate-500 focus:border-slate-500 transition-colors"
              />
            </div>

            <div>
              <label htmlFor="hipaaTrainingDate" className="block text-sm font-medium text-slate-700 mb-2">
                HIPAA Training Date <span className="text-red-500">*</span>
              </label>
              <input
                id="hipaaTrainingDate"
                type="date"
                value={formData.hipaaTrainingDate}
                onChange={(e) => handleInputChange('hipaaTrainingDate', e.target.value)}
                className={`block w-full min-h-[48px] px-4 py-3 text-base rounded-lg border ${
                  errors.hipaaTrainingDate ? 'border-red-300' : 'border-slate-300'
                } shadow-sm focus:ring-slate-500 focus:border-slate-500 transition-colors`}
              />
              {errors.hipaaTrainingDate && (
                <p className="mt-1 text-sm text-red-600">{errors.hipaaTrainingDate}</p>
              )}
            </div>

            <div>
              <label htmlFor="emergencyContactName" className="block text-sm font-medium text-slate-700 mb-2">
                Emergency Contact Name <span className="text-red-500">*</span>
              </label>
              <input
                id="emergencyContactName"
                type="text"
                value={formData.emergencyContactName}
                onChange={(e) => handleInputChange('emergencyContactName', e.target.value)}
                className={`block w-full min-h-[48px] px-4 py-3 text-base rounded-lg border ${
                  errors.emergencyContactName ? 'border-red-300' : 'border-slate-300'
                } shadow-sm focus:ring-slate-500 focus:border-slate-500 transition-colors`}
              />
              {errors.emergencyContactName && (
                <p className="mt-1 text-sm text-red-600">{errors.emergencyContactName}</p>
              )}
            </div>

            <div>
              <label htmlFor="emergencyContactPhone" className="block text-sm font-medium text-slate-700 mb-2">
                Emergency Contact Phone <span className="text-red-500">*</span>
              </label>
              <input
                id="emergencyContactPhone"
                type="tel"
                value={formData.emergencyContactPhone}
                onChange={(e) => handleInputChange('emergencyContactPhone', e.target.value)}
                placeholder="(XXX) XXX-XXXX"
                className={`block w-full min-h-[48px] px-4 py-3 text-base rounded-lg border ${
                  errors.emergencyContactPhone ? 'border-red-300' : 'border-slate-300'
                } shadow-sm focus:ring-slate-500 focus:border-slate-500 transition-colors`}
              />
              {errors.emergencyContactPhone && (
                <p className="mt-1 text-sm text-red-600">{errors.emergencyContactPhone}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div 
      className={`fixed inset-0 z-50 overflow-y-auto transition-opacity duration-300 ${
        isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}
    >
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div 
          className={`fixed inset-0 transition-opacity ${
            isOpen ? 'opacity-75' : 'opacity-0'
          }`} 
          aria-hidden="true"
        >
          <div className="absolute inset-0 bg-slate-500"></div>
        </div>

        <div 
          className={`inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full ${
            isOpen ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
          }`}
        >
          {/* Header */}
          <div className="bg-white px-6 py-4 border-b border-slate-200">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-slate-900">Add New User</h3>
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-slate-500 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="bg-white px-6 py-6">
            <div className="space-y-8">
              {renderBasicFields()}
              {renderDoctorFields()}
              {renderAssistantFields()}
            </div>
          </div>

          {/* Footer */}
          <div className="bg-slate-50 px-6 py-4 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center text-sm text-slate-500">
                {errors.submit && (
                  <div className="flex items-center text-red-600">
                    <AlertCircle className="h-4 w-4 mr-2" />
                    {errors.submit}
                  </div>
                )}
              </div>
              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => handleSubmit(true)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-500 transition-colors"
                >
                  Save as Draft
                </button>
                <button
                  type="button"
                  onClick={() => handleSubmit(false)}
                  disabled={isSubmitting}
                  className={`inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-sm text-white ${
                    isSubmitting
                      ? 'bg-slate-400 cursor-not-allowed'
                      : 'bg-slate-600 hover:bg-slate-700'
                  } transition-colors min-w-[120px] justify-center`}
                >
                  {isSubmitting ? (
                    <div className="animate-spin">
                      <RefreshCw className="h-5 w-5" />
                    </div>
                  ) : (
                    'Create User'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddUserModal;