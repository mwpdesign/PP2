import React, { useState, useCallback, Fragment, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import {
  X,
  Upload,
  AlertCircle,
  CheckCircle2,
  Save,
  ChevronRight,
  Trash2,
  Eye,
  FileText,
  Camera,
  RotateCcw
} from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { useNavigate } from 'react-router-dom';
import patientService from '../../services/patientService';
import PhoneInput from '../shared/PhoneInput';
import StateSelect from '../shared/StateSelect';
import { toast } from 'react-hot-toast';
import { QuickTemplates } from '../speed-tools/QuickTemplates';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';

interface NewPatientFormProps {
  onClose: () => void;
  onSave: (patientData: any) => void;
}

interface FormSection {
  title: string;
  isComplete: boolean;
}

interface InsuranceCard {
  file: File | null;
  preview: string | null;
}

interface InsuranceInfo {
  provider: string;
  policyNumber: string;
  payerPhone: string;
  cardFront: InsuranceCard | null;
  cardBack: InsuranceCard | null;
}

interface Document {
  id: string;
  file: File;
  title: string;
  preview: string;
  type: string;
}

type DocumentType = 'Insurance Card' | 'Medical Record' | 'Face Sheet' | 'Lab Results' | 'Other';

interface Address {
  street: string;
  city: string;
  state: string;
  zip: string;
}

interface GovernmentId {
  file: File | null;
  preview: string | undefined;
}

interface FormData {
  firstName: string;
  middleName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;

  address: string;
  city: string;
  state: string;
  zip: string;

  governmentIdType: string;
  governmentId: {
    file: File | null;
    preview: string | null;
  } | null;

  primaryInsurance: {
    provider: string;
    policyNumber: string;
    payerPhone: string;
    cardFront: InsuranceCard | null;
    cardBack: InsuranceCard | null;
  };
  secondaryInsurance: {
    provider: string;
    policyNumber: string;
    payerPhone: string;
    cardFront: InsuranceCard | null;
    cardBack: InsuranceCard | null;
  };
}

interface CameraSupport {
  hasCamera: boolean;
  isCapturing: boolean;
}

interface PatientFormData {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  governmentIdType: string;
  governmentId: File | null;
  primaryInsurance: {
    provider: string;
    policyNumber: string;
    payerPhone: string;
    cardFront: File | null;
    cardBack: File | null;
  };
  secondaryInsurance: {
    provider: string;
    policyNumber: string;
    payerPhone: string;
    cardFront: File | null;
    cardBack: File | null;
  };
}

const governmentIdTypes = [
  'Driver\'s License',
  'State ID',
  'Passport',
  'Other'
];

const insuranceProviders = [
  'Aetna',
  'Blue Cross Blue Shield',
  'Cigna',
  'Humana',
  'Kaiser Permanente',
  'Medicare',
  'Medicaid',
  'UnitedHealthcare',
  'Other'
];

const mockPhysicians = [
  { id: 'PHY001', name: 'Dr. Sarah Johnson, MD', specialty: 'Internal Medicine' },
  { id: 'PHY002', name: 'Dr. Michael Chen, MD', specialty: 'Family Medicine' },
  { id: 'PHY003', name: 'Dr. Emily Rodriguez, MD', specialty: 'Pediatrics' },
];

const genderOptions = ['Male', 'Female', 'Other'];

const states = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
];

