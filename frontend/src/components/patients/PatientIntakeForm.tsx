import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import UniversalFileUpload from '../shared/UniversalFileUpload';
import { toast } from 'react-toastify';
import PhoneInput from '../shared/PhoneInput';
import StateSelect from '../shared/StateSelect';
import patientService from '../../services/patientService';

interface PatientIntakeFormData {
  // Personal Information
  firstName: string;
  middleName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  email: string;
  phone: string;

  // Address Information
  address: string;
  city: string;
  state: string;
  zipCode: string;

  // Skilled Nursing Facility
  inSkilledNursingFacility: boolean;
  coveredUnderPartA: boolean;

  // Insurance Information
  primaryInsurance: string;
  primaryPolicyNumber: string;
  primaryPayerPhone: string;
  secondaryInsurance: string;
  secondaryPolicyNumber: string;
  secondaryPayerPhone: string;

  // Additional Information
  notes: string;
}

interface DocumentFile {
  file: File | null;
  previewUrl: string | null;
  name?: string;
}

interface DocumentFiles {
  identification: DocumentFile;
  faceSheet: DocumentFile;
  insuranceFront: DocumentFile;
  insuranceBack: DocumentFile;
  additionalDocs: DocumentFile[];
}

const initialFormData: PatientIntakeFormData = {
  firstName: '',
  middleName: '',
  lastName: '',
  dateOfBirth: '',
  gender: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  state: '',
  zipCode: '',
  inSkilledNursingFacility: false,
  coveredUnderPartA: false,
  primaryInsurance: '',
  primaryPolicyNumber: '',
  primaryPayerPhone: '',
  secondaryInsurance: '',
  secondaryPolicyNumber: '',
  secondaryPayerPhone: '',
  notes: ''
};

const initialDocumentFiles: DocumentFiles = {
  identification: { file: null, previewUrl: null },
  faceSheet: { file: null, previewUrl: null },
  insuranceFront: { file: null, previewUrl: null },
  insuranceBack: { file: null, previewUrl: null },
  additionalDocs: []
};

