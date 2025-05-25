import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DocumentUpload from '../shared/DocumentUpload';

interface PatientIntakeFormData {
  // Personal Information
  firstName: string;
  middleName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  
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

  const handleFileSelect = (type: keyof DocumentFiles, file: File) => {
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
      // TODO: Implement API call to save patient data and upload documents
      console.log('Submitting patient data:', formData);
      console.log('Uploading documents:', documentFiles);
      
      // Navigate to patient list after successful submission
      navigate('/patients');
    } catch (error) {
      console.error('Error submitting patient data:', error);
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
            <label htmlFor="state" className="block text-sm font-medium text-gray-700">
              State
            </label>
            <input
              type="text"
              name="state"
              id="state"
              value={formData.state}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
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
              <input
                type="tel"
                name="primaryPayerPhone"
                id="primaryPayerPhone"
                value={formData.primaryPayerPhone}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
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
              <input
                type="tel"
                name="secondaryPayerPhone"
                id="secondaryPayerPhone"
                value={formData.secondaryPayerPhone}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
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
              <DocumentUpload
                label="Patient Identification"
                required
                onFileSelect={(file) => handleFileSelect('identification', file)}
                onFileRemove={() => handleFileRemove('identification')}
                selectedFile={documentFiles.identification.file}
                previewUrl={documentFiles.identification.previewUrl || undefined}
              />
              
              <DocumentUpload
                label="Face Sheet"
                required
                onFileSelect={(file) => handleFileSelect('faceSheet', file)}
                onFileRemove={() => handleFileRemove('faceSheet')}
                selectedFile={documentFiles.faceSheet.file}
                previewUrl={documentFiles.faceSheet.previewUrl || undefined}
              />
            </div>
            
            <div className="space-y-6">
              <DocumentUpload
                label="Insurance Card Front"
                required
                onFileSelect={(file) => handleFileSelect('insuranceFront', file)}
                onFileRemove={() => handleFileRemove('insuranceFront')}
                selectedFile={documentFiles.insuranceFront.file}
                previewUrl={documentFiles.insuranceFront.previewUrl || undefined}
              />
              
              <DocumentUpload
                label="Insurance Card Back"
                required
                onFileSelect={(file) => handleFileSelect('insuranceBack', file)}
                onFileRemove={() => handleFileRemove('insuranceBack')}
                selectedFile={documentFiles.insuranceBack.file}
                previewUrl={documentFiles.insuranceBack.previewUrl || undefined}
              />
            </div>
          </div>
          
          {documentFiles.additionalDocs.length > 0 && (
            <div className="mt-8">
              <h3 className="text-sm font-medium text-gray-900 mb-4">Additional Documents</h3>
              <div className="space-y-4">
                {documentFiles.additionalDocs.map((doc, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center space-x-4">
                      <input
                        type="text"
                        placeholder="Document Name"
                        value={doc.name || ''}
                        onChange={(e) => {
                          const newDocs = [...documentFiles.additionalDocs];
                          newDocs[index] = { ...newDocs[index], name: e.target.value };
                          setDocumentFiles(prev => ({
                            ...prev,
                            additionalDocs: newDocs
                          }));
                        }}
                        className="block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => handleFileRemove('additionalDocs', index)}
                        className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        Remove
                      </button>
                    </div>
                    <DocumentUpload
                      label={doc.name || `Additional Document ${index + 1}`}
                      onFileSelect={(file) => handleFileSelect('additionalDocs', file)}
                      onFileRemove={() => handleFileRemove('additionalDocs', index)}
                      selectedFile={doc.file}
                      previewUrl={doc.previewUrl || undefined}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {documentFiles.additionalDocs.length < 5 && (
            <button
              type="button"
              onClick={() => handleFileSelect('additionalDocs', new File([], 'placeholder'))}
              className="mt-4 inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Add Additional Document
            </button>
          )}
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
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {isSubmitting ? 'Saving...' : 'Save Patient'}
        </button>
      </div>
    </form>
  );
};

export default PatientIntakeForm; 