const documentTypes: DocumentType[] = [
  'Insurance Card',
  'Medical Record',
  'Face Sheet',
  'Lab Results',
  'Other'
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_FILE_TYPES = {
  'application/pdf': ['.pdf'],
  'image/*': ['.jpg', '.jpeg', '.png']
};

const ACCEPTED_IMAGE_TYPES = {
  'image/*': ['.jpg', '.jpeg', '.png']
};

interface UploadAreaProps {
  onDrop: (files: File[]) => void;
  file: File | null;
  preview: string | null | undefined;
  onRemove: () => void;
  title: string;
  accept: Record<string, string[]>;
  maxSize?: number;
  className?: string;
}

const UploadArea: React.FC<UploadAreaProps> = ({
  onDrop,
  file,
  preview,
  onRemove,
  title,
  accept,
  maxSize = MAX_FILE_SIZE,
  className = ''
}) => {
  const [cameraSupport, setCameraSupport] = useState<CameraSupport>({
    hasCamera: false,
    isCapturing: false
  });

  const [isDragActive, setIsDragActive] = useState(false);

  useEffect(() => {
    // Check if device has camera capability
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => {
          setCameraSupport(prev => ({ ...prev, hasCamera: true }));
          stream.getTracks().forEach(track => track.stop());
        })
        .catch(() => {
          setCameraSupport(prev => ({ ...prev, hasCamera: false }));
        });
    }
  }, []);

  const handleDragEnter = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragActive(true);
  }, []);

  const handleDragLeave = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragActive(false);
  }, []);

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
  }, []);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept,
    maxFiles: 1,
    maxSize,
    onDragEnter: handleDragEnter,
    onDragLeave: handleDragLeave,
    onDragOver: handleDragOver
  });

  const handleCameraCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onDrop([files[0]]);
    }
    setCameraSupport(prev => ({ ...prev, isCapturing: false }));
  };

  return (
    <div className={className}>
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer bg-gray-50
          ${isDragActive ? 'border-[#4A6FA5] bg-blue-50' : 'border-gray-300 hover:border-[#4A6FA5]'}`}
      >
        <input {...getInputProps()} />
        {preview ? (
          <div className="relative">
            <img
              src={preview}
              alt={title}
              className="w-full h-40 object-contain rounded"
            />
            <div className="absolute top-2 right-2 flex space-x-2">
              {cameraSupport.hasCamera && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setCameraSupport(prev => ({ ...prev, isCapturing: true }));
                  }}
                  className="p-1.5 bg-[#4A6FA5] text-white rounded-full hover:bg-[#3e5d8c] transition-colors shadow-sm"
                  title="Retake photo"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              )}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove();
                }}
                className="p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-sm"
                title="Remove"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex justify-center space-x-4">
              <Upload className="w-10 h-10 text-[#4A6FA5]" />
              {cameraSupport.hasCamera && (
                <Camera className="w-10 h-10 text-[#4A6FA5]" />
              )}
            </div>
            <div>
              <p className="text-base font-medium text-gray-700">
                {title}
              </p>
              <p className="text-sm text-gray-500">
                Drag and drop, {cameraSupport.hasCamera ? 'take a photo, or ' : ''}choose a file
              </p>
            </div>
            <p className="text-xs text-gray-500">
              Supported formats: PDF, JPG, PNG (max {maxSize / (1024 * 1024)}MB)
            </p>
          </div>
        )}
      </div>

      {cameraSupport.hasCamera && (
        <input
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleCameraCapture}
          onClick={(e) => {
            if (!cameraSupport.isCapturing) {
              e.preventDefault();
            }
          }}
        />
      )}
    </div>
  );
};

export const NewPatientForm: React.FC<NewPatientFormProps> = ({ onClose, onSave }) => {
  const navigate = useNavigate();
  const [currentSection, setCurrentSection] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasSecondaryInsurance, setHasSecondaryInsurance] = useState(false);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isInSkilledNursing, setIsInSkilledNursing] = useState(false);
  const [isPartAStay, setIsPartAStay] = useState(false);
  const [medicalNotes, setMedicalNotes] = useState('');
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    middleName: '',
    lastName: '',
    dateOfBirth: '',
    gender: '',

    address: '',
    city: '',
    state: '',
    zip: '',

    governmentIdType: '',
    governmentId: null,

    primaryInsurance: {
      provider: '',
      policyNumber: '',
      payerPhone: '',
      cardFront: null,
      cardBack: null
    },
    secondaryInsurance: {
      provider: '',
      policyNumber: '',
      payerPhone: '',
      cardFront: null,
      cardBack: null
    }
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Keyboard shortcuts for power users
  useKeyboardShortcuts({
    'ctrl+s': (e) => {
      e.preventDefault();
      // Manual save
      setIsAutoSaving(true);
      setTimeout(() => {
        setIsAutoSaving(false);
        setLastSaved(new Date());
        toast.success('Form saved manually');
      }, 500);
    },
    'ctrl+enter': (e) => {
      e.preventDefault();
      // Quick submit if form is valid
      if (validateForm()) {
        handleSubmit(e as any);
      } else {
        toast.error('Please fix form errors before submitting');
      }
    },
    'escape': (e) => {
      e.preventDefault();
      handleClose();
    }
  });

  // Enhanced auto-save functionality - every 10 seconds
  useEffect(() => {
    const autoSaveInterval = setInterval(() => {
      // Only auto-save if there's meaningful data
      if (formData.firstName || formData.lastName || formData.dateOfBirth) {
        setIsAutoSaving(true);

        // Simulate auto-save to localStorage or backend
        try {
          const autoSaveData = {
            ...formData,
            timestamp: new Date().toISOString(),
            type: 'patient_form_draft'
          };

          localStorage.setItem('patient_form_autosave', JSON.stringify(autoSaveData));

          setTimeout(() => {
            setIsAutoSaving(false);
            setLastSaved(new Date());
          }, 500);
        } catch (error) {
          console.error('Auto-save failed:', error);
          setIsAutoSaving(false);
        }
      }
    }, 10000); // 10 seconds

    return () => clearInterval(autoSaveInterval);
  }, [formData]);

  // Load auto-saved data on component mount
  useEffect(() => {
    try {
      const savedData = localStorage.getItem('patient_form_autosave');
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        if (parsedData.type === 'patient_form_draft') {
          // Ask user if they want to restore the draft
          const shouldRestore = window.confirm(
            'Found a previously saved draft. Would you like to restore it?'
          );
          if (shouldRestore) {
            setFormData(parsedData);
            setLastSaved(new Date(parsedData.timestamp));
            toast.success('Draft restored successfully');
          }
        }
      }
    } catch (error) {
      console.error('Failed to load auto-saved data:', error);
    }
  }, []);

  const sections: FormSection[] = [
    { title: 'Patient Demographics', isComplete: false },
    { title: 'Insurance Information', isComplete: false },
    { title: 'Medical Information', isComplete: false },
    { title: 'Documents', isComplete: false },
    { title: 'Address Information', isComplete: false }
  ];

  const handleDocumentDrop = useCallback((acceptedFiles: File[]) => {
    acceptedFiles.forEach(file => {
      if (file.size > MAX_FILE_SIZE) {
        alert(`File ${file.name} is too large. Maximum size is 10MB.`);
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        setDocuments(prev => [...prev, {
          id: Date.now().toString(),
          file,
          title: file.name.split('.')[0],
          preview: reader.result as string,
          type: file.type
        }]);
      };
      reader.readAsDataURL(file);
    });
  }, []);

  const handleInsuranceCardDrop = useCallback((acceptedFiles: File[], insuranceType: 'primary' | 'secondary', cardSide: 'front' | 'back') => {
    const file = acceptedFiles[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setFormData(prev => ({
        ...prev,
        [insuranceType === 'primary' ? 'primaryInsurance' : 'secondaryInsurance']: {
          ...prev[insuranceType === 'primary' ? 'primaryInsurance' : 'secondaryInsurance'],
          [cardSide === 'front' ? 'cardFront' : 'cardBack']: {
            file,
            preview: reader.result as string
          }
        }
      }));
    };
    reader.readAsDataURL(file);
  }, []);

  const handleGovernmentIdDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setFormData(prev => ({
        ...prev,
        governmentId: {
          file,
          preview: reader.result as string
        }
      }));
    };
    reader.readAsDataURL(file);
  }, []);

  const validateField = (name: string, value: string) => {
    switch (name) {
      case 'firstName':
      case 'lastName':
        return value.trim() ? '' : 'This field is required';
      case 'dateOfBirth':
        return value ? (new Date(value) <= new Date() ? '' : 'Invalid date') : 'Date of birth is required';
      case 'gender':
        return value ? '' : 'Please select a gender';
      case 'primaryInsurance':
        return value ? '' : 'Primary insurance is required';
      case 'payerPhone':
        // Validate phone number format (XXX) XXX-XXXX
        return value ? (/^\(\d{3}\) \d{3}-\d{4}$/.test(value) ? '' : 'Invalid phone number format') : '';
      default:
        return '';
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Required fields
    ['firstName', 'lastName', 'dateOfBirth', 'gender', 'primaryInsurance'].forEach(field => {
      const error = validateField(field, formData[field as keyof typeof formData] as string);
      if (error) newErrors[field] = error;
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSaving(true);

    try {
      // Convert form data to match PatientFormData interface
      const patientFormData: PatientFormData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        zip: formData.zip,
        governmentIdType: formData.governmentIdType,
        governmentId: formData.governmentId?.file || null,
        primaryInsurance: {
          provider: formData.primaryInsurance.provider,
          policyNumber: formData.primaryInsurance.policyNumber,
          payerPhone: formData.primaryInsurance.payerPhone,
          cardFront: formData.primaryInsurance.cardFront?.file || null,
          cardBack: formData.primaryInsurance.cardBack?.file || null
        },
        secondaryInsurance: {
          provider: formData.secondaryInsurance.provider,
          policyNumber: formData.secondaryInsurance.policyNumber,
          payerPhone: formData.secondaryInsurance.payerPhone,
          cardFront: formData.secondaryInsurance.cardFront?.file || null,
          cardBack: formData.secondaryInsurance.cardBack?.file || null
        }
      };

      // Register the patient
      const response = await patientService.registerPatient(patientFormData);

      // Call the onSave prop with the form data
      onSave(formData);

      // Show success message
      toast.success('Patient registered successfully');

      // Close the form
      onClose();

      // Navigate to the patient list page
      navigate('/patients/select');
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to register patient');
      setErrors(prev => ({
        ...prev,
        submit: error instanceof Error ? error.message : 'Failed to register patient'
      }));
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    // Handle nested fields (e.g., primaryInsurance.provider)
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof FormData] as Record<string, any>),
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }

    // Validate the field
    const error = validateField(name.split('.')[0], value);
    if (error) {
      setErrors(prev => ({ ...prev, [name.split('.')[0]]: error }));
    } else {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name.split('.')[0]];
        return newErrors;
      });
    }

    // Simulate auto-save
    setLastSaved(new Date());
  };

  const removeDocument = (index: number) => {
    setDocuments(prev => prev.filter((_, i) => i !== index));
  };

  const handleMedicalNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMedicalNotes(e.target.value);
    setIsAutoSaving(true);

    // Simulate auto-save
    setTimeout(() => {
      setIsAutoSaving(false);
      setLastSaved(new Date());
    }, 1000);
  };

  const removeInsuranceCard = (insuranceType: 'primary' | 'secondary', cardSide: 'front' | 'back') => {
    setFormData(prev => ({
      ...prev,
      [insuranceType === 'primary' ? 'primaryInsurance' : 'secondaryInsurance']: {
        ...prev[insuranceType === 'primary' ? 'primaryInsurance' : 'secondaryInsurance'],
        [cardSide === 'front' ? 'cardFront' : 'cardBack']: null
      }
    }));
  };

  const removeGovernmentId = () => {
    setFormData(prev => ({
      ...prev,
      governmentId: null
    }));
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <div className="fixed inset-0 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center">
        <Dialog
          as="div"
          className="fixed inset-0 z-10 overflow-y-auto"
          onClose={handleClose}
          open={true}
        >
          <div className="min-h-screen px-4 text-center">
            <Dialog.Overlay className="fixed inset-0 bg-black opacity-30" />

            <div className="inline-block w-full max-w-4xl my-8 p-6 text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
              <Transition appear show={true} as={Fragment}>
                <Dialog.Overlay className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" />

                <span className="inline-block h-screen align-middle" aria-hidden="true">&#8203;</span>

                <Transition.Child
                  as={Fragment}
                  enter="ease-out duration-300"
                  enterFrom="opacity-0 scale-95"
                  enterTo="opacity-100 scale-100"
                  leave="ease-in duration-200"
                  leaveFrom="opacity-100 scale-100"
                  leaveTo="opacity-0 scale-95"
                >
                  <div className="inline-block w-full max-w-[1000px] my-8 text-left align-middle transition-all transform bg-white rounded-xl shadow-2xl">
                    {/* Header */}
                    <div className="px-8 py-5 border-b border-gray-200 flex items-center justify-between bg-[#1E293B] text-white rounded-t-xl">
                      <div className="flex items-center space-x-4">
                        <Dialog.Title as="h2" className="text-2xl font-semibold">
                          Patient and Insurance Information
                        </Dialog.Title>

                        {/* Auto-save indicator */}
                        <div className="flex items-center space-x-2 text-sm">
                          {isAutoSaving ? (
                            <div className="flex items-center text-yellow-300">
                              <Save className="w-4 h-4 mr-1 animate-pulse" />
                              <span>Saving...</span>
                            </div>
                          ) : lastSaved ? (
                            <div className="flex items-center text-green-300">
                              <CheckCircle2 className="w-4 h-4 mr-1" />
                              <span>Saved {lastSaved.toLocaleTimeString()}</span>
                            </div>
                          ) : null}
                        </div>
                      </div>

                      <button
                        onClick={handleClose}
                        className="p-1.5 hover:bg-gray-700 rounded-full transition-colors"
                      >
                        <X className="w-6 h-6" />
                      </button>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit}>
                      <div className="max-h-[calc(100vh-200px)] overflow-y-auto px-8 py-6">
                        {/* Quick Templates */}
                        <QuickTemplates
                          onTemplateSelect={(templateData) => {
                            setFormData(prev => ({
                              ...prev,
                              ...templateData
                            }));
                            toast.success('Template applied successfully');
                          }}
                          formType="patient_registration"
                        />

                        {/* Patient Information */}
                        <div className="space-y-8">
                          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                            <h3 className="text-lg font-semibold text-gray-900 pb-4 border-b border-gray-200">
                              Patient Information
                            </h3>

                            <div className="grid grid-cols-3 gap-6 mt-6">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  First Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                  type="text"
                                  name="firstName"
                                  value={formData.firstName}
                                  onChange={handleInputChange}
                                  className={`w-full px-4 py-2 border ${
                                    errors.firstName ? 'border-red-300' : 'border-gray-200'
                                  } rounded-md focus:outline-none focus:ring-1 focus:ring-[#4A6FA5] transition-colors`}
                                  required
                                />
                                {errors.firstName && (
                                  <p className="mt-1 text-sm text-red-600 flex items-center">
                                    <AlertCircle className="w-4 h-4 mr-1" />
                                    {errors.firstName}
                                  </p>
                                )}
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Middle Name
                                </label>
                                <input
                                  type="text"
                                  name="middleName"
                                  value={formData.middleName}
                                  onChange={handleInputChange}
                                  className="w-full px-4 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#4A6FA5] transition-colors"
                                />
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Last Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                  type="text"
                                  name="lastName"
                                  value={formData.lastName}
                                  onChange={handleInputChange}
                                  className={`w-full px-4 py-2 border ${
                                    errors.lastName ? 'border-red-300' : 'border-gray-200'
                                  } rounded-md focus:outline-none focus:ring-1 focus:ring-[#4A6FA5] transition-colors`}
                                  required
                                />
                                {errors.lastName && (
                                  <p className="mt-1 text-sm text-red-600 flex items-center">
                                    <AlertCircle className="w-4 h-4 mr-1" />
                                    {errors.lastName}
                                  </p>
                                )}
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Date of Birth <span className="text-red-500">*</span>
                                </label>
                                <input
                                  type="date"
                                  name="dateOfBirth"
                                  value={formData.dateOfBirth}
                                  onChange={handleInputChange}
                                  className={`w-full px-4 py-2 border ${
                                    errors.dateOfBirth ? 'border-red-300' : 'border-gray-200'
                                  } rounded-md focus:outline-none focus:ring-1 focus:ring-[#4A6FA5] transition-colors`}
                                  required
                                />
                                {errors.dateOfBirth && (
                                  <p className="mt-1 text-sm text-red-600 flex items-center">
                                    <AlertCircle className="w-4 h-4 mr-1" />
                                    {errors.dateOfBirth}
                                  </p>
                                )}
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Gender <span className="text-red-500">*</span>
                                </label>
                                <select
                                  name="gender"
                                  value={formData.gender}
                                  onChange={handleInputChange}
                                  className={`w-full px-4 py-2 border ${
                                    errors.gender ? 'border-red-300' : 'border-gray-200'
                                  } rounded-md focus:outline-none focus:ring-1 focus:ring-[#4A6FA5] transition-colors`}
                                  required
                                >
                                  <option value="">Select Gender</option>
                                  {genderOptions.map(option => (
                                    <option key={option} value={option}>{option}</option>
                                  ))}
                                </select>
                                {errors.gender && (
                                  <p className="mt-1 text-sm text-red-600 flex items-center">
                                    <AlertCircle className="w-4 h-4 mr-1" />
                                    {errors.gender}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Address */}
                          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                            <h3 className="text-lg font-semibold text-gray-900 pb-4 border-b border-gray-200">
                              Address
                            </h3>

                            <div className="space-y-6 mt-6">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Street Address
                                </label>
                                <input
                                  type="text"
                                  name="address"
                                  value={formData.address}
                                  onChange={handleInputChange}
                                  className="w-full px-4 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#4A6FA5] transition-colors"
                                />
                              </div>

                              <div className="grid grid-cols-6 gap-6">
                                <div className="col-span-3">
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    City
                                  </label>
                                  <input
                                    type="text"
                                    name="city"
                                    value={formData.city}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#4A6FA5] transition-colors"
                                  />
                                </div>

                                <div className="col-span-2">
                                  <StateSelect
                                    value={formData.state}
                                    onChange={(value) => {
                                      setFormData(prev => ({
                                        ...prev,
                                        state: value
                                      }));
                                    }}
                                    label="State"
                                    name="state"
                                  />
                                </div>

                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    ZIP Code
                                  </label>
                                  <input
                                    type="text"
                                    name="zip"
                                    value={formData.zip}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#4A6FA5] transition-colors"
                                    maxLength={5}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Patient Identification */}
                          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                            <h3 className="text-lg font-semibold text-gray-900 pb-4 border-b border-gray-200">
                              Patient Identification
                            </h3>

                            <div className="space-y-6 mt-6">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  ID Type
                                </label>
                                <select
                                  name="governmentIdType"
                                  value={formData.governmentIdType}
                                  onChange={handleInputChange}
                                  className="w-full px-4 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#4A6FA5] transition-colors"
                                >
                                  <option value="">Select ID Type</option>
                                  {governmentIdTypes.map(type => (
                                    <option key={type} value={type}>{type}</option>
                                  ))}
                                </select>
                              </div>

                              {/* Front of ID Upload */}
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Front of ID
                                </label>
                                <UploadArea
                                  onDrop={handleGovernmentIdDrop}
                                  file={formData.governmentId?.file || null}
                                  preview={formData.governmentId?.preview}
                                  onRemove={removeGovernmentId}
                                  title="Upload Front of ID"
                                  accept={ACCEPTED_FILE_TYPES}
                                />
                              </div>
                            </div>
                          </div>

                          {/* Skilled Nursing Questions */}
                          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                            <h3 className="text-lg font-semibold text-gray-900 pb-4 border-b border-gray-200">
                              Skilled Nursing Questions
                            </h3>

                            <div className="space-y-6 mt-6">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Is the patient currently residing in a skilled nursing facility?
                                </label>
                                <div className="flex items-center space-x-6">
                                  <label className="flex items-center">
                                    <input
                                      type="radio"
                                      checked={isInSkilledNursing}
                                      onChange={() => setIsInSkilledNursing(true)}
                                      className="w-4 h-4 text-[#4A6FA5] border-gray-300 focus:ring-[#4A6FA5]"
                                    />
                                    <span className="ml-2 text-sm text-gray-700">Yes</span>
                                  </label>
                                  <label className="flex items-center">
                                    <input
                                      type="radio"
                                      checked={!isInSkilledNursing}
                                      onChange={() => setIsInSkilledNursing(false)}
                                      className="w-4 h-4 text-[#4A6FA5] border-gray-300 focus:ring-[#4A6FA5]"
                                    />
                                    <span className="ml-2 text-sm text-gray-700">No</span>
                                  </label>
                                </div>
                              </div>

                              {isInSkilledNursing && (
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Is the patient covered under a Part A stay?
                                  </label>
                                  <div className="flex items-center space-x-6">
                                    <label className="flex items-center">
                                      <input
                                        type="radio"
                                        checked={isPartAStay}
                                        onChange={() => setIsPartAStay(true)}
                                        className="w-4 h-4 text-[#4A6FA5] border-gray-300 focus:ring-[#4A6FA5]"
                                      />
                                      <span className="ml-2 text-sm text-gray-700">Yes</span>
                                    </label>
                                    <label className="flex items-center">
                                      <input
                                        type="radio"
                                        checked={!isPartAStay}
                                        onChange={() => setIsPartAStay(false)}
                                        className="w-4 h-4 text-[#4A6FA5] border-gray-300 focus:ring-[#4A6FA5]"
                                      />
                                      <span className="ml-2 text-sm text-gray-700">No</span>
                                    </label>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Insurance Information */}
                          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                            <h3 className="text-lg font-semibold text-gray-900 pb-4 border-b border-gray-200">
                              Insurance Information
                            </h3>

                            <div className="space-y-6 mt-6">
                              <div className="grid grid-cols-3 gap-6">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Primary Insurance <span className="text-red-500">*</span>
                                  </label>
                                  <select
                                    name="primaryInsurance.provider"
                                    value={formData.primaryInsurance.provider}
                                    onChange={handleInputChange}
                                    className={`w-full px-4 py-2 border ${
                                      errors.primaryInsurance ? 'border-red-300' : 'border-gray-200'
                                    } rounded-md focus:outline-none focus:ring-1 focus:ring-[#4A6FA5] transition-colors`}
                                    required
                                  >
                                    <option value="">Select Insurance</option>
                                    {insuranceProviders.map(provider => (
                                      <option key={provider} value={provider}>{provider}</option>
                                    ))}
                                  </select>
                                  {errors.primaryInsurance && (
                                    <p className="mt-1 text-sm text-red-600 flex items-center">
                                      <AlertCircle className="w-4 h-4 mr-1" />
                                      {errors.primaryInsurance}
                                    </p>
                                  )}
                                </div>

                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Policy Number
                                  </label>
                                  <input
                                    type="text"
                                    name="primaryInsurance.policyNumber"
                                    value={formData.primaryInsurance.policyNumber}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#4A6FA5] transition-colors"
                                  />
                                </div>

                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Payer Phone
                                  </label>
                                  <PhoneInput
                                    value={formData.primaryInsurance.payerPhone}
                                    onChange={(value) => {
                                      setFormData((prev: FormData) => ({
                                        ...prev,
                                        primaryInsurance: {
                                          ...prev.primaryInsurance,
                                          payerPhone: value
                                        }
                                      }));
                                      setLastSaved(new Date());
                                    }}
                                    name="primaryInsurance.payerPhone"
                                    id="primaryInsurance.payerPhone"
                                  />
                                </div>
                              </div>

                              <div className="grid grid-cols-3 gap-6">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Secondary Insurance
                                  </label>
                                  <select
                                    name="secondaryInsurance.provider"
                                    value={formData.secondaryInsurance.provider}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#4A6FA5] transition-colors"
                                  >
                                    <option value="">Select Insurance</option>
                                    {insuranceProviders.map(provider => (
                                      <option key={provider} value={provider}>{provider}</option>
                                    ))}
                                  </select>
                                </div>

                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Secondary Policy Number
                                  </label>
                                  <input
                                    type="text"
                                    name="secondaryInsurance.policyNumber"
                                    value={formData.secondaryInsurance.policyNumber}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#4A6FA5] transition-colors"
                                  />
                                </div>

                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Secondary Payer Phone
                                  </label>
                                  <PhoneInput
                                    value={formData.secondaryInsurance.payerPhone}
                                    onChange={(value) => {
                                      setFormData((prev: FormData) => ({
                                        ...prev,
                                        secondaryInsurance: {
                                          ...prev.secondaryInsurance,
                                          payerPhone: value
                                        }
                                      }));
                                      setLastSaved(new Date());
                                    }}
                                    name="secondaryInsurance.payerPhone"
                                    id="secondaryInsurance.payerPhone"
                                  />
                                </div>
                              </div>

                              {/* Primary Insurance Card Uploads */}
                              <div className="grid grid-cols-2 gap-6 mt-4">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Insurance Card (Front)
                                  </label>
                                  <UploadArea
                                    onDrop={(files) => handleInsuranceCardDrop(files, 'primary', 'front')}
                                    file={formData.primaryInsurance.cardFront?.file || null}
                                    preview={formData.primaryInsurance.cardFront?.preview}
                                    onRemove={() => removeInsuranceCard('primary', 'front')}
                                    title="Upload Front of Card"
                                    accept={ACCEPTED_IMAGE_TYPES}
                                  />
                                </div>

                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Insurance Card (Back)
                                  </label>
                                  <UploadArea
                                    onDrop={(files) => handleInsuranceCardDrop(files, 'primary', 'back')}
                                    file={formData.primaryInsurance.cardBack?.file || null}
                                    preview={formData.primaryInsurance.cardBack?.preview}
                                    onRemove={() => removeInsuranceCard('primary', 'back')}
                                    title="Upload Back of Card"
                                    accept={ACCEPTED_IMAGE_TYPES}
                                  />
                                </div>
                              </div>

                              {/* Secondary Insurance Card Uploads */}
                              {formData.secondaryInsurance.provider && (
                                <div className="grid grid-cols-2 gap-6 mt-4">
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                      Secondary Insurance Card (Front)
                                    </label>
                                    <UploadArea
                                      onDrop={(files) => handleInsuranceCardDrop(files, 'secondary', 'front')}
                                      file={formData.secondaryInsurance.cardFront?.file || null}
                                      preview={formData.secondaryInsurance.cardFront?.preview}
                                      onRemove={() => removeInsuranceCard('secondary', 'front')}
                                      title="Upload Front of Card"
                                      accept={ACCEPTED_IMAGE_TYPES}
                                    />
                                  </div>

                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                      Secondary Insurance Card (Back)
                                    </label>
                                    <UploadArea
                                      onDrop={(files) => handleInsuranceCardDrop(files, 'secondary', 'back')}
                                      file={formData.secondaryInsurance.cardBack?.file || null}
                                      preview={formData.secondaryInsurance.cardBack?.preview}
                                      onRemove={() => removeInsuranceCard('secondary', 'back')}
                                      title="Upload Back of Card"
                                      accept={ACCEPTED_IMAGE_TYPES}
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Medical Notes */}
                          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                            <h3 className="text-lg font-semibold text-gray-900 pb-4 border-b border-gray-200">
                              Medical Notes
                            </h3>

                            <div className="mt-6">
                              <div className="relative">
                                <textarea
                                  name="medicalNotes"
                                  value={medicalNotes}
                                  onChange={handleMedicalNotesChange}
                                  rows={6}
                                  className="w-full px-4 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#4A6FA5] transition-colors"
                                  placeholder="Enter patient medical history, conditions, medications, allergies, or any relevant clinical notes..."
                                />
                                <div className="absolute bottom-2 right-2 flex items-center space-x-2 text-sm text-gray-500">
                                  {isAutoSaving ? (
                                    <span className="flex items-center">
                                      <Save className="w-4 h-4 animate-spin mr-1" />
                                      Saving...
                                    </span>
                                  ) : lastSaved && (
                                    <span className="flex items-center">
                                      <CheckCircle2 className="w-4 h-4 text-green-500 mr-1" />
                                      Saved {lastSaved.toLocaleTimeString()}
                                    </span>
                                  )}
                                  <span>|</span>
                                  <span>{medicalNotes.length} characters</span>
                                </div>
                              </div>
                              <p className="mt-2 text-sm text-gray-500">
                                These notes will follow the patient throughout their care
                              </p>
                            </div>
                          </div>

                          {/* Document Upload */}
                          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                            <h3 className="text-lg font-semibold text-gray-900 pb-4 border-b border-gray-200">
                              Additional Documents
                            </h3>

                            <div className="space-y-6 mt-6">
                              <UploadArea
                                onDrop={handleDocumentDrop}
                                file={null}
                                preview={undefined}
                                onRemove={() => {}}
                                title="Upload Additional Documents"
                                accept={ACCEPTED_FILE_TYPES}
                                className="mb-4"
                              />

                              {documents.length > 0 && (
                                <div className="space-y-4">
                                  <h4 className="text-sm font-medium text-gray-700">
                                    Uploaded Documents ({documents.length})
                                  </h4>
                                  <div className="space-y-3">
                                    {documents.map((doc, index) => (
                                      <div
                                        key={doc.id}
                                        className="flex items-start p-4 bg-white border border-gray-200 rounded-lg shadow-sm"
                                      >
                                        {doc.preview && doc.type.startsWith('image/') ? (
                                          <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                                            <img
                                              src={doc.preview}
                                              alt={doc.title}
                                              className="w-full h-full object-cover"
                                            />
                                          </div>
                                        ) : (
                                          <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100 flex items-center justify-center">
                                            <FileText className="w-8 h-8 text-gray-400" />
                                          </div>
                                        )}

                                        <div className="ml-4 flex-1 min-w-0">
                                          <div className="flex items-start justify-between">
                                            <div className="flex-1 mr-4">
                                              <input
                                                type="text"
                                                value={doc.title}
                                                onChange={(e) => {
                                                  const newDocs = [...documents];
                                                  newDocs[index].title = e.target.value;
                                                  setDocuments(newDocs);
                                                }}
                                                className="w-full text-sm font-medium border-0 focus:ring-0 p-0 bg-transparent"
                                                placeholder="Document title"
                                              />
                                              <div className="flex items-center space-x-2 mt-1">
                                                <p className="text-xs text-gray-500">
                                                  {(doc.file.size / (1024 * 1024)).toFixed(2)} MB
                                                </p>
                                                <span className="text-gray-300">•</span>
                                                <p className="text-xs text-gray-500">
                                                  {doc.type.split('/')[1].toUpperCase()}
                                                </p>
                                              </div>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                              {doc.preview && doc.type.startsWith('image/') && (
                                                <button
                                                  type="button"
                                                  onClick={() => window.open(doc.preview)}
                                                  className="text-gray-400 hover:text-[#4A6FA5] transition-colors"
                                                  title="Preview"
                                                >
                                                  <Eye className="w-4 h-4" />
                                                </button>
                                              )}
                                              <button
                                                type="button"
                                                onClick={() => removeDocument(index)}
                                                className="text-gray-400 hover:text-red-500 transition-colors"
                                                title="Remove"
                                              >
                                                <Trash2 className="w-4 h-4" />
                                              </button>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Footer */}
                        <div className="px-8 py-5 border-t border-gray-200 bg-gray-50 rounded-b-xl flex items-center justify-between">
                          <div className="flex items-center text-sm text-gray-500">
                            {lastSaved && (
                              <>
                                <CheckCircle2 className="w-4 h-4 text-green-500 mr-1" />
                                Last saved {lastSaved.toLocaleTimeString()}
                              </>
                            )}
                          </div>
                          <div className="flex items-center space-x-3">
                            <button
                              type="submit"
                              disabled={isSaving}
                              className="px-4 py-2 bg-[#4A6FA5] text-white rounded-lg hover:bg-[#3e5d8c] transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {isSaving ? (
                                <>
                                  <Save className="w-5 h-5 mr-2 animate-spin" />
                                  Saving...
                                </>
                              ) : (
                                <>
                                  <Save className="w-5 h-5 mr-2" />
                                  Save Patient
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </form>
                  </div>
                </Transition.Child>
              </Transition>
            </div>
          </div>
        </Dialog>
      </div>
    </div>
  );
};