const PatientIntakeForm: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<PatientIntakeFormData>(initialFormData);
  const [documentFiles, setDocumentFiles] = useState<DocumentFiles>(initialDocumentFiles);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      const checkbox = e.target as HTMLInputElement;
      setFormData(prev => ({
        ...prev,
        [name]: checkbox.checked
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleFileSelect = (type: keyof DocumentFiles, file: File | null) => {
    if (!file) {
      handleFileRemove(type);
      return;
    }

    const previewUrl = URL.createObjectURL(file);

    if (type === 'additionalDocs') {
      setDocumentFiles(prev => ({
        ...prev,
        additionalDocs: [...prev.additionalDocs, { file, previewUrl }]
      }));
    } else {
      setDocumentFiles(prev => ({
        ...prev,
        [type]: { file, previewUrl }
      }));
    }
  };

  const handleFileRemove = (type: keyof DocumentFiles, index?: number) => {
    if (type === 'additionalDocs' && typeof index === 'number') {
      setDocumentFiles(prev => ({
        ...prev,
        additionalDocs: prev.additionalDocs.filter((_, i) => i !== index)
      }));
    } else {
      setDocumentFiles(prev => ({
        ...prev,
        [type]: { file: null, previewUrl: null }
      }));
    }
  };

    const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Prepare patient data for API
      const patientData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        zip: formData.zipCode,
        governmentIdType: 'drivers_license', // Default for now
        governmentId: documentFiles.identification.file,
        primaryInsurance: {
          provider: formData.primaryInsurance,
          policyNumber: formData.primaryPolicyNumber,
          payerPhone: formData.primaryPayerPhone,
          cardFront: documentFiles.insuranceFront.file,
          cardBack: documentFiles.insuranceBack.file,
        },
        secondaryInsurance: {
          provider: formData.secondaryInsurance || '',
          policyNumber: formData.secondaryPolicyNumber || '',
          payerPhone: formData.secondaryPayerPhone || '',
          cardFront: null,
          cardBack: null,
        },
      };

      // Submit patient data to backend
      const response = await patientService.registerPatient(patientData);

      toast.success('Patient registered successfully!');
      console.log('Patient created:', response);

      // Navigate to patient list after successful submission
      navigate('/doctor/patients/select');
    } catch (error) {
      console.error('Error submitting patient data:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to register patient');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Personal Information Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Personal Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
              First Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="firstName"
              id="firstName"
              required
              value={formData.firstName}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="middleName" className="block text-sm font-medium text-gray-700">
              Middle Name
            </label>
            <input
              type="text"
              name="middleName"
              id="middleName"
              value={formData.middleName}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
              Last Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="lastName"
              id="lastName"
              required
              value={formData.lastName}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700">
              Date of Birth <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              name="dateOfBirth"
              id="dateOfBirth"
              required
              value={formData.dateOfBirth}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="gender" className="block text-sm font-medium text-gray-700">
              Gender <span className="text-red-500">*</span>
            </label>
            <select
              name="gender"
              id="gender"
              required
              value={formData.gender}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="">Select Gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
              <option value="prefer-not-to-say">Prefer not to say</option>
            </select>
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email Address <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              name="email"
              id="email"
              required
              value={formData.email}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>
          <div>
            <PhoneInput
              value={formData.phone}
              onChange={(value) => {
                setFormData(prev => ({
                  ...prev,
                  phone: value
                }));
              }}
              label="Phone Number"
              id="phone"
              name="phone"
            />
          </div>
        </div>
      </div>

      {/* Address Information Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Address Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label htmlFor="address" className="block text-sm font-medium text-gray-700">
              Street Address
            </label>
            <input
              type="text"
              name="address"
              id="address"
              value={formData.address}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="city" className="block text-sm font-medium text-gray-700">
              City
            </label>
            <input
              type="text"
              name="city"
              id="city"
              value={formData.city}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>
          <div>
            <StateSelect
              value={formData.state}
              onChange={(value) => {
                setFormData(prev => ({
                  ...prev,
                  state: value
                }));
              }}
              label="State"
              id="state"
              name="state"
            />
          </div>
          <div>
            <label htmlFor="zipCode" className="block text-sm font-medium text-gray-700">
              ZIP Code
            </label>
            <input
              type="text"
              name="zipCode"
              id="zipCode"
              value={formData.zipCode}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>
        </div>
      </div>

      {/* Skilled Nursing Facility Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Skilled Nursing Facility</h2>
        <div className="space-y-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              name="inSkilledNursingFacility"
              id="inSkilledNursingFacility"
              checked={formData.inSkilledNursingFacility}
              onChange={handleInputChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="inSkilledNursingFacility" className="ml-2 block text-sm text-gray-700">
              Is patient currently residing in skilled nursing facility?
            </label>
          </div>
          {formData.inSkilledNursingFacility && (
            <div className="flex items-center ml-6">
              <input
                type="checkbox"
                name="coveredUnderPartA"
                id="coveredUnderPartA"
                checked={formData.coveredUnderPartA}
                onChange={handleInputChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="coveredUnderPartA" className="ml-2 block text-sm text-gray-700">
                Is patient covered under Part A stay?
              </label>
            </div>
          )}
        </div>
      </div>

      {/* Insurance Information Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Insurance Information</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="primaryInsurance" className="block text-sm font-medium text-gray-700">
                Primary Insurance <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="primaryInsurance"
                id="primaryInsurance"
                required
                value={formData.primaryInsurance}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>
            <div>
              <label htmlFor="primaryPolicyNumber" className="block text-sm font-medium text-gray-700">
                Policy Number
              </label>
              <input
                type="text"
                name="primaryPolicyNumber"
                id="primaryPolicyNumber"
                value={formData.primaryPolicyNumber}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>
            <div>
              <label htmlFor="primaryPayerPhone" className="block text-sm font-medium text-gray-700">
                Payer Phone
              </label>
              <PhoneInput
                value={formData.primaryPayerPhone}
                onChange={(value) => {
                  setFormData(prev => ({
                    ...prev,
                    primaryPayerPhone: value
                  }));
                }}
                id="primaryPayerPhone"
                name="primaryPayerPhone"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="secondaryInsurance" className="block text-sm font-medium text-gray-700">
                Secondary Insurance
              </label>
              <input
                type="text"
                name="secondaryInsurance"
                id="secondaryInsurance"
                value={formData.secondaryInsurance}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>
            <div>
              <label htmlFor="secondaryPolicyNumber" className="block text-sm font-medium text-gray-700">
                Policy Number
              </label>
              <input
                type="text"
                name="secondaryPolicyNumber"
                id="secondaryPolicyNumber"
                value={formData.secondaryPolicyNumber}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>
            <div>
              <label htmlFor="secondaryPayerPhone" className="block text-sm font-medium text-gray-700">
                Payer Phone
              </label>
              <PhoneInput
                value={formData.secondaryPayerPhone}
                onChange={(value) => {
                  setFormData(prev => ({
                    ...prev,
                    secondaryPayerPhone: value
                  }));
                }}
                id="secondaryPayerPhone"
                name="secondaryPayerPhone"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Document Upload Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Required Documents</h2>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-6">
              <UniversalFileUpload
                label="Government ID"
                description="Upload a valid government-issued ID"
                required
                value={documentFiles.identification.file}
                onChange={handleFileSelect.bind(null, 'identification')}
                status="pending"
                acceptedFileTypes={['.pdf', '.jpg', '.jpeg', '.png', '.tiff']}
                maxSizeMB={25}
                showCamera={true}
              />

              <UniversalFileUpload
                label="Face Sheet"
                description="Upload patient face sheet"
                required
                value={documentFiles.faceSheet.file}
                onChange={handleFileSelect.bind(null, 'faceSheet')}
                status="pending"
                acceptedFileTypes={['.pdf', '.jpg', '.jpeg', '.png', '.tiff']}
                maxSizeMB={25}
                showCamera={true}
              />
            </div>

            <div className="space-y-6">
              <UniversalFileUpload
                label="Insurance Card (Front)"
                description="Upload front side of insurance card"
                required
                value={documentFiles.insuranceFront.file}
                onChange={handleFileSelect.bind(null, 'insuranceFront')}
                status="pending"
                acceptedFileTypes={['.pdf', '.jpg', '.jpeg', '.png', '.tiff']}
                maxSizeMB={25}
                showCamera={true}
              />

              <UniversalFileUpload
                label="Insurance Card (Back)"
                description="Upload back side of insurance card"
                required
                value={documentFiles.insuranceBack.file}
                onChange={handleFileSelect.bind(null, 'insuranceBack')}
                status="pending"
                acceptedFileTypes={['.pdf', '.jpg', '.jpeg', '.png', '.tiff']}
                maxSizeMB={25}
                showCamera={true}
              />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Additional Documents</h3>
            <div className="grid grid-cols-1 gap-4">
              {documentFiles.additionalDocs.map((doc, index) => (
                <div key={index} className="relative">
                  <UniversalFileUpload
                    label={`Additional Document ${index + 1}`}
                    description="Additional supporting document"
                    value={doc.file}
                    onChange={(file) => {
                      if (!file) {
                        setDocumentFiles(prev => ({
                          ...prev,
                          additionalDocs: prev.additionalDocs.filter((_, i) => i !== index)
                        }));
                      } else {
                        const previewUrl = URL.createObjectURL(file);
                        setDocumentFiles(prev => ({
                          ...prev,
                          additionalDocs: prev.additionalDocs.map((d, i) =>
                            i === index ? { file, previewUrl } : d
                          )
                        }));
                      }
                    }}
                    status="pending"
                    acceptedFileTypes={['.pdf', '.jpg', '.jpeg', '.png', '.tiff']}
                    maxSizeMB={25}
                    showCamera={true}
                  />
                </div>
              ))}

              <UniversalFileUpload
                label="Add Document"
                description="Upload additional supporting document"
                value={null}
                onChange={(file) => {
                  if (file) {
                    const previewUrl = URL.createObjectURL(file);
                    setDocumentFiles(prev => ({
                      ...prev,
                      additionalDocs: [...prev.additionalDocs, { file, previewUrl }]
                    }));
                  }
                }}
                status="pending"
                acceptedFileTypes={['.pdf', '.jpg', '.jpeg', '.png', '.tiff']}
                maxSizeMB={25}
                showCamera={true}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Notes Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Additional Notes</h2>
        <div>
          <textarea
            name="notes"
            id="notes"
            rows={4}
            value={formData.notes}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            placeholder="Enter any additional notes or comments..."
          />
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-4">
        <button
          type="button"
          onClick={() => navigate('/patients')}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 text-sm font-medium text-white bg-[#2C3E50] border border-transparent rounded-md hover:bg-[#375788] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2C3E50] disabled:opacity-50"
        >
          {isSubmitting ? 'Saving...' : 'Save Patient'}
        </button>
      </div>
    </form>
  );
};

export default PatientIntakeForm;